import { describe, it, expect, beforeEach } from 'bun:test'
import { useAchievementsStore } from '../lib/stores/achievementsStore'
import type { Achievement } from '../lib/schemas/achievements'

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
    useAchievementsStore.setState({
      achievements: [],
      loading: false,
      error: null,
    })
  })

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

  describe('Data Integrity', () => {
    it('should store achievements correctly', () => {
      const achievementsCopy = [...mockAchievements]
      useAchievementsStore.getState().setAchievements(achievementsCopy)
      expect(useAchievementsStore.getState().achievements).toHaveLength(2)
      expect(useAchievementsStore.getState().achievements[0].id).toBe('1')
    })
  })

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
