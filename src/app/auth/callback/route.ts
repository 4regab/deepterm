import { createServerSupabaseClient } from '@/config/supabase/server'
import { NextResponse } from 'next/server'
import { getTrustedOrigin } from '@/lib/auth/trustedOrigins'
import { resolveAuthCallbackPath } from '@/lib/auth/redirect'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const returnTo = requestUrl.searchParams.get('returnTo')
  const origin = getTrustedOrigin(requestUrl.origin, process.env.NODE_ENV === 'development')

  if (!code) {
    return NextResponse.redirect(`${origin}${resolveAuthCallbackPath({ hasCode: false })}`)
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback: session exchange failed', error.message)
    return NextResponse.redirect(`${origin}${resolveAuthCallbackPath({ hasCode: true, exchangeFailed: true })}`)
  }

  const redirectPath = resolveAuthCallbackPath({ hasCode: true, returnTo })
  return NextResponse.redirect(`${origin}${redirectPath}`)
}
