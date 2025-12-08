import { z } from 'zod'

export const TimerPhaseSchema = z.enum(['work', 'shortBreak', 'longBreak'])
export type TimerPhase = z.infer<typeof TimerPhaseSchema>

export const TaskReminderSchema = z.object({
  enabled: z.boolean(),
  time: z.string().nullable(), // ISO datetime string for full date+time support
  notified: z.boolean(),
})

export type TaskReminder = z.infer<typeof TaskReminderSchema>

export const TaskSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Task text is required'),
  completed: z.boolean(),
  reminder: TaskReminderSchema.optional(),
})

export type Task = z.infer<typeof TaskSchema>

export const PomodoroSettingsSchema = z.object({
  workDuration: z.number().int().min(1).max(120).default(25),
  shortBreakDuration: z.number().int().min(1).max(30).default(5),
  longBreakDuration: z.number().int().min(1).max(60).default(15),
})

export type PomodoroSettings = z.infer<typeof PomodoroSettingsSchema>
