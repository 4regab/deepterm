import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Cron endpoint that hard-deletes accounts whose 30-day soft-delete grace
 * window has elapsed. Authorised by CRON_SECRET (Bearer) and executed with
 * the Supabase service-role key so it can call the SECURITY DEFINER RPC
 * `public.finalize_account_deletions(batch_size)` which is gated on
 * `auth.role() = 'service_role'`.
 *
 * Schedule this via Vercel Cron (vercel.json) or any external scheduler:
 *
 *   {
 *     "crons": [
 *       { "path": "/api/cron/finalize-deletions", "schedule": "17 3 * * *" }
 *     ]
 *   }
 */

export const runtime = 'nodejs'
export const maxDuration = 60

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const userAgent = request.headers.get('user-agent')
  const cronSecret = process.env.CRON_SECRET
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction && !cronSecret) {
    console.error('[cron/finalize-deletions] CRON_SECRET not configured in production')
    return false
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return false
  }

  if (isProduction && userAgent !== 'vercel-cron/1') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return false
    }
  }

  return true
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[cron/finalize-deletions] missing Supabase service-role configuration')
    return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })
  }

  // Raw service-role client; we intentionally do NOT use the SSR client here
  // because this endpoint runs without a user session.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await admin.rpc('finalize_account_deletions', { p_batch_size: 100 })

  if (error) {
    console.error('[cron/finalize-deletions] rpc_failed', error)
    return NextResponse.json({ error: 'rpc_failed' }, { status: 500 })
  }

  const finalized = (data as { finalized?: number } | null)?.finalized ?? 0
  return NextResponse.json({ success: true, finalized })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
