export type StudyCardStatus = 'new' | 'learning' | 'review' | 'mastered'
export type StudyCardSource = 'flashcard' | 'reviewer'

export interface StudyCard {
  id: string
  term: string
  definition: string
  status: StudyCardStatus
  source: StudyCardSource
}

export interface StudyDeck {
  title: string
  source: StudyCardSource
  cards: StudyCard[]
}

export interface FlashcardStudyRow {
  id: string
  front: string
  back: string
  status?: string | null
}

export interface ReviewerTermStudyRow {
  id: string
  term: string
  definition: string
}

export interface ReviewerCategoryStudyRow {
  reviewer_terms?: ReviewerTermStudyRow[] | null
}

const FLASHCARD_STATUSES = new Set<StudyCardStatus>(['new', 'learning', 'review', 'mastered'])

function toStatus(value: string | null | undefined): StudyCardStatus {
  if (value && FLASHCARD_STATUSES.has(value as StudyCardStatus)) {
    return value as StudyCardStatus
  }
  return 'new'
}

export function toStudyCardsFromFlashcards(rows: FlashcardStudyRow[]): StudyCard[] {
  return rows.map((row) => ({
    id: row.id,
    term: row.front,
    definition: row.back,
    status: toStatus(row.status),
    source: 'flashcard',
  }))
}

export function toStudyCardsFromReviewerCategories(
  categories: ReviewerCategoryStudyRow[],
): StudyCard[] {
  return categories.flatMap((category) =>
    (category.reviewer_terms ?? []).map((term) => ({
      id: term.id,
      term: term.term,
      definition: term.definition,
      status: 'new' as const,
      source: 'reviewer' as const,
    })),
  )
}

type QueryResult<T> = PromiseLike<{ data: T | null; error: unknown }>

/**
 * Minimal PostgREST surface used by study modes. Typed loosely so the real
 * supabase-js builder (which is recursively huge) stays assignable.
 */
export interface StudyCardsClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string) => QueryResult<unknown>
        maybeSingle: () => QueryResult<unknown>
      }
    }
  }
}

/**
 * Load a study deck from a flashcard set, or fall back to reviewer terms.
 * Reviewer Learn/Practice links use the same /materials/[id] routes.
 */
export async function loadStudyDeck(
  client: unknown,
  materialId: string,
): Promise<StudyDeck | null> {
  const db = client as StudyCardsClient
  const flashcardsResult = await db
    .from('flashcards')
    .select('id, front, back, status')
    .eq('set_id', materialId)
    .order('created_at')

  const flashcardRows = (flashcardsResult.data ?? []) as FlashcardStudyRow[]
  if (flashcardRows.length > 0) {
    const setResult = await db
      .from('flashcard_sets')
      .select('title')
      .eq('id', materialId)
      .maybeSingle()
    const title = (setResult.data as { title?: string } | null)?.title ?? 'Flashcards'
    return {
      title,
      source: 'flashcard',
      cards: toStudyCardsFromFlashcards(flashcardRows),
    }
  }

  const categoriesResult = await db
    .from('reviewer_categories')
    .select('id, reviewer_terms(id, term, definition)')
    .eq('reviewer_id', materialId)
    .order('created_at')

  const categoryRows = (categoriesResult.data ?? []) as ReviewerCategoryStudyRow[]
  const cards = toStudyCardsFromReviewerCategories(categoryRows)
  if (cards.length === 0) {
    return null
  }

  const reviewerResult = await db
    .from('reviewers')
    .select('title')
    .eq('id', materialId)
    .maybeSingle()
  const title = (reviewerResult.data as { title?: string } | null)?.title ?? 'Reviewer'

  return {
    title,
    source: 'reviewer',
    cards,
  }
}
