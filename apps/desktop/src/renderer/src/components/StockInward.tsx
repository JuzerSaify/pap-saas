import React, { useState, useEffect } from 'react'
import { LocationRecord } from './types'

interface StockInwardRecord {
  id: number
  item: string
  qty: string
  location: string
  date: string
}

interface Props {
  activeLocations: LocationRecord[]
  products: any[]
}

export function StockInward({ activeLocations, products }: Props) {
  const [records, setRecords] = useState<StockInwardRecord[]>([
    { id: 1, item: 'Kraft Board 180GSM', qty: '12.4 MT', location: 'Main Godown A', date: '2026-07-09' }
  ])

  const [item, setItem] = useState('')
  const [qty, setQty] = useState('')
  const [location, setLocation] = useState(activeLocations[0]?.name || '')

  // Sync default location when activeLocations changes
  useEffect(() => {
    if (activeLocations.length > 0 && !activeLocations.some(l => l.name === location)) {
      setLocation(activeLocations[0].name)
    }
  }, [activeLocations])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !qty) return
    setRecords(prev => [...prev, {
      id: Date.now(),
      item,
      qty: qty + ' MT',
      location,
      date: new Date().toISOString().split('T')[0]
    }])
    setItem('')
    setQty('')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 pb-4 border-b border-[#e4e4e7]">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Item / Paper Grade</label>
          <select
            value={item}
            onChange={e => setItem(e.target.value)}
            required
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
          >
            <option value="">— Select Item —</option>
            {products.filter(p => p.isActive !== false).map(p => (
              <option key={p.id} value={p.name}>{p.name} ({p.sku})</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Quantity (MT)</label>
          <input
            type="number"
            required
            step="any"
            min="0"
            placeholder="e.g. 12.4"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Destination Godown</label>
          <select
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
          >
            {activeLocations.map(loc => (
              <option key={loc.id} value={loc.name}>{loc.name} — {loc.city}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-9 px-5 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer shadow-sm shrink-0"
        >
          Record Stock In
        </button>
      </form>

      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3">Paper Item</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Received At</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {records.length === 0 ? (
              <tr><td colSpan={4} className="p-3 text-center text-[#71717a] py-6 font-medium">No inward stock entries</td></tr>
            ) : records.map(r => (
              <tr key={r.id} className="hover:bg-[#fafafa]">
                <td className="p-3 font-semibold">{r.item}</td>
                <td className="p-3 font-medium">{r.qty}</td>
                <td className="p-3 text-[#71717a]">{r.location}</td>
                <td className="p-3 text-[#71717a]">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
