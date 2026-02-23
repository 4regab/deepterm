import { z } from 'zod'

export const CalendarEventTypeSchema = z.enum(['study_session', 'task_deadline', 'exam', 'pomodoro_block'])
export type CalendarEventType = z.infer<typeof CalendarEventTypeSchema>

export const RecurrencePatternSchema = z.enum(['daily', 'weekly', 'monthly', 'none'])
export type RecurrencePattern = z.infer<typeof RecurrencePatternSchema>

export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Event title is required'),
  type: CalendarEventTypeSchema,
  startDateTime: z.string(),
  endDateTime: z.string(),
  allDay: z.boolean().default(false),
  recurrence: RecurrencePatternSchema.default('none'),
  linkedTaskId: z.string().optional(),
  linkedDeckId: z.string().optional(),
  notes: z.string().optional(),
  color: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type CalendarEvent = z.infer<typeof CalendarEventSchema>

export const EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
  study_session: '#3b82f6',
  task_deadline: '#eab308',
  exam: '#ef4444',
  pomodoro_block: '#22c55e',
}
