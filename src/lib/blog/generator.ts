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
          maxOutputTokens: 8192,
          // Enable Google Search grounding for up-to-date, factual content
          tools: [{ googleSearch: {} }],
        },
      })

      if (!response.text) {
        throw new Error('No response from Gemini')
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
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = text
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      }

      try {
        const parsed = JSON.parse(jsonStr) as GeneratedArticle
        return parsed
      } catch {
        // If JSON parsing fails, use the raw content
        console.error('Failed to parse JSON, using raw content')
        
        return {
          title: topic,
          metaDescription: `Learn about ${topic} with research-backed insights and practical tips.`,
          excerpt: `Discover everything you need to know about ${topic}.`,
          content: text,
          keywords: keywords,
        }
      }
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
