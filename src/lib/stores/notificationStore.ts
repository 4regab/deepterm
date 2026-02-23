import { create } from 'zustand'
import type { UserNotificationPreferences, ScheduledReminder } from '../schemas/notification'

const STORAGE_KEY = 'deepterm_notifications'

interface NotificationState {
  preferences: UserNotificationPreferences | null
  reminders: ScheduledReminder[]
  loading: boolean
}

interface NotificationActions {
  updatePreferences: (prefs: UserNotificationPreferences) => void
  scheduleReminder: (reminder: Omit<ScheduledReminder, 'id' | 'createdAt' | 'status'> & Partial<Pick<ScheduledReminder, 'status'>>) => void
  cancelReminder: (reminderId: string) => void
  loadFromStorage: () => void
  saveToStorage: () => void
}

type NotificationStore = NotificationState & NotificationActions

function generateId(): string {
  return crypto.randomUUID()
}

function nowISO(): string {
  return new Date().toISOString()
}

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  preferences: null,
  reminders: [],
  loading: false,

  updatePreferences: (prefs) => {
    set({ preferences: { ...prefs, updatedAt: nowISO() } })
    get().saveToStorage()
  },

  scheduleReminder: (reminder) => {
    const newReminder: ScheduledReminder = {
      id: generateId(),
      type: reminder.type,
      recipientEmail: reminder.recipientEmail,
      scheduledAt: reminder.scheduledAt,
      context: reminder.context,
      status: reminder.status ?? 'pending',
      createdAt: nowISO(),
    }
    set((state) => ({ reminders: [...state.reminders, newReminder] }))
    get().saveToStorage()
  },

  cancelReminder: (reminderId) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === reminderId ? { ...r, status: 'cancelled' as const } : r
      ),
    }))
    get().saveToStorage()
  },

  loadFromStorage: () => {
    set({ loading: true })
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        set({
          preferences: data.preferences ?? null,
          reminders: data.reminders ?? [],
        })
      }
    } catch {
      // If storage is corrupted, keep defaults
    }
    set({ loading: false })
  },

  saveToStorage: () => {
    const { preferences, reminders } = get()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ preferences, reminders }))
    } catch {
      // localStorage may be unavailable in SSR or full in some environments
    }
  },
}))
