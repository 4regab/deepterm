import { createHash } from 'node:crypto'

/**
 * Produce a stable, non-reversible identifier hash for rate limiting and
 * audit logging. Bound to the hosting domain via a secret pepper so that
 * the resulting hashes are useless if leaked (cannot be correlated back
 * to raw IPs without the secret).
 *
 * The pepper falls back to a stable-but-useless placeholder in dev so the
 * code never throws; production is expected to set `REQUEST_HASH_PEPPER`.
 */
type HeaderSource = Pick<Headers, 'get'>

const PEPPER =
  process.env.REQUEST_HASH_PEPPER ||
  process.env.CRON_SECRET || // reuse an existing server-only secret as a fallback
  'deepterm-dev-pepper-change-in-prod'

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
 * Deterministic within a single server process; irreversible.
 */
export function hashRequestIdentity(headers: HeaderSource): string {
  const ip = extractClientIp(headers)
  const ua = extractUserAgent(headers)
  return createHash('sha256')
    .update(`${PEPPER}\u0001${ip}\u0001${ua}`)
    .digest('hex')
}

/**
 * Returns a hex hash of just the IP (or other caller-supplied value),
 * peppered. Used when we want to rate-limit by IP only.
 */
export function hashValue(value: string): string {
  return createHash('sha256').update(`${PEPPER}\u0001${value}`).digest('hex')
}
