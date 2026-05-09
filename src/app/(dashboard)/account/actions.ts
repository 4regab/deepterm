'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/config/supabase/server'
import { getSession } from '@/lib/auth/session'
import { hashRequestIdentity, hashValue, extractClientIp, extractUserAgent } from '@/lib/auth/requestIdentity'

/**
 * Account deletion server actions.
 *
 * Security properties (see OWASP-2025-Pentest-Report.md F-001):
 *   • Each action re-verifies the authenticated user via Supabase SSR cookies.
 *     Cookies are HttpOnly, so a stored/reflected XSS payload cannot mint or
 *     steal them from JavaScript.
 *   • The Next.js origin check for server actions blocks cross-site POSTs.
 *   • Deletion requires the literal confirmation phrase "delete my account".
 *     Anything else is rejected server-side BEFORE the DB RPC is called.
 *   • Deletion is rate-limited to 1 request per user per 24 h inside the RPC.
 *   • Deletion is a 30-day soft-delete (profiles.deleted_at); the actual
 *     auth.users row is removed only by the service-role cron job
 *     finalize_account_deletions().
 *   • Every state transition is appended to account_deletion_audit.
 */

const REQUIRED_PHRASE = 'delete my account'

const RequestSchema = z.object({
  confirmationPhrase: z.string().max(128),
})

export interface DeletionActionResult {
  ok: boolean
  error?: string
  status?: 'scheduled' | 'already_pending' | 'cancelled' | 'nothing_to_cancel'
  deletedAt?: string
  finalizeAt?: string
}

export async function requestAccountDeletionAction(
  formData: { confirmationPhrase: string }
): Promise<DeletionActionResult> {
  const parsed = RequestSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_input' }
  }

  // Strict equality. Avoid permissive case/whitespace handling — the whole
  // point of this gate is that the user typed it exactly.
  if (parsed.data.confirmationPhrase !== REQUIRED_PHRASE) {
    return { ok: false, error: 'phrase_mismatch' }
  }

  const { user } = await getSession()
  if (!user) {
    return { ok: false, error: 'not_authenticated' }
  }

  const hdrs = await headers()
  const ipHash = hashValue(extractClientIp(hdrs))
  const uaHash = hashValue(extractUserAgent(hdrs))

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('request_account_deletion', {
    p_confirmation_phrase: REQUIRED_PHRASE,
    p_ip_hash: ipHash,
    p_user_agent_hash: uaHash,
  })

  if (error) {
    // Don't echo DB error detail to the client. Map known codes.
    const code = (error as { code?: string }).code
    const msg = (error as { message?: string }).message ?? ''
    if (code === '54000' || msg.includes('deletion_rate_limited')) {
      return { ok: false, error: 'rate_limited' }
    }
    if (code === '22023' || msg.includes('invalid_confirmation_phrase')) {
      return { ok: false, error: 'phrase_mismatch' }
    }
    if (code === '28000' || msg.includes('not_authenticated')) {
      return { ok: false, error: 'not_authenticated' }
    }
    console.error('[deletion] rpc_failed', { code, msg })
    return { ok: false, error: 'rpc_failed' }
  }

  // Invalidate the current session so every other tab lands on the lockout page.
  await supabase.auth.signOut()

  const result = data as {
    status: 'scheduled' | 'already_pending'
    deleted_at: string
    finalize_at: string
  }
  return {
    ok: true,
    status: result.status,
    deletedAt: result.deleted_at,
    finalizeAt: result.finalize_at,
  }
}

export async function cancelAccountDeletionAction(): Promise<DeletionActionResult> {
  const { user } = await getSession()
  if (!user) {
    return { ok: false, error: 'not_authenticated' }
  }

  // Fire a peppered identity hash (used for potential future per-action audit).
  const hdrs = await headers()
  void hashRequestIdentity(hdrs)

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('cancel_account_deletion')
  if (error) {
    console.error('[deletion] cancel_failed', error)
    return { ok: false, error: 'rpc_failed' }
  }

  const result = data as { status: 'cancelled' | 'nothing_to_cancel' }
  return { ok: true, status: result.status }
}

export async function getAccountDeletionStatusAction(): Promise<{
  pending: boolean
  deletedAt?: string
  finalizeAt?: string
}> {
  const { user } = await getSession()
  if (!user) return { pending: false }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('account_deletion_status')
  const result = (data ?? {}) as {
    pending?: boolean
    deleted_at?: string
    finalize_at?: string
  }
  return {
    pending: Boolean(result.pending),
    deletedAt: result.deleted_at,
    finalizeAt: result.finalize_at,
  }
}
