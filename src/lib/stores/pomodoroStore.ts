import { create } from 'zustand'
import type { TimerPhase, Task, PomodoroSettings } from '../schemas/pomodoro'
import { logPomodoroSession, XP_REWARDS } from '@/services/activity'
import { useXPStore } from './xpStore'
import { useActivityStore } from './activityStore'

interface PomodoroState {
  settings: PomodoroSettings
  timeLeft: number
  isRunning: boolean
  phase: TimerPhase
  sessionCount: number
  tasks: Task[]
  showSettings: boolean
  showToast: boolean
  toastMessage: string
  showConfetti: boolean
  // Global notification state for when timer completes
  pendingPhasePrompt: boolean
  pendingNextPhase: TimerPhase | null
  // Global task reminder notification state
  pendingTaskReminder: { taskId: string; taskText: string } | null
}

interface PomodoroActions {
  setSettings: (settings: Partial<PomodoroSettings>) => void
  setTimeLeft: (time: number) => void
  setIsRunning: (running: boolean) => void
  setPhase: (phase: TimerPhase) => void
  incrementSession: () => void
  addTask: (text: string, reminderTime?: string | null) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
  updateTaskReminder: (id: string, reminderTime: string | null) => void
  markTaskNotified: (id: string) => void
  setPendingTaskReminder: (reminder: { taskId: string; taskText: string } | null) => void
  dismissTaskReminder: () => void
  setShowSettings: (show: boolean) => void
  setShowToast: (show: boolean) => void
  setToastMessage: (message: string) => void
  setShowConfetti: (show: boolean) => void
  resetTimer: () => void
  startTimer: () => void
  pauseTimer: () => void
  toggleTimer: () => void
  handlePhaseComplete: () => Promise<void>
  switchPhase: (phase: TimerPhase) => void
  // Global notification actions
  startNextPhase: () => void
  dismissPhasePrompt: () => void
}

type PomodoroStore = PomodoroState & PomodoroActions

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
}

// Module-level variables for persistence
let timerInterval: NodeJS.Timeout | null = null;
let sessionStartTime: Date | null = null;
let targetEndTime: number | null = null; // Absolute timestamp when timer should end
let pausedTimeLeft: number | null = null; // Time left when paused (for resume)
let visibilityHandler: (() => void) | null = null; // Store visibility handler for cleanup
let isCompletingPhase = false; // Guard against duplicate handlePhaseComplete calls

