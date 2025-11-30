import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getRankTitle, getRankIndex, calculateProgressPercent } from '@/utils/xp';

describe('XP Utility Functions', () => {
  /**
   * **Feature: dashboard-redesign, Property 1: Rank title mapping is monotonic**
   * *For any* two levels L1 and L2 where L1 < L2, the rank title for L1 should be 
   * less than or equal to the rank title for L2 in the progression order.
   * **Validates: Requirements 1.2**
   */
  it('Property 1: Rank title mapping is monotonic', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (level1, level2) => {
          const [lower, higher] = level1 <= level2 ? [level1, level2] : [level2, level1];
          const lowerRankIndex = getRankIndex(lower);
          const higherRankIndex = getRankIndex(higher);
          
          // Monotonicity: lower level should have rank index <= higher level's rank index
          return lowerRankIndex <= higherRankIndex;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: dashboard-redesign, Property 2: XP progress percentage is bounded**
   * *For any* valid XP stats (xpInLevel >= 0, xpForNext > 0), the calculated 
   * progress percentage should be between 0 and 100 inclusive.
   * **Validates: Requirements 1.4**
   */
  it('Property 2: XP progress percentage is bounded', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),  // xpInLevel
        fc.integer({ min: 1, max: 10000 }),  // xpForNext (must be > 0)
        (xpInLevel, xpForNext) => {
          const percent = calculateProgressPercent(xpInLevel, xpForNext);
          return percent >= 0 && percent <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Unit tests for edge cases
  describe('getRankTitle edge cases', () => {
    it('returns Novice for level 1', () => {
      expect(getRankTitle(1)).toBe('Novice');
    });

    it('returns Grandmaster for level 50+', () => {
      expect(getRankTitle(50)).toBe('Grandmaster');
      expect(getRankTitle(100)).toBe('Grandmaster');
    });
  });

  describe('calculateProgressPercent edge cases', () => {
    it('returns 0 when xpForNext is 0 or negative', () => {
      expect(calculateProgressPercent(50, 0)).toBe(0);
      expect(calculateProgressPercent(50, -10)).toBe(0);
    });

    it('returns 0 when xpInLevel is negative', () => {
      expect(calculateProgressPercent(-10, 100)).toBe(0);
    });

    it('caps at 100 when xpInLevel exceeds xpForNext', () => {
      expect(calculateProgressPercent(150, 100)).toBe(100);
    });
  });
});
