import { create } from 'zustand'

interface AppState {
  user: any | null
  session: any | null
  company: any | null
  isSyncing: boolean
  syncResult: { success: boolean; pushed: number; pulled: number } | null
  setSession: (session: any) => void
  setUser: (user: any) => void
  setCompany: (company: any) => void
  triggerSync: () => Promise<void>
  loadSession: () => Promise<void>
}

export const useStore = create<AppState>((set) => ({
  user: null,
  session: null,
  company: null,
  isSyncing: false,
  syncResult: null,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setCompany: (company) => set({ company }),

  triggerSync: async () => {
    set({ isSyncing: true })
    try {
      const res = await window.api.sync.trigger()
      set({ syncResult: res })
    } catch (e) {
      console.error('Sync failed', e)
    } finally {
      set({ isSyncing: false })
    }
  },

  loadSession: async () => {
    try {
      const res = await window.api.auth.getSession()
      if (res?.data?.session) {
        set({ session: res.data.session, user: res.data.session.user })
        
        // Load company if user has one
        const companies = await window.api.db.query('companies')
        if (companies && companies.length > 0) {
          set({ company: companies[0] })
        }
      }
    } catch (e) {
      console.error('Failed to load session', e)
    }
  }
}))
export default useStore
