import React, { useEffect, useState } from 'react'
import { useStore } from './store.js'
import { Button } from '@papsoft/ui'
import {
  Building2, Users, Package, Settings as SettingsIcon, RefreshCw, LogOut, Plus,
  ChevronDown, ChevronRight, MapPin, FileText, ClipboardList,
  ArrowRightLeft, Truck, BookOpen, Landmark,
  Wallet, DollarSign, ListOrdered, BarChart3, LineChart, LayoutDashboard, Lock, Unlock
} from 'lucide-react'

// Sub-tab Components
import { Dashboard } from './components/Dashboard'
import { LocationMaster } from './components/LocationMaster'
import { ItemMaster } from './components/ItemMaster'
import { AccountMaster } from './components/AccountMaster'
import { SalesPersonMaster } from './components/SalesPersonMaster'
import { StockInward } from './components/StockInward'
import { StockTransfer } from './components/StockTransfer'
import { Invoice } from './components/Invoice'
import { DoOrder } from './components/DoOrder'
import { AddaBook } from './components/AddaBook'
import { Receipt } from './components/Receipt'
import { Payment } from './components/Payment'
import { InventoryReport } from './components/InventoryReport'
import { AgingReport } from './components/AgingReport'
import { GrossMarginReport } from './components/GrossMarginReport'
import { Settings } from './components/Settings'
import { LocationRecord, SalesPersonRecord } from './components/types'

type SubTab =
  | 'dashboard'
  | 'location' | 'item' | 'account' | 'salesperson'
  | 'stockinward' | 'stocktransfer'
  | 'invoice' | 'do' | 'addabook'
  | 'receipt' | 'payment'
  | 'inventory' | 'aging' | 'margin'
  | 'settings'

