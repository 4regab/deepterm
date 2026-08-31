import { describe, expect, it } from 'bun:test'
import {
  MAX_CARDS_FILE_SIZE,
  MAX_REVIEWER_FILE_SIZE,
  MAX_GENERATE_UPLOAD_BYTES,
  VERCEL_FUNCTION_BODY_LIMIT_BYTES,
  maxUploadBytesForTarget,
  missingUploadFileMessage,
  requiresLiveFileForGenerate,
} from '@/utils/generateInput'
import {
  CLIENT_GENERATION_TIMEOUT_MS,
  GENERATION_MAX_DURATION_SECONDS,
  GENERATION_TIMEOUT_MS,
} from '@/utils/abort'

describe('generate upload limits vs Vercel body ceiling', () => {
  it('keeps every advertised upload limit under the 4.5MB function body cap', () => {
    expect(VERCEL_FUNCTION_BODY_LIMIT_BYTES).toBe(4.5 * 1024 * 1024)
    expect(MAX_GENERATE_UPLOAD_BYTES).toBeLessThanOrEqual(4 * 1024 * 1024)
    expect(MAX_CARDS_FILE_SIZE).toBe(MAX_GENERATE_UPLOAD_BYTES)
    expect(MAX_REVIEWER_FILE_SIZE).toBe(MAX_GENERATE_UPLOAD_BYTES)
    expect(MAX_CARDS_FILE_SIZE).toBeLessThan(VERCEL_FUNCTION_BODY_LIMIT_BYTES)
    expect(MAX_REVIEWER_FILE_SIZE).toBeLessThan(VERCEL_FUNCTION_BODY_LIMIT_BYTES)
  })

  it('uses one shared upload ceiling for flashcards and reviewers', () => {
    expect(maxUploadBytesForTarget('material')).toBe(MAX_GENERATE_UPLOAD_BYTES)
    expect(maxUploadBytesForTarget('reviewer')).toBe(MAX_GENERATE_UPLOAD_BYTES)
  })

  it('rejects a 15MB file that the old UI incorrectly allowed', () => {
    const fifteenMb = 15 * 1024 * 1024
    expect(fifteenMb).toBeGreaterThan(MAX_GENERATE_UPLOAD_BYTES)
    expect(fifteenMb).toBeGreaterThan(VERCEL_FUNCTION_BODY_LIMIT_BYTES)
  })
})

describe('ghost file session restore', () => {
  it('requires a live File blob before generate, not a restored summary', () => {
    expect(requiresLiveFileForGenerate(null)).toBe(true)
    expect(requiresLiveFileForGenerate(new File(['x'], 'notes.pdf', { type: 'application/pdf' }))).toBe(false)
    expect(missingUploadFileMessage()).toContain('re-select')
  })
})

describe('generation duration budget', () => {
  it('keeps app timeouts inside the declared Vercel maxDuration window', () => {
    expect(GENERATION_MAX_DURATION_SECONDS).toBeGreaterThanOrEqual(90)
    expect(GENERATION_TIMEOUT_MS).toBeLessThan(GENERATION_MAX_DURATION_SECONDS * 1000)
    expect(CLIENT_GENERATION_TIMEOUT_MS).toBeGreaterThan(GENERATION_TIMEOUT_MS)
    expect(CLIENT_GENERATION_TIMEOUT_MS).toBeLessThanOrEqual(GENERATION_MAX_DURATION_SECONDS * 1000)
  })
})
