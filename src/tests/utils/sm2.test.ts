import { describe, expect, it } from 'bun:test'
import { qualityFromCorrect, reviewSM2 } from '@/utils/sm2'

describe('reviewSM2', () => {
  it('schedules a one-day interval after the first pass', () => {
    const now = new Date('2026-08-25T00:00:00.000Z')
    const result = reviewSM2({ ease: 2.5, intervalDays: 0, repetitions: 0 }, 4, now)
    expect(result.intervalDays).toBe(1)
    expect(result.repetitions).toBe(1)
    expect(result.dueAt).toBe('2026-08-26T00:00:00.000Z')
  })

  it('resets repetitions on a failed review', () => {
    const result = reviewSM2({ ease: 2.6, intervalDays: 12, repetitions: 4 }, 1)
    expect(result.repetitions).toBe(0)
    expect(result.intervalDays).toBe(1)
    expect(result.ease).toBeGreaterThanOrEqual(1.3)
  })

  it('maps boolean answers to SM-2 quality', () => {
    expect(qualityFromCorrect(true)).toBe(4)
    expect(qualityFromCorrect(false)).toBe(1)
  })
})
