/**
 * Single allowlist for Origin/Host checks (CORS, CSRF, OAuth redirects).
 * Production canonical host is deepterm.tech; .app and vercel.app are legacy.
 */
export const CANONICAL_ORIGIN = 'https://deepterm.tech'

export const TRUSTED_ORIGINS = [
  CANONICAL_ORIGIN,
  'https://www.deepterm.tech',
  'https://deepterm.app',
  'https://www.deepterm.app',
  'https://deepterm.vercel.app',
] as const

export function isLocalDevOrigin(origin: string): boolean {
  return (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  )
}

export function isTrustedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false
  if ((TRUSTED_ORIGINS as readonly string[]).includes(origin)) return true
  if (process.env.NODE_ENV === 'development' && isLocalDevOrigin(origin)) {
    return true
  }
  return false
}

/** Never reflect the request Host header for redirects. */
export function getTrustedOrigin(requestUrl: URL): string {
  if (isTrustedOrigin(requestUrl.origin)) {
    return requestUrl.origin
  }
  return CANONICAL_ORIGIN
}
