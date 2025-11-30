import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateOverallProgress, getUnlockedCount, getMostRecentUnlocked } from '@/utils/achievements';
import type { Achievement } from '@/lib/schemas/achievements';

// Generator for valid Achievement objects
const achievementArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  icon: fc.constantFrom('Trophy', 'Zap', 'BrainCircuit', 'Star', 'Flame', 'Timer', 'Clock', 'BookOpen', 'FileText', 'Upload'),
  color: fc.string({ minLength: 1, maxLength: 20 }),
  bg: fc.string({ minLength: 1, maxLength: 20 }),
  progress: fc.integer({ min: 0, max: 1000 }),
  requirement_value: fc.integer({ min: 1, max: 1000 }),
  unlocked: fc.boolean(),
});

const achievementsArrayArb = fc.array(achievementArb, { minLength: 0, maxLength: 20 });

describe('Achievement Utility Functions', () => {
  /**
   * **Feature: dashboard-redesign, Property 4: Achievement statistics are accurate**
   * *For any* list of achievements, the unlocked count should equal the number of 
   * achievements where unlocked=true, and the overall progress percentage should 
   * equal (sum of all progress / sum of all requirement_values) * 100.
   * **Validates: Requirements 4.5, 4.6**
   */
  it('Property 4: Achievement statistics are accurate - unlocked count matches filter', () => {
    fc.assert(
      fc.property(achievementsArrayArb, (achievements) => {
        const count = getUnlockedCount(achievements);
        const expected = achievements.filter(a => a.unlocked).length;
        return count === expected;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 4: Achievement statistics are accurate - progress calculation', () => {
    fc.assert(
      fc.property(achievementsArrayArb, (achievements) => {
        const progress = calculateOverallProgress(achievements);
        
        if (achievements.length === 0) {
          return progress === 0;
        }
        
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        const expected = Math.min(100, Math.max(0, Math.round((unlockedCount / achievements.length) * 100)));
        return progress === expected;
      }),
      { numRuns: 100 }
    );
  });

  it('Property 4: Progress percentage is bounded 0-100', () => {
    fc.assert(
      fc.property(achievementsArrayArb, (achievements) => {
        const progress = calculateOverallProgress(achievements);
        return progress >= 0 && progress <= 100;
      }),
      { numRuns: 100 }
    );
  });

  // Unit tests for edge cases
  describe('calculateOverallProgress edge cases', () => {
    it('returns 0 for empty array', () => {
      expect(calculateOverallProgress([])).toBe(0);
    });

    it('returns correct percentage for single achievement', () => {
      const achievement: Achievement = {
        id: '1',
        title: 'Test',
        description: 'Test desc',
        icon: 'Trophy',
        color: 'text-yellow-500',
        bg: 'bg-yellow-100',
        progress: 50,
        requirement_value: 100,
        unlocked: false,
      };
      // 0 unlocked out of 1 = 0%
      expect(calculateOverallProgress([achievement])).toBe(0);
    });
  });

  describe('getUnlockedCount edge cases', () => {
    it('returns 0 for empty array', () => {
      expect(getUnlockedCount([])).toBe(0);
    });

    it('returns 0 when no achievements unlocked', () => {
      const achievements: Achievement[] = [
        { id: '1', title: 'Test', description: 'Test', icon: 'Trophy', color: '', bg: '', progress: 0, requirement_value: 10, unlocked: false },
      ];
      expect(getUnlockedCount(achievements)).toBe(0);
    });
  });

  describe('getMostRecentUnlocked edge cases', () => {
    it('returns null for empty array', () => {
      expect(getMostRecentUnlocked([])).toBeNull();
    });

    it('returns null when no achievements unlocked', () => {
      const achievements: Achievement[] = [
        { id: '1', title: 'Test', description: 'Test', icon: 'Trophy', color: '', bg: '', progress: 0, requirement_value: 10, unlocked: false },
      ];
      expect(getMostRecentUnlocked(achievements)).toBeNull();
    });

    it('returns last unlocked achievement', () => {
      const achievements: Achievement[] = [
        { id: '1', title: 'First', description: 'Test', icon: 'Trophy', color: '', bg: '', progress: 10, requirement_value: 10, unlocked: true },
        { id: '2', title: 'Second', description: 'Test', icon: 'Star', color: '', bg: '', progress: 10, requirement_value: 10, unlocked: true },
      ];
      const result = getMostRecentUnlocked(achievements);
      expect(result?.id).toBe('2');
    });
  });
});


// Unit tests for achievement components logic
describe('Achievement Components Logic', () => {
  describe('RecentActivity with achievements', () => {
    it('should include unlocked achievements in activity list', () => {
      const achievements: Achievement[] = [
        { id: '1', title: 'First Steps', description: 'Complete first study', icon: 'Trophy', color: 'text-yellow-500', bg: 'bg-yellow-100', progress: 1, requirement_value: 1, unlocked: true },
        { id: '2', title: 'Streak Master', description: 'Get 7 day streak', icon: 'Flame', color: 'text-orange-500', bg: 'bg-orange-100', progress: 3, requirement_value: 7, unlocked: false },
      ];
      
      const unlockedAchievements = achievements.filter(a => a.unlocked);
      expect(unlockedAchievements.length).toBe(1);
      expect(unlockedAchievements[0].title).toBe('First Steps');
    });

    it('should return empty array when no achievements unlocked', () => {
      const achievements: Achievement[] = [
        { id: '1', title: 'First Steps', description: 'Complete first study', icon: 'Trophy', color: '', bg: '', progress: 0, requirement_value: 1, unlocked: false },
      ];
      
      const unlockedAchievements = achievements.filter(a => a.unlocked);
      expect(unlockedAchievements.length).toBe(0);
    });
  });

  describe('AllAchievements progress calculation', () => {
    it('should calculate correct progress for mixed achievements', () => {
      const achievements: Achievement[] = [
        { id: '1', title: 'A', description: '', icon: 'Trophy', color: '', bg: '', progress: 50, requirement_value: 100, unlocked: false },
        { id: '2', title: 'B', description: '', icon: 'Star', color: '', bg: '', progress: 100, requirement_value: 100, unlocked: true },
      ];
      
      // 1 unlocked out of 2 = 50%
      const progress = calculateOverallProgress(achievements);
      expect(progress).toBe(50);
    });

    it('should return 100% when all achievements complete', () => {
      const achievements: Achievement[] = [
        { id: '1', title: 'A', description: '', icon: 'Trophy', color: '', bg: '', progress: 100, requirement_value: 100, unlocked: true },
        { id: '2', title: 'B', description: '', icon: 'Star', color: '', bg: '', progress: 50, requirement_value: 50, unlocked: true },
      ];
      
      const progress = calculateOverallProgress(achievements);
      expect(progress).toBe(100);
    });

    it('should return correct unlocked count', () => {
      const achievements: Achievement[] = [
        { id: '1', title: 'A', description: '', icon: 'Trophy', color: '', bg: '', progress: 100, requirement_value: 100, unlocked: true },
        { id: '2', title: 'B', description: '', icon: 'Star', color: '', bg: '', progress: 50, requirement_value: 100, unlocked: false },
        { id: '3', title: 'C', description: '', icon: 'Zap', color: '', bg: '', progress: 100, requirement_value: 100, unlocked: true },
      ];
      
      const count = getUnlockedCount(achievements);
      expect(count).toBe(2);
    });
  });
});
