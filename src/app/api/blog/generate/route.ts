import { NextRequest, NextResponse } from 'next/server'
import { generateAndPublishArticle, regenerateArticleBySlug } from '@/lib/blog/generator'

// Manual trigger for article generation (for testing)
export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const isDev = process.env.NODE_ENV === 'development'

  // In production, CRON_SECRET is required
  if (!isDev) {
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // Check if this is a regeneration request
    const body = await request.json().catch(() => ({}))
    const slugs: string[] | undefined = body.slugs || (body.slug ? [body.slug] : undefined)

    if (slugs && slugs.length > 0) {
      // Regenerate specific posts by slug
      const results = []
      for (const slug of slugs) {
        const result = await regenerateArticleBySlug(slug)
        results.push({ slug, ...result })
      }

      const allSuccess = results.every(r => r.success)
      return NextResponse.json({
        success: allSuccess,
        results,
      }, { status: allSuccess ? 200 : 207 })
    }

    // Default: generate new article from queue
    const result = await generateAndPublishArticle()

    if (!result.success) {
      console.error('Manual article generation failed:', result.error)
      return NextResponse.json(
        {
          success: false,
          error: 'Article generation failed',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.postId
        ? `Article published: ${result.postId}`
        : 'No pending topics',
      postId: result.postId,
    })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process generation request',
    }, { status: 500 })
  }
}
