import React, { useState, useMemo } from 'react'
import { Eye } from 'lucide-react'

interface Props {
  invoiceVouchers?: any[]
  contacts?: any[]
}

interface MarginItemRow {
  date: string
  invoiceNo: string
  customerName: string
  productName: string
  lotNo: string
  width: string
  length: string
  gsm: string
  location: string
  uom: string
  weight: number
  saleRate: number
  saleAmount: number
  costRate: number
  costAmount: number
  profit: number
  marginPercent: number
}

export function GrossMarginReport({ invoiceVouchers = [], contacts = [] }: Props) {
  const [selectedAccount, setSelectedAccount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterWidth, setFilterWidth] = useState('')
  const [filterLength, setFilterLength] = useState('')
  const [filterGsm, setFilterGsm] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [showReport, setShowReport] = useState(false)

  const activeContacts = contacts.filter(c => c.isActive !== false)

  // ── Derive unique dropdown values from all invoice items ──────────────────
  const allItems = useMemo(() => {
    const rows: any[] = []
    invoiceVouchers.forEach(v => {
      ;(v.items || []).forEach((it: any) => rows.push({ ...it, _invoice: v }))
    })
    return rows
  }, [invoiceVouchers])

  const uniqueWidths = useMemo(
    () => [...new Set(allItems.map(it => it.width).filter(Boolean))].sort(),
    [allItems]
  )
  const uniqueLengths = useMemo(
    () => [...new Set(allItems.map(it => it.length).filter(Boolean))].sort(),
    [allItems]
  )
  const uniqueGsms = useMemo(
    () => [...new Set(allItems.map(it => it.gsm).filter(Boolean))].sort((a, b) => Number(a) - Number(b)),
    [allItems]
  )
  const uniqueLocations = useMemo(
    () => [...new Set(allItems.map(it => it.location).filter(Boolean))].sort(),
    [allItems]
  )

  // ── Build filtered margin rows ────────────────────────────────────────────
  const marginRows = useMemo((): MarginItemRow[] => {
    const rows: MarginItemRow[] = []

    invoiceVouchers.forEach(v => {
      if (selectedAccount && v.accountName !== selectedAccount) return
      if (startDate && v.date && v.date < startDate) return
      if (endDate && v.date && v.date > endDate) return

      ;(v.items || []).forEach((it: any) => {
        if (filterWidth && String(it.width) !== filterWidth) return
        if (filterLength && String(it.length) !== filterLength) return
        if (filterGsm && String(it.gsm) !== filterGsm) return
        if (filterLocation && String(it.location) !== filterLocation) return

        const weight = Number(it.quantity) || 0
        const saleRate = Number(it.saleRate) || 0
        const saleAmount = Number(it.saleAmount) || 0
        const costRate = Number(it.costRate) || 0
        const costAmount = weight * costRate
        const profit = saleAmount - costAmount
        const marginPercent = saleAmount > 0 ? (profit / saleAmount) * 100 : 0

        rows.push({
          date: v.date || '',
          invoiceNo: v.voucherNo,
          customerName: v.accountName || 'Unknown',
          productName: it.productName || '—',
          lotNo: it.lotNo || '—',
          width: it.width || '—',
          length: it.length || '—',
          gsm: it.gsm || '—',
          location: it.location || '—',
          uom: it.uom || 'KGS',
          weight,
          saleRate,
          saleAmount,
          costRate,
          costAmount,
          profit,
          marginPercent
        })
      })
    })

    return rows.sort((a, b) => a.date.localeCompare(b.date))
  }, [invoiceVouchers, selectedAccount, startDate, endDate, filterWidth, filterLength, filterGsm, filterLocation])

  // ── Summary Metrics ───────────────────────────────────────────────────────
  const totalWeight    = marginRows.reduce((s, r) => s + r.weight, 0)
  const totalSalesVal  = marginRows.reduce((s, r) => s + r.saleAmount, 0)
  const totalCostCOGS  = marginRows.reduce((s, r) => s + r.costAmount, 0)
  const estimatedGP    = totalSalesVal - totalCostCOGS
  const gpPercentage   = totalSalesVal > 0 ? (estimatedGP / totalSalesVal) * 100 : 0

  const resetFilters = () => {
    setSelectedAccount('')
    setStartDate('')
    setEndDate('')
    setFilterWidth('')
    setFilterLength('')
    setFilterGsm('')
    setFilterLocation('')
    setShowReport(false)
  }

  // ── Print Preview ─────────────────────────────────────────────────────────
  const handlePrintReport = () => {
    const origin = window.location.origin
    const win = window.open('', '_blank', 'width=1200,height=780,resizable=yes')
    if (!win) { alert('Popup blocked! Please allow popups for this app.'); return }

    const filterLabel = [
      selectedAccount && `Customer: ${selectedAccount}`,
      startDate && `From: ${startDate}`,
      endDate && `To: ${endDate}`,
      filterWidth && `Width: ${filterWidth}`,
      filterLength && `Length: ${filterLength}`,
      filterGsm && `GSM: ${filterGsm}`,
      filterLocation && `Location: ${filterLocation}`
    ].filter(Boolean).join(' | ') || 'All Dates / All Specs'

    const rowsHtml = marginRows.map((r, i) => `
      <tr style="${i % 2 === 0 ? '' : 'background:#fafafa;'}">
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; color:#52525b; font-family:monospace; font-size:10px;">${r.date}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; font-weight:800; font-family:monospace; font-size:10px;">${r.invoiceNo}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; font-weight:700;">${r.customerName}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7;">${r.productName}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; text-align:center;">${r.width} × ${r.length}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; text-align:center;">${r.gsm}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; text-align:center;">${r.location}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; text-align:right; font-weight:700; color:#16a34a; font-family:monospace;">${r.weight.toLocaleString('en-PK')} ${r.uom}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; text-align:right; font-family:monospace;">PKR ${r.saleRate.toLocaleString('en-PK')}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; text-align:right; font-weight:700; font-family:monospace;">PKR ${r.saleAmount.toLocaleString('en-PK')}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; text-align:right; color:#71717a; font-family:monospace;">PKR ${r.costRate.toLocaleString('en-PK')}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; text-align:right; color:#71717a; font-family:monospace;">PKR ${r.costAmount.toLocaleString('en-PK')}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; text-align:right; font-weight:700; color:${r.profit >= 0 ? '#16a34a' : '#e11d48'}; font-family:monospace;">PKR ${r.profit.toLocaleString('en-PK')}</td>
        <td style="padding:7px 8px; border-bottom:1px solid #e4e4e7; text-align:right; font-weight:800; font-family:monospace;">${r.marginPercent.toFixed(1)}%</td>
      </tr>
    `).join('')

    win.document.write(`
      <html>
        <head>
          <title>Gross Margin Report — PAPSoft ERP</title>
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
            .slip-label { font-size:9px; text-transform:uppercase; color:#71717a; font-weight:800; margin-bottom:2px; }
            .slip-val { font-size:11px; font-weight:700; color:#09090b; }
            table { width:100%; border-collapse:collapse; margin-top:15px; font-size:11px; }
            th, td { border-bottom:1px solid #e4e4e7; padding:10px; text-align:left; }
            th { background:#fafafa; font-weight:800; color:#71717a; text-transform:uppercase; font-size:9px; letter-spacing:0.5px; }
            th.num, td.num { text-align:right; }
            tfoot { font-weight:bold; background:#fafafa; border-top:2px solid #09090b; border-bottom:2px solid #09090b; }
            tfoot td { padding:10px; }
            @media print { .header-bar { display:none; } .doc { padding:0; } }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="app-title">
              <img class="app-icon" src="${origin}/favicon.png" />
              <span>Gross Margin Report</span>
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
                <div style="font-size:11px; color:#71717a; margin-top:2px;">Sales Profitability & COGS Statement</div>
              </div>
              <div style="text-align:right;">
                <div class="voucher-title">Gross Margin Report</div>
                <div style="margin-top:8px; display:flex; gap:24px; justify-content:flex-end;">
                  <div><div class="slip-label">Filters Applied</div><div class="slip-val">${filterLabel}</div></div>
                  <div><div class="slip-label">Generated</div><div class="slip-val">2026-07-12</div></div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th class="num">Size W×L</th>
                  <th class="num">GSM</th>
                  <th>Location</th>
                  <th class="num">Qty/Wt</th>
                  <th class="num">Sale Rate</th>
                  <th class="num">Sale Amt</th>
                  <th class="num">Cost Rate</th>
                  <th class="num">COGS</th>
                  <th class="num">Profit</th>
                  <th class="num">GP%</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
              <tfoot>
                <tr>
                  <td colspan="7">Grand Totals (${marginRows.length} line items)</td>
                  <td style="text-align:right; color:#16a34a;">${totalWeight.toLocaleString('en-PK')}</td>
                  <td></td>
                  <td style="text-align:right;">PKR ${totalSalesVal.toLocaleString('en-PK')}</td>
                  <td></td>
                  <td style="text-align:right; color:#71717a;">PKR ${totalCostCOGS.toLocaleString('en-PK')}</td>
                  <td style="text-align:right; color:#16a34a;">PKR ${estimatedGP.toLocaleString('en-PK')}</td>
                  <td style="text-align:right;">${gpPercentage.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </body>
      </html>
    `)
    win.document.close()
  }

  const hasFilters = selectedAccount || startDate || endDate || filterWidth || filterLength || filterGsm || filterLocation

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4 font-sans text-xs text-[#09090b]">

      {/* HEADER BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-[#09090b] font-sifonn">Gross Margin Report</h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[9px] font-bold text-neutral-500 font-mono uppercase">
            As of: 2026-07-12
          </span>
        </div>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-[9px] font-bold text-neutral-400 hover:text-red-600 transition-colors cursor-pointer uppercase tracking-wider"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* FILTER PANEL */}
      <div className="p-4 border border-[#e4e4e7] rounded-xl bg-[#fafafa]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">

          {/* Customer Account */}
          <div className="col-span-2">
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Customer Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => { setSelectedAccount(e.target.value); setShowReport(false) }}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white font-semibold"
            >
              <option value="">— All Customers —</option>
              {activeContacts.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setShowReport(false) }}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setShowReport(false) }}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white"
            />
          </div>

          {/* Width */}
          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Width</label>
            <input
              type="text"
              placeholder="e.g. 52"
              value={filterWidth}
              onChange={(e) => { setFilterWidth(e.target.value); setShowReport(false) }}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white"
            />
          </div>

          {/* Length */}
          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Length</label>
            <input
              type="text"
              placeholder="e.g. 72"
              value={filterLength}
              onChange={(e) => { setFilterLength(e.target.value); setShowReport(false) }}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white"
            />
          </div>

          {/* GSM */}
          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">GSM</label>
            <input
              type="text"
              placeholder="e.g. 100"
              value={filterGsm}
              onChange={(e) => { setFilterGsm(e.target.value); setShowReport(false) }}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Location</label>
            <select
              value={filterLocation}
              onChange={(e) => { setFilterLocation(e.target.value); setShowReport(false) }}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#e4e4e7]">
          <button
            onClick={() => setShowReport(true)}
            className="h-9 px-6 bg-black text-white hover:bg-neutral-800 transition-all font-bold text-xs rounded-md cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider font-sifonn shadow-xs"
          >
            Show Report
          </button>
          {showReport && marginRows.length > 0 && (
            <button
              onClick={handlePrintReport}
              className="h-9 px-5 bg-[#fafafa] border border-[#e4e4e7] text-neutral-700 hover:text-black hover:bg-[#f4f4f5] transition-all font-bold text-xs rounded-md cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider font-sifonn"
            >
              <Eye size={13} />
              Print Report
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      {showReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-[#e4e4e7] bg-[#fafafa] p-5 rounded-xl">
            <span className="text-[9px] text-[#71717a] font-bold uppercase tracking-wider">Gross Sales Value</span>
            <div className="text-xl font-bold mt-1 text-[#09090b]">
              PKR {totalSalesVal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[9px] text-neutral-400 mt-0.5 font-mono">
              {totalWeight.toLocaleString('en-PK')} units / weight sold
            </div>
          </div>
          <div className="border border-[#e4e4e7] bg-[#fafafa] p-5 rounded-xl">
            <span className="text-[9px] text-[#71717a] font-bold uppercase tracking-wider">Material Cost (COGS)</span>
            <div className="text-xl font-bold mt-1 text-[#09090b]">
              PKR {totalCostCOGS.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[9px] text-neutral-400 mt-0.5 font-mono">
              {marginRows.length} line items across {[...new Set(marginRows.map(r => r.invoiceNo))].length} invoices
            </div>
          </div>
          <div className="border border-[#e4e4e7] bg-[#fafafa] p-5 rounded-xl">
            <span className="text-[9px] text-[#71717a] font-bold uppercase tracking-wider">Estimated Gross Profit</span>
            <div className={`text-xl font-bold mt-1 ${estimatedGP >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
              PKR {estimatedGP.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[9px] text-neutral-400 mt-0.5 font-mono">
              GP Margin: {gpPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* DETAILED DATA TABLE */}
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white min-h-[160px]">
        {!showReport ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400 py-16 h-full">
            <span className="font-semibold text-xs mb-1 text-neutral-500">No Report Generated</span>
            <span className="text-[10px] text-neutral-400 max-w-[300px] leading-relaxed">
              Use the filters above to narrow by Customer, Width, Length, GSM, or Location — or leave all blank for a consolidated total. Then click <strong>Show Report</strong>.
            </span>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs text-[#09090b]">
            <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
              <tr>
                <th className="p-3 w-28">Date</th>
                <th className="p-3 w-28">Invoice No</th>
                <th className="p-3">Customer Account</th>
                <th className="p-3">Item / Product</th>
                <th className="p-3 text-center w-24">Size (W×L)</th>
                <th className="p-3 text-center w-16">GSM</th>
                <th className="p-3 w-28">Location</th>
                <th className="p-3 text-right w-28">Qty / Weight</th>
                <th className="p-3 text-right w-24">Sale Rate</th>
                <th className="p-3 text-right w-28">Sale Amount</th>
                <th className="p-3 text-right w-24">Cost Rate</th>
                <th className="p-3 text-right w-28">COGS</th>
                <th className="p-3 text-right w-28">Profit</th>
                <th className="p-3 text-right w-16">GP%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7]">
              {marginRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-[#71717a] py-12 italic">
                    No sales invoices found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                <>
                  {marginRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 font-medium">
                      <td className="p-3 text-neutral-500 font-mono">{r.date}</td>
                      <td className="p-3 font-extrabold text-[#09090b] font-mono">{r.invoiceNo}</td>
                      <td className="p-3 font-bold text-neutral-800">{r.customerName}</td>
                      <td className="p-3 text-neutral-600">{r.productName}</td>
                      <td className="p-3 text-center font-mono text-neutral-500">{r.width} × {r.length}</td>
                      <td className="p-3 text-center font-mono text-neutral-500">{r.gsm}</td>
                      <td className="p-3 text-neutral-500">{r.location}</td>
                      <td className="p-3 text-right font-extrabold text-green-700 font-mono">
                        {r.weight.toLocaleString('en-PK')}
                        <span className="text-[9px] text-neutral-400 font-normal ml-0.5">{r.uom}</span>
                      </td>
                      <td className="p-3 text-right text-neutral-500 font-mono">PKR {r.saleRate.toLocaleString('en-PK')}</td>
                      <td className="p-3 text-right font-bold text-neutral-800 font-mono">PKR {r.saleAmount.toLocaleString('en-PK')}</td>
                      <td className="p-3 text-right text-neutral-400 font-mono">PKR {r.costRate.toLocaleString('en-PK')}</td>
                      <td className="p-3 text-right text-neutral-400 font-mono">PKR {r.costAmount.toLocaleString('en-PK')}</td>
                      <td className={`p-3 text-right font-bold font-mono ${r.profit >= 0 ? 'text-green-700' : 'text-rose-600'}`}>
                        PKR {r.profit.toLocaleString('en-PK')}
                      </td>
                      <td className={`p-3 text-right font-extrabold font-mono ${r.marginPercent >= 0 ? 'text-green-700' : 'text-rose-600'}`}>
                        {r.marginPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}

                  {/* Grand Totals Row */}
                  <tr className="bg-[#fafafa] border-t-2 border-[#e4e4e7] font-bold text-[10px] text-[#09090b] uppercase">
                    <td className="p-3.5" colSpan={7}>
                      Grand Totals — {marginRows.length} line items / {[...new Set(marginRows.map(r => r.invoiceNo))].length} invoices
                    </td>
                    <td className="p-3.5 text-right font-mono text-green-700">
                      {totalWeight.toLocaleString('en-PK')}
                    </td>
                    <td className="p-3.5" />
                    <td className="p-3.5 text-right font-mono">PKR {totalSalesVal.toLocaleString('en-PK')}</td>
                    <td className="p-3.5" />
                    <td className="p-3.5 text-right font-mono text-neutral-500">PKR {totalCostCOGS.toLocaleString('en-PK')}</td>
                    <td className="p-3.5 text-right font-mono text-green-700">PKR {estimatedGP.toLocaleString('en-PK')}</td>
                    <td className="p-3.5 text-right font-mono">{gpPercentage.toFixed(1)}%</td>
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
