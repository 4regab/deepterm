import { describe, expect, it } from 'bun:test'
import {
  createFolder,
  deleteFolder,
  deleteMaterial,
  fetchFolders,
  materialTable,
  renameFolder,
  setMaterialFolder,
  type SupabaseLike,
} from '@/lib/folders/api'
import { createFakeSupabase, LIVE_COLUMNS } from '@/tests/helpers/fakeSupabase'

function db(fake: ReturnType<typeof createFakeSupabase>): SupabaseLike {
  return fake as unknown as SupabaseLike
}

describe('the live schema this module targets', () => {
  it('has folder_id on both material tables and no flat folder column', () => {
    // The bug was code written against a `folder text` column that was never
    // deployed. Pin the real shape so a regression is loud.
    expect(LIVE_COLUMNS.flashcard_sets).toContain('folder_id')
    expect(LIVE_COLUMNS.reviewers).toContain('folder_id')
    expect(LIVE_COLUMNS.flashcard_sets).not.toContain('folder')
    expect(LIVE_COLUMNS.reviewers).not.toContain('folder')
  })

  it('rejects a write to the phantom `folder` column the way production does', async () => {
    const fake = createFakeSupabase()
    const { error } = await fake.from('flashcard_sets').update({ folder: 'Biology' }).eq('id', 'x')
    expect(error?.code).toBe('PGRST204')
  })
})

describe('materialTable', () => {
  it('routes each material type to its table', () => {
    expect(materialTable('Flashcards')).toBe('flashcard_sets')
    expect(materialTable('Reviewer')).toBe('reviewers')
  })
})

describe('createFolder', () => {
  it('persists a folder and returns it', async () => {
    const fake = createFakeSupabase()
    const { data, error } = await createFolder(db(fake), { userId: 'user-1', name: 'Biology' })

    expect(error).toBeNull()
    expect(data?.name).toBe('Biology')
    // The write must actually land. The old code path reported success without a row.
    expect(fake.tables.folders).toHaveLength(1)
    expect(fake.tables.folders[0].user_id).toBe('user-1')
  })

  it('surfaces the unique-index violation instead of pretending it saved', async () => {
    const fake = createFakeSupabase()
    await createFolder(db(fake), { userId: 'user-1', name: 'Biology' })
    const { data, error } = await createFolder(db(fake), { userId: 'user-1', name: 'biology' })

    expect(data).toBeNull()
    expect(error).toBe('A folder with that name already exists.')
    expect(fake.tables.folders).toHaveLength(1)
  })

  it('reports a schema mismatch loudly rather than retrying without the column', async () => {
    const fake = createFakeSupabase({
      failWith: {
        code: 'PGRST204',
        message: "Could not find the 'name' column of 'folders' in the schema cache",
      },
    })
    const { data, error } = await createFolder(db(fake), { userId: 'user-1', name: 'Biology' })

    expect(data).toBeNull()
    expect(error).toContain('nothing was saved')
  })
})

describe('fetchFolders', () => {
  it('returns folders sorted by name', async () => {
    const fake = createFakeSupabase({
      tables: {
        folders: [
          { id: 'f2', user_id: 'user-1', name: 'Zoology', created_at: 'x' },
          { id: 'f1', user_id: 'user-1', name: 'Anatomy', created_at: 'x' },
        ],
      },
    })
    const { data, error } = await fetchFolders(db(fake))

    expect(error).toBeNull()
    expect(data?.map((folder) => folder.name)).toEqual(['Anatomy', 'Zoology'])
  })

  it('surfaces a read failure instead of returning an empty list', async () => {
    const fake = createFakeSupabase({ failWith: { code: '42501', message: 'permission denied' } })
    const { data, error } = await fetchFolders(db(fake))

    expect(data).toBeNull()
    expect(error).toBe('You do not have permission to change this.')
  })
})

describe('renameFolder', () => {
  it('renames and returns the updated row', async () => {
    const fake = createFakeSupabase({
      tables: { folders: [{ id: 'f1', user_id: 'user-1', name: 'Bio', created_at: 'x' }] },
    })
    const { data, error } = await renameFolder(db(fake), { id: 'f1', name: 'Biology' })

    expect(error).toBeNull()
    expect(data?.name).toBe('Biology')
    expect(fake.tables.folders[0].name).toBe('Biology')
  })

  it('fails when the folder is gone rather than silently matching zero rows', async () => {
    const fake = createFakeSupabase()
    const { data, error } = await renameFolder(db(fake), { id: 'missing', name: 'Biology' })

    expect(data).toBeNull()
    expect(error).toBe('That item no longer exists. Reload and try again.')
  })
})

