import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getStudyIntensityLevel, generateMonthGrid } from '@/utils/calendar';

describe('Calendar Utility Functions', () => {
  /**
   * **Feature: dashboard-redesign, Property 3: Study intensity level mapping is consistent**
   * *For any* non-negative minutes value, the intensity level returned should be 0-4,
   * and higher minutes should never result in a lower intensity level.
   * **Validates: Requirements 3.2**
   */
  it('Property 3: Study intensity level mapping is consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (minutes1, minutes2) => {
          const level1 = getStudyIntensityLevel(minutes1);
          const level2 = getStudyIntensityLevel(minutes2);
          
          // Level should be in valid range
          const validRange = level1 >= 0 && level1 <= 4 && level2 >= 0 && level2 <= 4;
          
          // Monotonicity: higher minutes should not result in lower level
          const [lowerMinutes, higherMinutes] = minutes1 <= minutes2 
            ? [minutes1, minutes2] 
            : [minutes2, minutes1];
          const lowerLevel = getStudyIntensityLevel(lowerMinutes);
          const higherLevel = getStudyIntensityLevel(higherMinutes);
          const monotonic = lowerLevel <= higherLevel;
          
          return validRange && monotonic;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: dashboard-redesign, Property 5: Calendar grid structure is valid**
   * *For any* year and month, the generated calendar grid should have exactly 6 rows (weeks),
   * each row should have exactly 7 days, and all days of the target month should be present exactly once.
   * **Validates: Requirements 3.1, 3.4**
   */
  it('Property 5: Calendar grid structure is valid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 2100 }),  // year
        fc.integer({ min: 0, max: 11 }),        // month (0-11)
        (year, month) => {
          const grid = generateMonthGrid(year, month, []);
          
          // Must have exactly 6 rows
          if (grid.length !== 6) return false;
          
          // Each row must have exactly 7 days
          for (const row of grid) {
            if (row.length !== 7) return false;
          }
          
          // Count days of target month
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const targetMonthDays = new Set<number>();
          
          for (const row of grid) {
            for (const day of row) {
              if (day.isCurrentMonth) {
                targetMonthDays.add(day.dayOfMonth);
              }
            }
          }
          
          // All days of target month should be present exactly once
          if (targetMonthDays.size !== daysInMonth) return false;
          
          // Verify all expected days are present
          for (let d = 1; d <= daysInMonth; d++) {
            if (!targetMonthDays.has(d)) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Unit tests for edge cases
  describe('getStudyIntensityLevel edge cases', () => {
    it('returns 0 for 0 minutes', () => {
      expect(getStudyIntensityLevel(0)).toBe(0);
    });

    it('returns 0 for negative minutes', () => {
      expect(getStudyIntensityLevel(-10)).toBe(0);
    });

    it('returns 4 for 120+ minutes', () => {
      expect(getStudyIntensityLevel(120)).toBe(4);
      expect(getStudyIntensityLevel(500)).toBe(4);
    });
  });

  describe('generateMonthGrid structure', () => {
    it('generates correct grid for January 2024', () => {
      const grid = generateMonthGrid(2024, 0, []);
      
      expect(grid.length).toBe(6);
      expect(grid[0].length).toBe(7);
      
      // January 2024 starts on Monday (day 1), so first row starts with Dec 31
      const firstDay = grid[0][0];
      expect(firstDay.isCurrentMonth).toBe(false);
    });

    it('maps activity data correctly', () => {
      const activityData = [
        { activity_date: '2024-01-15', minutes_studied: 45, level: 2 as const },
      ];
      
      const grid = generateMonthGrid(2024, 0, activityData);
      
      // Find January 15th
      let found = false;
      for (const row of grid) {
        for (const day of row) {
          if (day.isCurrentMonth && day.dayOfMonth === 15) {
            expect(day.minutesStudied).toBe(45);
            expect(day.level).toBe(2);
            found = true;
          }
        }
      }
      expect(found).toBe(true);
    });
  });
});
