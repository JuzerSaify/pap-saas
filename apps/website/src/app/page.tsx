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
    <div className="min-h-screen bg-white text-[#09090b] flex flex-col justify-between">
      {/* Header Navigation */}
      <header className="h-20 border-b border-[#e4e4e7] flex items-center justify-between px-8 w-full">
        <span className="font-bold text-sm tracking-wider uppercase">PAPSoft SaaS</span>
        <nav className="flex items-center gap-6">
          <a href="/docs" className="text-xs text-[#71717a] hover:text-[#09090b] transition-colors">Documentation</a>
          <a href="/pricing" className="text-xs text-[#71717a] hover:text-[#09090b] transition-colors">Pricing</a>
          
          {loading ? (
            <span className="text-xs text-[#71717a]">Loading...</span>
          ) : session ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#71717a]">Active: {session.user.email}</span>
              <button
                onClick={handleSignOut}
                className="h-9 px-4 text-xs border border-[#e4e4e7] hover:bg-[#f4f4f5] text-[#09090b] font-medium rounded-sm transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <a href="/login" className="h-9 px-4 text-xs bg-[#09090b] text-[#fafafa] font-medium rounded-sm hover:bg-[#27272a] transition-colors cursor-pointer flex items-center justify-center">
              Portal Log In
            </a>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8 w-full">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#09090b] sm:text-5xl">
          Paper & Board ERP. Built Desktop-First.
        </h1>
        <p className="text-sm text-[#71717a] mt-4 max-w-lg leading-relaxed">
          Modern manufacturing, trading, wholesale and distribution operating system. High-performance offline-first app that synchronizes perfectly with the cloud.
        </p>
        <div className="mt-8 flex gap-3">
          <a
            href={downloadUrl}
            className="h-10 px-5 text-xs bg-[#09090b] text-[#fafafa] font-medium rounded-sm hover:bg-[#27272a] transition-colors cursor-pointer flex items-center justify-center"
          >
            Download App {latestTag ? `(${latestTag})` : ''}
          </a>
          <button className="h-10 px-5 text-xs border border-[#e4e4e7] bg-white text-[#09090b] font-medium rounded-sm hover:bg-[#f4f4f5] transition-colors cursor-pointer">
            Talk to Sales
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-20 border-t border-[#e4e4e7] flex items-center justify-between px-8 w-full text-xs text-[#71717a]">
        <span>© {new Date().getFullYear()} PAPSoft. All rights reserved.</span>
        <span>Lead software architecture for global wholesale distribution.</span>
      </footer>
    </div>
  )
}
