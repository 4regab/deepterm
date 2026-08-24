export const UNCATEGORIZED_FOLDER = ''
export const MAX_FOLDER_LENGTH = 40

export function sanitizeFolder(value: string | null | undefined): string | null {
  if (!value) return null
  // Strip angle brackets entirely so incomplete tags like `<script` cannot remain.
  const cleaned = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return null
  return cleaned.slice(0, MAX_FOLDER_LENGTH)
}

export function hasAnyFolder(items: Array<{ folder?: string | null }>): boolean {
  return items.some((item) => Boolean(sanitizeFolder(item.folder)))
}

export function listFolders(items: Array<{ folder?: string | null }>): string[] {
  const names = new Set<string>()
  for (const item of items) {
    const folder = sanitizeFolder(item.folder)
    if (folder) names.add(folder)
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

export function matchesFolderFilter(
  itemFolder: string | null | undefined,
  activeFolder: string | null,
): boolean {
  if (activeFolder === null) return true
  const folder = sanitizeFolder(itemFolder)
  if (activeFolder === UNCATEGORIZED_FOLDER) return folder === null
  return folder === activeFolder
}

export function groupMaterialsByFolder<T extends { folder?: string | null }>(
  items: T[],
): Array<{ key: string; folder: string | null; items: T[] }> {
  const groups = new Map<string, T[]>()
  const uncategorized: T[] = []

  for (const item of items) {
    const folder = sanitizeFolder(item.folder)
    if (!folder) {
      uncategorized.push(item)
      continue
    }
    const existing = groups.get(folder)
    if (existing) existing.push(item)
    else groups.set(folder, [item])
  }

  const named: Array<{ key: string; folder: string | null; items: T[] }> = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([folder, grouped]) => ({ key: folder, folder, items: grouped }))

  if (uncategorized.length > 0) {
    named.push({ key: UNCATEGORIZED_FOLDER, folder: null, items: uncategorized })
  }

  return named
}
