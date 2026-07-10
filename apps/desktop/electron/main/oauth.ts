import * as http from 'http'
import { shell } from 'electron'
import { auth } from '@papsoft/auth'

let localServer: http.Server | null = null

export function handleGoogleSignIn(onSuccess: (session: any) => void, onFailure: (error: any) => void) {
  if (localServer) {
    localServer.close()
  }

  localServer = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', 'http://localhost:5678')

    if (url.pathname === '/callback') {
      // Return HTML that extracts hash fragment and redirects to /token with query params
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Authenticating...</title></head>
        <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fafafa; color: #09090b;">
          <div style="text-align: center; border: 1px solid #e4e4e7; padding: 2rem; background: white; border-radius: 4px;">
            <h3>Completing Sign In...</h3>
            <p style="color: #71717a; font-size: 14px;">Please wait while we establish a secure session.</p>
          </div>
          <script>
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const access = params.get('access_token');
            const refresh = params.get('refresh_token');
            if (access && refresh) {
              window.location.href = '/token?access_token=' + access + '&refresh_token=' + refresh;
            } else {
              document.body.innerHTML = '<h3>Authentication Failed</h3><p>OAuth tokens were not returned in hash.</p>';
            }
          </script>
        </body>
        </html>
      `)
      return
    }

    if (url.pathname === '/token') {
      const accessToken = url.searchParams.get('access_token')
      const refreshToken = url.searchParams.get('refresh_token')

      if (accessToken && refreshToken) {
        try {
          const { data, error } = await auth.setSession(accessToken, refreshToken)
          if (error) throw error

          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>Logged In</title></head>
            <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fafafa; color: #09090b;">
              <div style="text-align: center; border: 1px solid #e4e4e7; padding: 2rem; background: white; border-radius: 4px;">
                <h3 style="color: green;">Logged In Successfully!</h3>
                <p style="color: #71717a; font-size: 14px;">You can now close this browser tab and return to PAPSoft ERP.</p>
              </div>
              <script>
                setTimeout(() => window.close(), 3000);
              </script>
            </body>
            </html>
          `)

          // Notify Electron main of successful auth
          onSuccess(data.session)
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'text/plain' })
          res.end(`Failed to establish session: ${err.message}`)
          onFailure(err)
        } finally {
          // Close local server after handling token request
          if (localServer) {
            localServer.close()
            localServer = null
          }
        }
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Missing access_token or refresh_token parameters')
        onFailure(new Error('Missing tokens'))
      }
      return
    }

    // Default error
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  })

  localServer.listen(5678, async () => {
    try {
      const { data, error } = await auth.signInWithGoogle('http://localhost:5678/callback')
      if (error) throw error
      if (data?.url) {
        // Open OAuth URL in external default browser
        shell.openExternal(data.url)
      } else {
        throw new Error('Supabase did not return an authorization URL')
      }
    } catch (err) {
      onFailure(err)
      if (localServer) {
        localServer.close()
        localServer = null
      }
    }
  })
}
