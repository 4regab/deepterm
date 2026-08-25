import type { Folder, MaterialItem } from '@/lib/schemas/materials'

/**
 * PostgREST select shapes. Folders are read through the `folder_id` foreign
 * key defined in 005_folders.sql -- there is no flat `folder` text column, and
 * asking for one returns PGRST204 for every row.
 */
export const MATERIAL_SELECT = {
  flashcardSets:
    'id, title, created_at, updated_at, folder_id, folder:folders(id, name), flashcards(count)',
  reviewers:
    'id, title, created_at, updated_at, folder_id, folder:folders(id, name), reviewer_categories(reviewer_terms(count))',
  flashcardSetDetail: 'id, title, updated_at, folder_id, folder:folders(id, name)',
  reviewerDetail: 'id, title, updated_at, folder_id, folder:folders(id, name)',
  folders: 'id, name, created_at',
} as const

export interface EmbeddedFolder {
  id: string
  name: string
}

export interface FlashcardSetRow {
  id: string
  title: string
  created_at: string
  updated_at: string | null
  folder_id: string | null
  folder?: EmbeddedFolder | null
  flashcards?: Array<{ count: number }>
}

export interface ReviewerRow {
  id: string
  title: string
  created_at: string
  updated_at: string | null
  folder_id: string | null
  folder?: EmbeddedFolder | null
  reviewer_categories?: Array<{ reviewer_terms?: Array<{ count: number }> }>
}

export function formatTimeAgo(date: Date, now: Date = new Date()): string {
  const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return `${diffWeeks}w ago`
}

export function toFlashcardSetItem(row: FlashcardSetRow, now?: Date): MaterialItem {
  const dateStr = row.updated_at || row.created_at
  return {
    id: row.id,
    title: row.title,
    type: 'Flashcards',
    itemsCount: row.flashcards?.[0]?.count ?? 0,
    lastAccessed: formatTimeAgo(new Date(dateStr), now),
    sortDate: dateStr,
    folderId: row.folder_id ?? null,
    folderName: row.folder?.name ?? null,
  }
}

export function toReviewerItem(row: ReviewerRow, now?: Date): MaterialItem {
  const totalTerms =
    row.reviewer_categories?.reduce(
      (acc, category) => acc + (category.reviewer_terms?.[0]?.count ?? 0),
      0,
    ) ?? 0
  const dateStr = row.updated_at || row.created_at

  return {
    id: row.id,
    title: row.title,
    type: 'Reviewer',
    itemsCount: totalTerms,
    lastAccessed: formatTimeAgo(new Date(dateStr), now),
    sortDate: dateStr,
    folderId: row.folder_id ?? null,
    folderName: row.folder?.name ?? null,
  }
}

export function sortMaterialsByRecency(items: MaterialItem[]): MaterialItem[] {
  return [...items].sort(
    (a, b) => new Date(b.sortDate || 0).getTime() - new Date(a.sortDate || 0).getTime(),
  )
}

export function toFolderList(rows: Array<{ id: string; name: string; created_at?: string | null }>): Folder[] {
  return rows.map((row) => ({ id: row.id, name: row.name, createdAt: row.created_at ?? undefined }))
}
