import { createContext } from 'react';
import { UserProfile, UserLevel, QuizStats, FlashcardStats, TaskStats } from './userProfileConstants';

export interface UserProfileContextType {
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

// Create the context
export const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);
