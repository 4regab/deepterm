/**
 * Cached Session Helper - Egress Optimization Phase 1
 * 
 * Uses React's cache() function to deduplicate getUser() calls within
 * a single request lifecycle in server components. This prevents the
 * same authentication check from being called multiple times per page load.
 * 
 * Based on Supabase SSR and Next.js best practices from official docs.
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 * @see https://react.dev/reference/react/cache
 */

import { cache } from 'react'
import { createServerSupabaseClient } from '@/config/supabase/server'

// Infer User type from supabase client to avoid direct import
type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>
type AuthResponse = Awaited<ReturnType<SupabaseClient['auth']['getUser']>>
type User = NonNullable<AuthResponse['data']['user']>

export interface SessionResult {
    user: User | null
    userId: string | null
    error: Error | null
}

/**
 * Cached session helper - deduplicates getUser() calls within a single request.
 * 
 * React's cache() ensures this function runs only once per request lifecycle,
 * even if called from multiple server components in the same render tree.
 */
export const getSession = cache(async (): Promise<SessionResult> => {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            // Don't throw - return null user for unauthorized requests
            console.warn('[Session] Auth error:', error.message)
            return { user: null, userId: null, error }
        }

        return {
            user,
            userId: user?.id ?? null,
            error: null
        }
    } catch (error) {
        console.error('[Session] Unexpected error:', error)
        return {
            user: null,
            userId: null,
            error: error instanceof Error ? error : new Error('Unknown session error')
        }
    }
})

/**
 * Cached Supabase client with auth context - use when you need the client
 * with the current user's session already established.
 * 
 * This also benefits from deduplication since it calls getSession() internally.
 */
export const getAuthenticatedClient = cache(async () => {
    const { user, userId } = await getSession()
    const supabase = await createServerSupabaseClient()

    return {
        supabase,
        user,
        userId,
        isAuthenticated: !!user
    }
})

/**
 * Quick check if user is authenticated - useful for guards.
 * Cached and deduplicated.
 */
export const isAuthenticated = cache(async (): Promise<boolean> => {
    const { user } = await getSession()
    return !!user
})

/**
 * Get just the user ID - common pattern for database queries.
 * Returns null if not authenticated.
 */
export const getUserId = cache(async (): Promise<string | null> => {
    const { userId } = await getSession()
    return userId
})
