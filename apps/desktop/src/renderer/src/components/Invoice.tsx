import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Eye, Search, FilePlus, Save, Plus } from 'lucide-react'
import { LocationRecord } from './types'
import { getInvoicePreviewHtml, getStockSearchHtml, getDoPreviewHtml } from './popupTemplates'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  itemCode: string
  productId: string
  productName: string
  lotNo: string
  condition: 'Fresh' | 'Damage'
  width: string
  length: string
  gsm: string
  noOfItem: string
  uom: string
  quantity: number
  costRate: number
  saleRate: number
  saleAmount: number
  location: string
  accountName: string
}

export interface InvoiceVoucher {
  id: number
  voucherNo: string
  date: string
  accountName: string
  narration: string
  items: InvoiceItem[]
}

interface Props {
  contacts: any[]
  products: any[]
  activeLocations: LocationRecord[]
  inwardVouchers: any[]
  transferVouchers: any[]
  records: InvoiceVoucher[]
  setRecords: React.Dispatch<React.SetStateAction<InvoiceVoucher[]>>
  deliveryOrders?: any[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-PK', { maximumFractionDigits: 0 })
}

function padNo(n: number) {
  return String(n).padStart(5, '0')
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Invoice({
  contacts, products, activeLocations, inwardVouchers, transferVouchers, records, setRecords, deliveryOrders = []
}: Props) {

  // ── Navigation ───────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(records.length)
  const [jumpNum, setJumpNum] = useState('')

  // ── Header fields ────────────────────────────────────────────────────────────
  const [date, setDate] = useState('')
  const [accountName, setAccountName] = useState('')
  const [narration, setNarration] = useState('')
  const [creditDays, setCreditDays] = useState('15')

  // ── Account combobox ─────────────────────────────────────────────────────────
  const [accountQuery, setAccountQuery] = useState('')
  const [showAccountDrop, setShowAccountDrop] = useState(false)

  // ── Item row being drafted ────────────────────────────────────────────────────
  const [selItemCode, setSelItemCode] = useState('')
  const [selProductId, setSelProductId] = useState('')
  const [selProductName, setSelProductName] = useState('')
  const [selLotNo, setSelLotNo] = useState('')
  const [selCondition, setSelCondition] = useState<'Fresh' | 'Damage'>('Fresh')
  const [selWidth, setSelWidth] = useState('')
  const [selLength, setSelLength] = useState('')
  const [selGsm, setSelGsm] = useState('')
  const [selNoOfItem, setSelNoOfItem] = useState('')
  const [selUom, setSelUom] = useState('KGS')
  const [selCostRate, setSelCostRate] = useState(0)
  const [selLocation, setSelLocation] = useState('')
  const [selAvailQty, setSelAvailQty] = useState('')
  const [selAccountName, setSelAccountName] = useState('')

  const [saleRate, setSaleRate] = useState('')
  const [invoiceQty, setInvoiceQty] = useState('')

  // ── Draft items ───────────────────────────────────────────────────────────────
  const [voucherItems, setVoucherItems] = useState<InvoiceItem[]>([])

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!date) setDate(new Date().toISOString().split('T')[0])
  }, [])

  // Sync index when records loaded from DB
  useEffect(() => {
    setCurrentIndex(records.length)
  }, [records.length === 0 ? 0 : 1])

  // Sync jump input
  useEffect(() => {
    setJumpNum(String(currentIndex + 1).padStart(5, '0'))
  }, [currentIndex])

  const isViewMode = currentIndex < records.length
  const activeVoucher = isViewMode ? records[currentIndex] : null

  // Auto-sync header inputs when navigating
  useEffect(() => {
    if (isViewMode && activeVoucher) {
      setAccountQuery(activeVoucher.accountName)
      setAccountName(activeVoucher.accountName)
      setNarration(activeVoucher.narration)
      setDate(activeVoucher.date)
      const daysMap = JSON.parse(localStorage.getItem('invoice_credit_days') || '{}')
      setCreditDays(daysMap[activeVoucher.voucherNo] || '15')
    } else {
      setAccountQuery('')
      setAccountName('')
      setNarration('')
      setDate(new Date().toISOString().split('T')[0])
      setCreditDays('15')
    }
  }, [currentIndex, records, isViewMode])

  // ── Stock balance from inwards (minus transfers, minus already invoiced) ──────
  const getAvailableStockList = () => {
    const balances = new Map<string, any>()

    inwardVouchers.forEach(v => {
      (v.items || []).forEach((item: any) => {
        const key = `${item.itemCode}::${item.location || ''}`
        if (!balances.has(key)) {
          balances.set(key, { ...item, quantity: 0, accountName: v.accountName })
        }
        balances.get(key).quantity += item.quantity
      })
    })

    // Deduct transfers (sorted chronologically to maintain transfer chains)
    const sortedTransfers = [...transferVouchers].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.id - b.id
    })

    sortedTransfers.forEach(v => {
      (v.items || []).forEach((item: any) => {
        // deduct from source
        const srcKey = `${item.sourceItemCode}::${item.fromLocation}`
        let sourceAccountName = '-'
        if (balances.has(srcKey)) {
          sourceAccountName = balances.get(srcKey).accountName
          balances.get(srcKey).quantity -= item.quantity
        }
        
        // add to destination
        const dstKey = `${item.itemCode}::${item.location}`
        if (!balances.has(dstKey)) {
          balances.set(dstKey, { 
            ...item, 
            quantity: 0, 
            accountName: item.accountName || sourceAccountName 
          })
        }
        balances.get(dstKey).quantity += item.quantity
      })
    })

    // Deduct previously invoiced
    records.forEach(v => {
      (v.items || []).forEach((item: any) => {
        const key = `${item.itemCode}::${item.location}`
        if (balances.has(key)) balances.get(key).quantity -= item.quantity
      })
    })

    return Array.from(balances.values()).filter(b => b.quantity > 0)
  }

  // ── Register for search popup ─────────────────────────────────────────────────
  useEffect(() => {
    (window as any).getAvailableStockList = getAvailableStockList
    return () => { delete (window as any).getAvailableStockList }
  }, [inwardVouchers, transferVouchers, records])

  useEffect(() => {
    (window as any).onSelectStock = (item: any) => {
      setSelItemCode(item.itemCode)
      setSelProductId(item.productId || '')
      setSelProductName(item.productName)
      setSelLotNo(item.lotNo || '')
      setSelCondition(item.condition || 'Fresh')
      setSelWidth(item.width || '')
      setSelLength(item.length || '')
      setSelGsm(item.gsm || '')
      setSelNoOfItem(item.noOfItem || '')
      setSelUom(item.uom || 'KGS')
      setSelCostRate(item.costRate || 0)
      setSelLocation(item.location || '')
      setSelAvailQty(String(item.quantity))
      setSelAccountName(item.accountName || '')
    }
    return () => { delete (window as any).onSelectStock }
  }, [])

  // ── Open search popup ─────────────────────────────────────────────────────────
  const openStockSearch = () => {
    const origin = window.location.origin
    const popup = window.open('', 'StockSearch', 'width=1100,height=650,resizable=yes')
    if (!popup) return
    popup.document.write(getStockSearchHtml(origin))
    popup.document.close()
  }

  // ── Add item to draft ─────────────────────────────────────────────────────────
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selItemCode || !saleRate || !invoiceQty) return

    const qty = parseFloat(invoiceQty) || 0
    const rate = parseFloat(saleRate) || 0
    const availQty = parseFloat(selAvailQty) || 0

    if (qty <= 0) { alert('Quantity must be greater than zero.'); return }
    if (qty > availQty) { alert(`Insufficient stock. Available: ${fmt(availQty)}`); return }
    if (rate <= 0) { alert('Sale Rate must be greater than zero.'); return }

    if (voucherItems.some(it => it.itemCode === selItemCode)) {
      alert('This item is already in the draft. Remove it first to re-add.')
      return
    }

    const newItem: InvoiceItem = {
      itemCode: selItemCode,
      productId: selProductId,
      productName: selProductName,
      lotNo: selLotNo,
      condition: selCondition,
      width: selWidth,
      length: selLength,
      gsm: selGsm,
      noOfItem: selNoOfItem,
      uom: selUom,
      quantity: qty,
      costRate: selCostRate,
      saleRate: rate,
      saleAmount: qty * rate,
      location: selLocation,
      accountName: selAccountName
    }

    setVoucherItems(prev => [newItem, ...prev])
    // Reset draft row
    setSelItemCode(''); setSelProductId(''); setSelProductName(''); setSelLotNo('')
    setSelCondition('Fresh'); setSelWidth(''); setSelLength(''); setSelGsm('')
    setSelNoOfItem(''); setSelUom('KGS'); setSelCostRate(0); setSelLocation('')
    setSelAvailQty(''); setSelAccountName(''); setSaleRate(''); setInvoiceQty('')
  }

  const removeItem = (code: string) => {
    setVoucherItems(prev => prev.filter(it => it.itemCode !== code))
  }

  // ── Save voucher ──────────────────────────────────────────────────────────────
  const handleSaveVoucher = async () => {
    if (!accountName) { alert('Select an account.'); return }
    if (voucherItems.length === 0) { alert('Add at least one item.'); return }

    const newNo = `INVOICE:${padNo(records.length + 1)}`
    const newVoucher: InvoiceVoucher = {
      id: Date.now(),
      voucherNo: newNo,
      date,
      accountName,
      narration: narration || 'INVOICE',
      items: voucherItems
    }

    try {
      await window.api.db.insert('invoices', {
        voucherNo: newNo,
        date,
        accountName,
        narration: narration || 'INVOICE',
        items: JSON.stringify(voucherItems)
      })
      // Save credit days mapping
      const daysMap = JSON.parse(localStorage.getItem('invoice_credit_days') || '{}')
      daysMap[newNo] = creditDays || '15'
      localStorage.setItem('invoice_credit_days', JSON.stringify(daysMap))
    } catch (e) {
      console.error('Invoice save error', e)
    }

    const updated = [...records, newVoucher]
    setRecords(updated)
    setCurrentIndex(updated.length - 1)
  }

  const resetForm = () => {
    setAccountName(''); setAccountQuery(''); setNarration('')
    setDate(new Date().toISOString().split('T')[0])
    setVoucherItems([])
    resetItemRow()
  }

  const resetItemRow = () => {
    setSelItemCode(''); setSelProductId(''); setSelProductName(''); setSelLotNo('')
    setSelCondition('Fresh'); setSelWidth(''); setSelLength(''); setSelGsm('')
    setSelNoOfItem(''); setSelUom('KGS'); setSelCostRate(0); setSelLocation('')
    setSelAvailQty(''); setSelAccountName(''); setSaleRate(''); setInvoiceQty('')
  }

  // ── Navigation handlers ───────────────────────────────────────────────────────
  const handlePrev = () => {
    if (currentIndex > 0) {
      loadVoucher(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < records.length) {
      loadVoucher(currentIndex + 1)
    }
  }

  const handleNew = () => {
    setCurrentIndex(records.length)
    resetForm()
  }

  const loadVoucher = (idx: number) => {
    if (idx < 0 || idx > records.length) return
    setCurrentIndex(idx)
    if (idx >= records.length) { resetForm(); return }
    const v = records[idx]
    setDate(v.date)
    setAccountName(v.accountName)
    setAccountQuery(v.accountName)
    setNarration(v.narration)
    setVoucherItems([])
  }

  const cleanJumpNum = jumpNum.replace(/[^\d]/g, '')
  const parsedJumpIdx = parseInt(cleanJumpNum) ? parseInt(cleanJumpNum) - 1 : -1
  const isEditedNum = parsedJumpIdx !== currentIndex && cleanJumpNum.length === 5

  const handleJumpToVoucher = () => {
    if (parsedJumpIdx >= 0 && parsedJumpIdx <= records.length) {
      if (parsedJumpIdx === records.length) {
        handleNew()
      } else {
        loadVoucher(parsedJumpIdx)
      }
    } else {
      alert(`Voucher number out of range (Available range: INVOICE:00001 to INVOICE:${padNo(records.length + 1)})`)
    }
  }

  const handlePreview = () => {
    const v = activeVoucher
    if (!v) return
    const origin = window.location.origin
    const popup = window.open('', `InvoicePreview_${v.voucherNo}`, 'width=1050,height=750,resizable=yes')
    if (!popup) return
    popup.document.write(getInvoicePreviewHtml(v.voucherNo, v.date, v.accountName, v.narration, v.items, origin))
    popup.document.close()
  }

  const handlePreviewDO = (v: any) => {
    const origin = window.location.origin
    const popup = window.open('', `DOPreview_${v.voucherNo}`, 'width=1050,height=750,resizable=yes')
    if (!popup) return
    // Items inside DO are already parsed as object array.
    popup.document.write(getDoPreviewHtml(v.voucherNo, v.date, v.invoiceNo, v.accountName, v.vehicle, v.narration, v.items, origin, true))
    popup.document.close()
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const displayItems = isViewMode ? (activeVoucher?.items || []) : voucherItems
  const totalQty = displayItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
  const totalSale = displayItems.reduce((s, it) => s + (Number(it.saleAmount) || 0), 0)

  const activeContacts = contacts.filter(c => c.isActive !== false)

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4 font-sans text-xs text-[#09090b]">

      {/* VOUCHER CONTROL BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-[#09090b] font-sifonn">Invoice</h2>

          {/* EDITABLE VOUCHER NUMBER SEARCH INPUT */}
          <div className="flex items-center bg-[#fafafa] border border-[#e4e4e7] rounded-md px-2 py-0.5">
            <span className="font-bold text-[10px] text-[#71717a] mr-1 uppercase">INVOICE:</span>
            <input
              type="text"
              value={jumpNum}
              onChange={e => setJumpNum(e.target.value.replace(/[^\d]/g, ''))}
              maxLength={5}
              className="w-16 h-6 border-0 bg-transparent text-center font-bold text-xs focus:outline-none"
            />
            {isEditedNum && (
              <button
                onClick={handleJumpToVoucher}
                className="ml-1.5 px-2 py-0.5 bg-[#54e0e7] hover:bg-[#3cd5dc] text-[#09090b] font-bold text-[9px] rounded transition-all cursor-pointer font-sifonn"
              >
                CHECK
              </button>
            )}
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
            className="flex items-center gap-1 h-8 px-3 border border-[#e4e4e7] rounded-md hover:bg-[#f4f4f5] font-semibold text-[10px] text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer"
          >
            <FilePlus size={12} />
            <span>NEW VOUCHER</span>
          </button>
        </div>
      </div>

      {/* VOUCHER HEADER FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border border-[#e4e4e7] rounded-xl bg-[#fafafa]">
        <div>
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Invoice Date</label>
          <input
            type="date"
            required
            disabled={isViewMode}
            value={isViewMode && activeVoucher ? activeVoucher.date : date}
            onChange={e => setDate(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80"
          />
        </div>

        {/* EDITABLE FILTERABLE DROPDOWN FOR ACCOUNT */}
        <div className="relative">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Customer / Buyer Name</label>
          {isViewMode ? (
            <input
              type="text"
              disabled
              value={activeVoucher ? activeVoucher.accountName : ''}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#f4f4f5] text-[#71717a] opacity-80 cursor-not-allowed font-medium focus:outline-none"
            />
          ) : (
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Type to filter accounts..."
                value={accountQuery}
                onFocus={() => setShowAccountDrop(true)}
                onBlur={() => setTimeout(() => setShowAccountDrop(false), 200)}
                onChange={e => {
                  setAccountQuery(e.target.value)
                  setAccountName(e.target.value)
                  setShowAccountDrop(true)
                }}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white font-sans font-medium"
              />
              {showAccountDrop && (
                <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-[#e4e4e7] rounded-md shadow-lg z-50">
                  {activeContacts.filter(c => c.name.toLowerCase().includes(accountQuery.toLowerCase())).length === 0 ? (
                    <div className="p-2 text-xs text-[#71717a] italic">No matching accounts</div>
                  ) : (
                    activeContacts.filter(c => c.name.toLowerCase().includes(accountQuery.toLowerCase())).map(c => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setAccountName(c.name)
                          setAccountQuery(c.name)
                          setShowAccountDrop(false)
                        }}
                        className="p-2.5 hover:bg-[#fafafa] cursor-pointer text-xs font-semibold border-b last:border-b-0 border-[#f4f4f5]"
                      >
                        {c.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Narration / Remarks</label>
          <input
            type="text"
            disabled={isViewMode}
            placeholder="e.g. Sales invoice dispatch"
            value={isViewMode && activeVoucher ? activeVoucher.narration : narration}
            onChange={e => setNarration(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80"
          />
        </div>

        <div>
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Credit Days</label>
          <input
            type="number"
            required
            disabled={isViewMode}
            placeholder="e.g. 15"
            value={creditDays}
            onChange={e => setCreditDays(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80 font-bold"
          />
        </div>
      </div>

      {/* Generated DOs against this Invoice */}
      {isViewMode && activeVoucher && deliveryOrders && (
        (() => {
          const linkedDOs = deliveryOrders.filter(
            d => d.invoiceNo && typeof d.invoiceNo === 'string' && activeVoucher.voucherNo && d.invoiceNo.toUpperCase() === activeVoucher.voucherNo.toUpperCase()
          )
          if (linkedDOs.length === 0) return null

          return (
            <div className="flex items-center gap-2 p-3 border border-[#e4e4e7] rounded-xl bg-[#fafafa] flex-wrap">
              <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">Generated DOs against this Invoice:</span>
              <div className="flex flex-wrap gap-1.5">
                {linkedDOs.map(doVou => (
                  <button
                    type="button"
                    key={doVou.voucherNo}
                    onClick={() => handlePreviewDO(doVou)}
                    className="flex items-center gap-1 h-6 px-2 border border-[#e4e4e7] rounded bg-white hover:bg-neutral-50 font-bold text-[9px] text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer uppercase font-sans select-none"
                  >
                    <Eye size={10} />
                    <span>{doVou.voucherNo} ({doVou.items?.[0]?.location || 'N/A'})</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })()
      )}

      {/* DRAFT LINE ITEMS INPUT (Only editable in New Entry mode) */}
      {!isViewMode && (
        <form onSubmit={handleAddItem} className="p-4 border border-[#e4e4e7] rounded-xl bg-white space-y-3 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Item Search</label>
              <button
                type="button"
                onClick={openStockSearch}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] hover:bg-[#f4f4f5] cursor-pointer flex items-center justify-center gap-1 font-semibold text-[#71717a] hover:text-[#09090b] transition-colors"
              >
                <Search size={12} />
                <span>SEARCH STOCK</span>
              </button>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Item Code</label>
              <input
                type="text"
                readOnly
                placeholder="— Auto-filled —"
                value={selItemCode}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#f4f4f5] text-[#71717a] focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Item Name</label>
              <input
                type="text"
                readOnly
                placeholder="— Auto-filled —"
                value={selProductName}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#f4f4f5] text-[#71717a] focus:outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Location</label>
              <input
                type="text"
                readOnly
                placeholder="— Auto-filled —"
                value={selLocation}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#f4f4f5] text-[#71717a] focus:outline-none font-semibold uppercase"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Available Qty</label>
              <input
                type="text"
                readOnly
                placeholder="— Auto-filled —"
                value={selAvailQty ? parseFloat(selAvailQty).toLocaleString('en-PK', { maximumFractionDigits: 0 }) : ''}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#f4f4f5] text-[#16a34a] focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Sale Qty</label>
              <input
                type="number"
                required
                step="any"
                min="0.01"
                placeholder="e.g. 500"
                value={invoiceQty}
                onChange={e => setInvoiceQty(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Sale Rate</label>
              <input
                type="number"
                required
                step="any"
                min="0.01"
                placeholder="e.g. 250"
                value={saleRate}
                onChange={e => setSaleRate(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="h-9 px-6 flex items-center justify-center gap-1 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Plus size={14} />
              <span>ADD ROW</span>
            </button>
          </div>
        </form>
      )}

      {/* VOUCHER ITEMS TABLE GRID */}
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3">Item Code</th>
              <th className="p-3">Account</th>
              <th className="p-3">Item Name</th>
              <th className="p-3">Location</th>
              <th className="p-3">Size (WxL)</th>
              <th className="p-3">GSM</th>
              <th className="p-3">UOM</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3 text-right">Cost Rate</th>
              <th className="p-3 text-right">Sale Rate</th>
              <th className="p-3 text-right">Sale Amount</th>
              {!isViewMode && <th className="p-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {displayItems.length === 0 ? (
              <tr>
                <td colSpan={isViewMode ? 11 : 12} className="p-8 text-center text-[#71717a] italic">
                  No items added to this voucher
                </td>
              </tr>
            ) : (
              displayItems.map((it, idx) => (
                <tr key={it.itemCode + '-' + idx} className="hover:bg-[#fafafa]">
                  <td className="p-3 font-semibold text-[#71717a]">{it.itemCode}</td>
                  <td className="p-3 text-[#71717a]">{it.accountName}</td>
                  <td className="p-3 font-semibold">{it.productName}</td>
                  <td className="p-3 text-[#71717a] font-semibold uppercase">{it.location}</td>
                  <td className="p-3 text-[#71717a] font-medium">{it.width} x {it.length}</td>
                  <td className="p-3 text-[#71717a]">{it.gsm}</td>
                  <td className="p-3 text-[#71717a] font-bold uppercase">{it.uom}</td>
                  <td className="p-3 font-bold text-right">{(Number(it.quantity) || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td className="p-3 font-medium text-right text-[#71717a]">{(Number(it.costRate) || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td className="p-3 font-bold text-right">{(Number(it.saleRate) || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td className="p-3 font-bold text-right text-emerald-600">PKR {(Number(it.saleAmount) || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  {!isViewMode && (
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(it.itemCode)}
                        className="text-rose-600 font-bold hover:text-rose-800 transition-colors"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {displayItems.length > 0 && (
            <tfoot className="bg-[#fafafa] border-t-2 border-[#e4e4e7] font-bold text-right">
              <tr>
                <td colSpan={7} className="p-3 text-left uppercase text-[9px] tracking-wider text-[#71717a]">Voucher Total</td>
                <td className="p-3 text-right">{totalQty.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                <td></td>
                <td></td>
                <td className="p-3 text-right text-emerald-600 text-sm">PKR {totalSale.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                {!isViewMode && <td></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* SAVE VOUCHER FOOTER BAR */}
      {!isViewMode && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveVoucher}
            className="flex items-center gap-1.5 h-9 px-6 bg-black text-white font-bold text-xs rounded-md hover:bg-neutral-800 transition-all cursor-pointer shadow-md font-sifonn"
          >
            <Save size={14} />
            <span>SAVE INVOICE</span>
          </button>
        </div>
      )}
    </div>
  )
}
