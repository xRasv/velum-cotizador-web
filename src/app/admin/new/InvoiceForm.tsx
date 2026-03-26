'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Save, ArrowLeft, ChevronDown, Check, Palette, Calculator, Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { createInvoice, updateInvoice } from '@/app/actions'

const CALC_API_URL = 'https://velumcotizadorapi.vercel.app/api/calculate'
const CALC_API_KEY = 'rhVNcGmG656LsotEcjyDTvAZD3UiKJ9hptrnW9Is5UM='
const FABRIC_PRICES_API_URL = 'https://velumcotizadorapi.vercel.app/api/fabric-prices'
const PRODUCT_TYPE_OPTIONS = [
  { value: 'enrollable', label: 'Enrollable' },
  { value: 'dia_y_noche', label: 'Día y Noche' },
  { value: 'tradicional', label: 'Tradicional' },
  { value: 'vertical', label: 'Vertical' },
]
const GALERIA_OPTIONS = ['RippleFold', 'Francesa', 'Ojetes']
const VERTICAL_TYPES = ['PVC', 'Tela']

type Fabric = {
  id: string
  name: string
  image_url: string | null
}

type Product = {
  id: string
  name: string
  visible_name: string | null
  image_url: string | null
  fabrics: Fabric[]
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
  isCalcMode: boolean
  calcProductType: string
  calcFabricPrice: number
  calcProfit: number
  calcIva: number
  calcExtras: number
  calcGaleria: string
  calcVerticalType: string
  calcLoading: boolean
}

type FabricPriceOption = {
  id: string
  name: string
  fabric_price: number
  image_url: string | null
  product_id: string
}

function getProductIdForCalcType(calcProductType: string, products: Product[]): string | null {
  const mappings: Record<string, string[]> = {
    'enrollable': ['enrollable'],
    'dia_y_noche': ['dia', 'noche'],
    'tradicional': ['tradicional'],
    'vertical': ['vertical'],
  }
  const keywords = mappings[calcProductType]
  if (!keywords) return null
  const match = products.find(p =>
    keywords.some(kw => p.name.toLowerCase().includes(kw))
  )
  return match?.id || null
}

