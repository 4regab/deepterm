'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useState } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Only render PostHog provider on client to avoid hydration mismatch
  if (!isClient) {
    return <>{children}</>
  }

  return <PHProvider client={posthog}>{children}</PHProvider>
}
