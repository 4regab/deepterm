type HeaderSource = Pick<Headers, 'get'>

type ShareRateLimitBucket = 'lookup' | 'copy'

interface RateLimitBucketConfig {
  maxRequests: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface ShareRateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

interface ShareRateLimitStore {
  lookup: Map<string, RateLimitEntry>
  copy: Map<string, RateLimitEntry>
}

const RATE_LIMITS: Record<ShareRateLimitBucket, RateLimitBucketConfig> = {
  lookup: { maxRequests: 60, windowMs: 60_000 },
  copy: { maxRequests: 20, windowMs: 60_000 },
}

declare global {
  var __deeptermShareRateLimitStore: ShareRateLimitStore | undefined
}

function getStore(): ShareRateLimitStore {
  if (!globalThis.__deeptermShareRateLimitStore) {
    globalThis.__deeptermShareRateLimitStore = {
      lookup: new Map<string, RateLimitEntry>(),
      copy: new Map<string, RateLimitEntry>(),
    }
  }
  return globalThis.__deeptermShareRateLimitStore
}

function cleanupExpiredEntries(bucket: Map<string, RateLimitEntry>, now: number): void {
  if (bucket.size < 2000) {
    return
  }

  for (const [key, entry] of bucket) {
    if (entry.resetAt <= now) {
      bucket.delete(key)
    }
  }
}

export function getRequestIdentifier(headers: HeaderSource): string {
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = headers.get('x-real-ip')?.trim()
  const userAgent = headers.get('user-agent')?.trim() ?? 'unknown-agent'
  const ip = forwardedFor || realIp || 'unknown-ip'

  return `${ip}|${userAgent.slice(0, 120)}`
}

export function checkShareRateLimit(
  bucketName: ShareRateLimitBucket,
  identifier: string
): ShareRateLimitResult {
  const now = Date.now()
  const config = RATE_LIMITS[bucketName]
  const bucket = getStore()[bucketName]
  const key = `${bucketName}:${identifier}`

  cleanupExpiredEntries(bucket, now)

  const existing = bucket.get(key)
  if (!existing || existing.resetAt <= now) {
    bucket.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    }
  }

  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  bucket.set(key, existing)

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  }
}
