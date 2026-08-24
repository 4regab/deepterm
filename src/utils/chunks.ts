export function splitIntoChunks(total: number, chunkSize: number): number[] {
  if (total <= 0 || chunkSize <= 0) return []
  const chunks: number[] = []
  let remaining = total
  while (remaining > 0) {
    const next = Math.min(chunkSize, remaining)
    chunks.push(next)
    remaining -= next
  }
  return chunks
}
