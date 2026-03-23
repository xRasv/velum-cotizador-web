'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Save, ArrowLeft, ChevronDown, Check } from 'lucide-react'
import Link from 'next/link'
import { createInvoice } from '@/app/actions'

type Product = {
  id: string
  name: string
  image_url: string | null
}

type AddonInput = {
  id: string
  addon_name: string
  price: number
  is_selected: boolean
  isCustom?: boolean
}

type ItemInput = {
  id: string
  room_name: string
  product_name: string
  isCustomProduct?: boolean
  width: number
  height: number
  fabric_name: string
  base_price: number
  image_url: string
  addons: AddonInput[]
}

const PREDEFINED_ADDONS = [
  "Motor Automático (Control Remoto)",
  "Cenefa Decorativa Premium",
  "Fascia de Aluminio",
  "Mecanismo de Doble Rodillo"
]

function CustomDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  options: string[], 
  value: string, 
  onChange: (val: string, isCustom: boolean) => void,
  placeholder: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isCustomValue = value && !options.includes(value) && value !== 'Otro'

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center border border-gray-200 rounded-lg p-2.5 text-sm bg-white hover:border-primary transition-colors focus:ring-2 focus:ring-primary outline-none"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {isCustomValue ? "Otro (Personalizado)" : (value || placeholder)}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="max-h-60 overflow-y-auto p-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt, false)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors
                  ${value === opt ? 'bg-primary/5 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}
                `}
              >
                {opt}
                {value === opt && <Check size={14} />}
              </button>
            ))}
            <div className="h-px bg-gray-100 my-1 mx-2" />
            <button
              type="button"
              onClick={() => {
                onChange('Otro', true)
                setIsOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 text-primary hover:bg-primary/5 font-medium transition-colors"
            >
              <Plus size={14} /> Otro (Ingresar manual)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InvoiceForm({ products }: { products: Product[] }) {
  const [items, setItems] = useState<ItemInput[]>([])
  const [total, setTotal] = useState(0)

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      room_name: '', product_name: '', width: 0, height: 0, 
      fabric_name: '', base_price: 0, image_url: '', addons: [],
      isCustomProduct: false
    }])
  }

  const updateItem = (index: number, field: keyof ItemInput, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
    recalculateTotal(newItems)
  }

  const handleProductSelect = (index: number, productName: string, isCustom: boolean) => {
    const newItems = [...items]
    if (isCustom) {
      newItems[index].product_name = ''
      newItems[index].isCustomProduct = true
    } else {
      newItems[index].product_name = productName
      newItems[index].isCustomProduct = false
      const product = products.find(p => p.name === productName)
      if (product?.image_url) {
        newItems[index].image_url = product.image_url
      }
    }
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    recalculateTotal(newItems)
  }

  const addAddon = (itemIndex: number) => {
    const newItems = [...items]
    newItems[itemIndex].addons.push({ id: crypto.randomUUID(), addon_name: '', price: 0, is_selected: false, isCustom: false })
    setItems(newItems)
  }

  const updateAddon = (itemIndex: number, addonIndex: number, field: keyof AddonInput, value: any) => {
    const newItems = [...items]
    newItems[itemIndex].addons[addonIndex] = { ...newItems[itemIndex].addons[addonIndex], [field]: value }
    setItems(newItems)
  }

  const handleAddonSelect = (itemIndex: number, addonIndex: number, addonName: string, isCustom: boolean) => {
    const newItems = [...items]
    if (isCustom) {
      newItems[itemIndex].addons[addonIndex].addon_name = ''
      newItems[itemIndex].addons[addonIndex].isCustom = true
    } else {
      newItems[itemIndex].addons[addonIndex].addon_name = addonName
      newItems[itemIndex].addons[addonIndex].isCustom = false
    }
    setItems(newItems)
  }

  const removeAddon = (itemIndex: number, addonIndex: number) => {
    const newItems = [...items]
    newItems[itemIndex].addons = newItems[itemIndex].addons.filter((_, i) => i !== addonIndex)
    setItems(newItems)
  }

  const recalculateTotal = (currentItems: ItemInput[]) => {
    const t = currentItems.reduce((acc, obj) => acc + Number(obj.base_price || 0), 0)
    setTotal(t)
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">Crear Nueva Cotización</h1>
      </div>

      <form action={createInvoice} className="space-y-8">
        
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <input type="hidden" name="total_amount" value={total} />
        
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Datos del Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre el Cliente *</label>
              <input required name="client_name" type="text" className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Ej. Juan Pérez" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Código de Referencia *</label>
              <input required name="reference_code" type="text" defaultValue={`VLM-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Validez de la Cotización *</label>
              <input required name="valid_until" type="date" defaultValue={new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-lg font-semibold">Productos Solicitados</h2>
            <button type="button" onClick={addItem} className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/20 font-medium text-sm transition-colors">
              <Plus size={16} /> Añadir Producto
            </button>
          </div>

          {items.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500 mb-2">Comienza agregando el primer producto a la cotización.</p>
              <button type="button" onClick={addItem} className="text-primary font-medium hover:underline text-sm">Añadir Producto +</button>
            </div>
          )}

          <div className="space-y-6">
            {items.map((item, idx) => (
              <div key={item.id} className="p-5 border border-gray-200 bg-white rounded-xl shadow-sm relative group transition-all hover:border-gray-300">
                <button type="button" onClick={() => removeItem(idx)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                  <Trash2 size={18} />
                </button>
                
                <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b inline-block">Item {idx + 1}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ubicación</label>
                    <input type="text" required value={item.room_name} onChange={(e) => updateItem(idx, 'room_name', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="Ej. Sala Principal" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Producto Especializado</label>
                    <div className="flex flex-col gap-2">
                      <CustomDropdown 
                        options={products.map(p => p.name)} 
                        value={item.isCustomProduct ? 'Otro' : item.product_name} 
                        onChange={(val, isCustom) => handleProductSelect(idx, val, isCustom)} 
                        placeholder="Selecciona el producto..." 
                      />
                      {item.isCustomProduct && (
                        <input 
                          type="text" 
                          required 
                          autoFocus
                          value={item.product_name} 
                          onChange={(e) => updateItem(idx, 'product_name', e.target.value)} 
                          className="w-full border border-primary/40 rounded-lg p-2.5 text-sm bg-primary/5 focus:ring-2 focus:ring-primary outline-none animate-in fade-in" 
                          placeholder="Escribe el nombre del producto..." 
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ancho (m)</label>
                    <input type="number" step="0.01" value={item.width} onChange={(e) => updateItem(idx, 'width', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Alto (m)</label>
                    <input type="number" step="0.01" value={item.height} onChange={(e) => updateItem(idx, 'height', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tela / Color</label>
                    <input type="text" value={item.fabric_name} onChange={(e) => updateItem(idx, 'fabric_name', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="Opcional" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">Precio (Q.) <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" required value={item.base_price} onChange={(e) => updateItem(idx, 'base_price', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-semibold text-primary bg-primary/5 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">URL de Imagen (Opcional)</label>
                  <input type="url" value={item.image_url} onChange={(e) => updateItem(idx, 'image_url', e.target.value)} className="w-full border border-gray-100 rounded-lg p-2 text-xs text-gray-500 focus:ring-1 focus:ring-primary outline-none bg-gray-50" placeholder="https://..." />
                </div>

                {/* Addons Array */}
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-gray-700">Opciones Adicionales y Mejoras</h4>
                    <button type="button" onClick={() => addAddon(idx)} className="text-xs text-primary hover:bg-primary/10 border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5">
                      <Plus size={14}/> Añadir Mejora
                    </button>
                  </div>
                  
                  {item.addons.length === 0 && (
                    <p className="text-xs text-gray-400 mb-2">No hay mejoras adicionales para este producto.</p>
                  )}

                  <div className="space-y-3">
                    {item.addons.map((addon, aIdx) => (
                      <div key={addon.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3 rounded-lg border border-gray-200 animate-in fade-in">
                        <div className="w-full sm:w-64 flex-shrink-0 flex flex-col gap-2">
                          <CustomDropdown 
                            options={PREDEFINED_ADDONS} 
                            value={addon.isCustom ? 'Otro' : addon.addon_name} 
                            onChange={(val, isCustom) => handleAddonSelect(idx, aIdx, val, isCustom)} 
                            placeholder="Tipo de mejora..." 
                          />
                          {addon.isCustom && (
                            <input 
                              type="text" 
                              required
                              placeholder="Describe la mejora..." 
                              value={addon.addon_name} 
                              onChange={(e) => updateAddon(idx, aIdx, 'addon_name', e.target.value)} 
                              className="w-full border border-primary/40 rounded-lg p-2 text-sm bg-white" 
                            />
                          )}
                        </div>
                        
                        <div className="flex-1 w-full flex gap-3 items-center">
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">Q.</span>
                            <input 
                              type="number" 
                              required
                              min="0"
                              step="0.01"
                              placeholder="Precio" 
                              value={addon.price} 
                              onChange={(e) => updateAddon(idx, aIdx, 'price', e.target.value)} 
                              className="w-full border border-gray-200 rounded-lg pl-8 p-2 text-sm font-medium border-l-4 border-l-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none" 
                            />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors w-full sm:w-auto shrink-0 select-none">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${addon.is_selected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'}`}>
                              {addon.is_selected && <Check size={14} strokeWidth={3} />}
                            </div>
                            <input 
                              type="checkbox" 
                              checked={addon.is_selected} 
                              onChange={(e) => updateAddon(idx, aIdx, 'is_selected', e.target.checked)}
                              className="sr-only"
                            />
                            <span className="text-xs font-semibold text-gray-700">Pre-seleccionar</span>
                          </label>
                          <button type="button" onClick={() => removeAddon(idx, aIdx)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </section>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-between items-center z-50 md:pl-64 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div>
            <span className="text-gray-500 uppercase tracking-wider font-semibold text-[10px] block">Gran Total (Base)</span>
            <span className="font-black text-2xl text-primary">Q. {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <button type="submit" className="bg-primary text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black hover:shadow-xl transition-all hover:-translate-y-0.5">
            <Save size={20} /> Guardar Cotización
          </button>
        </div>

      </form>
    </div>
  )
}
