import { NextRequest, NextResponse } from 'next/server'
import { generateAndPublishArticle } from '@/lib/blog/generator'

// Vercel Cron configuration
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds max for article generation

// Verify request is from Vercel Cron
function isAuthorizedCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const userAgent = request.headers.get('user-agent')
  const cronSecret = process.env.CRON_SECRET
  const isProduction = process.env.NODE_ENV === 'production'

  // In production, CRON_SECRET is required
  if (isProduction && !cronSecret) {
    console.error('CRON_SECRET not configured in production')
    return false
  }

  // Verify the Authorization header matches Bearer <CRON_SECRET>
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return false
  }

  // In production, also verify Vercel's user-agent (extra security layer)
  if (isProduction && userAgent !== 'vercel-cron/1') {
    // Allow if auth header is correct (for manual triggers with secret)
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return false
    }
  }

  return true
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const result = await generateAndPublishArticle()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.postId 
          ? `Article published successfully: ${result.postId}`
          : result.error || 'No articles to generate',
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
