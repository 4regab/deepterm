import { CalendarEvent, CalendarEventType } from "@/types/calendar";

const EVENTS_KEY = "deepterm-calendar-events";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function getEvents(): CalendarEvent[] {
  try {
    const data = localStorage.getItem(EVENTS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load calendar events:", e);
  }
  return [];
}

export function saveEvents(events: CalendarEvent[]): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function createCalendarEvent(params: {
  title: string;
  type: CalendarEventType;
  startDateTime: string;
  endDateTime: string;
  allDay?: boolean;
  recurrence?: string | null;
  linkedTaskId?: string | null;
  linkedDeckId?: string | null;
  notes?: string | null;
}): CalendarEvent {
  const events = getEvents();
  const event: CalendarEvent = {
    id: generateId(),
    title: params.title,
    type: params.type,
    startDateTime: params.startDateTime,
    endDateTime: params.endDateTime,
    allDay: params.allDay || false,
    recurrence: params.recurrence || null,
    linkedTaskId: params.linkedTaskId || null,
    linkedDeckId: params.linkedDeckId || null,
    notes: params.notes || null,
  };
  events.push(event);
  saveEvents(events);
  return event;
}

export function updateCalendarEvent(
  eventId: string,
  fields: Partial<Omit<CalendarEvent, "id">>
): CalendarEvent | null {
  const events = getEvents();
  const index = events.findIndex((e) => e.id === eventId);
  if (index === -1) return null;
  events[index] = { ...events[index], ...fields };
  saveEvents(events);
  return events[index];
}

export function deleteCalendarEvent(eventId: string): boolean {
  const events = getEvents();
  const filtered = events.filter((e) => e.id !== eventId);
  if (filtered.length === events.length) return false;
  saveEvents(filtered);
  return true;
}

export function getEventsForRange(from: string, to: string): CalendarEvent[] {
  const events = getEvents();
  const fromDate = new Date(from);
  const toDate = new Date(to);
  return events.filter((e) => {
    const start = new Date(e.startDateTime);
    return start >= fromDate && start <= toDate;
  });
}

export function getEventsForDate(date: Date): CalendarEvent[] {
  const events = getEvents();
  return events.filter((e) => {
    const start = new Date(e.startDateTime);
    return (
      start.getFullYear() === date.getFullYear() &&
      start.getMonth() === date.getMonth() &&
      start.getDate() === date.getDate()
    );
  });
}
