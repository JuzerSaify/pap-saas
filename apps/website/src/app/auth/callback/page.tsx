'use client'

import React, { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://adcxvmkzljfuvknmwbvy.supabase.co',
  'sb_publishable_ks0CAyO_SD9EmCaDdhmZuw_OhvK9OFS'
)

export default function AuthCallbackPage() {
  useEffect(() => {
    const handleCallback = async () => {
      // Parse hash fragment tokens (implicit flow from Supabase)
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      // Parse query params (PKCE code flow)
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')

      if (accessToken && refreshToken) {
        // Try to relay hash tokens to local Electron server
        const localUrl = `http://localhost:5678/token?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 1500)
          await fetch('http://localhost:5678/', { mode: 'no-cors', signal: controller.signal })
          clearTimeout(timeoutId)
          window.location.href = localUrl
        } catch {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          window.location.href = '/dashboard'
        }
      } else if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code)
        } catch (e) {
          console.error('Code exchange failed:', e)
        }

        const localCodeUrl = `http://localhost:5678/callback?code=${encodeURIComponent(code)}`
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 1500)
          await fetch('http://localhost:5678/', { mode: 'no-cors', signal: controller.signal })
          clearTimeout(timeoutId)
          window.location.href = localCodeUrl
        } catch {
          window.location.href = '/dashboard'
        }
      } else {
        window.location.href = '/login'
      }
    }

    handleCallback()
  }, [])

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
        border: '1px solid #e4e4e7',
        padding: '2.5rem',
        borderRadius: '8px',
        maxWidth: '360px',
        width: '100%'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700 }}>Completing Sign In...</h3>
        <p style={{ color: '#71717a', fontSize: '13px', lineHeight: 1.5, margin: '0 0 24px 0' }}>
          Connecting your session. Please wait a moment.
        </p>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid #e4e4e7',
          borderTopColor: '#22b2ba',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
