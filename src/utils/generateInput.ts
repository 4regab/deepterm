export const ALLOWED_GENERATE_MIME_TYPES = ['application/pdf'] as const
export const MAX_CARDS_FILE_SIZE = 20 * 1024 * 1024
export const MAX_REVIEWER_FILE_SIZE = 10 * 1024 * 1024
export const MAX_GENERATE_TEXT_LENGTH = 100000

export function getPdfMimeTypeFromName(filename: string): string | null {
  const ext = filename.toLowerCase().split('.').pop()
  if (!ext || ext === filename.toLowerCase()) return null
  return ext === 'pdf' ? 'application/pdf' : null
}

export function resolveGenerateMimeType(file: { name: string; type?: string | null }): string | null {
  const mimeType = file.type || getPdfMimeTypeFromName(file.name)
  if (!mimeType) return null
  if (!(ALLOWED_GENERATE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return null
  }
  return mimeType
}

export function isGenerateFileTooLarge(fileSize: number, maxFileSize: number): boolean {
  return fileSize > maxFileSize
}
