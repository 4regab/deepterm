import { createHash } from 'node:crypto'

/**
 * Produce a stable, non-reversible identifier hash for rate limiting and
 * audit logging. Bound to the hosting domain via a secret pepper so that
 * the resulting hashes are useless if leaked (cannot be correlated back
 * to raw IPs without the secret).
 *
 * Production requires an independent REQUEST_HASH_PEPPER (never reused from
 * CRON_SECRET). Development may use an explicit env value or a local-only
 * placeholder so unit tests and `next dev` keep working.
 */
type HeaderSource = Pick<Headers, 'get'>

export function resolveRequestHashPepper(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const pepper = env.REQUEST_HASH_PEPPER?.trim()
  if (pepper && pepper.length >= 16) {
    return pepper
  }

  const production =
    env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production'
  if (production) {
    throw new Error(
      'REQUEST_HASH_PEPPER must be set to an independent secret (≥16 chars)',
    )
  }

  return pepper && pepper.length > 0
    ? pepper
    : 'deepterm-dev-pepper-change-in-prod'
}

function getPepper(): string {
  return resolveRequestHashPepper()
}

export function extractClientIp(headers: HeaderSource): string {
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = headers.get('x-real-ip')?.trim()
  const cfConnecting = headers.get('cf-connecting-ip')?.trim()
  return forwardedFor || realIp || cfConnecting || 'unknown-ip'
}

export function extractUserAgent(headers: HeaderSource): string {
  return (headers.get('user-agent') ?? 'unknown-agent').slice(0, 200)
}

/**
 * Returns a SHA-256 hex hash of (pepper + IP + user-agent prefix).
 * Deterministic within a single deployment; irreversible without the pepper.
 */
export function hashRequestIdentity(headers: HeaderSource): string {
  const ip = extractClientIp(headers)
  const ua = extractUserAgent(headers)
  return createHash('sha256')
    .update(`${getPepper()}\u0001${ip}\u0001${ua}`)
    .digest('hex')
}

/**
 * Returns a hex hash of just the IP (or other caller-supplied value),
 * peppered. Used when we want to rate-limit by IP only.
 */
export function hashValue(value: string): string {
  return createHash('sha256').update(`${getPepper()}\u0001${value}`).digest('hex')
}
