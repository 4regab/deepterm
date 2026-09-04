'use client'

import { useRef, useState, useCallback } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { AlertTriangle } from 'lucide-react'

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: (error: string) => void
}

export default function TurnstileWidget({ onVerify, onExpire, onError }: TurnstileWidgetProps) {
  const captchaRef = useRef<TurnstileInstance>(null)
  const siteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '').trim()

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
    return (
      <div
        className="my-4 rounded-md border border-danger bg-danger-subtle p-3 text-danger-text text-sm"
        role="alert"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Human verification is not configured. Set{" "}
            <code className="text-xs">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[65px] justify-center my-4">
      <Turnstile
        ref={captchaRef}
        siteKey={siteKey}
        onSuccess={handleVerify}
        onExpire={handleExpire}
        onError={handleError}
        options={{ theme: 'light', appearance: 'always' }}
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
