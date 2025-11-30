import { z } from 'zod'

export const ProfileSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().nullable(),
  email: z.string().email().nullable(),
  avatar_url: z.string().url().nullable(),
})

export type Profile = z.infer<typeof ProfileSchema>

export const ProfileUpdateSchema = ProfileSchema.partial().omit({ id: true })
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>
