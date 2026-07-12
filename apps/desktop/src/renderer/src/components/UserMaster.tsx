import React, { useState } from 'react'
import { Plus, Trash2, Key } from 'lucide-react'

export interface AppUser {
  id: string
  name: string
  username: string
  pin: string
  role: 'Admin' | 'Manager' | 'Sale Person' | 'Accountant'
  isActive: boolean
}

interface Props {
  users: AppUser[]
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>
  currentUser: AppUser | null
}

export function UserMaster({ users, setUsers, currentUser }: Props) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [role, setRole] = useState<'Admin' | 'Manager' | 'Sale Person' | 'Accountant'>('Sale Person')
  const [isActive, setIsActive] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !username.trim() || !pin.trim()) {
      alert('Please fill in all fields.')
      return
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      alert('PIN must be exactly 4 digits.')
      return
    }

    // Check unique username
    if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      alert('Username already exists. Please choose a unique username.')
      return
    }

    const newUser: AppUser = {
      id: Date.now().toString(),
      name: name.trim(),
      username: username.trim().toLowerCase(),
      pin,
      role,
      isActive
    }

    setUsers(prev => [...prev, newUser])
    setName('')
    setUsername('')
    setPin('')
    setRole('Sale Person')
    setIsActive(true)
  }

  const handleDelete = (id: string) => {
    if (id === 'default-admin') {
      alert('Cannot delete the default system administrator.')
      return
    }
    if (currentUser && currentUser.id === id) {
      alert('Cannot delete the currently logged in user.')
      return
    }
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(u => u.id !== id))
    }
  }

  return (
    <div className="flex-grow flex flex-col space-y-4 font-sans text-xs text-[#09090b]">
      
      {/* HEADER CONTROL BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-[#09090b] font-sifonn">User Registry</h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[9px] font-bold text-neutral-500 font-mono uppercase">
            Access Level: Admin Only
          </span>
        </div>
      </div>

      {/* NEW USER FORM */}
      <form onSubmit={handleSubmit} className="p-4 border border-[#e4e4e7] rounded-xl bg-[#fafafa] space-y-3 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          
          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Asif Raza"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Username</label>
            <input
              type="text"
              required
              placeholder="e.g. asif.sales"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">4-Digit Login PIN</label>
            <input
              type="text"
              required
              maxLength={4}
              placeholder="e.g. 5678"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/[^\d]/g, ''))}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white font-mono font-bold tracking-widest text-center"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">System Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white font-semibold"
            >
              <option value="Admin">Admin (Full Access)</option>
              <option value="Manager">Manager (Operations & Master)</option>
              <option value="Sale Person">Sale Person (Logistics & Invoices)</option>
              <option value="Accountant">Accountant (Entry & Ledgers)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-grow">
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Status</label>
              <select
                value={isActive ? 'Active' : 'Inactive'}
                onChange={e => setIsActive(e.target.value === 'Active')}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button
              type="submit"
              className="h-9 px-4 bg-black text-white hover:bg-neutral-800 transition-all font-bold text-xs rounded-md cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider font-sifonn shadow-xs shrink-0 self-end"
            >
              <Plus size={14} />
              <span>Create</span>
            </button>
          </div>

        </div>
      </form>

      {/* USER LIST REGISTRY */}
      <div className="flex-grow overflow-auto border border-[#e4e4e7] rounded-xl bg-white min-h-[220px]">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
            <tr>
              <th className="p-3">Full Name</th>
              <th className="p-3">Username</th>
              <th className="p-3">System Role</th>
              <th className="p-3 text-center">Login PIN</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-neutral-50 font-medium">
                <td className="p-3 font-bold text-neutral-800">{u.name}</td>
                <td className="p-3 font-mono text-neutral-500">{u.username}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider font-sifonn ${
                    u.role === 'Admin' ? 'bg-red-50 border-red-200 text-red-700' :
                    u.role === 'Manager' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                    u.role === 'Sale Person' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                    'bg-green-50 border-green-200 text-green-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-center font-mono font-bold tracking-widest text-neutral-600">
                  ••••
                </td>
                <td className="p-3 text-center">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    u.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id)}
                    disabled={u.id === 'default-admin' || (currentUser && currentUser.id === u.id)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors disabled:opacity-30 cursor-pointer"
                    title="Delete User"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
