import { createServerSupabaseClient } from '@/config/supabase/server'

const DAILY_AI_LIMIT = 10

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  userId?: string
}

/**
 * Atomically checks and increments AI usage in a single operation.
 * This prevents race conditions where multiple requests could bypass the limit.
 */
export async function checkAndIncrementAIUsage(): Promise<RateLimitResult> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { allowed: false, remaining: 0, resetAt: new Date() }
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
      userId: user.id
    }
  }

  // Atomic check-and-increment using RPC
  // This function should return { allowed, new_count } and handle upsert internally
  const { data, error } = await supabase.rpc('check_and_increment_ai_usage', {
    p_user_id: user.id,
    p_date: today,
    p_limit: DAILY_AI_LIMIT
  })

  if (error) {
    console.error('Rate limit check error:', error)
    return { allowed: false, remaining: 0, resetAt, userId: user.id }
  }

  const result = data?.[0] || data
  const allowed = result?.allowed ?? false
  const newCount = result?.new_count ?? DAILY_AI_LIMIT
  const remaining = Math.max(0, DAILY_AI_LIMIT - newCount)

  return { 
    allowed,
    remaining,
    resetAt,
    userId: user.id
  }
}

/**
 * @deprecated Use checkAndIncrementAIUsage for atomic operations
 * Kept for backward compatibility - reads current usage without incrementing
 */
export async function checkAIRateLimit(): Promise<RateLimitResult> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { allowed: false, remaining: 0, resetAt: new Date() }
  }

  const today = new Date().toISOString().split('T')[0]
  
  const { data: usage, error } = await supabase
    .from('ai_usage')
    .select('generation_count, reset_date')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Rate limit check error:', error)
    return { allowed: false, remaining: 0, resetAt: new Date() }
  }

  const resetAt = new Date(today)
  resetAt.setUTCDate(resetAt.getUTCDate() + 1)
  resetAt.setUTCHours(0, 0, 0, 0)

  if (!usage || usage.reset_date !== today) {
    return { allowed: true, remaining: DAILY_AI_LIMIT, resetAt }
  }

  const remaining = Math.max(0, DAILY_AI_LIMIT - usage.generation_count)
  return { 
    allowed: usage.generation_count < DAILY_AI_LIMIT, 
    remaining,
    resetAt 
  }
}

/**
 * @deprecated Use checkAndIncrementAIUsage for atomic operations
 */
export async function incrementAIUsage(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const today = new Date().toISOString().split('T')[0]

  await supabase.rpc('increment_ai_usage', { p_user_id: user.id, p_date: today })
}
