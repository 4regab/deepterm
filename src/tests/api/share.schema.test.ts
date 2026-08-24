import { describe, expect, it } from 'bun:test'
import { ShareGetQuerySchema, SharePatchSchema } from '@/lib/schemas/sharing'

const VALID_UUID = '11111111-1111-4111-8111-111111111111'

describe('share API schemas', () => {
  it('rejects GET queries missing owner-safe identifiers', () => {
    expect(ShareGetQuerySchema.safeParse({
      materialType: 'flashcard_set',
    }).success).toBe(false)
    expect(ShareGetQuerySchema.safeParse({
      materialType: 'cards',
      materialId: VALID_UUID,
    }).success).toBe(false)
  })

  it('accepts valid GET queries', () => {
    expect(ShareGetQuerySchema.safeParse({
      materialType: 'reviewer',
      materialId: VALID_UUID,
    }).success).toBe(true)
  })

  it('requires a UUID shareId on PATCH and validates custom codes', () => {
    expect(SharePatchSchema.safeParse({ shareId: 'not-a-uuid' }).success).toBe(false)
    expect(SharePatchSchema.safeParse({
      shareId: VALID_UUID,
      isActive: true,
    }).success).toBe(true)
    expect(SharePatchSchema.safeParse({
      shareId: VALID_UUID,
      newCode: 'short',
    }).success).toBe(false)
    expect(SharePatchSchema.safeParse({
      shareId: VALID_UUID,
      newCode: 'custom-code',
    }).success).toBe(true)
  })
})
