import { describe, expect, it } from 'bun:test'
import {
  DOCX_MIME_TYPE,
  getPdfMimeTypeFromName,
  isDocxMime,
  isGenerateFileTooLarge,
  MAX_CARDS_FILE_SIZE,
  MAX_GENERATE_TEXT_LENGTH,
  resolveGenerateMimeType,
} from '@/utils/generateInput'

describe('generateInput', () => {
  it('allows PDF, DOCX, and image mime types when the extension matches', () => {
    expect(resolveGenerateMimeType({ name: 'notes.pdf', type: 'application/pdf' })).toBe('application/pdf')
    expect(resolveGenerateMimeType({ name: 'notes.pdf', type: '' })).toBe('application/pdf')
    expect(resolveGenerateMimeType({ name: 'notes.docx', type: DOCX_MIME_TYPE })).toBe(DOCX_MIME_TYPE)
    expect(resolveGenerateMimeType({ name: 'photo.png', type: 'image/png' })).toBe('image/png')
    expect(resolveGenerateMimeType({ name: 'notes.txt', type: 'text/plain' })).toBeNull()
    expect(resolveGenerateMimeType({ name: 'payload.exe', type: 'application/octet-stream' })).toBeNull()
  })

  it('rejects spoofed mime types even when the extension is pdf', () => {
    expect(resolveGenerateMimeType({ name: 'notes.pdf', type: 'image/png' })).toBeNull()
  })

  it('resolves uppercase pdf extensions when mime type is missing', () => {
    expect(getPdfMimeTypeFromName('Lecture.PDF')).toBe('application/pdf')
    expect(getPdfMimeTypeFromName('file')).toBeNull()
    expect(getPdfMimeTypeFromName('')).toBeNull()
  })

  it('enforces file size and text length limits used by the API', () => {
    expect(isGenerateFileTooLarge(MAX_CARDS_FILE_SIZE + 1, MAX_CARDS_FILE_SIZE)).toBe(true)
    expect(isGenerateFileTooLarge(MAX_CARDS_FILE_SIZE, MAX_CARDS_FILE_SIZE)).toBe(false)
    expect(MAX_GENERATE_TEXT_LENGTH).toBe(100000)
    expect(isDocxMime(DOCX_MIME_TYPE)).toBe(true)
  })
})
