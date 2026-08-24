import { describe, expect, it } from 'bun:test'
import {
  getPdfMimeTypeFromName,
  isGenerateFileTooLarge,
  MAX_CARDS_FILE_SIZE,
  MAX_GENERATE_TEXT_LENGTH,
  resolveGenerateMimeType,
} from '@/utils/generateInput'

describe('generateInput', () => {
  it('only allows PDF mime types', () => {
    expect(resolveGenerateMimeType({ name: 'notes.pdf', type: 'application/pdf' })).toBe('application/pdf')
    expect(resolveGenerateMimeType({ name: 'notes.pdf', type: '' })).toBe('application/pdf')
    expect(resolveGenerateMimeType({ name: 'notes.txt', type: 'text/plain' })).toBeNull()
    expect(resolveGenerateMimeType({ name: 'notes.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })).toBeNull()
    expect(resolveGenerateMimeType({ name: 'payload.exe', type: 'application/octet-stream' })).toBeNull()
    expect(resolveGenerateMimeType({ name: 'photo.png', type: 'image/png' })).toBeNull()
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
  })
})
