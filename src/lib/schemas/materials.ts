import { z } from 'zod'

export const MaterialTypeSchema = z.enum(['Note', 'Flashcards', 'Reviewer'])
export type MaterialType = z.infer<typeof MaterialTypeSchema>

export const MaterialItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  type: MaterialTypeSchema,
  itemsCount: z.number().int().nonnegative(),
  lastAccessed: z.string(),
  sortDate: z.string().optional(),
})

export type MaterialItem = z.infer<typeof MaterialItemSchema>

export const MaterialFilterSchema = z.enum(['All', 'Note', 'Flashcards', 'Reviewer', 'Cards'])
export type MaterialFilter = z.infer<typeof MaterialFilterSchema>

export const FlashcardSchema = z.object({
  id: z.string().uuid(),
  term: z.string().min(1, 'Term is required'),
  definition: z.string().min(1, 'Definition is required'),
  set_id: z.string().uuid(),
})

export type Flashcard = z.infer<typeof FlashcardSchema>

export const FlashcardSetSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
  flashcards: z.array(FlashcardSchema).optional(),
})

export type FlashcardSet = z.infer<typeof FlashcardSetSchema>
