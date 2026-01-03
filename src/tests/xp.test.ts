import { describe, it, expect } from 'bun:test';
import * as fc from 'fast-check';
import { getRankTitle, getRankIndex, calculateProgressPercent } from '@/utils/xp';

describe('XP Utility Functions', () => {
  it('Property 1: Rank title mapping is monotonic', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (level1, level2) => {
          const [lower, higher] = level1 <= level2 ? [level1, level2] : [level2, level1];
          const lowerRankIndex = getRankIndex(lower);
          const higherRankIndex = getRankIndex(higher);
          
          return lowerRankIndex <= higherRankIndex;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2: XP progress percentage is bounded', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (xpInLevel, xpForNext) => {
          const percent = calculateProgressPercent(xpInLevel, xpForNext);
          return percent >= 0 && percent <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });

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
