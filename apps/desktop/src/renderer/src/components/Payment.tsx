import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Eye, Save, Plus, Trash2 } from 'lucide-react'

export interface PaymentLine {
  party: string
  amount: number
  particulars?: string
}

export interface PaymentRecord {
  id: number
  voucherNo: string
  date: string
  mode: string
  chequeNo?: string
  slipNo?: string
  lines: PaymentLine[]
}

interface Props {
  contacts: any[]
  records?: PaymentRecord[]
  setRecords?: React.Dispatch<React.SetStateAction<PaymentRecord[]>>
}

function padNo(n: number) {
  return String(n).padStart(5, '0')
}

export function Payment({ contacts, records = [], setRecords }: Props) {
  // ── Navigation States ────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(records.length)
  const [jumpNum, setJumpNum] = useState('')

  useEffect(() => {
    setCurrentIndex(records.length)
  }, [records.length === 0 ? 0 : 1])

  useEffect(() => {
    setJumpNum(String(currentIndex + 1).padStart(5, '0'))
  }, [currentIndex])

  const isViewMode = currentIndex < records.length
  const activeRecord = isViewMode ? records[currentIndex] : null

  // ── Voucher Header States ────────────────────────────────────────────────────
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [mode, setMode] = useState('Cash')
  const [chequeNo, setChequeNo] = useState('')
  const [slipNo, setSlipNo] = useState('')

  // ── Voucher Line Draft States ───────────────────────────────────────────────
  const [party, setParty] = useState('')
  const [lineParticulars, setLineParticulars] = useState('')
  const [lineAmount, setLineAmount] = useState('')

  // ── Draft Lines Array ────────────────────────────────────────────────────────
  const [draftLines, setDraftLines] = useState<PaymentLine[]>([])

  const activeContacts = contacts.filter(c => c.isActive !== false)

  // ── Auto-sync Fields on Nav ────────────────────────────────────────────────
  useEffect(() => {
    if (isViewMode && activeRecord) {
      setDate(activeRecord.date)
      setMode(activeRecord.mode)
      setChequeNo(activeRecord.chequeNo || '')
      setSlipNo(activeRecord.slipNo || '')
      
      // Auto-upgrade legacy single-line payments to the new lines array format on the fly
      if (activeRecord.lines && Array.isArray(activeRecord.lines)) {
        setDraftLines(activeRecord.lines)
      } else {
        const legacyAmt = Number(String((activeRecord as any).amount).replace(/[^\d.]/g, '')) || 0
        setDraftLines([
          {
            party: (activeRecord as any).party || 'Unknown',
            amount: legacyAmt,
            particulars: 'Legacy Single-Line Record'
          }
        ])
      }
    } else {
      // Draft mode reset
      setDate(new Date().toISOString().split('T')[0])
      setMode('Cash')
      setChequeNo('')
      setSlipNo('')
      setDraftLines([])
      resetLineForm()
    }
  }, [currentIndex, isViewMode])

  const resetLineForm = () => {
    setParty('')
    setLineParticulars('')
    setLineAmount('')
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < records.length) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleNew = () => {
    setCurrentIndex(records.length)
  }

  const handleJumpToVoucher = () => {
    const cleanNo = jumpNum.replace(/[^\d]/g, '')
    const idx = parseInt(cleanNo) ? parseInt(cleanNo) - 1 : -1
    if (idx >= 0 && idx <= records.length) {
      setCurrentIndex(idx)
    } else {
      alert(`Payment out of range (Available range: PAY:00001 to PAY:${padNo(records.length + 1)})`)
    }
  }

  // Add line to draft lines array
  const handleAddLine = (e: React.FormEvent) => {
    e.preventDefault()
    if (!party || !lineAmount) {
      alert('Please select an Account and enter the Amount.')
      return
    }

    const amt = parseFloat(lineAmount) || 0
    if (amt <= 0) {
      alert('Amount must be greater than zero.')
      return
    }

    const newLine: PaymentLine = {
      party,
      particulars: lineParticulars.trim() || undefined,
      amount: amt
    }

    setDraftLines(prev => [...prev, newLine])
    resetLineForm()
  }

  const handleDeleteLine = (idx: number) => {
    setDraftLines(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSaveVoucher = () => {
    if (isViewMode) return

    if (draftLines.length === 0) {
      alert('Please add at least one payment line to the voucher.')
      return
    }

    if (mode === 'Cheque' && !chequeNo.trim()) {
      alert('Please enter the Cheque Number.')
      return
    }

    if (mode === 'Online' && !slipNo.trim()) {
      alert('Please enter the Deposit Slip Number.')
      return
    }

    const nextNo = `PAY:${padNo(records.length + 1)}`
    const newRecord: PaymentRecord = {
      id: Date.now(),
      voucherNo: nextNo,
      date,
      mode,
      chequeNo: mode === 'Cheque' ? chequeNo.trim() : undefined,
      slipNo: mode === 'Online' ? slipNo.trim() : undefined,
      lines: draftLines
    }

    if (setRecords) {
      const updated = [...records, newRecord]
      setRecords(updated)
      setCurrentIndex(updated.length - 1)
    }
  }

  const totalVoucherAmount = draftLines.reduce((s, l) => s + l.amount, 0)

  // ── Print Preview Popup Generator ──────────────────────────────────────────
  const handlePreview = () => {
    const r = activeRecord
    if (!r) return
    const origin = window.location.origin
    const popup = window.open('', `PaymentPreview_${r.voucherNo}`, 'width=900,height=700,resizable=yes')
    if (!popup) return

    const linesHtml = r.lines.map((l, idx) => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #e4e4e7;">${idx + 1}</td>
        <td style="padding:10px; border-bottom:1px solid #e4e4e7; font-weight:700;">${l.party}</td>
        <td style="padding:10px; border-bottom:1px solid #e4e4e7; color:#52525b;">${l.particulars || '—'}</td>
        <td style="padding:10px; border-bottom:1px solid #e4e4e7; text-align:right; font-weight:700; color:#e11d48;">PKR ${l.amount.toLocaleString('en-PK')}</td>
      </tr>
    `).join('')

    popup.document.write(`
      <html>
        <head>
          <title>Payment Voucher Print - ${r.voucherNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin:0; padding:0; color:#09090b; background:#fff; }
            .header-bar { display:flex; align-items:center; justify-content:space-between; background:#fff; padding:8px 16px; border-bottom:1px solid #e4e4e7; user-select:none; }
            .app-title { display:flex; align-items:center; font-weight:800; font-size:11px; letter-spacing:0.5px; text-transform:uppercase; }
            .app-icon { width:16px; height:16px; border-radius:4px; margin-right:8px; }
            .btn-group { display:flex; gap:6px; }
            .btn { background:#09090b; color:#fff; border:none; padding:5px 12px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; text-transform:uppercase; letter-spacing:0.5px; }
            .btn-close { background:#e11d48; color:#fff; border:none; padding:5px 10px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; margin-left:8px; text-transform:uppercase; }
            .doc { padding:40px; }
            .doc-header { display:flex; justify-content:space-between; margin-bottom:40px; border-bottom:1px solid #e4e4e7; padding-bottom:15px; }
            .company-name { font-size:18px; font-weight:800; letter-spacing:0.5px; }
            .voucher-title { font-size:16px; font-weight:bold; text-transform:uppercase; color:#e11d48; }
            .slip-grid { display:grid; grid-template-cols: 1fr 1fr 1fr; gap:20px; margin-bottom:30px; font-size:12px; }
            .slip-label { font-size:9px; text-transform:uppercase; color:#71717a; font-weight:800; margin-bottom:2px; }
            .slip-val { font-size:13px; font-weight:700; color:#09090b; }
            table { width:100%; border-collapse:collapse; margin-top:15px; font-size:11px; }
            th, td { border-bottom:1px solid #e4e4e7; padding:10px; text-align:left; }
            th { background:#fafafa; font-weight:800; color:#71717a; text-transform:uppercase; font-size:9px; letter-spacing:0.5px; }
            tfoot { font-weight:bold; background:#fafafa; border-top:2px solid #09090b; border-bottom:2px solid #09090b; }
            .sign-row { display:flex; justify-content:space-between; margin-top:80px; font-size:11px; font-weight:700; }
            @media print { .header-bar { display:none; } .doc { padding:0; } }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="app-title">
              <img class="app-icon" src="${origin}/favicon.png" />
              <span>Payment print</span>
            </div>
            <div class="btn-group">
              <button class="btn" onclick="window.print()">Print</button>
              <button class="btn-close" onclick="window.close()">✕</button>
            </div>
          </div>

          <div class="doc">
            <div class="doc-header">
              <div>
                <div class="company-name">PAPSoft ERP</div>
                <div style="font-size:11px; color:#71717a;">Paper Packaging Mill Management System</div>
              </div>
              <div style="text-align:right;">
                <div class="voucher-title">Payment Voucher</div>
                <div style="font-size:12px; font-weight:bold; margin-top:4px;">Vou No: ${r.voucherNo}</div>
              </div>
            </div>

            <div class="slip-grid">
              <div>
                <div class="slip-label">Voucher Date</div>
                <div class="slip-val">${r.date}</div>
              </div>
              <div>
                <div class="slip-label">Payment Mode</div>
                <div class="slip-val">${r.mode}</div>
              </div>
              <div>
                ${r.mode === 'Cheque' ? `
                  <div class="slip-label">Cheque Number</div>
                  <div class="slip-val">${r.chequeNo || 'N/A'}</div>
                ` : r.mode === 'Online' ? `
                  <div class="slip-label">Deposit Slip Ref</div>
                  <div class="slip-val">${r.slipNo || 'N/A'}</div>
                ` : `
                  <div class="slip-label">Reference</div>
                  <div class="slip-val">Cash Ledger</div>
                `}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width:50px;">S#</th>
                  <th>Paid To Account (Party)</th>
                  <th>Particulars / Line Description</th>
                  <th style="text-align:right; width:150px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${linesHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding:12px 10px; font-size:10px; text-transform:uppercase;">Total Voucher Amount</td>
                  <td style="padding:12px 10px; text-align:right; font-size:13px; font-weight:900; color:#e11d48;">PKR ${totalVoucherAmount.toLocaleString('en-PK')}</td>
                </tr>
              </tfoot>
            </table>

            <div class="sign-row">
              <div>Prepared By: ______________</div>
              <div>Authorized Signatory: ______________</div>
            </div>
          </div>
        </body>
      </html>
    `)
    popup.document.close()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4 font-sans text-xs text-[#09090b]">
      
      {/* VOUCHER CONTROL BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-[#09090b] font-sifonn">Bank/Cash Payment</h2>
          
          <div className="flex items-center bg-[#fafafa] border border-[#e4e4e7] rounded-md px-2 py-0.5">
            <span className="font-bold text-[10px] text-[#71717a] mr-1 uppercase">PAY:</span>
            <input
              type="text"
              value={jumpNum}
              onChange={e => setJumpNum(e.target.value.replace(/[^\d]/g, ''))}
              maxLength={5}
              className="w-16 h-6 border-0 bg-transparent text-center font-bold text-xs focus:outline-none"
            />
            {(() => {
              const cleanNo = jumpNum.replace(/[^\d]/g, '')
              const idx = parseInt(cleanNo) ? parseInt(cleanNo) - 1 : -1
              const isEditedNum = idx !== currentIndex && cleanNo.length === 5
              if (!isEditedNum) return null
              return (
                <button
                  onClick={handleJumpToVoucher}
                  className="ml-1.5 px-2 py-0.5 bg-[#54e0e7] hover:bg-[#3cd5dc] text-[#09090b] font-bold text-[9px] rounded transition-all cursor-pointer font-sifonn"
                >
                  CHECK
                </button>
              )
            })()}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 border border-[#e4e4e7] rounded-md hover:bg-[#f4f4f5] disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer transition-colors"
              title="Previous Voucher"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === records.length}
              className="p-1.5 border border-[#e4e4e7] rounded-md hover:bg-[#f4f4f5] disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer transition-colors"
              title="Next Voucher"
            >
              <ChevronRight size={14} />
            </button>
            
            {isViewMode && (
              <button
                onClick={handlePreview}
                className="flex items-center gap-1 h-8 px-3 ml-1.5 border border-[#e4e4e7] rounded-md hover:bg-[#f4f4f5] font-semibold text-[10px] text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer"
              >
                <Eye size={12} />
                <span>PREVIEW</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleNew}
            disabled={currentIndex === records.length}
            className="flex items-center gap-1 h-8 px-3 border border-[#e4e4e7] rounded-md hover:bg-[#f4f4f5] font-semibold text-[10px] text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer uppercase tracking-wider font-sifonn"
          >
            <Plus size={12} />
            <span>NEW VOUCHER</span>
          </button>
        </div>
      </div>

      {/* HEADER VOUCHER STATE PANEL */}
      <div className="p-4 border border-[#e4e4e7] rounded-xl bg-[#fafafa]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Payment Date</label>
            <input
              type="date"
              required
              disabled={isViewMode}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white disabled:bg-neutral-100 disabled:opacity-80"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Payment Method</label>
            {isViewMode ? (
              <input
                type="text"
                disabled
                value={mode}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-neutral-100 font-semibold text-[#71717a] opacity-80"
              />
            ) : (
              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value)
                  setChequeNo('')
                  setSlipNo('')
                }}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-white focus:outline-none focus:border-black font-semibold"
              >
                <option value="Cash">Cash Ledger</option>
                <option value="Cheque">Cheque Payment (Bank A/c)</option>
                <option value="Online">Online Bank Transfer</option>
              </select>
            )}
          </div>

          {mode === 'Cheque' && (
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Cheque Number</label>
              <input
                type="text"
                required
                disabled={isViewMode}
                placeholder="Cheque No..."
                value={chequeNo}
                onChange={(e) => setChequeNo(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white disabled:bg-neutral-100 disabled:opacity-80 font-bold"
              />
            </div>
          )}

          {mode === 'Online' && (
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Deposit Slip Number</label>
              <input
                type="text"
                required
                disabled={isViewMode}
                placeholder="Slip Ref..."
                value={slipNo}
                onChange={(e) => setSlipNo(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white disabled:bg-neutral-100 disabled:opacity-80 font-bold"
              />
            </div>
          )}

          <div className={`flex items-end justify-end ${mode === 'Cash' ? 'md:col-span-2' : 'md:col-span-1'}`}>
            {!isViewMode && (
              <button
                type="button"
                onClick={handleSaveVoucher}
                className="h-9 px-6 bg-black text-white hover:bg-neutral-800 transition-all font-bold text-xs rounded-md cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider font-sifonn shadow-xs"
              >
                <Save size={14} />
                <span>Save Voucher</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* DRAFT LINE ITEMS INPUT (Only editable in New Entry mode) */}
      {!isViewMode && (
        <form onSubmit={handleAddLine} className="p-4 border border-[#e4e4e7] rounded-xl bg-white space-y-3 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div className="col-span-2 md:col-span-1.5">
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Paid To Account</label>
              <select
                value={party}
                onChange={(e) => setParty(e.target.value)}
                required
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-white focus:outline-none focus:border-black font-semibold"
              >
                <option value="">— Select Account —</option>
                {activeContacts.map(c => (
                  <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 md:col-span-1.5">
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Particulars / Line Remarks</label>
              <input
                type="text"
                placeholder="e.g. Material purchase bill payment"
                value={lineParticulars}
                onChange={e => setLineParticulars(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Line Amount (PKR)</label>
              <input
                type="number"
                required
                placeholder="e.g. 50000"
                value={lineAmount}
                onChange={e => setLineAmount(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white font-bold"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full h-9 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 hover:text-black font-bold text-xs rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider font-sifonn shadow-sm shrink-0"
              >
                <Plus size={14} />
                <span>Add Line</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* VOUCHER ITEMS TABLE GRID */}
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white min-h-[160px]">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
            <tr>
              <th className="p-3 w-12 text-center">S#</th>
              <th className="p-3">Paid To Account (Debit)</th>
              <th className="p-3">Particulars / Description</th>
              <th className="p-3 text-right w-44">Amount</th>
              {!isViewMode && <th className="p-3 w-16 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {draftLines.length === 0 ? (
              <tr>
                <td colSpan={isViewMode ? 4 : 5} className="p-8 text-center text-[#71717a] font-medium py-10">
                  {isViewMode ? 'No line entries in this voucher.' : 'No lines added yet. Add a line above.'}
                </td>
              </tr>
            ) : (
              draftLines.map((l, index) => (
                <tr key={index} className="hover:bg-neutral-50 font-medium">
                  <td className="p-3 text-center text-neutral-400 font-mono">{index + 1}</td>
                  <td className="p-3 font-bold text-neutral-800">{l.party}</td>
                  <td className="p-3 text-neutral-500">{l.particulars || '—'}</td>
                  <td className="p-3 text-right font-bold text-rose-700 font-mono">
                    PKR {l.amount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                  </td>
                  {!isViewMode && (
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteLine(index)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        title="Delete line"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {draftLines.length > 0 && (
            <tfoot>
              <tr className="bg-[#fafafa] font-bold border-t border-[#e4e4e7] uppercase text-[10px] text-[#09090b]">
                <td className="p-3 text-center" colSpan={2}></td>
                <td className="p-3">Total Payment Sum</td>
                <td className="p-3 text-right font-mono text-rose-700 text-xs">
                  PKR {totalVoucherAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                </td>
                {!isViewMode && <td className="p-3"></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* REGISTRY LIST TABLE (Only shown at the bottom of the tab for switching/navigating vouchers) */}
      <div className="border border-[#e4e4e7] rounded-xl bg-white max-h-[180px] overflow-auto">
        <table className="w-full border-collapse text-left text-[10px] text-[#71717a]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-bold uppercase tracking-wider sticky top-0 z-10 text-[9px]">
            <tr>
              <th className="p-2 w-24">Date</th>
              <th className="p-2 w-24">Payment No</th>
              <th className="p-2 w-28">Method</th>
              <th className="p-2">Accounts Debited</th>
              <th className="p-2 text-right w-36">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {records.map((r, index) => {
              const lines = r.lines || [
                {
                  party: r.party,
                  amount: Number(String(r.amount).replace(/[^\d.]/g, '')) || 0
                }
              ]
              const partyList = lines.map(l => l.party).filter((v, i, a) => a.indexOf(v) === i).join(', ')
              const totalAmt = lines.reduce((s, l) => s + l.amount, 0)
              return (
                <tr
                  key={r.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`hover:bg-neutral-50 cursor-pointer transition-colors ${
                    currentIndex === index ? 'bg-neutral-50 font-semibold text-[#09090b]' : ''
                  }`}
                >
                  <td className="p-2 font-mono">{r.date}</td>
                  <td className="p-2 font-extrabold text-[#09090b]">{r.voucherNo || `PAY:${String(r.id).slice(-5)}`}</td>
                  <td className="p-2 font-medium">{r.mode}</td>
                  <td className="p-2 truncate max-w-[200px]" title={partyList}>{partyList}</td>
                  <td className="p-2 text-right font-bold text-rose-700 font-mono">
                    PKR {totalAmt.toLocaleString('en-PK')}
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
