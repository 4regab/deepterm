'use client'

import { useState, useRef } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { createClient } from '@/config/supabase/client'

export default function GoogleSignIn() {
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [captchaError, setCaptchaError] = useState(false)
  const captchaRef = useRef<HCaptcha>(null)
  const supabase = createClient()
  const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY

  const handleLoginClick = () => {
    if (sitekey) {
      setShowCaptcha(true)
      setCaptchaError(false)
    } else {
      handleGoogleSignIn()
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('Google sign-in error:', error.message)
      setIsLoading(false)
      setShowCaptcha(false)
      captchaRef.current?.resetCaptcha()
    }
  }

  const handleCaptchaVerify = () => {
    setShowCaptcha(false)
    setCaptchaError(false)
    handleGoogleSignIn()
  }

  const handleCaptchaError = () => {
    setCaptchaError(true)
    setTimeout(() => {
      setShowCaptcha(false)
      handleGoogleSignIn()
    }, 1000)
  }

  const handleCaptchaClose = () => {
    setShowCaptcha(false)
    setCaptchaError(false)
  }

  if (showCaptcha && sitekey) {
    return (
      <div className="flex flex-col items-center gap-3">
        {captchaError ? (
          <p className="text-sm text-[#171d2b]/60">Loading captcha...</p>
        ) : (
          <HCaptcha
            ref={captchaRef}
            sitekey={sitekey}
            onVerify={handleCaptchaVerify}
            onExpire={handleCaptchaClose}
            onError={handleCaptchaError}
            theme="light"
          />
        )}
        <button
          onClick={handleCaptchaClose}
          className="text-[#171d2b]/60 text-sm hover:text-[#171d2b] transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleLoginClick}
      disabled={isLoading}
      className="bg-[#171d2b] h-[42px] rounded-[100px] px-6 text-[#fefeff] font-sora text-[16px] hover:bg-[#2a3347] transition-colors flex items-center justify-center disabled:opacity-50"
    >
      {isLoading ? 'Loading...' : 'Log in'}
    </button>
  )
}



