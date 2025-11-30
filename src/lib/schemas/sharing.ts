import { z } from 'zod'

export const ShareCodeSchema = z
  .string()
  .min(3, 'Share code must be at least 3 characters')
  .max(30, 'Share code must be at most 30 characters')
  .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed')

export const ShareMaterialTypeSchema = z.enum(['flashcard_set', 'reviewer'])
export type ShareMaterialType = z.infer<typeof ShareMaterialTypeSchema>

export const MaterialShareSchema = z.object({
  id: z.string().uuid(),
  share_code: z.string(),
  material_type: ShareMaterialTypeSchema,
  material_id: z.string().uuid(),
  user_id: z.string().uuid(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type MaterialShare = z.infer<typeof MaterialShareSchema>

export const SharedFlashcardSchema = z.object({
  id: z.string(),
  front: z.string(),
  back: z.string(),
})

export const SharedTermSchema = z.object({
  id: z.string(),
  term: z.string(),
  definition: z.string(),
  examples: z.array(z.string()).nullable(),
  keywords: z.array(z.string()).nullable(),
})

export const SharedCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  terms: z.array(SharedTermSchema),
})

export const SharedOwnerSchema = z.object({
  name: z.string(),
  avatar: z.string().nullable(),
})

export const SharedFlashcardSetDataSchema = z.object({
  type: z.literal('flashcard_set'),
  share: z.object({
    id: z.string(),
    code: z.string(),
    created_at: z.string(),
  }),
  material: z.object({
    id: z.string(),
    title: z.string(),
    created_at: z.string(),
  }),
  items: z.array(SharedFlashcardSchema),
  owner: SharedOwnerSchema,
})

export const SharedReviewerDataSchema = z.object({
  type: z.literal('reviewer'),
  share: z.object({
    id: z.string(),
    code: z.string(),
    created_at: z.string(),
  }),
  material: z.object({
    id: z.string(),
    title: z.string(),
    extraction_mode: z.string(),
    created_at: z.string(),
  }),
  categories: z.array(SharedCategorySchema),
  owner: SharedOwnerSchema,
})

export const SharedMaterialDataSchema = z.discriminatedUnion('type', [
  SharedFlashcardSetDataSchema,
  SharedReviewerDataSchema,
])

export type SharedMaterialData = z.infer<typeof SharedMaterialDataSchema>
export type SharedFlashcardSetData = z.infer<typeof SharedFlashcardSetDataSchema>
export type SharedReviewerData = z.infer<typeof SharedReviewerDataSchema>
