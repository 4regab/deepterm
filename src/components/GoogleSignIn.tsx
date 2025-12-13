'use client'

import { useState } from 'react'
import { createClient } from '@/config/supabase/client'
import CaptchaModal from '@/components/CaptchaModal'

export default function GoogleSignIn() {
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY

  const handleLoginClick = () => {
    if (sitekey) {
      setShowCaptcha(true)
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
    }
  }

  const handleCaptchaVerify = () => {
    setShowCaptcha(false)
    handleGoogleSignIn()
  }

  return (
    <>
      <button
        onClick={handleLoginClick}
        disabled={isLoading}
        className="bg-[#171d2b] h-[42px] rounded-[100px] px-6 text-[#fefeff] font-sora text-[16px] hover:bg-[#2a3347] transition-colors flex items-center justify-center disabled:opacity-50"
      >
        {isLoading ? 'Loading...' : 'Log in'}
      </button>

      <CaptchaModal
        isOpen={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onVerify={handleCaptchaVerify}
      />
    </>
  )
}



