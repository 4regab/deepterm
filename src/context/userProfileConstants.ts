// src/context/userProfileConstants.ts

// Types for user achievements, badges, and levels
export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  dateEarned?: string;
  criteria: string;
  icon: string;
  background?: string; // Adding the missing background property
  progress?: number; // Track progress towards completing an achievement
  total?: number; // Total needed to complete an achievement
}

// Adding interfaces for quiz, flashcard, and task tracking
export interface QuizStats {
  created: number;
  taken: number;
  perfectScores: number;
  streakDays: number;
  lastQuizDate: string | null;
}

export interface FlashcardStats {
  created: number;
  studyDays: number;
  studySessions: number;
  highestAccuracy: number;
  cardsInLargestSession: number;
  lastStudyDate: string | null;
}

export interface TaskStats {
  completed: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  lastTaskDate: string | null;
  tasksInPomodoro: number; // For tracking tasks completed in a single Pomodoro
  tasksInPomodoroTimestamp: string | null; // When the last Pomodoro task was recorded
  uniqueSubjectsToday: string[]; // Track unique subjects/categories of tasks for task-juggler achievement
}

export interface UserLevel {
  level: number;
  title: string;
  requiredXP: number;
  message: string;
}

export interface UserProfile {
  name: string;
  xp: number; // Experience points
  minutesStudied: number; // Track partial minutes separately for granular updates
  level: number;
  bestStreak: number;
  achievements: UserAchievement[];
  firstVisit: boolean; // Changed from 'true' to 'boolean'
  lastVisited: string | null;
  profilePicture: string | null; // Add field for profile picture data URL
  quizStats: QuizStats; // Add quiz statistics
  flashcardStats: FlashcardStats; // Add flashcard statistics
  pomodoroSessionsCompleted: number; // Track completed Pomodoro sessions
  taskStats: TaskStats; // Add task statistics
}

