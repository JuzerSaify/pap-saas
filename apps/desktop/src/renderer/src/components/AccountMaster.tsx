import React, { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { HEAD_CLASSIFICATIONS, SalesPersonRecord } from './types'

interface Props {
  company: any
  contacts: any[]
  setContacts: React.Dispatch<React.SetStateAction<any[]>>
  activeSalesPersons: SalesPersonRecord[]
}

export function AccountMaster({ company, contacts, setContacts, activeSalesPersons }: Props) {
  const [contactName, setContactName] = useState('')
  const [contactHead, setContactHead] = useState('assets')
  const [contactType, setContactType] = useState('Sundry Debtors (Customer)')
  const [salesPerson, setSalesPerson] = useState('')
  const [openingBal, setOpeningBal] = useState('')
  const [balanceType, setBalanceType] = useState<'Dr' | 'Cr'>('Dr')
  const [editId, setEditId] = useState<string | null>(null)

  // Auto-update classification when head changes
  useEffect(() => {
    const defaultType = HEAD_CLASSIFICATIONS[contactHead]?.[0] || ''
    setContactType(defaultType)
  }, [contactHead])

  // Sync salesPerson default
  useEffect(() => {
    if (!salesPerson && activeSalesPersons.length > 0) {
      setSalesPerson(activeSalesPersons[0].name)
    }
  }, [activeSalesPersons])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    try {
      const notesJson = JSON.stringify({
        salesPerson: salesPerson || activeSalesPersons[0]?.name || '',
        balanceType
      })

      if (editId) {
        const updated = await window.api.db.update('contacts', editId, {
          name: contactName,
          type: contactType,
          openingBalance: parseFloat(openingBal) || 0,
          notes: notesJson
        })
        setContacts(prev => prev.map(c => c.id === editId ? { ...c, ...updated, name: contactName, type: contactType, openingBalance: parseFloat(openingBal) || 0, notes: notesJson } : c))
        setEditId(null)
      } else {
        const res = await window.api.db.insert('contacts', {
          companyId: company.id,
          name: contactName,
          type: contactType,
          creditLimit: 0,
          creditDays: 0,
          openingBalance: parseFloat(openingBal) || 0,
          notes: notesJson
        })
        setContacts(prev => [...prev, res])
      }

      setContactName('')
      setSalesPerson(activeSalesPersons[0]?.name || '')
      setOpeningBal('')
      setBalanceType('Dr')
    } catch (e) {
      console.error(e)
    }
  }

  const startEdit = (c: any) => {
    setEditId(c.id)
    setContactName(c.name)

    let parsedHead = 'assets'
    for (const [head, classifications] of Object.entries(HEAD_CLASSIFICATIONS)) {
      if (classifications.includes(c.type)) {
        parsedHead = head
        break
      }
    }
    setContactHead(parsedHead)
    setContactType(c.type)
    setOpeningBal(c.openingBalance ? String(c.openingBalance) : '')

    try {
      if (c.notes) {
        const parsed = JSON.parse(c.notes)
        setSalesPerson(parsed.salesPerson || activeSalesPersons[0]?.name || '')
        setBalanceType(parsed.balanceType || 'Dr')
      }
    } catch {
      setSalesPerson(activeSalesPersons[0]?.name || '')
      setBalanceType('Dr')
    }
  }

  const cancelEdit = () => {
    setEditId(null)
    setContactName('')
    setSalesPerson(activeSalesPersons[0]?.name || '')
    setOpeningBal('')
    setBalanceType('Dr')
  }

  const toggleStatus = async (id: string, currentActive: boolean) => {
    try {
      const nextActive = !currentActive
      const updated = await window.api.db.update('contacts', id, { isActive: nextActive })
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updated, isActive: nextActive } : c))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3 pb-4 border-b border-[#e4e4e7]">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Account Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Anil Board Mills"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Account Head</label>
          <select
            value={contactHead}
            onChange={e => setContactHead(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
          >
            <option value="assets">Assets</option>
            <option value="liabilities">Liabilities</option>
            <option value="equity">Equity</option>
            <option value="revenue">Revenue</option>
            <option value="expenses">Expenses</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Classification Type</label>
          <select
            value={contactType}
            onChange={e => setContactType(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
          >
            {(HEAD_CLASSIFICATIONS[contactHead] || []).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Sales Person</label>
          <select
            value={salesPerson}
            onChange={e => setSalesPerson(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
          >
            {activeSalesPersons.map(sp => (
              <option key={sp.id} value={sp.name}>{sp.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Opening Bal</label>
          <input
            type="number"
            placeholder="0"
            value={openingBal}
            onChange={e => setOpeningBal(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
          />
        </div>
        <div className="flex flex-col min-w-[80px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Dr/Cr</label>
          <div className="flex h-9 border border-[#e4e4e7] rounded-md overflow-hidden bg-[#fafafa]">
            <button
              type="button"
              onClick={() => setBalanceType('Dr')}
              className={`flex-1 text-[10px] font-bold transition-colors cursor-pointer ${balanceType === 'Dr' ? 'bg-[#09090b] text-white' : 'text-[#71717a] hover:bg-[#f4f4f5]'}`}
            >Dr</button>
            <button
              type="button"
              onClick={() => setBalanceType('Cr')}
              className={`flex-1 text-[10px] font-bold transition-colors cursor-pointer ${balanceType === 'Cr' ? 'bg-[#09090b] text-white' : 'text-[#71717a] hover:bg-[#f4f4f5]'}`}
            >Cr</button>
          </div>
        </div>
        <div className="flex gap-2">
          {editId ? (
            <>
              <button type="submit" className="h-9 px-5 bg-[#09090b] text-[#fafafa] font-bold text-xs rounded-md hover:bg-[#27272a] transition-all cursor-pointer shadow-sm shrink-0 animate-pulse">
                Save Changes
              </button>
              <button type="button" onClick={cancelEdit} className="h-9 px-4 bg-white text-[#71717a] border border-[#e4e4e7] font-semibold text-xs rounded-md hover:bg-[#f4f4f5] transition-all cursor-pointer">
                Cancel
              </button>
            </>
          ) : (
            <button type="submit" className="h-9 px-5 bg-[#09090b] text-[#fafafa] font-bold text-xs rounded-md hover:bg-[#27272a] transition-all cursor-pointer shadow-sm shrink-0">
              Open Account
            </button>
          )}
        </div>
      </form>

      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3">Account Name</th>
              <th className="p-3">Head Group</th>
              <th className="p-3">Classification Type</th>
              <th className="p-3">Sales Person</th>
              <th className="p-3">Opening Bal</th>
              <th className="p-3">Dr/Cr</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {contacts.length === 0 ? (
              <tr><td colSpan={8} className="p-3 text-center text-[#71717a] py-6 font-medium">No accounts configured</td></tr>
            ) : contacts.map(c => {
              let slsPerson = '-'
              let balType = 'Dr'
              try {
                if (c.notes) {
                  const parsed = JSON.parse(c.notes)
                  slsPerson = parsed.salesPerson || '-'
                  balType = parsed.balanceType || 'Dr'
                }
              } catch {}

              let headGroup = 'Assets'
              for (const [head, classifications] of Object.entries(HEAD_CLASSIFICATIONS)) {
                if (classifications.includes(c.type)) {
                  headGroup = head
                  break
                }
              }

              return (
                <tr key={c.id} className="hover:bg-[#fafafa]">
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3 capitalize font-medium text-[#71717a]">{headGroup}</td>
                  <td className="p-3 text-[#71717a]">{c.type}</td>
                  <td className="p-3 font-medium text-[#71717a]">{slsPerson}</td>
                  <td className="p-3 font-bold">{c.openingBalance || 0}</td>
                  <td className="p-3 font-bold uppercase">{balType}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(c.id, c.isActive !== false)}
                      className={`px-2 py-0.5 rounded font-semibold text-[10px] border cursor-pointer select-none transition-all active:scale-95 ${
                        c.isActive !== false
                          ? 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'
                          : 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {c.isActive !== false ? 'Active' : 'Postponed'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => startEdit(c)}
                      className="p-1.5 text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Pencil size={11} />
                      <span className="text-[10px]">Edit</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
