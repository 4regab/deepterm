/**
 * Single allowlist for Origin/Host checks (CORS, CSRF, OAuth redirects).
 * Production domain is deepterm.app only.
 */
export const CANONICAL_ORIGIN = 'https://deepterm.app'

export const TRUSTED_ORIGINS = [
  CANONICAL_ORIGIN,
  'https://www.deepterm.app',
] as const

export const TRUSTED_PRODUCTION_ORIGINS = TRUSTED_ORIGINS
export const PRIMARY_ORIGIN = CANONICAL_ORIGIN

export function isLocalDevOrigin(origin: string): boolean {
  return (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  )
}

export function isTrustedOrigin(
  origin: string | null | undefined,
  isDev = process.env.NODE_ENV === 'development',
): boolean {
  if (!origin) return false
  if ((TRUSTED_ORIGINS as readonly string[]).includes(origin)) return true
  if (isDev && isLocalDevOrigin(origin)) {
    return true
  }
  return false
}

/** Never reflect the request Host header for redirects. */
export function getTrustedOrigin(
  requestOriginOrUrl: string | URL,
  isDev = process.env.NODE_ENV === 'development',
): string {
  const origin =
    typeof requestOriginOrUrl === 'string'
      ? requestOriginOrUrl
      : requestOriginOrUrl.origin
  if (isTrustedOrigin(origin, isDev)) {
    return origin
  }
  return CANONICAL_ORIGIN
}
