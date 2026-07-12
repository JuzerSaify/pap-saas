import React, { useState, useEffect } from 'react'
import { Printer, FileText, Landmark, Scale, Calendar, AlertCircle } from 'lucide-react'
import { ReceiptRecord } from './Receipt'
import { PaymentRecord } from './Payment'

interface Props {
  inwardVouchers?: any[]
  invoiceVouchers?: any[]
  receipts?: ReceiptRecord[]
  payments?: PaymentRecord[]
  journalVouchers?: any[]
  contacts?: any[]
}

interface PostingRow {
  id: string | number
  date: string
  particulars: string
  voucherNo: string
  debit: number
  credit: number
  accountName: string
}

export function LedgerReport({
  inwardVouchers = [],
  invoiceVouchers = [],
  receipts = [],
  payments = [],
  journalVouchers = [],
  contacts = []
}: Props) {
  // ── States ──────────────────────────────────────────────────────────────────
  const [reportType, setReportType] = useState<'trial' | 'subsidiary' | 'general'>('trial')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // ── Compiled Reports ────────────────────────────────────────────────────────
  const [hasShown, setHasShown] = useState(false)
  const [activeReportType, setActiveReportType] = useState<'trial' | 'subsidiary' | 'general'>('trial')
  const [compiledData, setCompiledData] = useState<any[]>([])

  // Helper: parse string formatting like 'PKR 1,500' to number
  const parsePkrAmount = (val: any): number => {
    if (typeof val === 'number') return val
    if (!val) return 0
    const cleaned = String(val).replace(/[^\d.]/g, '')
    return parseFloat(cleaned) || 0
  }

  // Helper: check if date is in range
  const isDateInRange = (dateStr: string): boolean => {
    if (!dateStr) return true
    if (startDate && dateStr < startDate) return false
    if (endDate && dateStr > endDate) return false
    return true
  }

  // ── Show Report Handler ──────────────────────────────────────────────────────
  const handleShowReport = () => {
    // 1. GATHER ALL DOUBLE-ENTRY TRANSACTION POSTINGS
    const postings: PostingRow[] = []

    // ── INVOICES -> DEBIT CUSTOMERS & CREDIT SALES REVENUE, DEBIT COGS & CREDIT STOCK-IN-HAND ──
    invoiceVouchers.forEach(v => {
      if (!isDateInRange(v.date)) return
      const totalAmount = (v.items || []).reduce((s: number, it: any) => s + (Number(it.saleAmount) || 0), 0)
      
      // Debit Customer (Sale Amount) - Receivable Asset
      postings.push({
        id: `INV-DR-${v.voucherNo}-${v.id || Date.now()}`,
        date: v.date || '',
        particulars: `Sales Invoice - ${v.narration || 'Billed Goods'}`,
        voucherNo: v.voucherNo,
        debit: totalAmount,
        credit: 0,
        accountName: v.accountName || 'Unknown'
      })

      // Credit Sales Revenue (Sale Amount) - Revenue
      postings.push({
        id: `INV-CR-REV-${v.voucherNo}-${v.id || Date.now()}`,
        date: v.date || '',
        particulars: `Sales Revenue - Ref: ${v.voucherNo}`,
        voucherNo: v.voucherNo,
        debit: 0,
        credit: totalAmount,
        accountName: 'Sales Revenue Account'
      })

      // Cost of Goods Sold vs. Inventory Stock asset reduction
      if (v.items && Array.isArray(v.items)) {
        v.items.forEach((it: any, itemIdx: number) => {
          const costAmount = (Number(it.quantity) || 0) * (Number(it.costRate) || 0)
          const stockAccount = it.accountName || 'Stock in Hand' // Stock-in-hand account lot belongs to
          
          // Debit Cost of Goods Sold (Cost Amount) - Expense
          postings.push({
            id: `INV-DR-COGS-${v.voucherNo}-${itemIdx}`,
            date: v.date || '',
            particulars: `Cost of Goods Sold - Lot: ${it.lotNo || ''}`,
            voucherNo: v.voucherNo,
            debit: costAmount,
            credit: 0,
            accountName: 'Cost of Goods Sold'
          })

          // Credit Stock in Hand (Cost Amount) - Inventory Asset Reduction
          postings.push({
            id: `INV-CR-STOCK-${v.voucherNo}-${itemIdx}`,
            date: v.date || '',
            particulars: `Inventory Credit (COGS) - Lot: ${it.lotNo || ''}`,
            voucherNo: v.voucherNo,
            debit: 0,
            credit: costAmount,
            accountName: stockAccount
          })
        })
      }
    })

    // ── PAYMENTS -> DEBIT SUPPLIERS & CREDIT CASH/BANK ──
    payments.forEach(p => {
      if (!isDateInRange(p.date)) return
      
      const lines = p.lines || [
        {
          party: p.party,
          amount: parsePkrAmount(p.amount)
        }
      ]
      
      lines.forEach((line: any, lineIdx: number) => {
        const amt = Number(line.amount) || 0
        const isCash = String(p.mode).toLowerCase().includes('cash')
        const counterAccount = isCash ? 'Cash-in-hand' : 'Bank Account'
        const vouNo = p.voucherNo || `PAY:${String(p.id).slice(-5)}`

        // Leg A: Debit Supplier Account (reduces payable liability)
        postings.push({
          id: `PMT-DR-${p.id}-${lineIdx}`,
          date: p.date || '',
          particulars: `Payment Posted (${p.mode})${line.particulars ? ` - ${line.particulars}` : ''}`,
          voucherNo: vouNo,
          debit: amt,
          credit: 0,
          accountName: line.party
        })

        // Leg B: Credit Cash/Bank asset account (reduces cash assets)
        postings.push({
          id: `PMT-CR-${p.id}-${lineIdx}`,
          date: p.date || '',
          particulars: `Payment Paid to ${line.party}`,
          voucherNo: vouNo,
          debit: 0,
          credit: amt,
          accountName: counterAccount
        })
      })
    })

    // ── RECEIPTS -> CREDIT CUSTOMERS & DEBIT CASH/BANK ──
    receipts.forEach(r => {
      if (!isDateInRange(r.date)) return
      const lines = r.lines || [
        {
          party: r.party,
          amount: Number(String(r.amount).replace(/[^\d.]/g, '')) || 0,
          invoiceNo: r.invoiceNo
        }
      ]
      
      lines.forEach((line: any, lineIdx: number) => {
        const amt = Number(line.amount) || 0
        const isCash = String(r.mode).toLowerCase().includes('cash')
        const counterAccount = isCash ? 'Cash-in-hand' : 'Bank Account'

        // Leg A: Credit Customer Account (reduces receivable asset)
        postings.push({
          id: `REC-CR-${r.id}-${lineIdx}`,
          date: r.date || '',
          particulars: `Receipt Posted (${r.mode})${line.invoiceNo ? ` - Offset: ${line.invoiceNo}` : ''}${line.particulars ? ` - ${line.particulars}` : ''}`,
          voucherNo: r.voucherNo || `RCT:${String(r.id).slice(-5)}`,
          debit: 0,
          credit: amt,
          accountName: line.party
        })

        // Leg B: Debit Cash/Bank asset account (increases cash assets)
        postings.push({
          id: `REC-DR-${r.id}-${lineIdx}`,
          date: r.date || '',
          particulars: `Receipt Received from ${line.party}${line.invoiceNo ? ` - Ref: ${line.invoiceNo}` : ''}`,
          voucherNo: r.voucherNo || `RCT:${String(r.id).slice(-5)}`,
          debit: amt,
          credit: 0,
          accountName: counterAccount
        })
      })
    })

    // ── JOURNAL VOUCHERS -> MULTI-LINE Dr / Cr POSTINGS ──
    journalVouchers.forEach(jv => {
      if (!isDateInRange(jv.date)) return

      if (jv.lines && Array.isArray(jv.lines)) {
        jv.lines.forEach((line: any, idxIndex: number) => {
          const amt = Number(line.amount) || 0
          const isDr = line.type === 'Dr'
          
          postings.push({
            id: `JV-LINE-${jv.id}-${idxIndex}`,
            date: jv.date || '',
            particulars: line.particulars || jv.narration || 'Journal Adjustment Posting',
            voucherNo: jv.voucherNo,
            debit: isDr ? amt : 0,
            credit: isDr ? 0 : amt,
            accountName: line.accountName
          })
        })
      } else {
        // Fallback for legacy simple format if any exists
        const amt = Number(jv.amount) || 0
        if (jv.debitAccount) {
          postings.push({
            id: `JV-DR-${jv.id}`,
            date: jv.date || '',
            particulars: `JV Debit Posting - ${jv.narration || ''}`,
            voucherNo: jv.voucherNo,
            debit: amt,
            credit: 0,
            accountName: jv.debitAccount
          })
        }
        if (jv.creditAccount) {
          postings.push({
            id: `JV-CR-${jv.id}`,
            date: jv.date || '',
            particulars: `JV Credit Posting - ${jv.narration || ''}`,
            voucherNo: jv.voucherNo,
            debit: 0,
            credit: amt,
            accountName: jv.creditAccount
          })
        }
      }
    })

    // Sort postings chronologically by date
    postings.sort((a, b) => a.date.localeCompare(b.date))

    // 2. BUILD THE SELECTIVE REPORT TEMPLATE DATA
    if (reportType === 'trial') {
      // Gather active accounts in system
      const trialMap = new Map<string, { accountName: string; debits: number; credits: number }>()

      // Pre-populate with all system contacts
      contacts.forEach(c => {
        trialMap.set(c.name, { accountName: c.name, debits: 0, credits: 0 })
      })

      // Aggregate postings
      postings.forEach(p => {
        if (!trialMap.has(p.accountName)) {
          trialMap.set(p.accountName, { accountName: p.accountName, debits: 0, credits: 0 })
        }
        const row = trialMap.get(p.accountName)!
        row.debits += p.debit
        row.credits += p.credit
      })

      // Convert to array and filter out accounts with zero activity
      const trialReport = Array.from(trialMap.values()).map(row => {
        const net = row.debits - row.credits
        return {
          ...row,
          netDr: net > 0 ? net : 0,
          netCr: net < 0 ? Math.abs(net) : 0
        }
      }).filter(r => r.debits > 0 || r.credits > 0)

      setCompiledData(trialReport)
    } else if (reportType === 'subsidiary') {
      if (!selectedAccount) {
        alert('Please select an Account to show the subsidiary ledger.')
        return
      }

      // Filter postings to selected account
      const accountPostings = postings.filter(p => p.accountName === selectedAccount)

      // Calculate running balance
      let currentBal = 0
      const ledgerRows = accountPostings.map(p => {
        currentBal += (p.debit - p.credit)
        return {
          ...p,
          runningBalance: currentBal
        }
      })

      setCompiledData(ledgerRows)
    } else if (reportType === 'general') {
      setCompiledData(postings)
    }

    setActiveReportType(reportType)
    setHasShown(true)
  }

  // ── Preview Layout Popup ─────────────────────────────────────────────────────
  const handlePreviewReport = () => {
    const origin = window.location.origin
    const popup = window.open('', 'LedgerReportPreview', 'width=1100,height=750,resizable=yes')
    if (!popup) return

    let tableHtml = ''
    let title = ''

    if (activeReportType === 'trial') {
      title = 'Trial Balance'
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Account Name</th>
              <th class="text-right">Total Debits (Dr)</th>
              <th class="text-right">Total Credits (Cr)</th>
              <th class="text-right">Net Debit (Dr)</th>
              <th class="text-right">Net Credit (Cr)</th>
            </tr>
          </thead>
          <tbody>
            ${compiledData.map((r: any) => `
              <tr>
                <td style="font-weight:700;">${r.accountName}</td>
                <td class="text-right">${r.debits.toLocaleString('en-PK')}</td>
                <td class="text-right">${r.credits.toLocaleString('en-PK')}</td>
                <td class="text-right" style="font-weight:bold;color:${r.netDr > 0 ? '#09090b' : '#71717a'};">
                  ${r.netDr > 0 ? r.netDr.toLocaleString('en-PK') : '-'}
                </td>
                <td class="text-right" style="font-weight:bold;color:${r.netCr > 0 ? '#e11d48' : '#71717a'};">
                  ${r.netCr > 0 ? r.netCr.toLocaleString('en-PK') : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td>Grand Totals</td>
              <td class="text-right">${compiledData.reduce((s: number, r: any) => s + r.debits, 0).toLocaleString('en-PK')}</td>
              <td class="text-right">${compiledData.reduce((s: number, r: any) => s + r.credits, 0).toLocaleString('en-PK')}</td>
              <td class="text-right" style="color:#16a34a;font-size:12px;">${compiledData.reduce((s: number, r: any) => s + r.netDr, 0).toLocaleString('en-PK')}</td>
              <td class="text-right" style="color:#e11d48;font-size:12px;">${compiledData.reduce((s: number, r: any) => s + r.netCr, 0).toLocaleString('en-PK')}</td>
            </tr>
          </tfoot>
        </table>
      `
    } else if (activeReportType === 'subsidiary') {
      title = `Subsidiary Ledger - ${selectedAccount}`
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Voucher Ref</th>
              <th>Particulars</th>
              <th class="text-right">Debit (Dr)</th>
              <th class="text-right">Credit (Cr)</th>
              <th class="text-right">Running Balance</th>
            </tr>
          </thead>
          <tbody>
            ${compiledData.map((r: any) => `
              <tr>
                <td style="font-family:monospace;color:#52525b;">${r.date}</td>
                <td style="font-weight:bold;color:#71717a;">${r.voucherNo}</td>
                <td>${r.particulars}</td>
                <td class="text-right" style="font-weight:600;color:#09090b;">${r.debit > 0 ? r.debit.toLocaleString('en-PK') : '-'}</td>
                <td class="text-right" style="font-weight:600;color:#16a34a;">${r.credit > 0 ? r.credit.toLocaleString('en-PK') : '-'}</td>
                <td class="text-right" style="font-weight:bold;color:${r.runningBalance >= 0 ? '#16a34a' : '#e11d48'};">
                  ${r.runningBalance >= 0 ? 'Dr ' : 'Cr '}${Math.abs(r.runningBalance).toLocaleString('en-PK')}
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">Ledger Totals</td>
              <td class="text-right">${compiledData.reduce((s: number, r: any) => s + r.debit, 0).toLocaleString('en-PK')}</td>
              <td class="text-right">${compiledData.reduce((s: number, r: any) => s + r.credit, 0).toLocaleString('en-PK')}</td>
              <td class="text-right" style="font-size:12px;">
                ${compiledData[compiledData.length - 1]?.runningBalance >= 0 ? 'Dr ' : 'Cr '}
                ${Math.abs(compiledData[compiledData.length - 1]?.runningBalance || 0).toLocaleString('en-PK')}
              </td>
            </tr>
          </tfoot>
        </table>
      `
    } else if (activeReportType === 'general') {
      title = 'General Ledger Consolidated Journal'
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Account Name</th>
              <th>Voucher Ref</th>
              <th>Particulars</th>
              <th class="text-right">Debit (Dr)</th>
              <th class="text-right">Credit (Cr)</th>
            </tr>
          </thead>
          <tbody>
            ${compiledData.map((r: any) => `
              <tr>
                <td style="font-family:monospace;color:#52525b;">${r.date}</td>
                <td style="font-weight:bold;">${r.accountName}</td>
                <td style="color:#71717a;">${r.voucherNo}</td>
                <td>${r.particulars}</td>
                <td class="text-right" style="font-weight:600;">${r.debit > 0 ? r.debit.toLocaleString('en-PK') : '-'}</td>
                <td class="text-right" style="font-weight:600;color:#16a34a;">${r.credit > 0 ? r.credit.toLocaleString('en-PK') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">Grand Book Totals</td>
              <td class="text-right">${compiledData.reduce((s: number, r: any) => s + r.debit, 0).toLocaleString('en-PK')}</td>
              <td class="text-right">${compiledData.reduce((s: number, r: any) => s + r.credit, 0).toLocaleString('en-PK')}</td>
            </tr>
          </tfoot>
        </table>
      `
    }

    popup.document.write(`
      <html>
        <head>
          <title>${title}</title>
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
            .doc { max-width:100%; margin:0; background:transparent; padding:30px; }
            .doc-header { display:flex; justify-content:space-between; margin-bottom:20px; }
            .company-name { font-size:18px; font-weight:800; letter-spacing:0.5px; margin-bottom:4px; }
            .company-sub { font-size:10px; color:#71717a; }
            .voucher-no { font-size:14px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; }
            .voucher-date { font-size:11px; color:#71717a; margin-top:2px; }
            table { width:100%; border-collapse:collapse; margin-top:15px; font-size:11px; }
            th, td { border-bottom:1px solid #e4e4e7; padding:10px; text-align:left; }
            th { background:#fafafa; font-weight:800; color:#71717a; text-transform:uppercase; font-size:9px; letter-spacing:0.5px; }
            .text-right { text-align:right; }
            tfoot { font-weight:bold; background:#fafafa; border-top:2px solid #e4e4e7; }
            @media print { .header-bar { display:none; } .doc { padding:0; } }
          </style>
        </head>
        <body>
          <div class="header-bar" style="-webkit-app-region:drag;">
            <div class="app-title">
              <img class="app-icon" src="${origin}/favicon.png" />
              <span>Ledger Statement</span>
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
                <div class="voucher-no">${title}</div>
                <div class="voucher-date">Statement Date: ${new Date().toLocaleDateString('en-PK')}</div>
                ${startDate || endDate ? `<div style="font-size:9px;color:#71717a;margin-top:2px;">Range: ${startDate || 'Start'} to ${endDate || 'End'}</div>` : ''}
              </div>
            </div>

            ${tableHtml}
          </div>
        </body>
      </html>
    `)
    popup.document.close()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4 font-sans text-xs text-[#09090b]">
      
      {/* FILTER & CRITERIA CONTROL PANEL */}
      <div className="p-4 border border-[#e4e4e7] rounded-xl bg-[#fafafa] flex flex-wrap gap-4 items-end">
        
        {/* Report Type Selector */}
        <div className="w-48">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
            Ledger Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white font-semibold"
          >
            <option value="trial">Trial Balance Statement</option>
            <option value="subsidiary">Subsidiary Ledger (Account Wise)</option>
            <option value="general">General Ledger Consolidated Journal</option>
          </select>
        </div>

        {/* Account Selection (Only for Subsidiary Ledger) */}
        {reportType === 'subsidiary' && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
              Select Subsidiary Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              required
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white text-neutral-800 font-bold"
            >
              <option value="">— Select Account Name —</option>
              {contacts.map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>
        )}

        {/* Date Filters */}
        <div className="w-36">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={10} />
            <span>Start Date</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white"
          />
        </div>

        <div className="w-36">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={10} />
            <span>End Date</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white"
          />
        </div>

        {/* Trigger buttons */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleShowReport}
            className="h-9 px-5 bg-black text-white font-bold text-xs rounded-md hover:bg-neutral-800 transition-all cursor-pointer shadow-sm uppercase tracking-wider font-sifonn"
          >
            SHOW LEDGER
          </button>
          
          {hasShown && compiledData.length > 0 && (
            <button
              onClick={handlePreviewReport}
              className="h-9 px-4 border border-[#e4e4e7] rounded-md hover:bg-neutral-100 font-bold text-[10px] text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer flex items-center gap-1.5 uppercase font-sans"
            >
              <Printer size={13} />
              <span>PREVIEW STATEMENT</span>
            </button>
          )}
        </div>

      </div>

      {/* RENDER SHEETS */}
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white min-h-[300px]">
        {!hasShown ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400 h-full">
            <Scale size={48} className="text-neutral-300 stroke-[1] mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Double-Entry Ledger Unloaded
            </p>
            <p className="text-[10px] text-neutral-400 mt-1 max-w-[280px]">
              Select Trial Balance, Subsidiary, or General journals, define date scopes, and click **SHOW LEDGER** to compile financial summaries.
            </p>
          </div>
        ) : compiledData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400 h-full">
            <AlertCircle size={48} className="text-amber-500 stroke-[1.2] mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              No Posting Records Found
            </p>
            <p className="text-[10px] text-neutral-400 mt-1 max-w-[280px]">
              No transactions matching the criteria were logged. Ensure Inwards, Invoices, Receipts, or Payments are recorded.
            </p>
          </div>
        ) : (
          <>
            {/* TABS SHEET 1: TRIAL BALANCE */}
            {activeReportType === 'trial' && (
              <table className="w-full border-collapse text-left text-xs text-[#09090b]">
                <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
                  <tr>
                    <th className="p-3">Account Title / Ledger</th>
                    <th className="p-3 text-right">Debit Postings (Dr)</th>
                    <th className="p-3 text-right">Credit Postings (Cr)</th>
                    <th className="p-3 text-right">Net Dr Balance</th>
                    <th className="p-3 text-right">Net Cr Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e4e7]">
                  {compiledData.map((r, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="p-3 font-bold text-neutral-800">{r.accountName}</td>
                      <td className="p-3 text-right text-neutral-500">PKR {r.debits.toLocaleString('en-PK')}</td>
                      <td className="p-3 text-right text-neutral-500">PKR {r.credits.toLocaleString('en-PK')}</td>
                      <td className="p-3 text-right font-bold text-neutral-800">
                        {r.netDr > 0 ? `PKR ${r.netDr.toLocaleString('en-PK')}` : '—'}
                      </td>
                      <td className="p-3 text-right font-bold text-rose-600">
                        {r.netCr > 0 ? `PKR ${r.netCr.toLocaleString('en-PK')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#fafafa] border-t-2 border-[#e4e4e7] font-bold text-right text-[11px]">
                  <tr>
                    <td className="p-3 text-left uppercase text-[9px] tracking-wider text-[#71717a]">
                      Grand Trial Totals
                    </td>
                    <td className="p-3 text-right">
                      PKR {compiledData.reduce((s, r) => s + r.debits, 0).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3 text-right">
                      PKR {compiledData.reduce((s, r) => s + r.credits, 0).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3 text-right text-emerald-600 text-sm">
                      PKR {compiledData.reduce((s, r) => s + r.netDr, 0).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3 text-right text-rose-600 text-sm">
                      PKR {compiledData.reduce((s, r) => s + r.netCr, 0).toLocaleString('en-PK')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* TABS SHEET 2: SUBSIDIARY LEDGER */}
            {activeReportType === 'subsidiary' && (
              <table className="w-full border-collapse text-left text-xs text-[#09090b]">
                <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
                  <tr>
                    <th className="p-3 w-28">Date</th>
                    <th className="p-3 w-24">Voucher No</th>
                    <th className="p-3">Particulars / Transaction Details</th>
                    <th className="p-3 text-right w-36">Debit (Dr)</th>
                    <th className="p-3 text-right w-36">Credit (Cr)</th>
                    <th className="p-3 text-right w-44">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e4e7]">
                  {compiledData.map((r, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="p-3 text-neutral-500 font-mono">{r.date}</td>
                      <td className="p-3 font-bold text-neutral-700">{r.voucherNo}</td>
                      <td className="p-3 text-neutral-600 font-medium">{r.particulars}</td>
                      <td className="p-3 text-right font-semibold text-neutral-800">
                        {r.debit > 0 ? `PKR ${r.debit.toLocaleString('en-PK')}` : '—'}
                      </td>
                      <td className="p-3 text-right font-semibold text-green-600">
                        {r.credit > 0 ? `PKR ${r.credit.toLocaleString('en-PK')}` : '—'}
                      </td>
                      <td className={`p-3 text-right font-bold ${r.runningBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {r.runningBalance >= 0 ? 'Dr ' : 'Cr '}{Math.abs(r.runningBalance).toLocaleString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#fafafa] border-t-2 border-[#e4e4e7] font-bold text-right text-[11px]">
                  <tr>
                    <td colSpan={3} className="p-3 text-left uppercase text-[9px] tracking-wider text-[#71717a]">
                      Ledger Account Totals
                    </td>
                    <td className="p-3 text-right">
                      PKR {compiledData.reduce((s, r) => s + r.debit, 0).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3 text-right text-green-600">
                      PKR {compiledData.reduce((s, r) => s + r.credit, 0).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3 text-right text-neutral-800 text-sm">
                      {compiledData[compiledData.length - 1]?.runningBalance >= 0 ? 'Dr ' : 'Cr '}
                      {Math.abs(compiledData[compiledData.length - 1]?.runningBalance || 0).toLocaleString('en-PK')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* TABS SHEET 3: GENERAL LEDGER */}
            {activeReportType === 'general' && (
              <table className="w-full border-collapse text-left text-xs text-[#09090b]">
                <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
                  <tr>
                    <th className="p-3 w-28">Date</th>
                    <th className="p-3 w-40">Account Name</th>
                    <th className="p-3 w-28">Voucher Ref</th>
                    <th className="p-3">Particulars</th>
                    <th className="p-3 text-right w-36">Debit (Dr)</th>
                    <th className="p-3 text-right w-36">Credit (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e4e7]">
                  {compiledData.map((r, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="p-3 text-neutral-500 font-mono">{r.date}</td>
                      <td className="p-3 font-bold text-neutral-800">{r.accountName}</td>
                      <td className="p-3 text-neutral-500 font-semibold">{r.voucherNo}</td>
                      <td className="p-3 text-neutral-600">{r.particulars}</td>
                      <td className="p-3 text-right font-semibold text-neutral-800">
                        {r.debit > 0 ? `PKR ${r.debit.toLocaleString('en-PK')}` : '—'}
                      </td>
                      <td className="p-3 text-right font-semibold text-green-600">
                        {r.credit > 0 ? `PKR ${r.credit.toLocaleString('en-PK')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#fafafa] border-t-2 border-[#e4e4e7] font-bold text-right text-[11px]">
                  <tr>
                    <td colSpan={4} className="p-3 text-left uppercase text-[9px] tracking-wider text-[#71717a]">
                      Consolidated Grand Totals
                    </td>
                    <td className="p-3 text-right text-neutral-800">
                      PKR {compiledData.reduce((s, r) => s + r.debit, 0).toLocaleString('en-PK')}
                    </td>
                    <td className="p-3 text-right text-green-600">
                      PKR {compiledData.reduce((s, r) => s + r.credit, 0).toLocaleString('en-PK')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </>
        )}
      </div>

    </div>
  )
}
