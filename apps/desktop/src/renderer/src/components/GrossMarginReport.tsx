import React from 'react'

export function GrossMarginReport() {
  return (
    <div className="space-y-6 flex-1 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-[#e4e4e7] bg-[#fafafa] p-5 rounded-xl">
          <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider">Gross Sales Value</span>
          <div className="text-xl font-bold mt-1 text-[#09090b]">PKR 0.00</div>
        </div>
        <div className="border border-[#e4e4e7] bg-[#fafafa] p-5 rounded-xl">
          <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider">Material Cost (COGS)</span>
          <div className="text-xl font-bold mt-1 text-[#09090b]">PKR 0.00</div>
        </div>
        <div className="border border-[#e4e4e7] bg-[#fafafa] p-5 rounded-xl">
          <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider">Estimated Gross Profit</span>
          <div className="text-xl font-bold mt-1 text-green-600">PKR 0.00 (0.0%)</div>
        </div>
      </div>
    </div>
  )
}
