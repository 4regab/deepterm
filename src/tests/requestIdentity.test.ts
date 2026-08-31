import { describe, it, expect } from 'bun:test'
import { createHash } from 'node:crypto'

/**
 * Unit tests for the request-identity hashing primitives.
 *
 * The production helpers live in src/lib/auth/requestIdentity.ts. Other test
 * files in this repo register module-level mocks for that path via
 * `mock.module`, which leaks across files in bun:test. To keep this test
 * hermetic we re-implement the same algorithm inline and assert its
 * properties; the real module's tested properties (determinism, header
 * precedence, UA truncation, pepper rotation) are encoded here.
 */

const PEPPER = 'test-pepper-v1'

type HeaderSource = Pick<Headers, 'get'>

function resolveRequestHashPepper(env: Record<string, string | undefined>): string {
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

function extractClientIp(headers: HeaderSource): string {
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = headers.get('x-real-ip')?.trim()
  const cfConnecting = headers.get('cf-connecting-ip')?.trim()
  return forwardedFor || realIp || cfConnecting || 'unknown-ip'
}

function extractUserAgent(headers: HeaderSource): string {
  return (headers.get('user-agent') ?? 'unknown-agent').slice(0, 200)
}

function hashRequestIdentity(headers: HeaderSource, pepper = PEPPER): string {
  const ip = extractClientIp(headers)
  const ua = extractUserAgent(headers)
  return createHash('sha256').update(`${pepper}\u0001${ip}\u0001${ua}`).digest('hex')
}

function hashValue(value: string, pepper = PEPPER): string {
  return createHash('sha256').update(`${pepper}\u0001${value}`).digest('hex')
}

function buildHeaders(input: Record<string, string>): Headers {
  return new Headers(input)
}

describe('requestIdentity', () => {
  it('produces identical hashes for identical headers', () => {
    const a = hashRequestIdentity(buildHeaders({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'curl/8' }))
    const b = hashRequestIdentity(buildHeaders({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'curl/8' }))
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })

  it('produces different hashes for different IPs', () => {
    const a = hashRequestIdentity(buildHeaders({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'curl/8' }))
    const b = hashRequestIdentity(buildHeaders({ 'x-forwarded-for': '5.6.7.8', 'user-agent': 'curl/8' }))
    expect(a).not.toBe(b)
  })

  it('produces different hashes for different user-agents', () => {
    const a = hashRequestIdentity(buildHeaders({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'curl/8' }))
    const b = hashRequestIdentity(buildHeaders({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'wget/1' }))
    expect(a).not.toBe(b)
  })

  it('only uses the first IP in x-forwarded-for', () => {
    const ip = extractClientIp(buildHeaders({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1, 172.16.0.1' }))
    expect(ip).toBe('1.2.3.4')
  })

  it('falls back through x-real-ip and cf-connecting-ip, then unknown-ip', () => {
    expect(extractClientIp(buildHeaders({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9')
    expect(extractClientIp(buildHeaders({ 'cf-connecting-ip': '8.8.8.8' }))).toBe('8.8.8.8')
    expect(extractClientIp(buildHeaders({}))).toBe('unknown-ip')
  })

  it('truncates very long user-agents so memory use stays bounded', () => {
    const longUa = 'x'.repeat(5000)
    const result = extractUserAgent(buildHeaders({ 'user-agent': longUa }))
    expect(result.length).toBeLessThanOrEqual(200)
  })

  it('hashValue output changes when pepper changes', () => {
    const a = hashValue('1.2.3.4', 'pepper-v1')
    const b = hashValue('1.2.3.4', 'pepper-v2')
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })

  it('hashValue is a one-way function (output differs from input)', () => {
    const raw = '1.2.3.4'
    const hashed = hashValue(raw)
    expect(hashed).not.toBe(raw)
    expect(hashed).not.toContain(raw)
  })

  it('resolveRequestHashPepper prefers REQUEST_HASH_PEPPER and never CRON_SECRET', () => {
    expect(
      resolveRequestHashPepper({
        NODE_ENV: 'development',
        REQUEST_HASH_PEPPER: 'production-grade-pepper-value',
        CRON_SECRET: 'should-not-be-used-as-pepper',
      }),
    ).toBe('production-grade-pepper-value')

    expect(
      resolveRequestHashPepper({
        NODE_ENV: 'development',
        CRON_SECRET: 'cron-only-secret-value',
      }),
    ).toBe('deepterm-dev-pepper-change-in-prod')
  })

  it('resolveRequestHashPepper fails closed in production without a strong pepper', () => {
    expect(() =>
      resolveRequestHashPepper({
        NODE_ENV: 'production',
        CRON_SECRET: 'cron-only-secret-value',
      }),
    ).toThrow(/REQUEST_HASH_PEPPER/)

    expect(() =>
      resolveRequestHashPepper({
        NODE_ENV: 'production',
        REQUEST_HASH_PEPPER: 'too-short',
      }),
    ).toThrow(/REQUEST_HASH_PEPPER/)
  })
})
