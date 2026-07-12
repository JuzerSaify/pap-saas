'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://adcxvmkzljfuvknmwbvy.supabase.co',
  'sb_publishable_ks0CAyO_SD9EmCaDdhmZuw_OhvK9OFS'
)

type Status = 'processing' | 'relaying' | 'done' | 'web' | 'error'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<Status>('processing')
  const [statusMsg, setStatusMsg] = useState('Completing sign-in...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // ── Step 1: Get tokens ─────────────────────────────────────────────
        // Supabase sends either:
        //   PKCE flow  → ?code=...  in query string
        //   Implicit   → #access_token=... in hash
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')

        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hashAccess = hashParams.get('access_token')
        const hashRefresh = hashParams.get('refresh_token')

        let accessToken: string | null = null
        let refreshToken: string | null = null

        if (code) {
          // PKCE — exchange code for session. This is the ONLY exchange.
          // We then relay the resulting TOKENS (not the code) to Electron.
          setStatusMsg('Exchanging authorization code...')
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          accessToken = data.session?.access_token ?? null
          refreshToken = data.session?.refresh_token ?? null
        } else if (hashAccess && hashRefresh) {
          // Implicit hash flow
          accessToken = hashAccess
          refreshToken = hashRefresh
        }

        if (!accessToken || !refreshToken) {
          throw new Error('No authentication tokens received from provider.')
        }

        // ── Step 2: Detect desktop app ─────────────────────────────────────
        // Try to reach the Electron local OAuth server.
        // We relay SESSION TOKENS (not the consumed code) so Electron can call setSession().
        setStatus('relaying')
        setStatusMsg('Detecting desktop application...')

        const tokenPath = `/token?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`
        const hosts = ['http://localhost:5678', 'http://127.0.0.1:5678']

        let desktopUrl: string | null = null

        for (const host of hosts) {
          try {
            const ctrl = new AbortController()
            const tid = setTimeout(() => ctrl.abort(), 3000)
            // Regular fetch (not no-cors) — Electron server has CORS headers
            const res = await fetch(`${host}/`, { signal: ctrl.signal })
            clearTimeout(tid)
            if (res.ok) {
              desktopUrl = `${host}${tokenPath}`
              break
            }
          } catch {
            // Try next host
          }
        }

        if (desktopUrl) {
          // ── Desktop app running — relay tokens ────────────────────────────
          setStatus('done')
          setStatusMsg('Desktop app found. Completing sign-in...')
          // Small delay so user sees the message, then redirect
          await new Promise(r => setTimeout(r, 300))
          window.location.href = desktopUrl
        } else {
          // ── No desktop app — this is a web-only login ─────────────────────
          // Session was already established by exchangeCodeForSession above.
          // For implicit flow, set it now.
          if (hashAccess && hashRefresh) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          }
          setStatus('web')
          setStatusMsg('Redirecting to dashboard...')
          await new Promise(r => setTimeout(r, 600))
          window.location.href = '/dashboard'
        }
      } catch (err: any) {
        console.error('Auth callback error:', err)
        setStatus('error')
        setStatusMsg(err.message || 'Authentication failed.')
      }
    }

    handleCallback()
  }, [])

  const isError = status === 'error'

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#ffffff',
      color: '#09090b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      margin: 0
    }}>
      <div style={{
        textAlign: 'center',
        border: `1px solid ${isError ? '#fecaca' : '#e4e4e7'}`,
        padding: '2.5rem',
        borderRadius: '6px',
        maxWidth: '360px',
        width: '100%',
        background: isError ? '#fff5f5' : '#fff'
      }}>
        {!isError && status !== 'done' && (
          <div style={{
            width: '20px', height: '20px',
            border: '2px solid #e4e4e7',
            borderTopColor: '#22b2ba',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 0.8s linear infinite'
          }} />
        )}
        {status === 'done' && (
          <div style={{
            width: '20px', height: '20px',
            background: '#22b2ba',
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '11px', fontWeight: 700
          }}>✓</div>
        )}
        {isError && (
          <div style={{
            fontSize: '24px', marginBottom: '12px'
          }}>⚠</div>
        )}
        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700 }}>
          {isError ? 'Sign-In Failed' : 'Authenticating'}
        </h3>
        <p style={{ color: '#71717a', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
          {statusMsg}
        </p>
        {isError && (
          <a href="/login" style={{
            display: 'inline-block', marginTop: '20px',
            padding: '8px 20px',
            background: '#09090b', color: '#fff',
            fontSize: '11px', fontWeight: 700,
            textDecoration: 'none', borderRadius: '4px'
          }}>
            Try Again
          </a>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
