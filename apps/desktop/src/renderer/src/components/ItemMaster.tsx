import React, { useState, useEffect } from 'react'
import { Pencil, Search } from 'lucide-react'

interface Props {
  company: any
  products: any[]
  setProducts: React.Dispatch<React.SetStateAction<any[]>>
}

export function ItemMaster({ company, products, setProducts }: Props) {
  const [name, setName] = useState('')
  const [paperType, setPaperType] = useState('Art Card')
  const [uom, setUom] = useState('KGS')
  const [editId, setEditId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    try {
      if (editId) {
        const updated = await window.api.db.update('products', editId, {
          name,
          paperType,
          sku: uom
        })
        setProducts(prev => prev.map(p => p.id === editId ? { ...p, ...updated, name, paperType, sku: uom } : p))
        setEditId(null)
      } else {
        const res = await window.api.db.insert('products', {
          companyId: company.id,
          name,
          paperType,
          sku: uom,
          basePrice: 0,
          taxRate: 18
        })
        setProducts(prev => [...prev, res])
      }
      setName('')
      setPaperType('Art Card')
      setUom('KGS')
    } catch (e) {
      console.error(e)
    }
  }

  const startEdit = (p: any) => {
    setEditId(p.id)
    setName(p.name)
    setPaperType(p.paperType || 'Art Card')
    setUom(p.sku || 'KGS')
  }

  const cancelEdit = () => {
    setEditId(null)
    setName('')
    setPaperType('Art Card')
    setUom('KGS')
  }

  const toggleStatus = async (id: string, currentActive: boolean) => {
    try {
      const nextActive = !currentActive
      const updated = await window.api.db.update('products', id, { isActive: nextActive })
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated, isActive: nextActive } : p))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3 pb-4 border-b border-[#e4e4e7]">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Item Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Art Card Glossy"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs focus:outline-none focus:border-[#09090b] bg-[#fafafa]"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">Type</label>
          <select
            value={paperType}
            onChange={e => setPaperType(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
          >
            <option value="Art Card">Art Card</option>
            <option value="Bleach Board">Bleach Board</option>
            <option value="Offset Paper">Offset Paper</option>
            <option value="Box Board">Box Board</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[9px] font-bold text-[#71717a] mb-1 uppercase tracking-wider">UOM (Unit of Measure)</label>
          <select
            value={uom}
            onChange={e => setUom(e.target.value)}
            className="w-full h-9 border border-[#e4e4e7] px-3 rounded-md text-xs bg-[#fafafa] focus:outline-none focus:border-[#09090b]"
          >
            <option value="KGS">KGS</option>
            <option value="RIM">RIM</option>
            <option value="PKT">PKT</option>
          </select>
        </div>
        <div className="flex gap-2">
          {editId ? (
            <>
              <button type="submit" className="h-9 px-5 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer shadow-sm shrink-0 animate-pulse">
                Save Changes
              </button>
              <button type="button" onClick={cancelEdit} className="h-9 px-4 bg-white text-[#71717a] border border-[#e4e4e7] font-semibold text-xs rounded-md hover:bg-[#f4f4f5] transition-all cursor-pointer">
                Cancel
              </button>
            </>
          ) : (
            <button type="submit" className="h-9 px-5 bg-[#54e0e7] text-[#09090b] font-bold text-xs rounded-md hover:bg-[#3cd5dc] transition-all cursor-pointer shadow-sm shrink-0">
              Create Item
            </button>
          )}
        </div>
      </form>

      <div className="flex-1 overflow-auto border border-[#e4e4e7] rounded-xl bg-white">
        <table className="w-full border-collapse text-left text-xs text-[#09090b]">
          <thead className="bg-[#fafafa] border-b border-[#e4e4e7] font-semibold text-[#71717a] uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-3 w-64 min-w-[200px]">
                {isSearching ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      placeholder="Search Item..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full max-w-[180px] h-7 px-2 border border-[#e4e4e7] rounded text-xs focus:outline-none focus:border-[#09090b] bg-white font-sans font-medium"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                    <button onClick={(e) => { e.stopPropagation(); setIsSearching(false); setSearchQuery(''); }} className="text-[#71717a] hover:text-[#09090b] cursor-pointer text-xs">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[#09090b] transition-colors" onClick={() => setIsSearching(true)}>
                    <span>Item Name</span>
                    <Search size={12} className="text-[#71717a]" />
                  </div>
                )}
              </th>
              <th className="p-3">Type</th>
              <th className="p-3">UOM</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e4e7]">
            {products.length === 0 ? (
              <tr><td colSpan={5} className="p-3 text-center text-[#71717a] py-6 font-medium">No items registered in SQLite database</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={5} className="p-3 text-center text-[#71717a] py-6 font-medium">No matching items found</td></tr>
            ) : filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-[#fafafa]">
                <td className="p-3 font-semibold">{p.name}</td>
                <td className="p-3 text-[#71717a] font-medium">{p.paperType || '-'}</td>
                <td className="p-3 text-[#71717a] font-bold uppercase">{p.sku || '-'}</td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => toggleStatus(p.id, p.isActive !== false)}
                    className={`px-2 py-0.5 rounded font-semibold text-[10px] border cursor-pointer select-none transition-all active:scale-95 ${
                      p.isActive !== false
                        ? 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'
                        : 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {p.isActive !== false ? 'Active' : 'Postponed'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => startEdit(p)}
                    className="p-1.5 text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5] rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Pencil size={11} />
                    <span className="text-[10px]">Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
