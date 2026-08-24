import { z } from 'zod'

export const GeminiCardSchema = z.object({
  term: z.string().trim().min(1),
  definition: z.string().trim().min(3),
})

export const GeminiCardsResponseSchema = z.array(GeminiCardSchema)

export const GeminiReviewerTermSchema = z.object({
  term: z.string().trim().min(1),
  definition: z.string().trim().min(3),
  examples: z.array(z.string()).optional().default([]),
  keywords: z.array(z.string()).optional().default([]),
})

export const GeminiReviewerCategorySchema = z.object({
  name: z.string().trim().min(1),
  color: z.string().trim().min(1).optional().default('#E0F2FE'),
  terms: z.array(GeminiReviewerTermSchema).default([]),
})

export const GeminiReviewerResponseSchema = z.object({
  title: z.string().trim().optional(),
  extractionMode: z.string().trim().optional(),
  categories: z.array(GeminiReviewerCategorySchema).default([]),
})

export type GeminiCard = z.infer<typeof GeminiCardSchema>
export type GeminiReviewerResponse = z.infer<typeof GeminiReviewerResponseSchema>
export const GeminiCardsSchema = GeminiCardsResponseSchema
