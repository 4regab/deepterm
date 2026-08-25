import { describe, expect, it } from 'bun:test'
import type { Folder, MaterialItem } from '@/lib/schemas/materials'
import {
  findDuplicateFolder,
  folderNameById,
  groupMaterialsByFolder,
  matchesFolderFilter,
  sanitizeFolder,
  sortFolders,
  UNFILED_FOLDER_ID,
  validateFolderName,
} from '@/utils/materialFolder'
import { LIVE_COLUMNS } from '@/tests/helpers/fakeSupabase'

const BIOLOGY: Folder = { id: 'f-bio', name: 'Biology' }
const ALPHA: Folder = { id: 'f-alpha', name: 'Alpha' }
const EMPTY: Folder = { id: 'f-empty', name: 'Empty Shelf' }

function item(id: string, folderId: string | null): MaterialItem {
  return {
    id,
    title: `Item ${id}`,
    type: 'Flashcards',
    itemsCount: 1,
    lastAccessed: '1d ago',
    folderId,
    folderName: null,
  }
}

describe('the folder model these helpers assume', () => {
  it('is a foreign key, not a text column', () => {
    // These helpers key off folderId. If someone reintroduces a flat `folder`
    // string, this pins why that is wrong: the column does not exist.
    expect(LIVE_COLUMNS.flashcard_sets).toContain('folder_id')
    expect(LIVE_COLUMNS.flashcard_sets).not.toContain('folder')
    expect(LIVE_COLUMNS.folders).toEqual(['id', 'user_id', 'name', 'created_at'])
  })
})

describe('sanitizeFolder', () => {
  it('matches private.sanitize_folder_name: trim, collapse, cap at 40', () => {
    expect(sanitizeFolder('  Biology  ')).toBe('Biology')
    expect(sanitizeFolder('AP   Bio   101')).toBe('AP Bio 101')
    expect(sanitizeFolder('   ')).toBeNull()
    expect(sanitizeFolder(null)).toBeNull()
    expect(sanitizeFolder('a'.repeat(50))?.length).toBe(40)
  })

  it('strips all angle brackets so residual markup cannot remain', () => {
    expect(sanitizeFolder('<b>Chem</b>')).toBe('bChem/b')
    expect(sanitizeFolder('<script')).toBe('script')
    expect(sanitizeFolder('<>')).toBeNull()
    expect(sanitizeFolder('<script')).not.toMatch(/[<>]/)
  })
})

describe('validateFolderName', () => {
  it('rejects an empty name the way the trigger does', () => {
    const result = validateFolderName('  <>  ', [])
    expect(result).toEqual({ ok: false, message: 'Folder name is required.' })
  })

  it('rejects a case-insensitive duplicate, mirroring folders_user_lower_name_idx', () => {
    const result = validateFolderName('biology', [BIOLOGY])
    expect(result.ok).toBe(false)
    expect(findDuplicateFolder([BIOLOGY], 'BIOLOGY')).toEqual(BIOLOGY)
  })

  it('allows a folder to keep its own name while renaming', () => {
    expect(validateFolderName('Biology', [BIOLOGY], BIOLOGY.id)).toEqual({
      ok: true,
      name: 'Biology',
    })
  })

  it('returns the sanitized name that will actually be stored', () => {
    expect(validateFolderName('  Marine   Bio ', [])).toEqual({ ok: true, name: 'Marine Bio' })
  })
})

describe('matchesFolderFilter', () => {
  it('matches everything when no folder is selected', () => {
    expect(matchesFolderFilter('f-bio', null)).toBe(true)
    expect(matchesFolderFilter(null, null)).toBe(true)
  })

  it('matches by folder id, not by name', () => {
    expect(matchesFolderFilter('f-bio', 'f-bio')).toBe(true)
    expect(matchesFolderFilter('f-alpha', 'f-bio')).toBe(false)
  })

  it('selects unfiled materials with the sentinel', () => {
    expect(matchesFolderFilter(null, UNFILED_FOLDER_ID)).toBe(true)
    expect(matchesFolderFilter(undefined, UNFILED_FOLDER_ID)).toBe(true)
    expect(matchesFolderFilter('f-bio', UNFILED_FOLDER_ID)).toBe(false)
  })
})

describe('sortFolders and folderNameById', () => {
  it('sorts case-insensitively', () => {
    expect(sortFolders([BIOLOGY, ALPHA]).map((f) => f.name)).toEqual(['Alpha', 'Biology'])
    expect(sortFolders([{ name: 'beta' }, { name: 'Alpha' }]).map((f) => f.name)).toEqual([
      'Alpha',
      'beta',
    ])
  })

  it('resolves a display name from an id', () => {
    expect(folderNameById([BIOLOGY], 'f-bio')).toBe('Biology')
    expect(folderNameById([BIOLOGY], null)).toBeNull()
    expect(folderNameById([BIOLOGY], 'gone')).toBeNull()
  })
})

describe('groupMaterialsByFolder', () => {
  it('keeps a folder that has no materials', () => {
    // The old text-chip model could not represent this at all: a folder only
    // existed while some material carried its name.
    const groups = groupMaterialsByFolder([item('1', BIOLOGY.id)], [BIOLOGY, EMPTY])

    expect(groups.map((group) => group.folder?.name)).toEqual(['Biology', 'Empty Shelf'])
    expect(groups[1].items).toEqual([])
  })

  it('can hide empty folders while a filter is active', () => {
    const groups = groupMaterialsByFolder([item('1', BIOLOGY.id)], [BIOLOGY, EMPTY], {
      includeEmptyFolders: false,
    })
    expect(groups.map((group) => group.key)).toEqual([BIOLOGY.id])
  })

  it('orders folders by name and puts unfiled last', () => {
    const groups = groupMaterialsByFolder(
      [item('1', BIOLOGY.id), item('2', null), item('3', ALPHA.id)],
      [BIOLOGY, ALPHA],
    )
    expect(groups.map((group) => group.key)).toEqual([ALPHA.id, BIOLOGY.id, UNFILED_FOLDER_ID])
    expect(groups[2].items.map((i) => i.id)).toEqual(['2'])
  })

  it('treats a folder_id the user no longer has as unfiled', () => {
    const groups = groupMaterialsByFolder([item('1', 'deleted-elsewhere')], [BIOLOGY])
    const unfiled = groups.find((group) => group.key === UNFILED_FOLDER_ID)
    expect(unfiled?.items.map((i) => i.id)).toEqual(['1'])
  })

  it('produces no unfiled group when everything is filed', () => {
    const groups = groupMaterialsByFolder([item('1', BIOLOGY.id)], [BIOLOGY])
    expect(groups.some((group) => group.key === UNFILED_FOLDER_ID)).toBe(false)
  })
})
