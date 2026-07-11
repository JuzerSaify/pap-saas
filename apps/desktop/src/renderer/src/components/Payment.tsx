import React, { useState } from 'react'

interface PaymentRecord { id: number; party: string; amount: string; mode: string; date: string }
interface Props { contacts: any[] }

export function Payment({ contacts }: Props) {
  const [records, setRecords] = useState<PaymentRecord[]>([
    { id: 1, party: 'Standard Pulp Supplier', amount: '1,200.00', mode: 'Cheque', date: '2026-07-09' }
  ])
  const [party, setParty] = useState('')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('Cheque')

  const activeContacts = contacts.filter(c => c.isActive !== false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!party || !amount) return
    setRecords(prev => [...prev, {
      id: Date.now(), party,
      amount: parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      mode, date: new Date().toISOString().split('T')[0]
    }])
    setParty('')
    setAmount('')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 pb-4 border-b border-[#e4e4e7]">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Paid To</label>
          <select value={party} onChange={e => setParty(e.target.value)} required
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]">
            <option value="">— Select Account —</option>
            {activeContacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Amount Paid</label>
          <input type="number" required placeholder="e.g. 1000" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Payment Method</label>
          <select value={mode} onChange={e => setMode(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]">
            <option value="Cheque">Cheque Payment (HDFC A/c)</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash Ledger</option>
          </select>
        </div>
        <button type="submit" className="h-9 px-5 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer shadow-sm shrink-0">Post Payment</button>
      </form>
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3">Paid To</th><th className="p-3">Amount Paid</th>
              <th className="p-3">Payment Mode</th><th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-[#fafafa]">
                <td className="p-3 font-semibold">{r.party}</td>
                <td className="p-3 font-semibold text-red-600">{r.amount}</td>
                <td className="p-3 text-[#71717a]">{r.mode}</td>
                <td className="p-3 text-[#71717a]">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
