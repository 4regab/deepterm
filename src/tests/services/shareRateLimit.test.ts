import { describe, expect, it } from 'bun:test'
import { consumeShareRateLimit, type ShareRateLimitRpcClient } from '@/services/shareRateLimit'

function mockClient(handler: ShareRateLimitRpcClient['rpc']): ShareRateLimitRpcClient {
  return { rpc: handler }
}

describe('consumeShareRateLimit', () => {
  it('rejects short identity hashes without calling the RPC', async () => {
    let called = false
    const result = await consumeShareRateLimit(
      mockClient(async () => {
        called = true
        return { data: null, error: null }
      }),
      'lookup',
      'short',
    )
    expect(called).toBe(false)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('maps RPC allow rows into the TypeScript result shape', async () => {
    const result = await consumeShareRateLimit(
      mockClient(async (_fn, args) => {
        expect(_fn).toBe('consume_share_rate_limit')
        expect(args.p_bucket).toBe('copy')
        expect(args.p_identifier_hash).toBe('a'.repeat(32))
        expect(args.p_max).toBe(20)
        return {
          data: [{ allowed: true, remaining: 19, retry_after_seconds: 60 }],
          error: null,
        }
      }),
      'copy',
      'a'.repeat(32),
    )
    expect(result).toEqual({
      allowed: true,
      remaining: 19,
      retryAfterSeconds: 60,
    })
  })

  it('fails closed when the RPC errors', async () => {
    const result = await consumeShareRateLimit(
      mockClient(async () => ({
        data: null,
        error: { message: 'boom' },
      })),
      'lookup',
      'b'.repeat(32),
    )
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterSeconds).toBe(60)
  })

  it('isolates lookup and copy bucket caps in RPC args', async () => {
    const seen: Array<{ bucket: unknown; max: unknown }> = []
    const client = mockClient(async (_fn, args) => {
      seen.push({ bucket: args.p_bucket, max: args.p_max })
      return {
        data: [{ allowed: true, remaining: 1, retry_after_seconds: 60 }],
        error: null,
      }
    })

    await consumeShareRateLimit(client, 'lookup', 'c'.repeat(32))
    await consumeShareRateLimit(client, 'copy', 'c'.repeat(32))

    expect(seen).toEqual([
      { bucket: 'lookup', max: 60 },
      { bucket: 'copy', max: 20 },
    ])
  })
})
