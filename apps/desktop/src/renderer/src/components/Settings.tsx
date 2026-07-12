import React, { useState } from 'react'
import { Lock } from 'lucide-react'
import { AppUser } from './UserMaster'

interface Props {
  user: any
  company: any
  currentAppUser: AppUser | null
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>
  selectedAvatar: string
  setSelectedAvatar: (v: string) => void
  handleCreateCompany: (e: React.FormEvent) => void
  newCompanyName: string
  setNewCompanyName: (v: string) => void
  renderAvatarGraphic: (cls?: string) => React.ReactNode
}

export function Settings({
  user, company, currentAppUser, setUsers,
  selectedAvatar, setSelectedAvatar,
  handleCreateCompany, newCompanyName, setNewCompanyName,
  renderAvatarGraphic
}: Props) {
  const [customAvatarInput, setCustomAvatarInput] = useState(() => {
    const saved = localStorage.getItem('papsoft_user_avatar') || ''
    return saved === 'google-icon' ? '' : saved
  })
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  const handleSaveAvatar = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = customAvatarInput.trim()
    if (trimmed === '') {
      setSelectedAvatar('google-icon')
      localStorage.setItem('papsoft_user_avatar', 'google-icon')
    } else {
      setSelectedAvatar(trimmed)
      localStorage.setItem('papsoft_user_avatar', trimmed)
    }
    alert('Avatar profile configured successfully.')
  }

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentAppUser) return

    if (currentPin !== currentAppUser.pin) {
      alert('Current PIN is incorrect.')
      return
    }

    if (newPin !== confirmPin) {
      alert('New PIN and Confirm PIN do not match.')
      return
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      alert('PIN must be exactly 4 numeric digits.')
      return
    }

    setUsers(prev => prev.map(u => {
      if (u.id === currentAppUser.id) {
        const updated = { ...u, pin: newPin }
        localStorage.setItem('pap_current_app_user', JSON.stringify(updated))
        return updated
      }
      return u
    }))

    alert('Your login PIN has been changed successfully.')
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-8 max-w-xl pr-2 select-none font-sans text-xs text-[#09090b]">

      {/* Profile Section */}
      <div className="space-y-4 pb-6 border-b border-[#f4f4f5]">
        <div className="flex items-center gap-4">
          {renderAvatarGraphic('w-14 h-14')}
          <div>
            <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">Cloud Master Account</span>
            <h3 className="font-extrabold text-[#09090b] text-sm mt-0.5">{user?.email}</h3>
          </div>
        </div>

        <form onSubmit={handleSaveAvatar} className="space-y-3 pt-2">
          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Profile Avatar Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste a custom photo or avatar URL here..."
                value={customAvatarInput}
                onChange={e => setCustomAvatarInput(e.target.value)}
                className="flex-1 h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
              <button type="submit" className="h-9 px-4 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] cursor-pointer">
                Save Avatar
              </button>
            </div>
            <span className="text-[9px] text-[#a1a1aa] mt-1 block">Leave empty to use Google user profile vector icon fallback.</span>
          </div>
        </form>
      </div>

      {/* Security Section (PIN Self-Management) */}
      {currentAppUser && (
        <div className="space-y-4 pb-6 border-b border-[#f4f4f5]">
          <div>
            <h4 className="font-extrabold text-[#09090b] text-[11px] uppercase tracking-wider flex items-center gap-1.5 font-sifonn">
              <Lock size={12} />
              Change Login PIN
            </h4>
            <p className="text-[10px] text-[#71717a] mt-1 leading-relaxed">
              Update your personal 4-digit PIN for logging into this client terminal.
            </p>
          </div>

          <form onSubmit={handleSavePin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Current PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa] font-mono text-center font-bold tracking-widest"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">New PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa] font-mono text-center font-bold tracking-widest"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Confirm New PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa] font-mono text-center font-bold tracking-widest"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                Staff profile: {currentAppUser.name} ({currentAppUser.role})
              </span>
              <button type="submit" className="h-9 px-5 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] cursor-pointer shadow-sm font-sifonn uppercase tracking-wider">
                Update PIN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workspace Section */}
      <div className="space-y-3 pb-6">
        <h4 className="font-extrabold text-[#09090b] text-[11px] uppercase tracking-wider">Active Workspace Settings</h4>
        {company ? (
          <div className="space-y-1">
            <div className="text-xs font-bold text-[#09090b]">{company.name}</div>
            <span className="text-[10px] text-[#a1a1aa] block">Domain: Paper & Board Manufacturing Wholesale ERP</span>
          </div>
        ) : (
          <form onSubmit={handleCreateCompany} className="space-y-3">
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Workspace Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Paper Mills"
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
            <button type="submit" className="w-full h-9 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] cursor-pointer">
              Create Active Workspace
            </button>
          </form>
        )}
      </div>

    </div>
  )
}
