/**
 * Validates that a redirect path is safe (relative, no open redirect).
 * Returns the sanitized path or '/dashboard' if invalid.
 *
 * Rejects protocol-relative URLs, scheme handlers, backslash host tricks
 * (`/\evil.com`, `/%5Cevil.com`), and paths outside the app allowlist.
 */

const ALLOWED_REDIRECT_PREFIXES = [
  '/dashboard',
  '/materials',
  '/pomodoro',
  '/practice',
  '/reviewer',
  '/account',
  '/achievements',
  '/share',
  '/blog',
] as const

const SAFE_PATH_RE = /^\/[a-zA-Z0-9/_-]*$/

function isAllowedAppPath(path: string): boolean {
  return ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

export function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/dashboard'

  // Reject encoded backslash before decoding so %5C cannot slip through.
  if (/%5c/i.test(raw) || raw.includes('\\')) {
    return '/dashboard'
  }

  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return '/dashboard'
  }

  if (decoded.includes('\\') || decoded.includes('\0')) {
    return '/dashboard'
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return '/dashboard'
  }

  if (/[a-z]+:/i.test(decoded.replace(/^\//, ''))) {
    return '/dashboard'
  }

  const pathOnly = decoded.split(/[?#]/, 1)[0] ?? decoded
  if (!SAFE_PATH_RE.test(pathOnly) || !isAllowedAppPath(pathOnly)) {
    return '/dashboard'
  }

  return pathOnly
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
