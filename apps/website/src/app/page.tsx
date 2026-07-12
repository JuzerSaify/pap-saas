'use client'

import React, { useEffect, useState } from 'react'
import { createClient, Session } from '@supabase/supabase-js'

const supabase = createClient(
  'https://adcxvmkzljfuvknmwbvy.supabase.co',
  'sb_publishable_ks0CAyO_SD9EmCaDdhmZuw_OhvK9OFS'
)

export default function LandingPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handle Supabase implicit OAuth callback via hash fragment (e.g. /#access_token=...)
    const hash = window.location.hash.substring(1)
    if (hash && hash.includes('access_token')) {
      // Redirect to auth/callback page which properly handles the hash relay
      window.location.href = '/auth/callback' + window.location.hash
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <div className="min-h-screen bg-white text-[#09090b] flex flex-col justify-between">
      {/* Header Navigation */}
      <header className="h-20 bg-transparent flex items-center justify-between px-8 w-full z-10">
        <span
            style={{ fontFamily: '"Sifonn", sans-serif', letterSpacing: '0.04em' }}
            className="font-normal text-base text-black flex items-center gap-2"
          >
            PAPSoft
            <span className="text-[10px] font-bold tracking-widest uppercase border border-black px-1.5 py-0.5 rounded-sm" style={{ fontFamily: 'inherit', letterSpacing: '0.12em' }}>Beta</span>
          </span>
        <nav className="flex items-center gap-6">
          <a href="/docs" className="text-xs text-black font-bold hover:opacity-75 transition-opacity">Documentation</a>
          <a href="/pricing" className="text-xs text-black font-bold hover:opacity-75 transition-opacity">Pricing</a>
          
          {loading ? (
            <span className="text-xs text-black font-medium">Loading...</span>
          ) : session ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#71717a] font-medium">Active: {session.user.email}</span>
              <a href="/dashboard" className="text-xs text-black font-bold hover:opacity-75 transition-opacity">Dashboard</a>
              <button
                onClick={handleSignOut}
                className="h-9 px-4 text-xs border border-black hover:bg-black/5 text-black font-bold rounded-sm transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <a href="/login" className="h-9 px-4 text-xs bg-black text-white font-bold rounded-sm hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-center">
              Portal Log In
            </a>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8 w-full z-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-black sm:text-6xl max-w-3xl leading-[1.1]">
          Paper & Board ERP. <br />
          <span className="text-[#22b2ba]">Built Desktop-First.</span>
        </h1>
        <p className="text-sm text-[#71717a] mt-6 max-w-lg leading-relaxed font-medium">
          Modern manufacturing, trading, wholesale and distribution operating system. High-performance offline-first app that synchronizes perfectly with the cloud.
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-[10px] font-bold tracking-widest uppercase border border-[#09090b] px-2 py-0.5 rounded-sm">Public Beta</span>
          <span className="text-[10px] text-[#71717a]">Free during beta · No credit card required</span>
        </div>
        <div className="mt-8 flex gap-3">
          <a
            href="https://github.com/JuzerSaify/pap-saas/releases"
            className="h-10 px-6 text-xs bg-black text-white font-bold rounded-md hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-center"
          >
            Download App
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-20 border-t border-[#e4e4e7]/60 flex items-center justify-between px-8 w-full text-xs text-[#71717a] z-10">
        <span>© {new Date().getFullYear()} PAPSoft. All rights reserved.</span>
        <span>Lead software architecture for global wholesale distribution.</span>
      </footer>
    </div>
  )
}
