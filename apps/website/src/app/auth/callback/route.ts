import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient(
      'https://adcxvmkzljfuvknmwbvy.supabase.co',
      'sb_publishable_ks0CAyO_SD9EmCaDdhmZuw_OhvK9OFS'
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/`)
}
