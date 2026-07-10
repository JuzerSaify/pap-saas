import React from 'react'
import { CheckCircle2 } from 'lucide-react'

interface Props {
  products: any[]
  contacts: any[]
  locations: any[]
  company: any
  syncResult: any
}

export function Dashboard({ products, contacts, locations, company, syncResult }: Props) {
  return (
    <div className="space-y-6 flex-1 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-[#e4e4e7] bg-[#fafafa] p-5 rounded-xl">
          <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider">Active Items</span>
          <div className="text-xl font-bold mt-1 text-[#09090b]">{products.length}</div>
        </div>
        <div className="border border-[#e4e4e7] bg-[#fafafa] p-5 rounded-xl">
          <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider">Total Accounts</span>
          <div className="text-xl font-bold mt-1 text-[#09090b]">{contacts.length}</div>
        </div>
        <div className="border border-[#e4e4e7] bg-[#fafafa] p-5 rounded-xl">
          <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider">Active Locations</span>
          <div className="text-xl font-bold mt-1 text-[#09090b]">{locations.length}</div>
        </div>
        <div className="border border-[#e4e4e7] bg-[#fafafa] p-5 rounded-xl">
          <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-wider">Active Workspace</span>
          <div className="text-xl font-bold mt-1 text-[#09090b] truncate">{company?.name || '—'}</div>
        </div>
      </div>

      {syncResult && (
        <div className="border border-[#e4e4e7] bg-[#fafafa] p-5 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="text-green-500 mt-0.5" size={16} />
          <div>
            <h4 className="font-bold text-xs text-[#09090b]">Synchronization Log</h4>
            <p className="text-[11px] text-[#71717a] mt-0.5">
              Pushed {syncResult.pushed} local changes. Pulled {syncResult.pulled} remote cloud edits successfully.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
