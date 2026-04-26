import { createServerSupabaseClient } from '@/config/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Validates that a redirect path is safe (relative, no open redirect).
 * Returns the sanitized path or '/dashboard' if invalid.
 */
function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/dashboard'

  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return '/dashboard'
  }

  // Must start with exactly one slash (reject protocol-relative "//evil.com")
  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return '/dashboard'
  }

  // Block embedded protocol schemes (e.g. "/\x00javascript:", "/%0ahttp:")
  if (/[a-z]+:/i.test(decoded.replace(/^\//, ''))) {
    return '/dashboard'
  }

  return decoded
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const returnTo = requestUrl.searchParams.get('returnTo')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const redirectPath = sanitizeRedirectPath(returnTo)
  return NextResponse.redirect(`${origin}${redirectPath}`)
}
