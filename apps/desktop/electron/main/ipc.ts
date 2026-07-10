import { ipcMain, BrowserWindow, app, net } from 'electron'
import { auth } from '@papsoft/auth'
import { getDb } from './database/setup.js'
import { SyncManager } from '@papsoft/sync'
import { sqliteSchema } from '@papsoft/database'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { handleGoogleSignIn } from './oauth.js'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { exec, spawn } from 'child_process'

let downloadedFilePath = ''

export function registerIpcHandlers() {
  // Window Control Handlers
  ipcMain.handle('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })
  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })
  ipcMain.handle('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  // Auth Handlers
  ipcMain.handle('auth:signUp', async (_, { email, password, fullName }) => {
    return auth.signUp(email, password, fullName)
  })

  ipcMain.handle('auth:signIn', async (_, { email, password }) => {
    return auth.signIn(email, password)
  })

  ipcMain.handle('auth:signInWithGoogle', async () => {
    return new Promise((resolve) => {
      handleGoogleSignIn(
        (session) => resolve({ data: { session }, error: null }),
        (error) => resolve({ data: null, error })
      )
    })
  })

  ipcMain.handle('auth:signOut', async () => {
    return auth.signOut()
  })

  ipcMain.handle('auth:getSession', async () => {
    return auth.getSession()
  })

  // Database Handlers
  ipcMain.handle('db:query', async (_, { tableName, filter }) => {
    const db = getDb()
    const table = (sqliteSchema as any)[tableName]
    if (!table) throw new Error(`Unknown table: ${tableName}`)

    if (filter) {
      return db.select().from(table).where(eq(table.id, filter.id)).all()
    }
    return db.select().from(table).all()
  })

  ipcMain.handle('db:insert', async (_, { tableName, data }) => {
    const db = getDb()
    const table = (sqliteSchema as any)[tableName]
    if (!table) throw new Error(`Unknown table: ${tableName}`)

    const recordId = data.id || randomUUID()
    const record = {
      ...data,
      id: recordId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Insert locally
    db.insert(table).values(record).run()

    // Add to local offline sync queue
    db.insert(sqliteSchema.syncQueue).values({
      id: randomUUID(),
      tableName,
      recordId,
      operation: 'INSERT',
      payload: JSON.stringify(record),
      createdAt: new Date().toISOString()
    }).run()

    return record
  })

  ipcMain.handle('db:update', async (_, { tableName, id, data }) => {
    const db = getDb()
    const table = (sqliteSchema as any)[tableName]
    if (!table) throw new Error(`Unknown table: ${tableName}`)

    const record = {
      ...data,
      updatedAt: new Date().toISOString()
    }

    db.update(table).set(record).where(eq(table.id, id)).run()

    // Add to sync queue
    db.insert(sqliteSchema.syncQueue).values({
      id: randomUUID(),
      tableName,
      recordId: id,
      operation: 'UPDATE',
      payload: JSON.stringify(record),
      createdAt: new Date().toISOString()
    }).run()

    return { id, ...record }
  })

  ipcMain.handle('db:delete', async (_, { tableName, id }) => {
    const db = getDb()
    const table = (sqliteSchema as any)[tableName]
    if (!table) throw new Error(`Unknown table: ${tableName}`)

    db.delete(table).where(eq(table.id, id)).run()

    // Add to sync queue
    db.insert(sqliteSchema.syncQueue).values({
      id: randomUUID(),
      tableName,
      recordId: id,
      operation: 'DELETE',
      createdAt: new Date().toISOString()
    }).run()

    return { id }
  })

  // Sync Handlers
  ipcMain.handle('sync:trigger', async () => {
    const db = getDb()
    const syncManager = new SyncManager(db)
    return syncManager.sync()
  })

  // Updater Handlers
  ipcMain.handle('app:version', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:check-update', async () => {
    try {
      const response = await fetch('https://api.github.com/repos/JuzerSaify/pap-saas/releases/latest', {
        headers: {
          'User-Agent': 'PAPSoft-ERP-Updater'
        }
      })
      if (!response.ok) {
        return { updateAvailable: false }
      }
      const data: any = await response.json()
      const latestVersion = data.tag_name.replace(/^v/, '')
      const currentVersion = app.getVersion()

      // Basic semver compare
      const currentParts = currentVersion.split('.').map(Number)
      const latestParts = latestVersion.split('.').map(Number)

      let updateAvailable = false
      for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const cur = currentParts[i] || 0
        const lat = latestParts[i] || 0
        if (lat > cur) {
          updateAvailable = true
          break
        } else if (cur > lat) {
          break
        }
      }

      return {
        updateAvailable,
        latestVersion,
        releaseNotes: data.body,
        assets: data.assets
      }
    } catch (e) {
      console.error('Update check failed:', e)
      return { updateAvailable: false }
    }
  })

  ipcMain.handle('app:download-update', async (event, { url }) => {
    return new Promise((resolve, reject) => {
      const tempDir = app.getPath('temp')
      const fileName = 'PAPSoft-Setup-Update.exe'
      const filePath = path.join(tempDir, fileName)
      downloadedFilePath = filePath

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
        } catch (err) {
          console.error('Failed to delete temp file:', err)
        }
      }

      const file = fs.createWriteStream(filePath)

      const request = net.request({
        method: 'GET',
        url: url,
        redirect: 'follow'
      })

      request.setHeader('User-Agent', 'PAPSoft-ERP-Updater')

      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          file.close()
          reject(new Error(`Failed to download update, status: ${response.statusCode}`))
          return
        }

        const totalBytes = parseInt(response.headers['content-length'] as string || '0', 10)
        let downloadedBytes = 0

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length
          file.write(chunk)

          if (totalBytes > 0) {
            const progress = Math.round((downloadedBytes / totalBytes) * 100)
            event.sender.send('app:update-progress', progress)
          }
        })

        response.on('end', () => {
          file.end()
          resolve({ filePath })
        })

        response.on('error', (err) => {
          file.close()
          reject(err)
        })
      })

      request.on('error', (err) => {
        file.close()
        reject(err)
      })

      request.end()
    })
  })

  ipcMain.handle('app:install-update', () => {
    if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
      const child = spawn(downloadedFilePath, [], {
        detached: true,
        stdio: 'ignore'
      })
      child.unref()
      app.quit()
    } else {
      throw new Error('No downloaded update installer found')
    }
  })
}
