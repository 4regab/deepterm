export interface ReviewerBatchTermInput {
  term: string
  definition: string
  examples?: string[] | null
  keywords?: string[] | null
}

export interface ReviewerBatchCategoryInput {
  name: string
  color?: string | null
  terms?: ReviewerBatchTermInput[] | null
}

interface BuildReviewerInsertPayloadsParams {
  reviewerId: string
  userId: string
  categories: ReviewerBatchCategoryInput[]
}

export interface ReviewerCategoryInsertRow {
  id: string
  reviewer_id: string
  user_id: string
  name: string
  color: string
}

export interface ReviewerTermInsertRow {
  category_id: string
  user_id: string
  term: string
  definition: string
  examples: string[]
  keywords: string[]
}

export function buildReviewerInsertPayloads({
  reviewerId,
  userId,
  categories,
}: BuildReviewerInsertPayloadsParams): {
  categoryRows: ReviewerCategoryInsertRow[]
  termRows: ReviewerTermInsertRow[]
} {
  const categoryRows: ReviewerCategoryInsertRow[] = []
  const termRows: ReviewerTermInsertRow[] = []

  for (const category of categories) {
    const categoryId = crypto.randomUUID()

    categoryRows.push({
      id: categoryId,
      reviewer_id: reviewerId,
      user_id: userId,
      name: category.name,
      color: category.color || '#E0F2FE',
    })

    for (const term of category.terms || []) {
      termRows.push({
        category_id: categoryId,
        user_id: userId,
        term: term.term,
        definition: term.definition,
        examples: term.examples || [],
        keywords: term.keywords || [],
      })
    }
  }

  return { categoryRows, termRows }
}
