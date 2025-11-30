/**
 * XP utility functions for dashboard display
 * Requirements: 1.2, 1.4
 */

export const RANK_TITLES = ['Novice', 'Apprentice', 'Scholar', 'Expert', 'Master', 'Grandmaster'] as const;
export type RankTitle = typeof RANK_TITLES[number];

/**
 * Maps a level to a rank title string.
 * Rank progression: Novice (1-4) < Apprentice (5-9) < Scholar (10-19) < Expert (20-34) < Master (35-49) < Grandmaster (50+)
 */
export function getRankTitle(level: number): RankTitle {
  if (level < 5) return 'Novice';
  if (level < 10) return 'Apprentice';
  if (level < 20) return 'Scholar';
  if (level < 35) return 'Expert';
  if (level < 50) return 'Master';
  return 'Grandmaster';
}

/**
 * Returns the rank index (0-5) for comparison purposes.
 * Used for property testing to verify monotonicity.
 */
export function getRankIndex(level: number): number {
  if (level < 5) return 0;
  if (level < 10) return 1;
  if (level < 20) return 2;
  if (level < 35) return 3;
  if (level < 50) return 4;
  return 5;
}

/**
 * Calculates XP progress percentage bounded between 0 and 100.
 * @param xpInLevel - Current XP accumulated in the current level
 * @param xpForNext - Total XP required to reach the next level
 * @returns Progress percentage (0-100)
 */
export function calculateProgressPercent(xpInLevel: number, xpForNext: number): number {
  if (xpForNext <= 0) return 0;
  if (xpInLevel < 0) return 0;

  const percent = (xpInLevel / xpForNext) * 100;
  return Math.min(100, Math.max(0, percent));
}
