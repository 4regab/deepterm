import { describe, it, expect, beforeEach } from 'bun:test'
import { useMaterialsStore } from '../lib/stores/materialsStore'
import type { Folder, MaterialItem } from '../lib/schemas/materials'
import { runOptimistic } from '../lib/folders/optimistic'
import { setMaterialFolder } from '../lib/folders/api'
import type { SupabaseLike } from '../lib/folders/api'
import { createFakeSupabase } from './helpers/fakeSupabase'

const BIOLOGY: Folder = { id: 'f-bio', name: 'Biology' }
const CHEMISTRY: Folder = { id: 'f-chem', name: 'Chemistry' }

function makeItem(overrides: Partial<MaterialItem> & { id: string }): MaterialItem {
  return {
    title: `Item ${overrides.id}`,
    type: 'Flashcards',
    itemsCount: 1,
    lastAccessed: '2026-01-01',
    folderId: null,
    folderName: null,
    ...overrides,
  }
}

const mockMaterials: MaterialItem[] = [
  makeItem({ id: '1', title: 'Math Notes', type: 'Note', itemsCount: 5 }),
  makeItem({ id: '2', title: 'Science Flashcards', type: 'Flashcards', itemsCount: 10 }),
  makeItem({ id: '3', title: 'History Reviewer', type: 'Reviewer', itemsCount: 8 }),
]

const reset = () =>
  useMaterialsStore.setState({
    items: [],
    folders: [],
    seeded: false,
    searchQuery: '',
    activeFilter: 'All',
    activeFolderId: null,
    loading: false,
    error: null,
  })

