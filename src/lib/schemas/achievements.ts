import { z } from 'zod'

export const AchievementIconSchema = z.enum([
  'Trophy', 'Zap', 'BrainCircuit', 'Star', 'Flame', 
  'Timer', 'Clock', 'BookOpen', 'FileText', 'Upload'
])

export type AchievementIcon = z.infer<typeof AchievementIconSchema>

export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
  bg: z.string(),
  progress: z.number().int().nonnegative(),
  requirement_value: z.number().int().positive(),
  unlocked: z.boolean(),
  unlocked_at: z.string().nullable().optional(),
})

export type Achievement = z.infer<typeof AchievementSchema>
