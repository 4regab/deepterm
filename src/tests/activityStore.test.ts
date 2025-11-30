import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useActivityStore } from '../lib/stores/activityStore'
import type { ActivityDay, UserStats } from '../lib/schemas/activity'

vi.mock('../config/supabase/client', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(),
    from: vi.fn(),
  })),
}))

const mockActivity: ActivityDay[] = [
  { activity_date: '2024-01-01', minutes_studied: 30, level: 2 },
  { activity_date: '2024-01-02', minutes_studied: 60, level: 3 },
  { activity_date: '2024-01-03', minutes_studied: 15, level: 1 },
]

const mockStats: UserStats = {
  total_study_minutes: 105,
  current_streak: 3,
}

describe('activityStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useActivityStore.setState({
      activity: [],
      stats: null,
      loading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==================== SET ACTIVITY (CREATE/UPDATE) ====================
  describe('setActivity', () => {
    it('should set activity data', () => {
      useActivityStore.getState().setActivity(mockActivity)
      expect(useActivityStore.getState().activity).toEqual(mockActivity)
    })

    it('should replace existing activity', () => {
      useActivityStore.getState().setActivity(mockActivity)
      const newActivity: ActivityDay[] = [{ activity_date: '2024-02-01', minutes_studied: 45, level: 2 }]
      useActivityStore.getState().setActivity(newActivity)
      expect(useActivityStore.getState().activity).toEqual(newActivity)
    })

    it('should handle empty activity array', () => {
      useActivityStore.getState().setActivity([])
      expect(useActivityStore.getState().activity).toEqual([])
    })

    it('should handle activity with zero minutes', () => {
      const zeroActivity: ActivityDay[] = [{ activity_date: '2024-01-01', minutes_studied: 0, level: 0 }]
      useActivityStore.getState().setActivity(zeroActivity)
      expect(useActivityStore.getState().activity[0].minutes_studied).toBe(0)
    })

    it('should handle activity with max level', () => {
      const maxLevelActivity: ActivityDay[] = [{ activity_date: '2024-01-01', minutes_studied: 120, level: 4 }]
      useActivityStore.getState().setActivity(maxLevelActivity)
      expect(useActivityStore.getState().activity[0].level).toBe(4)
    })

    it('should handle large activity dataset', () => {
      const largeActivity: ActivityDay[] = Array.from({ length: 365 }, (_, i) => ({
        activity_date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        minutes_studied: Math.floor(Math.random() * 120),
        level: Math.floor(Math.random() * 5),
      }))
      useActivityStore.getState().setActivity(largeActivity)
      expect(useActivityStore.getState().activity).toHaveLength(365)
    })
  })

  // ==================== SET STATS (CREATE/UPDATE) ====================
  describe('setStats', () => {
    it('should set stats', () => {
      useActivityStore.getState().setStats(mockStats)
      expect(useActivityStore.getState().stats).toEqual(mockStats)
    })

    it('should set stats to null', () => {
      useActivityStore.getState().setStats(mockStats)
      useActivityStore.getState().setStats(null)
      expect(useActivityStore.getState().stats).toBeNull()
    })

    it('should handle stats with zero values', () => {
      const zeroStats: UserStats = { total_study_minutes: 0, current_streak: 0 }
      useActivityStore.getState().setStats(zeroStats)
      expect(useActivityStore.getState().stats).toEqual(zeroStats)
    })

    it('should handle stats with large values', () => {
      const largeStats: UserStats = { total_study_minutes: 999999, current_streak: 365 }
      useActivityStore.getState().setStats(largeStats)
      expect(useActivityStore.getState().stats?.total_study_minutes).toBe(999999)
    })
  })

  // ==================== FETCH ACTIVITY (READ) ====================
  describe('fetchActivity', () => {
    it('should set loading to true when fetching', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never)

      const fetchPromise = useActivityStore.getState().fetchActivity()
      expect(useActivityStore.getState().loading).toBe(true)
      await fetchPromise
    })

    it('should set activity and stats on successful fetch', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: mockActivity, error: null }),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockStats, error: null }),
          }),
        }),
      } as never)

      await useActivityStore.getState().fetchActivity()
      expect(useActivityStore.getState().activity).toEqual(mockActivity)
      expect(useActivityStore.getState().stats).toEqual(mockStats)
      expect(useActivityStore.getState().loading).toBe(false)
    })

    it('should set error on failed calendar fetch', async () => {
      const { createClient } = await import('../config/supabase/client')
      const mockError = new Error('Fetch failed')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never)

      await useActivityStore.getState().fetchActivity()
      expect(useActivityStore.getState().error).toBe(mockError)
      expect(useActivityStore.getState().loading).toBe(false)
    })

    it('should handle null calendar data', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockStats, error: null }),
          }),
        }),
      } as never)

      await useActivityStore.getState().fetchActivity()
      expect(useActivityStore.getState().activity).toEqual([])
    })

    it('should handle stats fetch error independently', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: mockActivity, error: null }),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Stats error') }),
          }),
        }),
      } as never)

      await useActivityStore.getState().fetchActivity()
      expect(useActivityStore.getState().activity).toEqual(mockActivity)
      expect(useActivityStore.getState().stats).toBeNull()
    })

    it('should handle network timeout', async () => {
      const { createClient } = await import('../config/supabase/client')
      const timeoutError = new Error('Network timeout')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockRejectedValue(timeoutError),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never)

      await useActivityStore.getState().fetchActivity()
      expect(useActivityStore.getState().error).toBe(timeoutError)
    })

    it('should clear previous error on new fetch', async () => {
      useActivityStore.setState({ error: new Error('Previous error') })
      
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: mockActivity, error: null }),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockStats, error: null }),
          }),
        }),
      } as never)

      await useActivityStore.getState().fetchActivity()
      expect(useActivityStore.getState().error).toBeNull()
    })

    it('should handle concurrent fetch calls', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: mockActivity, error: null }),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockStats, error: null }),
          }),
        }),
      } as never)

      const fetch1 = useActivityStore.getState().fetchActivity()
      const fetch2 = useActivityStore.getState().fetchActivity()
      
      await Promise.all([fetch1, fetch2])
      expect(useActivityStore.getState().loading).toBe(false)
    })
  })

  // ==================== DATA INTEGRITY ====================
  describe('Data Integrity', () => {
    it('should store activity correctly', () => {
      const activityCopy = [...mockActivity]
      useActivityStore.getState().setActivity(activityCopy)
      expect(useActivityStore.getState().activity).toHaveLength(3)
      expect(useActivityStore.getState().activity[0].activity_date).toBe('2024-01-01')
    })

    it('should maintain state isolation between activity and stats', () => {
      useActivityStore.getState().setActivity(mockActivity)
      useActivityStore.getState().setStats(mockStats)
      useActivityStore.getState().setActivity([])
      expect(useActivityStore.getState().stats).toEqual(mockStats)
    })
  })

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('should handle activity with invalid date format', () => {
      const invalidActivity: ActivityDay[] = [{ activity_date: 'invalid-date', minutes_studied: 30, level: 2 }]
      useActivityStore.getState().setActivity(invalidActivity)
      expect(useActivityStore.getState().activity[0].activity_date).toBe('invalid-date')
    })

    it('should handle activity with negative minutes', () => {
      const negativeActivity: ActivityDay[] = [{ activity_date: '2024-01-01', minutes_studied: -30, level: 2 }]
      useActivityStore.getState().setActivity(negativeActivity)
      expect(useActivityStore.getState().activity[0].minutes_studied).toBe(-30)
    })

    it('should handle activity with out-of-range level', () => {
      const outOfRangeActivity: ActivityDay[] = [{ activity_date: '2024-01-01', minutes_studied: 30, level: 10 }]
      useActivityStore.getState().setActivity(outOfRangeActivity)
      expect(useActivityStore.getState().activity[0].level).toBe(10)
    })
  })
})
