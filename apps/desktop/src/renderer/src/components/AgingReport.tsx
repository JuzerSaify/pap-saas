import React from 'react'

export function AgingReport() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3">Customer Account</th>
              <th className="p-3">0-30 Days</th>
              <th className="p-3">31-60 Days</th>
              <th className="p-3">61-90 Days</th>
              <th className="p-3">90+ Days</th>
              <th className="p-3">Total Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            <tr>
              <td colSpan={6} className="p-3 text-center text-[#71717a] py-6 font-medium">
                No outstanding balances
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
