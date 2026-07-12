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

  const plans = [
    {
      name: 'Starter',
      price: '$99',
      description: 'Ideal for local wholesale traders and small paper dealers.',
      features: [
        'Single company database',
        'Up to 100 Products/Items',
        'Offline-first SQLite storage',
        'Standard cloud synchronization',
        '1 Device active limit'
      ]
    },
    {
      name: 'Professional',
      price: '$299',
      description: 'Perfect for paper mills and medium manufacturing units.',
      features: [
        '3 Multi-tenant companies',
        'Unlimited products & GSM options',
        'Real-time sync to Supabase',
        'Advanced paper master parameters (BF, ply, flute)',
        'Up to 5 active devices',
        'Priority email support'
      ]
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Tailored for large multi-site converters and global board distributors.',
      features: [
        'Unlimited company setups',
        'Dedicated cloud Postgres database',
        'Active-active custom replication',
        'Custom ERP integrations (SAP, Tally)',
        '24/7 Phone & developer support',
        'SLA guaranteed sync uptime'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-white text-[#09090b] flex flex-col justify-between">
      {/* Header */}
      <header className="h-20 border-b border-[#e4e4e7] flex items-center justify-between px-8 w-full">
        <a href="/" className="font-bold text-sm tracking-wider uppercase text-black">PAPSoft SaaS</a>
        <nav className="flex items-center gap-6">
          <a href="/docs" className="text-xs text-black font-bold hover:text-[#22b2ba] transition-colors">Documentation</a>
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

      {/* Main Pricing Content */}
      <main className="flex-1 max-w-5xl mx-auto px-8 py-16 w-full">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#22b2ba] sm:text-4xl">Transparent, Scale-Friendly Pricing</h1>
          <p className="text-sm text-[#71717a] mt-3">From independent converters to global paper distribution giants.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="border border-[#e4e4e7] p-8 rounded-sm bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#22b2ba]">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tight text-[#09090b]">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="ml-1 text-sm text-[#71717a]">/month</span>}
                </div>
                <p className="mt-4 text-xs text-[#71717a] leading-relaxed">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="text-xs text-[#09090b] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#22b2ba] rounded-full"></span>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
              <button className="mt-8 w-full h-10 border border-[#22b2ba] text-[#22b2ba] text-xs font-semibold rounded-sm hover:bg-[#eafafa] transition-colors cursor-pointer">
                Get Started
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-20 border-t border-[#e4e4e7] flex items-center justify-between px-8 w-full text-xs text-[#71717a]">
        <span>© {new Date().getFullYear()} PAPSoft. All rights reserved.</span>
      </footer>
    </div>
  )
}
