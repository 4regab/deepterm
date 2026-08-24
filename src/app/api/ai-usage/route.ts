import { NextResponse } from 'next/server'
import { getRemainingAIGenerations } from '@/services/rateLimit'
import { forbiddenUnlessSameOrigin } from '@/lib/auth/assertSameOrigin'

export async function GET(request: Request) {
  const csrf = forbiddenUnlessSameOrigin(request)
  if (csrf) return csrf

  const usage = await getRemainingAIGenerations()
  if (!usage.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (usage.unavailable) {
    return NextResponse.json({ error: 'Usage service unavailable' }, { status: 503 })
  }

  return NextResponse.json({
    remaining: usage.remaining,
    resetAt: usage.resetAt.toISOString(),
  })
}
