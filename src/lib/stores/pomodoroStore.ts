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
    set((state) => {
      const task = state.tasks.find(t => t.id === id);
      if (task && !task.completed) {
        set({ toastMessage: "Task completed! Nice work!", showToast: true });
        setTimeout(() => set({ showToast: false }), 3000);
      }
      return {
        tasks: state.tasks.map(task =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      };
    })
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
    sessionStartTime = null;
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

    timerInterval = setInterval(() => {
      const { timeLeft } = get();

      if (timeLeft <= 0) {
        get().handlePhaseComplete();
      } else {
        set({ timeLeft: timeLeft - 1 });
      }
    }, 1000);
  },

  pauseTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
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
    sessionStartTime = null;

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
    const { phase, settings, sessionCount } = get();

    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    set({ isRunning: false });

    // Log session
    if (sessionStartTime) {
      const duration = phase === 'work' ? settings.workDuration
        : phase === 'shortBreak' ? settings.shortBreakDuration
          : settings.longBreakDuration;

      try {
        await logPomodoroSession(phase, duration, sessionStartTime);

        // Refresh stats after any session (work sessions update study time)
        useXPStore.getState().fetchXPStats();
        useActivityStore.getState().fetchActivity();
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
