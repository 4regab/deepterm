/**
 * Achievement Utilities Tests - Following TDD & FIRST Principles
 * 
 * Tests for pure utility functions that calculate achievement progress
 */

import { describe, it, expect } from 'bun:test'
import { 
  calculateOverallProgress, 
  getUnlockedCount, 
  getMostRecentUnlocked 
} from '../../utils/achievements'
import type { Achievement } from '../../lib/schemas/achievements'

// Test data factory (FIRST: Independent - fresh data each test)
const createAchievement = (overrides: Partial<Achievement> = {}): Achievement => ({
  id: `achievement-${Math.random()}`,
  title: 'Test Achievement',
  description: 'Test description',
  icon: 'Trophy',
  color: 'text-yellow-600',
  bg: 'bg-yellow-100',
  progress: 0,
  requirement_value: 10,
  unlocked: false,
  unlocked_at: null,
  ...overrides,
})

describe('Achievement Utilities', () => {
  describe('getUnlockedCount', () => {
    it('should return 0 for empty array', () => {
      expect(getUnlockedCount([])).toBe(0)
    })

    it('should return 0 when no achievements unlocked', () => {
      const achievements = [
        createAchievement({ unlocked: false }),
        createAchievement({ unlocked: false }),
      ]
      expect(getUnlockedCount(achievements)).toBe(0)
    })

    it('should count all unlocked achievements', () => {
      const achievements = [
        createAchievement({ unlocked: true }),
        createAchievement({ unlocked: true }),
        createAchievement({ unlocked: false }),
      ]
      expect(getUnlockedCount(achievements)).toBe(2)
    })

    it('should return total count when all unlocked', () => {
      const achievements = [
        createAchievement({ unlocked: true }),
        createAchievement({ unlocked: true }),
        createAchievement({ unlocked: true }),
      ]
      expect(getUnlockedCount(achievements)).toBe(3)
    })
  })

  describe('calculateOverallProgress', () => {
    // Note: This function calculates (unlockedCount / totalCount) * 100
    // It does NOT use progress/requirement_value ratios
    
    it('should return 0 for empty array', () => {
      expect(calculateOverallProgress([])).toBe(0)
    })

    it('should return 0 when no achievements unlocked', () => {
      const achievements = [
        createAchievement({ unlocked: false }),
        createAchievement({ unlocked: false }),
      ]
      expect(calculateOverallProgress(achievements)).toBe(0)
    })

    it('should return 100 when all achievements unlocked', () => {
      const achievements = [
        createAchievement({ unlocked: true }),
        createAchievement({ unlocked: true }),
      ]
      expect(calculateOverallProgress(achievements)).toBe(100)
    })

    it('should calculate partial progress based on unlocked count', () => {
      const achievements = [
        createAchievement({ unlocked: true }),
        createAchievement({ unlocked: false }),
      ]
      // 1 unlocked out of 2 = 50%
      expect(calculateOverallProgress(achievements)).toBe(50)
    })

    it('should calculate progress for various unlock ratios', () => {
      const achievements = [
        createAchievement({ unlocked: true }),
        createAchievement({ unlocked: true }),
        createAchievement({ unlocked: false }),
        createAchievement({ unlocked: false }),
      ]
      // 2 unlocked out of 4 = 50%
      expect(calculateOverallProgress(achievements)).toBe(50)
    })

    it('should round to nearest integer', () => {
      const achievements = [
        createAchievement({ unlocked: true }),
        createAchievement({ unlocked: false }),
        createAchievement({ unlocked: false }),
      ]
      // 1 unlocked out of 3 = 33.33% -> rounds to 33
      const result = calculateOverallProgress(achievements)
      expect(Number.isInteger(result)).toBe(true)
      expect(result).toBe(33)
    })

    it('should cap result between 0 and 100', () => {
      const allUnlocked = [
        createAchievement({ unlocked: true }),
        createAchievement({ unlocked: true }),
      ]
      expect(calculateOverallProgress(allUnlocked)).toBeLessThanOrEqual(100)
      expect(calculateOverallProgress(allUnlocked)).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getMostRecentUnlocked', () => {
    // Note: This function returns the LAST unlocked item in array order
    // It does NOT sort by unlocked_at date - assumes array is pre-sorted by unlock time
    
    it('should return null for empty array', () => {
      expect(getMostRecentUnlocked([])).toBeNull()
    })

    it('should return null when no achievements unlocked', () => {
      const achievements = [
        createAchievement({ unlocked: false }),
        createAchievement({ unlocked: false }),
      ]
      expect(getMostRecentUnlocked(achievements)).toBeNull()
    })

    it('should return the only unlocked achievement', () => {
      const unlockedAchievement = createAchievement({ 
        unlocked: true, 
        title: 'Only Unlocked'
      })
      const achievements = [
        createAchievement({ unlocked: false }),
        unlockedAchievement,
      ]
      
      const result = getMostRecentUnlocked(achievements)
      expect(result?.title).toBe('Only Unlocked')
    })

    it('should return the last unlocked achievement in array order', () => {
      const achievements = [
        createAchievement({ 
          unlocked: true, 
          title: 'First Unlocked'
        }),
        createAchievement({ 
          unlocked: true, 
          title: 'Second Unlocked'
        }),
        createAchievement({ 
          unlocked: true, 
          title: 'Third Unlocked'
        }),
      ]
      
      // Returns last unlocked in array order, not date-sorted
      const result = getMostRecentUnlocked(achievements)
      expect(result?.title).toBe('Third Unlocked')
    })

    it('should skip locked achievements when finding last unlocked', () => {
      const achievements = [
        createAchievement({ 
          unlocked: true, 
          title: 'First Unlocked'
        }),
        createAchievement({ 
          unlocked: false, 
          title: 'Locked'
        }),
        createAchievement({ 
          unlocked: true, 
          title: 'Last Unlocked'
        }),
        createAchievement({ 
          unlocked: false, 
          title: 'Also Locked'
        }),
      ]
      
      // Returns last unlocked item (Third Unlocked), ignoring locked items after it
      const result = getMostRecentUnlocked(achievements)
      expect(result?.title).toBe('Last Unlocked')
    })

    it('should handle single unlocked achievement at start of array', () => {
      const achievements = [
        createAchievement({ 
          unlocked: true, 
          title: 'Only One'
        }),
        createAchievement({ unlocked: false }),
        createAchievement({ unlocked: false }),
      ]
      
      const result = getMostRecentUnlocked(achievements)
      expect(result?.title).toBe('Only One')
    })
  })

  describe('Edge Cases', () => {
    it('should handle single locked achievement', () => {
      const achievements = [createAchievement({ unlocked: false })]
      
      expect(getUnlockedCount(achievements)).toBe(0)
      expect(calculateOverallProgress(achievements)).toBe(0)
    })

    it('should handle single unlocked achievement', () => {
      const achievements = [createAchievement({ unlocked: true })]
      
      expect(getUnlockedCount(achievements)).toBe(1)
      expect(calculateOverallProgress(achievements)).toBe(100)
    })

    it('should handle large number of achievements', () => {
      const achievements = Array.from({ length: 100 }, (_, i) => 
        createAchievement({ 
          unlocked: i >= 50 
        })
      )
      
      expect(getUnlockedCount(achievements)).toBe(50)
      // 50 unlocked out of 100 = 50%
      expect(calculateOverallProgress(achievements)).toBe(50)
    })

    it('should handle getMostRecentUnlocked with large array', () => {
      const achievements = Array.from({ length: 100 }, (_, i) => 
        createAchievement({ 
          unlocked: i < 75,
          title: `Achievement ${i}`
        })
      )
      
      // Last unlocked is at index 74 (indices 0-74 are unlocked)
      const result = getMostRecentUnlocked(achievements)
      expect(result?.title).toBe('Achievement 74')
    })
  })
})
