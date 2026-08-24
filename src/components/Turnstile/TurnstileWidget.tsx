'use client'

import { useRef, useState, useCallback } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: (error: string) => void
}

export default function TurnstileWidget({ onVerify, onExpire, onError }: TurnstileWidgetProps) {
  const captchaRef = useRef<TurnstileInstance>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const handleVerify = useCallback((token: string) => {
    onVerify(token)
  }, [onVerify])

  const handleExpire = useCallback(() => {
    onExpire?.()
  }, [onExpire])

  const handleError = useCallback((err: string) => {
    onError?.(err)
  }, [onError])

  if (!siteKey) {
    console.warn('Turnstile site key not configured')
    return null
  }

  return (
    <div className="flex justify-center my-4">
      <Turnstile
        ref={captchaRef}
        siteKey={siteKey}
        onSuccess={handleVerify}
        onExpire={handleExpire}
        onError={handleError}
        options={{ theme: 'light' }}
      />
    </div>
  )
}

export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const captchaRef = useRef<TurnstileInstance>(null)

  const handleVerify = useCallback((captchaToken: string) => {
    setToken(captchaToken)
    setIsVerified(true)
  }, [])

  const handleExpire = useCallback(() => {
    setToken(null)
    setIsVerified(false)
  }, [])

  const resetCaptcha = useCallback(() => {
    captchaRef.current?.reset()
    setToken(null)
    setIsVerified(false)
  }, [])

  return {
    token,
    isVerified,
    captchaRef,
    handleVerify,
    handleExpire,
    resetCaptcha,
  }
}
