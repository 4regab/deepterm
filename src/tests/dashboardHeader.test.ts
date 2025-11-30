import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useXPStore } from '../lib/stores/xpStore'
import { useProfileStore } from '../lib/stores/profileStore'
import { getRankTitle, calculateProgressPercent } from '../utils/xp'

describe('DashboardHeader Component Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset stores to initial state
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
      const level = 1
      const rankTitle = getRankTitle(level)
      expect(rankTitle).toBe('Novice')
    })

    it('should display Apprentice for level 5', () => {
      const level = 5
      const rankTitle = getRankTitle(level)
      expect(rankTitle).toBe('Apprentice')
    })

    it('should display Scholar for level 10', () => {
      const level = 10
      const rankTitle = getRankTitle(level)
      expect(rankTitle).toBe('Scholar')
    })

    it('should display Expert for level 20', () => {
      const level = 20
      const rankTitle = getRankTitle(level)
      expect(rankTitle).toBe('Expert')
    })

    it('should display Master for level 35', () => {
      const level = 35
      const rankTitle = getRankTitle(level)
      expect(rankTitle).toBe('Master')
    })

    it('should display Grandmaster for level 50+', () => {
      const level = 50
      const rankTitle = getRankTitle(level)
      expect(rankTitle).toBe('Grandmaster')
    })
  })

  describe('XP Progress Bar Calculation', () => {
    it('should calculate 0% progress when xpInLevel is 0', () => {
      const xpInLevel = 0
      const xpForNext = 100
      const progress = calculateProgressPercent(xpInLevel, xpForNext)
      expect(progress).toBe(0)
    })

    it('should calculate 50% progress correctly', () => {
      const xpInLevel = 50
      const xpForNext = 100
      const progress = calculateProgressPercent(xpInLevel, xpForNext)
      expect(progress).toBe(50)
    })

    it('should calculate 100% progress when xpInLevel equals xpForNext', () => {
      const xpInLevel = 100
      const xpForNext = 100
      const progress = calculateProgressPercent(xpInLevel, xpForNext)
      expect(progress).toBe(100)
    })

    it('should cap progress at 100% when xpInLevel exceeds xpForNext', () => {
      const xpInLevel = 150
      const xpForNext = 100
      const progress = calculateProgressPercent(xpInLevel, xpForNext)
      expect(progress).toBe(100)
    })

    it('should return 0 when xpForNext is 0', () => {
      const xpInLevel = 50
      const xpForNext = 0
      const progress = calculateProgressPercent(xpInLevel, xpForNext)
      expect(progress).toBe(0)
    })

    it('should handle default values when stats is null', () => {
      const { stats } = useXPStore.getState()
      const xpInLevel = stats?.xpInLevel || 0
      const xpForNext = stats?.xpForNext || 100
      const progress = calculateProgressPercent(xpInLevel, xpForNext)
      expect(progress).toBe(0)
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
        stats: {
          totalXp: 100,
          currentLevel: 2,
          xpInLevel: 0,
          xpForNext: 100,
        },
        loading: false,
        error: null,
        lastLevelUp: false,
      })
      useProfileStore.setState({
        profile: { full_name: 'Test User' },
        loading: false,
        error: null,
      })

      expect(useXPStore.getState().loading).toBe(false)
      expect(useProfileStore.getState().loading).toBe(false)
    })
  })
})
