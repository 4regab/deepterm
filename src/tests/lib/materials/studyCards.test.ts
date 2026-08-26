import { describe, expect, it } from 'bun:test'
import {
  loadStudyDeck,
  toStudyCardsFromFlashcards,
  toStudyCardsFromReviewerCategories,
} from '@/lib/materials/studyCards'

describe('study card mappers', () => {
  it('maps flashcard rows onto study cards', () => {
    const cards = toStudyCardsFromFlashcards([
      { id: 'c1', front: 'Mitosis', back: 'Cell division', status: 'learning' },
      { id: 'c2', front: 'Meiosis', back: 'Gametes', status: null },
    ])

    expect(cards).toEqual([
      { id: 'c1', term: 'Mitosis', definition: 'Cell division', status: 'learning', source: 'flashcard' },
      { id: 'c2', term: 'Meiosis', definition: 'Gametes', status: 'new', source: 'flashcard' },
    ])
  })

  it('flattens reviewer categories into new study cards', () => {
    const cards = toStudyCardsFromReviewerCategories([
      {
        reviewer_terms: [
          { id: 't1', term: 'Nucleus', definition: 'Control center' },
          { id: 't2', term: 'Mitochondria', definition: 'ATP' },
        ],
      },
      { reviewer_terms: [] },
    ])

    expect(cards).toEqual([
      { id: 't1', term: 'Nucleus', definition: 'Control center', status: 'new', source: 'reviewer' },
      { id: 't2', term: 'Mitochondria', definition: 'ATP', status: 'new', source: 'reviewer' },
    ])
  })
})

describe('loadStudyDeck', () => {
  it('prefers flashcards when the material is a set', async () => {
    const client = {
      from(table: string) {
        return {
          select() {
            return {
              eq() {
                return {
                  order: async () =>
                    table === 'flashcards'
                      ? {
                          data: [{ id: 'c1', front: 'Term', back: 'Def', status: 'new' }],
                          error: null,
                        }
                      : { data: [], error: null },
                  maybeSingle: async () =>
                    table === 'flashcard_sets'
                      ? { data: { title: 'Cells' }, error: null }
                      : { data: null, error: null },
                }
              },
            }
          },
        }
      },
    }

    const deck = await loadStudyDeck(client, 'set-1')
    expect(deck?.source).toBe('flashcard')
    expect(deck?.title).toBe('Cells')
    expect(deck?.cards).toHaveLength(1)
    expect(deck?.cards[0]?.term).toBe('Term')
  })

  it('falls back to reviewer terms so Learn/Practice work on reviewers', async () => {
    const client = {
      from(table: string) {
        return {
          select() {
            return {
              eq() {
                return {
                  order: async () => {
                    if (table === 'flashcards') return { data: [], error: null }
                    if (table === 'reviewer_categories') {
                      return {
                        data: [
                          {
                            id: 'cat-1',
                            reviewer_terms: [{ id: 't1', term: 'Osmosis', definition: 'Water movement' }],
                          },
                        ],
                        error: null,
                      }
                    }
                    return { data: [], error: null }
                  },
                  maybeSingle: async () =>
                    table === 'reviewers'
                      ? { data: { title: 'Biology notes' }, error: null }
                      : { data: null, error: null },
                }
              },
            }
          },
        }
      },
    }

    const deck = await loadStudyDeck(client, 'rev-1')
    expect(deck?.source).toBe('reviewer')
    expect(deck?.title).toBe('Biology notes')
    expect(deck?.cards).toEqual([
      { id: 't1', term: 'Osmosis', definition: 'Water movement', status: 'new', source: 'reviewer' },
    ])
  })

  it('returns null when neither flashcards nor reviewer terms exist', async () => {
    const client = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  order: async () => ({ data: [], error: null }),
                  maybeSingle: async () => ({ data: null, error: null }),
                }
              },
            }
          },
        }
      },
    }

    expect(await loadStudyDeck(client, 'missing')).toBeNull()
  })
})
