import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const userAgent = request.headers.get('user-agent')
  const cronSecret = process.env.CRON_SECRET
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction && !cronSecret) {
    console.error('CRON_SECRET not configured in production')
    return false
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return false
  }

  if (isProduction && userAgent !== 'vercel-cron/1') {
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
      { status: 401 },
    )
  }

  try {
    console.log('Notification cron triggered at', new Date().toISOString())

    // Stub: in production, query Supabase for users with pending notifications
    // based on their preferences and scheduled reminders, then dispatch emails
    // via the /api/notifications/dispatch endpoint.
    const checked = 0
    const sent = 0

    return NextResponse.json({
      success: true,
      message: 'Notification cron completed',
      checked,
      sent,
    })
  } catch (error) {
    console.error('Notification cron error:', error)
    return NextResponse.json(
      { success: false, error: 'Notification cron failed' },
      { status: 500 },
    )
  }
}
