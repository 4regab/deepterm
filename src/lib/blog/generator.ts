import { GoogleGenAI } from '@google/genai'
import { BLOG_ARTICLE_SYSTEM_PROMPT, BLOG_ARTICLE_USER_PROMPT } from './prompts'
import { getServiceClient, generateSlug, calculateReadTime, fetchUnsplashImage } from './service'

// Get all available Gemini API keys
function getGeminiApiKeys(): string[] {
  const keys: string[] = []

  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY)
  if (process.env.GEMINI_API_KEY_1) keys.push(process.env.GEMINI_API_KEY_1)
  if (process.env.GEMINI_API_KEY_2) keys.push(process.env.GEMINI_API_KEY_2)
  if (process.env.GEMINI_API_KEY_3) keys.push(process.env.GEMINI_API_KEY_3)
  if (process.env.GEMINI_API_KEY_4) keys.push(process.env.GEMINI_API_KEY_4)
  if (process.env.GEMINI_API_KEY_5) keys.push(process.env.GEMINI_API_KEY_5)

  // Filter out placeholder values
  return keys.filter(k => k && !k.includes('your_'))
}

// Lazy initialization of Gemini client with key rotation
function getGeminiClient(keyIndex = 0) {
  const keys = getGeminiApiKeys()

  if (keys.length === 0) {
    throw new Error('No GEMINI_API_KEY found in environment variables')
  }

  const apiKey = keys[keyIndex % keys.length]
  return new GoogleGenAI({ apiKey })
}

interface GeneratedArticle {
  title: string
  metaDescription: string
  excerpt: string
  content: string
  keywords: string[]
}

interface TopicFromQueue {
  id: string
  topic: string
  target_keywords: string[] | null
  target_audience: string | null
  category_id: string | null
  category_slug: string | null
}

