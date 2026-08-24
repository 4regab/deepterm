import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in Client Components.
 * 
 * IMPORTANT: Always use the real Supabase URL, not a proxy path.
 * The Next.js rewrites in next.config.ts handle proxying transparently.
 * Using a proxy path here breaks authentication cookie handling.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
