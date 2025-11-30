import { z } from 'zod'

export const ActivityDaySchema = z.object({
  activity_date: z.string(),
  minutes_studied: z.number().int().nonnegative(),
  level: z.number().int().min(0).max(4),
})

export type ActivityDay = z.infer<typeof ActivityDaySchema>

export const UserStatsSchema = z.object({
  total_study_minutes: z.number().int().nonnegative(),
  current_streak: z.number().int().nonnegative(),
  longest_streak: z.number().int().nonnegative().optional(),
})

export type UserStats = z.infer<typeof UserStatsSchema>

export const CalendarDataSchema = z.object({
  activity: z.array(ActivityDaySchema),
  stats: UserStatsSchema.nullable(),
})

export type CalendarData = z.infer<typeof CalendarDataSchema>
