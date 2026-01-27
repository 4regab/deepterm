import { describe, it, expect, beforeEach } from 'bun:test'
import { useActivityStore } from '../lib/stores/activityStore'
import type { UserStats, ActivityDay } from '../lib/schemas/activity'

// Helper to get today's date string in YYYY-MM-DD format
function getTodayStr(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

describe('StatsBar Component Logic', () => {
  beforeEach(() => {
    useActivityStore.setState({
      activity: [],
      stats: null,
      loading: false,
      error: null,
    })
  })

  describe('Stats Display Values', () => {
    it('should display 0 for today minutes when activity is empty', () => {
      const { activity } = useActivityStore.getState()
      const todayStr = getTodayStr()
      const todayActivity = activity.find(a => a.activity_date === todayStr)
      const todayMinutes = todayActivity?.minutes_studied ?? 0

      expect(todayMinutes).toBe(0)
    })

    it('should display correct today minutes from activity array', () => {
      const todayStr = getTodayStr()
      const mockActivity: ActivityDay[] = [
        { activity_date: todayStr, minutes_studied: 45, level: 2 },
        { activity_date: '2024-01-01', minutes_studied: 100, level: 4 },
      ]
      useActivityStore.getState().setActivity(mockActivity)

      const { activity } = useActivityStore.getState()
      const todayActivity = activity.find(a => a.activity_date === todayStr)
      const todayMinutes = todayActivity?.minutes_studied ?? 0

      expect(todayMinutes).toBe(45)
    })

    it('should display 0 when today has no activity entry', () => {
      const mockActivity: ActivityDay[] = [
        { activity_date: '2024-01-01', minutes_studied: 100, level: 4 },
        { activity_date: '2024-01-02', minutes_studied: 50, level: 2 },
      ]
      useActivityStore.getState().setActivity(mockActivity)

      const { activity } = useActivityStore.getState()
      const todayStr = getTodayStr()
      const todayActivity = activity.find(a => a.activity_date === todayStr)
      const todayMinutes = todayActivity?.minutes_studied ?? 0

      // Today's date won't match the mock dates, so should be 0
      expect(todayMinutes).toBe(0)
    })

    it('should display correct streak values from stats', () => {
      const mockStats: UserStats = {
        total_study_minutes: 500, // This is all-time total, NOT today's
        current_streak: 5,
        longest_streak: 10,
      }
      useActivityStore.getState().setStats(mockStats)

      const { stats } = useActivityStore.getState()
      const currentStreak = stats?.current_streak ?? 0
      const bestStreak = stats?.longest_streak ?? 0

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
