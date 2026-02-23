import { z } from 'zod'

export const StudyPlanDaySchema = z.object({
  date: z.string(),
  deckIds: z.array(z.string()),
  studyMinutes: z.number(),
  tasks: z.array(z.string()),
  completed: z.boolean().default(false),
})
export type StudyPlanDay = z.infer<typeof StudyPlanDaySchema>

export const StudyPlanStatusSchema = z.enum(['draft', 'approved', 'active', 'completed'])
export type StudyPlanStatus = z.infer<typeof StudyPlanStatusSchema>

export const StudyPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  durationDays: z.number(),
  targetDeckIds: z.array(z.string()),
  dailyHoursAvailable: z.number(),
  examDate: z.string().optional(),
  days: z.array(StudyPlanDaySchema),
  status: StudyPlanStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type StudyPlan = z.infer<typeof StudyPlanSchema>
