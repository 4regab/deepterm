export type CalendarEventType = "study" | "task" | "exam" | "pomodoro";

export type CalendarView = "month" | "week" | "day";

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  recurrence: string | null;
  linkedTaskId: string | null;
  linkedDeckId: string | null;
  notes: string | null;
}

export const EVENT_TYPE_CONFIG: Record<CalendarEventType, { label: string; color: string; bgColor: string; emoji: string }> = {
  study: { label: "Study Session", color: "text-blue-700", bgColor: "bg-blue-100", emoji: "🟦" },
  task: { label: "Task Deadline", color: "text-yellow-700", bgColor: "bg-yellow-100", emoji: "🟨" },
  exam: { label: "Exam", color: "text-red-700", bgColor: "bg-red-100", emoji: "🟥" },
  pomodoro: { label: "Pomodoro Block", color: "text-green-700", bgColor: "bg-green-100", emoji: "🟩" },
};
