import { MAX_FOLDER_NAME_LENGTH, type Folder } from '@/lib/schemas/materials'

/**
 * Sentinel used by the folder filter to mean "materials with folder_id null".
 * Not a folder id -- real ids are uuids, so this can never collide.
 */
export const UNFILED_FOLDER_ID = '__unfiled__'

export const MAX_FOLDER_LENGTH = MAX_FOLDER_NAME_LENGTH

/**
 * Client-side mirror of private.sanitize_folder_name() in 005_folders.sql.
 * Keep the two in step: the trigger is authoritative and will rewrite whatever
 * we send, so previewing the same result avoids a confusing round trip.
 */
export function sanitizeFolder(value: string | null | undefined): string | null {
  if (!value) return null
  // Strip angle brackets entirely so incomplete tags like `<script` cannot remain.
  const cleaned = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return null
  return cleaned.slice(0, MAX_FOLDER_NAME_LENGTH)
}

export function sortFolders<T extends { name: string }>(folders: readonly T[]): T[] {
  return [...folders].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
}

export function findFolderById(
  folders: readonly Folder[],
  id: string | null | undefined,
): Folder | null {
  if (!id) return null
  return folders.find((folder) => folder.id === id) ?? null
}

export function folderNameById(
  folders: readonly Folder[],
  id: string | null | undefined,
): string | null {
  return findFolderById(folders, id)?.name ?? null
}

/**
 * Mirrors the `folders_user_lower_name_idx` unique index so the user gets a
 * message before the round trip. The database still rejects races (23505).
 */
export function findDuplicateFolder(
  folders: readonly Folder[],
  name: string,
  excludeId?: string | null,
): Folder | null {
  const target = name.toLowerCase()
  return (
    folders.find(
      (folder) => folder.id !== excludeId && folder.name.toLowerCase() === target,
    ) ?? null
  )
}

export type FolderNameCheck =
  | { ok: true; name: string }
  | { ok: false; message: string }

export function validateFolderName(
  raw: string,
  folders: readonly Folder[],
  excludeId?: string | null,
): FolderNameCheck {
  const name = sanitizeFolder(raw)
  if (!name) return { ok: false, message: 'Folder name is required.' }
  if (findDuplicateFolder(folders, name, excludeId)) {
    return { ok: false, message: `You already have a folder called "${name}".` }
  }
  return { ok: true, name }
}

export function matchesFolderFilter(
  itemFolderId: string | null | undefined,
  activeFolderId: string | null,
): boolean {
  if (activeFolderId === null) return true
  if (activeFolderId === UNFILED_FOLDER_ID) return !itemFolderId
  return itemFolderId === activeFolderId
}

export interface FolderGroup<T> {
  /** Folder id, or UNFILED_FOLDER_ID for the unfiled bucket. */
  key: string
  folder: Folder | null
  items: T[]
}

/**
 * Groups by the user's folder list rather than by whatever the loaded
 * materials happen to carry, so a folder with no materials still renders.
 */
export function groupMaterialsByFolder<T extends { folderId?: string | null }>(
  items: readonly T[],
  folders: readonly Folder[],
  options: { includeEmptyFolders?: boolean } = {},
): Array<FolderGroup<T>> {
  const { includeEmptyFolders = true } = options

  const byFolder = new Map<string, T[]>()
  const unfiled: T[] = []

  for (const item of items) {
    const id = item.folderId
    // A folder_id we do not know about (deleted in another tab) reads as unfiled.
    if (!id || !folders.some((folder) => folder.id === id)) {
      unfiled.push(item)
      continue
    }
    const existing = byFolder.get(id)
    if (existing) existing.push(item)
    else byFolder.set(id, [item])
  }

  const groups: Array<FolderGroup<T>> = []

  for (const folder of sortFolders(folders)) {
    const grouped = byFolder.get(folder.id) ?? []
    if (grouped.length === 0 && !includeEmptyFolders) continue
    groups.push({ key: folder.id, folder, items: grouped })
  }

  if (unfiled.length > 0) {
    groups.push({ key: UNFILED_FOLDER_ID, folder: null, items: unfiled })
  }

  return groups
}
