import { z } from 'zod'

export const NotificationTypeSchema = z.enum(['study_reminder', 'task_deadline', 'streak_alert', 'weekly_digest'])
export type NotificationType = z.infer<typeof NotificationTypeSchema>

export const ReminderTimingSchema = z.enum(['30min', '1hr', '1day'])
export type ReminderTiming = z.infer<typeof ReminderTimingSchema>

export const NotificationPreferenceSchema = z.object({
  type: NotificationTypeSchema,
  enabled: z.boolean().default(true),
  timing: ReminderTimingSchema.optional(),
  customTime: z.string().optional(),
})
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>

export const UserNotificationPreferencesSchema = z.object({
  userId: z.string(),
  email: z.string(),
  preferences: z.array(NotificationPreferenceSchema),
  globalEnabled: z.boolean().default(true),
  updatedAt: z.string(),
})
export type UserNotificationPreferences = z.infer<typeof UserNotificationPreferencesSchema>

export const ReminderStatusSchema = z.enum(['pending', 'sent', 'cancelled'])
export type ReminderStatus = z.infer<typeof ReminderStatusSchema>

export const ScheduledReminderSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  recipientEmail: z.string(),
  scheduledAt: z.string(),
  context: z.record(z.string(), z.string()),
  status: ReminderStatusSchema,
  createdAt: z.string(),
})
export type ScheduledReminder = z.infer<typeof ScheduledReminderSchema>