// Create the complete 100 level system as specified in info.txt
export const LEVEL_DATA: UserLevel[] = [
  { level: 1, title: "Novice", requiredXP: 0, message: "Congratulations! You've reached the 'Novice' level. Keep studying to level up!" }, // XP starts at 0 for level 1
  { level: 2, title: "Novice", requiredXP: 20, message: "Great job! You've reached Level 2. Keep up the good work!" },
  { level: 3, title: "Novice", requiredXP: 40, message: "You've reached Level 3. Keep pushing forward!" },
  { level: 4, title: "Novice", requiredXP: 60, message: "You've reached Level 4. Keep studying to reach even higher levels!" },
  { level: 5, title: "Novice", requiredXP: 80, message: "You've reached Level 5. Keep going!" },
  { level: 6, title: "Novice", requiredXP: 100, message: "You've reached Level 6. Keep up the great work!" },
  { level: 7, title: "Novice", requiredXP: 120, message: "You've reached Level 7. Keep pushing forward!" },
  { level: 8, title: "Novice", requiredXP: 140, message: "You've reached Level 8. Keep studying to reach even higher levels!" },
  { level: 9, title: "Novice", requiredXP: 160, message: "You've reached Level 9. Keep going!" },
  { level: 10, title: "Scholar", requiredXP: 180, message: "You've reached the 'Scholar' level. Keep up the great work!" }, // 200 XP = 20 hours
  { level: 11, title: "Scholar", requiredXP: 200, message: "You've reached Level 11. Keep pushing forward!" }, // Corrected XP based on 20 XP increments
  { level: 12, title: "Scholar", requiredXP: 220, message: "You've reached Level 12. Keep studying to reach even higher levels!" },
  { level: 13, title: "Scholar", requiredXP: 240, message: "You've reached Level 13. Keep going!" },
  { level: 14, title: "Scholar", requiredXP: 260, message: "You've reached Level 14. Keep up the great work!" },
  { level: 15, title: "Scholar", requiredXP: 280, message: "You've reached Level 15. Keep pushing forward!" },
  { level: 16, title: "Scholar", requiredXP: 300, message: "You've reached Level 16. Keep studying to reach even higher levels!" },
  { level: 17, title: "Scholar", requiredXP: 320, message: "You've reached Level 17. Keep going!" },
  { level: 18, title: "Scholar", requiredXP: 340, message: "You've reached Level 18. Keep up the great work!" },
  { level: 19, title: "Scholar", requiredXP: 360, message: "You've reached Level 19. Keep pushing forward!" },
  { level: 20, title: "Savant", requiredXP: 380, message: "You've reached the 'Savant' level. Keep studying to reach even higher levels!" }, // 400 XP = 40 hours
  { level: 21, title: "Savant", requiredXP: 400, message: "You've reached Level 21. Keep going!" },
  { level: 22, title: "Savant", requiredXP: 420, message: "You've reached Level 22. Keep up the great work!" },
  { level: 23, title: "Savant", requiredXP: 440, message: "You've reached Level 23. Keep pushing forward!" },
  { level: 24, title: "Savant", requiredXP: 460, message: "You've reached Level 24. Keep studying to reach even higher levels!" },
  { level: 25, title: "Savant", requiredXP: 480, message: "You've reached Level 25. Keep going!" },
  { level: 26, title: "Savant", requiredXP: 500, message: "You've reached Level 26. Keep up the great work!" },
  { level: 27, title: "Savant", requiredXP: 520, message: "You've reached Level 27. Keep pushing forward!" },
  { level: 28, title: "Savant", requiredXP: 540, message: "You've reached Level 28. Keep studying to reach even higher levels!" },
  { level: 29, title: "Savant", requiredXP: 560, message: "You've reached Level 29. Keep going!" },
  { level: 30, title: "Virtuoso", requiredXP: 580, message: "You've reached the 'Virtuoso' level. Keep up the great work!" }, // 600 XP = 60 hours
  { level: 31, title: "Virtuoso", requiredXP: 600, message: "You've reached Level 31. Keep pushing forward!" },
  { level: 32, title: "Virtuoso", requiredXP: 620, message: "You've reached Level 32. Keep studying to reach even higher levels!" },
  { level: 33, title: "Virtuoso", requiredXP: 640, message: "You've reached Level 33. Keep going!" },
  { level: 34, title: "Virtuoso", requiredXP: 660, message: "You've reached Level 34. Keep up the great work!" },
  { level: 35, title: "Virtuoso", requiredXP: 680, message: "You've reached Level 35. Keep pushing forward!" },
  { level: 36, title: "Virtuoso", requiredXP: 700, message: "You've reached Level 36. Keep studying to reach even higher levels!" },
  { level: 37, title: "Virtuoso", requiredXP: 720, message: "You've reached Level 37. Keep going!" },
  { level: 38, title: "Virtuoso", requiredXP: 740, message: "You've reached Level 38. Keep up the great work!" },
  { level: 39, title: "Virtuoso", requiredXP: 760, message: "You've reached Level 39. Keep pushing forward!" },
  { level: 40, title: "Prodigy", requiredXP: 780, message: "You've reached the 'Prodigy' level. Keep studying to reach even higher levels!" }, // 800 XP = 80 hours
  { level: 41, title: "Prodigy", requiredXP: 800, message: "You've reached Level 41. Keep going!" },
  { level: 42, title: "Prodigy", requiredXP: 820, message: "You've reached Level 42. Keep up the great work!" },
  { level: 43, title: "Prodigy", requiredXP: 840, message: "You've reached Level 43. Keep pushing forward!" },
  { level: 44, title: "Prodigy", requiredXP: 860, message: "You've reached Level 44. Keep studying to reach even higher levels!" },
  { level: 45, title: "Prodigy", requiredXP: 880, message: "You've reached Level 45. Keep going!" },
  { level: 46, title: "Prodigy", requiredXP: 900, message: "You've reached Level 46. Keep up the great work!" },
  { level: 47, title: "Prodigy", requiredXP: 920, message: "You've reached Level 47. Keep pushing forward!" },
  { level: 48, title: "Prodigy", requiredXP: 940, message: "You've reached Level 48. Keep studying to reach even higher levels!" },
  { level: 49, title: "Prodigy", requiredXP: 960, message: "You've reached Level 49. Keep going!" },
  { level: 50, title: "Polymath", requiredXP: 980, message: "You've reached the 'Polymath' level. Keep up the great work!" }, // 1000 XP = 100 hours
  { level: 51, title: "Polymath", requiredXP: 1000, message: "You've reached Level 51. Keep pushing forward!" },
  { level: 52, title: "Polymath", requiredXP: 1020, message: "You've reached Level 52. Keep studying to reach even higher levels!" },
  { level: 53, title: "Polymath", requiredXP: 1040, message: "You've reached Level 53. Keep going!" },
  { level: 54, title: "Polymath", requiredXP: 1060, message: "You've reached Level 54. Keep up the great work!" },
  { level: 55, title: "Polymath", requiredXP: 1080, message: "You've reached Level 55. Keep pushing forward!" },
  { level: 56, title: "Polymath", requiredXP: 1100, message: "You've reached Level 56. Keep studying to reach even higher levels!" },
  { level: 57, title: "Polymath", requiredXP: 1120, message: "You've reached Level 57. Keep going!" },
  { level: 58, title: "Polymath", requiredXP: 1140, message: "You've reached Level 58. Keep up the great work!" },
  { level: 59, title: "Polymath", requiredXP: 1160, message: "You've reached Level 59. Keep pushing forward!" },
  { level: 60, title: "Luminary", requiredXP: 1180, message: "You've reached the 'Luminary' level. Keep studying to reach even higher levels!" }, // 1200 XP = 120 hours
  { level: 61, title: "Luminary", requiredXP: 1200, message: "You've reached Level 61. Keep going!" },
  { level: 62, title: "Luminary", requiredXP: 1220, message: "You've reached Level 62. Keep up the great work!" },
  { level: 63, title: "Luminary", requiredXP: 1240, message: "You've reached Level 63. Keep pushing forward!" },
  { level: 64, title: "Luminary", requiredXP: 1260, message: "You've reached Level 64. Keep studying to reach even higher levels!" },
  { level: 65, title: "Luminary", requiredXP: 1280, message: "You've reached Level 65. Keep going!" },
  { level: 66, title: "Luminary", requiredXP: 1300, message: "You've reached Level 66. Keep up the great work!" },
  { level: 67, title: "Luminary", requiredXP: 1320, message: "You've reached Level 67. Keep pushing forward!" },
  { level: 68, title: "Luminary", requiredXP: 1340, message: "You've reached Level 68. Keep studying to reach even higher levels!" },
  { level: 69, title: "Luminary", requiredXP: 1360, message: "You've reached Level 69. Keep going!" },
  { level: 70, title: "Sage", requiredXP: 1380, message: "You've reached the 'Sage' level. Keep up the great work!" }, // 1400 XP = 140 hours
  { level: 71, title: "Sage", requiredXP: 1400, message: "You've reached Level 71. Keep pushing forward!" },
  { level: 72, title: "Sage", requiredXP: 1420, message: "You've reached Level 72. Keep studying to reach even higher levels!" },
  { level: 73, title: "Sage", requiredXP: 1440, message: "You've reached Level 73. Keep going!" },
  { level: 74, title: "Sage", requiredXP: 1460, message: "You've reached Level 74. Keep up the great work!" },
  { level: 75, title: "Sage", requiredXP: 1480, message: "You've reached Level 75. Keep pushing forward!" },
  { level: 76, title: "Sage", requiredXP: 1500, message: "You've reached Level 76. Keep studying to reach even higher levels!" },
  { level: 77, title: "Sage", requiredXP: 1520, message: "You've reached Level 77. Keep going!" },
  { level: 78, title: "Sage", requiredXP: 1540, message: "You've reached Level 78. Keep up the great work!" },
  { level: 79, title: "Sage", requiredXP: 1560, message: "You've reached Level 79. Keep pushing forward!" },
  { level: 80, title: "Visionary", requiredXP: 1580, message: "You've reached the 'Visionary' level. Keep studying to reach even higher levels!" }, // 1600 XP = 160 hours
  { level: 81, title: "Visionary", requiredXP: 1600, message: "You've reached Level 81. Keep going!" },
  { level: 82, title: "Visionary", requiredXP: 1620, message: "You've reached Level 82. Keep up the great work!" },
  { level: 83, title: "Visionary", requiredXP: 1640, message: "You've reached Level 83. Keep pushing forward!" },
  { level: 84, title: "Visionary", requiredXP: 1660, message: "You've reached Level 84. Keep studying to reach even higher levels!" },
  { level: 85, title: "Visionary", requiredXP: 1680, message: "You've reached Level 85. Keep going!" },
  { level: 86, title: "Visionary", requiredXP: 1700, message: "You've reached Level 86. Keep up the great work!" },
  { level: 87, title: "Visionary", requiredXP: 1720, message: "You've reached Level 87. Keep pushing forward!" },
  { level: 88, title: "Visionary", requiredXP: 1740, message: "You've reached Level 88. Keep studying to reach even higher levels!" },
  { level: 89, title: "Visionary", requiredXP: 1760, message: "You've reached Level 89. Keep going!" },
  { level: 90, title: "Genius", requiredXP: 1780, message: "You've reached the 'Genius' level. Keep up the great work!" }, // 1800 XP = 180 hours
  { level: 91, title: "Genius", requiredXP: 1800, message: "You've reached Level 91. Keep pushing forward!" },
  { level: 92, title: "Genius", requiredXP: 1820, message: "You've reached Level 92. Keep studying to reach even higher levels!" },
  { level: 93, title: "Genius", requiredXP: 1840, message: "You've reached Level 93. Keep going!" },
  { level: 94, title: "Genius", requiredXP: 1860, message: "You've reached Level 94. Keep up the great work!" },
  { level: 95, title: "Genius", requiredXP: 1880, message: "You've reached Level 95. Keep pushing forward!" },
  { level: 96, title: "Genius", requiredXP: 1900, message: "You've reached Level 96. Keep studying to reach even higher levels!" },
  { level: 97, title: "Genius", requiredXP: 1920, message: "You've reached Level 97. Keep going!" },
  { level: 98, title: "Genius", requiredXP: 1940, message: "You've reached Level 98. Keep up the great work!" },
  { level: 99, title: "Genius", requiredXP: 1960, message: "You've reached Level 99. Keep pushing forward!" },
  { level: 100, title: "Legend", requiredXP: 1980, message: "You've reached the 'Legend' level. Congratulations on your incredible achievement!" } // 2000 XP = 200 hours
];

