import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Eye, FilePlus, Save, Search } from 'lucide-react'
import { getDoPreviewHtml } from './popupTemplates'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DOItem {
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
  quantity: number // Delivered Qty (equal to Invoice Qty)
  invoiceQty: number // Original Invoice Qty
  location: string
  accountName: string
}

export interface DOVoucher {
  id: number
  voucherNo: string
  invoiceNo: string
  date: string
  accountName: string
  vehicle: string
  narration: string
  items: DOItem[]
}

interface Props {
  invoiceVouchers: any[]
  records: DOVoucher[]
  setRecords: React.Dispatch<React.SetStateAction<DOVoucher[]>>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-PK', { maximumFractionDigits: 0 })
}

function padNo(n: number) {
  return String(n).padStart(5, '0')
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DoOrder({ invoiceVouchers, records, setRecords }: Props) {

  // ── Navigation ───────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(records.length)
  const [jumpNum, setJumpNum] = useState('')

  // ── Header fields ────────────────────────────────────────────────────────────
  const [date, setDate] = useState('')
  const [accountName, setAccountName] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [narration, setNarration] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')

  // ── Preview settings ─────────────────────────────────────────────────────────
  const [showAccountName, setShowAccountName] = useState(true)

  // ── Fetching Invoice Items ───────────────────────────────────────────────────
  const [fetchedInvoiceItems, setFetchedInvoiceItems] = useState<any[]>([])
  const [selectedItemCodes, setSelectedItemCodes] = useState<Record<string, boolean>>({})
  const [keepDraftFields, setKeepDraftFields] = useState(false)

  // ── Item Row Preview ─────────────────────────────────────────────────────────
  const [previewItem, setPreviewItem] = useState<any | null>(null)

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

  // Auto-sync fields when navigating
  useEffect(() => {
    if (isViewMode && activeVoucher) {
      setInvoiceNo(activeVoucher.invoiceNo)
      setAccountName(activeVoucher.accountName)
      setVehicle(activeVoucher.vehicle || '')
      setNarration(activeVoucher.narration)
      setDate(activeVoucher.date)
      setPreviewItem(null)
    } else {
      if (keepDraftFields) {
        setKeepDraftFields(false)
        return
      }
      setInvoiceNo('')
      setAccountName('')
      setVehicle('')
      setNarration('')
      setDate(new Date().toISOString().split('T')[0])
      setFetchedInvoiceItems([])
      setSelectedItemCodes({})
      setPreviewItem(null)
    }
  }, [currentIndex, records, isViewMode])

  // Helper to find which DO an item has already been saved/delivered in
  const getDeliveredDoNumber = (itemCode: string) => {
    const foundDo = records.find(r =>
      r.invoiceNo.toUpperCase() === invoiceNo.toUpperCase() &&
      (r.items || []).some(it => it.itemCode === itemCode)
    )
    return foundDo ? foundDo.voucherNo : null
  }

  // ── Fetch Invoice logic ──────────────────────────────────────────────────────
  const handleFetchInvoice = () => {
    if (!invoiceNo.trim()) return

    // Allow typing just "1" -> converts to "INVOICE:00001"
    const cleanedNum = invoiceNo.replace(/[^\d]/g, '')
    const searchNo = cleanedNum
      ? `INVOICE:${cleanedNum.padStart(5, '0')}`
      : invoiceNo.trim()

    const inv = invoiceVouchers.find(v => v.voucherNo.toUpperCase() === searchNo.toUpperCase())
    if (!inv) {
      alert(`Invoice "${searchNo}" not found. Make sure the Invoice has been saved.`)
      return
    }

    setInvoiceNo(inv.voucherNo)
    setAccountName(inv.accountName)
    setNarration(`DO generated from Ref: ${inv.voucherNo}`)
    setFetchedInvoiceItems(inv.items || [])

    // Pre-check only items that have NOT been delivered yet
    const checkMap: Record<string, boolean> = {}
    inv.items.forEach((item: any) => {
      const alreadyDeliveredDo = records.find(r =>
        r.invoiceNo.toUpperCase() === inv.voucherNo.toUpperCase() &&
        (r.items || []).some(it => it.itemCode === item.itemCode)
      )
      checkMap[item.itemCode] = !alreadyDeliveredDo
    })
    setSelectedItemCodes(checkMap)
    setPreviewItem(null)
  }

  // ── Toggle Checkbox ──────────────────────────────────────────────────────────
  const handleToggleItem = (code: string) => {
    setSelectedItemCodes(prev => ({
      ...prev,
      [code]: !prev[code]
    }))
  }

  // ── Save DO ──────────────────────────────────────────────────────────────────
  const handleSaveDO = async () => {
    if (!accountName) { alert('Fetch an Invoice first.'); return }

    const selectedItems = fetchedInvoiceItems.filter(it => selectedItemCodes[it.itemCode])
    if (selectedItems.length === 0) {
      alert('Select at least one item row to deliver.')
      return
    }

    // Double check that none of the selected items were already delivered in another DO
    for (const it of selectedItems) {
      const alreadyDeliveredDo = getDeliveredDoNumber(it.itemCode)
      if (alreadyDeliveredDo) {
        alert(`Item "${it.itemCode}" has already been delivered in Delivery Order "${alreadyDeliveredDo}". You cannot deliver it again.`)
        return
      }
    }

    const itemsToSave: DOItem[] = selectedItems.map(it => ({
      itemCode: it.itemCode,
      productId: it.productId,
      productName: it.productName,
      lotNo: it.lotNo,
      condition: it.condition,
      width: it.width,
      length: it.length,
      gsm: it.gsm,
      noOfItem: it.noOfItem,
      uom: it.uom,
      quantity: it.quantity, // Quantity equals Invoice quantity directly
      invoiceQty: it.quantity,
      location: it.location,
      accountName: it.accountName
    }))

    const nextNo = `DO:${padNo(records.length + 1)}`
    const recordData = {
      voucherNo: nextNo,
      invoiceNo,
      date,
      accountName,
      vehicle: vehicle.trim() || '-',
      narration: narration.trim() || 'DELIVERY ORDER',
      items: JSON.stringify(itemsToSave)
    }

    try {
      const inserted = await window.api.db.insert('deliveryOrders', recordData)
      const parsedRecord = {
        ...inserted,
        items: JSON.parse(inserted.items)
      }
      const updated = [...records, parsedRecord]
      setKeepDraftFields(true)
      setRecords(updated)
      setCurrentIndex(updated.length)
      setSelectedItemCodes(prev => {
        const next = { ...prev }
        selectedItems.forEach(it => {
          next[it.itemCode] = false
        })
        return next
      })
      setPreviewItem(null)
    } catch (e) {
      console.error('DO Save Error:', e)
      alert('Failed to save Delivery Order to database.')
    }
  }

  const resetForm = () => {
    setInvoiceNo('')
    setAccountName('')
    setVehicle('')
    setNarration('')
    setDate(new Date().toISOString().split('T')[0])
    setFetchedInvoiceItems([])
    setSelectedItemCodes({})
    setPreviewItem(null)
  }

  // ── Navigation handlers ───────────────────────────────────────────────────────
  const handlePrev = () => {
    if (currentIndex > 0) loadVoucher(currentIndex - 1)
  }

  const handleNext = () => {
    if (currentIndex < records.length) loadVoucher(currentIndex + 1)
  }

  const handleNew = () => {
    setCurrentIndex(records.length)
    resetForm()
  }

  const loadVoucher = (idx: number) => {
    if (idx < 0 || idx > records.length) return
    setCurrentIndex(idx)
    if (idx >= records.length) { resetForm(); return }
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
      alert(`DO number out of range (Available range: DO:00001 to DO:${padNo(records.length + 1)})`)
    }
  }

  // ── Preview popup ────────────────────────────────────────────────────────────
  const handlePreviewForVoucher = (v: DOVoucher) => {
    const origin = window.location.origin
    const popup = window.open('', `DOPreview_${v.voucherNo}`, 'width=1050,height=750,resizable=yes')
    if (!popup) return
    popup.document.write(getDoPreviewHtml(v.voucherNo, v.date, v.invoiceNo, v.accountName, v.vehicle, v.narration, v.items, origin, showAccountName))
    popup.document.close()
  }

  const handlePreview = () => {
    if (activeVoucher) {
      handlePreviewForVoucher(activeVoucher)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const displayItems = isViewMode ? (activeVoucher?.items || []) : fetchedInvoiceItems
  const totalDeliveredQty = isViewMode
    ? displayItems.reduce((s, it) => s + it.quantity, 0)
    : fetchedInvoiceItems.filter(it => selectedItemCodes[it.itemCode]).reduce((s, it) => s + it.quantity, 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4 font-sans text-xs text-[#09090b]">

      {/* VOUCHER CONTROL BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-[#09090b] font-sifonn">DO Order</h2>

          {/* EDITABLE VOUCHER NUMBER SEARCH INPUT */}
          <div className="flex items-center bg-[#fafafa] border border-[#e4e4e7] rounded-md px-2 py-0.5">
            <span className="font-bold text-[10px] text-[#71717a] mr-1 uppercase">DO:</span>
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
              title="Previous DO"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === records.length}
              className="p-1.5 border border-[#e4e4e7] rounded-md hover:bg-[#f4f4f5] disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer transition-colors"
              title="Next DO"
            >
              <ChevronRight size={14} />
            </button>
            
            <div className="flex items-center gap-2 border border-[#e4e4e7] rounded-md px-2 py-1 bg-[#fafafa] ml-1.5">
              <input
                type="checkbox"
                id="showAccountName"
                checked={showAccountName}
                onChange={e => setShowAccountName(e.target.checked)}
                className="w-3.5 h-3.5 cursor-pointer accent-black"
              />
              <label htmlFor="showAccountName" className="text-[10px] font-bold text-[#71717a] cursor-pointer uppercase tracking-wider select-none">Show Account</label>
              {isViewMode && (
                <button
                  onClick={handlePreview}
                  className="flex items-center gap-1 h-6 px-2.5 border-l border-[#e4e4e7] text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer font-semibold text-[10px]"
                >
                  <Eye size={12} />
                  <span>PREVIEW</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleNew}
            disabled={currentIndex === records.length}
            className="flex items-center gap-1 h-8 px-3 border border-[#e4e4e7] rounded-md hover:bg-[#f4f4f5] font-semibold text-[10px] text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer"
          >
            <FilePlus size={12} />
            <span>NEW DO</span>
          </button>
        </div>
      </div>

      {/* VOUCHER HEADER FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border border-[#e4e4e7] rounded-xl bg-[#fafafa]">
        <div>
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">DO Date</label>
          <input
            type="date"
            required
            disabled={isViewMode}
            value={isViewMode && activeVoucher ? activeVoucher.date : date}
            onChange={e => setDate(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80"
          />
        </div>

        <div>
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Invoice Number</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              disabled={isViewMode}
              placeholder="e.g. INVOICE:00001"
              value={invoiceNo}
              onChange={e => setInvoiceNo(e.target.value)}
              className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80 font-semibold"
            />
            {!isViewMode && (
              <button
                type="button"
                onClick={handleFetchInvoice}
                className="h-9 px-3 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer flex items-center gap-1 shrink-0 font-sifonn"
              >
                FETCH
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Customer / Buyer</label>
          <input
            type="text"
            disabled
            placeholder="— Auto-filled —"
            value={accountName}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#f4f4f5] text-[#71717a] focus:outline-none font-semibold"
          />
        </div>

        <div>
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Truck / Vehicle Details</label>
          <input
            type="text"
            disabled={isViewMode}
            placeholder="e.g. LET-2026-987 (Optional)"
            value={isViewMode && activeVoucher ? activeVoucher.vehicle : vehicle}
            onChange={e => setVehicle(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80 font-medium"
          />
        </div>

        {/* List of saved DOs for this invoice */}
        {invoiceNo && records.filter(r => r.invoiceNo.toUpperCase() === invoiceNo.toUpperCase()).length > 0 && (
          <div className="col-span-full flex items-center gap-2 mt-2 pt-2 border-t border-[#e4e4e7] flex-wrap">
            <span className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">Select DO to Preview:</span>
            <div className="flex flex-wrap gap-1.5">
              {records
                .filter(r => r.invoiceNo.toUpperCase() === invoiceNo.toUpperCase())
                .map(doVou => (
                  <button
                    type="button"
                    key={doVou.voucherNo}
                    onClick={() => handlePreviewForVoucher(doVou)}
                    className="flex items-center gap-1 h-6 px-2 border border-[#e4e4e7] rounded bg-white hover:bg-neutral-50 font-bold text-[9px] text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer uppercase font-sans select-none"
                  >
                    <Eye size={10} />
                    <span>{doVou.voucherNo} ({doVou.items[0]?.location || 'N/A'})</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Main split display: left table, right item detail preview */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 overflow-hidden">
        
        {/* Table container */}
        <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
          <table className="w-full border-collapse text-left text-xs text-[#09090b]">
            <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
              <tr>
                {!isViewMode && <th className="p-3 text-center w-12">Select</th>}
                <th className="p-3">Item Code</th>
                <th className="p-3">Item Name</th>
                <th className="p-3">Lot No</th>
                <th className="p-3">Size (WxL)</th>
                <th className="p-3">GSM</th>
                <th className="p-3 text-right">QTY</th>
                <th className="p-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e7]">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={isViewMode ? 7 : 8} className="p-8 text-center text-[#71717a] italic">
                    {isViewMode ? 'No items found' : 'Enter invoice number and click FETCH to load items'}
                  </td>
                </tr>
              ) : (
                displayItems.map((it, idx) => {
                  const isChecked = selectedItemCodes[it.itemCode] !== false
                  const alreadyDeliveredDo = isViewMode ? null : getDeliveredDoNumber(it.itemCode)

                  return (
                    <tr
                      key={it.itemCode + '-' + idx}
                      onClick={() => setPreviewItem(it)}
                      className={`hover:bg-[#fafafa] cursor-pointer transition-colors ${previewItem?.itemCode === it.itemCode ? 'bg-neutral-50 font-medium' : ''}`}
                    >
                      {!isViewMode && (
                        <td className="p-3 text-center w-12" onClick={e => e.stopPropagation()}>
                          {alreadyDeliveredDo ? (
                            <input
                              type="checkbox"
                              disabled
                              checked={false}
                              className="w-4 h-4 cursor-not-allowed opacity-30"
                              title={`Already delivered in ${alreadyDeliveredDo}`}
                            />
                          ) : (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleItem(it.itemCode)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          )}
                        </td>
                      )}
                      <td className="p-3 font-semibold text-[#71717a]">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span>{it.itemCode}</span>
                          {alreadyDeliveredDo && (
                            <span className="text-[9px] font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded uppercase tracking-wider select-none">
                              Delivered in {alreadyDeliveredDo}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-semibold">{it.productName}</td>
                      <td className="p-3 text-[#71717a]">{it.lotNo || '-'}</td>
                      <td className="p-3 text-[#71717a]">{it.width} x {it.length}</td>
                      <td className="p-3 text-[#71717a]">{it.gsm}</td>
                      <td className="p-3 text-right font-bold">{fmt(it.quantity)}</td>
                      <td className="p-3 uppercase text-[#71717a] font-semibold">{it.location}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {displayItems.length > 0 && (
              <tfoot className="bg-[#fafafa] border-t-2 border-[#e4e4e7] font-bold text-right">
                <tr>
                  <td colSpan={isViewMode ? 5 : 6} className="p-3 text-left uppercase text-[9px] tracking-wider text-[#71717a]">
                    Total Delivered Qty
                  </td>
                  <td className="p-3 text-right text-emerald-600 text-sm">
                    {fmt(totalDeliveredQty)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Right side item detail preview card */}
        {previewItem && (
          <div className="w-full md:w-80 p-4 border border-[#e4e4e7] rounded-xl bg-white space-y-3 shrink-0 h-fit self-start shadow-sm font-sans">
            <h3 className="font-bold text-[10px] uppercase tracking-widest text-[#71717a] border-b border-[#f4f4f5] pb-2">Item Specifications</h3>
            <div className="divide-y divide-[#f4f4f5] text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71717a] font-medium">Item Code</span>
                <span className="font-bold text-[#09090b] bg-[#f4f4f5] px-2 py-0.5 rounded text-[11px]">{previewItem.itemCode}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71717a] font-medium">Product</span>
                <span className="font-semibold text-[#09090b]">{previewItem.productName}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71717a] font-medium">Lot No</span>
                <span className="text-[#09090b] font-medium">{previewItem.lotNo || '-'}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71717a] font-medium">Condition</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${previewItem.condition === 'Fresh' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#fef2f2] text-[#ef4444]'}`}>
                  {previewItem.condition || 'Fresh'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71717a] font-medium">Size (WxL)</span>
                <span className="font-semibold text-[#09090b]">{previewItem.width} x {previewItem.length}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71717a] font-medium">GSM</span>
                <span className="font-semibold text-[#09090b]">{previewItem.gsm} gsm</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71717a] font-medium">UOM</span>
                <span className="font-bold uppercase text-[#71717a]">{previewItem.uom}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71717a] font-medium">Location</span>
                <span className="font-bold uppercase text-[#71717a] bg-[#fafafa] border border-[#e4e4e7] px-2 py-0.5 rounded text-[10px]">{previewItem.location || '-'}</span>
              </div>
            </div>
            <div className="bg-[#fafafa] border border-[#e4e4e7] p-3 rounded-lg flex justify-between items-center text-xs mt-2">
              <span className="font-bold text-[#71717a] uppercase text-[9px] tracking-wider">Voucher Qty</span>
              <span className="font-extrabold text-[#09090b] text-base">
                {fmt(previewItem.quantity)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SAVE VOUCHER FOOTER BAR */}
      {!isViewMode && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveDO}
            disabled={fetchedInvoiceItems.length === 0}
            className="flex items-center gap-1.5 h-9 px-6 bg-black text-white font-bold text-xs rounded-md hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md font-sifonn"
          >
            <Save size={14} />
            <span>SAVE DO ORDER</span>
          </button>
        </div>
      )}
    </div>
  )
}
