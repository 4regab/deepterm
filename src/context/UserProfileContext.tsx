import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'sonner'; // Import toast
import { ACHIEVEMENT_BADGES, LEVEL_DATA, UserAchievement, UserLevel, UserProfile, QuizStats, FlashcardStats, TaskStats } from './userProfileConstants'; // Import constants and types

interface UserProfileContextType {
  userProfile: UserProfile;
  updateUserName: (name: string) => void;
  updateUserXP: (xp: number) => void;
  updateMinutesStudied: (minutes: number, isPomodoroSession?: boolean) => void; // Add flag for Pomodoro completion
  updateBestStreak: (streak: number) => void;
  updateProfilePicture: (pictureDataUrl: string | null) => void; // Add function to update picture
  getTimeBasedGreeting: () => string;
  getUserLevel: () => UserLevel;
  getLevelProgress: () => { current: number, required: number, percentage: number, minuteProgress: number };
  markFirstVisitComplete: () => void;
  // New functions for quiz tracking
  trackQuizCreated: () => void;
  trackQuizTaken: (score: number) => void;
  // New functions for flashcard tracking
  trackFlashcardCreated: (count: number) => void;
  trackFlashcardStudy: (cardsStudied: number, accuracy?: number) => void;
  // New functions for task tracking
  trackTaskCompleted: (taskText: string) => void;
  trackTaskCreated: () => void;
  resetTasksInPomodoro: () => void; // To be called at the start of a new Pomodoro session
  checkAndUpdateAchievement: (achievementId: string, condition: boolean, progressValue?: number, totalValue?: number) => void; // Expose checkAndUpdateAchievement
}

// Default user profile
const DEFAULT_USER_PROFILE: UserProfile = {
  name: '',
  xp: 0,
  minutesStudied: 0,
  level: 1,
  bestStreak: 0,
  achievements: [],
  firstVisit: true,
  lastVisited: null,
  profilePicture: null, // Initialize profile picture as null
  quizStats: {
    created: 0,
    taken: 0,
    perfectScores: 0,
    streakDays: 0,
    lastQuizDate: null,
  },
  flashcardStats: {
    created: 0,
    studyDays: 0,
    studySessions: 0,
    highestAccuracy: 0,
    cardsInLargestSession: 0,
    lastStudyDate: null,
  },
  pomodoroSessionsCompleted: 0, // Initialize Pomodoro count
  taskStats: {
    completed: 0,
    tasksCompletedToday: 0,
    tasksCompletedThisWeek: 0,
    tasksCompletedThisMonth: 0,
    lastTaskDate: null,
    tasksInPomodoro: 0,
    tasksInPomodoroTimestamp: null,
    uniqueSubjectsToday: [],
  }
};

// Create the context
const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