describe('deleteFolder', () => {
  it('unfiles the materials instead of deleting them', async () => {
    const fake = createFakeSupabase({
      tables: {
        folders: [{ id: 'f1', user_id: 'user-1', name: 'Bio', created_at: 'x' }],
        flashcard_sets: [
          { id: 's1', user_id: 'user-1', title: 'Cells', folder_id: 'f1' },
        ],
        reviewers: [{ id: 'r1', user_id: 'user-1', title: 'Genes', folder_id: 'f1' }],
      },
    })

    const { error } = await deleteFolder(db(fake), { id: 'f1' })

    expect(error).toBeNull()
    expect(fake.tables.folders).toHaveLength(0)
    expect(fake.tables.flashcard_sets).toHaveLength(1)
    expect(fake.tables.flashcard_sets[0].folder_id).toBeNull()
    expect(fake.tables.reviewers[0].folder_id).toBeNull()
  })

  it('treats zero affected rows as a failure, not a success', async () => {
    const fake = createFakeSupabase()
    const { data, error } = await deleteFolder(db(fake), { id: 'nope' })

    expect(data).toBeNull()
    expect(error).toBe('That folder no longer exists. Reload and try again.')
  })
})

describe('setMaterialFolder', () => {
  it('writes folder_id on the flashcard set', async () => {
    const fake = createFakeSupabase({
      tables: {
        folders: [{ id: 'f1', user_id: 'user-1', name: 'Bio', created_at: 'x' }],
        flashcard_sets: [{ id: 's1', user_id: 'user-1', title: 'Cells', folder_id: null }],
      },
    })

    const { error } = await setMaterialFolder(db(fake), {
      materialId: 's1',
      materialType: 'Flashcards',
      folderId: 'f1',
    })

    expect(error).toBeNull()
    expect(fake.tables.flashcard_sets[0].folder_id).toBe('f1')
    // And it must have gone through folder_id, never a flat text column.
    const write = fake.calls.find((call) => call.op === 'update')
    expect(Object.keys(write?.payload ?? {})).toEqual(['folder_id'])
  })

  it('unassigns with null', async () => {
    const fake = createFakeSupabase({
      tables: {
        folders: [{ id: 'f1', user_id: 'user-1', name: 'Bio', created_at: 'x' }],
        reviewers: [{ id: 'r1', user_id: 'user-1', title: 'Genes', folder_id: 'f1' }],
      },
    })

    const { error } = await setMaterialFolder(db(fake), {
      materialId: 'r1',
      materialType: 'Reviewer',
      folderId: null,
    })

    expect(error).toBeNull()
    expect(fake.tables.reviewers[0].folder_id).toBeNull()
  })

  it('surfaces the ownership trigger when the folder belongs to someone else', async () => {
    const fake = createFakeSupabase({
      tables: {
        folders: [{ id: 'f9', user_id: 'someone-else', name: 'Theirs', created_at: 'x' }],
        flashcard_sets: [{ id: 's1', user_id: 'user-1', title: 'Cells', folder_id: null }],
      },
    })

    const { error } = await setMaterialFolder(db(fake), {
      materialId: 's1',
      materialType: 'Flashcards',
      folderId: 'f9',
    })

    expect(error).toBe('Folder not found.')
    expect(fake.tables.flashcard_sets[0].folder_id).toBeNull()
  })
})

describe('deleteMaterial', () => {
  it('deletes the row', async () => {
    const fake = createFakeSupabase({
      tables: { reviewers: [{ id: 'r1', user_id: 'user-1', title: 'Genes', folder_id: null }] },
    })
    const { error } = await deleteMaterial(db(fake), { materialId: 'r1', materialType: 'Reviewer' })

    expect(error).toBeNull()
    expect(fake.tables.reviewers).toHaveLength(0)
  })

  it('reports a delete that matched nothing', async () => {
    const fake = createFakeSupabase()
    const { error } = await deleteMaterial(db(fake), { materialId: 'gone', materialType: 'Reviewer' })

    expect(error).toBe('That material no longer exists. Reload and try again.')
  })
})
