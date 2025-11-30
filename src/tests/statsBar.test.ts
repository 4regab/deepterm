import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useActivityStore } from '../lib/stores/activityStore'
import type { UserStats } from '../lib/schemas/activity'

describe('StatsBar Component Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useActivityStore.setState({
      activity: [],
      stats: null,
      loading: false,
      error: null,
    })
  })

  describe('Stats Display Values', () => {
    it('should display 0 for all values when stats is null', () => {
      const { stats } = useActivityStore.getState()
      const todayMinutes = stats?.total_study_minutes ?? 0
      const currentStreak = stats?.current_streak ?? 0
      const bestStreak = stats?.longest_streak ?? 0

      expect(todayMinutes).toBe(0)
      expect(currentStreak).toBe(0)
      expect(bestStreak).toBe(0)
    })

    it('should display correct values when stats are available', () => {
      const mockStats: UserStats = {
        total_study_minutes: 45,
        current_streak: 5,
        longest_streak: 10,
      }
      useActivityStore.getState().setStats(mockStats)

      const { stats } = useActivityStore.getState()
      const todayMinutes = stats?.total_study_minutes ?? 0
      const currentStreak = stats?.current_streak ?? 0
      const bestStreak = stats?.longest_streak ?? 0

      expect(todayMinutes).toBe(45)
      expect(currentStreak).toBe(5)
      expect(bestStreak).toBe(10)
    })

    it('should handle stats without longest_streak', () => {
      const mockStats: UserStats = {
        total_study_minutes: 30,
        current_streak: 3,
      }
      useActivityStore.getState().setStats(mockStats)

      const { stats } = useActivityStore.getState()
      const bestStreak = stats?.longest_streak ?? 0

      expect(bestStreak).toBe(0)
    })

    it('should handle zero values in stats', () => {
      const mockStats: UserStats = {
        total_study_minutes: 0,
        current_streak: 0,
        longest_streak: 0,
      }
      useActivityStore.getState().setStats(mockStats)

      const { stats } = useActivityStore.getState()
      expect(stats?.total_study_minutes).toBe(0)
      expect(stats?.current_streak).toBe(0)
      expect(stats?.longest_streak).toBe(0)
    })
  })

  describe('Loading State', () => {
    it('should indicate loading state correctly', () => {
      useActivityStore.setState({ loading: true })
      expect(useActivityStore.getState().loading).toBe(true)
    })

    it('should indicate not loading when data is ready', () => {
      useActivityStore.setState({ loading: false })
      expect(useActivityStore.getState().loading).toBe(false)
    })
  })
})