// Generate article content using Gemini with Google Search grounding
async function generateArticleContent(
  topic: string,
  keywords: string[],
  targetAudience: string,
  categoryName: string
): Promise<GeneratedArticle> {
  const keys = getGeminiApiKeys()
  let lastError: Error | null = null

  // Try each key
  for (let i = 0; i < keys.length; i++) {
    try {
      const genAI = getGeminiClient(i)

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: BLOG_ARTICLE_USER_PROMPT(topic, keywords, targetAudience, categoryName),
        config: {
          systemInstruction: BLOG_ARTICLE_SYSTEM_PROMPT,
          temperature: 0.7,
          maxOutputTokens: 65536,
          // Enable Google Search grounding for up-to-date, factual content
          tools: [{ googleSearch: {} }],
        },
      })

      if (!response.text) {
        throw new Error('No response from Gemini')
      }

      // Check if the response was truncated due to token limit
      const finishReason = response.candidates?.[0]?.finishReason
      if (finishReason === 'MAX_TOKENS') {
        console.warn(`Response truncated for topic "${topic}" - finish reason: MAX_TOKENS`)
      }

      // Log grounding metadata for debugging
      const metadata = response.candidates?.[0]?.groundingMetadata
      if (metadata?.webSearchQueries) {
        console.log('Google Search queries used:', metadata.webSearchQueries)
        const sources = metadata.groundingChunks?.map(chunk => chunk.web?.title).filter(Boolean) || []
        if (sources.length > 0) {
          console.log('Sources used:', sources.slice(0, 5))
        }
      }

      // Parse JSON response
      const text = response.text

      // Robust JSON extraction - handles code blocks, grounding annotations, and mixed text
      let parsed: GeneratedArticle | null = null
      let parseStrategy = 'none'

      // Strategy 1: Extract from markdown code blocks (use GREEDY match to get the full block)
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*)```/)
      if (codeBlockMatch) {
        try {
          parsed = JSON.parse(codeBlockMatch[1].trim()) as GeneratedArticle
          parseStrategy = 'code-block'
        } catch { /* try next strategy */ }
      }

      // Strategy 2: Find the outermost JSON object by balanced brace matching
      if (!parsed) {
        const firstBrace = text.indexOf('{')
        if (firstBrace !== -1) {
          let depth = 0
          let inString = false
          let escape = false
          let lastBrace = -1

          for (let j = firstBrace; j < text.length; j++) {
            const ch = text[j]
            if (escape) { escape = false; continue }
            if (ch === '\\' && inString) { escape = true; continue }
            if (ch === '"' && !escape) { inString = !inString; continue }
            if (inString) continue
            if (ch === '{') depth++
            if (ch === '}') { depth--; if (depth === 0) { lastBrace = j; break } }
          }

          if (lastBrace > firstBrace) {
            try {
              parsed = JSON.parse(text.substring(firstBrace, lastBrace + 1)) as GeneratedArticle
              parseStrategy = 'balanced-braces'
            } catch { /* try next strategy */ }
          }
        }
      }

      // Strategy 3: Extract fields individually using regex
      if (!parsed) {
        // Use a more robust approach: find "content": " and then scan for the closing "
        const extractField = (field: string): string | null => {
          const fieldStart = text.indexOf(`"${field}"`)
          if (fieldStart === -1) return null

          // Find the opening quote after the colon
          const colonPos = text.indexOf(':', fieldStart + field.length + 2)
          if (colonPos === -1) return null

          const quoteStart = text.indexOf('"', colonPos)
          if (quoteStart === -1) return null

          // Scan for the closing quote (respecting escape sequences)
          let i = quoteStart + 1
          let result = ''
          while (i < text.length) {
            if (text[i] === '\\' && i + 1 < text.length) {
              result += text[i] + text[i + 1]
              i += 2
            } else if (text[i] === '"') {
              break
            } else {
              result += text[i]
              i++
            }
          }

          return result.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t')
        }

        const extractedContent = extractField('content')

        if (extractedContent) {
          parseStrategy = 'field-extraction'
          parsed = {
            title: extractField('title') || topic,
            metaDescription: extractField('metaDescription') || `Learn about ${topic} with research-backed insights and practical tips.`,
            excerpt: extractField('excerpt') || `Discover everything you need to know about ${topic}.`,
            content: extractedContent,
            keywords: keywords,
          }
        }
      }

      // Final fallback: use entire response as content
      if (!parsed) {
        console.error('All JSON parsing strategies failed, using raw content')
        parseStrategy = 'raw-fallback'
        parsed = {
          title: topic,
          metaDescription: `Learn about ${topic} with research-backed insights and practical tips.`,
          excerpt: `Discover everything you need to know about ${topic}.`,
          content: text,
          keywords: keywords,
        }
      }

      if (parseStrategy !== 'code-block') {
        console.warn(`JSON parse used fallback strategy: ${parseStrategy}, content length: ${parsed.content.length}`)
      }

      return parsed
    } catch (error) {
      lastError = error as Error
      console.error(`Gemini key ${i + 1} failed:`, error)

      // If rate limited, try next key
      if (error instanceof Error && error.message.includes('429')) {
        continue
      }

      // For other errors, throw immediately
      throw error
    }
  }

  throw lastError || new Error('All Gemini API keys exhausted')
}

// Main function to generate and publish an article
export async function generateAndPublishArticle(): Promise<{
  success: boolean
  postId?: string
  error?: string
}> {
  const supabase = getServiceClient()

  try {
    // 1. Get next topic from queue
    const { data: topicData, error: topicError } = await supabase.rpc('get_next_topic_for_generation')

    if (topicError) {
      throw new Error(`Failed to get topic: ${topicError.message}`)
    }

    if (!topicData || topicData.length === 0) {
      return { success: true, error: 'No pending topics in queue' }
    }

    const topic = topicData[0] as TopicFromQueue

    // 2. Get category name
    let categoryName = 'General'
    if (topic.category_id) {
      const { data: catData } = await supabase
        .from('blog_categories')
        .select('name')
        .eq('id', topic.category_id)
        .single()

      if (catData) {
        categoryName = catData.name
      }
    }

    // 3. Generate article content
    const article = await generateArticleContent(
      topic.topic,
      topic.target_keywords || [],
      topic.target_audience || 'college students and lifelong learners',
      categoryName
    )

    // 4. Generate slug
    const slug = generateSlug(article.title)

    // 5. Check if slug already exists
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingPost) {
      // Update topic status to failed
      await supabase
        .from('blog_topics_queue')
        .update({
          status: 'failed',
          error_message: 'Slug already exists',
          processed_at: new Date().toISOString(),
        })
        .eq('id', topic.id)

      return { success: false, error: 'Article with this slug already exists' }
    }

    // 6. Fetch image from Unsplash (optional)
    const imageQuery = topic.target_keywords?.[0] || topic.topic.split(' ').slice(0, 3).join(' ')
    const ogImageUrl = await fetchUnsplashImage(`${imageQuery} study education`)

    // 7. Calculate read time
    const readTime = calculateReadTime(article.content)

    // 8. Insert blog post
    const { data: newPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        slug,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        meta_description: article.metaDescription.substring(0, 160),
        category_id: topic.category_id,
        og_image_url: ogImageUrl,
        keywords: article.keywords,
        status: 'published',
        published_at: new Date().toISOString(),
        read_time_minutes: readTime,
      })
      .select('id')
      .single()

    if (insertError) {
      throw new Error(`Failed to insert post: ${insertError.message}`)
    }

    // 9. Update topic queue status
    await supabase
      .from('blog_topics_queue')
      .update({
        status: 'published',
        generated_post_id: newPost.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', topic.id)

    return { success: true, postId: newPost.id }

  } catch (error) {
    console.error('Article generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Regenerate an existing article by slug (fixes truncated content)
export async function regenerateArticleBySlug(slug: string): Promise<{
  success: boolean
  postId?: string
  error?: string
}> {
  const supabase = getServiceClient()

  try {
    // 1. Fetch the existing post
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, keywords, category_id')
      .eq('slug', slug)
      .single()

    if (fetchError || !post) {
      return { success: false, error: `Post not found: ${slug}` }
    }

    // 2. Get category name
    let categoryName = 'General'
    if (post.category_id) {
      const { data: catData } = await supabase
        .from('blog_categories')
        .select('name')
        .eq('id', post.category_id)
        .single()

      if (catData) {
        categoryName = catData.name
      }
    }

    // 3. Regenerate article content
    const article = await generateArticleContent(
      post.title,
      post.keywords || [],
      'college students and lifelong learners',
      categoryName
    )

    // 4. Calculate new read time
    const readTime = calculateReadTime(article.content)

    // 5. Update the existing post with regenerated content
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: article.content,
        excerpt: article.excerpt,
        meta_description: article.metaDescription.substring(0, 160),
        keywords: article.keywords,
        read_time_minutes: readTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id)

    if (updateError) {
      throw new Error(`Failed to update post: ${updateError.message}`)
    }

    console.log(`Successfully regenerated article: ${slug} (${article.content.length} chars)`)
    return { success: true, postId: post.id }

  } catch (error) {
    console.error(`Regeneration error for ${slug}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
