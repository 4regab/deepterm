/**
 * Achievement utility functions for dashboard display
 * Requirements: 4.5, 4.6
 */

import type { Achievement } from '@/lib/schemas/achievements';

/**
 * Calculates overall progress percentage across all achievements.
 * Formula: (sum of all progress / sum of all requirement_values) * 100
 * @param achievements - Array of achievements
 * @returns Progress percentage (0-100)
 */
export function calculateOverallProgress(achievements: Achievement[]): number {
  if (achievements.length === 0) return 0;
  
  const totalProgress = achievements.reduce((sum, a) => sum + a.progress, 0);
  const totalRequired = achievements.reduce((sum, a) => sum + a.requirement_value, 0);
  
  if (totalRequired <= 0) return 0;
  
  const percent = (totalProgress / totalRequired) * 100;
  return Math.min(100, Math.max(0, Math.round(percent)));
}

/**
 * Returns the count of unlocked achievements.
 * @param achievements - Array of achievements
 * @returns Number of unlocked achievements
 */
export function getUnlockedCount(achievements: Achievement[]): number {
  return achievements.filter(a => a.unlocked).length;
}

/**
 * Returns the most recently unlocked achievement.
 * Since achievements don't have timestamps, returns the last unlocked one in the array.
 * @param achievements - Array of achievements (assumed sorted by unlock time)
 * @returns Most recently unlocked achievement or null if none unlocked
 */
export function getMostRecentUnlocked(achievements: Achievement[]): Achievement | null {
  const unlocked = achievements.filter(a => a.unlocked);
  if (unlocked.length === 0) return null;
  return unlocked[unlocked.length - 1];
}
