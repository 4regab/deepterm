import { z } from 'zod'

export const MaterialTypeSchema = z.enum(['Note', 'Flashcards', 'Reviewer'])
export type MaterialType = z.infer<typeof MaterialTypeSchema>

/** Mirrors `folders_name_len` in 005_folders.sql. */
export const MAX_FOLDER_NAME_LENGTH = 40

export const FolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(MAX_FOLDER_NAME_LENGTH),
  createdAt: z.string().optional(),
})

export type Folder = z.infer<typeof FolderSchema>

export const MaterialItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  type: MaterialTypeSchema,
  itemsCount: z.number().int().nonnegative(),
  lastAccessed: z.string(),
  sortDate: z.string().optional(),
  /** FK to public.folders.id. Null means Unfiled. */
  folderId: z.string().uuid().nullable().default(null),
  /** Denormalized from the embedded folders relation, for display only. */
  folderName: z.string().nullable().default(null),
  /** Study progress counts if available. */
  studyCounts: z
    .object({
      new: z.number().int().nonnegative(),
      learning: z.number().int().nonnegative(),
      mastered: z.number().int().nonnegative(),
    })
    .optional(),
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
  folder_id: z.string().uuid().nullable().default(null),
  flashcards: z.array(FlashcardSchema).optional(),
})

export type FlashcardSet = z.infer<typeof FlashcardSetSchema>
