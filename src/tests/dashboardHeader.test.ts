import { describe, it, expect, beforeEach } from 'bun:test'
import { useXPStore } from '../lib/stores/xpStore'
import { useProfileStore } from '../lib/stores/profileStore'
import { getRankTitle, calculateProgressPercent } from '../utils/xp'

describe('DashboardHeader Component Logic', () => {
  beforeEach(() => {
    useXPStore.setState({
      stats: null,
      loading: false,
      error: null,
      lastLevelUp: false,
    })
    useProfileStore.setState({
      profile: null,
      loading: false,
      error: null,
    })
  })

  describe('Level Badge Display', () => {
    it('should display level 1 when stats is null', () => {
      const { stats } = useXPStore.getState()
      const level = stats?.currentLevel || 1
      expect(level).toBe(1)
    })

    it('should display correct level from XP stats', () => {
      useXPStore.setState({
        stats: {
          totalXp: 500,
          currentLevel: 5,
          xpInLevel: 50,
          xpForNext: 150,
        },
        loading: false,
        error: null,
        lastLevelUp: false,
      })

      const { stats } = useXPStore.getState()
      const level = stats?.currentLevel || 1
      expect(level).toBe(5)
    })

    it('should handle high level values', () => {
      useXPStore.setState({
        stats: {
          totalXp: 50000,
          currentLevel: 50,
          xpInLevel: 200,
          xpForNext: 500,
        },
        loading: false,
        error: null,
        lastLevelUp: false,
      })

      const { stats } = useXPStore.getState()
      const level = stats?.currentLevel || 1
      expect(level).toBe(50)
    })
  })

  describe('Rank Title Display', () => {
    it('should display Novice for level 1', () => {
      expect(getRankTitle(1)).toBe('Novice')
    })

    it('should display Apprentice for level 5', () => {
      expect(getRankTitle(5)).toBe('Apprentice')
    })

    it('should display Scholar for level 10', () => {
      expect(getRankTitle(10)).toBe('Scholar')
    })

    it('should display Expert for level 20', () => {
      expect(getRankTitle(20)).toBe('Expert')
    })

    it('should display Master for level 35', () => {
      expect(getRankTitle(35)).toBe('Master')
    })

    it('should display Grandmaster for level 50+', () => {
      expect(getRankTitle(50)).toBe('Grandmaster')
    })
  })

  describe('XP Progress Bar Calculation', () => {
    it('should calculate 0% progress when xpInLevel is 0', () => {
      expect(calculateProgressPercent(0, 100)).toBe(0)
    })

    it('should calculate 50% progress correctly', () => {
      expect(calculateProgressPercent(50, 100)).toBe(50)
    })

    it('should calculate 100% progress when xpInLevel equals xpForNext', () => {
      expect(calculateProgressPercent(100, 100)).toBe(100)
    })

    it('should cap progress at 100% when xpInLevel exceeds xpForNext', () => {
      expect(calculateProgressPercent(150, 100)).toBe(100)
    })

    it('should return 0 when xpForNext is 0', () => {
      expect(calculateProgressPercent(50, 0)).toBe(0)
    })

    it('should handle default values when stats is null', () => {
      const { stats } = useXPStore.getState()
      const xpInLevel = stats?.xpInLevel || 0
      const xpForNext = stats?.xpForNext || 100
      expect(calculateProgressPercent(xpInLevel, xpForNext)).toBe(0)
    })
  })

  describe('Loading State', () => {
    it('should indicate loading when XP stats are being fetched', () => {
      useXPStore.setState({ loading: true })
      expect(useXPStore.getState().loading).toBe(true)
    })

    it('should indicate loading when profile is being fetched', () => {
      useProfileStore.setState({ loading: true })
      expect(useProfileStore.getState().loading).toBe(true)
    })

    it('should not be loading when both stores have data', () => {
      useXPStore.setState({
        stats: { totalXp: 100, currentLevel: 2, xpInLevel: 0, xpForNext: 100 },
        loading: false,
        error: null,
        lastLevelUp: false,
      })
      useProfileStore.setState({
        profile: { full_name: 'Test User', email: null, avatar_url: null },
        loading: false,
        error: null,
      })

      expect(useXPStore.getState().loading).toBe(false)
      expect(useProfileStore.getState().loading).toBe(false)
    })
  })
})
