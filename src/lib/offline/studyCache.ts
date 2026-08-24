const PREFIX = 'deepterm:study-cache:'

export interface CachedStudySet {
  id: string
  title: string
  cards: Array<{ id: string; term: string; definition: string; status?: string }>
  savedAt: string
}

function key(setId: string): string {
  return `${PREFIX}${setId}`
}

export function saveStudySetCache(set: CachedStudySet): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key(set.id), JSON.stringify({ ...set, savedAt: new Date().toISOString() }))
  } catch {
    // Quota or private mode — studying online still works.
  }
}

export function loadStudySetCache(setId: string): CachedStudySet | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key(setId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedStudySet
    if (!parsed?.id || !Array.isArray(parsed.cards)) return null
    return parsed
  } catch {
    return null
  }
}
