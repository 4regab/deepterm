import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client (bypasses RLS). Server-only.
 * Requires SUPABASE_SECRET_KEY — never import this from client components.
 */
export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role credentials (SUPABASE_SECRET_KEY)')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
