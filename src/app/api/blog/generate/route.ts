import { NextRequest, NextResponse } from 'next/server'
import { generateAndPublishArticle } from '@/lib/blog/generator'

// Manual trigger for article generation (for testing)
export const runtime = 'nodejs'
export const maxDuration = 60

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
    const result = await generateAndPublishArticle()

    return NextResponse.json({
      success: result.success,
      message: result.postId 
        ? `Article published: ${result.postId}`
        : result.error || 'No pending topics',
      postId: result.postId,
    })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
