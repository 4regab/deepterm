import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useXPStore } from '../lib/stores/xpStore'

vi.mock('../config/supabase/client', () => ({
  createClient: vi.fn(() => ({ rpc: vi.fn() })),
}))

const mockXPStats = { total_xp: 500, current_level: 3, xp_in_level: 50, xp_for_next: 150 }

describe('xpStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useXPStore.setState({ stats: null, loading: false, error: null, lastLevelUp: false })
  })

  afterEach(() => { vi.restoreAllMocks() })

  describe('setStats', () => {
    it('should set stats with valid data', () => {
      const stats = { totalXp: 500, currentLevel: 3, xpInLevel: 50, xpForNext: 150 }
      useXPStore.getState().setStats(stats)
      expect(useXPStore.getState().stats).toEqual(stats)
    })

    it('should overwrite existing stats', () => {
      useXPStore.getState().setStats({ totalXp: 100, currentLevel: 1, xpInLevel: 0, xpForNext: 100 })
      useXPStore.getState().setStats({ totalXp: 500, currentLevel: 5, xpInLevel: 50, xpForNext: 200 })
      expect(useXPStore.getState().stats?.totalXp).toBe(500)
    })

    it('should handle zero values', () => {
      const zeroStats = { totalXp: 0, currentLevel: 0, xpInLevel: 0, xpForNext: 0 }
      useXPStore.getState().setStats(zeroStats)
      expect(useXPStore.getState().stats).toEqual(zeroStats)
    })
  })

  describe('fetchXPStats', () => {
    it('should set loading to true when fetching', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: [], error: null }) } as never)
      const fetchPromise = useXPStore.getState().fetchXPStats()
      expect(useXPStore.getState().loading).toBe(true)
      await fetchPromise
    })

    it('should set stats on successful fetch', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: [mockXPStats], error: null }) } as never)
      await useXPStore.getState().fetchXPStats()
      expect(useXPStore.getState().stats?.totalXp).toBe(500)
    })
  })


  describe('addXP', () => {
    it('should add XP and update stats', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: [{ new_total_xp: 550, new_level: 3, xp_in_level: 100, xp_for_next: 150, leveled_up: false }], error: null }),
      } as never)
      const result = await useXPStore.getState().addXP(50)
      expect(result.leveledUp).toBe(false)
    })

    it('should return leveledUp true when leveling up', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: [{ new_total_xp: 600, new_level: 4, xp_in_level: 0, xp_for_next: 200, leveled_up: true }], error: null }),
      } as never)
      const result = await useXPStore.getState().addXP(100)
      expect(result.leveledUp).toBe(true)
    })

    it('should return leveledUp false on error', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('Failed') }) } as never)
      const result = await useXPStore.getState().addXP(50)
      expect(result.leveledUp).toBe(false)
    })

    it('should handle network failure gracefully', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({ rpc: vi.fn().mockRejectedValue(new Error('Network error')) } as never)
      const result = await useXPStore.getState().addXP(50)
      expect(result.leveledUp).toBe(false)
    })
  })
})
