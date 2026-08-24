import type { MaterialFilter, MaterialItem } from '@/lib/schemas/materials'

export function matchesMaterialFilter(itemType: MaterialItem['type'], activeFilter: MaterialFilter): boolean {
  if (activeFilter === 'All') return true
  if (activeFilter === 'Cards') return itemType === 'Flashcards'
  return itemType === activeFilter
}

export function selectMaterialSourceItems<T>(
  initialized: boolean,
  items: T[],
  initialItems: T[],
): T[] {
  return initialized ? items : initialItems
}
