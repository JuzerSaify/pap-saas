import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Eye, Save, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { getInwardPreviewHtml } from './popupTemplates'

export interface JVLine {
  accountName: string
  type: 'Dr' | 'Cr'
  amount: number
  particulars?: string
}

export interface JVRecord {
  id: number
  voucherNo: string
  date: string
  narration: string
  lines: JVLine[]
  linkedStockInwardNo?: string
}

interface Props {
  records?: JVRecord[]
  setRecords?: React.Dispatch<React.SetStateAction<JVRecord[]>>
  contacts: any[]
  inwardVouchers?: any[]
}

function padNo(n: number) {
  return String(n).padStart(5, '0')
}

export function JournalEntry({ records = [], setRecords, contacts, inwardVouchers = [] }: Props) {
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

  // ── Voucher Header Form States ──────────────────────────────────────────────
  const [jvNo, setJvNo] = useState('')
  const [jvDate, setJvDate] = useState(() => new Date().toISOString().split('T')[0])
  const [narration, setNarration] = useState('')

  // ── Voucher Lines States ────────────────────────────────────────────────────
  const [lines, setLines] = useState<JVLine[]>([])

  // ── Line Entry Sub-Form States ──────────────────────────────────────────────
  const [lineAccount, setLineAccount] = useState('')
  const [lineType, setLineType] = useState<'Dr' | 'Cr'>('Dr')
  const [lineAmount, setLineAmount] = useState<number | ''>('')
  const [lineParticulars, setLineParticulars] = useState('')

  // Filter contacts
  const activeContacts = contacts.filter(c => c.isActive !== false)

  // Calculate Totals
  const totalDebit = lines.filter(l => l.type === 'Dr').reduce((s, l) => s + l.amount, 0)
  const totalCredit = lines.filter(l => l.type === 'Cr').reduce((s, l) => s + l.amount, 0)
  const isBalanced = lines.length > 0 && totalDebit === totalCredit
  const balanceDifference = Math.abs(totalDebit - totalCredit)

  // ── Auto-sync Fields on Navigation ────────────────────────────────────────
  useEffect(() => {
    if (isViewMode && activeRecord) {
      setJvNo(activeRecord.voucherNo)
      setJvDate(activeRecord.date)
      setNarration(activeRecord.narration)
      setLines(activeRecord.lines || [])
    } else {
      // Draft mode
      const nextNo = `JV:${padNo(records.length + 1)}`
      setJvNo(nextNo)
      setJvDate(new Date().toISOString().split('T')[0])
      setNarration('')
      setLines([])
      setLineAccount('')
      setLineType('Dr')
      setLineAmount('')
      setLineParticulars('')
    }
  }, [currentIndex, isViewMode])

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
      alert(`Voucher out of range (Available range: JV:00001 to JV:${padNo(records.length + 1)})`)
    }
  }

  const handleAddLine = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!lineAccount || !lineAmount) {
      alert('Please select an Account and enter an Amount.')
      return
    }

    const newLine: JVLine = {
      accountName: lineAccount,
      type: lineType,
      amount: Number(lineAmount) || 0,
      particulars: lineParticulars.trim() || undefined
    }

    setLines(prev => [...prev, newLine])
    // Reset line input
    setLineAccount('')
    setLineAmount('')
    setLineParticulars('')
  }

  const handleRemoveLine = (idxIndex: number) => {
    setLines(prev => prev.filter((_, idx) => idx !== idxIndex))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isViewMode) return

    if (lines.length < 2) {
      alert('A journal entry must contain at least 2 account lines.')
      return
    }

    if (!isBalanced) {
      alert(`Journal entry is unbalanced. Debits and Credits must be equal! (Difference: ${balanceDifference} PKR)`)
      return
    }

    const newRecord: JVRecord = {
      id: Date.now(),
      voucherNo: jvNo,
      date: jvDate,
      narration: narration.trim() || 'Journal Adjustment Posting',
      lines: lines
    }

    if (setRecords) {
      const updated = [...records, newRecord]
      setRecords(updated)
      setCurrentIndex(updated.length - 1)
    }
  }

  const handlePreview = () => {
    const r = activeRecord
    if (!r) return
    const origin = window.location.origin
    const popup = window.open('', `JVPreview_${r.voucherNo}`, 'width=1050,height=750,resizable=yes')
    if (!popup) return

    const totalDrVal = (r.lines || []).filter(l => l.type === 'Dr').reduce((s, l) => s + l.amount, 0)
    const totalCrVal = (r.lines || []).filter(l => l.type === 'Cr').reduce((s, l) => s + l.amount, 0)

    const tableRowsHtml = (r.lines || []).map(l => `
      <tr class="jv-table-row">
        <td class="jv-cell" style="font-weight: 700; ${l.type === 'Cr' ? 'padding-left: 25px; color: #16a34a;' : 'color: #09090b;'}">
          ${l.accountName}
        </td>
        <td class="jv-cell text-muted" style="font-size: 11px;">
          ${l.particulars || r.narration || 'Adjustment Posting'}
        </td>
        <td class="jv-cell text-right" style="font-weight: 600;">
          ${l.type === 'Dr' ? `PKR ${l.amount.toLocaleString('en-PK')}` : '—'}
        </td>
        <td class="jv-cell text-right" style="font-weight: 600; color: ${l.type === 'Cr' ? '#16a34a' : 'inherit'};">
          ${l.type === 'Cr' ? `PKR ${l.amount.toLocaleString('en-PK')}` : '—'}
        </td>
      </tr>
    `).join('')

    popup.document.write(`
      <html>
        <head>
          <title>Journal Voucher Preview - ${r.voucherNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin:0; padding:0; color:#09090b; background:#fff; }
            .header-bar { display:flex; align-items:center; justify-content:space-between; background:#fff; padding:8px 16px; border-bottom:1px solid #e4e4e7; user-select:none; }
            .app-title { display:flex; align-items:center; font-weight:800; font-size:11px; letter-spacing:0.5px; text-transform:uppercase; }
            .app-icon { width:16px; height:16px; border-radius:4px; margin-right:8px; }
            .btn-group { display:flex; gap:6px; }
            .btn { background:#09090b; color:#fff; border:none; padding:5px 12px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; transition:background 0.15s; text-transform:uppercase; letter-spacing:0.5px; }
            .btn:hover { background:#27272a; }
            .btn-close { background:#e11d48; color:#fff; border:none; padding:5px 10px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; margin-left:8px; text-transform:uppercase; }
            .btn-close:hover { background:#be123c; }
            .doc { max-width:100%; margin:0; background:transparent; padding:40px; }
            .doc-header { display:flex; justify-content:space-between; margin-bottom:30px; border-bottom:1px solid #e4e4e7; padding-bottom:15px; }
            .company-name { font-size:20px; font-weight:800; letter-spacing:0.5px; margin-bottom:4px; }
            .company-sub { font-size:11px; color:#71717a; }
            .voucher-no { font-size:16px; font-weight:bold; text-transform:uppercase; }
            .voucher-date { font-size:11px; color:#71717a; margin-top:2px; }
            
            .jv-table { width: 100%; border-collapse: collapse; margin-top: 25px; }
            .jv-th { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #71717a; padding: 10px; border-bottom: 2px solid #e4e4e7; text-align: left; }
            .jv-cell { padding: 12px 10px; border-bottom: 1px solid #f4f4f5; font-size: 12px; }
            .text-right { text-align: right; }
            .text-muted { color: #71717a; }
            .jv-total-row { background: #fafafa; font-weight: 800; }
            .jv-total-cell { padding: 12px 10px; border-top: 2px solid #e4e4e7; border-bottom: 2px solid #e4e4e7; font-size: 13px; }

            .narration-block { background:#fafafa; border:1px solid #e4e4e7; padding:15px; border-radius:8px; margin-top:25px; font-size:11px; }
            .narration-title { font-size:9px; font-weight:800; text-transform:uppercase; color:#71717a; margin-bottom:5px; }
            .narration-text { font-size:12px; font-weight:600; line-height:1.4; }
            @media print { .header-bar { display:none; } .doc { padding:0; } }
          </style>
        </head>
        <body>
          <div class="header-bar" style="-webkit-app-region:drag;">
            <div class="app-title">
              <img class="app-icon" src="${origin}/favicon.png" />
              <span>Journal Voucher Print</span>
            </div>
            <div class="btn-group" style="-webkit-app-region:no-drag;">
              <button class="btn" onclick="window.print()">Print</button>
              <button class="btn" onclick="window.print()">PDF</button>
              <button class="btn-close" onclick="window.close()">✕</button>
            </div>
          </div>

          <div class="doc">
            <div class="doc-header">
              <div>
                <div class="company-name">PAPSoft ERP</div>
                <div class="company-sub">Paper Packaging Mill Management System</div>
              </div>
              <div style="text-align:right;">
                <div class="voucher-no">${r.voucherNo}</div>
                <div class="voucher-date">Posting Date: ${r.date}</div>
                ${r.linkedStockInwardNo ? `<div style="font-size:9px;color:#71717a;margin-top:4px;font-weight:bold;">Linked Ref: ${r.linkedStockInwardNo}</div>` : ''}
              </div>
            </div>

            <table class="jv-table">
              <thead>
                <tr>
                  <th class="jv-th" style="width: 30%;">Account Title</th>
                  <th class="jv-th">Particulars</th>
                  <th class="jv-th text-right" style="width: 20%;">Debit (Dr)</th>
                  <th class="jv-th text-right" style="width: 20%;">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
                <tr class="jv-total-row">
                  <td colspan="2" class="jv-total-cell" style="text-align: right;">Voucher Totals:</td>
                  <td class="jv-total-cell text-right">PKR ${totalDrVal.toLocaleString('en-PK')}</td>
                  <td class="jv-total-cell text-right" style="color: #16a34a;">PKR ${totalCrVal.toLocaleString('en-PK')}</td>
                </tr>
              </tbody>
            </table>

            <div class="narration-block">
              <div class="narration-title">Voucher Narration</div>
              <div class="narration-text">${r.narration}</div>
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
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-[#09090b] font-sifonn">Journal Entry</h2>
          
          {/* EDITABLE VOUCHER NUMBER SEARCH INPUT */}
          <div className="flex items-center bg-[#fafafa] border border-[#e4e4e7] rounded-md px-2 py-0.5">
            <span className="font-bold text-[10px] text-[#71717a] mr-1 uppercase">JV:</span>
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

      {/* VOUCHER HEADER FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border border-[#e4e4e7] rounded-xl bg-[#fafafa]">
        <div>
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
            JV Voucher Date
          </label>
          <input
            type="date"
            required
            disabled={isViewMode}
            value={jvDate}
            onChange={(e) => setJvDate(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
            Voucher General Narration / Description
          </label>
          <input
            type="text"
            required
            disabled={isViewMode}
            placeholder="e.g. Adjustment post for paper roll purchases..."
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80"
          />
        </div>
      </div>

      {/* Linked Stock Inwards list (Inward references linked to this JV) */}
      {isViewMode && activeRecord && (
        (() => {
          const normalizeJvNum = (str: string): string => {
            if (!str) return ''
            const cleaned = str.toUpperCase().replace(/^JV[:\s-]*/, '').replace(/[^\d]/g, '')
            return String(parseInt(cleaned) || '')
          }

          const mappings = JSON.parse(localStorage.getItem('stockinward_jv_mappings') || '{}')
          const currentJvNormalized = normalizeJvNum(jvNo)

          const linkedInwards = inwardVouchers.filter(v => {
            const mappedJv = mappings[v.voucherNo]
            if (typeof mappedJv !== 'string') return false
            return normalizeJvNum(mappedJv) === currentJvNormalized
          })
          if (linkedInwards.length === 0) return null

          const handlePreviewInward = (v: any) => {
            const origin = window.location.origin
            const win = window.open('', '_blank', 'width=850,height=700')
            if (!win) {
              alert('Popup blocked! Please allow popups for this app.')
              return
            }
            win.document.write(getInwardPreviewHtml(v.voucherNo, v.date, v.accountName, v.narration, v.items, origin))
            win.document.close()
          }

          return (
            <div className="flex items-center gap-2 p-3 border border-[#e4e4e7] rounded-xl bg-[#fafafa] flex-wrap">
              <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">Linked Stock Inwards against this JV:</span>
              <div className="flex flex-wrap gap-1.5">
                {linkedInwards.map(vVou => (
                  <button
                    type="button"
                    key={vVou.voucherNo}
                    onClick={() => handlePreviewInward(vVou)}
                    className="flex items-center gap-1 h-6 px-2 border border-[#e4e4e7] rounded bg-white hover:bg-neutral-50 font-bold text-[9px] text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer uppercase font-sans select-none"
                  >
                    <Eye size={10} />
                    <span>{vVou.voucherNo}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })()
      )}

      {/* DRAFT POSTINGS ITEM ENTRY SUB-FORM (Only editable in New Entry mode) */}
      {!isViewMode && (
        <div className="p-4 border border-[#e4e4e7] rounded-xl bg-white space-y-3 shadow-xs">
          <div className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pb-1 border-b border-neutral-100">
            Add Journal Entry Line
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div className="col-span-2">
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Account Title</label>
              <select
                value={lineAccount}
                onChange={(e) => setLineAccount(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-white focus:outline-none focus:border-black font-semibold"
              >
                <option value="">— Select Account —</option>
                {activeContacts.map(c => (
                  <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Posting Type</label>
              <select
                value={lineType}
                onChange={(e) => setLineType(e.target.value as 'Dr' | 'Cr')}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-white focus:outline-none focus:border-black font-semibold text-neutral-800"
              >
                <option value="Dr">Debit (Dr)</option>
                <option value="Cr">Credit (Cr)</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Amount (PKR)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={lineAmount}
                onChange={(e) => setLineAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white font-bold"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Line Narration (Optional)</label>
              <input
                type="text"
                placeholder="Remarks..."
                value={lineParticulars}
                onChange={(e) => setLineParticulars(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-black bg-white"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleAddLine}
                className="w-full h-9 border border-black hover:bg-neutral-50 font-bold text-[10px] rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider font-sifonn"
              >
                <Plus size={12} />
                <span>Add Line</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POSTINGS LIST TABLE */}
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white min-h-[180px]">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
            <tr>
              <th className="p-3">Account Title</th>
              <th className="p-3">Particulars / Line Description</th>
              <th className="p-3 text-right w-36">Debit (Dr)</th>
              <th className="p-3 text-right w-36">Credit (Cr)</th>
              {!isViewMode && <th className="p-3 w-16 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={isViewMode ? 4 : 5} className="p-8 text-center text-[#71717a] font-medium italic">
                  No account lines added to this voucher yet. Select an account and add entries above.
                </td>
              </tr>
            ) : (
              lines.map((l, index) => (
                <tr key={index} className="hover:bg-neutral-50 transition-colors">
                  <td className={`p-3 font-semibold ${l.type === 'Cr' ? 'pl-8 text-green-700' : 'text-neutral-900'}`}>
                    {l.accountName}
                  </td>
                  <td className="p-3 text-neutral-600 truncate max-w-[250px]">
                    {l.particulars || narration || '—'}
                  </td>
                  <td className="p-3 text-right font-bold text-neutral-900">
                    {l.type === 'Dr' ? `PKR ${l.amount.toLocaleString('en-PK')}` : '—'}
                  </td>
                  <td className="p-3 text-right font-bold text-green-700">
                    {l.type === 'Cr' ? `PKR ${l.amount.toLocaleString('en-PK')}` : '—'}
                  </td>
                  {!isViewMode && (
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(index)}
                        className="p-1 hover:bg-neutral-100 text-rose-500 rounded transition-colors cursor-pointer"
                        title="Remove Line"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
            {lines.length > 0 && (
              <tr className="bg-[#fafafa] font-bold border-t-2 border-[#e4e4e7]">
                <td colSpan={2} className="p-3 text-right">Running Balanced Totals:</td>
                <td className="p-3 text-right text-neutral-900 font-extrabold">
                  PKR {totalDebit.toLocaleString('en-PK')}
                </td>
                <td className="p-3 text-right text-green-700 font-extrabold">
                  PKR {totalCredit.toLocaleString('en-PK')}
                </td>
                {!isViewMode && <td></td>}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* BALANCING STATUS & POST ACTION CONTAINER (Draft mode only) */}
      {!isViewMode && (
        <div className="p-4 border border-[#e4e4e7] rounded-xl bg-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            {lines.length === 0 ? (
              <div className="flex items-center gap-1.5 text-neutral-400 font-semibold text-xs">
                <AlertTriangle size={15} />
                <span>Voucher is empty. Add debit and credit posting rows above.</span>
              </div>
            ) : isBalanced ? (
              <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                <CheckCircle2 size={15} />
                <span>Journal posting is perfectly balanced (Total: PKR {totalDebit.toLocaleString('en-PK')}).</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs">
                <AlertTriangle size={15} />
                <span>Unbalanced postings! Difference: PKR {balanceDifference.toLocaleString('en-PK')} (Dr: {totalDebit.toLocaleString('en-PK')} | Cr: {totalCredit.toLocaleString('en-PK')}).</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isBalanced}
            className="h-10 px-6 bg-black text-white font-bold text-xs rounded-md hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 uppercase tracking-wider font-sifonn"
          >
            <Save size={14} />
            <span>POST JOURNAL VOUCHER</span>
          </button>
        </div>
      )}



    </div>
  )
}
