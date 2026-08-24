export const MISSING_COLUMN_CODES = new Set(['42703', 'PGRST204'])

export interface ColumnErrorLike {
  code?: string | null
  message?: string | null
}

export function isMissingColumnError(
  error: ColumnErrorLike | null | undefined,
  column?: string,
): boolean {
  if (!error) return false
  const code = error.code ?? ''
  const message = (error.message ?? '').toLowerCase()
  const mentionsColumn = !column || message.includes(column.toLowerCase())
  if (MISSING_COLUMN_CODES.has(code) && mentionsColumn) return true
  if (!mentionsColumn) return false
  return (
    (message.includes('column') && message.includes('does not exist')) ||
    message.includes('schema cache') ||
    message.includes('could not find the')
  )
}

export function asQueryData<T>(
  result: { data: unknown; error: ColumnErrorLike | null },
): { data: T | null; error: ColumnErrorLike | null } {
  return { data: (result.data as T | null) ?? null, error: result.error }
}

export async function selectWithOptionalColumn<T>(
  withColumn: () => PromiseLike<{ data: T | null; error: ColumnErrorLike | null }>,
  withoutColumn: () => PromiseLike<{ data: T | null; error: ColumnErrorLike | null }>,
  column: string,
): Promise<{ data: T | null; error: ColumnErrorLike | null }> {
  const first = await withColumn()
  if (!first.error || !isMissingColumnError(first.error, column)) return first
  return withoutColumn()
}

export async function mutateWithOptionalColumn<TPayload extends Record<string, unknown>, TData>(
  mutate: (payload: TPayload) => PromiseLike<{ data: TData | null; error: ColumnErrorLike | null }>,
  payload: TPayload,
  column: keyof TPayload & string,
): Promise<{ data: TData | null; error: ColumnErrorLike | null }> {
  const first = await mutate(payload)
  if (
    !first.error ||
    payload[column] == null ||
    payload[column] === '' ||
    !isMissingColumnError(first.error, column)
  ) {
    return first
  }
  const retryPayload = { ...payload }
  delete retryPayload[column]
  return mutate(retryPayload)
}
