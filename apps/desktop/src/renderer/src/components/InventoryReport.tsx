import React from 'react'

export function InventoryReport() {
  const staticData = [
    { item: 'Kraft Board 180GSM', location: 'Main Godown A', stock: '7.4 MT' },
    { item: 'Kraft Board 180GSM', location: 'Factory Depot', stock: '5.0 MT' },
    { item: 'Duplex Board 230GSM', location: 'Port Warehouse 2', stock: '12.0 MT' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3">Paper Item</th>
              <th className="p-3">Godown Location</th>
              <th className="p-3">Physical In Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {staticData.map((r, i) => (
              <tr key={i} className="hover:bg-[#fafafa]">
                <td className="p-3 font-semibold">{r.item}</td>
                <td className="p-3 text-[#71717a] font-medium">{r.location}</td>
                <td className="p-3 font-bold text-green-600">{r.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
