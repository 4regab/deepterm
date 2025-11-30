import { createServerSupabaseClient } from '@/config/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const returnTo = requestUrl.searchParams.get('returnTo')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to returnTo if provided, otherwise dashboard
  const redirectPath = returnTo ? decodeURIComponent(returnTo) : '/dashboard'
  return NextResponse.redirect(`${origin}${redirectPath}`)
}
