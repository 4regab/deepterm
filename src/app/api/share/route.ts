import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/config/supabase/server'
import { ShareCodeSchema, ShareMaterialTypeSchema } from '@/lib/schemas/sharing'
import { z } from 'zod'

const CreateShareSchema = z.object({
  materialType: ShareMaterialTypeSchema,
  materialId: z.string().uuid(),
  customCode: ShareCodeSchema.optional(),
})

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

  const { data: share } = await supabase
    .from('material_shares')
    .select('*')
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
  const { data: existing } = await supabase
    .from('material_shares')
    .select('*')
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
    const { data: codeExists } = await supabase
      .from('material_shares')
      .select('id')
      .eq('share_code', shareCode)
      .single()
    
    if (codeExists) {
      return NextResponse.json({ error: 'Share code already taken' }, { status: 409 })
    }
  } else {
    // Generate random code
    const { data: generated } = await supabase.rpc('generate_share_code', { length: 8 })
    shareCode = generated
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
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    const codeValidation = ShareCodeSchema.safeParse(newCode)
    if (!codeValidation.success) {
      return NextResponse.json({ error: codeValidation.error.flatten() }, { status: 400 })
    }
    
    // Check uniqueness
    const { data: codeExists } = await supabase
      .from('material_shares')
      .select('id')
      .eq('share_code', newCode)
      .neq('id', shareId)
      .single()
    
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
