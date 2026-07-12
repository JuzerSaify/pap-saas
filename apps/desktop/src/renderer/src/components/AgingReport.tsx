import React, { useState } from 'react'
import { Eye } from 'lucide-react'

interface Props {
  invoiceVouchers?: any[]
  receipts?: any[]
  contacts?: any[]
}

interface AgingInvoiceRow {
  customerName: string
  invoiceNo: string
  invoiceDate: string
  dueDate: string
  creditDays: number
  ageDays: number
  overdueDays: number
  bucket1: number // 0-30 days
  bucket2: number // 31-60 days
  bucket3: number // 61-90 days
  bucket4: number // 90+ days
  outstanding: number
}

export function AgingReport({ invoiceVouchers = [], receipts = [], contacts = [] }: Props) {
  const [selectedAccount, setSelectedAccount] = useState('')
  const [showReport, setShowReport] = useState(false)

  // Filter active contacts list
  const activeCustomers = contacts.filter(c => c.isActive !== false)

  // ── Calculate Invoice-Wise Aging Data ──────────────────────────────────────
  const compileAgingRows = (): AgingInvoiceRow[] => {
    // Read credit days map from localStorage
    const creditDaysMap = JSON.parse(localStorage.getItem('invoice_credit_days') || '{}')
    const today = new Date('2026-07-12') // System date anchor
    const rows: AgingInvoiceRow[] = []

    invoiceVouchers.forEach(v => {
      const partyName = v.accountName
      if (!partyName) return

      // Calculate total billed amount for this invoice
      const billedAmount = (v.items || []).reduce((s: number, it: any) => s + (Number(it.saleAmount) || 0), 0)

      // Calculate total receipts (payments received) offset against this invoice (handling new lines & legacy fallbacks)
      const paidAmount = receipts.reduce((s: number, r: any) => {
        const lines = r.lines || [
          {
            party: r.party,
            amount: Number(String(r.amount).replace(/[^\d.]/g, '')) || 0,
            invoiceNo: r.invoiceNo
          }
        ]
        const linePaid = lines.reduce((ls: number, l: any) => {
          if (l.invoiceNo === v.voucherNo) {
            return ls + (Number(l.amount) || 0)
          }
          return ls
        }, 0)
        return s + linePaid
      }, 0)

      const outstanding = billedAmount - paidAmount

      // Only count if there is an unpaid outstanding balance
      if (outstanding > 0) {
        // Read credit days limit (default to 15 days if not present)
        const creditLimitStr = creditDaysMap[v.voucherNo] || '15'
        const creditLimit = parseInt(creditLimitStr) || 15

        // Calculate Due Date
        const invoiceDate = new Date(v.date)
        const dueDate = new Date(invoiceDate)
        dueDate.setDate(dueDate.getDate() + creditLimit)

        // Calculate Age (Days since Invoice Date)
        const ageTime = today.getTime() - invoiceDate.getTime()
        const ageDays = Math.max(0, Math.ceil(ageTime / (1000 * 60 * 60 * 24)))

        // Calculate Overdue Days (Days since Due Date)
        const overdueTime = today.getTime() - dueDate.getTime()
        const overdueDays = Math.ceil(overdueTime / (1000 * 60 * 60 * 24))

        // Classify into aging buckets based on how old the invoice is (ageDays)
        let bucket1 = 0
        let bucket2 = 0
        let bucket3 = 0
        let bucket4 = 0

        if (ageDays <= 30) {
          bucket1 = outstanding
        } else if (ageDays <= 60) {
          bucket2 = outstanding
        } else if (ageDays <= 90) {
          bucket3 = outstanding
        } else {
          bucket4 = outstanding
        }

        rows.push({
          customerName: partyName,
          invoiceNo: v.voucherNo,
          invoiceDate: v.date,
          dueDate: dueDate.toISOString().split('T')[0],
          creditDays: creditLimit,
          ageDays,
          overdueDays,
          bucket1,
          bucket2,
          bucket3,
          bucket4,
          outstanding
        })
      }
    })

    // Sort by age (oldest invoice first)
    return rows.sort((a, b) => b.ageDays - a.ageDays)
  }

  // Filter aging rows based on selection
  const rawRows = compileAgingRows()
  const agingRows = rawRows.filter(r => {
    if (!selectedAccount) return true
    return r.customerName === selectedAccount
  })

  // Calculate Column Totals
  const totalBucket1 = agingRows.reduce((s, r) => s + r.bucket1, 0)
  const totalBucket2 = agingRows.reduce((s, r) => s + r.bucket2, 0)
  const totalBucket3 = agingRows.reduce((s, r) => s + r.bucket3, 0)
  const totalBucket4 = agingRows.reduce((s, r) => s + r.bucket4, 0)
  const grandTotal = agingRows.reduce((s, r) => s + r.outstanding, 0)

  // ── Print Preview Handler ──────────────────────────────────────────────────
  const handlePrintReport = () => {
    const origin = window.location.origin
    const win = window.open('', '_blank', 'width=1100,height=700,resizable=yes')
    if (!win) {
      alert('Popup blocked! Please allow popups for this app.')
      return
    }

    const rowsHtml = agingRows.map(r => `
      <tr>
        <td style="padding:8px; font-weight:700; border-bottom:1px solid #e4e4e7;">${r.customerName}</td>
        <td style="padding:8px; border-bottom:1px solid #e4e4e7; font-family:monospace; font-weight:bold;">${r.invoiceNo}</td>
        <td style="padding:8px; border-bottom:1px solid #e4e4e7; font-family:monospace; color:#52525b;">${r.invoiceDate}</td>
        <td style="padding:8px; border-bottom:1px solid #e4e4e7; font-family:monospace; color:#52525b;">${r.dueDate}</td>
        <td style="padding:8px; text-align:center; border-bottom:1px solid #e4e4e7; font-weight:bold; color:#71717a;">${r.creditDays} Days</td>
        <td style="padding:8px; text-align:center; border-bottom:1px solid #e4e4e7; font-weight:800; color:#16a34a;">${r.ageDays} Days</td>
        <td style="padding:8px; text-align:right; border-bottom:1px solid #e4e4e7;">${r.bucket1 > 0 ? 'PKR ' + r.bucket1.toLocaleString('en-PK', { maximumFractionDigits: 0 }) : '—'}</td>
        <td style="padding:8px; text-align:right; border-bottom:1px solid #e4e4e7;">${r.bucket2 > 0 ? 'PKR ' + r.bucket2.toLocaleString('en-PK', { maximumFractionDigits: 0 }) : '—'}</td>
        <td style="padding:8px; text-align:right; border-bottom:1px solid #e4e4e7;">${r.bucket3 > 0 ? 'PKR ' + r.bucket3.toLocaleString('en-PK', { maximumFractionDigits: 0 }) : '—'}</td>
        <td style="padding:8px; text-align:right; border-bottom:1px solid #e4e4e7;">${r.bucket4 > 0 ? 'PKR ' + r.bucket4.toLocaleString('en-PK', { maximumFractionDigits: 0 }) : '—'}</td>
        <td style="padding:8px; text-align:right; font-weight:bold; color:#e11d48; border-bottom:1px solid #e4e4e7;">PKR ${r.outstanding.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
      </tr>
    `).join('')

    win.document.write(`
      <html>
        <head>
          <title>Invoice-Wise Customer Aging Statement</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin:0; padding:0; color:#09090b; background:#fff; }
            .header-bar { display:flex; align-items:center; justify-content:space-between; background:#fff; padding:8px 16px; border-bottom:1px solid #e4e4e7; user-select:none; }
            .app-title { display:flex; align-items:center; font-weight:800; font-size:11px; letter-spacing:0.5px; text-transform:uppercase; }
            .app-icon { width:16px; height:16px; border-radius:4px; margin-right:8px; }
            .btn-group { display:flex; gap:6px; }
            .btn { background:#09090b; color:#fff; border:none; padding:5px 12px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; text-transform:uppercase; letter-spacing:0.5px; }
            .btn-close { background:#e11d48; color:#fff; border:none; padding:5px 10px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; margin-left:8px; text-transform:uppercase; }
            .doc { padding:40px; }
            .doc-header { display:flex; justify-content:space-between; margin-bottom:30px; border-bottom:1px solid #e4e4e7; padding-bottom:15px; }
            .company-name { font-size:18px; font-weight:800; letter-spacing:0.5px; }
            .voucher-title { font-size:16px; font-weight:bold; text-transform:uppercase; color:#09090b; }
            @media print { .header-bar { display:none; } .doc { padding:0; } }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="app-title">
              <img class="app-icon" src="${origin}/favicon.png" />
              <span>Invoice Aging Analysis</span>
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
                <div style="font-size:11px; color:#71717a;">Detailed Invoice-Wise Customer Aging Statements</div>
              </div>
              <div style="text-align:right;">
                <div class="voucher-title">Invoice-Wise Aging</div>
                <div style="font-size:11px; color:#71717a; margin-top:4px;">As of: 2026-07-12</div>
              </div>
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:10px;">
              <thead>
                <tr style="background:#fafafa; border-bottom:2px solid #e4e4e7; font-weight:bold; text-transform:uppercase; color:#71717a;">
                  <th style="padding:8px; text-align:left;">Customer Account</th>
                  <th style="padding:8px; text-align:left;">Invoice No</th>
                  <th style="padding:8px; text-align:left;">Inv Date</th>
                  <th style="padding:8px; text-align:left;">Due Date</th>
                  <th style="padding:8px; text-align:center;">Credit Days</th>
                  <th style="padding:8px; text-align:center;">Invoice Age</th>
                  <th style="padding:8px; text-align:right;">0-30 Days</th>
                  <th style="padding:8px; text-align:right;">31-60 Days</th>
                  <th style="padding:8px; text-align:right;">61-90 Days</th>
                  <th style="padding:8px; text-align:right;">90+ Days</th>
                  <th style="padding:8px; text-align:right;">Total Outstanding</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                <tr style="font-weight:bold; background:#fafafa; border-top:2px solid #09090b; border-bottom:2px solid #09090b;">
                  <td style="padding:10px;" colspan="6">Grand Totals</td>
                  <td style="padding:10px; text-align:right;">PKR ${totalBucket1.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td style="padding:10px; text-align:right;">PKR ${totalBucket2.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td style="padding:10px; text-align:right;">PKR ${totalBucket3.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td style="padding:10px; text-align:right;">PKR ${totalBucket4.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td style="padding:10px; text-align:right; color:#e11d48;">PKR ${grandTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4 font-sans text-xs text-[#09090b]">
      
      {/* HEADER TITLE BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-[#09090b] font-sifonn">Invoice-Wise Customer Aging</h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[9px] font-bold text-neutral-500 font-mono uppercase">
            As of: 2026-07-12
          </span>
        </div>
      </div>

      {/* FILTER & CRITERIA CONTROL PANEL */}
      <div className="p-4 border border-[#e4e4e7] rounded-xl bg-[#fafafa] flex flex-wrap gap-4 items-end">
        <div className="w-64">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
            Filter Customer Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => {
              setSelectedAccount(e.target.value)
              setShowReport(false)
            }}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white font-semibold"
          >
            <option value="">— All Customer Accounts —</option>
            {activeCustomers.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowReport(true)}
          className="h-9 px-6 bg-black text-white hover:bg-neutral-800 transition-all font-bold text-xs rounded-md cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider font-sifonn shadow-xs"
        >
          <span>Show Report</span>
        </button>

        {showReport && agingRows.length > 0 && (
          <button
            onClick={handlePrintReport}
            className="h-9 px-6 bg-[#fafafa] border border-[#e4e4e7] text-neutral-700 hover:text-black hover:bg-[#f4f4f5] transition-all font-bold text-xs rounded-md cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider font-sifonn shadow-sm"
          >
            <Eye size={13} />
            <span>Print Report</span>
          </button>
        )}
      </div>

      {/* AGING DATA GRID */}
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white flex flex-col">
        {!showReport ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400 py-16">
            <span className="font-semibold text-xs mb-1">Invoice Aging Filters Selected</span>
            <span className="text-[10px] text-neutral-500 max-w-[280px]">
              Select a customer account or leave blank for all, then click the **Show Report** button to preview.
            </span>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs text-[#09090b]">
            <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
              <tr>
                <th className="p-3">Customer Account</th>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Inv Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-center">Credit Days</th>
                <th className="p-3 text-center">Invoice Age</th>
                <th className="p-3 text-right">0-30 Days</th>
                <th className="p-3 text-right">31-60 Days</th>
                <th className="p-3 text-right">61-90 Days</th>
                <th className="p-3 text-right">90+ Days</th>
                <th className="p-3 text-right w-40">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7]">
              {agingRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-[#71717a] py-12 font-medium italic">
                    No outstanding invoices found for selected criteria.
                  </td>
                </tr>
              ) : (
                <>
                  {agingRows.map(r => (
                    <tr key={r.invoiceNo} className="hover:bg-neutral-50 font-medium">
                      <td className="p-3 font-bold text-neutral-800">{r.customerName}</td>
                      <td className="p-3 font-extrabold text-[#09090b] font-mono">{r.invoiceNo}</td>
                      <td className="p-3 text-neutral-500 font-mono">{r.invoiceDate}</td>
                      <td className="p-3 text-neutral-500 font-mono">{r.dueDate}</td>
                      <td className="p-3 text-center font-bold text-neutral-500 font-sans">{r.creditDays} Days</td>
                      <td className="p-3 text-center font-extrabold text-green-600 font-sans">{r.ageDays} Days</td>
                      <td className="p-3 text-right text-neutral-600 font-mono">
                        {r.bucket1 > 0 ? 'PKR ' + r.bucket1.toLocaleString('en-PK', { maximumFractionDigits: 0 }) : <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="p-3 text-right text-neutral-600 font-mono">
                        {r.bucket2 > 0 ? 'PKR ' + r.bucket2.toLocaleString('en-PK', { maximumFractionDigits: 0 }) : <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="p-3 text-right text-neutral-600 font-mono">
                        {r.bucket3 > 0 ? 'PKR ' + r.bucket3.toLocaleString('en-PK', { maximumFractionDigits: 0 }) : <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="p-3 text-right text-neutral-600 font-mono">
                        {r.bucket4 > 0 ? 'PKR ' + r.bucket4.toLocaleString('en-PK', { maximumFractionDigits: 0 }) : <span className="text-neutral-300">—</span>}
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#e11d48] font-mono">
                        PKR {r.outstanding.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Columns Totals Summary Row */}
                  <tr className="bg-[#fafafa] font-bold border-t border-[#e4e4e7] text-[10px] uppercase text-[#09090b]">
                    <td className="p-3.5" colSpan={6}>Grand Totals</td>
                    <td className="p-3.5 text-right font-mono">PKR {totalBucket1.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                    <td className="p-3.5 text-right font-mono">PKR {totalBucket2.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                    <td className="p-3.5 text-right font-mono">PKR {totalBucket3.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                    <td className="p-3.5 text-right font-mono">PKR {totalBucket4.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                    <td className="p-3.5 text-right font-mono text-[#e11d48]">PKR {grandTotal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
