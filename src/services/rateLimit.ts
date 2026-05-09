import { createServerSupabaseClient } from '@/config/supabase/server'

const DAILY_AI_LIMIT = 10

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  userId?: string
  authenticated: boolean
}

/**
 * Atomically checks and increments AI usage in a single operation.
 *
 * This is the ONLY sanctioned path to mutate the ai_usage table.
 * The ai_usage table has RLS that blocks direct client UPDATEs AND an explicit
 * REVOKE UPDATE on the `authenticated` role (see migration
 * 002_owasp_remediation.sql, F-002), so all counter mutations must go
 * through the SECURITY DEFINER RPC `check_and_increment_ai_usage`.
 */
export async function checkAndIncrementAIUsage(): Promise<RateLimitResult> {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { allowed: false, remaining: 0, resetAt: new Date(), authenticated: false }
  }

  const today = new Date().toISOString().split('T')[0]

  // Calculate reset time (midnight UTC)
  const resetAt = new Date(today)
  resetAt.setUTCDate(resetAt.getUTCDate() + 1)
  resetAt.setUTCHours(0, 0, 0, 0)

  // Check if user has unlimited access (admin/whitelist)
  const { data: unlimitedUser } = await supabase
    .from('unlimited_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (unlimitedUser) {
    // Unlimited user - bypass rate limit
    return {
      allowed: true,
      remaining: 999,
      resetAt,
      userId: user.id,
      authenticated: true
    }
  }

  // Atomic check-and-increment using RPC.
  // The RPC (SECURITY DEFINER) is the only code path allowed to write ai_usage.
  const { data, error } = await supabase.rpc('check_and_increment_ai_usage', {
    p_date: today,
    p_limit: DAILY_AI_LIMIT
  })

  if (error) {
    console.error('Rate limit check error:', error)
    return { allowed: false, remaining: 0, resetAt, userId: user.id, authenticated: true }
  }

  const result = data?.[0] || data
  const allowed = result?.allowed ?? false
  const newCount = result?.new_count ?? DAILY_AI_LIMIT
  const remaining = Math.max(0, DAILY_AI_LIMIT - newCount)

  return {
    allowed,
    remaining,
    resetAt,
    userId: user.id,
    authenticated: true
  }
}
