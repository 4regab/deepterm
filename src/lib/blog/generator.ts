import { GoogleGenAI } from '@google/genai'
import { BLOG_ARTICLE_SYSTEM_PROMPT, BLOG_ARTICLE_USER_PROMPT } from './prompts'
import { getServiceClient, generateSlug, calculateReadTime, fetchUnsplashImage } from './service'

const MIN_CONTENT_WORDS = 900
const GENERATION_ATTEMPTS_PER_KEY = 2
const DISALLOWED_HTML_PATTERN = /<\s*\/?\s*(script|iframe|object|embed|form|style|link|meta|base|svg|math)\b/gi

export class RetryableGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RetryableGenerationError'
  }
}

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

function countWords(text: string): number {
  return text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .length
}

function cleanKeywords(keywords: string[]): string[] {
  return keywords
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 7)
}

function neutralizeBlockedHtml(content: string): string {
  return content.replace(DISALLOWED_HTML_PATTERN, (match) => `&lt;${match.slice(1)}`)
}

function extractCompleteJsonObjects(text: string): string[] {
  const objects: string[] = []
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') {
      if (depth === 0) {
        start = i
      }
      depth++
      continue
    }

    if (ch === '}' && depth > 0) {
      depth--
      if (depth === 0 && start >= 0) {
        objects.push(text.slice(start, i + 1))
        start = -1
      }
    }
  }

  return objects
}

function isRetryableModelError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('503') ||
    message.includes('500') ||
    message.includes('api_key_invalid') ||
    message.includes('api key expired') ||
    message.includes('api key not valid')
  )
}

function getTextField(payload: Record<string, unknown>, field: string): string | null {
  const value = payload[field]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function parseGeneratedArticleResponse(
  responseText: string,
  topic: string,
  fallbackKeywords: string[]
): GeneratedArticle {
  const normalized = responseText.trim()

  // Prefer fenced JSON blocks first, then fall back to the entire response body.
  const candidateBodies: string[] = []
  const fencedBlocks = normalized.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi)
  for (const block of fencedBlocks) {
    if (block[1]?.trim()) {
      candidateBodies.push(block[1].trim())
    }
  }
  candidateBodies.push(normalized)

  let sawJsonObject = false
  let sawArticleLikePayload = false
  let maxShortWordCount = 0

  for (const body of candidateBodies) {
    const jsonObjects = extractCompleteJsonObjects(body)
    if (jsonObjects.length === 0) {
      continue
    }

    for (const rawJson of jsonObjects) {
      let parsedPayload: unknown
      try {
        parsedPayload = JSON.parse(rawJson)
      } catch {
        continue
      }

      sawJsonObject = true
      if (!parsedPayload || typeof parsedPayload !== 'object' || Array.isArray(parsedPayload)) {
        continue
      }

      const payload = parsedPayload as Record<string, unknown>
      const content = getTextField(payload, 'content')
      if (!content) {
        continue
      }
      const safeContent = neutralizeBlockedHtml(content)

      sawArticleLikePayload = true
      const wordCount = countWords(safeContent)
      if (wordCount < MIN_CONTENT_WORDS) {
        maxShortWordCount = Math.max(maxShortWordCount, wordCount)
        continue
      }

      const normalizedKeywords = Array.isArray(payload.keywords)
        ? cleanKeywords(payload.keywords.filter((keyword): keyword is string => typeof keyword === 'string'))
        : []

      const cleanedFallbackKeywords = cleanKeywords(fallbackKeywords)

      return {
        title: getTextField(payload, 'title') || topic,
        metaDescription:
          getTextField(payload, 'metaDescription') ||
          `Learn about ${topic} with research-backed insights and practical tips.`,
        excerpt: getTextField(payload, 'excerpt') || `Discover everything you need to know about ${topic}.`,
        content: safeContent,
        keywords: normalizedKeywords.length > 0 ? normalizedKeywords : cleanedFallbackKeywords,
      }
    }
  }

  if (sawArticleLikePayload) {
    throw new RetryableGenerationError(
      `Generated content was too short (max ${maxShortWordCount} words, expected at least ${MIN_CONTENT_WORDS})`
    )
  }

  if (sawJsonObject) {
    throw new RetryableGenerationError('Gemini returned JSON but missing required article fields')
  }

  throw new RetryableGenerationError('Gemini returned malformed JSON')
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

  const maxAttempts = Math.max(keys.length * GENERATION_ATTEMPTS_PER_KEY, 3)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const keyIndex = attempt % keys.length

    try {
      const genAI = getGeminiClient(keyIndex)

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
        throw new RetryableGenerationError('No response text from Gemini')
      }

      const finishReason = response.candidates?.[0]?.finishReason
      if (finishReason === 'MAX_TOKENS') {
        throw new RetryableGenerationError(`Gemini output was truncated for topic "${topic}"`)
      }
      if (finishReason && finishReason !== 'STOP' && finishReason !== 'FINISH_REASON_UNSPECIFIED') {
        throw new RetryableGenerationError(`Gemini finished unexpectedly with reason: ${finishReason}`)
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

      return parseGeneratedArticleResponse(response.text, topic, keywords)
    } catch (error) {
      lastError = error as Error
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(
        `Gemini attempt ${attempt + 1}/${maxAttempts} failed (key index ${keyIndex + 1}): ${errorMessage}`
      )

      const retryable =
        error instanceof RetryableGenerationError ||
        (error instanceof Error && isRetryableModelError(error))

      if (retryable && attempt < maxAttempts - 1) {
        continue
      }

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
  let topic: TopicFromQueue | null = null

  try {
    // 1. Get next topic from queue
    const { data: topicData, error: topicError } = await supabase.rpc('get_next_topic_for_generation')

    if (topicError) {
      throw new Error(`Failed to get topic: ${topicError.message}`)
    }

    if (!topicData || topicData.length === 0) {
      return { success: true, error: 'No pending topics in queue' }
    }

    topic = topicData[0] as TopicFromQueue

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
    if (topic?.id) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const { error: updateError } = await supabase
        .from('blog_topics_queue')
        .update({
          status: 'failed',
          error_message: errorMessage,
          processed_at: new Date().toISOString(),
        })
        .eq('id', topic.id)

      if (updateError) {
        console.error(`Failed to mark topic ${topic.id} as failed:`, updateError)
      }
    }

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
