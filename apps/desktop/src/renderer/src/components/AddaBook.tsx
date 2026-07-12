import React, { useState, useEffect } from 'react'
import { Search, Eye, Trash2, Calendar, FileText, Truck, MapPin, ChevronLeft, ChevronRight, FilePlus } from 'lucide-react'
import { getAddaPreviewHtml } from './popupTemplates'

interface DOItem {
  itemCode: string
  productId: number
  productName: string
  lotNo: string
  condition: string
  width: number
  length: number
  gsm: number
  noOfItem: number
  uom: string
  quantity: number
  location: string
}

interface BookingRecord {
  id: number
  voucherNo: string
  doNo: string
  vehicle: string
  transporter: string
  destination: string
  totalPackets: number
  totalWeight: number
  status: string
  date: string
  cartage: number
  items?: (DOItem & { calculatedWeight: number })[]
}

interface Props {
  deliveryOrders?: any[]
}

const padNo = (num: number) => String(num).padStart(5, '0')

// ── Weight Calculation Helper ────────────────────────────────────────────────
// Formula: ((Width * Length * GSM) / Divisor) * Qty
// Divisor is 3100 if GSM < 150, else 15500
export function calculateItemWeight(w: number, l: number, gsm: number, qty: number): number {
  if (!w || !l || !gsm || !qty) return 0
  const divisor = gsm < 150 ? 3100 : 15500
  const wt = ((w * l * gsm) / divisor) * qty
  return Math.round(wt * 100) / 100 // round to 2 decimal places
}

