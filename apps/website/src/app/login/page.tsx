'use client'

import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Browser client factory
const supabase = createClient(
  'https://adcxvmkzljfuvknmwbvy.supabase.co',
  'sb_publishable_ks0CAyO_SD9EmCaDdhmZuw_OhvK9OFS'
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        })
        if (error) throw error
        setSuccessMsg('Account registration initiated! Check your email to confirm.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        setSuccessMsg('Logged in successfully!')
        window.location.href = '/'
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      })
      if (error) throw error
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign in failed')
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#09090b] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm border border-[#e4e4e7] p-8 rounded-sm bg-white">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold tracking-tight text-[#22b2ba]">PAPSoft Cloud</h1>
          <p className="text-xs text-[#71717a] mt-1">Management Portal and Registration</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-[#71717a] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 border border-[#e4e4e7] px-3 rounded-sm text-sm focus:outline-none focus:border-[#22b2ba] transition-colors"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[#71717a] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 border border-[#e4e4e7] px-3 rounded-sm text-sm focus:outline-none focus:border-[#22b2ba] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#71717a] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 border border-[#e4e4e7] px-3 rounded-sm text-sm focus:outline-none focus:border-[#22b2ba] transition-colors"
            />
          </div>

          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
          {successMsg && <p className="text-xs text-green-600">{successMsg}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-[#54e0e7] text-[#09090b] font-medium rounded-sm hover:bg-[#3cd5dc] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#e4e4e7]"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-[#71717a]">Or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full h-10 border border-[#22b2ba] hover:bg-[#eafafa] text-[#22b2ba] font-medium rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-[#71717a] hover:text-[#22b2ba] underline cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Create new account'}
          </button>
        </div>
      </div>
    </div>
  )
}
