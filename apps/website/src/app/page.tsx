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
  const [downloadUrl, setDownloadUrl] = useState<string>('https://github.com/JuzerSaify/pap-saas/releases')
  const [latestTag, setLatestTag] = useState<string>('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    // Fetch latest release info
    fetch('https://api.github.com/repos/JuzerSaify/pap-saas/releases/latest')
      .then(res => res.json())
      .then(data => {
        if (data.tag_name) {
          setLatestTag(data.tag_name)
          const exe = data.assets?.find((asset: any) => asset.name.endsWith('.exe'))
          if (exe) {
            setDownloadUrl(exe.browser_download_url)
          }
        }
      })
      .catch(err => console.error('Failed to get latest release info', err))

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <div 
      className="min-h-screen bg-white text-[#09090b] flex flex-col justify-between"
      style={{
        backgroundImage: `
          radial-gradient(at top, rgba(84, 224, 231, 0.25) 0%, rgba(224, 251, 253, 0.08) 50%, rgba(255, 255, 255, 0) 100%),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.035'/%3E%3C/svg%3E")
        `,
      }}
    >
      {/* Header Navigation */}
      <header className="h-20 bg-transparent flex items-center justify-between px-8 w-full z-10">
        <span className="font-bold text-sm tracking-wider uppercase text-black">PAPSoft SaaS</span>
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
        <div className="mt-8 flex gap-3">
          <a
            href={downloadUrl}
            className="h-10 px-6 text-xs bg-black text-white font-bold rounded-md hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-center shadow-md shadow-neutral-200"
          >
            Download App {latestTag ? `(${latestTag})` : ''}
          </a>
          <button className="h-10 px-6 text-xs border border-black bg-transparent text-black font-bold rounded-md hover:bg-black/5 transition-all cursor-pointer">
            Talk to Sales
          </button>
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
