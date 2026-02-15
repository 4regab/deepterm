'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense, useState } from 'react'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + '?' + searchParams.toString()
      }
      posthog.capture('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams, posthog])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let isMounted = true
    const markInitialized = () => {
      if (isMounted) {
        setIsInitialized(true)
      }
    }

    // Initialize PostHog only on the client side, inside useEffect
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY && !posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: '/ingest',
        ui_host: 'https://us.posthog.com',
        // Pageview capture - disabled for manual SPA tracking
        capture_pageview: false,
        capture_pageleave: true,
        // Enable autocapture for clicks, form submissions, etc.
        autocapture: true,
        // Track ALL users (anonymous + identified) for DAU/MAU metrics
        person_profiles: 'always',
        // Persistence for session and user tracking
        persistence: 'localStorage+cookie',
        // Session recording (optional - enable if needed)
        disable_session_recording: false,
        // Bootstrap feature flags loading
        bootstrap: {
          distinctID: undefined,
        },
        loaded: () => {
          markInitialized()
        },
        // Debugging (disable in production)
        debug: process.env.NODE_ENV === 'development',
      })
    } else if (posthog.__loaded) {
      queueMicrotask(() => {
        markInitialized()
      })
    }

    return () => {
      isMounted = false
    }
  }, [])

  // Render children even if not initialized to avoid blocking
  return (
    <PHProvider client={posthog}>
      {isInitialized && (
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
      )}
      {children}
    </PHProvider>
  )
}