describe('materialsStore', () => {
  beforeEach(reset)

  describe('folders drive the folder UI', () => {
    it('holds folders independently of whether any material is filed', () => {
      // The old code inferred folder UI from loaded materials, so a brand new
      // empty folder was invisible until something was filed into it.
      useMaterialsStore.getState().setItems(mockMaterials)
      useMaterialsStore.getState().setFolders([BIOLOGY])

      expect(useMaterialsStore.getState().folders).toEqual([BIOLOGY])
      expect(useMaterialsStore.getState().items.every((item) => item.folderId === null)).toBe(true)
    })

    it('keeps folders sorted by name', () => {
      useMaterialsStore.getState().setFolders([CHEMISTRY, BIOLOGY])
      expect(useMaterialsStore.getState().folders.map((f) => f.name)).toEqual([
        'Biology',
        'Chemistry',
      ])
      useMaterialsStore.getState().addFolder({ id: 'f-a', name: 'Anatomy' })
      expect(useMaterialsStore.getState().folders[0].name).toBe('Anatomy')
    })
  })

  describe('seeded', () => {
    it('flips once the server payload lands, so an empty library reads as empty', () => {
      expect(useMaterialsStore.getState().seeded).toBe(false)
      useMaterialsStore.getState().setItems([])
      expect(useMaterialsStore.getState().seeded).toBe(true)
    })
  })

  describe('setItemFolder', () => {
    it('stores the id and denormalizes the name from the folder list', () => {
      useMaterialsStore.getState().setFolders([BIOLOGY])
      useMaterialsStore.getState().setItems([makeItem({ id: '1' })])

      useMaterialsStore.getState().setItemFolder('1', BIOLOGY.id)

      expect(useMaterialsStore.getState().items[0]).toMatchObject({
        folderId: 'f-bio',
        folderName: 'Biology',
      })
    })

    it('clears both fields when unfiling', () => {
      useMaterialsStore.getState().setFolders([BIOLOGY])
      useMaterialsStore.getState().setItems([makeItem({ id: '1', folderId: BIOLOGY.id, folderName: 'Biology' })])

      useMaterialsStore.getState().setItemFolder('1', null)

      expect(useMaterialsStore.getState().items[0].folderId).toBeNull()
      expect(useMaterialsStore.getState().items[0].folderName).toBeNull()
    })
  })

  describe('renameFolder', () => {
    it('renames the folder and every material showing its name', () => {
      useMaterialsStore.getState().setFolders([BIOLOGY])
      useMaterialsStore.getState().setItems([
        makeItem({ id: '1', folderId: BIOLOGY.id, folderName: 'Biology' }),
        makeItem({ id: '2' }),
      ])

      useMaterialsStore.getState().renameFolder(BIOLOGY.id, 'Life Sciences')

      expect(useMaterialsStore.getState().folders[0].name).toBe('Life Sciences')
      expect(useMaterialsStore.getState().items[0].folderName).toBe('Life Sciences')
      expect(useMaterialsStore.getState().items[1].folderName).toBeNull()
    })
  })

  describe('removeFolder', () => {
    it('mirrors ON DELETE SET NULL: materials survive as unfiled', () => {
      useMaterialsStore.getState().setFolders([BIOLOGY, CHEMISTRY])
      useMaterialsStore.getState().setItems([
        makeItem({ id: '1', folderId: BIOLOGY.id, folderName: 'Biology' }),
        makeItem({ id: '2', folderId: CHEMISTRY.id, folderName: 'Chemistry' }),
      ])
      useMaterialsStore.getState().setActiveFolderId(BIOLOGY.id)

      useMaterialsStore.getState().removeFolder(BIOLOGY.id)

      const state = useMaterialsStore.getState()
      expect(state.folders.map((f) => f.id)).toEqual([CHEMISTRY.id])
      expect(state.items).toHaveLength(2)
      expect(state.items[0]).toMatchObject({ folderId: null, folderName: null })
      expect(state.items[1].folderId).toBe(CHEMISTRY.id)
      // The filter cannot stay pointed at a folder that is gone.
      expect(state.activeFolderId).toBeNull()
    })
  })

  describe('snapshot and restore', () => {
    it('returns the store to its exact previous shape', () => {
      useMaterialsStore.getState().setFolders([BIOLOGY])
      useMaterialsStore.getState().setItems([makeItem({ id: '1' })])
      const before = useMaterialsStore.getState().snapshot()

      useMaterialsStore.getState().setItemFolder('1', BIOLOGY.id)
      useMaterialsStore.getState().removeFolder(BIOLOGY.id)
      useMaterialsStore.getState().restore(before)

      expect(useMaterialsStore.getState().items).toEqual(before.items)
      expect(useMaterialsStore.getState().folders).toEqual(before.folders)
    })
  })

  describe('optimistic move against the real write path', () => {
    it('keeps the move when the database accepts it', async () => {
      const fake = createFakeSupabase({
        tables: {
          folders: [{ id: BIOLOGY.id, user_id: 'user-1', name: 'Biology', created_at: 'x' }],
          flashcard_sets: [{ id: '1', user_id: 'user-1', title: 'Item 1', folder_id: null }],
        },
      })
      useMaterialsStore.getState().setFolders([BIOLOGY])
      useMaterialsStore.getState().setItems([makeItem({ id: '1' })])
      const before = useMaterialsStore.getState().snapshot()
      let reported: string | null = null

      const ok = await runOptimistic({
        apply: () => useMaterialsStore.getState().setItemFolder('1', BIOLOGY.id),
        rollback: () => useMaterialsStore.getState().restore(before),
        write: () =>
          setMaterialFolder(fake as unknown as SupabaseLike, {
            materialId: '1',
            materialType: 'Flashcards',
            folderId: BIOLOGY.id,
          }),
        onError: (message) => { reported = message },
      })

      expect(ok).toBe(true)
      expect(reported).toBeNull()
      expect(useMaterialsStore.getState().items[0].folderId).toBe(BIOLOGY.id)
      expect(fake.tables.flashcard_sets[0].folder_id).toBe(BIOLOGY.id)
    })

    it('rolls the chip back and reports when the database rejects the write', async () => {
      // This is the original bug, end to end: the store used to keep the
      // optimistic folder after a failed write and tell the user it saved.
      const fake = createFakeSupabase({
        failWith: {
          code: 'PGRST204',
          message: "Could not find the 'folder' column of 'flashcard_sets' in the schema cache",
        },
      })
      useMaterialsStore.getState().setFolders([BIOLOGY])
      useMaterialsStore.getState().setItems([makeItem({ id: '1' })])
      const before = useMaterialsStore.getState().snapshot()
      let reported: string | null = null

      const ok = await runOptimistic({
        apply: () => useMaterialsStore.getState().setItemFolder('1', BIOLOGY.id),
        rollback: () => useMaterialsStore.getState().restore(before),
        write: () =>
          setMaterialFolder(fake as unknown as SupabaseLike, {
            materialId: '1',
            materialType: 'Flashcards',
            folderId: BIOLOGY.id,
          }),
        onError: (message) => { reported = message },
      })

      expect(ok).toBe(false)
      expect(useMaterialsStore.getState().items[0].folderId).toBeNull()
      expect(useMaterialsStore.getState().items[0].folderName).toBeNull()
      expect(reported).not.toBeNull()
      expect(reported!).toContain('nothing was saved')
    })
  })

  describe('getFilteredItems', () => {
    beforeEach(() => {
      useMaterialsStore.getState().setItems(mockMaterials)
    })

    it('returns all items when nothing is filtered', () => {
      expect(useMaterialsStore.getState().getFilteredItems()).toEqual(mockMaterials)
    })

    it('filters by type, treating Cards as Flashcards', () => {
      useMaterialsStore.getState().setActiveFilter('Cards')
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered).toHaveLength(1)
      expect(filtered[0].type).toBe('Flashcards')
    })

    it('filters by search, case insensitively', () => {
      useMaterialsStore.getState().setSearchQuery('MATH')
      expect(useMaterialsStore.getState().getFilteredItems()).toHaveLength(1)
    })

    it('filters by folder id', () => {
      useMaterialsStore.getState().setFolders([BIOLOGY, CHEMISTRY])
      useMaterialsStore.getState().setItems([
        makeItem({ id: '1', title: 'Bio', folderId: BIOLOGY.id, folderName: 'Biology' }),
        makeItem({ id: '2', title: 'Chem', folderId: CHEMISTRY.id, folderName: 'Chemistry' }),
        makeItem({ id: '3', title: 'Loose' }),
      ])

      useMaterialsStore.getState().setActiveFolderId(BIOLOGY.id)
      const filtered = useMaterialsStore.getState().getFilteredItems()
      expect(filtered.map((item) => item.title)).toEqual(['Bio'])
    })

    it('returns an empty list for a query that matches nothing', () => {
      useMaterialsStore.getState().setSearchQuery('xyz')
      expect(useMaterialsStore.getState().getFilteredItems()).toHaveLength(0)
      // The library itself is not empty -- the UI must tell these apart.
      expect(useMaterialsStore.getState().items).toHaveLength(3)
    })
  })

  describe('error state', () => {
    it('holds and clears an error', () => {
      const error = new Error('Test error')
      useMaterialsStore.getState().setError(error)
      expect(useMaterialsStore.getState().error).toBe(error)
      useMaterialsStore.getState().setError(null)
      expect(useMaterialsStore.getState().error).toBeNull()
    })
  })
})
