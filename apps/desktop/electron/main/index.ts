import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc.js'
import { initDatabase } from './database/setup.js'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    icon: join(app.getAppPath(), 'out/renderer/favicon.png'),
    webPreferences: {
      preload: join(app.getAppPath(), 'out/preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'PAPSoft ERP'
  })

  // Set clean window headers (remove default menus for plain minimalist aesthetics)
  mainWindow.setMenuBarVisibility(false)

  // Force all child popups to be frameless for custom title bars
  mainWindow.webContents.setWindowOpenHandler((details) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        frame: false,
        autoHideMenuBar: true,
        webPreferences: {
          preload: join(app.getAppPath(), 'out/preload/index.cjs'),
          contextIsolation: true,
          nodeIntegration: false
        }
      }
    }
  })

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(app.getAppPath(), 'out/renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Initialize SQLite database
  initDatabase()

  // Register all secure IPC backend handlers
  registerIpcHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
