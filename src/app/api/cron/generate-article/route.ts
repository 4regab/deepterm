import { NextRequest, NextResponse } from 'next/server'
import { generateAndPublishArticle } from '@/lib/blog/generator'

// Scheduled article generation endpoint
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for gemini-2.5-flash with search grounding

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
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
      console.error('Cron article generation failed:', result.error)
      return NextResponse.json({
        success: false,
        error: 'Article generation failed',
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({
      success: false,
      error: 'Cron execution failed',
    }, { status: 500 })
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
