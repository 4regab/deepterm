import { describe, expect, it } from 'bun:test'
import {
  MATERIAL_SELECT,
  sortMaterialsByRecency,
  toFlashcardSetItem,
  toFolderList,
  toReviewerItem,
} from '@/lib/materials/queries'
import { createFakeSupabase } from '@/tests/helpers/fakeSupabase'

const NOW = new Date('2026-01-10T00:00:00.000Z')

describe('MATERIAL_SELECT', () => {
  const materialShapes = [MATERIAL_SELECT.flashcardSets, MATERIAL_SELECT.reviewers]

  it('reads folders through the foreign key, never a flat text column', () => {
    for (const shape of [...materialShapes, MATERIAL_SELECT.flashcardSetDetail, MATERIAL_SELECT.reviewerDetail]) {
      expect(shape).toContain('folder_id')
      expect(shape).toContain('folders(')
      // A bare `folder` column would be PGRST204 on every row in production.
      expect(shape).not.toMatch(/(^|,)\s*folder\s*(,|$)/)
    }
  })

  it('is accepted by the live column list', async () => {
    // Runs the real select strings through a fake seeded with the deployed
    // columns. Reintroducing `folder` here fails with PGRST204.
    const fake = createFakeSupabase({
      tables: {
        flashcard_sets: [{ id: 's1', user_id: 'user-1', title: 'Cells', folder_id: null }],
        reviewers: [{ id: 'r1', user_id: 'user-1', title: 'Genes', folder_id: null }],
      },
    })

    const sets = await fake.from('flashcard_sets').select(MATERIAL_SELECT.flashcardSets)
    const reviewers = await fake.from('reviewers').select(MATERIAL_SELECT.reviewers)
    const folders = await fake.from('folders').select(MATERIAL_SELECT.folders)

    expect(sets.error).toBeNull()
    expect(reviewers.error).toBeNull()
    expect(folders.error).toBeNull()
  })

  it('resolves the embedded folder name for a filed material', async () => {
    const fake = createFakeSupabase({
      tables: {
        folders: [{ id: 'f1', user_id: 'user-1', name: 'Biology', created_at: 'x' }],
        flashcard_sets: [{ id: 's1', user_id: 'user-1', title: 'Cells', folder_id: 'f1' }],
      },
    })

    const { data } = await fake.from('flashcard_sets').select(MATERIAL_SELECT.flashcardSets)
    const row = (data as Array<Record<string, unknown>>)[0]

    expect(row.folder_id).toBe('f1')
    expect(row.folder).toEqual({ id: 'f1', name: 'Biology' })
  })
})

describe('row mappers', () => {
  it('maps a flashcard set row onto folderId and folderName', () => {
    const item = toFlashcardSetItem(
      {
        id: 's1',
        title: 'Cells',
        created_at: '2026-01-09T00:00:00.000Z',
        updated_at: '2026-01-09T00:00:00.000Z',
        folder_id: 'f1',
        folder: { id: 'f1', name: 'Biology' },
        flashcards: [{ count: 12 }],
      },
      NOW,
    )

    expect(item).toMatchObject({
      id: 's1',
      type: 'Flashcards',
      itemsCount: 12,
      folderId: 'f1',
      folderName: 'Biology',
      lastAccessed: '1d ago',
    })
  })

  it('maps an unfiled reviewer row and sums its term counts', () => {
    const item = toReviewerItem(
      {
        id: 'r1',
        title: 'Genes',
        created_at: '2026-01-10T00:00:00.000Z',
        updated_at: null,
        folder_id: null,
        folder: null,
        reviewer_categories: [
          { reviewer_terms: [{ count: 3 }] },
          { reviewer_terms: [{ count: 4 }] },
        ],
      },
      NOW,
    )

    expect(item.itemsCount).toBe(7)
    expect(item.folderId).toBeNull()
    expect(item.folderName).toBeNull()
  })

  it('never invents a folder name when the embed is absent', () => {
    const item = toFlashcardSetItem(
      {
        id: 's2',
        title: 'Loose',
        created_at: '2026-01-10T00:00:00.000Z',
        updated_at: null,
        folder_id: null,
      },
      NOW,
    )
    expect(item.folderName).toBeNull()
  })
})

describe('sortMaterialsByRecency', () => {
  it('puts the most recent first', () => {
    const items = sortMaterialsByRecency([
      { id: 'a', title: 'A', type: 'Note', itemsCount: 0, lastAccessed: '', sortDate: '2026-01-01T00:00:00.000Z', folderId: null, folderName: null },
      { id: 'b', title: 'B', type: 'Note', itemsCount: 0, lastAccessed: '', sortDate: '2026-02-01T00:00:00.000Z', folderId: null, folderName: null },
    ])
    expect(items.map((item) => item.id)).toEqual(['b', 'a'])
  })
})

describe('toFolderList', () => {
  it('maps rows to the Folder model', () => {
    expect(toFolderList([{ id: 'f1', name: 'Bio', created_at: 'x' }])).toEqual([
      { id: 'f1', name: 'Bio', createdAt: 'x' },
    ])
  })
})
