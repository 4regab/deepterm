import { describe, it, expect, beforeEach } from 'bun:test'
import { useXPStore } from '../lib/stores/xpStore'

describe('xpStore', () => {
  beforeEach(() => {
    useXPStore.setState({ stats: null, loading: false, error: null, lastLevelUp: false })
  })

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

  describe('setLoading', () => {
    it('should set loading to true', () => {
      useXPStore.setState({ loading: true })
      expect(useXPStore.getState().loading).toBe(true)
    })

    it('should set loading to false', () => {
      useXPStore.setState({ loading: true })
      useXPStore.setState({ loading: false })
      expect(useXPStore.getState().loading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error', () => {
      const error = new Error('Test error')
      useXPStore.setState({ error })
      expect(useXPStore.getState().error).toBe(error)
    })

    it('should clear error with null', () => {
      useXPStore.setState({ error: new Error('Test') })
      useXPStore.setState({ error: null })
      expect(useXPStore.getState().error).toBeNull()
    })
  })

  describe('setLastLevelUp', () => {
    it('should set lastLevelUp to true', () => {
      useXPStore.setState({ lastLevelUp: true })
      expect(useXPStore.getState().lastLevelUp).toBe(true)
    })

    it('should set lastLevelUp to false', () => {
      useXPStore.setState({ lastLevelUp: true })
      useXPStore.setState({ lastLevelUp: false })
      expect(useXPStore.getState().lastLevelUp).toBe(false)
    })
  })

  describe('Data Integrity', () => {
    it('should maintain state isolation', () => {
      useXPStore.getState().setStats({ totalXp: 100, currentLevel: 2, xpInLevel: 50, xpForNext: 100 })
      useXPStore.setState({ loading: true })
      useXPStore.setState({ error: new Error('test') })
      
      expect(useXPStore.getState().stats?.totalXp).toBe(100)
      expect(useXPStore.getState().loading).toBe(true)
      expect(useXPStore.getState().error).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large XP values', () => {
      const largeStats = { totalXp: Number.MAX_SAFE_INTEGER, currentLevel: 999, xpInLevel: 1000000, xpForNext: 2000000 }
      useXPStore.getState().setStats(largeStats)
      expect(useXPStore.getState().stats?.totalXp).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle negative XP values', () => {
      const negativeStats = { totalXp: -100, currentLevel: -1, xpInLevel: -50, xpForNext: 100 }
      useXPStore.getState().setStats(negativeStats)
      expect(useXPStore.getState().stats?.totalXp).toBe(-100)
    })
  })
})
