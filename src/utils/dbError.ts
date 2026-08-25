export interface DbErrorLike {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

/**
 * PostgREST reports a column the API does not know about as PGRST204;
 * Postgres reports it as 42703. Historically this codebase caught these and
 * silently retried without the column, which turned a broken deploy into a
 * fake success. They are now treated as loud, unrecoverable bugs.
 */
const SCHEMA_MISMATCH_CODES = new Set(['42703', 'PGRST204'])

/** Messages raised by the triggers in 005_folders.sql, safe to show verbatim. */
const TRIGGER_MESSAGES = new Set([
  'Folder not found',
  'Folder name is required',
  'Not authenticated',
  'Not authorized',
])

function toErrorLike(error: unknown): DbErrorLike | null {
  if (!error) return null
  if (error instanceof Error) return { message: error.message }
  if (typeof error === 'object') return error as DbErrorLike
  if (typeof error === 'string') return { message: error }
  return null
}

export function isSchemaMismatch(error: unknown): boolean {
  const err = toErrorLike(error)
  if (!err) return false
  if (SCHEMA_MISMATCH_CODES.has(err.code ?? '')) return true
  const message = (err.message ?? '').toLowerCase()
  return (
    (message.includes('column') && message.includes('does not exist')) ||
    message.includes('schema cache')
  )
}

/**
 * Turns a Supabase/Postgres error into something a user can act on.
 * Never returns an empty string: a failed write must always say so.
 */
export function describeDbError(error: unknown, fallback: string): string {
  const err = toErrorLike(error)
  if (!err) return fallback

  const raw = (err.message ?? '').trim()

  if (isSchemaMismatch(error)) {
    return `${fallback} The app and the database disagree about this table, so nothing was saved. Please report this.`
  }

  switch (err.code) {
    case '23505':
      return 'A folder with that name already exists.'
    case '23503':
      return 'That folder no longer exists. Reload and try again.'
    case '23514':
      return 'That name is not allowed. Use 1 to 40 characters.'
    case '42501':
      return 'You do not have permission to change this.'
    case 'PGRST301':
      return 'Your session expired. Sign in again.'
    case 'PGRST116':
      return 'That item no longer exists. Reload and try again.'
  }

  if (TRIGGER_MESSAGES.has(raw)) return `${raw}.`
  if (raw) return `${fallback} ${raw}`
  return fallback
}
