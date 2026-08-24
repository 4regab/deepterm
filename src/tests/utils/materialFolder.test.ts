import { describe, expect, it } from 'bun:test'
import {
  groupMaterialsByFolder,
  hasAnyFolder,
  listFolders,
  matchesFolderFilter,
  sanitizeFolder,
  UNCATEGORIZED_FOLDER,
} from '@/utils/materialFolder'

describe('sanitizeFolder', () => {
  it('trims whitespace and caps length', () => {
    expect(sanitizeFolder('  Biology  ')).toBe('Biology')
    expect(sanitizeFolder('   ')).toBeNull()
    expect(sanitizeFolder(null)).toBeNull()
    expect(sanitizeFolder('a'.repeat(50))?.length).toBe(40)
  })

  it('strips all angle brackets so residual markup cannot remain', () => {
    expect(sanitizeFolder('<b>Chem</b>')).toBe('bChem/b')
    expect(sanitizeFolder('<script')).toBe('script')
    expect(sanitizeFolder('<<script>alert(1)</script>')).toBe('scriptalert(1)/script')
    expect(sanitizeFolder('Bio<script src=x')).toBe('Bioscript src=x')
    expect(sanitizeFolder('<>')).toBeNull()
    expect(sanitizeFolder('<script')).not.toMatch(/[<>]/)
    expect(sanitizeFolder('AP Bio 101')).toBe('AP Bio 101')
  })
})

describe('folder listing and matching', () => {
  const items = [
    { title: 'A', folder: 'Biology' },
    { title: 'B', folder: ' history ' },
    { title: 'C', folder: null },
    { title: 'D' },
  ]

  it('lists unique named folders and detects whether any exist', () => {
    expect(listFolders(items)).toEqual(['Biology', 'history'])
    expect(hasAnyFolder(items)).toBe(true)
    expect(hasAnyFolder([{ folder: null }])).toBe(false)
  })

  it('filters by named folder, uncategorized, or all', () => {
    expect(matchesFolderFilter('Biology', null)).toBe(true)
    expect(matchesFolderFilter('Biology', 'Biology')).toBe(true)
    expect(matchesFolderFilter('history', 'Biology')).toBe(false)
    expect(matchesFolderFilter(null, UNCATEGORIZED_FOLDER)).toBe(true)
    expect(matchesFolderFilter('Biology', UNCATEGORIZED_FOLDER)).toBe(false)
  })
})

describe('groupMaterialsByFolder', () => {
  it('groups named folders alphabetically and leaves uncategorized last', () => {
    const groups = groupMaterialsByFolder([
      { id: '1', folder: 'Zoo' },
      { id: '2', folder: null },
      { id: '3', folder: 'Alpha' },
      { id: '4', folder: 'Zoo' },
    ])
    expect(groups.map((group) => group.key)).toEqual(['Alpha', 'Zoo', ''])
    expect(groups[1].items.map((item) => item.id)).toEqual(['1', '4'])
    expect(groups[2].items.map((item) => item.id)).toEqual(['2'])
  })
})
