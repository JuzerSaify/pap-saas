import { contextBridge, ipcRenderer } from 'electron'

// Securely expose APIs to Renderer Process (UI React App) without exposing node modules
contextBridge.exposeInMainWorld('api', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },
  auth: {
    signUp: (email: string, password: string, fullName: string) =>
      ipcRenderer.invoke('auth:signUp', { email, password, fullName }),
    signIn: (email: string, password: string) =>
      ipcRenderer.invoke('auth:signIn', { email, password }),
    signInWithGoogle: () =>
      ipcRenderer.invoke('auth:signInWithGoogle'),
    signOut: () => ipcRenderer.invoke('auth:signOut'),
    getSession: () => ipcRenderer.invoke('auth:getSession')
  },
  db: {
    query: (tableName: string, filter?: { id: string }) =>
      ipcRenderer.invoke('db:query', { tableName, filter }),
    insert: (tableName: string, data: Record<string, any>) =>
      ipcRenderer.invoke('db:insert', { tableName, data }),
    update: (tableName: string, id: string, data: Record<string, any>) =>
      ipcRenderer.invoke('db:update', { tableName, id, data }),
    delete: (tableName: string, id: string) =>
      ipcRenderer.invoke('db:delete', { tableName, id })
  },
  sync: {
    trigger: () => ipcRenderer.invoke('sync:trigger')
  },
  updater: {
    getVersion: () => ipcRenderer.invoke('app:version'),
    checkUpdate: () => ipcRenderer.invoke('app:check-update'),
    downloadUpdate: (url: string) => ipcRenderer.invoke('app:download-update', { url }),
    installUpdate: () => ipcRenderer.invoke('app:install-update'),
    onProgress: (callback: (progress: number) => void) => {
      const listener = (_event: any, progress: number) => callback(progress)
      ipcRenderer.on('app:update-progress', listener)
      return () => {
        ipcRenderer.removeListener('app:update-progress', listener)
      }
    }
  }
})
