import { describeDbError } from '@/utils/dbError'
import type { Outcome } from './api'

export interface OptimisticWrite<T> {
  /** Move the UI ahead of the server. */
  apply: () => void
  /** Put the UI back exactly as it was. Must be safe to call once. */
  rollback: () => void
  write: () => Promise<Outcome<T>>
  onError: (message: string) => void
  fallbackMessage?: string
}

/**
 * Applies an optimistic update, runs the write, and rolls back on any failure.
 *
 * The only way to get `true` out of this is a write that returned no error, so
 * no caller can report success on a failed write.
 */
export async function runOptimistic<T>(options: OptimisticWrite<T>): Promise<boolean> {
  const { apply, rollback, write, onError, fallbackMessage = 'That did not save.' } = options

  apply()
  try {
    const { error } = await write()
    if (error) {
      rollback()
      onError(error)
      return false
    }
    return true
  } catch (thrown) {
    rollback()
    onError(describeDbError(thrown, fallbackMessage))
    return false
  }
}
