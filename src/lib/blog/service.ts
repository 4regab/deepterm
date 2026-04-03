import { createClient } from '@supabase/supabase-js'

// Service role client for cron jobs (bypasses RLS)
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Generate URL-friendly slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100)
}

// Calculate read time from content
export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

// Fetch image from Unsplash API
export async function fetchUnsplashImage(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  
  if (!accessKey) {
    console.log('No Unsplash API key, skipping image fetch')
    return null
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Unsplash API error:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      // Use regular size for OG images
      return data.results[0].urls.regular
    }

    return null
  } catch (error) {
    console.error('Error fetching Unsplash image:', error)
    return null
  }
}
