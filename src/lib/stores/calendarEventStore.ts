import { create } from 'zustand'
import type { CalendarEvent } from '../schemas/calendarEvent'

const STORAGE_KEY = 'deepterm_calendar_events'

interface CalendarEventState {
  events: CalendarEvent[]
  loading: boolean
}

interface CalendarEventActions {
  createEvent: (event: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>> & Pick<CalendarEvent, 'title' | 'type' | 'startDateTime' | 'endDateTime'>) => void
  updateEvent: (eventId: string, fields: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => void
  deleteEvent: (eventId: string) => void
  getEventsForRange: (from: string, to: string) => CalendarEvent[]
  getEventsForDate: (date: string) => CalendarEvent[]
  loadFromStorage: () => void
  saveToStorage: () => void
}

type CalendarEventStore = CalendarEventState & CalendarEventActions

function generateId(): string {
  return crypto.randomUUID()
}

function nowISO(): string {
  return new Date().toISOString()
}

export const useCalendarEventStore = create<CalendarEventStore>()((set, get) => ({
  events: [],
  loading: false,

  createEvent: (event) => {
    const now = nowISO()
    const newEvent: CalendarEvent = {
      id: generateId(),
      title: event.title,
      type: event.type,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      allDay: event.allDay ?? false,
      recurrence: event.recurrence ?? 'none',
      linkedTaskId: event.linkedTaskId,
      linkedDeckId: event.linkedDeckId,
      notes: event.notes,
      color: event.color,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ events: [...state.events, newEvent] }))
    get().saveToStorage()
  },

  updateEvent: (eventId, fields) => {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, ...fields, updatedAt: nowISO() } : e
      ),
    }))
    get().saveToStorage()
  },

  deleteEvent: (eventId) => {
    set((state) => ({ events: state.events.filter((e) => e.id !== eventId) }))
    get().saveToStorage()
  },

  getEventsForRange: (from, to) => {
    const { events } = get()
    return events.filter((e) => e.startDateTime >= from && e.startDateTime <= to)
  },

  getEventsForDate: (date) => {
    const { events } = get()
    return events.filter((e) => e.startDateTime.startsWith(date))
  },

  loadFromStorage: () => {
    set({ loading: true })
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        set({ events: data.events ?? [] })
      }
    } catch {
      // If storage is corrupted, keep defaults
    }
    set({ loading: false })
  },

  saveToStorage: () => {
    const { events } = get()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ events }))
    } catch {
      // localStorage may be unavailable in SSR or full in some environments
    }
  },
}))
