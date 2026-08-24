import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { checkShareRateLimit, getRequestIdentifier } from '@/services/shareRateLimit'

describe('shareRateLimit', () => {
  beforeEach(() => {
    globalThis.__deeptermShareRateLimitStore = {
      lookup: new Map(),
      copy: new Map(),
    }
  })

  afterEach(() => {
    globalThis.__deeptermShareRateLimitStore = undefined
  })

  it('builds an identifier from forwarded IP and user agent', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.10, 10.0.0.1',
      'user-agent': 'Mozilla/5.0 DeepTermTest',
    })
    expect(getRequestIdentifier(headers)).toBe('203.0.113.10|Mozilla/5.0 DeepTermTest')
  })

  it('allows requests under the lookup cap and then blocks', () => {
    const first = checkShareRateLimit('lookup', 'ip|ua')
    expect(first.allowed).toBe(true)
    expect(first.remaining).toBe(59)

    for (let i = 0; i < 59; i++) {
      checkShareRateLimit('lookup', 'ip|ua')
    }

    const blocked = checkShareRateLimit('lookup', 'ip|ua')
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('isolates lookup and copy buckets', () => {
    const lookup = checkShareRateLimit('lookup', 'same-id')
    const copy = checkShareRateLimit('copy', 'same-id')
    expect(lookup.remaining).toBe(59)
    expect(copy.remaining).toBe(19)
  })
})
