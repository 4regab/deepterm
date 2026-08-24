import { describe, expect, it } from 'bun:test'
import {
  isMissingColumnError,
  mutateWithOptionalColumn,
  selectWithOptionalColumn,
} from '@/utils/optionalColumn'

describe('isMissingColumnError', () => {
  it('detects postgres and postgrest missing-column codes', () => {
    expect(isMissingColumnError({ code: '42703', message: 'column flashcard_sets.folder does not exist' }, 'folder')).toBe(true)
    expect(isMissingColumnError({ code: 'PGRST204', message: "Could not find the 'folder' column of 'flashcard_sets' in the schema cache" }, 'folder')).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isMissingColumnError({ code: '42501', message: 'permission denied' }, 'folder')).toBe(false)
    expect(isMissingColumnError({ code: '42703', message: 'column flashcard_sets.color does not exist' }, 'folder')).toBe(false)
    expect(isMissingColumnError(null, 'folder')).toBe(false)
  })
})

describe('selectWithOptionalColumn', () => {
  it('retries without the column when it is missing', async () => {
    const result = await selectWithOptionalColumn(
      async () => ({ data: null, error: { code: 'PGRST204', message: "Could not find the 'folder' column" } }),
      async () => ({ data: [{ id: '1' }], error: null }),
      'folder',
    )
    expect(result.data).toEqual([{ id: '1' }])
    expect(result.error).toBeNull()
  })

  it('does not retry other failures', async () => {
    const result = await selectWithOptionalColumn(
      async () => ({ data: null, error: { code: '42501', message: 'permission denied for folder' } }),
      async () => ({ data: [{ id: '1' }], error: null }),
      'folder',
    )
    expect(result.data).toBeNull()
    expect(result.error?.code).toBe('42501')
  })
})

describe('mutateWithOptionalColumn', () => {
  it('retries the write without the optional column', async () => {
    const calls: Array<Record<string, unknown>> = []
    const result = await mutateWithOptionalColumn(
      async (payload) => {
        calls.push(payload)
        if ('folder' in payload) {
          return { data: null, error: { code: '42703', message: 'column folder does not exist' } }
        }
        return { data: { id: 'set-1' }, error: null }
      },
      { title: 'Bio', folder: 'Biology' },
      'folder',
    )
    expect(calls).toHaveLength(2)
    expect(calls[1]).toEqual({ title: 'Bio' })
    expect(result.data).toEqual({ id: 'set-1' })
  })

  it('returns the first success without a retry', async () => {
    let calls = 0
    const result = await mutateWithOptionalColumn(
      async (payload) => {
        calls += 1
        return { data: payload, error: null }
      },
      { title: 'Bio', folder: 'Biology' },
      'folder',
    )
    expect(calls).toBe(1)
    expect(result.data).toEqual({ title: 'Bio', folder: 'Biology' })
  })
})
