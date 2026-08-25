import { describe, expect, it } from 'bun:test'
import { describeDbError, isSchemaMismatch } from '@/utils/dbError'

describe('isSchemaMismatch', () => {
  it('recognises the codes that used to be silently swallowed', () => {
    expect(isSchemaMismatch({ code: 'PGRST204', message: "Could not find the 'folder' column" })).toBe(true)
    expect(isSchemaMismatch({ code: '42703', message: 'column flashcard_sets.folder does not exist' })).toBe(true)
  })

  it('does not treat ordinary failures as schema drift', () => {
    expect(isSchemaMismatch({ code: '42501', message: 'permission denied' })).toBe(false)
    expect(isSchemaMismatch(null)).toBe(false)
  })
})

describe('describeDbError', () => {
  it('says plainly that nothing was saved on a schema mismatch', () => {
    const message = describeDbError(
      { code: 'PGRST204', message: "Could not find the 'folder' column of 'flashcard_sets' in the schema cache" },
      'Could not move the material.',
    )
    expect(message).toContain('Could not move the material.')
    expect(message).toContain('nothing was saved')
  })

  it('maps the constraints defined in 005_folders.sql', () => {
    expect(describeDbError({ code: '23505' }, 'x')).toBe('A folder with that name already exists.')
    expect(describeDbError({ code: '23503' }, 'x')).toBe('That folder no longer exists. Reload and try again.')
    expect(describeDbError({ code: '23514' }, 'x')).toBe('That name is not allowed. Use 1 to 40 characters.')
  })

  it('passes trigger messages through', () => {
    expect(describeDbError({ code: 'P0001', message: 'Folder not found' }, 'x')).toBe('Folder not found.')
    expect(describeDbError({ code: 'P0001', message: 'Folder name is required' }, 'x')).toBe(
      'Folder name is required.',
    )
  })

  it('always returns something the user can see', () => {
    expect(describeDbError(null, 'Could not save.')).toBe('Could not save.')
    expect(describeDbError({}, 'Could not save.')).toBe('Could not save.')
    expect(describeDbError(new Error('Failed to fetch'), 'Could not save.')).toBe(
      'Could not save. Failed to fetch',
    )
  })
})
