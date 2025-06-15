import { UserAchievement } from "./userProfileConstants";
import { ACHIEVEMENT_BADGES } from "./userProfileConstants";

// Helper function to update achievement status
export const updateAchievementStatus = (
  achievements: UserAchievement[],
  achievementId: string,
  condition: boolean,
  progressValue?: number,
  totalValue?: number
): { updatedAchievements: UserAchievement[], newlyEarned: UserAchievement | null } => {
  const badgeDefinition = ACHIEVEMENT_BADGES.find(b => b.id === achievementId);
  if (!badgeDefinition) return { updatedAchievements: achievements, newlyEarned: null };

  const achievementIndex = achievements.findIndex(a => a.id === achievementId);
  let achievement: UserAchievement;
  let isNew = false;
  let newlyEarned: UserAchievement | null = null;
  const currentAchievement = achievementIndex !== -1 ? achievements[achievementIndex] : null;

  if (!currentAchievement) {
    achievement = {
      ...badgeDefinition,
      earned: false,
      progress: progressValue ?? 0,
      total: totalValue ?? badgeDefinition.total ?? (badgeDefinition.criteria.match(/\d+/) ? parseInt(badgeDefinition.criteria.match(/\d+/)?.[0] ?? '0') : 0)
    };
    isNew = true;
  } else {
    achievement = { ...currentAchievement };
    if (progressValue !== undefined) achievement.progress = progressValue;
    if (totalValue !== undefined) {
      achievement.total = totalValue;
    } else if (achievement.total === undefined || achievement.total === 0) {
      achievement.total = badgeDefinition.total ?? (badgeDefinition.criteria.match(/\d+/) ? parseInt(badgeDefinition.criteria.match(/\d+/)?.[0] ?? '0') : 0);
    }
  }

  // Check if newly earned
  if (!achievement.earned && condition) {
    achievement.earned = true;
    achievement.dateEarned = new Date().toISOString();
    newlyEarned = achievement;
  }

  // Update the array
  const updatedAchievements = [...achievements];
  if (isNew) {
    updatedAchievements.push(achievement);
  } else if (achievementIndex !== -1) {
    if (JSON.stringify(updatedAchievements[achievementIndex]) !== JSON.stringify(achievement)) {
      updatedAchievements[achievementIndex] = achievement;
    }
  }

  return { updatedAchievements, newlyEarned };
};

// Helper function to get the ISO week number of a date
export const getWeekNumber = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};
