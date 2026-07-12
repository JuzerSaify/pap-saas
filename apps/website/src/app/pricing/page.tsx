'use client'

import React, { useEffect, useState } from 'react'
import { createClient, Session } from '@supabase/supabase-js'

const supabase = createClient(
  'https://adcxvmkzljfuvknmwbvy.supabase.co',
  'sb_publishable_ks0CAyO_SD9EmCaDdhmZuw_OhvK9OFS'
)

export default function PricingPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      {/* Header */}
      <header className="h-20 border-b border-[#e4e4e7] flex items-center justify-between px-8 w-full">
        <a
          href="/"
          style={{
            fontFamily: '"Sifonn", sans-serif',
            letterSpacing: '0.06em',
            WebkitTextStroke: '0.6px #09090b',
            fontSize: '1.15rem',
          }}
          className="text-black flex items-center gap-2.5 no-underline"
        >
          PAPSoft
          <span style={{
            WebkitTextStroke: '0px',
            fontSize: '9px',
            letterSpacing: '0.14em',
          }} className="font-bold uppercase bg-[#09090b] text-white px-2 py-0.5 rounded-sm">
            Beta
          </span>
        </a>
        <nav className="flex items-center gap-6">
          <a href="/docs" className="text-xs text-black font-bold hover:opacity-75 transition-opacity">Documentation</a>
          <a href="/pricing" className="text-xs text-[#22b2ba] font-bold transition-colors">Pricing</a>

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

      {/* Coming Soon */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#22b2ba] mb-6">Pricing</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#09090b] sm:text-5xl">
          Coming Soon
        </h1>
        <p className="text-sm text-[#71717a] mt-4 max-w-md leading-relaxed">
          We are still in <strong>public beta</strong>. Pricing plans will be announced once we exit beta. For now, all features are completely free.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <span className="text-[10px] font-bold tracking-widest uppercase border border-[#09090b] px-3 py-1 rounded-sm">Free During Beta</span>
          <a
            href="/"
            className="text-xs text-[#71717a] hover:text-[#09090b] transition-colors font-medium mt-2"
          >
            ← Back to Home
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-20 border-t border-[#e4e4e7] flex items-center justify-between px-8 w-full text-xs text-[#71717a]">
        <span>© {new Date().getFullYear()} PAPSoft. All rights reserved.</span>
        <span>Public Beta — Features subject to change.</span>
      </footer>
    </div>
  )
}
