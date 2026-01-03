import { describe, it, expect, beforeEach } from 'bun:test'
import { useActivityStore } from '../lib/stores/activityStore'
import type { ActivityDay, UserStats } from '../lib/schemas/activity'

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
    useActivityStore.setState({
      activity: [],
      stats: null,
      loading: false,
      error: null,
    })
  })

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
        level: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
      }))
      useActivityStore.getState().setActivity(largeActivity)
      expect(useActivityStore.getState().activity).toHaveLength(365)
    })
  })

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
  })
})
