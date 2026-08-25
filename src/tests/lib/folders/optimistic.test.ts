import { describe, expect, it } from 'bun:test'
import { runOptimistic } from '@/lib/folders/optimistic'

describe('runOptimistic', () => {
  it('keeps the optimistic state when the write succeeds', async () => {
    const events: string[] = []
    const errors: string[] = []

    const ok = await runOptimistic({
      apply: () => events.push('apply'),
      rollback: () => events.push('rollback'),
      write: async () => ({ data: { id: '1' }, error: null }),
      onError: (message) => errors.push(message),
    })

    expect(ok).toBe(true)
    expect(events).toEqual(['apply'])
    expect(errors).toEqual([])
  })

  it('rolls back and reports when the write returns an error', async () => {
    // This is the exact shape of the original bug: the UI showed the folder as
    // saved while the write had failed. Rollback plus a message is the contract.
    const events: string[] = []
    const errors: string[] = []

    const ok = await runOptimistic({
      apply: () => events.push('apply'),
      rollback: () => events.push('rollback'),
      write: async () => ({ data: null, error: 'Could not move the material.' }),
      onError: (message) => errors.push(message),
    })

    expect(ok).toBe(false)
    expect(events).toEqual(['apply', 'rollback'])
    expect(errors).toEqual(['Could not move the material.'])
  })

  it('rolls back and reports when the write throws', async () => {
    const events: string[] = []
    const errors: string[] = []

    const ok = await runOptimistic({
      apply: () => events.push('apply'),
      rollback: () => events.push('rollback'),
      write: async () => {
        throw new Error('Network request failed')
      },
      onError: (message) => errors.push(message),
      fallbackMessage: 'Could not move the material.',
    })

    expect(ok).toBe(false)
    expect(events).toEqual(['apply', 'rollback'])
    expect(errors[0]).toContain('Network request failed')
  })

  it('never resolves true without a clean write', async () => {
    const outcomes = [
      { data: null, error: 'boom' },
      { data: null, error: 'PGRST204' },
    ]
    for (const outcome of outcomes) {
      const ok = await runOptimistic({
        apply: () => {},
        rollback: () => {},
        write: async () => outcome,
        onError: () => {},
      })
      expect(ok).toBe(false)
    }
  })
})
