import { createServerSupabaseClient } from '@/config/supabase/server'
import { getRequestOrigin } from '@/lib/requestOrigin'
import { NextResponse } from 'next/server'

// Trusted origins — prevents host header injection (CWE-644)
const TRUSTED_ORIGINS = [
  'https://deepterm.tech',
  'https://www.deepterm.tech',
  'https://deepterm.app',
  'https://www.deepterm.app',
  'https://deepterm.vercel.app',
]

/**
 * Returns a trusted origin, falling back to the primary domain.
 * Uses forwarded headers so nginx/EC2 public origin is preserved,
 * then allowlists it to prevent host header injection.
 */
function getTrustedOrigin(request: Request): string {
  const requestOrigin = getRequestOrigin(request)

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development' && requestOrigin.startsWith('http://localhost')) {
    return requestOrigin
  }

  if (TRUSTED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin
  }

  // Fallback to primary domain — never trust an unknown Host header
  return TRUSTED_ORIGINS[0]
}

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
  const origin = getTrustedOrigin(request)

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback: session exchange failed', error.message)
      return NextResponse.redirect(`${origin}/`)
    }
  }

  const redirectPath = sanitizeRedirectPath(returnTo)
  return NextResponse.redirect(`${origin}${redirectPath}`)
}