export const usePomodoroStore = create<PomodoroStore>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  timeLeft: DEFAULT_SETTINGS.workDuration * 60,
  isRunning: false,
  phase: 'work',
  sessionCount: 0,
  tasks: [],
  showSettings: false,
  showToast: false,
  toastMessage: '',
  showConfetti: false,
  pendingPhasePrompt: false,
  pendingNextPhase: null,
  pendingTaskReminder: null,

  setSettings: (newSettings) => {
    set((state) => {
      const updatedSettings = { ...state.settings, ...newSettings };
      // If not running, update timeLeft to match new duration for current phase
      if (!state.isRunning) {
        const duration = state.phase === 'work' ? updatedSettings.workDuration
          : state.phase === 'shortBreak' ? updatedSettings.shortBreakDuration
            : updatedSettings.longBreakDuration;
        return { settings: updatedSettings, timeLeft: duration * 60 };
      }
      return { settings: updatedSettings };
    })
  },

  setTimeLeft: (time) => set({ timeLeft: time }),

  setIsRunning: (running) => set({ isRunning: running }),

  setPhase: (phase) => set({ phase }),

  incrementSession: () => set((state) => ({ sessionCount: state.sessionCount + 1 })),

  addTask: (text, reminderTime?: string | null) => set((state) => ({
    tasks: [...state.tasks, {
      id: crypto.randomUUID(),
      text,
      completed: false,
      reminder: reminderTime ? {
        enabled: true,
        time: reminderTime,
        notified: false,
      } : undefined,
    }]
  })),

  toggleTask: (id) => {
    const state = get();
    const task = state.tasks.find(t => t.id === id);
    const isCompleting = task && !task.completed;

    // Update state first (pure)
    set({
      tasks: state.tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
      ...(isCompleting ? {
        toastMessage: "Task completed! Nice work!",
        showToast: true
      } : {})
    });

    // Side effect after state update
    if (isCompleting) {
      setTimeout(() => set({ showToast: false }), 3000);
    }
  },

  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  })),

  updateTaskReminder: (id, reminderTime) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id
        ? {
          ...task,
          reminder: reminderTime
            ? { enabled: true, time: reminderTime, notified: false }
            : undefined,
        }
        : task
    )
  })),

  markTaskNotified: (id) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id && task.reminder
        ? { ...task, reminder: { ...task.reminder, notified: true } }
        : task
    )
  })),

  setPendingTaskReminder: (reminder) => set({ pendingTaskReminder: reminder }),

  dismissTaskReminder: () => set({ pendingTaskReminder: null }),

  setShowSettings: (show) => set({ showSettings: show }),

  setShowToast: (show) => set({ showToast: show }),

  setToastMessage: (message) => set({ toastMessage: message }),

  setShowConfetti: (show) => set({ showConfetti: show }),

  resetTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    // Clean up visibility listener
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    sessionStartTime = null;
    targetEndTime = null;
    pausedTimeLeft = null;
    const { settings, phase } = get()
    const duration = phase === 'work'
      ? settings.workDuration
      : phase === 'shortBreak'
        ? settings.shortBreakDuration
        : settings.longBreakDuration
    set({ timeLeft: duration * 60, isRunning: false, sessionCount: 0 })
  },

  startTimer: () => {
    if (get().isRunning) return;

    if (!sessionStartTime) {
      sessionStartTime = new Date();
    }

    set({ isRunning: true });

    if (timerInterval) clearInterval(timerInterval);

    // Calculate target end time based on current timeLeft
    const currentTimeLeft = pausedTimeLeft !== null ? pausedTimeLeft : get().timeLeft;
    targetEndTime = Date.now() + (currentTimeLeft * 1000);
    pausedTimeLeft = null;

    // Update timeLeft immediately
    set({ timeLeft: currentTimeLeft });

    // Helper to check remaining time and trigger completion if needed
    const checkAndUpdateTime = () => {
      if (targetEndTime === null || isCompletingPhase) return;

      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetEndTime - now) / 1000));

      if (remaining <= 0) {
        set({ timeLeft: 0 });
        get().handlePhaseComplete();
      } else {
        set({ timeLeft: remaining });
      }
    };

    // Use interval to update display, but calculate from absolute time
    timerInterval = setInterval(checkAndUpdateTime, 1000); // Update once per second; visibility handler handles immediate sync

    // Only set up visibility listener in browser environment
    if (typeof document !== 'undefined') {
      // Clean up any existing visibility listener
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
      }

      // Handle visibility change to sync timer when tab becomes active
      visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          checkAndUpdateTime();
        }
      };

      document.addEventListener('visibilitychange', visibilityHandler);
    }
  },

  pauseTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    // Clean up visibility listener when paused
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    // Store the current time left for resume
    if (targetEndTime !== null) {
      pausedTimeLeft = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
      set({ timeLeft: pausedTimeLeft });
    }
    targetEndTime = null;
    set({ isRunning: false });
  },

  toggleTimer: () => {
    if (get().isRunning) {
      get().pauseTimer();
    } else {
      get().startTimer();
    }
  },

  switchPhase: (newPhase) => {
    const { settings } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    // Clean up visibility listener
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    sessionStartTime = null;
    targetEndTime = null;
    pausedTimeLeft = null;

    const duration = newPhase === 'work' ? settings.workDuration
      : newPhase === 'shortBreak' ? settings.shortBreakDuration
        : settings.longBreakDuration;

    set({
      phase: newPhase,
      timeLeft: duration * 60,
      isRunning: false
    });
  },

  handlePhaseComplete: async () => {
    // Guard against duplicate calls
    if (isCompletingPhase) return;
    isCompletingPhase = true;

    const { phase, settings, sessionCount } = get();

    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    // Clean up visibility listener
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    targetEndTime = null;
    pausedTimeLeft = null;
    set({ isRunning: false });

    // Log session
    if (sessionStartTime) {
      const duration = phase === 'work' ? settings.workDuration
        : phase === 'shortBreak' ? settings.shortBreakDuration
          : settings.longBreakDuration;

      try {
        await logPomodoroSession(phase, duration, sessionStartTime);

        // Refresh stats after any session (work sessions update study time)
        // Use force=true to bypass the 5-minute cache TTL so fresh data
        // is immediately available when navigating to the dashboard
        useXPStore.getState().fetchXPStats();
        useActivityStore.getState().fetchActivity(true);
      } catch (error) {
        console.error('Failed to log session:', error);
      }
      sessionStartTime = null;
    }

    // Determine next phase and show prompt
    let nextPhase: TimerPhase;
    let message: string;

    if (phase === 'work') {
      const newCount = sessionCount + 1;
      set({ sessionCount: newCount });

      if (newCount % 4 === 0) {
        nextPhase = 'longBreak';
        message = `Amazing focus! +${XP_REWARDS.POMODORO_WORK} XP. Ready for a long break?`;
        set({ showConfetti: true });
        setTimeout(() => set({ showConfetti: false }), 5000);
      } else {
        nextPhase = 'shortBreak';
        message = `Great job! +${XP_REWARDS.POMODORO_WORK} XP. Ready for a short break?`;
      }
    } else {
      nextPhase = 'work';
      message = "Break complete! Ready to focus?";
    }

    // Set pending prompt for global notification
    set({
      pendingPhasePrompt: true,
      pendingNextPhase: nextPhase,
      toastMessage: message,
      showToast: true,
    });

    setTimeout(() => set({ showToast: false }), 4000);

    // Reset guard flag after completion
    isCompletingPhase = false;
  },

  startNextPhase: () => {
    const { pendingNextPhase, settings } = get();
    if (!pendingNextPhase) return;

    const duration = pendingNextPhase === 'work' ? settings.workDuration
      : pendingNextPhase === 'shortBreak' ? settings.shortBreakDuration
        : settings.longBreakDuration;

    set({
      phase: pendingNextPhase,
      timeLeft: duration * 60,
      pendingPhasePrompt: false,
      pendingNextPhase: null,
    });

    // Auto-start the next phase
    get().startTimer();
  },

  dismissPhasePrompt: () => {
    const { pendingNextPhase, settings } = get();
    if (!pendingNextPhase) return;

    const duration = pendingNextPhase === 'work' ? settings.workDuration
      : pendingNextPhase === 'shortBreak' ? settings.shortBreakDuration
        : settings.longBreakDuration;

    // Set up next phase but don't start
    set({
      phase: pendingNextPhase,
      timeLeft: duration * 60,
      pendingPhasePrompt: false,
      pendingNextPhase: null,
    });
  },
}))
