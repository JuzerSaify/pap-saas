import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { env } from '@papsoft/config'
import * as fs from 'fs'
import * as path from 'path'

// Polyfill global WebSocket for older Node versions in main process
if (typeof global !== 'undefined' && !global.WebSocket) {
  class DummyWebSocket {
    static CONNECTING = 0
    static OPEN = 1
    static CLOSING = 2
    static CLOSED = 3
    constructor() {
      throw new Error('Realtime subscriptions are disabled in the desktop main process.')
    }
  }
  global.WebSocket = DummyWebSocket as any
}

// Custom file-based storage for Supabase auth in Electron Main Process
class FileStorage {
  private filePath: string

  constructor() {
    // Default to app data directory
    const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config')
    const dir = path.join(appDataPath, 'papsoft')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    this.filePath = path.join(dir, 'session.json')
  }

  getItem(key: string): string | null {
    if (!fs.existsSync(this.filePath)) return null
    try {
      const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
      return data[key] || null
    } catch {
      return null
    }
  }

  setItem(key: string, value: string): void {
    let data: Record<string, string> = {}
    if (fs.existsSync(this.filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
      } catch {
        data = {}
      }
    }
    data[key] = value
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  removeItem(key: string): void {
    if (!fs.existsSync(this.filePath)) return
    try {
      const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
      delete data[key]
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch {
      // Ignore
    }
  }
}

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        storage: new FileStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false // No URLs in electron main
      }
    })
  }
  return supabaseClient
}

export const auth = {
  signUp: async (email: string, password: string, fullName: string) => {
    const client = getSupabaseClient()
    return client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
  },

  signIn: async (email: string, password: string) => {
    const client = getSupabaseClient()
    return client.auth.signInWithPassword({
      email,
      password
    })
  },

  signInWithGoogle: async (redirectTo: string) => {
    const client = getSupabaseClient()
    return client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
  },

  setSession: async (accessToken: string, refreshToken: string) => {
    const client = getSupabaseClient()
    return client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  },

  signOut: async () => {
    const client = getSupabaseClient()
    return client.auth.signOut()
  },

  getSession: async () => {
    const client = getSupabaseClient()
    return client.auth.getSession()
  },

  getUser: async () => {
    const client = getSupabaseClient()
    return client.auth.getUser()
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const client = getSupabaseClient()
    const { data } = client.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
    return data.subscription
  }
}
