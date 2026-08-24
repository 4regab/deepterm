export function rotationOrder(keyCount: number, startIndex = 0): number[] {
  if (keyCount <= 0) return []
  const start = ((startIndex % keyCount) + keyCount) % keyCount
  return Array.from({ length: keyCount }, (_, i) => (start + i) % keyCount)
}
