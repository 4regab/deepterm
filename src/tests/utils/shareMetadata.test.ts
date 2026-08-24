import { describe, expect, it } from 'bun:test'
import { buildSharePageMeta, parseSharedMaterial } from '@/utils/shareMetadata'
import type { SharedFlashcardSetData, SharedReviewerData } from '@/lib/schemas/sharing'

const flashcardShare: SharedFlashcardSetData = {
  type: 'flashcard_set',
  share: { id: 'share-1', code: 'abc12345', created_at: '2024-01-01T00:00:00Z' },
  material: { id: 'mat-1', title: 'Biology Cards', created_at: '2024-01-01T00:00:00Z' },
  items: [
    { id: '1', front: 'Cell', back: 'Basic unit of life' },
    { id: '2', front: 'DNA', back: 'Genetic material' },
  ],
  owner: { name: 'Ada', avatar: null },
}

const reviewerShare: SharedReviewerData = {
  type: 'reviewer',
  share: { id: 'share-2', code: 'rev12345', created_at: '2024-01-01T00:00:00Z' },
  material: {
    id: 'mat-2',
    title: 'History Reviewer',
    extraction_mode: 'full',
    created_at: '2024-01-01T00:00:00Z',
  },
  categories: [
    {
      id: 'cat-1',
      name: 'WWII',
      color: '#E0F2FE',
      terms: [
        { id: 't1', term: 'D-Day', definition: 'Allied invasion', examples: null, keywords: null },
        { id: 't2', term: 'Blitz', definition: 'Air campaign', examples: null, keywords: null },
      ],
    },
    {
      id: 'cat-2',
      name: 'Cold War',
      color: '#FCE7F3',
      terms: [
        { id: 't3', term: 'NATO', definition: 'Alliance', examples: null, keywords: null },
      ],
    },
  ],
  owner: { name: 'Ada', avatar: null },
}

describe('shareMetadata', () => {
  describe('parseSharedMaterial', () => {
    it('accepts a valid flashcard_set RPC payload', () => {
      expect(parseSharedMaterial(flashcardShare)?.type).toBe('flashcard_set')
    })

    it('accepts a valid reviewer RPC payload', () => {
      expect(parseSharedMaterial(reviewerShare)?.type).toBe('reviewer')
    })

    it('rejects the legacy flat metadata shape that used data.title and type=cards', () => {
      expect(parseSharedMaterial({
        title: 'Biology Cards',
        type: 'cards',
        items: [{ term: 'Cell', definition: 'Basic unit of life' }],
      })).toBeNull()
    })
  })

  describe('buildSharePageMeta', () => {
    it('uses material.title and flashcard_set type instead of data.title / cards', () => {
      const meta = buildSharePageMeta(flashcardShare)
      expect(meta.title).toBe('Biology Cards')
      expect(meta.typeLabel).toBe('Flashcards')
      expect(meta.itemCount).toBe(2)
      expect(meta.description).toContain('2 flashcards')
    })

    it('counts reviewer terms across categories instead of data.items', () => {
      const meta = buildSharePageMeta(reviewerShare)
      expect(meta.title).toBe('History Reviewer')
      expect(meta.typeLabel).toBe('Reviewer')
      expect(meta.itemCount).toBe(3)
      expect(meta.description).toContain('3 reviewer terms')
    })

    it('falls back to a generic title when material title is blank', () => {
      const meta = buildSharePageMeta({
        ...flashcardShare,
        material: { ...flashcardShare.material, title: '   ' },
      })
      expect(meta.title).toBe('Shared Study Material')
    })
  })
})
