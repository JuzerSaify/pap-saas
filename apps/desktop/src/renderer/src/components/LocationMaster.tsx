import React, { useState } from 'react'
import { Pencil, Search } from 'lucide-react'
import { LocationRecord } from './types'

const formatPhone = (val: string) => {
  if (!val || val === '-') return '-'
  const clean = val.replace(/\s+/g, '').replace(/-/g, '')
  if (clean.startsWith('+92') && clean.length === 13) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`
  }
  if (clean.startsWith('92') && clean.length === 12) {
    return `+92 ${clean.slice(2, 5)} ${clean.slice(5)}`
  }
  if (clean.startsWith('03') && clean.length === 11) {
    return `+92 ${clean.slice(1, 4)} ${clean.slice(4)}`
  }
  if (clean.length === 10 && clean.startsWith('3')) {
    return `+92 ${clean.slice(0, 3)} ${clean.slice(3)}`
  }
  return val
}

interface Props {
  locations: LocationRecord[]
  setLocations: React.Dispatch<React.SetStateAction<LocationRecord[]>>
}

export function LocationMaster({ locations, setLocations }: Props) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const recordData = {
      name: name.trim(),
      city: city.trim() || '-',
      phone: phone.trim() || '-',
      status: 'Active'
    }

    try {
      if (editId !== null) {
        const updatedRecord = await window.api.db.update('locations', String(editId), recordData)
        setLocations(prev => prev.map(loc => String(loc.id) === String(editId) ? { ...loc, ...updatedRecord } : loc))
        setEditId(null)
      } else {
        const insertedRecord = await window.api.db.insert('locations', recordData)
        setLocations(prev => [...prev, insertedRecord])
      }
    } catch (err) {
      console.error('Failed to save location:', err)
      alert('Failed to save location to database.')
    }
    setName('')
    setCity('')
    setPhone('')
  }

  const startEdit = (loc: any) => {
    setEditId(loc.id)
    setName(loc.name)
    setCity(loc.city === '-' ? '' : loc.city)
    setPhone(loc.phone === '-' ? '' : loc.phone)
  }

  const cancelEdit = () => {
    setEditId(null)
    setName('')
    setCity('')
    setPhone('')
  }

  const toggleStatus = async (id: any) => {
    try {
      const loc = locations.find(l => String(l.id) === String(id))
      if (!loc) return
      const nextStatus = loc.status === 'Postponed' ? 'Active' : 'Postponed'
      const updatedRecord = await window.api.db.update('locations', String(id), { status: nextStatus })
      setLocations(prev => prev.map(l => String(l.id) === String(id) ? { ...l, ...updatedRecord } : l))
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3 pb-4 border-b border-[#e4e4e7]">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Location Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Warehouse 3"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">City</label>
          <input
            type="text"
            placeholder="e.g. Lahore"
            value={city}
            onChange={e => setCity(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Phone Number</label>
          <input
            type="text"
            placeholder="e.g. +92 300 1234567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
          />
        </div>
        <div className="flex gap-2">
          {editId !== null ? (
            <>
              <button type="submit" className="h-9 px-5 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer shadow-sm shrink-0 animate-pulse">
                Save Changes
              </button>
              <button type="button" onClick={cancelEdit} className="h-9 px-4 bg-white text-[#71717a] border border-[#e4e4e7] font-semibold text-xs rounded-md hover:bg-[#f4f4f5] transition-all cursor-pointer">
                Cancel
              </button>
            </>
          ) : (
            <button type="submit" className="h-9 px-5 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer shadow-sm shrink-0">
              Create Location
            </button>
          )}
        </div>
      </form>

      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3 w-64 min-w-[200px]">
                {isSearching ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      placeholder="Search Location..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full max-w-[180px] h-7 px-2 border border-[#e4e4e7] rounded text-xs focus:outline-none focus:border-[#09090b] bg-white font-sans font-medium"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                    <button onClick={(e) => { e.stopPropagation(); setIsSearching(false); setSearchQuery(''); }} className="text-[#71717a] hover:text-[#09090b] cursor-pointer text-xs">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[#09090b] transition-colors" onClick={() => setIsSearching(true)}>
                    <span>Location Name</span>
                    <Search size={12} className="text-[#71717a]" />
                  </div>
                )}
              </th>
              <th className="p-3">City</th>
              <th className="p-3">Phone Number</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {locations.length === 0 ? (
              <tr><td colSpan={5} className="p-3 text-center text-[#71717a] py-6 font-medium">No locations configured</td></tr>
            ) : filteredLocations.length === 0 ? (
              <tr><td colSpan={5} className="p-3 text-center text-[#71717a] py-6 font-medium">No matching locations found</td></tr>
            ) : filteredLocations.map(loc => (
              <tr key={loc.id} className="hover:bg-[#fafafa]">
                <td className="p-3 font-semibold">{loc.name}</td>
                <td className="p-3 text-[#71717a] font-medium">{loc.city}</td>
                <td className="p-3 text-[#71717a]">{formatPhone(loc.phone)}</td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => toggleStatus(loc.id)}
                    className={`px-2 py-0.5 rounded font-semibold text-[10px] border cursor-pointer select-none transition-all active:scale-95 ${
                      loc.status !== 'Postponed'
                        ? 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'
                        : 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {loc.status || 'Active'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => startEdit(loc)}
                    className="p-1.5 text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Pencil size={11} />
                    <span className="text-[10px]">Edit</span>
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
