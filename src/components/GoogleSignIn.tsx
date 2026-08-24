'use client'

import { useState } from 'react'
import { createClient } from '@/config/supabase/client'
import CaptchaModal from '@/components/CaptchaModal'
import { Button } from '@/components/ui'

export default function GoogleSignIn() {
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

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

  const handleCaptchaVerify = (token?: string) => {
    if (!token) return
    setShowCaptcha(false)
    handleGoogleSignIn()
  }

  return (
    <>
      <Button size="sm" onClick={handleLoginClick} loading={isLoading}>
        Log in
      </Button>

      <CaptchaModal
        isOpen={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onVerify={handleCaptchaVerify}
      />
    </>
  )
}



