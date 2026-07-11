import React, { useState } from 'react'

interface DORecord { id: number; client: string; vehicle: string; status: string; date: string }
interface Props { contacts: any[] }

export function DoOrder({ contacts }: Props) {
  const [records, setRecords] = useState<DORecord[]>([
    { id: 1, client: 'Anil Board Mills', vehicle: 'MH-12-PQ-9876', status: 'Dispatched', date: '2026-07-09' }
  ])
  const [client, setClient] = useState('')
  const [vehicle, setVehicle] = useState('')

  const activeContacts = contacts.filter(c => c.isActive !== false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!client || !vehicle) return
    setRecords(prev => [...prev, { id: Date.now(), client, vehicle, status: 'Dispatched', date: new Date().toISOString().split('T')[0] }])
    setClient('')
    setVehicle('')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 pb-4 border-b border-[#e4e4e7]">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Customer / Buyer</label>
          <select value={client} onChange={e => setClient(e.target.value)} required
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]">
            <option value="">— Select Account —</option>
            {activeContacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Truck Number</label>
          <input type="text" required placeholder="e.g. MH-12-PQ-9876" value={vehicle} onChange={e => setVehicle(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]" />
        </div>
        <button type="submit" className="h-9 px-5 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer shadow-sm shrink-0">Issue DO</button>
      </form>
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3">Buyer Account</th><th className="p-3">Vehicle Details</th>
              <th className="p-3">DO Date</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-[#fafafa]">
                <td className="p-3 font-semibold">{r.client}</td>
                <td className="p-3 text-[#09090b] font-medium">{r.vehicle}</td>
                <td className="p-3 text-[#71717a]">{r.date}</td>
                <td className="p-3 text-green-600 font-semibold">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
