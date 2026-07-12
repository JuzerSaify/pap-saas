import React, { useState, useEffect } from 'react'
import { Lock, User, ShieldAlert } from 'lucide-react'
import { AppUser } from './UserMaster'

interface Props {
  users: AppUser[]
  onLoginSuccess: (user: AppUser) => void
}

export function UserLogin({ users, onLoginSuccess }: Props) {
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const activeUsers = users.filter(u => u.isActive)

  // Listen to physical keyboard events
  useEffect(() => {
    if (!selectedUser) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key)
      } else if (e.key === 'Backspace') {
        handleDelete()
      } else if (e.key === 'Escape') {
        setSelectedUser(null)
        setPin('')
        setErrorMsg('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedUser, pin])

  const handleKeyPress = (num: string) => {
    setErrorMsg('')
    if (pin.length < 4) {
      const newPin = pin + num
      setPin(newPin)

      // Automatic submit on 4 digits
      if (newPin.length === 4) {
        if (selectedUser && selectedUser.pin === newPin) {
          onLoginSuccess(selectedUser)
        } else {
          setErrorMsg('Invalid PIN. Please try again.')
          setPin('')
        }
      }
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    setPin('')
    setErrorMsg('')
  }

  return (
    <div className="fixed inset-0 bg-[#fafafa] flex items-center justify-center z-50 select-none font-sans text-[#09090b]">
      <div className="w-full max-w-sm p-8 bg-white border border-[#e4e4e7] rounded-2xl shadow-sm flex flex-col items-center">
        
        {/* APP ICON & TITLE */}
        <div className="flex items-center gap-2 mb-6">
          <img src="/favicon.png" alt="Logo" className="w-5 h-5" />
          <span className="font-extrabold text-[12px] tracking-widest uppercase font-sifonn">PAPSoft ERP</span>
        </div>

        {!selectedUser ? (
          // STEP 1: SELECT PROFILE
          <div className="w-full flex flex-col items-center space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#71717a] font-sifonn">Select User Profile</h3>
            
            <div className="w-full max-h-[220px] overflow-auto space-y-2 pr-1 no-scrollbar">
              {activeUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="w-full h-12 border border-[#e4e4e7] hover:border-black rounded-lg px-4 flex items-center justify-between cursor-pointer transition-all hover:bg-neutral-50 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                      <User size={14} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs text-neutral-800 leading-tight">{u.name}</div>
                      <div className="text-[9px] font-mono text-neutral-400">@{u.username}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider font-sifonn ${
                    u.role === 'Admin' ? 'bg-red-50 border-red-200 text-red-700' :
                    u.role === 'Manager' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                    u.role === 'Sale Person' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                    'bg-green-50 border-green-200 text-green-700'
                  }`}>
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
            
            <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
              Log in to access your authorized system dashboards.
            </p>
          </div>
        ) : (
          // STEP 2: ENTER PIN
          <div className="w-full flex flex-col items-center">
            
            {/* Back button */}
            <button
              onClick={() => { setSelectedUser(null); setPin(''); setErrorMsg('') }}
              className="text-[9px] font-bold text-neutral-400 hover:text-black uppercase tracking-wider mb-4 transition-colors cursor-pointer self-start"
            >
              ← Back to Users
            </button>

            {/* Selected user preview */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 mb-2">
                <User size={18} />
              </div>
              <h4 className="font-bold text-xs text-neutral-800 leading-none">{selectedUser.name}</h4>
              <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 mt-1.5 font-sifonn">
                {selectedUser.role} Account
              </span>
            </div>

            {/* PIN Dots indicators */}
            <div className="flex items-center gap-3.5 mb-3">
              {[0, 1, 2, 3].map(idx => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border border-neutral-300 transition-all duration-100 ${
                    idx < pin.length ? 'bg-black border-black scale-110' : 'bg-transparent'
                  }`}
                />
              ))}
            </div>

            {/* Error message */}
            <div className="h-4 flex items-center justify-center mb-4">
              {errorMsg && (
                <span className="text-[9px] font-bold text-red-600 flex items-center gap-1">
                  <ShieldAlert size={12} />
                  {errorMsg}
                </span>
              )}
            </div>

            {/* Simple Numeric PIN Pad */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="h-12 border border-[#e4e4e7] rounded-lg font-mono font-bold text-sm bg-white hover:border-black active:bg-neutral-50 transition-all cursor-pointer flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-lg font-bold text-[9px] uppercase tracking-wider bg-neutral-50 hover:bg-neutral-100 text-neutral-500 cursor-pointer flex items-center justify-center"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-12 border border-[#e4e4e7] rounded-lg font-mono font-bold text-sm bg-white hover:border-black active:bg-neutral-50 transition-all cursor-pointer flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="h-12 rounded-lg font-bold text-[9px] uppercase tracking-wider bg-neutral-50 hover:bg-neutral-100 text-neutral-500 cursor-pointer flex items-center justify-center"
              >
                Del
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
