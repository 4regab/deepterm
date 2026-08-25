import type { Folder, MaterialType } from '@/lib/schemas/materials'
import { describeDbError, type DbErrorLike } from '@/utils/dbError'
import { sortFolders } from '@/utils/materialFolder'

export interface DbResult<T> {
  data: T | null
  error: DbErrorLike | null
}

interface FilterBuilder extends PromiseLike<DbResult<unknown>> {
  eq(column: string, value: unknown): FilterBuilder
  order(column: string, options?: { ascending?: boolean }): FilterBuilder
  select(columns?: string): FilterBuilder
  single(): PromiseLike<DbResult<unknown>>
}

interface TableBuilder {
  select(columns?: string): FilterBuilder
  insert(values: Record<string, unknown>): FilterBuilder
  update(values: Record<string, unknown>): FilterBuilder
  delete(): FilterBuilder
}

/**
 * The slice of supabase-js this module actually uses. Narrowing it here keeps
 * the folder data access unit-testable against a fake PostgREST.
 */
export interface SupabaseLike {
  from(table: string): TableBuilder
}

export type MaterialTable = 'flashcard_sets' | 'reviewers'

export function materialTable(type: MaterialType): MaterialTable {
  return type === 'Flashcards' ? 'flashcard_sets' : 'reviewers'
}

export const FOLDER_COLUMNS = 'id, name, created_at'

interface FolderRow {
  id: string
  name: string
  created_at?: string | null
}

function toFolder(row: FolderRow): Folder {
  return { id: row.id, name: row.name, createdAt: row.created_at ?? undefined }
}

export interface Outcome<T> {
  data: T | null
  error: string | null
}

function failure<T>(error: unknown, fallback: string): Outcome<T> {
  return { data: null, error: describeDbError(error, fallback) }
}

export async function fetchFolders(client: SupabaseLike): Promise<Outcome<Folder[]>> {
  const { data, error } = await client
    .from('folders')
    .select(FOLDER_COLUMNS)
    .order('name', { ascending: true })

  if (error) return failure(error, 'Could not load your folders.')
  const rows = (data as FolderRow[] | null) ?? []
  return { data: sortFolders(rows.map(toFolder)), error: null }
}

export async function createFolder(
  client: SupabaseLike,
  input: { userId: string; name: string },
): Promise<Outcome<Folder>> {
  const { data, error } = await client
    .from('folders')
    // The folders_normalize trigger pins user_id to auth.uid() and sanitizes
    // the name; sending both keeps the NOT NULL honest if the trigger is gone.
    .insert({ user_id: input.userId, name: input.name })
    .select(FOLDER_COLUMNS)
    .single()

  if (error) return failure(error, 'Could not create the folder.')
  if (!data) return { data: null, error: 'Could not create the folder.' }
  return { data: toFolder(data as FolderRow), error: null }
}

export async function renameFolder(
  client: SupabaseLike,
  input: { id: string; name: string },
): Promise<Outcome<Folder>> {
  const { data, error } = await client
    .from('folders')
    .update({ name: input.name })
    .eq('id', input.id)
    .select(FOLDER_COLUMNS)
    .single()

  if (error) return failure(error, 'Could not rename the folder.')
  if (!data) return { data: null, error: 'Could not rename the folder.' }
  return { data: toFolder(data as FolderRow), error: null }
}

/**
 * Materials keep their row and fall back to Unfiled via the
 * `ON DELETE SET NULL` foreign keys in 005_folders.sql.
 */
export async function deleteFolder(
  client: SupabaseLike,
  input: { id: string },
): Promise<Outcome<{ id: string }>> {
  const { data, error } = await client
    .from('folders')
    .delete()
    .eq('id', input.id)
    .select('id')

  if (error) return failure(error, 'Could not delete the folder.')
  const rows = (data as Array<{ id: string }> | null) ?? []
  // RLS turns "not yours" into zero rows and no error. Do not call that success.
  if (rows.length === 0) {
    return { data: null, error: 'That folder no longer exists. Reload and try again.' }
  }
  return { data: rows[0], error: null }
}

export async function setMaterialFolder(
  client: SupabaseLike,
  input: { materialId: string; materialType: MaterialType; folderId: string | null },
): Promise<Outcome<{ id: string }>> {
  const { data, error } = await client
    .from(materialTable(input.materialType))
    .update({ folder_id: input.folderId })
    .eq('id', input.materialId)
    .select('id')

  if (error) return failure(error, 'Could not move the material.')
  const rows = (data as Array<{ id: string }> | null) ?? []
  if (rows.length === 0) {
    return { data: null, error: 'That material no longer exists. Reload and try again.' }
  }
  return { data: rows[0], error: null }
}

export async function deleteMaterial(
  client: SupabaseLike,
  input: { materialId: string; materialType: MaterialType },
): Promise<Outcome<{ id: string }>> {
  const { data, error } = await client
    .from(materialTable(input.materialType))
    .delete()
    .eq('id', input.materialId)
    .select('id')

  if (error) return failure(error, 'Could not delete the material.')
  const rows = (data as Array<{ id: string }> | null) ?? []
  if (rows.length === 0) {
    return { data: null, error: 'That material no longer exists. Reload and try again.' }
  }
  return { data: rows[0], error: null }
}