// Achievement badges data - expanded based on info.txt requirements
export const ACHIEVEMENT_BADGES: UserAchievement[] = [
  {
    id: "first-timer",
    name: "First Timer",
    description: "Awarded for completing your first Pomodoro session.",
    criteria: "Complete 1 Pomodoro session.",
    icon: "🎯",
    earned: false,
    total: 1
  },
  {
    id: "daily-dedication",
    name: "Daily Dedication",
    description: "Awarded for completing Pomodoro sessions on consecutive days.",
    criteria: "Complete 1 Pomodoro session for 3 consecutive days.",
    icon: "📆",
    earned: false,
    total: 3
  },
  {
    id: "task-master",
    name: "Task Master",
    description: "Awarded for completing a set number of tasks within a week.",
    criteria: "Complete 10 tasks within a week.",
    icon: "✓",
    earned: false,
    total: 10
  },
  {
    id: "quick-study",
    name: "Quick Study",
    description: "Awarded for completing tasks efficiently.",
    criteria: "Complete 3 tasks within a single Pomodoro session.",
    icon: "⚡",
    earned: false,
    total: 3
  },
  {
    id: "study-streak",
    name: "Study Streak",
    description: "Awarded for maintaining a short study streak.",
    criteria: "Complete 1 Pomodoro session for 5 consecutive days.",
    icon: "🔥",
    earned: false,
    total: 5
  },
  {
    id: "morning-glory",
    name: "Morning Glory",
    description: "Awarded for starting your Pomodoro sessions in the morning.",
    criteria: "Start a Pomodoro session before 9 AM.",
    icon: "🌅",
    earned: false,
    total: 1
  },
  {
    id: "night-scholar",
    name: "Night Scholar",
    description: "Awarded for completing Pomodoro sessions in the evening.",
    criteria: "Complete a Pomodoro session after 7 PM.",
    icon: "🌃",
    earned: false,
    total: 1
  },
  {
    id: "weekly-warrior",
    name: "Weekly Warrior",
    description: "Awarded for maintaining a consistent study schedule for a week.",
    criteria: "Complete at least 1 Pomodoro session every day for a week.",
    icon: "🗓️",
    earned: false,
    total: 7
  },
  {
    id: "break-champion",
    name: "Break Champion",
    description: "Awarded for taking regular breaks during Pomodoro sessions.",
    criteria: "Take a break after every Pomodoro session for 3 consecutive days.",
    icon: "☕",
    earned: false,
    total: 3
  },
  {
    id: "focus-ninja",
    name: "Focus Ninja",
    description: "Awarded for completing multiple Pomodoro sessions in a single day.",
    criteria: "Complete 3 Pomodoro sessions in one day.",
    icon: "🥷",
    earned: false,
    total: 3
  },
  {
    id: "study-hour-hero",
    name: "Study Hour Hero",
    description: "Awarded for accumulating a certain number of study hours.",
    criteria: "Complete 5 hours of study using the Pomodoro technique.",
    icon: "🕐",
    earned: false,
    total: 5
  },
  {
    id: "milestone-reacher",
    name: "Milestone Reacher",
    description: "Awarded for reaching a significant milestone in your study journey.",
    criteria: "Complete 25 Pomodoro sessions.",
    icon: "🏁",
    earned: false,
    total: 25
  },
  {
    id: "productivity-star",
    name: "Productivity Star",
    description: "Awarded for maintaining high productivity over a short period.",
    criteria: "Complete 50 Pomodoro sessions.",
    icon: "⭐",
    earned: false,
    total: 50
  },
  {
    id: "study-sprint",
    name: "Study Sprint",
    description: "Awarded for completing a large number of Pomodoro sessions in a short period.",
    criteria: "Complete 5 Pomodoro sessions in a single day.",
    icon: "🏃",
    earned: false,
    total: 5
  },
  {
    id: "time-manager",
    name: "Time Manager",
    description: "Awarded for efficiently managing your study time.",
    criteria: "Complete 10 Pomodoro sessions with no missed days.",
    icon: "⏱️",
    earned: false,
    total: 10
  },
  {
    id: "consistency-king",
    name: "Consistency King",
    description: "Awarded for maintaining a consistent study schedule over a longer period.",
    criteria: "Complete at least 1 Pomodoro session every day for two weeks.",
    icon: "👑",
    earned: false,
    total: 14
  },
  {
    id: "task-titan",
    name: "Task Titan",
    description: "Awarded for completing a large number of tasks within a month.",
    criteria: "Complete 50 tasks within a month.",
    icon: "🏆",
    earned: false,
    total: 50
  },
  {
    id: "early-riser",
    name: "Early Riser",
    description: "Awarded for starting your Pomodoro sessions very early in the morning.",
    criteria: "Start a Pomodoro session before 7 AM.",
    icon: "🌄",
    earned: false,
    total: 1
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Awarded for completing Pomodoro sessions late at night.",
    criteria: "Complete a Pomodoro session after 10 PM.",
    icon: "🦉",
    earned: false,
    total: 1
  },
  {
    id: "study-marathoner",
    name: "Study Marathoner",
    description: "Awarded for accumulating a significant number of study hours.",
    criteria: "Complete 20 hours of study using the Pomodoro technique.",
    icon: "🏃‍♀️",
    earned: false,
    total: 20
  },
  {
    id: "task-juggler",
    name: "Task Juggler",
    description: "Awarded for completing tasks across multiple subjects in a day.",
    criteria: "Complete tasks in 3 different subjects within a single day.",
    icon: "🤹",
    earned: false,
    total: 3
  },
  {
    id: "study-stamina",
    name: "Study Stamina",
    description: "Awarded for maintaining a study streak over a month.",
    criteria: "Complete 1 Pomodoro session every day for a month.",
    icon: "💪",
    earned: false,
    total: 30
  },
  {
    id: "focus-master",
    name: "Focus Master",
    description: "Awarded for completing a high number of Pomodoro sessions in a single day.",
    criteria: "Complete 7 Pomodoro sessions in one day.",
    icon: "🧘",
    earned: false,
    total: 7
  },
  {
    id: "study-hour-champion",
    name: "Study Hour Champion",
    description: "Awarded for accumulating a large number of study hours.",
    criteria: "Complete 50 hours of study using the Pomodoro technique.",
    icon: "🏅",
    earned: false,
    total: 50
  },
  {
    id: "task-completionist",
    name: "Task Completionist",
    description: "Awarded for completing a very large number of tasks within a month.",
    criteria: "Complete 75 tasks within a month.",
    icon: "✅",
    earned: false,
    total: 75
  },
  {
    id: "study-guru",
    name: "Study Guru",
    description: "Awarded for reaching an advanced level of study achievement.",
    criteria: "Complete 100 Pomodoro sessions.",
    icon: "🧠",
    earned: false,
    total: 100
  },
  {
    id: "study-legend",
    name: "Study Legend",
    description: "Awarded for reaching a high level of achievement in your study journey.",
    criteria: "Complete 150 Pomodoro sessions.",
    icon: "🌟",
    earned: false,
    total: 150
  },
  {
    id: "study-hero",
    name: "Study Hero",
    description: "Awarded for accumulating an impressive number of study hours.",
    criteria: "Complete 100 hours of study using the Pomodoro technique.",
    icon: "🦸",
    earned: false,
    total: 100
  },
  {
    id: "task-mastery",
    name: "Task Mastery",
    description: "Awarded for completing a very large number of tasks within a quarter.",
    criteria: "Complete 200 tasks within a quarter.",
    icon: "🎖️",
    earned: false,
    total: 200
  },
  {
    id: "study-champion",
    name: "Study Champion",
    description: "Awarded for maintaining a consistent study schedule over a quarter.",
    criteria: "Complete at least 1 Pomodoro session every day for a quarter.",
    icon: "🏵️",
    earned: false,
    total: 90
  },
  {
    id: "study-superstar",
    name: "Study Superstar",
    description: "Awarded for reaching an elite level of study achievement.",
    criteria: "Complete 200 Pomodoro sessions.",
    icon: "⭐",
    earned: false,
    total: 200
  },
  {
    id: "study-hour-titan",
    name: "Study Hour Titan",
    description: "Awarded for accumulating an elite number of study hours.",
    criteria: "Complete 150 hours of study using the Pomodoro technique.",
    icon: "🕰️",
    earned: false,
    total: 150
  },
  {
    id: "task-grandmaster",
    name: "Task Grandmaster",
    description: "Awarded for completing an elite number of tasks within a semester.",
    criteria: "Complete 300 tasks within a semester.",
    icon: "🎯",
    earned: false,
    total: 300
  },
  {
    id: "study-grandmaster",
    name: "Study Grandmaster",
    description: "Awarded for reaching the highest level of study achievement.",
    criteria: "Complete 250 Pomodoro sessions.",
    icon: "🏋️",
    earned: false,
    total: 250
  },
  {
    id: "study-hour-legend",
    name: "Study Hour Legend",
    description: "Awarded for accumulating a legendary number of study hours.",
    criteria: "Complete 200 hours of study using the Pomodoro technique.",
    icon: "⏰",
    earned: false,
    total: 200
  },
  {
    id: "task-legend",
    name: "Task Legend",
    description: "Awarded for completing a legendary number of tasks within a year.",
    criteria: "Complete 500 tasks within a year.",
    icon: "🌠",
    earned: false,
    total: 500
  },
  {
    id: "study-icon",
    name: "Study Icon",
    description: "Awarded for maintaining a consistent study schedule over a year.",
    criteria: "Complete at least 1 Pomodoro session every day for a year.",
    icon: "🏔️",
    earned: false,
    total: 365
  },
  {
    id: "study-hour-icon",
    name: "Study Hour Icon",
    description: "Awarded for accumulating an iconic number of study hours.",
    criteria: "Complete 250 hours of study using the Pomodoro technique.",
    icon: "⌛",
    earned: false,
    total: 250
  },
  {
    id: "task-icon",
    name: "Task Icon",
    description: "Awarded for completing an iconic number of tasks within a year.",
    criteria: "Complete 700 tasks within a year.",
    icon: "📈",
    earned: false,
    total: 700
  },
  {
    id: "study-myth",
    name: "Study Myth",
    description: "Awarded for reaching a mythical level of study achievement.",
    criteria: "Complete 500 hours of study using the Pomodoro technique.",
    icon: "🔱",
    earned: false,
    total: 500
  },
  {
    id: "quiz-creator",
    name: "Quiz Creator",
    description: "Awarded for creating your first quiz.",
    criteria: "Create 1 quiz.",
    icon: "❓",
    earned: false
  },
  {
    id: "quiz-master",
    name: "Quiz Master",
    description: "Awarded for creating multiple quizzes.",
    criteria: "Create 5 quizzes.",
    icon: "📝",
    earned: false
  },
  {
    id: "quiz-genius",
    name: "Quiz Genius",
    description: "Awarded for creating a substantial number of quizzes.",
    criteria: "Create 15 quizzes.",
    icon: "🧩",
    earned: false
  },
  {
    id: "quiz-champion",
    name: "Quiz Champion",
    description: "Awarded for creating an impressive collection of quizzes.",
    criteria: "Create 25 quizzes.",
    icon: "🏆",
    earned: false
  },
  {
    id: "quiz-taker",
    name: "Quiz Taker",
    description: "Awarded for taking your first quiz.",
    criteria: "Complete 1 quiz.",
    icon: "✏️",
    earned: false
  },
  {
    id: "quiz-enthusiast",
    name: "Quiz Enthusiast",
    description: "Awarded for taking multiple quizzes.",
    criteria: "Complete 10 quizzes.",
    icon: "📊",
    earned: false
  },
  {
    id: "quiz-aficionado",
    name: "Quiz Aficionado",
    description: "Awarded for taking a substantial number of quizzes.",
    criteria: "Complete 25 quizzes.",
    icon: "🎓",
    earned: false
  },
  {
    id: "quiz-legend",
    name: "Quiz Legend",
    description: "Awarded for taking an impressive number of quizzes.",
    criteria: "Complete 50 quizzes.",
    icon: "👑",
    earned: false
  },
  {
    id: "perfect-score",
    name: "Perfect Score",
    description: "Awarded for achieving a perfect score on a quiz.",
    criteria: "Get 100% on any quiz.",
    icon: "💯",
    earned: false
  },
  {
    id: "quiz-streak",
    name: "Quiz Streak",
    description: "Awarded for completing quizzes on consecutive days.",
    criteria: "Complete at least 1 quiz per day for 5 consecutive days.",
    icon: "🔥",
    earned: false
  },
  {
    id: "flashcard-beginner",
    name: "Flashcard Beginner",
    description: "Awarded for creating your first set of flashcards.",
    criteria: "Create 1 flashcard set.",
    icon: "📇",
    earned: false
  },
  {
    id: "flashcard-creator",
    name: "Flashcard Creator",
    description: "Awarded for creating multiple sets of flashcards.",
    criteria: "Create 5 flashcard sets.",
    icon: "🗃️",
    earned: false
  },
  {
    id: "flashcard-expert",
    name: "Flashcard Expert",
    description: "Awarded for creating a substantial number of flashcard sets.",
    criteria: "Create 15 flashcard sets.",
    icon: "🧠",
    earned: false
  },
  {
    id: "memory-master",
    name: "Memory Master",
    description: "Awarded for studying flashcards regularly.",
    criteria: "Study flashcards for 10 days total.",
    icon: "🧩",
    earned: false
  },
  {
    id: "flashcard-scholar",
    name: "Flashcard Scholar",
    description: "Awarded for extensive flashcard study sessions.",
    criteria: "Complete 20 flashcard study sessions.",
    icon: "📚",
    earned: false
  },
  {
    id: "recall-champion",
    name: "Recall Champion",
    description: "Awarded for correctly recalling a high percentage of flashcards.",
    criteria: "Achieve 90% recall accuracy in a flashcard session with at least 20 cards.",
    icon: "🔍",
    earned: false
  },
  {
    id: "spaced-repetition-expert",
    name: "Spaced Repetition Expert",
    description: "Awarded for consistent flashcard review over time.",
    criteria: "Review flashcards on 15 different days.",
    icon: "📅",
    earned: false
  },
  {
    id: "flashcard-marathon",
    name: "Flashcard Marathon",
    description: "Awarded for studying a large number of flashcards in one session.",
    criteria: "Study 100+ flashcards in a single session.",
    icon: "🏃",
    earned: false
  },
  {
    id: "quiz-and-flashcard-combo",
    name: "Quiz and Flashcard Combo",
    description: "Awarded for using both quizzes and flashcards.",
    criteria: "Create at least 3 quizzes and 3 flashcard sets.",
    icon: "🔄",
    earned: false
  },
  {
    id: "knowledge-curator",
    name: "Knowledge Curator",
    description: "Awarded for creating comprehensive study materials.",
    criteria: "Create a total of 25 study items (quizzes and flashcard sets combined).",
    icon: "📖",
    earned: false
  }
];

// XP conversion constants
export const MINUTES_PER_XP = 6; // 6 minutes = 1 XP (10 XP per hour)
