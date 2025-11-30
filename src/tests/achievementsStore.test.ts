import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAchievementsStore } from '../lib/stores/achievementsStore'
import type { Achievement } from '../lib/schemas/achievements'

vi.mock('../config/supabase/client', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(),
  })),
}))

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Complete your first study session',
    icon: 'Trophy',
    color: '#FFD700',
    bg: '#FFF8DC',
    progress: 1,
    requirement_value: 1,
    unlocked: true,
  },
  {
    id: '2',
    title: 'Study Streak',
    description: 'Study for 7 days in a row',
    icon: 'Flame',
    color: '#FF4500',
    bg: '#FFE4E1',
    progress: 3,
    requirement_value: 7,
    unlocked: false,
  },
]

describe('achievementsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAchievementsStore.setState({
      achievements: [],
      loading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })


  // ==================== SET ACHIEVEMENTS (CREATE/UPDATE) ====================
  describe('setAchievements', () => {
    it('should set achievements', () => {
      useAchievementsStore.getState().setAchievements(mockAchievements)
      expect(useAchievementsStore.getState().achievements).toEqual(mockAchievements)
    })

    it('should replace existing achievements', () => {
      useAchievementsStore.getState().setAchievements(mockAchievements)
      useAchievementsStore.getState().setAchievements([mockAchievements[0]])
      expect(useAchievementsStore.getState().achievements).toHaveLength(1)
    })

    it('should handle empty achievements array', () => {
      useAchievementsStore.getState().setAchievements([])
      expect(useAchievementsStore.getState().achievements).toEqual([])
    })

    it('should handle achievement with zero progress', () => {
      const zeroProgressAchievement: Achievement[] = [{
        id: '3',
        title: 'New Achievement',
        description: 'Not started',
        icon: 'Star',
        color: '#000',
        bg: '#FFF',
        progress: 0,
        requirement_value: 10,
        unlocked: false,
      }]
      useAchievementsStore.getState().setAchievements(zeroProgressAchievement)
      expect(useAchievementsStore.getState().achievements[0].progress).toBe(0)
    })

    it('should handle achievement with progress exceeding requirement', () => {
      const overProgressAchievement: Achievement[] = [{
        id: '4',
        title: 'Over Achiever',
        description: 'Exceeded goal',
        icon: 'Trophy',
        color: '#FFD700',
        bg: '#FFF8DC',
        progress: 15,
        requirement_value: 10,
        unlocked: true,
      }]
      useAchievementsStore.getState().setAchievements(overProgressAchievement)
      expect(useAchievementsStore.getState().achievements[0].progress).toBe(15)
    })

    it('should handle large number of achievements', () => {
      const largeAchievements: Achievement[] = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        title: `Achievement ${i}`,
        description: `Description ${i}`,
        icon: 'Star',
        color: '#000',
        bg: '#FFF',
        progress: i,
        requirement_value: 100,
        unlocked: i >= 100,
      }))
      useAchievementsStore.getState().setAchievements(largeAchievements)
      expect(useAchievementsStore.getState().achievements).toHaveLength(100)
    })

    it('should handle achievement with special characters in title', () => {
      const specialAchievement: Achievement[] = [{
        id: '5',
        title: '<script>alert("xss")</script>',
        description: 'Test & "quotes"',
        icon: 'Star',
        color: '#000',
        bg: '#FFF',
        progress: 1,
        requirement_value: 1,
        unlocked: true,
      }]
      useAchievementsStore.getState().setAchievements(specialAchievement)
      expect(useAchievementsStore.getState().achievements[0].title).toBe('<script>alert("xss")</script>')
    })

    it('should handle achievement with unicode characters', () => {
      const unicodeAchievement: Achievement[] = [{
        id: '6',
        title: '成就 🏆',
        description: 'Unicode test',
        icon: 'Trophy',
        color: '#FFD700',
        bg: '#FFF8DC',
        progress: 1,
        requirement_value: 1,
        unlocked: true,
      }]
      useAchievementsStore.getState().setAchievements(unicodeAchievement)
      expect(useAchievementsStore.getState().achievements[0].title).toBe('成就 🏆')
    })
  })

  // ==================== FETCH ACHIEVEMENTS (READ) ====================
  describe('fetchAchievements', () => {
    it('should set loading to true when fetching', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as never)

      const fetchPromise = useAchievementsStore.getState().fetchAchievements()
      expect(useAchievementsStore.getState().loading).toBe(true)
      await fetchPromise
    })

    it('should set achievements on successful fetch', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: mockAchievements, error: null }),
      } as never)

      await useAchievementsStore.getState().fetchAchievements()
      expect(useAchievementsStore.getState().achievements).toEqual(mockAchievements)
      expect(useAchievementsStore.getState().loading).toBe(false)
    })

    it('should set error on failed fetch', async () => {
      const { createClient } = await import('../config/supabase/client')
      const mockError = new Error('Fetch failed')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as never)

      await useAchievementsStore.getState().fetchAchievements()
      expect(useAchievementsStore.getState().error).toBe(mockError)
      expect(useAchievementsStore.getState().loading).toBe(false)
    })

    it('should handle null data', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as never)

      await useAchievementsStore.getState().fetchAchievements()
      expect(useAchievementsStore.getState().achievements).toEqual([])
    })

    it('should handle network timeout', async () => {
      const { createClient } = await import('../config/supabase/client')
      const timeoutError = new Error('Network timeout')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockRejectedValue(timeoutError),
      } as never)

      await useAchievementsStore.getState().fetchAchievements()
      expect(useAchievementsStore.getState().error).toBe(timeoutError)
    })

    it('should clear previous error on new fetch', async () => {
      useAchievementsStore.setState({ error: new Error('Previous error') })
      
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: mockAchievements, error: null }),
      } as never)

      await useAchievementsStore.getState().fetchAchievements()
      expect(useAchievementsStore.getState().error).toBeNull()
    })

    it('should handle empty array response', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as never)

      await useAchievementsStore.getState().fetchAchievements()
      expect(useAchievementsStore.getState().achievements).toEqual([])
      expect(useAchievementsStore.getState().loading).toBe(false)
    })

    it('should handle malformed response data', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: [{ invalid: 'data' }], error: null }),
      } as never)

      await useAchievementsStore.getState().fetchAchievements()
      expect(useAchievementsStore.getState().achievements).toHaveLength(1)
    })

    it('should handle concurrent fetch calls', async () => {
      const { createClient } = await import('../config/supabase/client')
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockResolvedValue({ data: mockAchievements, error: null }),
      } as never)

      const fetch1 = useAchievementsStore.getState().fetchAchievements()
      const fetch2 = useAchievementsStore.getState().fetchAchievements()
      
      await Promise.all([fetch1, fetch2])
      expect(useAchievementsStore.getState().loading).toBe(false)
    })
  })

  // ==================== DATA INTEGRITY ====================
  describe('Data Integrity', () => {
    it('should store achievements correctly', () => {
      const achievementsCopy = [...mockAchievements]
      useAchievementsStore.getState().setAchievements(achievementsCopy)
      expect(useAchievementsStore.getState().achievements).toHaveLength(2)
      expect(useAchievementsStore.getState().achievements[0].id).toBe('1')
    })

    it('should maintain loading state correctly during fetch', async () => {
      const { createClient } = await import('../config/supabase/client')
      let resolvePromise: (value: unknown) => void
      const delayedPromise = new Promise(resolve => { resolvePromise = resolve })
      
      vi.mocked(createClient).mockReturnValue({
        rpc: vi.fn().mockReturnValue(delayedPromise),
      } as never)

      const fetchPromise = useAchievementsStore.getState().fetchAchievements()
      expect(useAchievementsStore.getState().loading).toBe(true)
      
      resolvePromise!({ data: mockAchievements, error: null })
      await fetchPromise
      
      expect(useAchievementsStore.getState().loading).toBe(false)
    })
  })

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('should handle achievement with negative progress', () => {
      const negativeAchievement: Achievement[] = [{
        id: '7',
        title: 'Negative',
        description: 'Negative progress',
        icon: 'Star',
        color: '#000',
        bg: '#FFF',
        progress: -5,
        requirement_value: 10,
        unlocked: false,
      }]
      useAchievementsStore.getState().setAchievements(negativeAchievement)
      expect(useAchievementsStore.getState().achievements[0].progress).toBe(-5)
    })

    it('should handle achievement with empty strings', () => {
      const emptyAchievement: Achievement[] = [{
        id: '',
        title: '',
        description: '',
        icon: '',
        color: '',
        bg: '',
        progress: 0,
        requirement_value: 0,
        unlocked: false,
      }]
      useAchievementsStore.getState().setAchievements(emptyAchievement)
      expect(useAchievementsStore.getState().achievements[0].title).toBe('')
    })

    it('should handle achievement with very long strings', () => {
      const longTitle = 'A'.repeat(10000)
      const longAchievement: Achievement[] = [{
        id: '8',
        title: longTitle,
        description: 'Long title test',
        icon: 'Star',
        color: '#000',
        bg: '#FFF',
        progress: 1,
        requirement_value: 1,
        unlocked: true,
      }]
      useAchievementsStore.getState().setAchievements(longAchievement)
      expect(useAchievementsStore.getState().achievements[0].title).toBe(longTitle)
    })
  })
})
