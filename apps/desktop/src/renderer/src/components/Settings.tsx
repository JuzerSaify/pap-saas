import React, { useState } from 'react'
import { Lock } from 'lucide-react'

interface Props {
  user: any
  company: any
  appLockPassword: string
  setAppLockPassword: (v: string) => void
  selectedAvatar: string
  setSelectedAvatar: (v: string) => void
  handleCreateCompany: (e: React.FormEvent) => void
  newCompanyName: string
  setNewCompanyName: (v: string) => void
  renderAvatarGraphic: (cls?: string) => React.ReactNode
}

export function Settings({
  user, company, appLockPassword, setAppLockPassword,
  selectedAvatar, setSelectedAvatar,
  handleCreateCompany, newCompanyName, setNewCompanyName,
  renderAvatarGraphic
}: Props) {
  const [customAvatarInput, setCustomAvatarInput] = useState(() => {
    const saved = localStorage.getItem('papsoft_user_avatar') || ''
    return saved === 'google-icon' ? '' : saved
  })
  const [newLockPassword, setNewLockPassword] = useState('')
  const [confirmLockPassword, setConfirmLockPassword] = useState('')

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

  const saveSoftwarePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (newLockPassword !== confirmLockPassword) {
      alert('Passwords do not match!')
      return
    }
    if (newLockPassword.trim() === '') {
      localStorage.removeItem('papsoft_app_lock_password')
      setAppLockPassword('')
      alert('Local software lock password removed successfully.')
    } else {
      localStorage.setItem('papsoft_app_lock_password', newLockPassword)
      setAppLockPassword(newLockPassword)
      alert('Local software lock password configured successfully.')
    }
    setNewLockPassword('')
    setConfirmLockPassword('')
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-8 max-w-xl pr-2 select-none">

      {/* Profile Section */}
      <div className="space-y-4 pb-6 border-b border-[#f4f4f5]">
        <div className="flex items-center gap-4">
          {renderAvatarGraphic('w-14 h-14')}
          <div>
            <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">Session Active User</span>
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

      {/* Security Section */}
      <div className="space-y-4 pb-6 border-b border-[#f4f4f5]">
        <div>
          <h4 className="font-extrabold text-[#09090b] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Lock size={12} />
            Local Access Security
          </h4>
          <p className="text-[10px] text-[#71717a] mt-1 leading-relaxed">
            Secure this workstation installation. Once set, launching PAPSoft will require entering this local password.
          </p>
        </div>

        <form onSubmit={saveSoftwarePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                placeholder="Leave blank to disable"
                value={newLockPassword}
                onChange={e => setNewLockPassword(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmLockPassword}
                onChange={e => setConfirmLockPassword(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#71717a]">
              Workstation lock: {appLockPassword ? '🔴 Locked (Active)' : '🟢 Unlocked'}
            </span>
            <button type="submit" className="h-9 px-5 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] cursor-pointer shadow-sm">
              Update Lock Password
            </button>
          </div>
        </form>
      </div>

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
