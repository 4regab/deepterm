/**
 * Validates that a redirect path is safe (relative, no open redirect).
 * Returns the sanitized path or '/dashboard' if invalid.
 */
export function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/dashboard'

  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return '/dashboard'
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return '/dashboard'
  }

  if (/[a-z]+:/i.test(decoded.replace(/^\//, ''))) {
    return '/dashboard'
  }

  return decoded
}

/**
 * Without a successful OAuth code exchange, never honor returnTo.
 * Unauthenticated visitors should land on home rather than a protected route.
 */
export function resolveAuthCallbackPath(options: {
  hasCode: boolean
  exchangeFailed?: boolean
  returnTo?: string | null
}): string {
  if (!options.hasCode || options.exchangeFailed) {
    return '/'
  }
  return sanitizeRedirectPath(options.returnTo ?? null)
}
