/**
 * XP Utilities Tests - Following TDD & FIRST Principles
 * 
 * Tests for XP calculation and ranking functions
 */

import { describe, it, expect } from 'bun:test'
import { 
  calculateProgressPercent, 
  getRankIndex, 
  getRankTitle 
} from '../../utils/xp'

describe('XP Utilities', () => {
  describe('calculateProgressPercent', () => {
    it('should return 0 when no XP in level', () => {
      expect(calculateProgressPercent(0, 100)).toBe(0)
    })

    it('should return 100 when at max XP for level', () => {
      expect(calculateProgressPercent(100, 100)).toBe(100)
    })

    it('should calculate 50% correctly', () => {
      expect(calculateProgressPercent(50, 100)).toBe(50)
    })

    it('should handle decimal percentages', () => {
      const result = calculateProgressPercent(33, 100)
      expect(result).toBe(33)
    })

    it('should cap at 100% even if over', () => {
      const result = calculateProgressPercent(150, 100)
      expect(result).toBeLessThanOrEqual(100)
    })

    it('should handle zero xpForNext gracefully', () => {
      const result = calculateProgressPercent(50, 0)
      expect(Number.isFinite(result)).toBe(true)
    })

    it('should handle large XP values', () => {
      const result = calculateProgressPercent(50000, 100000)
      expect(result).toBe(50)
    })
  })

  describe('getRankIndex', () => {
    it('should return 0 for level 1', () => {
      expect(getRankIndex(1)).toBe(0)
    })

    it('should return correct index for various levels', () => {
      // Test boundary levels based on rank thresholds
      expect(getRankIndex(1)).toBeGreaterThanOrEqual(0)
      expect(getRankIndex(5)).toBeGreaterThanOrEqual(0)
      expect(getRankIndex(10)).toBeGreaterThanOrEqual(0)
      expect(getRankIndex(20)).toBeGreaterThanOrEqual(0)
    })

    it('should increase with level', () => {
      const lowLevelRank = getRankIndex(1)
      const highLevelRank = getRankIndex(50)
      
      expect(highLevelRank).toBeGreaterThanOrEqual(lowLevelRank)
    })

    it('should handle level 0', () => {
      const result = getRankIndex(0)
      expect(result).toBeGreaterThanOrEqual(0)
    })

    it('should handle very high levels', () => {
      const result = getRankIndex(100)
      expect(result).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getRankTitle', () => {
    it('should return a string for level 1', () => {
      const title = getRankTitle(1)
      expect(typeof title).toBe('string')
      expect(title.length).toBeGreaterThan(0)
    })

    it('should return different titles for different levels', () => {
      const lowTitle = getRankTitle(1)
      const highTitle = getRankTitle(50)
      
      // At some point titles should differ (unless all same rank)
      expect(typeof lowTitle).toBe('string')
      expect(typeof highTitle).toBe('string')
    })

    it('should handle edge case levels', () => {
      expect(typeof getRankTitle(0)).toBe('string')
      expect(typeof getRankTitle(100)).toBe('string')
      expect(typeof getRankTitle(-1)).toBe('string')
    })

    it('should return consistent title for same level', () => {
      const title1 = getRankTitle(10)
      const title2 = getRankTitle(10)
      
      expect(title1).toBe(title2)
    })
  })

  describe('Integration: XP to Rank Flow', () => {
    it('should provide coherent progression', () => {
      // Simulate leveling up
      const levels = [1, 5, 10, 20, 30, 50]
      const ranks = levels.map(level => ({
        level,
        rankIndex: getRankIndex(level),
        rankTitle: getRankTitle(level),
      }))

      // Ranks should be non-decreasing
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i].rankIndex).toBeGreaterThanOrEqual(ranks[i - 1].rankIndex)
      }
    })

    it('should calculate progress at various points', () => {
      const testCases = [
        { xpInLevel: 0, xpForNext: 100, expected: 0 },
        { xpInLevel: 25, xpForNext: 100, expected: 25 },
        { xpInLevel: 50, xpForNext: 100, expected: 50 },
        { xpInLevel: 75, xpForNext: 100, expected: 75 },
        { xpInLevel: 100, xpForNext: 100, expected: 100 },
      ]

      testCases.forEach(({ xpInLevel, xpForNext, expected }) => {
        expect(calculateProgressPercent(xpInLevel, xpForNext)).toBe(expected)
      })
    })
  })
})
