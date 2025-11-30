'use client'

import { createClient } from '@/config/supabase/client'

export default function GoogleSignIn() {
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
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
    }
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      className="bg-[#171d2b] h-[42px] rounded-[100px] px-6 text-[#fefeff] font-sora text-[16px] hover:bg-[#2a3347] transition-colors flex items-center justify-center"
    >
      Log in
    </button>
  )
}



