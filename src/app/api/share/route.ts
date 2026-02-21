import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/config/supabase/server'
import { ShareCodeCreateSchema, ShareMaterialTypeSchema } from '@/lib/schemas/sharing'
import { z } from 'zod'

const SHARE_CODE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const DEFAULT_SHARE_CODE_LENGTH = 16
const MAX_SHARE_CODE_GENERATION_ATTEMPTS = 6

const CreateShareSchema = z.object({
  materialType: ShareMaterialTypeSchema,
  materialId: z.string().uuid(),
  customCode: ShareCodeCreateSchema.optional(),
})

function generateSecureShareCode(length: number = DEFAULT_SHARE_CODE_LENGTH): string {
  let code = ''
  const alphabetLength = SHARE_CODE_ALPHABET.length
  const maxUnbiasedByte = Math.floor(256 / alphabetLength) * alphabetLength

  while (code.length < length) {
    const randomValues = new Uint8Array(length * 2)
    crypto.getRandomValues(randomValues)

    for (const value of randomValues) {
      if (value >= maxUnbiasedByte) {
        continue
      }
      code += SHARE_CODE_ALPHABET[value % alphabetLength]
      if (code.length === length) {
        break
      }
    }
  }

  return code
}

async function generateUniqueShareCode(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<string> {
  for (let attempt = 0; attempt < MAX_SHARE_CODE_GENERATION_ATTEMPTS; attempt++) {
    const candidate = generateSecureShareCode()
    const { data: existingCode, error } = await supabase
      .from('material_shares')
      .select('id')
      .eq('share_code', candidate)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to verify generated share code: ${error.message}`)
    }
    if (!existingCode) {
      return candidate
    }
  }

  throw new Error('Unable to allocate a unique share code')
}

// GET - Get share info for a material
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const materialType = searchParams.get('materialType')
  const materialId = searchParams.get('materialId')

  if (!materialType || !materialId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  // Optimized: only select needed columns
  const { data: share } = await supabase
    .from('material_shares')
    .select('id, share_code, is_active, created_at')
    .eq('material_type', materialType)
    .eq('material_id', materialId)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ share })
}

// POST - Create or update share
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreateShareSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { materialType, materialId, customCode } = parsed.data

  // Verify ownership
  const table = materialType === 'flashcard_set' ? 'flashcard_sets' : 'reviewers'
  const { data: material } = await supabase
    .from(table)
    .select('id')
    .eq('id', materialId)
    .eq('user_id', user.id)
    .single()

  if (!material) {
    return NextResponse.json({ error: 'Material not found or not owned' }, { status: 404 })
  }

  // Check if share already exists
  // Optimized: only select needed columns
  const { data: existing } = await supabase
    .from('material_shares')
    .select('id, share_code, is_active, created_at')
    .eq('material_type', materialType)
    .eq('material_id', materialId)
    .single()

  if (existing) {
    // Reactivate if inactive
    if (!existing.is_active) {
      const { data: updated } = await supabase
        .from('material_shares')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      return NextResponse.json({ share: updated })
    }
    return NextResponse.json({ share: existing })
  }

  // Generate or validate share code
  let shareCode = customCode

  if (shareCode) {
    // Check uniqueness
    const { data: codeExists, error: codeExistsError } = await supabase
      .from('material_shares')
      .select('id')
      .eq('share_code', shareCode)
      .maybeSingle()

    if (codeExistsError) {
      console.error('Share code uniqueness check failed:', codeExistsError)
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
    }

    if (codeExists) {
      return NextResponse.json({ error: 'Share code already taken' }, { status: 409 })
    }
  } else {
    try {
      shareCode = await generateUniqueShareCode(supabase)
    } catch (generationError) {
      console.error('Share code generation failed:', generationError)
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
    }
  }

  // Create share
  const { data: share, error } = await supabase
    .from('material_shares')
    .insert({
      share_code: shareCode,
      material_type: materialType,
      material_id: materialId,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Share creation failed:', error)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }

  return NextResponse.json({ share }, { status: 201 })
}

// PATCH - Update share (toggle active, change code)
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { shareId, isActive, newCode } = body

  if (!shareId) {
    return NextResponse.json({ error: 'Missing shareId' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof isActive === 'boolean') {
    updates.is_active = isActive
  }

  if (newCode) {
    const codeValidation = ShareCodeCreateSchema.safeParse(newCode)
    if (!codeValidation.success) {
      return NextResponse.json({ error: codeValidation.error.flatten() }, { status: 400 })
    }

    // Check uniqueness
    const { data: codeExists, error: codeExistsError } = await supabase
      .from('material_shares')
      .select('id')
      .eq('share_code', newCode)
      .neq('id', shareId)
      .maybeSingle()

    if (codeExistsError) {
      console.error('Share code update uniqueness check failed:', codeExistsError)
      return NextResponse.json({ error: 'Failed to update share code' }, { status: 500 })
    }

    if (codeExists) {
      return NextResponse.json({ error: 'Share code already taken' }, { status: 409 })
    }

    updates.share_code = newCode
  }

  const { data: share, error } = await supabase
    .from('material_shares')
    .update(updates)
    .eq('id', shareId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !share) {
    return NextResponse.json({ error: 'Share not found or not owned' }, { status: 404 })
  }

  return NextResponse.json({ share })
}

// DELETE - Remove share
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const shareId = searchParams.get('shareId')

  if (!shareId) {
    return NextResponse.json({ error: 'Missing shareId' }, { status: 400 })
  }

  const { error } = await supabase
    .from('material_shares')
    .delete()
    .eq('id', shareId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Share delete failed:', error)
    return NextResponse.json({ error: 'Failed to delete share link' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