// XP conversion constants
const MINUTES_PER_XP = 6; // 6 minutes = 1 XP (10 XP per hour)

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load user profile from localStorage or use default
  const loadUserProfile = (): UserProfile => {
    try {
      const savedProfile = localStorage.getItem('user-profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        // Ensure all fields exist in older profiles
        return {
          ...DEFAULT_USER_PROFILE, // Start with defaults to ensure all fields exist
          ...parsed,
          minutesStudied: parsed.minutesStudied || 0,
          profilePicture: parsed.profilePicture || null, // Ensure profilePicture exists
          quizStats: parsed.quizStats || DEFAULT_USER_PROFILE.quizStats,
          flashcardStats: parsed.flashcardStats || DEFAULT_USER_PROFILE.flashcardStats,
          pomodoroSessionsCompleted: parsed.pomodoroSessionsCompleted || 0,
          taskStats: parsed.taskStats || DEFAULT_USER_PROFILE.taskStats, // Ensure taskStats exists
        };
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
    return DEFAULT_USER_PROFILE;
  };

  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile);

  // Save profile to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('user-profile', JSON.stringify(userProfile));
    } catch (error) {
      console.error("Failed to save user profile:", error);
    }
  }, [userProfile]);

  // Define the helper function within the Provider scope
  const updateAchievementStatus = (
    achievements: UserAchievement[],
    achievementId: string,
    condition: boolean,
    progressValue?: number,
    totalValue?: number
  ): { updatedAchievements: UserAchievement[], newlyEarned: UserAchievement | null } => {
    const badgeDefinition = ACHIEVEMENT_BADGES.find(b => b.id === achievementId);
    if (!badgeDefinition) return { updatedAchievements: achievements, newlyEarned: null };

    const achievementIndex = achievements.findIndex(a => a.id === achievementId); // Use const
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
      achievement = { ...currentAchievement }; // Clone to avoid direct mutation
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
      newlyEarned = achievement; // Mark as newly earned
    }

    // Update the array
    const updatedAchievements = [...achievements]; // Clone the array
    if (isNew) {
      updatedAchievements.push(achievement);
    } else if (achievementIndex !== -1) {
      // Only update if something changed or if it was newly earned
      if (JSON.stringify(updatedAchievements[achievementIndex]) !== JSON.stringify(achievement)) {
        updatedAchievements[achievementIndex] = achievement;
      }
    }

    return { updatedAchievements, newlyEarned };
  };

  // Update user's name
  const updateUserName = (name: string) => {
    setUserProfile(prev => ({ ...prev, name }));
  };

  // Update user's XP and check for level up
  const updateUserXP = (xp: number) => {
    setUserProfile(prev => {
      const newXP = prev.xp + xp;

      // Calculate new level based on XP
      let newLevel = prev.level;
      for (let i = 0; i < LEVEL_DATA.length; i++) {
        if (newXP >= LEVEL_DATA[i].requiredXP) {
          newLevel = LEVEL_DATA[i].level;
        } else {
          break;
        }
      }

      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  // Update minutes studied and potentially add XP
  const updateMinutesStudied = (minutes: number, isPomodoroSession?: boolean) => {
    setUserProfile(prev => {
      const newMinutesTotal = prev.minutesStudied + minutes;

      // Calculate how many whole XP points we can award
      const earnedXP = Math.floor(newMinutesTotal / MINUTES_PER_XP);
      const remainingMinutes = newMinutesTotal % MINUTES_PER_XP;

      // Only update XP if we've earned at least 1 new XP point
      if (earnedXP > 0) {
        const newTotalXP = prev.xp + earnedXP;

        // Calculate new level based on XP
        let newLevel = prev.level;
        for (let i = 0; i < LEVEL_DATA.length; i++) {
          if (newTotalXP >= LEVEL_DATA[i].requiredXP) {
            newLevel = LEVEL_DATA[i].level;
          } else {
            break;
          }
        }

        return {
          ...prev,
          minutesStudied: remainingMinutes,
          xp: newTotalXP,
          level: newLevel,
          pomodoroSessionsCompleted: isPomodoroSession ? prev.pomodoroSessionsCompleted + 1 : prev.pomodoroSessionsCompleted
        };
      }

      // Otherwise just update the minutes
      return {
        ...prev,
        minutesStudied: newMinutesTotal,
        pomodoroSessionsCompleted: isPomodoroSession ? prev.pomodoroSessionsCompleted + 1 : prev.pomodoroSessionsCompleted
      };
    });
  };

  // Update user's best streak
  const updateBestStreak = (streak: number) => {
    setUserProfile(prev => {
      // Only update if new streak is better than previous best
      if (streak > prev.bestStreak) {
        return { ...prev, bestStreak: streak };
      }
      return prev;
    });
  };

  // Update user's profile picture
  const updateProfilePicture = (pictureDataUrl: string | null) => {
    setUserProfile(prev => ({ ...prev, profilePicture: pictureDataUrl }));
  };

  // Get greeting based on time of day
  const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    } else if (hour < 18) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  };

  // Get the user's current level data
  const getUserLevel = (): UserLevel => {
    // Find current level
    for (let i = LEVEL_DATA.length - 1; i >= 0; i--) {
      if (userProfile.level >= LEVEL_DATA[i].level) {
        return LEVEL_DATA[i];
      }
    }
    return LEVEL_DATA[0]; // Default to first level
  };

  // Calculate progress to next level including minute progress
  const getLevelProgress = () => {
    const currentLevel = getUserLevel();
    const nextLevelIndex = LEVEL_DATA.findIndex(level => level.level === currentLevel.level + 1);

    if (nextLevelIndex === -1) {
      // Max level reached
      return { current: userProfile.xp, required: userProfile.xp, percentage: 100, minuteProgress: 0 };
    }

    const nextLevel = LEVEL_DATA[nextLevelIndex];
    const currentXP = userProfile.xp - currentLevel.requiredXP;
    const requiredXP = nextLevel.requiredXP - currentLevel.requiredXP;

    // Calculate base percentage from full XP points
    const basePercentage = (currentXP / requiredXP) * 100;

    // Add fractional progress from minutes studied
    const minuteProgress = (userProfile.minutesStudied / MINUTES_PER_XP) / requiredXP * 100;

    // Total percentage is base plus the minute progress
    const percentage = Math.min(100, Math.floor(basePercentage + minuteProgress));

    return {
      current: currentXP,
      required: requiredXP,
      percentage,
      minuteProgress
    };
  };

  // Mark first visit as complete
  const markFirstVisitComplete = () => {
    setUserProfile(prev => ({
      ...prev,
      firstVisit: false, // This assignment is now valid
      lastVisited: new Date().toISOString(),
    }));
  };

  // Update last visited timestamp only once on initial load if not first visit
  useEffect(() => {
    if (!userProfile.firstVisit) {
      const now = new Date().toISOString();
      // Only update if the lastVisited date is not today to avoid loop
      if (!userProfile.lastVisited || !userProfile.lastVisited.startsWith(now.substring(0, 10))) {
        // Update using a functional update that doesn't trigger if value is the same
        setUserProfile(prev => {
          // Check again inside functional update for safety
          if (!prev.lastVisited || !prev.lastVisited.startsWith(now.substring(0, 10))) {
            return { ...prev, lastVisited: now };
          }
          return prev; // No change needed
        });
      }
    }
    // Add userProfile.lastVisited to dependencies as it's read in the effect
  }, [userProfile.firstVisit, userProfile.lastVisited]);

  // Check if an achievement has been earned and update it
  const checkAndUpdateAchievement = (achievementId: string, condition: boolean, progressValue?: number, totalValue?: number) => {
    setUserProfile(prev => {
      const achievements = [...prev.achievements];

      const achievementIndex = achievements.findIndex(a => a.id === achievementId); // Use const
      let achievement: UserAchievement;
      const badgeDefinition = ACHIEVEMENT_BADGES.find(b => b.id === achievementId);

      if (!badgeDefinition) return prev; // Should never happen with proper IDs

      const currentAchievement = achievementIndex !== -1 ? achievements[achievementIndex] : null;
      let isNew = false;

      if (!currentAchievement) {
        achievement = {
          ...badgeDefinition,
          earned: false,
          progress: progressValue || 0,
          total: totalValue || badgeDefinition.total || 0 // Use badgeDefinition total as fallback
        };
        isNew = true;
      } else {
        achievement = { ...currentAchievement }; // Clone to avoid direct mutation
        if (progressValue !== undefined) {
          achievement.progress = progressValue;
        }
        if (totalValue !== undefined) {
          achievement.total = totalValue;
        }
      }

      // Check if it's newly earned
      if (!achievement.earned && condition) {
        achievement.earned = true;
        achievement.dateEarned = new Date().toISOString();

        // Show toast notification for new achievement
        // Use setTimeout to ensure toast appears after state update cycle
        setTimeout(() => {
          toast(achievement.name, {
            description: achievement.description,
            icon: achievement.icon,
          });
        }, 0);
      }

      // Update the array
      const updatedAchievements = [...achievements];
      if (isNew) {
        updatedAchievements.push(achievement);
      } else if (achievementIndex !== -1) {
        // Only update if something changed
        if (JSON.stringify(updatedAchievements[achievementIndex]) !== JSON.stringify(achievement)) {
          updatedAchievements[achievementIndex] = achievement;
        }
      }

      // Only return a new object if achievements actually changed
      if (JSON.stringify(prev.achievements) !== JSON.stringify(updatedAchievements)) {
        return { ...prev, achievements: updatedAchievements };
      }

      return prev; // Return previous state if no changes
    });
  };

  // Track quiz creation
  const trackQuizCreated = () => {
    const newlyEarnedAchievements: UserAchievement[] = []; // Use const

    setUserProfile(prev => {
      const updatedQuizStats = {
        ...prev.quizStats,
        created: prev.quizStats.created + 1
      };

      let currentAchievements = [...prev.achievements];
      let updateResult;

      // Quiz Creator (1 quiz)
      updateResult = updateAchievementStatus(currentAchievements, 'quiz-creator', updatedQuizStats.created >= 1, updatedQuizStats.created, 1);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Quiz Master (5 quizzes)
      updateResult = updateAchievementStatus(currentAchievements, 'quiz-master', updatedQuizStats.created >= 5, updatedQuizStats.created, 5);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Quiz Genius (15 quizzes)
      updateResult = updateAchievementStatus(currentAchievements, 'quiz-genius', updatedQuizStats.created >= 15, updatedQuizStats.created, 15);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Quiz Champion (25 quizzes)
      updateResult = updateAchievementStatus(currentAchievements, 'quiz-champion', updatedQuizStats.created >= 25, updatedQuizStats.created, 25);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Check combined achievements synchronously
      const { flashcardStats } = prev; // Use prev state for flashcard stats
      // Quiz and Flashcard Combo
      const hasCombo = updatedQuizStats.created >= 3 && flashcardStats.created >= 3;
      updateResult = updateAchievementStatus(currentAchievements, 'quiz-and-flashcard-combo', hasCombo);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Knowledge Curator
      const totalItems = updatedQuizStats.created + flashcardStats.created;
      updateResult = updateAchievementStatus(currentAchievements, 'knowledge-curator', totalItems >= 25, totalItems, 25);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      return {
        ...prev,
        quizStats: updatedQuizStats,
        achievements: currentAchievements
      };
    });

    // Handle notifications after state update
    if (newlyEarnedAchievements.length > 0) {
      setTimeout(() => {
        newlyEarnedAchievements.forEach(achievement => {
          toast(achievement.name, {
            description: achievement.description,
            icon: achievement.icon,
          });
        });
      }, 0);
    }
  };

  // Track quiz taking with score
  const trackQuizTaken = (score: number) => {
    const newlyEarnedAchievements: UserAchievement[] = []; // Use const

    setUserProfile(prev => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const lastQuizDate = prev.quizStats.lastQuizDate;

      // Check if we should increment streak
      let streakDays = prev.quizStats.streakDays;

      if (!lastQuizDate) {
        // First quiz ever
        streakDays = 1;
      } else {
        const lastDate = new Date(lastQuizDate);
        const lastDay = lastDate.toISOString().split('T')[0];

        if (lastDay !== today) {
          const dayDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          if (dayDiff === 1) {
            // Consecutive day
            streakDays += 1;
          } else if (dayDiff > 1) {
            // Streak broken
            streakDays = 1;
          }
          // If lastDay === today, streak doesn't change
        }
      }

      const updatedQuizStats = {
        ...prev.quizStats,
        taken: prev.quizStats.taken + 1,
        lastQuizDate: now.toISOString(),
        streakDays,
        perfectScores: score === 100 ? prev.quizStats.perfectScores + 1 : prev.quizStats.perfectScores
      };

      let currentAchievements = [...prev.achievements];
      let updateResult;

      // Quiz Taker (1 quiz)
      updateResult = updateAchievementStatus(currentAchievements, 'quiz-taker', updatedQuizStats.taken >= 1, updatedQuizStats.taken, 1);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Quiz Enthusiast (10 quizzes)
      updateResult = updateAchievementStatus(currentAchievements, 'quiz-enthusiast', updatedQuizStats.taken >= 10, updatedQuizStats.taken, 10);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Quiz Aficionado (25 quizzes)
      updateResult = updateAchievementStatus(currentAchievements, 'quiz-aficionado', updatedQuizStats.taken >= 25, updatedQuizStats.taken, 25);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Quiz Legend (50 quizzes)
      updateResult = updateAchievementStatus(currentAchievements, 'quiz-legend', updatedQuizStats.taken >= 50, updatedQuizStats.taken, 50);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Perfect Score
      updateResult = updateAchievementStatus(currentAchievements, 'perfect-score', updatedQuizStats.perfectScores >= 1, updatedQuizStats.perfectScores, 1);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Quiz Streak (5 consecutive days)
      updateResult = updateAchievementStatus(currentAchievements, 'quiz-streak', updatedQuizStats.streakDays >= 5, updatedQuizStats.streakDays, 5);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Combined achievements don't need re-checking here as they depend on creation counts

      return {
        ...prev,
        quizStats: updatedQuizStats,
        achievements: currentAchievements
      };
    });

    // Handle notifications after state update
    if (newlyEarnedAchievements.length > 0) {
      setTimeout(() => {
        newlyEarnedAchievements.forEach(achievement => {
          toast(achievement.name, {
            description: achievement.description,
            icon: achievement.icon,
          });
        });
      }, 0);
    }
  };

  // Track flashcard creation
  const trackFlashcardCreated = (count: number = 1) => {
    const newlyEarnedAchievements: UserAchievement[] = []; // Use const

    setUserProfile(prev => {
      const updatedFlashcardStats = {
        ...prev.flashcardStats,
        created: prev.flashcardStats.created + count
      };

      let currentAchievements = [...prev.achievements];
      let updateResult;

      // Flashcard Beginner (1 set)
      updateResult = updateAchievementStatus(currentAchievements, 'flashcard-beginner', updatedFlashcardStats.created >= 1, updatedFlashcardStats.created, 1);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Flashcard Creator (5 sets)
      updateResult = updateAchievementStatus(currentAchievements, 'flashcard-creator', updatedFlashcardStats.created >= 5, updatedFlashcardStats.created, 5);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Flashcard Expert (15 sets)
      updateResult = updateAchievementStatus(currentAchievements, 'flashcard-expert', updatedFlashcardStats.created >= 15, updatedFlashcardStats.created, 15);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Check combined achievements synchronously
      const { quizStats } = prev; // Use prev state for quiz stats
      // Quiz and Flashcard Combo
      const hasCombo = quizStats.created >= 3 && updatedFlashcardStats.created >= 3;
      updateResult = updateAchievementStatus(currentAchievements, 'quiz-and-flashcard-combo', hasCombo);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Knowledge Curator
      const totalItems = quizStats.created + updatedFlashcardStats.created;
      updateResult = updateAchievementStatus(currentAchievements, 'knowledge-curator', totalItems >= 25, totalItems, 25);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      return {
        ...prev,
        flashcardStats: updatedFlashcardStats,
        achievements: currentAchievements
      };
    });

    // Handle notifications after state update
    if (newlyEarnedAchievements.length > 0) {
      setTimeout(() => {
        newlyEarnedAchievements.forEach(achievement => {
          toast(achievement.name, {
            description: achievement.description,
            icon: achievement.icon,
          });
        });
      }, 0);
    }
  };

  // Track flashcard study sessions
  const trackFlashcardStudy = (cardsStudied: number, accuracy?: number) => {
    const newlyEarnedAchievements: UserAchievement[] = []; // Use const

    setUserProfile(prev => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const lastStudyDate = prev.flashcardStats.lastStudyDate;

      // Count unique study days
      let studyDays = prev.flashcardStats.studyDays;
      if (!lastStudyDate || !lastStudyDate.includes(today)) {
        studyDays += 1;
      }

      // Track largest session
      const cardsInLargestSession = Math.max(prev.flashcardStats.cardsInLargestSession, cardsStudied);

      // Track highest accuracy if provided
      const highestAccuracy = accuracy !== undefined
        ? Math.max(prev.flashcardStats.highestAccuracy, accuracy)
        : prev.flashcardStats.highestAccuracy;

      const updatedFlashcardStats = {
        ...prev.flashcardStats,
        studySessions: prev.flashcardStats.studySessions + 1,
        studyDays,
        cardsInLargestSession,
        highestAccuracy,
        lastStudyDate: now.toISOString()
      };

      let currentAchievements = [...prev.achievements];
      let updateResult;

      // Memory Master (10 days)
      updateResult = updateAchievementStatus(currentAchievements, 'memory-master', updatedFlashcardStats.studyDays >= 10, updatedFlashcardStats.studyDays, 10);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Flashcard Scholar (20 sessions)
      updateResult = updateAchievementStatus(currentAchievements, 'flashcard-scholar', updatedFlashcardStats.studySessions >= 20, updatedFlashcardStats.studySessions, 20);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Recall Champion (90% accuracy) - Check only if accuracy was provided
      if (accuracy !== undefined) {
        updateResult = updateAchievementStatus(currentAchievements, 'recall-champion', updatedFlashcardStats.highestAccuracy >= 90, updatedFlashcardStats.highestAccuracy, 90);
        currentAchievements = updateResult.updatedAchievements;
        if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);
      }

      // Spaced Repetition Expert (15 days)
      updateResult = updateAchievementStatus(currentAchievements, 'spaced-repetition-expert', updatedFlashcardStats.studyDays >= 15, updatedFlashcardStats.studyDays, 15);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Flashcard Marathon (100+ cards)
      updateResult = updateAchievementStatus(currentAchievements, 'flashcard-marathon', updatedFlashcardStats.cardsInLargestSession >= 100, updatedFlashcardStats.cardsInLargestSession, 100);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Combined achievements don't need re-checking here

      return {
        ...prev,
        flashcardStats: updatedFlashcardStats,
        achievements: currentAchievements
      };
    });

    // Handle notifications after state update
    if (newlyEarnedAchievements.length > 0) {
      setTimeout(() => {
        newlyEarnedAchievements.forEach(achievement => {
          toast(achievement.name, {
            description: achievement.description,
            icon: achievement.icon,
          });
        });
      }, 0);
    }
  };

  // Track when a task is completed
  const trackTaskCompleted = (taskText: string) => {
    const newlyEarnedAchievements: UserAchievement[] = []; // Use const
    setUserProfile(prev => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const lastTaskDate = prev.taskStats.lastTaskDate;

      // Check if we're in a new day and reset daily counters if needed
      const isNewDay = !lastTaskDate || !lastTaskDate.includes(today);

      // Extract a potential subject/category from the task text
      const subject = taskText.trim().split(' ')[0].toLowerCase();

      // Check if we need to reset weekly or monthly counters
      let tasksCompletedThisWeek = prev.taskStats.tasksCompletedThisWeek;
      let tasksCompletedThisMonth = prev.taskStats.tasksCompletedThisMonth;

      if (lastTaskDate) {
        const lastDate = new Date(lastTaskDate);
        const currentWeek = getWeekNumber(now);
        const lastWeek = getWeekNumber(lastDate);
        const currentMonth = now.getMonth();
        const lastMonth = lastDate.getMonth();

        // Reset weekly count if we're in a new week
        if (currentWeek !== lastWeek) {
          tasksCompletedThisWeek = 0;
        }

        // Reset monthly count if we're in a new month
        if (currentMonth !== lastMonth) {
          tasksCompletedThisMonth = 0;
        }
      }

      // Update task stats
      const updatedTaskStats = {
        completed: prev.taskStats.completed + 1,
        tasksCompletedToday: isNewDay ? 1 : prev.taskStats.tasksCompletedToday + 1,
        tasksCompletedThisWeek: tasksCompletedThisWeek + 1,
        tasksCompletedThisMonth: tasksCompletedThisMonth + 1,
        lastTaskDate: now.toISOString(),
        tasksInPomodoro: prev.taskStats.tasksInPomodoro + 1,
        tasksInPomodoroTimestamp: prev.taskStats.tasksInPomodoroTimestamp || now.toISOString(),
        uniqueSubjectsToday: isNewDay ?
          [subject] :
          [...new Set([...prev.taskStats.uniqueSubjectsToday, subject])],
      };

      // --- Synchronously update achievements ---
      let currentAchievements = [...prev.achievements]; // Start with previous achievements
      const newlyEarnedAchievements: UserAchievement[] = []; // Track newly earned

      // Helper function to update achievement status synchronously
      // (Returns updated array and any newly earned achievement for notification)
      const updateAchievementStatus = (
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
          achievement = { ...currentAchievement }; // Clone to avoid direct mutation
          if (progressValue !== undefined) achievement.progress = progressValue;
          if (totalValue !== undefined) achievement.total = totalValue;
        }

        // Check if newly earned
        if (!achievement.earned && condition) {
          achievement.earned = true;
          achievement.dateEarned = new Date().toISOString();
          newlyEarned = achievement; // Mark as newly earned
        }

        // Update the array
        const updatedAchievements = [...achievements]; // Clone the array
        if (isNew) {
          updatedAchievements.push(achievement);
        } else if (achievementIndex !== -1) {
          // Only update if something changed or if it was newly earned
          if (JSON.stringify(updatedAchievements[achievementIndex]) !== JSON.stringify(achievement)) {
            updatedAchievements[achievementIndex] = achievement;
          }
        }

        return { updatedAchievements, newlyEarned };
      };

      // --- Apply updates for each task-related achievement ---
      let updateResult;

      // Task Master
      updateResult = updateAchievementStatus(currentAchievements, 'task-master', updatedTaskStats.tasksCompletedThisWeek >= 10, updatedTaskStats.tasksCompletedThisWeek, 10);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Quick Study
      updateResult = updateAchievementStatus(currentAchievements, 'quick-study', updatedTaskStats.tasksInPomodoro >= 3, updatedTaskStats.tasksInPomodoro, 3);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Task Titan
      updateResult = updateAchievementStatus(currentAchievements, 'task-titan', updatedTaskStats.tasksCompletedThisMonth >= 50, updatedTaskStats.tasksCompletedThisMonth, 50);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Task Juggler
      updateResult = updateAchievementStatus(currentAchievements, 'task-juggler', updatedTaskStats.uniqueSubjectsToday.length >= 3, updatedTaskStats.uniqueSubjectsToday.length, 3);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Task Completionist
      updateResult = updateAchievementStatus(currentAchievements, 'task-completionist', updatedTaskStats.tasksCompletedThisMonth >= 75, updatedTaskStats.tasksCompletedThisMonth, 75);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Task Mastery
      const tasksPerQuarter = Math.floor(updatedTaskStats.completed / 4);
      updateResult = updateAchievementStatus(currentAchievements, 'task-mastery', tasksPerQuarter >= 200, tasksPerQuarter, 200);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Task Grandmaster
      const tasksPerSemester = Math.floor(updatedTaskStats.completed / 2);
      updateResult = updateAchievementStatus(currentAchievements, 'task-grandmaster', tasksPerSemester >= 300, tasksPerSemester, 300);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Task Legend
      updateResult = updateAchievementStatus(currentAchievements, 'task-legend', updatedTaskStats.completed >= 500, updatedTaskStats.completed, 500);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // Task Icon
      updateResult = updateAchievementStatus(currentAchievements, 'task-icon', updatedTaskStats.completed >= 700, updatedTaskStats.completed, 700);
      currentAchievements = updateResult.updatedAchievements;
      if (updateResult.newlyEarned) newlyEarnedAchievements.push(updateResult.newlyEarned);

      // --- Handle notifications for newly earned achievements ---
      if (newlyEarnedAchievements.length > 0) {
        // Use setTimeout to ensure toasts appear after the state update cycle
        setTimeout(() => {
          newlyEarnedAchievements.forEach(achievement => {
            toast(achievement.name, {
              description: achievement.description,
              icon: achievement.icon,
            });
          });
        }, 0);
      }

      // --- Return the final updated state ---
      return {
        ...prev,
        taskStats: updatedTaskStats,
        achievements: currentAchievements // Assign the synchronously updated array
      };
    });
  };

  // Track when a task is created (for potential future achievements)
  const trackTaskCreated = () => {
    // Currently, we don't need to track task creation for achievements,
    // but we keep this method for future expansion
  };

  // Reset the count of tasks completed within the current Pomodoro session
  const resetTasksInPomodoro = () => {
    setUserProfile(prev => ({
      ...prev,
      taskStats: {
        ...prev.taskStats,
        tasksInPomodoro: 0,
        tasksInPomodoroTimestamp: null
      }
    }));
  };

  // Helper function to get the ISO week number of a date
  const getWeekNumber = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const value = {
    userProfile,
    updateUserName,
    updateUserXP,
    updateMinutesStudied,
    updateBestStreak,
    updateProfilePicture,
    getTimeBasedGreeting,
    getUserLevel,
    getLevelProgress,
    markFirstVisitComplete,
    trackQuizCreated, // Updated function
    trackQuizTaken, // Updated function
    trackFlashcardCreated, // Updated function
    trackFlashcardStudy, // Updated function
    trackTaskCompleted, // Existing correct function
    trackTaskCreated,
    resetTasksInPomodoro,
    checkAndUpdateAchievement // Keep original for Pomodoro/other uses if needed, but prefer updateAchievementStatus internally
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};