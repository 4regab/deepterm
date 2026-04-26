import { createBrowserClient } from '@supabase/ssr'

/**
 * Returns the proxied Supabase URL for browser clients.
 * In the browser, requests go through /supabase/* rewrites on our own domain,
 * eliminating cross-origin requests to *.supabase.co (CORS fix).
 * On the server, we use the direct Supabase URL.
 */
function getSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Browser: use same-origin proxy path
    return window.location.origin + '/supabase'
  }
  // Server: use direct URL
  return process.env.NEXT_PUBLIC_SUPABASE_URL!
}

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
