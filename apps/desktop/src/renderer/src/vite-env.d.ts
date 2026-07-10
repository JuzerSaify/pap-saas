/// <reference types="vite/client" />

interface Window {
  api: {
    window: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
    }
    auth: {
      signUp: (email: string, password: string, fullName: string) => Promise<any>
      signIn: (email: string, password: string) => Promise<any>
      signInWithGoogle: () => Promise<any>
      signOut: () => Promise<any>
      getSession: () => Promise<any>
    }
    db: {
      query: (tableName: string, filter?: { id: string }) => Promise<any[]>
      insert: (tableName: string, data: Record<string, any>) => Promise<any>
      update: (tableName: string, id: string, data: Record<string, any>) => Promise<any>
      delete: (tableName: string, id: string) => Promise<any>
    }
    sync: {
      trigger: () => Promise<{ success: boolean; pushed: number; pulled: number }>
    }
  }
}
