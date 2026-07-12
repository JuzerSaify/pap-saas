import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Save, FilePlus, Eye, Search } from 'lucide-react'
import { LocationRecord } from './types'
import { InwardVoucher } from './StockInward'
import { getTransferPreviewHtml, getStockSearchHtml } from './popupTemplates'

interface TransferItem {
  itemCode: string // e.g. ITM-10001-T1
  sourceItemCode: string // e.g. ITM-10001
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
  costAmount: number
  fromLocation: string
  location: string // destination location
}

interface TransferVoucher {
  id: number
  voucherNo: string
  date: string
  narration: string
  items: TransferItem[]
}

interface Props {
  activeLocations: LocationRecord[]
  products: any[]
  contacts: any[]
  records: TransferVoucher[]
  setRecords: React.Dispatch<React.SetStateAction<TransferVoucher[]>>
  inwardVouchers: InwardVoucher[]
}

export function StockTransfer({ activeLocations, products, contacts, records, setRecords, inwardVouchers }: Props) {
  // Navigation / View state
  const [currentIndex, setCurrentIndex] = useState(records.length)

  // Jump Voucher Input State
  const [jumpNum, setJumpNum] = useState('')

  // Header states
  const [date, setDate] = useState('')
  const [narration, setNarration] = useState('')

  // Selected Stock Item states (populated from pop-up)
  const [sourceItemCode, setSourceItemCode] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedProductName, setSelectedProductName] = useState('')
  const [fromLocation, setFromLocation] = useState('')
  const [availableQty, setAvailableQty] = useState('')

  // Metadata properties of selected item (for cloning)
  const [selProductId, setSelProductId] = useState('')
  const [selLotNo, setSelLotNo] = useState('')
  const [selCondition, setSelCondition] = useState<'Fresh' | 'Damage'>('Fresh')
  const [selWidth, setSelWidth] = useState('')
  const [selLength, setSelLength] = useState('')
  const [selGsm, setSelGsm] = useState('')
  const [selNoOfItem, setSelNoOfItem] = useState('')
  const [selUom, setSelUom] = useState('KGS')
  const [selCostRate, setSelCostRate] = useState(0)

  // Destination transfer states
  const [newLocation, setNewLocation] = useState('')
  const [newLocationQty, setNewLocationQty] = useState('')

  // Draft items in the current voucher
  const [voucherItems, setVoucherItems] = useState<TransferItem[]>([])

  // Set default date and location
  useEffect(() => {
    if (!date) {
      setDate(new Date().toISOString().split('T')[0])
    }
    if (activeLocations.length > 0 && !newLocation) {
      setNewLocation(activeLocations[0].name)
    }
  }, [activeLocations])

  // When records load from DB after initial mount, reset index to new-form position
  useEffect(() => {
    setCurrentIndex(records.length)
  }, [records.length === 0 ? 0 : 1]) // trigger only once when records go from empty to populated

  // Sync Jump Input whenever index changes
  useEffect(() => {
    setJumpNum(String(currentIndex + 1).padStart(5, '0'))
  }, [currentIndex])

  const isViewMode = currentIndex < records.length
  const activeVoucher = isViewMode ? records[currentIndex] : null

  // Auto-sync fields when browsing vouchers
  useEffect(() => {
    if (isViewMode && activeVoucher) {
      setNarration(activeVoucher.narration)
      setDate(activeVoucher.date)
    } else {
      setNarration('')
      setDate(new Date().toISOString().split('T')[0])
      if (activeLocations.length > 0) {
        setNewLocation(activeLocations[0].name)
      }
    }
  }, [currentIndex, records, isViewMode])

  // Real-time stock calculator callback
  const getAvailableStockList = () => {
    const balances = new Map<string, any>()

    // 1. Process all inward vouchers
    inwardVouchers.forEach(v => {
      v.items.forEach(item => {
        balances.set(item.itemCode, {
          itemCode: item.itemCode,
          productId: item.productId,
          productName: item.productName,
          lotNo: item.lotNo,
          condition: item.condition,
          width: item.width,
          length: item.length,
          gsm: item.gsm,
          noOfItem: item.noOfItem,
          uom: item.uom,
          quantity: item.quantity,
          costRate: item.costRate,
          location: item.location || 'Main Godown A',
          accountName: v.accountName
        })
      })
    })

    // 2. Process all transfers chronologically to prevent out-of-order chain losses (e.g. T1 -> T2)
    const sortedTransfers = [...records].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.id - b.id
    })

    sortedTransfers.forEach(v => {
      v.items.forEach(item => {
        const source = balances.get(item.sourceItemCode)
        if (source) {
          source.quantity -= item.quantity
        }
        balances.set(item.itemCode, {
          itemCode: item.itemCode,
          productId: item.productId || (source ? source.productId : ''),
          productName: item.productName,
          lotNo: item.lotNo || (source ? source.lotNo : '-'),
          condition: item.condition || (source ? source.condition : 'Fresh'),
          width: item.width || (source ? source.width : '-'),
          length: item.length || (source ? source.length : '-'),
          gsm: item.gsm || (source ? source.gsm : '-'),
          noOfItem: item.noOfItem || (source ? source.noOfItem : '-'),
          uom: item.uom || (source ? source.uom : 'KGS'),
          quantity: item.quantity,
          costRate: item.costRate || (source ? source.costRate : 0),
          location: item.location,
          accountName: item.accountName || (source ? source.accountName : '-')
        })
      })
    })

    // Filter out zero/negative balances
    return Array.from(balances.values()).filter(b => b.quantity > 0)
  }

  // Register window callbacks
  useEffect(() => {
    (window as any).getAvailableStockList = getAvailableStockList
    return () => {
      delete (window as any).getAvailableStockList
    }
  }, [inwardVouchers, records])

  useEffect(() => {
    (window as any).onSelectStock = (item: any) => {
      setSourceItemCode(item.itemCode)
      setSelectedAccount(item.accountName)
      setSelectedProductName(item.productName)
      setFromLocation(item.location)
      setAvailableQty(String(item.quantity))
      
      setSelProductId(item.productId)
      setSelLotNo(item.lotNo)
      setSelCondition(item.condition)
      setSelWidth(item.width)
      setSelLength(item.length)
      setSelGsm(item.gsm)
      setSelNoOfItem(item.noOfItem)
      setSelUom(item.uom)
      setSelCostRate(item.costRate)
    }
    return () => {
      delete (window as any).onSelectStock
    }
  }, [])


  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceItemCode || !newLocation || !newLocationQty) return

    if (newLocation === fromLocation) {
      alert('Destination Location must be different from Source Location.')
      return
    }

    const transferQtyVal = parseFloat(newLocationQty) || 0
    const availQtyVal = parseFloat(availableQty) || 0

    if (transferQtyVal <= 0) {
      alert('Transfer Quantity must be greater than zero.')
      return
    }

    if (transferQtyVal > availQtyVal) {
      alert(`Insufficient stock. Max available: ${availQtyVal}`)
      return
    }

    // Block: same source item to same destination in this draft
    if (voucherItems.some(item => item.sourceItemCode === sourceItemCode && item.location === newLocation)) {
      alert(`This item has already been transferred to "${newLocation}" in the current draft.`)
      return
    }

    // Count how many times this source item has been transferred globally
    // (across all saved vouchers + current draft) to assign correct T-suffix
    const countInSaved = records.reduce((acc: number, v: any) => {
      return acc + (v.items || []).filter(
        (it: any) => it.sourceItemCode === sourceItemCode || it.sourceItemCode?.replace(/-T\d+$/, '') === sourceItemCode.replace(/-T\d+$/, '')
      ).length
    }, 0)
    const countInDraft = voucherItems.filter(
      it => it.sourceItemCode === sourceItemCode
    ).length
    const nextSuffix = countInSaved + countInDraft + 1

    // Build new item code: strip any existing T-suffix from source and append new number
    const baseCode = sourceItemCode.replace(/-T\d+$/, '')
    const newItemCode = `${baseCode}-T${nextSuffix}`

    const newItem: any = {
      itemCode: newItemCode,
      sourceItemCode,
      productId: selProductId,
      productName: selectedProductName,
      lotNo: selLotNo,
      condition: selCondition,
      width: selWidth,
      length: selLength,
      gsm: selGsm,
      noOfItem: selNoOfItem,
      uom: selUom,
      quantity: transferQtyVal,
      costRate: selCostRate,
      costAmount: transferQtyVal * selCostRate,
      fromLocation,
      location: newLocation,
      accountName: selectedAccount
    }

    setVoucherItems(prev => [newItem, ...prev])

    // Reset details inputs
    setSourceItemCode('')
    setSelectedAccount('')
    setSelectedProductName('')
    setFromLocation('')
    setAvailableQty('')
    setNewLocationQty('')
  }

  const handleSaveVoucher = async () => {
    if (voucherItems.length === 0) {
      alert('Please add at least one transfer item to this voucher.')
      return
    }

    const nextVoucherNum = records.length + 1
    const voucherNo = `STOCKTRANSFER:${String(nextVoucherNum).padStart(5, '0')}`

    const recordData = {
      voucherNo,
      date,
      narration: narration.trim() || '-',
      items: JSON.stringify(voucherItems)
    }

    try {
      const insertedRecord = await window.api.db.insert('stockTransfers', recordData)
      const parsedRecord = {
        ...insertedRecord,
        items: JSON.parse(insertedRecord.items)
      }
      const updated = [...records, parsedRecord]
      setRecords(updated)

      setCurrentIndex(updated.length - 1)
    } catch (err) {
      console.error('Failed to save Stock Transfer voucher:', err)
      alert('Failed to save voucher to database.')
    }
  }

  // Navigation handlers
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
    setVoucherItems([])
    setNarration('')
    setDate(new Date().toISOString().split('T')[0])
  }

  // Calculate totals
  const displayItems = activeVoucher ? activeVoucher.items : voucherItems
  const totalQty = displayItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalCostVal = displayItems.reduce((sum, item) => sum + item.costAmount, 0)

  const currentVoucherNo = activeVoucher
    ? activeVoucher.voucherNo
    : `STOCKTRANSFER:${String(records.length + 1).padStart(5, '0')}`

  // Parse jump number digit lookup
  const cleanJumpNum = jumpNum.replace(/[^\d]/g, '')
  const parsedJumpIdx = parseInt(cleanJumpNum) ? parseInt(cleanJumpNum) - 1 : -1
  const isEditedNum = parsedJumpIdx !== currentIndex && cleanJumpNum.length === 5

  const handleJumpToVoucher = () => {
    if (parsedJumpIdx >= 0 && parsedJumpIdx <= records.length) {
      if (parsedJumpIdx === records.length) {
        handleNew()
      } else {
        setCurrentIndex(parsedJumpIdx)
      }
    } else {
      alert(`Voucher number out of range (Available range: STOCKTRANSFER:00001 to STOCKTRANSFER:${String(records.length + 1).padStart(5, '0')})`)
    }
  }

  // Search stock window pop-up opener
  const handleOpenSearchWindow = () => {
    const win = window.open('', '_blank', 'width=1000,height=600')
    if (!win) {
      alert('Popup blocked! Please allow popups for this app.')
      return
    }

    // Write interactive search document
    win.document.write(getStockSearchHtml(window.location.origin))
    win.document.close()
  }

  // Print Preview popup builder
  const handlePreview = () => {
    const vNo = currentVoucherNo
    const vDate = activeVoucher ? activeVoucher.date : date
    const vNarration = activeVoucher ? activeVoucher.narration : narration
    const vItems = activeVoucher ? activeVoucher.items : voucherItems

    if (vItems.length === 0) {
      alert('Voucher must have at least one item to preview.')
      return
    }

    const totalQtyVal = vItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalCostVal = vItems.reduce((sum, item) => sum + item.costAmount, 0)

    const win = window.open('', '_blank', 'width=850,height=700')
    if (!win) {
      alert('Popup blocked! Please allow popups for this app.')
      return
    }

    win.document.write(getTransferPreviewHtml(vNo, vDate, vNarration, vItems, window.location.origin))
    win.document.close()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4 font-sans text-xs text-[#09090b]">
      {/* VOUCHER CONTROL BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-[#09090b] font-sifonn">Stock Transfer</h2>
          
          {/* EDITABLE VOUCHER NUMBER SEARCH INPUT */}
          <div className="flex items-center bg-[#fafafa] border border-[#e4e4e7] rounded-md px-2 py-0.5">
            <span className="font-bold text-[10px] text-[#71717a] mr-1 uppercase">STOCKTRANSFER:</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-[#e4e4e7] rounded-xl bg-[#fafafa]">
        <div>
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Transfer Date</label>
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
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Narration / Remarks</label>
          <input
            type="text"
            disabled={isViewMode}
            placeholder="e.g. Stock shifted due to space shortage"
            value={isViewMode && activeVoucher ? activeVoucher.narration : narration}
            onChange={e => setNarration(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80"
          />
        </div>
      </div>

      {/* DRAFT LINE ITEMS INPUT (Only editable in New Entry mode) */}
      {!isViewMode && (
        <form onSubmit={handleAddItem} className="p-4 border border-[#e4e4e7] rounded-xl bg-white space-y-3 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Item Search</label>
              <button
                type="button"
                onClick={handleOpenSearchWindow}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] hover:bg-[#f4f4f5] cursor-pointer flex items-center justify-center gap-1 font-semibold text-[#71717a] hover:text-[#09090b] transition-colors"
              >
                <Search size={12} />
                <span>SEARCH STOCK</span>
              </button>
            </div>
            
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Account Name</label>
              <input
                type="text"
                readOnly
                placeholder="— Auto-filled —"
                value={selectedAccount}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#f4f4f5] text-[#71717a] focus:outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Item Name</label>
              <input
                type="text"
                readOnly
                placeholder="— Auto-filled —"
                value={selectedProductName}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#f4f4f5] text-[#71717a] focus:outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Source Location</label>
              <input
                type="text"
                readOnly
                placeholder="— Auto-filled —"
                value={fromLocation}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#f4f4f5] text-[#71717a] focus:outline-none font-semibold uppercase"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Available Qty</label>
              <input
                type="text"
                readOnly
                placeholder="— Auto-filled —"
                value={availableQty ? parseFloat(availableQty).toLocaleString('en-PK', { maximumFractionDigits: 0 }) : ''}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#f4f4f5] text-[#16a34a] focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">New Location</label>
              <select
                required
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-2.5 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
              >
                {activeLocations.map(l => (
                  <option key={l.id} value={l.name}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">New Location Qty</label>
              <input
                type="number"
                required
                step="any"
                min="0.01"
                placeholder="e.g. 300"
                value={newLocationQty}
                onChange={e => setNewLocationQty(e.target.value)}
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
              <span>ADD TO TRANSFER VOUCHER</span>
            </button>
          </div>
        </form>
      )}

      {/* VOUCHER ITEMS TABLE GRID */}
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3">New Item Code</th>
              <th className="p-3">Source Item Code</th>
              <th className="p-3">Item Name</th>
              <th className="p-3">Lot No</th>
              <th className="p-3">From Location</th>
              <th className="p-3">To Location</th>
              <th className="p-3">Size (WxL)</th>
              <th className="p-3">GSM</th>
              <th className="p-3">UOM</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-right">Rate</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {displayItems.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-4 text-center text-[#71717a] py-8 font-medium">
                  {isViewMode ? 'No transfers in this voucher' : 'No transfers added. Search stock and click ADD ROW above.'}
                </td>
              </tr>
            ) : (
              displayItems.map((item, idx) => (
                <tr key={item.itemCode || idx} className="hover:bg-[#fafafa]">
                  <td className="p-3 font-semibold text-[#71717a]">{item.itemCode}</td>
                  <td className="p-3 text-[#71717a]">{item.sourceItemCode}</td>
                  <td className="p-3 font-semibold">{item.productName}</td>
                  <td className="p-3 text-[#71717a]">{item.lotNo}</td>
                  <td className="p-3 text-[#71717a] uppercase">{item.fromLocation}</td>
                  <td className="p-3 font-bold text-[#09090b] uppercase">{item.location}</td>
                  <td className="p-3 text-[#71717a] font-medium">{item.width} x {item.length}</td>
                  <td className="p-3 text-[#71717a]">{item.gsm}</td>
                  <td className="p-3 text-[#71717a] font-bold uppercase">{item.uom}</td>
                  <td className="p-3 font-bold text-right">{item.quantity.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td className="p-3 font-medium text-right text-[#71717a]">{item.costRate.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td className="p-3 font-bold text-right text-emerald-600">PKR {item.costAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                </tr>
              ))
            )}
          </tbody>
          {displayItems.length > 0 && (
            <tfoot className="bg-[#fafafa] border-t-2 border-[#e4e4e7] font-bold text-right">
              <tr>
                <td colSpan={9} className="p-3 text-left uppercase text-[9px] tracking-wider text-[#71717a]">Voucher Total</td>
                <td className="p-3 text-right">{totalQty.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                <td></td>
                <td className="p-3 text-right text-emerald-600 text-sm">PKR {totalCostVal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
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
            <span>SAVE STOCK TRANSFER</span>
          </button>
        </div>
      )}
    </div>
  )
}
