'use client'

import { useRef, useState, useCallback } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'

interface HCaptchaWrapperProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: (error: string) => void
}

export default function HCaptchaWrapper({ onVerify, onExpire, onError }: HCaptchaWrapperProps) {
  const captchaRef = useRef<HCaptcha>(null)
  const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY

  const handleVerify = useCallback((token: string) => {
    onVerify(token)
  }, [onVerify])

  const handleExpire = useCallback(() => {
    onExpire?.()
  }, [onExpire])

  const handleError = useCallback((err: string) => {
    onError?.(err)
  }, [onError])

  if (!sitekey) {
    console.warn('hCaptcha sitekey not configured')
    return null
  }

  return (
    <div className="flex justify-center my-4">
      <HCaptcha
        ref={captchaRef}
        sitekey={sitekey}
        onVerify={handleVerify}
        onExpire={handleExpire}
        onError={handleError}
        theme="light"
      />
    </div>
  )
}

export function useHCaptcha() {
  const [token, setToken] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const captchaRef = useRef<HCaptcha>(null)

  const handleVerify = useCallback((captchaToken: string) => {
    setToken(captchaToken)
    setIsVerified(true)
  }, [])

  const handleExpire = useCallback(() => {
    setToken(null)
    setIsVerified(false)
  }, [])

  const resetCaptcha = useCallback(() => {
    captchaRef.current?.resetCaptcha()
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