export function AddaBook({ deliveryOrders = [] }: Props) {
  // ── State Persistence (localStorage) ─────────────────────────────────────────
  const [records, setRecords] = useState<BookingRecord[]>(() => {
    const saved = localStorage.getItem('adda_booking_records')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('adda_booking_records', JSON.stringify(records))
  }, [records])

  // ── Navigation States ────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(records.length)
  const [jumpNum, setJumpNum] = useState('')

  // Sync index when records length changes
  useEffect(() => {
    setCurrentIndex(records.length)
  }, [records.length === 0 ? 0 : 1])

  // Sync jump input
  useEffect(() => {
    setJumpNum(String(currentIndex + 1).padStart(5, '0'))
  }, [currentIndex])

  const isViewMode = currentIndex < records.length
  const activeRecord = isViewMode ? records[currentIndex] : null

  // ── Form States ─────────────────────────────────────────────────────────────
  const [doSearchNo, setDoSearchNo] = useState('')
  const [doNo, setDoNo] = useState('-')
  const [vehicle, setVehicle] = useState('')
  const [transporter, setTransporter] = useState('')
  const [destination, setDestination] = useState('')
  const [totalPackets, setTotalPackets] = useState<number | ''>('')
  const [totalWeight, setTotalWeight] = useState<number | ''>('')
  const [cartage, setCartage] = useState<number | ''>('')
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0])
  const [fetchedItems, setFetchedItems] = useState<(DOItem & { calculatedWeight: number })[]>([])

  // ── Auto-sync Fields on Nav ─────────────────────────────────────────────────
  useEffect(() => {
    if (isViewMode && activeRecord) {
      setDoNo(activeRecord.doNo)
      setVehicle(activeRecord.vehicle)
      setTransporter(activeRecord.transporter)
      setDestination(activeRecord.destination)
      setTotalPackets(activeRecord.totalPackets)
      setTotalWeight(activeRecord.totalWeight)
      setCartage(activeRecord.cartage || 0)
      setBookingDate(activeRecord.date)
      setFetchedItems(activeRecord.items || [])
      setDoSearchNo('')
    } else {
      // Draft / New Booking Mode
      setDoNo('-')
      setVehicle('')
      setTransporter('')
      setDestination('')
      setTotalPackets('')
      setTotalWeight('')
      setCartage('')
      setBookingDate(new Date().toISOString().split('T')[0])
      setFetchedItems([])
      setDoSearchNo('')
    }
  }, [currentIndex, isViewMode])

  // ── Fetch DO Logic ───────────────────────────────────────────────────────────
  const handleFetchDO = () => {
    if (isViewMode) return
    if (!doSearchNo.trim()) return

    const cleanedNum = doSearchNo.replace(/[^\d]/g, '')
    const searchNo = cleanedNum
      ? `DO:${cleanedNum.padStart(5, '0')}`
      : doSearchNo.trim()

    const foundDO = deliveryOrders.find(
      (v) => v.voucherNo.toUpperCase() === searchNo.toUpperCase()
    )

    if (!foundDO) {
      alert(`Delivery Order "${searchNo}" not found. Verify it has been saved in DO tab.`)
      return
    }

    // Check if this DO is already booked in records
    const alreadyBooked = records.find(
      (r) => r.doNo.toUpperCase() === foundDO.voucherNo.toUpperCase()
    )
    if (alreadyBooked) {
      alert(
        `This Delivery Order "${foundDO.voucherNo}" has already been dispatched in Adda Book record "${alreadyBooked.voucherNo}". You cannot create multiple Adda Book records for a single DO.`
      )
      return
    }

    setDoNo(foundDO.voucherNo)
    setVehicle(foundDO.vehicle === '-' ? '' : foundDO.vehicle)
    
    // Attempt destination deduction from the first item location
    const firstItem = foundDO.items?.[0]
    if (firstItem && firstItem.location) {
      setDestination(firstItem.location.toUpperCase())
    } else {
      setDestination('')
    }

    const processed = (foundDO.items || []).map((item: any) => {
      const w = Number(item.width) || 0
      const l = Number(item.length) || 0
      const g = Number(item.gsm) || 0
      const q = Number(item.quantity) || 0
      const calculatedWeight = calculateItemWeight(w, l, g, q)
      return {
        ...item,
        calculatedWeight
      }
    })

    setFetchedItems(processed)

    const totalPkts = processed.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0)
    const totalWt = processed.reduce((sum: number, it: any) => sum + it.calculatedWeight, 0)

    setTotalPackets(totalPkts)
    setTotalWeight(Math.round(totalWt * 100) / 100)
    setDoSearchNo('')
  }

  // ── Navigation Triggers ──────────────────────────────────────────────────────
  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(records.length, prev + 1))
  }

  const handleNew = () => {
    setCurrentIndex(records.length)
  }

  const handleJumpToBooking = () => {
    const num = parseInt(jumpNum, 10)
    if (num > 0 && num <= records.length) {
      setCurrentIndex(num - 1)
    } else if (num === records.length + 1) {
      setCurrentIndex(records.length)
    } else {
      alert(`Booking number out of range (Available range: 00001 to ${padNo(records.length + 1)})`)
    }
  }

  // ── Save Booking ─────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isViewMode) return

    if (
      !vehicle.trim() ||
      !transporter.trim() ||
      !destination.trim() ||
      totalPackets === '' ||
      totalWeight === '' ||
      cartage === ''
    ) {
      alert('Please fill out all required fields. No fields can be left blank.')
      return
    }

    // Double check that the selected DO has not been booked in another record
    if (doNo && doNo !== '-') {
      const alreadyBooked = records.find(
        (r) => r.doNo.toUpperCase() === doNo.toUpperCase()
      )
      if (alreadyBooked) {
        alert(
          `This Delivery Order "${doNo}" has already been dispatched in Adda Book record "${alreadyBooked.voucherNo}".`
        )
        return
      }
    }

    const nextVoucherNo = `ADDA:${padNo(records.length + 1)}`
    const newRecord: BookingRecord = {
      id: Date.now(),
      voucherNo: nextVoucherNo,
      doNo,
      vehicle: vehicle.trim(),
      transporter: transporter.trim(),
      destination: destination.trim(),
      totalPackets: Number(totalPackets) || 0,
      totalWeight: Number(totalWeight) || 0,
      status: 'Dispatched',
      date: bookingDate,
      cartage: Number(cartage) || 0,
      items: fetchedItems
    }

    const updated = [...records, newRecord]
    setRecords(updated)

    // Put current index directly on the newly saved record's slot
    setCurrentIndex(updated.length - 1)
  }

  // ── Print Preview ────────────────────────────────────────────────────────────
  const handlePreview = () => {
    const r = activeRecord
    if (!r) return
    const origin = window.location.origin
    const popup = window.open('', `AddaPreview_${r.voucherNo}`, 'width=1050,height=750,resizable=yes')
    if (!popup) return
    popup.document.write(getAddaPreviewHtml(
      r.voucherNo,
      r.date,
      r.doNo,
      r.vehicle,
      r.transporter,
      r.destination,
      r.totalPackets,
      r.totalWeight,
      r.items || [],
      origin,
      r.cartage || 0
    ))
    popup.document.close()
  }

  const handleDeleteRecord = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this booking record?')) {
      const idx = records.findIndex(r => r.id === id)
      const updated = records.filter((r) => r.id !== id)
      setRecords(updated)
      
      // Sync index safely
      if (currentIndex >= updated.length) {
        setCurrentIndex(updated.length)
      }
    }
  }

  const isEditedNum = jumpNum !== String(currentIndex + 1).padStart(5, '0')

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4 font-sans text-xs text-[#09090b]">
      
      {/* VOUCHER CONTROL BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-[#09090b] font-sifonn">Adda Book</h2>

          {/* EDITABLE VOUCHER NUMBER SEARCH INPUT */}
          <div className="flex items-center bg-[#fafafa] border border-[#e4e4e7] rounded-md px-2 py-0.5">
            <span className="font-bold text-[10px] text-[#71717a] mr-1 uppercase">ADDA:</span>
            <input
              type="text"
              value={jumpNum}
              onChange={e => setJumpNum(e.target.value.replace(/[^\d]/g, ''))}
              maxLength={5}
              className="w-16 h-6 border-0 bg-transparent text-center font-bold text-xs focus:outline-none"
            />
            {isEditedNum && (
              <button
                onClick={handleJumpToBooking}
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
              title="Previous Dispatch"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === records.length}
              className="p-1.5 border border-[#e4e4e7] rounded-md hover:bg-[#f4f4f5] disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer transition-colors"
              title="Next Dispatch"
            >
              <ChevronRight size={14} />
            </button>

            {isViewMode && (
              <button
                onClick={handlePreview}
                className="flex items-center gap-1 h-7 px-3 border border-[#e4e4e7] rounded-md text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] transition-all cursor-pointer font-bold text-[10px]"
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
            <span>NEW BOOKING</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT DISPLAY */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden h-full">
        {/* LEFT COLUMN: Booking Form & List Registry */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0">
          
          {/* DO FETCH & SUBMIT BOOKING CONTAINER */}
          <div className="p-4 border border-[#e4e4e7] rounded-xl bg-[#fafafa] flex flex-col gap-3">
            
            {/* Top row: DO Lookup (hidden in view mode) */}
            {!isViewMode && (
              <div className="flex items-center gap-3 pb-3 border-b border-[#e4e4e7]">
                <div className="flex-1 max-w-[320px]">
                  <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
                    Fetch DO Details
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. DO:00001 or 1"
                      value={doSearchNo}
                      onChange={(e) => setDoSearchNo(e.target.value)}
                      className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleFetchDO}
                      className="h-9 px-3 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer flex items-center gap-1 shrink-0 font-sifonn"
                    >
                      <Search size={12} />
                      <span>FETCH</span>
                    </button>
                  </div>
                </div>
                {doNo !== '-' && (
                  <div className="flex flex-col text-[10px] ml-auto bg-white px-3 py-1.5 border border-[#e4e4e7] rounded-md font-semibold text-[#71717a]">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Linked Order</span>
                    <span className="text-[#09090b] font-bold text-xs">{doNo}</span>
                  </div>
                )}
              </div>
            )}

            {/* Form fields */}
            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
                  Booking Date
                </label>
                <input
                  type="date"
                  required
                  disabled={isViewMode}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
                  Truck / Vehicle No
                </label>
                <input
                  type="text"
                  required
                  disabled={isViewMode}
                  placeholder="e.g. LET-12-9876"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80 font-medium"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
                  Transporter
                </label>
                <input
                  type="text"
                  required
                  disabled={isViewMode}
                  placeholder="e.g. Shalimar Logistics"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
                  Destination Hub
                </label>
                <input
                  type="text"
                  required
                  disabled={isViewMode}
                  placeholder="e.g. Karachi Port"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80 font-medium"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
                  Total Packets (Qty)
                </label>
                <input
                  type="number"
                  required
                  disabled={isViewMode}
                  placeholder="0"
                  value={totalPackets}
                  onChange={(e) => setTotalPackets(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80 font-semibold text-neutral-800"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
                  Calculated Weight (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    disabled={isViewMode}
                    placeholder="0.00"
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-9 border border-[#e4e4e7] pl-3 pr-8 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80 font-bold text-emerald-700"
                  />
                  <span className="absolute right-3 top-2.5 text-[9px] font-bold text-neutral-400">KG</span>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">
                  Cartage Amount (PKR)
                </label>
                <input
                  type="number"
                  required
                  disabled={isViewMode}
                  placeholder="e.g. 5000"
                  value={cartage}
                  onChange={(e) => setCartage(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-white disabled:bg-neutral-100 disabled:opacity-80 font-bold text-neutral-800"
                />
              </div>

              <div className="flex items-end">
                {!isViewMode ? (
                  <button
                    type="submit"
                    className="w-full h-9 bg-black text-white font-bold text-xs rounded-md hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider font-sifonn"
                  >
                    <span>BOOK DISPATCH</span>
                  </button>
                ) : (
                  <div className="w-full h-9 border border-[#e4e4e7] rounded-md bg-[#f4f4f5] text-[#71717a] font-bold text-[10px] flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    <span>SAVED RECORD</span>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* REGISTRY HISTORY TABLE */}
          <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white min-h-[250px]">
            <table className="w-full border-collapse text-left text-xs text-[#09090b]">
              <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10 text-[9px]">
                <tr>
                  <th className="p-3 w-16">Date</th>
                  <th className="p-3 w-20">Voucher No</th>
                  <th className="p-3 w-20">DO Number</th>
                  <th className="p-3">Item Details</th>
                  <th className="p-3 w-24">Vehicle Details</th>
                  <th className="p-3 w-28">Transporter</th>
                  <th className="p-3 w-28">Destination</th>
                  <th className="p-3 text-right w-16">Packets</th>
                  <th className="p-3 text-right w-20">Weight (kg)</th>
                  <th className="p-3 text-right w-20">Cartage</th>
                  <th className="p-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e4e7]">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[#71717a] font-medium italic">
                      No booking records registered yet. Load a Delivery Order above to begin.
                    </td>
                  </tr>
                ) : (
                  records.map((r, index) => (
                    <tr
                      key={r.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`hover:bg-neutral-50 cursor-pointer transition-colors ${
                        currentIndex === index ? 'bg-neutral-50 font-medium' : ''
                      }`}
                    >
                      <td className="p-3 text-neutral-500 font-mono">{r.date}</td>
                      <td className="p-3 font-bold text-[#09090b]">{r.voucherNo}</td>
                      <td className="p-3 font-semibold text-[#71717a]">{r.doNo}</td>
                      <td className="p-3">
                        {r.items && r.items.length > 0 ? (
                          <div className="space-y-0.5 max-w-[280px]">
                            {r.items.map((it, idx) => (
                              <div key={idx} className="text-[10px] text-neutral-600 truncate">
                                • {it.productName} ({it.width}x{it.length} | {it.gsm}g | {it.quantity} Pkts)
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">Manual Entry</span>
                        )}
                      </td>
                      <td className="p-3 font-semibold uppercase">{r.vehicle}</td>
                      <td className="p-3 text-neutral-600">{r.transporter}</td>
                      <td className="p-3 text-neutral-600 font-medium">{r.destination}</td>
                      <td className="p-3 text-right font-semibold text-neutral-700">
                        {r.totalPackets.toLocaleString('en-PK')}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {r.totalWeight.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-bold text-[#09090b]">
                        {r.cartage ? `PKR ${r.cartage.toLocaleString('en-PK')}` : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRecord(r.id, e)}
                          className="p-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete dispatch log"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Dispatch Details Panel */}
        <div className="w-full md:w-[350px] border border-[#e4e4e7] bg-white rounded-xl flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-[#e4e4e7] bg-[#fafafa]">
            <h3 className="text-xs font-bold text-[#09090b] uppercase tracking-wider">
              Booking Specification
            </h3>
            <p className="text-[10px] text-[#71717a] mt-0.5">
              Detailed breakdown of selected transport log
            </p>
          </div>

          {activeRecord ? (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
              
              {/* Status & Date Badge */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase font-mono">
                  <Calendar size={11} />
                  {activeRecord.date}
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold border text-emerald-600 bg-emerald-50 border-emerald-100 uppercase tracking-wide">
                  {activeRecord.status}
                </span>
              </div>

              {/* Core Info Cards */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2 bg-[#fafafa] border border-[#e4e4e7] rounded-lg">
                  <Truck className="text-neutral-400 shrink-0 mt-0.5" size={14} />
                  <div className="flex-1 text-xs">
                    <div className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">Transport Details</div>
                    <div className="font-bold text-[#09090b] uppercase mt-0.5">{activeRecord.vehicle}</div>
                    <div className="text-[10px] text-neutral-500">{activeRecord.transporter}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 bg-[#fafafa] border border-[#e4e4e7] rounded-lg">
                  <MapPin className="text-neutral-400 shrink-0 mt-0.5" size={14} />
                  <div className="flex-1 text-xs">
                    <div className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">Destination Hub</div>
                    <div className="font-bold text-[#09090b] uppercase mt-0.5">{activeRecord.destination}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 bg-[#fafafa] border border-[#e4e4e7] rounded-lg">
                  <FileText className="text-neutral-400 shrink-0 mt-0.5" size={14} />
                  <div className="flex-1 text-xs">
                    <div className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider">Linked Voucher</div>
                    <div className="font-bold text-[#09090b] mt-0.5">{activeRecord.doNo}</div>
                  </div>
                </div>
              </div>

              {/* Cargo itemized breakdown */}
              <div className="flex-1 flex flex-col min-h-[150px]">
                <div className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider mb-2">
                  Itemized Weight List
                </div>
                {activeRecord.items && activeRecord.items.length > 0 ? (
                  <div className="space-y-1.5 flex-1 overflow-y-auto">
                    {activeRecord.items.map((item, idx) => (
                      <div key={idx} className="p-2 border border-neutral-100 rounded-lg text-xs flex justify-between items-center bg-white hover:bg-neutral-50 transition-colors">
                        <div>
                          <div className="font-semibold text-neutral-800">{item.productName}</div>
                          <div className="text-[9px] text-[#71717a] font-mono mt-0.5">
                            LOT: {item.lotNo} | {item.width}x{item.length} | {item.gsm} GSM
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-neutral-800">{item.quantity.toLocaleString('en-PK')} {item.uom}</div>
                          <div className="text-[10px] font-extrabold text-emerald-600 font-mono mt-0.5">
                            {item.calculatedWeight.toLocaleString('en-PK')} kg
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 border border-dashed border-neutral-200 rounded-lg flex items-center justify-center text-center p-4 text-[10px] text-neutral-400 italic">
                    Manual entry dispatch.<br />No item details available.
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="border-t border-[#e4e4e7] pt-3 mt-auto space-y-1">
                <div className="flex justify-between items-center text-[10px] font-medium text-neutral-500 uppercase">
                  <span>Total Packets</span>
                  <span className="font-bold text-[#09090b]">{activeRecord.totalPackets.toLocaleString('en-PK')}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-medium text-neutral-500 uppercase">
                  <span>Cartage Fee</span>
                  <span className="font-bold text-neutral-800">
                    {activeRecord.cartage ? `PKR ${activeRecord.cartage.toLocaleString('en-PK')}` : 'PKR 0'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-[#09090b] uppercase">
                  <span>Total Weight</span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    {activeRecord.totalWeight.toLocaleString('en-PK', { minimumFractionDigits: 2 })} kg
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
              <Truck size={36} className="text-neutral-300 stroke-[1.5] mb-2" />
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                No Selection
              </p>
              <p className="text-[10px] text-neutral-400 mt-1 max-w-[200px]">
                Select a record from the history table to view the loaded shipment cargo list.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
