import React, { useState, useEffect } from 'react'
import { Search, Eye, FileText, Printer, ShieldAlert } from 'lucide-react'

interface Props {
  inwardVouchers?: any[]
  transferVouchers?: any[]
  invoiceVouchers?: any[]
}

export function InventoryReport({
  inwardVouchers = [],
  transferVouchers = [],
  invoiceVouchers = []
}: Props) {
  // ── Form States ─────────────────────────────────────────────────────────────
  const [reportType, setReportType] = useState<'detailed' | 'product' | 'location'>('detailed')
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('ALL')

  // ── Results State (Calculated on Click of SHOW button) ──────────────────────
  const [displayedData, setDisplayedData] = useState<any[]>([])
  const [hasShown, setHasShown] = useState(false)
  const [activeReportType, setActiveReportType] = useState<'detailed' | 'product' | 'location'>('detailed')

  // ── Extract Godown Locations dynamically ─────────────────────────────────────
  const [godowns, setGodowns] = useState<string[]>([])

  useEffect(() => {
    const locSet = new Set<string>()
    inwardVouchers.forEach(v => {
      (v.items || []).forEach((it: any) => {
        if (it.location) locSet.add(it.location.toUpperCase())
      })
    })
    transferVouchers.forEach(v => {
      (v.items || []).forEach((it: any) => {
        if (it.location) locSet.add(it.location.toUpperCase())
        if (it.fromLocation) locSet.add(it.fromLocation.toUpperCase())
      })
    })
    setGodowns(Array.from(locSet).sort())
  }, [inwardVouchers, transferVouchers])

  // ── Stock Calculation Ledger Compiler ────────────────────────────────────────
  const compileActiveInventory = () => {
    const balances = new Map<string, any>()

    // 1. Inward Addition
    inwardVouchers.forEach(v => {
      (v.items || []).forEach((item: any) => {
        const key = `${item.itemCode}::${(item.location || '').toUpperCase()}`
        if (!balances.has(key)) {
          balances.set(key, {
            ...item,
            quantity: Number(item.quantity) || 0,
            accountName: v.accountName
          })
        } else {
          balances.get(key).quantity += Number(item.quantity) || 0
        }
      })
    })

    // 2. Transfer Deductions & Additions
    transferVouchers.forEach(v => {
      (v.items || []).forEach((item: any) => {
        // Deduct from source godown
        const srcKey = `${item.sourceItemCode}::${(item.fromLocation || '').toUpperCase()}`
        if (balances.has(srcKey)) {
          balances.get(srcKey).quantity -= Number(item.quantity) || 0
        }

        // Add to destination godown
        const dstKey = `${item.itemCode}::${(item.location || '').toUpperCase()}`
        if (!balances.has(dstKey)) {
          balances.set(dstKey, {
            ...item,
            quantity: Number(item.quantity) || 0,
            accountName: item.accountName || '-'
          })
        } else {
          balances.get(dstKey).quantity += Number(item.quantity) || 0
        }
      })
    })

    // 3. Invoice / Sales Deductions
    invoiceVouchers.forEach(v => {
      (v.items || []).forEach((item: any) => {
        const key = `${item.itemCode}::${(item.location || '').toUpperCase()}`
        if (balances.has(key)) {
          balances.get(key).quantity -= Number(item.quantity) || 0
        }
      })
    })

    // Filter out items that are fully out of stock (quantity <= 0)
    return Array.from(balances.values()).filter(b => b.quantity > 0)
  }

  // ── Show Report Trigger ──────────────────────────────────────────────────────
  const handleShowReport = () => {
    const activeStock = compileActiveInventory()

    // Apply Search and Location Filters
    const filtered = activeStock.filter(item => {
      const matchSearch = !searchQuery.trim() || 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.lotNo && item.lotNo.toLowerCase().includes(searchQuery.toLowerCase()))
        
      const matchLocation = locationFilter === 'ALL' || 
        (item.location && item.location.toUpperCase() === locationFilter.toUpperCase())
        
      return matchSearch && matchLocation
    })

    // Group based on report selection
    if (reportType === 'detailed') {
      setDisplayedData(filtered)
    } else if (reportType === 'product') {
      const productGroups = new Map<string, any>()
      filtered.forEach(it => {
        if (!productGroups.has(it.productName)) {
          productGroups.set(it.productName, {
            productName: it.productName,
            totalQty: 0,
            locations: new Set<string>(),
            itemsCount: 0
          })
        }
        const g = productGroups.get(it.productName)
        g.totalQty += it.quantity
        if (it.location) g.locations.add(it.location.toUpperCase())
        g.itemsCount += 1
      })
      setDisplayedData(Array.from(productGroups.values()))
    } else if (reportType === 'location') {
      const locationGroups = new Map<string, any>()
      filtered.forEach(it => {
        const loc = (it.location || 'Unknown').toUpperCase()
        if (!locationGroups.has(loc)) {
          locationGroups.set(loc, {
            location: loc,
            totalQty: 0,
            itemsCount: 0,
            products: new Set<string>()
          })
        }
        const g = locationGroups.get(loc)
        g.totalQty += it.quantity
        g.itemsCount += 1
        g.products.add(it.productName)
      })
      setDisplayedData(Array.from(locationGroups.values()))
    }

    setActiveReportType(reportType)
    setHasShown(true)
  }

  // ── Print Preview ────────────────────────────────────────────────────────────
  const handlePreviewReport = () => {
    const origin = window.location.origin
    const popup = window.open('', 'InventoryReportPreview', 'width=1100,height=750,resizable=yes')
    if (!popup) return

    let tableHtml = ''
    let title = ''

    if (activeReportType === 'detailed') {
      title = 'Detailed Stock List (Lot Wise)'
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Account</th>
              <th>Product Name</th>
              <th>Lot No</th>
              <th>Location</th>
              <th>Size (WxL)</th>
              <th>GSM</th>
              <th>UOM</th>
              <th class="text-right">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${displayedData.map((it: any) => `
              <tr>
                <td style="font-weight:600;color:#71717a;">${it.itemCode}</td>
                <td>${it.accountName || '-'}</td>
                <td style="font-weight:600;">${it.productName}</td>
                <td>${it.lotNo || '-'}</td>
                <td style="text-transform:uppercase;">${it.location || '-'}</td>
                <td>${it.width} x ${it.length}</td>
                <td>${it.gsm}</td>
                <td style="text-transform:uppercase;font-weight:bold;">${it.uom}</td>
                <td class="text-right" style="font-weight:bold;">${it.quantity.toLocaleString('en-PK')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="8" style="font-size:9px;text-transform:uppercase;color:#71717a;">Total Physical Stock</td>
              <td class="text-right" style="font-weight:bold;font-size:12px;color:#16a34a;">${displayedData.reduce((s: number, it: any) => s + it.quantity, 0).toLocaleString('en-PK')}</td>
            </tr>
          </tfoot>
        </table>
      `
    } else if (activeReportType === 'product') {
      title = 'Inventory Summary By Product'
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Unique Items Count</th>
              <th>Godown Locations</th>
              <th class="text-right">Total Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${displayedData.map((it: any) => `
              <tr>
                <td style="font-weight:600;font-size:11px;">${it.productName}</td>
                <td>${it.itemsCount} lots/items</td>
                <td style="color:#71717a;text-transform:uppercase;">${Array.from(it.locations).join(', ') || '-'}</td>
                <td class="text-right" style="font-weight:bold;font-size:12px;color:#16a34a;">${it.totalQty.toLocaleString('en-PK')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="font-size:9px;text-transform:uppercase;color:#71717a;">Total Quantity across Products</td>
              <td class="text-right" style="font-weight:bold;font-size:12px;color:#16a34a;">${displayedData.reduce((s: number, it: any) => s + it.totalQty, 0).toLocaleString('en-PK')}</td>
            </tr>
          </tfoot>
        </table>
      `
    } else if (activeReportType === 'location') {
      title = 'Inventory Summary By Godown Location'
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Godown Location</th>
              <th>Stored Items Count</th>
              <th>Stored Product Types</th>
              <th class="text-right">Total Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${displayedData.map((it: any) => `
              <tr>
                <td style="font-weight:700;font-size:11px;text-transform:uppercase;">${it.location}</td>
                <td>${it.itemsCount} lots/items</td>
                <td style="color:#71717a;">${Array.from(it.products).join(', ')}</td>
                <td class="text-right" style="font-weight:bold;font-size:12px;color:#16a34a;">${it.totalQty.toLocaleString('en-PK')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="font-size:9px;text-transform:uppercase;color:#71717a;">Total Quantity across Locations</td>
              <td class="text-right" style="font-weight:bold;font-size:12px;color:#16a34a;">${displayedData.reduce((s: number, it: any) => s + it.totalQty, 0).toLocaleString('en-PK')}</td>
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
              <span>Inventory Statement</span>
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
      
      {/* FILTER & OPTION CONTROLS BAR */}
      <div className="p-4 border border-[#e4e4e7] rounded-xl bg-[#fafafa] flex flex-wrap gap-4 items-end">
        
        {/* Report Type Selector */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
            Report Template Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white font-semibold"
          >
            <option value="detailed">Detailed Stock List (Lot Wise)</option>
            <option value="product">Summary by Product Type</option>
            <option value="location">Summary by Godown Location</option>
          </select>
        </div>

        {/* Text Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
            Search Item / Code
          </label>
          <input
            type="text"
            placeholder="Type code, name, or lot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white font-medium"
          />
        </div>

        {/* Location Dropdown */}
        <div className="w-48">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
            Godown Location
          </label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white text-neutral-800 font-semibold"
          >
            <option value="ALL">All Locations</option>
            {godowns.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleShowReport}
            className="h-9 px-5 bg-black text-white font-bold text-xs rounded-md hover:bg-neutral-800 transition-all cursor-pointer shadow-sm uppercase tracking-wider font-sifonn"
          >
            SHOW REPORT
          </button>
          
          {hasShown && displayedData.length > 0 && (
            <button
              onClick={handlePreviewReport}
              className="h-9 px-4 border border-[#e4e4e7] rounded-md hover:bg-neutral-100 font-bold text-[10px] text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer flex items-center gap-1.5 uppercase font-sans"
            >
              <Printer size={13} />
              <span>PREVIEW REPORT</span>
            </button>
          )}
        </div>

      </div>

      {/* DYNAMIC REPORT LAYOUT VIEWS */}
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white min-h-[300px]">
        {!hasShown ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400 h-full">
            <FileText size={48} className="text-neutral-300 stroke-[1] mb-3 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Inventory Ledger Unloaded
            </p>
            <p className="text-[10px] text-neutral-400 mt-1 max-w-[280px]">
              Select your desired report type and optional filters above, then click **SHOW REPORT** to compile real-time physical balances.
            </p>
          </div>
        ) : displayedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400 h-full">
            <ShieldAlert size={48} className="text-amber-500 stroke-[1.2] mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              No Inventory Found
            </p>
            <p className="text-[10px] text-neutral-400 mt-1 max-w-[280px]">
              No stock matches your search keyword or selected Godown location. Try broad filtering.
            </p>
          </div>
        ) : (
          <>
            {/* VIEW 1: DETAILED STOCK LIST */}
            {activeReportType === 'detailed' && (
              <table className="w-full border-collapse text-left text-xs text-[#09090b]">
                <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
                  <tr>
                    <th className="p-3">Item Code</th>
                    <th className="p-3">Account (Supplier)</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Lot No</th>
                    <th className="p-3">Godown Location</th>
                    <th className="p-3">Size (WxL)</th>
                    <th className="p-3">GSM</th>
                    <th className="p-3">UOM</th>
                    <th className="p-3 text-right">Physical Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e4e7]">
                  {displayedData.map((r, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="p-3 font-semibold text-[#71717a]">{r.itemCode}</td>
                      <td className="p-3 text-neutral-500">{r.accountName}</td>
                      <td className="p-3 font-bold">{r.productName}</td>
                      <td className="p-3 text-neutral-600">{r.lotNo || '-'}</td>
                      <td className="p-3 font-semibold text-neutral-700 uppercase">{r.location || '-'}</td>
                      <td className="p-3 text-neutral-500">{r.width} x {r.length}</td>
                      <td className="p-3 text-neutral-500">{r.gsm}</td>
                      <td className="p-3 font-bold text-neutral-500 uppercase">{r.uom}</td>
                      <td className="p-3 font-bold text-right text-emerald-600">
                        {r.quantity.toLocaleString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#fafafa] border-t-2 border-[#e4e4e7] font-bold text-right text-[11px]">
                  <tr>
                    <td colSpan={8} className="p-3 text-left uppercase text-[9px] tracking-wider text-[#71717a]">
                      Total Stored Quantity
                    </td>
                    <td className="p-3 text-right text-emerald-600 text-sm">
                      {displayedData.reduce((s, it) => s + it.quantity, 0).toLocaleString('en-PK')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* VIEW 2: SUMMARY BY PRODUCT */}
            {activeReportType === 'product' && (
              <table className="w-full border-collapse text-left text-xs text-[#09090b]">
                <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Unique Lots Count</th>
                    <th className="p-3">Stored Godown Locations</th>
                    <th className="p-3 text-right">Aggregated Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e4e7]">
                  {displayedData.map((r, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="p-3 font-bold text-sm text-neutral-800">{r.productName}</td>
                      <td className="p-3 text-neutral-600 font-semibold">{r.itemsCount} active lots</td>
                      <td className="p-3 text-neutral-500 uppercase font-semibold">
                        {Array.from(r.locations).join(', ') || '-'}
                      </td>
                      <td className="p-3 font-extrabold text-right text-emerald-600 text-sm">
                        {r.totalQty.toLocaleString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#fafafa] border-t-2 border-[#e4e4e7] font-bold text-right text-[11px]">
                  <tr>
                    <td colSpan={3} className="p-3 text-left uppercase text-[9px] tracking-wider text-[#71717a]">
                      Grand Aggregated Quantity
                    </td>
                    <td className="p-3 text-right text-emerald-600 text-sm">
                      {displayedData.reduce((s, it) => s + it.totalQty, 0).toLocaleString('en-PK')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* VIEW 3: SUMMARY BY LOCATION */}
            {activeReportType === 'location' && (
              <table className="w-full border-collapse text-left text-xs text-[#09090b]">
                <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
                  <tr>
                    <th className="p-3">Godown Location</th>
                    <th className="p-3">Stored Lots Count</th>
                    <th className="p-3">Stored Product Types</th>
                    <th className="p-3 text-right">Location Stock Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e4e7]">
                  {displayedData.map((r, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="p-3 font-extrabold text-sm uppercase text-neutral-800">{r.location}</td>
                      <td className="p-3 text-neutral-600 font-semibold">{r.itemsCount} lots</td>
                      <td className="p-3 text-neutral-500">
                        {Array.from(r.products).join(', ')}
                      </td>
                      <td className="p-3 font-extrabold text-right text-emerald-600 text-sm">
                        {r.totalQty.toLocaleString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#fafafa] border-t-2 border-[#e4e4e7] font-bold text-right text-[11px]">
                  <tr>
                    <td colSpan={3} className="p-3 text-left uppercase text-[9px] tracking-wider text-[#71717a]">
                      Grand Location Quantity
                    </td>
                    <td className="p-3 text-right text-emerald-600 text-sm">
                      {displayedData.reduce((s, it) => s + it.totalQty, 0).toLocaleString('en-PK')}
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
