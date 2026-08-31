export const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export const ALLOWED_GENERATE_MIME_TYPES = [
  'application/pdf',
  DOCX_MIME_TYPE,
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

export const GEMINI_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

/** Hard Vercel Function request/response body ceiling (FUNCTION_PAYLOAD_TOO_LARGE). */
export const VERCEL_FUNCTION_BODY_LIMIT_BYTES = 4.5 * 1024 * 1024

/**
 * Safe multipart upload ceiling for /api/generate-*.
 * Leave headroom under 4.5MB for FormData boundaries and Turnstile fields.
 */
export const MAX_GENERATE_UPLOAD_BYTES = 4 * 1024 * 1024

export const MAX_CARDS_FILE_SIZE = MAX_GENERATE_UPLOAD_BYTES
export const MAX_REVIEWER_FILE_SIZE = MAX_GENERATE_UPLOAD_BYTES
export const MAX_GENERATE_TEXT_LENGTH = 100000

export type GenerateTargetType = 'material' | 'reviewer'

export function maxUploadBytesForTarget(target: GenerateTargetType): number {
  void target
  return MAX_GENERATE_UPLOAD_BYTES
}

export function maxUploadMegabytesLabel(bytes: number = MAX_GENERATE_UPLOAD_BYTES): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`
}

export function requiresLiveFileForGenerate(selectedFile: File | null): boolean {
  return selectedFile == null
}

export function missingUploadFileMessage(): string {
  return 'Your document is no longer available in this browser session. Please re-select the file to generate.'
}

const EXTENSION_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: DOCX_MIME_TYPE,
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export function getPdfMimeTypeFromName(filename: string): string | null {
  return mimeFromFilename(filename) === 'application/pdf' ? 'application/pdf' : null
}

export function mimeFromFilename(filename: string): string | null {
  const ext = filename.toLowerCase().split('.').pop()
  if (!ext || ext === filename.toLowerCase()) return null
  return EXTENSION_MIME[ext] ?? null
}

function normalizeDeclaredMime(mime: string): string {
  if (mime === 'image/jpg') return 'image/jpeg'
  return mime
}

export function resolveGenerateMimeType(file: { name: string; type?: string | null }): string | null {
  const fromName = mimeFromFilename(file.name)
  if (!fromName) return null
  if (!file.type) return fromName
  const declared = normalizeDeclaredMime(file.type)
  if (declared !== fromName) return null
  if (!(ALLOWED_GENERATE_MIME_TYPES as readonly string[]).includes(fromName)) return null
  return fromName
}

export function isGenerateFileTooLarge(fileSize: number, maxFileSize: number): boolean {
  return fileSize > maxFileSize
}

export function isDocxMime(mime: string): boolean {
  return mime === DOCX_MIME_TYPE
}

export function isGeminiUploadMime(mime: string): boolean {
  return (GEMINI_UPLOAD_MIME_TYPES as readonly string[]).includes(mime)
}

export async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value.trim()
}

