import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Save, FilePlus, Eye } from 'lucide-react'
import { LocationRecord } from './types'
import { getInwardPreviewHtml } from './popupTemplates'

export interface InwardItem {
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
  costAmount: number
  location?: string // Location for stock balance
}

export interface InwardVoucher {
  id: number
  voucherNo: string
  date: string
  accountName: string
  narration: string
  items: InwardItem[]
}

interface Props {
  activeLocations: LocationRecord[]
  products: any[]
  contacts: any[]
  records: InwardVoucher[]
  setRecords: React.Dispatch<React.SetStateAction<InwardVoucher[]>>
  journalVouchers?: any[]
  setJournalVouchers?: React.Dispatch<React.SetStateAction<any[]>>
}

export function StockInward({ activeLocations, products, contacts, records, setRecords, journalVouchers = [], setJournalVouchers }: Props) {
  // Navigation / View state
  const [currentIndex, setCurrentIndex] = useState(records.length)

  // Jump Voucher Input State
  const [jumpNum, setJumpNum] = useState('')

  // Header states
  const [date, setDate] = useState('')
  const [accountName, setAccountName] = useState('')
  const [narration, setNarration] = useState('')

  // Account search combobox states
  const [accountQuery, setAccountQuery] = useState('')
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [jvNo, setJvNo] = useState('')

  // Item details states
  const [lotNo, setLotNo] = useState('')
  const [productId, setProductId] = useState('')
  const [condition, setCondition] = useState<'Fresh' | 'Damage'>('Fresh')
  const [width, setWidth] = useState('')
  const [length, setLength] = useState('')
  const [gsm, setGsm] = useState('')
  const [noOfItem, setNoOfItem] = useState('')
  const [uom, setUom] = useState('KGS')
  const [quantity, setQuantity] = useState('')
  const [costRate, setCostRate] = useState('')
  const [itemLocation, setItemLocation] = useState('')

  // Draft items in the current voucher
  const [voucherItems, setVoucherItems] = useState<InwardItem[]>([])

  // Set default date and location
  useEffect(() => {
    if (!date) {
      setDate(new Date().toISOString().split('T')[0])
    }
    if (activeLocations.length > 0 && !itemLocation) {
      setItemLocation(activeLocations[0].name)
    }
  }, [activeLocations])

  // When records load from DB after initial mount, reset index to new-form position
  useEffect(() => {
    setCurrentIndex(records.length)
  }, [records.length === 0 ? 0 : 1]) // trigger only once when records go from empty to populated

  // Auto-sync UOM when product selection changes
  useEffect(() => {
    if (productId) {
      const prod = products.find(p => String(p.id) === productId)
      if (prod && prod.sku) {
        setUom(prod.sku)
      }
    }
  }, [productId, products])

  // Sync Jump Input whenever index changes
  useEffect(() => {
    setJumpNum(String(currentIndex + 1).padStart(5, '0'))
  }, [currentIndex])

  const isViewMode = currentIndex < records.length
  const activeVoucher = isViewMode ? records[currentIndex] : null

  useEffect(() => {
    if (isViewMode && activeVoucher) {
      setAccountQuery(activeVoucher.accountName)
      setAccountName(activeVoucher.accountName)
      setNarration(activeVoucher.narration)
      setDate(activeVoucher.date)
      const mappings = JSON.parse(localStorage.getItem('stockinward_jv_mappings') || '{}')
      setJvNo(mappings[activeVoucher.voucherNo] || '')
    } else {
      setAccountQuery('')
      setAccountName('')
      setNarration('')
      setDate(new Date().toISOString().split('T')[0])
      setJvNo('')
      if (activeLocations.length > 0) {
        setItemLocation(activeLocations[0].name)
      }
    }
  }, [currentIndex, records, isViewMode])

  // Count total saved items to guarantee progressive global ItemCode sequence
  const totalSavedItemsCount = records.reduce((sum, r) => sum + r.items.length, 0)

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || !quantity || !costRate || !itemLocation) return

    const prod = products.find(p => String(p.id) === productId)
    if (!prod) return

    // Auto-generate item code: e.g. ITM-10001
    const nextCodeNum = 10001 + totalSavedItemsCount + voucherItems.length
    const itemCode = `ITM-${nextCodeNum}`

    const qtyVal = parseFloat(quantity) || 0
    const rateVal = parseFloat(costRate) || 0

    const newItem: InwardItem = {
      itemCode,
      productId,
      productName: prod.name,
      lotNo: lotNo.trim() || '-',
      condition,
      width: width.trim() || '-',
      length: length.trim() || '-',
      gsm: gsm.trim() || '-',
      noOfItem: noOfItem.trim() || '-',
      uom,
      quantity: qtyVal,
      costRate: rateVal,
      costAmount: qtyVal * rateVal,
      location: itemLocation
    }

    // Add to top of grid
    setVoucherItems(prev => [newItem, ...prev])

    // Reset item fields for next input
    setLotNo('')
    setProductId('')
    setWidth('')
    setLength('')
    setGsm('')
    setNoOfItem('')
    setQuantity('')
    setCostRate('')
  }

  const handleSaveVoucher = async () => {
    if (!accountName) {
      alert('Please select an Account Name.')
      return
    }
    if (voucherItems.length === 0) {
      alert('Please add at least one item to this voucher.')
      return
    }
    if (!jvNo.trim()) {
      alert('WARNING: You must enter a Journal Voucher (JV) Number to save this Stock Inward!')
      return
    }

    const nextVoucherNum = records.length + 1
    const voucherNo = `STOCKIN:${String(nextVoucherNum).padStart(5, '0')}`

    const recordData = {
      voucherNo,
      date,
      accountName,
      narration: narration.trim() || '-',
      items: JSON.stringify(voucherItems)
    }

    try {
      const insertedRecord = await window.api.db.insert('stockInwards', recordData)
      const parsedRecord = {
        ...insertedRecord,
        items: JSON.parse(insertedRecord.items)
      }
      
      // Save JV reference mapping in localStorage
      const mappings = JSON.parse(localStorage.getItem('stockinward_jv_mappings') || '{}')
      mappings[voucherNo] = jvNo.trim()
      localStorage.setItem('stockinward_jv_mappings', JSON.stringify(mappings))



      const updated = [...records, parsedRecord]
      setRecords(updated)

      setCurrentIndex(updated.length - 1)
    } catch (err) {
      console.error('Failed to save Stock Inward voucher:', err)
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
    setAccountName('')
    setAccountQuery('')
    setNarration('')
    setDate(new Date().toISOString().split('T')[0])
  }

  // Calculate totals
  const displayItems = activeVoucher ? activeVoucher.items : voucherItems
  const totalQty = displayItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalCostVal = displayItems.reduce((sum, item) => sum + item.costAmount, 0)

  // Current computed amount for the active item row inputs
  const activeComputedCost = parseFloat(quantity) && parseFloat(costRate)
    ? (parseFloat(quantity) * parseFloat(costRate)).toLocaleString('en-PK', { maximumFractionDigits: 0 })
    : '0'

  const activeContacts = contacts.filter(c => c.isActive !== false)
  const activeProducts = products.filter(p => p.isActive !== false)

  const currentVoucherNo = activeVoucher
    ? activeVoucher.voucherNo
    : `STOCKIN:${String(records.length + 1).padStart(5, '0')}`

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
      alert(`Voucher number out of range (Available range: STOCKIN:00001 to STOCKIN:${String(records.length + 1).padStart(5, '0')})`)
    }
  }

  // Print/PDF/Excel popup generator
  const handlePreview = () => {
    const vNo = currentVoucherNo
    const vDate = activeVoucher ? activeVoucher.date : date
    const vAccount = activeVoucher ? activeVoucher.accountName : accountName
    const vNarration = activeVoucher ? activeVoucher.narration : narration
    const vItems = activeVoucher ? activeVoucher.items : voucherItems

    if (!vAccount) {
      alert('Please select an Account Name before previewing.')
      return
    }
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

    win.document.write(getInwardPreviewHtml(vNo, vDate, vAccount, vNarration, vItems, window.location.origin))
    win.document.close()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4 font-sans text-xs text-[#09090b]">
      {/* VOUCHER CONTROL BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-[#09090b] font-sifonn">Stock Inward</h2>
          
          {/* EDITABLE VOUCHER NUMBER SEARCH INPUT */}
          <div className="flex items-center bg-[#fafafa] border border-[#e4e4e7] rounded-md px-2 py-0.5">
            <span className="font-bold text-[10px] text-[#71717a] mr-1 uppercase">STOCKIN:</span>
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
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Inward Date</label>
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
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Account / Supplier Name</label>
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
                onFocus={() => setShowAccountDropdown(true)}
                onBlur={() => setTimeout(() => setShowAccountDropdown(false), 200)}
                onChange={e => {
                  setAccountQuery(e.target.value)
                  setAccountName(e.target.value)
                  setShowAccountDropdown(true)
                }}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white font-sans font-medium"
              />
              {showAccountDropdown && (
                <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-[#e4e4e7] rounded-md shadow-lg z-50">
                  {(() => {
                    const activeContacts = contacts.filter(c => c.isActive !== false)
                    const stockInHandContacts = activeContacts.filter(c => 
                      c.type === 'Stock-in-hand' || 
                      c.name.toLowerCase().includes('stock in hand') || 
                      c.name.toLowerCase().includes('stockinhand')
                    )
                    const displayContacts = stockInHandContacts.length > 0
                      ? stockInHandContacts
                      : [{ id: 'mock-stock-in-hand', name: 'Stock in Hand', type: 'Stock-in-hand' }]

                    const filtered = displayContacts.filter(c => c.name.toLowerCase().includes(accountQuery.toLowerCase()))
                    
                    if (filtered.length === 0) {
                      return <div className="p-2 text-xs text-[#71717a] italic">No matching accounts</div>
                    }

                    return filtered.map(c => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setAccountName(c.name)
                          setAccountQuery(c.name)
                          setShowAccountDropdown(false)
                        }}
                        className="p-2.5 hover:bg-[#fafafa] cursor-pointer text-xs font-semibold border-b last:border-b-0 border-[#f4f4f5]"
                      >
                        {c.name}
                      </div>
                    ))
                  })()}
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
            placeholder="e.g. Received shipment from Lahore mill"
            value={isViewMode && activeVoucher ? activeVoucher.narration : narration}
            onChange={e => setNarration(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80"
          />
        </div>

        <div>
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Journal Voucher Ref (JV No)</label>
          <input
            type="text"
            required
            disabled={isViewMode}
            placeholder="e.g. JV:00001"
            value={jvNo}
            onChange={e => setJvNo(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80 font-bold"
          />
        </div>
      </div>

      {/* DRAFT LINE ITEMS INPUT (Only editable in New Entry mode) */}
      {!isViewMode && (
        <form onSubmit={handleAddItem} className="p-4 border border-[#e4e4e7] rounded-xl bg-white space-y-3 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Item Name</label>
              <select
                required
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-2.5 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
              >
                <option value="">— Select —</option>
                {activeProducts.map(p => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Lot No</label>
              <input
                type="text"
                placeholder="e.g. LOT-45A"
                value={lotNo}
                onChange={e => setLotNo(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as any)}
                className="w-full h-9 border border-[#e4e4e7] px-2.5 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
              >
                <option value="Fresh">Fresh</option>
                <option value="Damage">Damage</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Location / Godown</label>
              <select
                required
                value={itemLocation}
                onChange={e => setItemLocation(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-2.5 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
              >
                {activeLocations.map(l => (
                  <option key={l.id} value={l.name}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Width</label>
              <input
                type="text"
                placeholder="e.g. 36"
                value={width}
                onChange={e => setWidth(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Length</label>
              <input
                type="text"
                placeholder="e.g. 48"
                value={length}
                onChange={e => setLength(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">GSM</label>
              <input
                type="text"
                placeholder="e.g. 230"
                value={gsm}
                onChange={e => setGsm(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">No of items</label>
              <input
                type="text"
                placeholder="e.g. 100"
                value={noOfItem}
                onChange={e => setNoOfItem(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">UOM</label>
              <select
                value={uom}
                onChange={e => setUom(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-2.5 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
              >
                <option value="KGS">KGS</option>
                <option value="RIM">RIM</option>
                <option value="PKT">PKT</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Quantity</label>
              <input
                type="number"
                required
                step="any"
                min="0"
                placeholder="e.g. 500"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Cost Rate</label>
              <input
                type="number"
                required
                step="any"
                min="0"
                placeholder="e.g. 150"
                value={costRate}
                onChange={e => setCostRate(e.target.value)}
                className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
              />
            </div>
            <button
              type="submit"
              className="h-9 w-full flex items-center justify-center gap-1 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer shadow-sm shrink-0"
              title="Add Item Row"
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
              <th className="p-3">Item Name</th>
              <th className="p-3">Lot No</th>
              <th className="p-3">Condition</th>
              <th className="p-3">Location</th>
              <th className="p-3">Size (WxL)</th>
              <th className="p-3">GSM</th>
              <th className="p-3">Items/Pcs</th>
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
                  {isViewMode ? 'No items in this voucher' : 'No items added. Fill inputs and click ADD ROW (+) above.'}
                </td>
              </tr>
            ) : (
              displayItems.map((item, idx) => (
                <tr key={item.itemCode || idx} className="hover:bg-[#fafafa]">
                  <td className="p-3 font-semibold text-[#71717a]">{item.itemCode}</td>
                  <td className="p-3 font-semibold">{item.productName}</td>
                  <td className="p-3 text-[#71717a]">{item.lotNo}</td>
                  <td className="p-3">
                    <span className={`badge ${
                      item.condition === 'Fresh'
                        ? 'badge-fresh'
                        : 'badge-damage'
                    }`}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="p-3 text-[#71717a] font-semibold uppercase">{item.location || '-'}</td>
                  <td className="p-3 text-[#71717a] font-medium">{item.width} x {item.length}</td>
                  <td className="p-3 text-[#71717a]">{item.gsm}</td>
                  <td className="p-3 text-[#71717a]">{item.noOfItem}</td>
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
            <span>SAVE STOCK INWARD</span>
          </button>
        </div>
      )}
    </div>
  )
}
