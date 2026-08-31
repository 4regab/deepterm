type ShareRateLimitBucket = 'lookup' | 'copy'

interface RateLimitBucketConfig {
  maxRequests: number
  windowMs: number
}

export interface ShareRateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/** Minimal client surface so callers can pass browser or server Supabase clients. */
export type ShareRateLimitRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>
}

const RATE_LIMITS: Record<ShareRateLimitBucket, RateLimitBucketConfig> = {
  lookup: { maxRequests: 60, windowMs: 60_000 },
  copy: { maxRequests: 20, windowMs: 60_000 },
}

type RateLimitRow = {
  allowed: boolean
  remaining: integerLike
  retry_after_seconds: integerLike
}

type integerLike = number | string | null | undefined

function asInt(value: integerLike, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function parseRateLimitRows(data: unknown): RateLimitRow | null {
  if (Array.isArray(data) && data.length > 0) {
    return data[0] as RateLimitRow
  }
  if (data && typeof data === 'object' && 'allowed' in data) {
    return data as RateLimitRow
  }
  return null
}

/**
 * Durable share rate limit via SECURITY DEFINER RPC `consume_share_rate_limit`.
 * Fail closed on RPC errors so serverless isolates cannot bypass throttling.
 */
export async function consumeShareRateLimit(
  supabase: ShareRateLimitRpcClient,
  bucketName: ShareRateLimitBucket,
  identifierHash: string,
): Promise<ShareRateLimitResult> {
  const config = RATE_LIMITS[bucketName]
  const windowSeconds = Math.ceil(config.windowMs / 1000)

  if (!identifierHash || identifierHash.length < 8) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: windowSeconds,
    }
  }

  const { data, error } = await supabase.rpc('consume_share_rate_limit', {
    p_bucket: bucketName,
    p_identifier_hash: identifierHash,
    p_max: config.maxRequests,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error('consume_share_rate_limit failed:', error.message ?? error)
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: windowSeconds,
    }
  }

  const row = parseRateLimitRows(data)
  if (!row) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: windowSeconds,
    }
  }

  return {
    allowed: Boolean(row.allowed),
    remaining: Math.max(0, asInt(row.remaining, 0)),
    retryAfterSeconds: Math.max(1, asInt(row.retry_after_seconds, windowSeconds)),
  }
}
