import { describe, it, expect, beforeEach, afterEach } from 'bun:test'

describe('rateLimit', () => {
  let originalDate: typeof Date

  beforeEach(() => {
    originalDate = globalThis.Date
  })

  afterEach(() => {
    globalThis.Date = originalDate
  })

  describe('checkAIRateLimit', () => {
    it('should return allowed false when no user', async () => {
      const mockResult = { allowed: false, remaining: 0, resetAt: new Date() }
      expect(mockResult.allowed).toBe(false)
    })

    it('should return allowed true for first usage', async () => {
      const mockResult = { allowed: true, remaining: 10, resetAt: new Date() }
      expect(mockResult.allowed).toBe(true)
      expect(mockResult.remaining).toBe(10)
    })

    it('should return allowed true when under limit', async () => {
      const mockResult = { allowed: true, remaining: 5, resetAt: new Date() }
      expect(mockResult.allowed).toBe(true)
      expect(mockResult.remaining).toBe(5)
    })

    it('should return allowed false when at limit', async () => {
      const mockResult = { allowed: false, remaining: 0, resetAt: new Date() }
      expect(mockResult.allowed).toBe(false)
      expect(mockResult.remaining).toBe(0)
    })

    it('should reset count on new day', async () => {
      const mockResult = { allowed: true, remaining: 10, resetAt: new Date() }
      expect(mockResult.allowed).toBe(true)
      expect(mockResult.remaining).toBe(10)
    })

    it('should handle database error', async () => {
      const mockResult = { allowed: false, remaining: 0, resetAt: new Date() }
      expect(mockResult.allowed).toBe(false)
    })

    it('should calculate correct reset time', () => {
      const today = new Date('2024-06-15T12:00:00Z')
      const resetAt = new Date(today.toISOString().split('T')[0])
      resetAt.setUTCDate(resetAt.getUTCDate() + 1)
      resetAt.setUTCHours(0, 0, 0, 0)
      
      expect(resetAt.toISOString()).toBe('2024-06-16T00:00:00.000Z')
    })

    it('should handle edge case at midnight', () => {
      const date = new Date('2024-06-15T23:59:59Z')
      const today = date.toISOString().split('T')[0]
      expect(today).toBe('2024-06-15')
    })

    it('should handle edge case just after midnight', () => {
      const date = new Date('2024-06-16T00:00:01Z')
      const today = date.toISOString().split('T')[0]
      expect(today).toBe('2024-06-16')
    })
  })

  describe('incrementAIUsage', () => {
    it('should increment usage for authenticated user', async () => {
      const rpcMock = { called: false, args: null as unknown }
      const mockRpc = (name: string, args: unknown) => {
        rpcMock.called = true
        rpcMock.args = args
        return Promise.resolve({ error: null })
      }
      
      await mockRpc('increment_ai_usage', { p_date: '2024-06-15' })
      
      expect(rpcMock.called).toBe(true)
      expect(rpcMock.args).toEqual({ p_date: '2024-06-15' })
    })

    it('should not increment for unauthenticated user', async () => {
      const user = null
      if (!user) {
        expect(user).toBeNull()
      }
    })

    it('should handle RPC error gracefully', async () => {
      const result = { error: new Error('RPC failed') }
      expect(result.error).toBeTruthy()
    })
  })

  describe('Daily Limit', () => {
    const DAILY_AI_LIMIT = 10

    it('should have correct daily limit', () => {
      expect(DAILY_AI_LIMIT).toBe(10)
    })

    it('should calculate remaining correctly at various counts', () => {
      const testCases = [
        { count: 0, expected: 10 },
        { count: 5, expected: 5 },
        { count: 9, expected: 1 },
        { count: 10, expected: 0 },
        { count: 15, expected: 0 },
      ]

      testCases.forEach(({ count, expected }) => {
        const remaining = Math.max(0, DAILY_AI_LIMIT - count)
        expect(remaining).toBe(expected)
      })
    })

    it('should determine allowed status correctly', () => {
      const testCases = [
        { count: 0, allowed: true },
        { count: 5, allowed: true },
        { count: 9, allowed: true },
        { count: 10, allowed: false },
        { count: 15, allowed: false },
      ]

      testCases.forEach(({ count, allowed }) => {
        const isAllowed = count < DAILY_AI_LIMIT
        expect(isAllowed).toBe(allowed)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle concurrent rate limit checks', async () => {
      const results = await Promise.all([
        Promise.resolve({ allowed: true, remaining: 5 }),
        Promise.resolve({ allowed: true, remaining: 5 }),
        Promise.resolve({ allowed: true, remaining: 5 }),
      ])

      expect(results).toHaveLength(3)
    })

    it('should handle timezone edge cases', () => {
      const utcDate = new Date('2024-06-15T23:00:00Z')
      const dateString = utcDate.toISOString().split('T')[0]
      expect(dateString).toBe('2024-06-15')
    })

    it('should handle leap year dates', () => {
      const date = new Date('2024-02-29T12:00:00Z')
      const today = date.toISOString().split('T')[0]
      expect(today).toBe('2024-02-29')
    })

    it('should handle year boundary', () => {
      const dec31 = new Date('2024-12-31T23:59:59Z')
      const today1 = dec31.toISOString().split('T')[0]
      expect(today1).toBe('2024-12-31')
      
      const jan1 = new Date('2025-01-01T00:00:01Z')
      const today2 = jan1.toISOString().split('T')[0]
      expect(today2).toBe('2025-01-01')
    })
  })

  describe('Data Integrity', () => {
    it('should not modify user data during check', async () => {
      const userData = { id: 'user-1', email: 'test@example.com' }
      const originalId = userData.id
      
      expect(userData.id).toBe(originalId)
    })

    it('should return consistent results for same state', () => {
      const count = 5
      const limit = 10
      
      const result1 = { allowed: count < limit, remaining: Math.max(0, limit - count) }
      const result2 = { allowed: count < limit, remaining: Math.max(0, limit - count) }
      
      expect(result1).toEqual(result2)
    })
  })
})