function FabricPriceDropdown({
  productId,
  value,
  onChange,
}: {
  productId: string | null
  value: number
  onChange: (price: number) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [fabricPrices, setFabricPrices] = useState<FabricPriceOption[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isManual, setIsManual] = useState(false)
  const [selectedName, setSelectedName] = useState('')
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

  useEffect(() => {
    if (!productId) { setFabricPrices([]); return }
    setLoading(true)
    setSelectedName('')
    setIsManual(false)
    fetch(`${FABRIC_PRICES_API_URL}?product_id=${productId}`, {
      headers: { 'x-api-key': CALC_API_KEY },
    })
      .then(r => r.json())
      .then(data => { if (data.success) setFabricPrices(data.data || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [productId])

  const filtered = fabricPrices.filter(fp =>
    searchTerm ? fp.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
  )

  if (isManual) {
    return (
      <div className="flex gap-1.5">
        <input
          type="number" step="0.01" min="0" placeholder="0.00"
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none"
        />
        <button type="button" onClick={() => setIsManual(false)}
          className="px-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors shrink-0">
          Lista
        </button>
      </div>
    )
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center border border-gray-200 rounded-lg p-2.5 text-sm bg-white hover:border-primary transition-colors focus:ring-2 focus:ring-primary outline-none"
      >
        <span className={selectedName ? 'text-gray-900 truncate' : 'text-gray-400'}>
          {selectedName ? `${selectedName} — Q.${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Seleccionar tela...'}
        </span>
        {loading ? (
          <Loader2 size={14} className="animate-spin text-gray-400 shrink-0 ml-1" />
        ) : (
          <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ml-1 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Search */}
          {fabricPrices.length > 3 && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar tela..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-100 focus:ring-1 focus:ring-primary outline-none"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-gray-400" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No hay telas disponibles.</p>
            ) : (
              filtered.map(fp => (
                <button
                  key={fp.id}
                  type="button"
                  onClick={() => {
                    onChange(fp.fabric_price)
                    setSelectedName(fp.name)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between gap-2 transition-colors
                    ${value === fp.fabric_price && selectedName === fp.name ? 'bg-primary/5 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="truncate">{fp.name}</span>
                  <span className="text-xs font-mono font-semibold text-gray-500 shrink-0">Q.{fp.fabric_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </button>
              ))
            )}
            <div className="h-px bg-gray-100 my-1 mx-2" />
            <button
              type="button"
              onClick={() => {
                setIsManual(true)
                setSelectedName('')
                setIsOpen(false)
                setSearchTerm('')
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 text-primary hover:bg-primary/5 font-medium transition-colors"
            >
              <Plus size={14} /> Ingresar manual
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const PREDEFINED_ADDONS = [
  "Motor Automático (Control Remoto)",
  "Cenefa Decorativa Premium"
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

export default function InvoiceForm({ products, initialData, invoiceId }: { products: Product[], initialData?: any, invoiceId?: string }) {
  const [items, setItems] = useState<ItemInput[]>(() => {
    if (initialData && initialData.items) {
      return initialData.items.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        room_name: item.room_name || '',
        product_name: item.product_name || '',
        isCustomProduct: !products.some(p => p.name === item.product_name),
        width: item.width || 0,
        height: item.height || 0,
        fabric_name: item.fabric_name || '',
        base_price: item.base_price || 0,
        image_url: item.image_url || '',
        addons: item.addons?.map((addon: any) => ({
          id: addon.id || crypto.randomUUID(),
          addon_name: addon.addon_name || '',
          price: addon.price || 0,
          is_selected: addon.is_selected || false,
          isCustom: !PREDEFINED_ADDONS.includes(addon.addon_name)
        })) || [],
        isCalcMode: false, calcProductType: '', calcFabricPrice: 0,
        calcProfit: 100, calcIva: 12, calcExtras: 0,
        calcGaleria: '', calcVerticalType: 'PVC', calcLoading: false
      }))
    }
    return []
  })
  const [total, setTotal] = useState(initialData?.total_amount || 0)
  const calcTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const calculatePrice = async (index: number, item: ItemInput) => {
    if (!item.calcProductType || !item.width || !item.height) return
    if (item.calcProductType !== 'vertical' && !item.calcFabricPrice) return

    setItems(prev => prev.map((it, i) => i === index ? { ...it, calcLoading: true } : it))

    try {
      const body: Record<string, unknown> = {
        product_type: item.calcProductType,
        width: Number(item.width),
        height: Number(item.height),
        profit: Number(item.calcProfit) || 100,
        iva: Number(item.calcIva) || 12,
        extras: Number(item.calcExtras) || 0,
      }
      if (item.calcProductType !== 'vertical') body.fabric_price = Number(item.calcFabricPrice)
      if (item.calcProductType === 'tradicional' && item.calcGaleria) body.galeria = item.calcGaleria
      if (item.calcProductType === 'vertical') body.vertical_type = item.calcVerticalType || 'PVC'

      const res = await fetch(CALC_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CALC_API_KEY },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (data.success && data.pricing) {
        const newPrice = Math.round(data.pricing.totalConIva)
        setItems(prev => {
          const updated = prev.map((it, i) => i === index ? { ...it, base_price: newPrice, calcLoading: false } : it)
          setTotal(updated.reduce((acc, obj) => acc + Number(obj.base_price || 0), 0))
          return updated
        })
      } else {
        setItems(prev => prev.map((it, i) => i === index ? { ...it, calcLoading: false } : it))
      }
    } catch {
      setItems(prev => prev.map((it, i) => i === index ? { ...it, calcLoading: false } : it))
    }
  }

  const triggerCalcDebounce = (index: number, item: ItemInput) => {
    if (calcTimers.current[item.id]) clearTimeout(calcTimers.current[item.id])
    calcTimers.current[item.id] = setTimeout(() => calculatePrice(index, item), 500)
  }

  const updateCalcField = (index: number, field: string, value: unknown) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
    triggerCalcDebounce(index, newItems[index])
  }

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      room_name: '', product_name: '', width: 0, height: 0,
      fabric_name: '', base_price: 0, image_url: '', addons: [],
      isCustomProduct: false,
      isCalcMode: false, calcProductType: '', calcFabricPrice: 0,
      calcProfit: 100, calcIva: 12, calcExtras: 0,
      calcGaleria: '', calcVerticalType: 'PVC', calcLoading: false
    }])
  }

  const updateItem = (index: number, field: keyof ItemInput, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
    recalculateTotal(newItems)
    if (newItems[index].isCalcMode && (field === 'width' || field === 'height')) {
      triggerCalcDebounce(index, newItems[index])
    }
    if (field === 'isCalcMode' && value === true) {
      triggerCalcDebounce(index, newItems[index])
    }
  }

  const handleProductSelect = (index: number, productName: string, isCustom: boolean) => {
    const newItems = [...items]
    if (isCustom) {
      newItems[index].product_name = ''
      newItems[index].isCustomProduct = true
      newItems[index].fabric_name = '' // reset fabric on product change
    } else {
      const product = products.find(p => p.name === productName)
      // Use visible_name for the customer-facing product_name, fallback to internal name
      newItems[index].product_name = product?.visible_name || productName
      newItems[index].isCustomProduct = false
      newItems[index].fabric_name = '' // reset fabric on product change
      if (product?.image_url) {
        newItems[index].image_url = product.image_url
      }
    }
    setItems(newItems)
  }

  // Helper to get the internal product for a given item
  const getProductForItem = (item: ItemInput) => {
    if (item.isCustomProduct) return null
    // Match by visible_name first, then by internal name
    return products.find(p => (p.visible_name || p.name) === item.product_name) || products.find(p => p.name === item.product_name) || null
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
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{invoiceId ? 'Editar Cotización' : 'Nueva Cotización'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{invoiceId ? 'Modifica los datos existentes de la cotización' : 'Completa los datos del cliente y los productos'}</p>
        </div>
      </motion.div>

      <form action={invoiceId ? updateInvoice : createInvoice} className="space-y-8">
        
        {invoiceId && <input type="hidden" name="invoice_id" value={invoiceId} />}
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <input type="hidden" name="total_amount" value={total} />
        
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-bold border-b border-gray-100 pb-3 mb-5">Datos del Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre el Cliente *</label>
              <input required name="client_name" type="text" defaultValue={initialData?.client_name || ''} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Ej. Juan Pérez" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Código de Referencia *</label>
              <input required name="reference_code" type="text" defaultValue={initialData?.reference_code || `VLM-${new Date().getFullYear()}-${Math.floor(Math.random()*10000)}`} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Válido hasta</label>
              <input required name="valid_until" type="date" defaultValue={initialData?.valid_until?.split('T')[0] || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Notas / Observaciones</label>
              <textarea name="notes" rows={2} defaultValue={initialData?.notes || ''} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Ej. Precio incluye instalación, sujeto a visita técnica..." />
            </div>
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
            <h2 className="text-lg font-bold">Productos Solicitados</h2>
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button" onClick={addItem} className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl text-primary hover:bg-primary/20 font-semibold text-sm transition-colors"
            >
              <Plus size={16} /> Añadir Producto
            </motion.button>
          </div>

          {items.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500 mb-2">Comienza agregando el primer producto a la cotización.</p>
              <button type="button" onClick={addItem} className="text-primary font-medium hover:underline text-sm">Añadir Producto +</button>
            </div>
          )}

          <AnimatePresence mode="popLayout">
          <div className="space-y-6">
            {items.map((item, idx) => (
              <motion.div 
                layout
                key={item.id} 
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 100, damping: 18 }}
                className="p-5 border border-gray-100 bg-white rounded-2xl shadow-sm relative group transition-all hover:border-gray-200 hover:shadow-md"
              >
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

                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ancho (m)</label>
                    <input type="number" step="0.01" value={item.width} onChange={(e) => updateItem(idx, 'width', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Alto (m)</label>
                    <input type="number" step="0.01" value={item.height} onChange={(e) => updateItem(idx, 'height', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 shrink-0">Precio (Q.) <span className="text-red-500">*</span></label>
                      <div className="flex rounded-md border border-gray-200 divide-x divide-gray-200 overflow-hidden text-[11px] font-bold shrink-0">
                        <button type="button" onClick={() => updateItem(idx, 'isCalcMode', false)}
                          className={`px-3 py-1.5 transition-colors ${!item.isCalcMode ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                          Manual
                        </button>
                        <button type="button" onClick={() => updateItem(idx, 'isCalcMode', true)}
                          className={`px-3 py-1.5 transition-colors flex items-center gap-1 ${item.isCalcMode ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                          <Calculator size={11} /> Calc
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input type="number" step="1" required value={item.base_price}
                        readOnly={item.isCalcMode}
                        onChange={(e) => !item.isCalcMode && updateItem(idx, 'base_price', e.target.value)}
                        className={`w-full border rounded-lg p-2.5 pr-8 text-sm font-semibold text-primary focus:ring-2 focus:ring-primary outline-none transition-all
                          ${item.isCalcMode ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-75' : 'bg-primary/5 border-gray-200'}`} />
                      {item.calcLoading && (
                        <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Calculator Panel */}
                <AnimatePresence>
                  {item.isCalcMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mb-5 bg-primary/5 border border-primary/20 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Calculator size={13} /> Calculadora de Precio
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {/* Tipo de Producto — styled select */}
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de Producto</label>
                            <div className="relative">
                              <select value={item.calcProductType}
                                onChange={(e) => updateCalcField(idx, 'calcProductType', e.target.value)}
                                className="appearance-none w-full border border-gray-200 rounded-lg p-2.5 pr-9 text-sm bg-white hover:border-primary focus:ring-2 focus:ring-primary outline-none transition-colors cursor-pointer">
                                <option value="">Seleccionar...</option>
                                {PRODUCT_TYPE_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          </div>

                          {/* Precio Tela — dropdown from API */}
                          {item.calcProductType !== 'vertical' && item.calcProductType && (
                            <div className="col-span-2 md:col-span-2">
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Precio Tela</label>
                              <FabricPriceDropdown
                                productId={getProductIdForCalcType(item.calcProductType, products)}
                                value={item.calcFabricPrice}
                                onChange={(price) => updateCalcField(idx, 'calcFabricPrice', price)}
                              />
                            </div>
                          )}

                          {/* Galería — styled select */}
                          {item.calcProductType === 'tradicional' && (
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Galería</label>
                              <div className="relative">
                                <select value={item.calcGaleria}
                                  onChange={(e) => updateCalcField(idx, 'calcGaleria', e.target.value)}
                                  className="appearance-none w-full border border-gray-200 rounded-lg p-2.5 pr-9 text-sm bg-white hover:border-primary focus:ring-2 focus:ring-primary outline-none transition-colors cursor-pointer">
                                  <option value="">Seleccionar...</option>
                                  {GALERIA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          )}

                          {/* Tipo Vertical — styled select */}
                          {item.calcProductType === 'vertical' && (
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipo Vertical</label>
                              <div className="relative">
                                <select value={item.calcVerticalType}
                                  onChange={(e) => updateCalcField(idx, 'calcVerticalType', e.target.value)}
                                  className="appearance-none w-full border border-gray-200 rounded-lg p-2.5 pr-9 text-sm bg-white hover:border-primary focus:ring-2 focus:ring-primary outline-none transition-colors cursor-pointer">
                                  {VERTICAL_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ganancia (%)</label>
                            <input type="number" step="1" min="0"
                              value={item.calcProfit}
                              onChange={(e) => updateCalcField(idx, 'calcProfit', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none" />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">IVA (%)</label>
                            <input type="number" step="1" min="0"
                              value={item.calcIva}
                              onChange={(e) => updateCalcField(idx, 'calcIva', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none" />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Extras (Q.)</label>
                            <input type="number" step="1" min="0"
                              value={item.calcExtras}
                              onChange={(e) => updateCalcField(idx, 'calcExtras', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-primary outline-none" />
                          </div>
                        </div>

                        <div className="mt-3">
                          {item.calcLoading ? (
                            <span className="text-xs text-primary flex items-center gap-1.5">
                              <Loader2 size={12} className="animate-spin" /> Calculando...
                            </span>
                          ) : item.base_price > 0 ? (
                            <span className="text-xs text-emerald-600 flex items-center gap-1.5 font-semibold">
                              <Check size={12} /> Precio calculado: Q. {item.base_price.toLocaleString('en-US')}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Completa los campos para calcular automáticamente.</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fabric / Color Visual Swatch Selector */}
                {(() => {
                  const matchedProduct = getProductForItem(item)
                  const fabrics = matchedProduct?.fabrics || []
                  if (fabrics.length > 0) {
                    return (
                      <div className="mb-5">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Palette size={14} className="text-primary" /> Tela / Color
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {fabrics.map(f => {
                            const isActive = item.fabric_name === f.name
                            return (
                              <motion.button
                                key={f.id}
                                type="button"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => updateItem(idx, 'fabric_name', isActive ? '' : f.name)}
                                className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-300 cursor-pointer min-w-[80px]
                                  ${isActive
                                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/15 ring-2 ring-primary/20'
                                    : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md'
                                  }
                                `}
                              >
                                {f.image_url ? (
                                  <div className={`w-14 h-14 rounded-lg overflow-hidden ring-2 transition-all ${isActive ? 'ring-primary' : 'ring-transparent'}`}>
                                    <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                    <Palette size={20} className={isActive ? 'text-primary' : 'text-gray-300'} />
                                  </div>
                                )}
                                <span className={`text-[11px] font-semibold leading-tight text-center max-w-[80px] truncate ${isActive ? 'text-primary' : 'text-gray-600'}`}>
                                  {f.name}
                                </span>
                                {isActive && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md"
                                  >
                                    <Check size={12} strokeWidth={3} className="text-white" />
                                  </motion.div>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div className="mb-5">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tela / Color</label>
                      <input type="text" value={item.fabric_name} onChange={(e) => updateItem(idx, 'fabric_name', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="Opcional" />
                    </div>
                  )
                })()}



                {/* Addons Array */}
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-gray-700">Opciones Adicionales y Extras</h4>
                    <button type="button" onClick={() => addAddon(idx)} className="text-xs text-primary hover:bg-primary/10 border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5">
                      <Plus size={14}/> Añadir Extra
                    </button>
                  </div>
                  
                  {item.addons.length === 0 && (
                    <p className="text-xs text-gray-400 mb-2">No hay extras adicionales para este producto.</p>
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
                              placeholder="Describe el extra..." 
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
                              step="1"
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

              </motion.div>
            ))}
          </div>
          </AnimatePresence>
        </motion.section>

        <motion.div 
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.4 }}
          className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 flex justify-between items-center z-50 md:pl-64 shadow-[0_-4px_30px_rgba(0,0,0,0.06)]"
        >
          <div>
            <span className="text-gray-400 uppercase tracking-widest font-bold text-[10px] block">Gran Total (Base)</span>
            <span className="font-black text-2xl md:text-3xl text-primary">Q. {total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            type="submit" className="bg-primary text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black hover:shadow-xl transition-all shadow-lg shadow-primary/15"
          >
            <Save size={20} /> {invoiceId ? 'Actualizar Cotización' : 'Guardar Cotización'}
          </motion.button>
        </motion.div>

      </form>
    </div>
  )
}
