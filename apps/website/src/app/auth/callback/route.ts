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
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (e) {
      console.error('Failed to exchange code for session on website:', e)
    }

    // Return HTML page with script that tries to ping and redirect the OAuth code back to Electron local server.
    // If the local Electron app is running, it will capture it and log in. If not, it redirects to the website homepage.
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Completing Authentication...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #ffffff;
            color: #09090b;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            text-align: center;
            border: 1px solid #e4e4e7;
            padding: 2.5rem;
            background: #ffffff;
            border-radius: 8px;
            max-width: 360px;
            width: 100%;
          }
          h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: -0.01em;
          }
          p {
            color: #71717a;
            font-size: 13px;
            line-height: 1.5;
            margin: 0 0 24px 0;
          }
          .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #e4e4e7;
            border-top-color: #22b2ba;
            border-radius: 50%;
            margin: 0 auto;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h3>Authenticating PAPSoft ERP</h3>
          <p>Connecting to your installed application. Please wait a moment...</p>
          <div class="spinner"></div>
        </div>
        <script>
          const code = "${code}";
          const localUrl = "http://localhost:5678/callback?code=" + encodeURIComponent(code);
          
          // Probe if local Electron OAuth server is listening
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);

          fetch("http://localhost:5678/", { method: "GET", mode: "no-cors", signal: controller.signal })
            .then(() => {
              clearTimeout(timeoutId);
              // Server is listening, redirect browser to local callback to finish auth
              window.location.href = localUrl;
            })
            .catch(() => {
              clearTimeout(timeoutId);
              // Server not listening (normal web user), redirect to web dashboard
              window.location.href = "/dashboard";
            });
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  return NextResponse.redirect(`${origin}/`)
}
