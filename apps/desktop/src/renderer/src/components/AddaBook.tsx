import React, { useState } from 'react'

interface BookingRecord { id: number; vehicle: string; transporter: string; destination: string; status: string }

export function AddaBook() {
  const [records, setRecords] = useState<BookingRecord[]>([
    { id: 1, vehicle: 'MH-12-PQ-9876', transporter: 'National Logistics', destination: 'Mumbai Hub', status: 'Booked' }
  ])
  const [vehicle, setVehicle] = useState('')
  const [transporter, setTransporter] = useState('')
  const [destination, setDestination] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicle || !transporter || !destination) return
    setRecords(prev => [...prev, { id: Date.now(), vehicle, transporter, destination, status: 'Booked' }])
    setVehicle('')
    setTransporter('')
    setDestination('')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 pb-4 border-b border-[#e4e4e7]">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Truck Number</label>
          <input type="text" required placeholder="e.g. MH-12-PQ-9876" value={vehicle} onChange={e => setVehicle(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Transporter</label>
          <input type="text" required placeholder="e.g. National Logistics" value={transporter} onChange={e => setTransporter(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Destination Hub</label>
          <input type="text" required placeholder="e.g. Mumbai Warehouse" value={destination} onChange={e => setDestination(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]" />
        </div>
        <button type="submit" className="h-9 px-5 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer shadow-sm shrink-0">Book Dispatch</button>
      </form>
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3">Vehicle Details</th><th className="p-3">Transporter</th>
              <th className="p-3">Destination</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-[#fafafa]">
                <td className="p-3 font-semibold">{r.vehicle}</td>
                <td className="p-3 text-[#09090b]">{r.transporter}</td>
                <td className="p-3 text-[#71717a]">{r.destination}</td>
                <td className="p-3 text-blue-600 font-semibold">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