export function App() {
  const { session, user, company, isSyncing, syncResult, loadSession, triggerSync, setSession, setUser } = useStore()
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('dashboard')
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // ── Application Lock ────────────────────────────────────────────────────────
  const [appLockPassword, setAppLockPassword] = useState<string>(() => localStorage.getItem('papsoft_app_lock_password') || '')
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => !!localStorage.getItem('papsoft_app_lock_password'))
  const [unlockPasswordInput, setUnlockPasswordInput] = useState('')
  const [unlockError, setUnlockError] = useState('')

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => localStorage.getItem('papsoft_user_avatar') || 'google-icon')

  // ── Sidebar Accordion ───────────────────────────────────────────────────────
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    master: true, stock: true, sales: true, entry: true, report: true
  })

  // ── Auth Form State ─────────────────────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [authError, setAuthError] = useState('')

  // ── Auto Updater State ──────────────────────────────────────────────────────
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'failed'>('idle')
  const [updateProgress, setUpdateProgress] = useState(0)
  const [latestVersion, setLatestVersion] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')

  // ── Database-backed Global State ────────────────────────────────────────────
  const [contacts, setContacts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  // ── Master Lists (in-memory only) ───────────────────────────────────────────
  const [locations, setLocations] = useState<LocationRecord[]>([
    { id: 1, name: 'Main Godown A', city: 'Mumbai', phone: '+91 98200 12345', status: 'Active' },
    { id: 2, name: 'Port Warehouse 2', city: 'Chennai', phone: '+91 44250 54321', status: 'Active' },
    { id: 3, name: 'Factory Depot', city: 'Gujarat', phone: '+91 26522 98765', status: 'Active' }
  ])
  const [salesPersons, setSalesPersons] = useState<SalesPersonRecord[]>([
    { id: 1, name: 'Rajesh Sharma', phone: '+91 98110 98765', status: 'Active' },
    { id: 2, name: 'Amit Patel', phone: '+91 99220 54321', status: 'Active' }
  ])

  // ── Company Name for Settings ───────────────────────────────────────────────
  const [newCompanyName, setNewCompanyName] = useState('')

  // ── Derived: Filtered to Active Only ───────────────────────────────────────
  const activeSalesPersons = salesPersons.filter(sp => sp.status !== 'Postponed')
  const activeLocations = locations.filter(loc => loc.status !== 'Postponed')

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await loadSession()
      setIsLoading(false)
    }
    init()
  }, [])

  // ── Auto Updater Hook ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.api || !window.api.updater) return

    const checkForUpdates = async () => {
      setUpdateStatus('checking')
      try {
        const res = await window.api.updater.checkUpdate()
        if (res.updateAvailable) {
          setLatestVersion(res.latestVersion)
          const exeAsset = res.assets?.find((asset: any) => asset.name.endsWith('.exe'))
          if (exeAsset) {
            setDownloadUrl(exeAsset.browser_download_url)
            setUpdateStatus('available')
          } else {
            setUpdateStatus('idle')
          }
        } else {
          setUpdateStatus('idle')
        }
      } catch (e) {
        console.error('Update check failed:', e)
        setUpdateStatus('failed')
      }
    }

    const unsubscribeProgress = window.api.updater.onProgress((progress: number) => {
      setUpdateProgress(progress)
    })

    checkForUpdates()

    return () => {
      unsubscribeProgress()
    }
  }, [])

  useEffect(() => {
    if (session) loadData()
  }, [session])

  const loadData = async () => {
    try {
      const c = await window.api.db.query('contacts')
      setContacts(c || [])
      const p = await window.api.db.query('products')
      setProducts(p || [])
    } catch (e) {
      console.error('Failed to load data', e)
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleUnlockSoftware = (e: React.FormEvent) => {
    e.preventDefault()
    if (unlockPasswordInput === appLockPassword) {
      setIsAppLocked(false)
      setUnlockPasswordInput('')
      setUnlockError('')
    } else {
      setUnlockError('Incorrect password. Access denied.')
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    try {
      if (isSignUp) {
        const res = await window.api.auth.signUp(email, password, fullName)
        if (res.error) throw res.error
        alert('Verification email sent or sign up successful!')
      } else {
        const res = await window.api.auth.signIn(email, password)
        if (res.error) throw res.error
        setSession(res.data.session)
        setUser(res.data.user)
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed')
    }
  }

  const handleSignOut = async () => {
    await window.api.auth.signOut()
    setSession(null)
    setUser(null)
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await window.api.db.insert('companies', { name: newCompanyName, industry: 'paper_board' })
      useStore.setState({ company: res })
      setNewCompanyName('')
    } catch (e) {
      console.error(e)
    }
  }

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  const startDownloadingUpdate = async () => {
    if (!downloadUrl) return
    setUpdateStatus('downloading')
    setUpdateProgress(0)
    try {
      await window.api.updater.downloadUpdate(downloadUrl)
      setUpdateStatus('ready')
    } catch (e) {
      console.error('Download update failed:', e)
      setUpdateStatus('failed')
    }
  }

  const restartToInstallUpdate = () => {
    window.api.updater.installUpdate()
  }

  const renderAvatarGraphic = (cls: string = 'w-8 h-8') => {
    if (selectedAvatar === 'google-icon' || !selectedAvatar.startsWith('http')) {
      return (
        <div className={`${cls} rounded-full bg-[#f1f3f4] border border-[#e4e4e7] flex items-center justify-center overflow-hidden`}>
          <svg className="w-5 h-5 text-[#5f6368]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        </div>
      )
    }
    return (
      <img
        src={selectedAvatar}
        alt="User Profile"
        className={`${cls} rounded-full border border-[#e4e4e7] bg-white object-cover`}
        onError={e => { e.currentTarget.style.display = 'none' }}
      />
    )
  }

  // ── Sidebar nav button helper ───────────────────────────────────────────────
  const navBtn = (tab: SubTab, icon: React.ReactNode, label: string, sub = false) => (
    <button
      onClick={() => setActiveSubTab(tab)}
      className={`w-full flex items-center gap-2${sub ? '' : '.5'} px-${sub ? '2.5' : '3'} h-${sub ? '8.5' : '9'} text-${sub ? '[11px]' : 'xs'} font-${sub ? 'medium' : 'semibold'} rounded-md transition-colors cursor-pointer border ${
        activeSubTab === tab
          ? 'bg-[#fafafa] border-[#e4e4e7] text-[#09090b] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
          : 'text-[#52525b] border-transparent hover:bg-[#fafafa]/50 hover:text-[#09090b]'
      }`}
    >
      {icon}
      {label}
    </button>
  )

  // ── Tab title label map ─────────────────────────────────────────────────────
  const tabTitle: Record<SubTab, string> = {
    dashboard: 'Overview',
    location: 'Location',
    item: 'Item Name',
    account: 'Account Name',
    salesperson: 'Sales Person',
    stockinward: 'Stock Inward',
    stocktransfer: 'Stock Transfer',
    invoice: 'Invoice',
    do: 'DO Order',
    addabook: 'Adda Book',
    receipt: 'Receipt',
    payment: 'Payment',
    inventory: 'Inventory',
    aging: 'Aging',
    margin: 'Gross Margin',
    settings: 'Settings'
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white text-[#09090b]">
        <div className="text-xs uppercase tracking-widest font-bold animate-pulse">Loading PAPSoft...</div>
      </div>
    )
  }

  // ── APP LOCK SCREEN ────────────────────────────────────────────────────────
  if (isAppLocked && appLockPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-4 select-none">
        <div className="w-full max-w-sm border border-[#e4e4e7] p-8 rounded-xl bg-white shadow-sm">
          <div className="mb-6 text-center">
            <Lock size={32} className="mx-auto text-[#09090b] mb-3" />
            <h1 className="text-lg font-extrabold tracking-tight text-[#09090b]">PAPSoft ERP Locked</h1>
            <p className="text-[11px] text-[#71717a] mt-1 font-medium">Enter software access password to unlock interface</p>
          </div>
          <form onSubmit={handleUnlockSoftware} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#71717a] mb-1">Access Password</label>
              <input
                type="password"
                required
                autoFocus
                value={unlockPasswordInput}
                onChange={e => setUnlockPasswordInput(e.target.value)}
                className="w-full h-10 border border-[#e4e4e7] px-3 rounded-md text-sm bg-white focus:outline-none focus:border-[#09090b] transition-colors"
                placeholder="Enter password..."
              />
            </div>
            {unlockError && <p className="text-xs text-red-500 font-semibold">{unlockError}</p>}
            <button type="submit" className="w-full h-10 bg-[#09090b] text-[#fafafa] font-bold text-xs rounded-md hover:bg-[#27272a] transition-colors cursor-pointer flex items-center justify-center gap-2">
              <Unlock size={14} />
              Unlock Application
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── AUTH SCREEN ────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-4">
        <div className="w-full max-w-sm border border-[#e4e4e7] p-8 rounded-xl bg-white shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-extrabold tracking-tight text-[#09090b]">PAPSoft ERP</h1>
            <p className="text-[11px] text-[#71717a] mt-1 font-medium">Enterprise planning for paper and board industries</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-[#71717a] mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full h-10 border border-[#e4e4e7] px-3 rounded-md text-sm bg-white focus:outline-none focus:border-[#09090b] transition-colors" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-[#71717a] mb-1">Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-10 border border-[#e4e4e7] px-3 rounded-md text-sm bg-white focus:outline-none focus:border-[#09090b] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#71717a] mb-1">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full h-10 border border-[#e4e4e7] px-3 rounded-md text-sm bg-white focus:outline-none focus:border-[#09090b] transition-colors" />
            </div>
            {authError && <p className="text-xs text-red-500">{authError}</p>}
            <button type="submit" className="w-full h-10 bg-[#09090b] text-[#fafafa] font-bold text-xs rounded-md hover:bg-[#27272a] transition-colors cursor-pointer">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#e4e4e7]" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#71717a] font-semibold text-[10px]">Or</span>
            </div>
          </div>
          <button
            type="button"
            className="w-full h-10 flex items-center justify-center gap-2.5 border border-[#e4e4e7] hover:bg-[#f4f4f5] text-[#09090b] font-bold text-xs rounded-md transition-colors cursor-pointer"
            onClick={async () => {
              setAuthError('')
              try {
                const res = await window.api.auth.signInWithGoogle()
                if (res.error) throw res.error
                if (res.data?.session) {
                  setSession(res.data.session)
                  setUser(res.data.session.user)
                }
              } catch (err: any) {
                setAuthError(err.message || 'Google sign in failed')
              }
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
          <div className="mt-5 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-[#71717a] hover:text-[#09090b] underline cursor-pointer">
              {isSignUp ? 'Already have an account? Sign In' : 'Create new account'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN APP LAYOUT ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden select-none font-sans">

      {/* Title Bar */}
      <header className="relative h-12 bg-white flex items-center justify-between px-4 z-40 select-none border-b border-[#fafafa]" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <Building2 size={15} className="text-[#09090b]" />
          <span className="font-bold text-[11px] tracking-widest uppercase text-[#09090b]">PAPSoft ERP</span>
          {company && (
            <span className="text-[9px] border border-[#e4e4e7] px-2 py-0.5 rounded-sm bg-[#fafafa] font-bold text-[#71717a] tracking-wider uppercase ml-1">
              {company.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Updater Status UI */}
          {updateStatus === 'available' && (
            <button
              onClick={startDownloadingUpdate}
              className="h-8 px-3 flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw size={10} className="animate-spin" />
              Update Available (v{latestVersion}) — Install Now
            </button>
          )}

          {updateStatus === 'downloading' && (
            <div className="flex items-center gap-2 px-3 h-8 border border-blue-200 bg-blue-50 text-blue-700 rounded-md text-[10px] font-medium min-w-[140px]">
              <span>Downloading: {updateProgress}%</span>
              <div className="w-16 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${updateProgress}%` }} />
              </div>
            </div>
          )}

          {updateStatus === 'ready' && (
            <button
              onClick={restartToInstallUpdate}
              className="h-8 px-3 flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-md transition-colors cursor-pointer animate-pulse"
            >
              <RefreshCw size={10} />
              Update Ready — Restart App
            </button>
          )}

          {appLockPassword && (
            <Button onClick={() => setIsAppLocked(true)} variant="outline" size="sm"
              className="h-8 px-2 flex items-center gap-1 text-[10px] text-[#71717a] border-[#e4e4e7] hover:text-[#09090b]" title="Lock Application Now">
              <Lock size={10} />
              Lock App
            </Button>
          )}
          {company && (
            <Button onClick={triggerSync} variant="outline" size="sm" disabled={isSyncing}
              className="h-8 px-3 flex items-center gap-1.5 text-[10px] mr-1 font-semibold">
              <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync Cloud'}
            </Button>
          )}

          {/* Progress bar at the bottom of the header if downloading */}
          {updateStatus === 'downloading' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-100 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${updateProgress}%` }} />
            </div>
          )}

          {/* Avatar dropdown */}
          <div className="relative mr-2 flex items-center h-full">
            <button onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer select-none transition-all active:scale-95">
              {renderAvatarGraphic('w-8 h-8')}
            </button>
            {showAvatarMenu && (
              <div className="absolute right-0 top-10 w-48 bg-white border border-[#e4e4e7] rounded-md shadow-md py-1.5 z-50">
                <div className="px-4 py-2 border-b border-[#e4e4e7]">
                  <p className="text-[9px] text-[#71717a] font-bold uppercase tracking-wider">Session User</p>
                  <p className="text-xs font-semibold text-[#09090b] truncate mt-0.5">{user?.email}</p>
                </div>
                <button onClick={() => { setActiveSubTab('settings'); setShowAvatarMenu(false) }}
                  className="w-full text-left px-4 py-2 text-xs text-[#09090b] hover:bg-[#f4f4f5] flex items-center gap-2 cursor-pointer font-medium">
                  <SettingsIcon size={12} className="text-[#71717a]" />
                  Settings & Avatar
                </button>
                <button onClick={() => { handleSignOut(); setShowAvatarMenu(false) }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium">
                  <LogOut size={12} />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* WinUI Window Controls */}
          <div className="flex items-center h-full border-l border-[#e4e4e7]">
            <button onClick={() => window.api.window.minimize()}
              className="w-[46px] h-full flex items-center justify-center text-[#09090b] hover:bg-[#f3f3f3] active:bg-[#eaeaea] transition-all duration-150 cursor-pointer">
              <svg width="10" height="1" viewBox="0 0 10 1" className="stroke-current"><line x1="0" y1="0.5" x2="10" y2="0.5" strokeWidth="1.2" /></svg>
            </button>
            <button onClick={() => window.api.window.maximize()}
              className="w-[46px] h-full flex items-center justify-center text-[#09090b] hover:bg-[#f3f3f3] active:bg-[#eaeaea] transition-all duration-150 cursor-pointer">
              <svg width="10" height="10" viewBox="0 0 10 10" className="stroke-current fill-none"><rect x="0.5" y="0.5" width="9" height="9" strokeWidth="1.2" /></svg>
            </button>
            <button onClick={() => window.api.window.close()}
              className="w-[46px] h-full flex items-center justify-center text-[#09090b] hover:bg-[#e81123] hover:text-white active:bg-[#f1707a] transition-all duration-150 cursor-pointer">
              <svg width="10" height="10" viewBox="0 0 10 10" className="stroke-current"><path d="M0 0L10 10M10 0L0 10" strokeWidth="1.2" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden p-3 gap-3 bg-white">

        {/* Sidebar */}
        <aside className="w-56 bg-transparent flex flex-col justify-between p-1 select-none overflow-y-auto shrink-0">
          <div className="space-y-4">
            {/* Dashboard */}
            <button onClick={() => setActiveSubTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 h-9 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer border ${
                activeSubTab === 'dashboard' ? 'bg-[#fafafa] border-[#e4e4e7] text-[#09090b] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-[#52525b] border-transparent hover:bg-[#fafafa]/50 hover:text-[#09090b]'
              }`}>
              <LayoutDashboard size={14} />
              Dashboard
            </button>

            {/* MASTER */}
            <div className="space-y-1">
              <button onClick={() => toggleCategory('master')} className="w-full flex items-center justify-between text-[10px] font-bold text-[#71717a] uppercase tracking-wider px-2 py-1.5 hover:text-[#09090b] transition-colors cursor-pointer">
                <span>Master</span>
                {openCategories.master ? <ChevronDown size={11} className="text-[#a1a1aa]" /> : <ChevronRight size={11} className="text-[#a1a1aa]" />}
              </button>
              {openCategories.master && (
                <div className="space-y-1 pl-3 border-l border-[#f4f4f5] ml-2">
                  {[
                    ['location', <MapPin size={12} />, 'Location'],
                    ['item', <Package size={12} />, 'Item Name'],
                    ['account', <Landmark size={12} />, 'Account Name'],
                    ['salesperson', <Users size={12} />, 'Sales Person'],
                  ].map(([tab, icon, label]) => (
                    <button key={tab as string} onClick={() => setActiveSubTab(tab as SubTab)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-medium rounded-md transition-colors cursor-pointer border ${
                        activeSubTab === tab ? 'bg-[#fafafa] border-[#e4e4e7] text-[#09090b] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-[#52525b] border-transparent hover:bg-[#fafafa]/50 hover:text-[#09090b]'
                      }`}>
                      {icon as React.ReactNode}
                      {label as string}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* STOCK */}
            <div className="space-y-1">
              <button onClick={() => toggleCategory('stock')} className="w-full flex items-center justify-between text-[10px] font-bold text-[#71717a] uppercase tracking-wider px-2 py-1.5 hover:text-[#09090b] transition-colors cursor-pointer">
                <span>Stock</span>
                {openCategories.stock ? <ChevronDown size={11} className="text-[#a1a1aa]" /> : <ChevronRight size={11} className="text-[#a1a1aa]" />}
              </button>
              {openCategories.stock && (
                <div className="space-y-1 pl-3 border-l border-[#f4f4f5] ml-2">
                  {[
                    ['stockinward', <ClipboardList size={12} />, 'Stock Inward'],
                    ['stocktransfer', <ArrowRightLeft size={12} />, 'Stock Transfer'],
                  ].map(([tab, icon, label]) => (
                    <button key={tab as string} onClick={() => setActiveSubTab(tab as SubTab)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-medium rounded-md transition-colors cursor-pointer border ${
                        activeSubTab === tab ? 'bg-[#fafafa] border-[#e4e4e7] text-[#09090b] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-[#52525b] border-transparent hover:bg-[#fafafa]/50 hover:text-[#09090b]'
                      }`}>
                      {icon as React.ReactNode}
                      {label as string}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SALES */}
            <div className="space-y-1">
              <button onClick={() => toggleCategory('sales')} className="w-full flex items-center justify-between text-[10px] font-bold text-[#71717a] uppercase tracking-wider px-2 py-1.5 hover:text-[#09090b] transition-colors cursor-pointer">
                <span>Sales</span>
                {openCategories.sales ? <ChevronDown size={11} className="text-[#a1a1aa]" /> : <ChevronRight size={11} className="text-[#a1a1aa]" />}
              </button>
              {openCategories.sales && (
                <div className="space-y-1 pl-3 border-l border-[#f4f4f5] ml-2">
                  {[
                    ['invoice', <FileText size={12} />, 'Invoice'],
                    ['do', <Truck size={12} />, 'DO Order'],
                    ['addabook', <BookOpen size={12} />, 'Adda Book'],
                  ].map(([tab, icon, label]) => (
                    <button key={tab as string} onClick={() => setActiveSubTab(tab as SubTab)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-medium rounded-md transition-colors cursor-pointer border ${
                        activeSubTab === tab ? 'bg-[#fafafa] border-[#e4e4e7] text-[#09090b] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-[#52525b] border-transparent hover:bg-[#fafafa]/50 hover:text-[#09090b]'
                      }`}>
                      {icon as React.ReactNode}
                      {label as string}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ENTRY */}
            <div className="space-y-1">
              <button onClick={() => toggleCategory('entry')} className="w-full flex items-center justify-between text-[10px] font-bold text-[#71717a] uppercase tracking-wider px-2 py-1.5 hover:text-[#09090b] transition-colors cursor-pointer">
                <span>Entry</span>
                {openCategories.entry ? <ChevronDown size={11} className="text-[#a1a1aa]" /> : <ChevronRight size={11} className="text-[#a1a1aa]" />}
              </button>
              {openCategories.entry && (
                <div className="space-y-1 pl-3 border-l border-[#f4f4f5] ml-2">
                  {[
                    ['receipt', <Wallet size={12} />, 'Receipt'],
                    ['payment', <DollarSign size={12} />, 'Payment'],
                  ].map(([tab, icon, label]) => (
                    <button key={tab as string} onClick={() => setActiveSubTab(tab as SubTab)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-medium rounded-md transition-colors cursor-pointer border ${
                        activeSubTab === tab ? 'bg-[#fafafa] border-[#e4e4e7] text-[#09090b] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-[#52525b] border-transparent hover:bg-[#fafafa]/50 hover:text-[#09090b]'
                      }`}>
                      {icon as React.ReactNode}
                      {label as string}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* REPORT */}
            <div className="space-y-1">
              <button onClick={() => toggleCategory('report')} className="w-full flex items-center justify-between text-[10px] font-bold text-[#71717a] uppercase tracking-wider px-2 py-1.5 hover:text-[#09090b] transition-colors cursor-pointer">
                <span>Report</span>
                {openCategories.report ? <ChevronDown size={11} className="text-[#a1a1aa]" /> : <ChevronRight size={11} className="text-[#a1a1aa]" />}
              </button>
              {openCategories.report && (
                <div className="space-y-1 pl-3 border-l border-[#f4f4f5] ml-2">
                  {[
                    ['inventory', <ListOrdered size={12} />, 'Inventory'],
                    ['aging', <BarChart3 size={12} />, 'Aging'],
                    ['margin', <LineChart size={12} />, 'Gross Margin'],
                  ].map(([tab, icon, label]) => (
                    <button key={tab as string} onClick={() => setActiveSubTab(tab as SubTab)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-medium rounded-md transition-colors cursor-pointer border ${
                        activeSubTab === tab ? 'bg-[#fafafa] border-[#e4e4e7] text-[#09090b] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-[#52525b] border-transparent hover:bg-[#fafafa]/50 hover:text-[#09090b]'
                      }`}>
                      {icon as React.ReactNode}
                      {label as string}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 bg-white border border-[#e4e4e7] rounded-xl flex flex-col overflow-hidden shadow-sm">
          {/* Panel Header */}
          <header className="h-14 border-b border-[#e4e4e7] bg-white flex items-center justify-between px-6 shrink-0">
            <h2 className="font-bold text-[#09090b] text-[11px] uppercase tracking-widest">
              {tabTitle[activeSubTab]}
            </h2>
          </header>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden p-6 bg-white">
            {!company && activeSubTab !== 'settings' ? (
              <div className="max-w-md mx-auto border border-[#e4e4e7] bg-white p-8 rounded-xl text-center mt-12 shadow-sm">
                <Building2 size={32} className="mx-auto text-[#71717a] mb-4" />
                <h3 className="font-bold text-[#09090b] text-sm">No Active Workspace</h3>
                <p className="text-xs text-[#71717a] mt-2 mb-6 leading-relaxed">
                  Please configure an active company profile in settings to initialize the local workspace.
                </p>
                <button onClick={() => setActiveSubTab('settings')}
                  className="h-9 px-5 bg-[#09090b] text-[#fafafa] font-bold text-xs rounded-md hover:bg-[#27272a] transition-all cursor-pointer flex items-center justify-center mx-auto shadow-sm">
                  Configure Settings
                </button>
              </div>
            ) : (
              <>
                {activeSubTab === 'dashboard' && <Dashboard products={products} contacts={contacts} locations={locations} company={company} syncResult={syncResult} />}
                {activeSubTab === 'location' && <LocationMaster locations={locations} setLocations={setLocations} />}
                {activeSubTab === 'item' && <ItemMaster company={company} products={products} setProducts={setProducts} />}
                {activeSubTab === 'account' && <AccountMaster company={company} contacts={contacts} setContacts={setContacts} activeSalesPersons={activeSalesPersons} />}
                {activeSubTab === 'salesperson' && <SalesPersonMaster salesPersons={salesPersons} setSalesPersons={setSalesPersons} />}
                {activeSubTab === 'stockinward' && <StockInward activeLocations={activeLocations} products={products} />}
                {activeSubTab === 'stocktransfer' && <StockTransfer activeLocations={activeLocations} products={products} />}
                {activeSubTab === 'invoice' && <Invoice contacts={contacts} />}
                {activeSubTab === 'do' && <DoOrder contacts={contacts} />}
                {activeSubTab === 'addabook' && <AddaBook />}
                {activeSubTab === 'receipt' && <Receipt contacts={contacts} />}
                {activeSubTab === 'payment' && <Payment contacts={contacts} />}
                {activeSubTab === 'inventory' && <InventoryReport />}
                {activeSubTab === 'aging' && <AgingReport />}
                {activeSubTab === 'margin' && <GrossMarginReport />}
                {activeSubTab === 'settings' && (
                  <Settings
                    user={user}
                    company={company}
                    appLockPassword={appLockPassword}
                    setAppLockPassword={setAppLockPassword}
                    selectedAvatar={selectedAvatar}
                    setSelectedAvatar={setSelectedAvatar}
                    handleCreateCompany={handleCreateCompany}
                    newCompanyName={newCompanyName}
                    setNewCompanyName={setNewCompanyName}
                    renderAvatarGraphic={renderAvatarGraphic}
                  />
                )}
              </>
            )}
          </div>
        </main>

      </div>
    </div>
  )
}

export default App
