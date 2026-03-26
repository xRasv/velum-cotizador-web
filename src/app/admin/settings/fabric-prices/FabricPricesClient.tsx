'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Pencil, X, Loader2, Search, Scissors, DollarSign, ChevronDown, Check, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import SettingsTabNav from '../SettingsTabNav'

const API_URL = 'https://velumcotizadorapi.vercel.app/api/fabric-prices'
const API_KEY = 'rhVNcGmG656LsotEcjyDTvAZD3UiKJ9hptrnW9Is5UM='

type Product = {
  id: string
  name: string
  visible_name: string | null
  image_url: string | null
}

type FabricPrice = {
  id: string
  name: string
  fabric_price: number
  image_url: string | null
  product_id: string
  created_at: string
  products: { name: string; image_url: string | null }
}

const headers = { 'Content-Type': 'application/json', 'x-api-key': API_KEY }

async function apiFetch(method: string, body?: object, query?: string) {
  const url = query ? `${API_URL}?${query}` : API_URL
  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return res.json()
}

// Inline editable cell component
function InlineEdit({
  value,
  onSave,
  type = 'text',
  prefix,
  className = '',
}: {
  value: string
  onSave: (val: string) => void
  type?: 'text' | 'number'
  prefix?: string
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commit = () => {
    if (draft.trim() && draft !== value) onSave(draft.trim())
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={`group/inline text-left w-full flex items-center gap-1.5 rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-blue-50/80 transition-colors ${className}`}
      >
        {prefix && <span className="text-gray-400 text-xs font-medium">{prefix}</span>}
        <span className="truncate">{value}</span>
        <Pencil size={12} className="text-gray-300 opacity-0 group-hover/inline:opacity-100 transition-opacity shrink-0" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 -mx-2 -my-1">
      {prefix && <span className="text-gray-400 text-xs font-medium pl-2">{prefix}</span>}
      <input
        ref={inputRef}
        type={type}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? '0' : undefined}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        className={`bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-400/50 w-full transition-all ${className}`}
      />
      <button onClick={commit} className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition-colors shrink-0">
        <Check size={14} />
      </button>
    </div>
  )
}

export default function FabricPricesClient({ products }: { products: Product[] }) {
  const [fabricPrices, setFabricPrices] = useState<FabricPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProduct, setFilterProduct] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFabric, setEditingFabric] = useState<FabricPrice | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [inlineSaving, setInlineSaving] = useState<string | null>(null)

  // Form state
  const [formProductId, setFormProductId] = useState('')
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')

  // Mobile expanded card
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const nameInputRef = useRef<HTMLInputElement>(null)

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    const data = await apiFetch('GET', undefined, filterProduct ? `product_id=${filterProduct}` : undefined)
    if (data.success) setFabricPrices(data.data || [])
    setLoading(false)
  }, [filterProduct])

  useEffect(() => { fetchPrices() }, [fetchPrices])

  const openAddModal = () => {
    setEditingFabric(null)
    setFormProductId(filterProduct || (products[0]?.id ?? ''))
    setFormName('')
    setFormPrice('')
    setFormImageUrl('')
    setIsModalOpen(true)
    setTimeout(() => nameInputRef.current?.focus(), 150)
  }

  const openEditModal = (fp: FabricPrice) => {
    setEditingFabric(fp)
    setFormProductId(fp.product_id)
    setFormName(fp.name)
    setFormPrice(String(fp.fabric_price))
    setFormImageUrl(fp.image_url || '')
    setIsModalOpen(true)
    setTimeout(() => nameInputRef.current?.focus(), 150)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingFabric(null)
  }

  const handleSave = async () => {
    if (!formProductId || !formName.trim() || !formPrice) return
    setSaving(true)
    try {
      if (editingFabric) {
        await apiFetch('PUT', {
          id: editingFabric.id,
          product_id: formProductId,
          name: formName.trim(),
          fabric_price: parseFloat(formPrice),
          image_url: formImageUrl.trim() || null,
        })
      } else {
        await apiFetch('POST', {
          product_id: formProductId,
          name: formName.trim(),
          fabric_price: parseFloat(formPrice),
          image_url: formImageUrl.trim() || null,
        })
      }
      closeModal()
      fetchPrices()
    } catch {
      alert('Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const handleInlineSave = async (fp: FabricPrice, field: 'name' | 'fabric_price' | 'image_url', value: string) => {
    setInlineSaving(fp.id)
    try {
      await apiFetch('PUT', {
        id: fp.id,
        product_id: fp.product_id,
        name: field === 'name' ? value : fp.name,
        fabric_price: field === 'fabric_price' ? parseFloat(value) : fp.fabric_price,
        image_url: field === 'image_url' ? (value || null) : fp.image_url,
      })
      setFabricPrices(prev => prev.map(f =>
        f.id === fp.id
          ? { ...f, [field]: field === 'fabric_price' ? parseFloat(value) : value }
          : f
      ))
    } catch {
      alert('Error al guardar.')
    } finally {
      setInlineSaving(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await apiFetch('DELETE', { id })
      setFabricPrices(prev => prev.filter(fp => fp.id !== id))
    } catch {
      alert('Error al eliminar.')
    } finally {
      setDeleting(null)
      setDeleteConfirm(null)
    }
  }

  const filtered = fabricPrices.filter(fp =>
    searchTerm ? fp.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
  )

  const getProductName = (productId: string) =>
    products.find(p => p.id === productId)?.name || 'Desconocido'

  // Group by product for the table view
  const groupedByProduct = filtered.reduce<Record<string, FabricPrice[]>>((acc, fp) => {
    const key = fp.product_id
    if (!acc[key]) acc[key] = []
    acc[key].push(fp)
    return acc
  }, {})

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-3">Configuración</h2>
        <p className="text-gray-500 font-medium max-w-2xl">Administra los precios de tela para cada producto. Estos precios se utilizan en la calculadora de cotizaciones.</p>
      </motion.div>

      <SettingsTabNav />

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de tela..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 outline-none transition-all"
          />
        </div>

        {/* Product Filter */}
        <div className="relative">
          <select
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
            className="appearance-none w-full sm:w-52 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 outline-none cursor-pointer transition-all"
          >
            <option value="">Todos los productos</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Add Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all shrink-0"
        >
          <Plus size={16} /> Agregar
        </motion.button>
      </motion.div>

      {/* Results Count */}
      {!loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-medium text-gray-400 mb-4"
        >
          {filtered.length} tela{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          {inlineSaving && (
            <span className="inline-flex items-center gap-1 ml-3 text-blue-500">
              <Loader2 size={10} className="animate-spin" /> Guardando...
            </span>
          )}
        </motion.p>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-[3px] border-gray-200" />
              <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Cargando precios...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Scissors size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No hay precios de tela</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">Agrega precios de tela para que aparezcan en la calculadora de cotizaciones.</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all"
          >
            <Plus size={16} /> Agregar Precio de Tela
          </motion.button>
        </motion.div>
      ) : (
        <>
          {/* ==================== DESKTOP TABLE VIEW ==================== */}
          <div className="hidden md:block">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_4px_32px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              {/* Table Header */}
              <div className="grid grid-cols-[2.5fr_2fr_1.2fr_auto] gap-4 px-6 py-3.5 bg-gradient-to-r from-gray-50/80 to-gray-50/40 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">
                <span>Tela</span>
                <span>Producto</span>
                <span>Precio</span>
                <span className="w-20 text-right">Acciones</span>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-50">
                <AnimatePresence mode="popLayout">
                  {Object.entries(groupedByProduct).map(([productId, items]) => (
                    <div key={productId}>
                      {items.map((fp, idx) => (
                        <motion.div
                          key={fp.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10, height: 0 }}
                          transition={{ delay: idx * 0.02, type: 'spring', stiffness: 200, damping: 25 }}
                          className="grid grid-cols-[2.5fr_2fr_1.2fr_auto] gap-4 px-6 py-3 items-center group hover:bg-blue-50/30 transition-colors"
                        >
                          {/* Fabric Name + Image */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-100 overflow-hidden shrink-0 relative">
                              {fp.image_url ? (
                                <Image src={fp.image_url} alt={fp.name} fill className="object-cover" sizes="36px" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Scissors size={14} className="text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <InlineEdit
                                value={fp.name}
                                onSave={val => handleInlineSave(fp, 'name', val)}
                                className="text-sm font-semibold text-gray-900"
                              />
                            </div>
                          </div>

                          {/* Product */}
                          <div className="min-w-0">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100/80 px-2.5 py-1 rounded-lg truncate">
                              {fp.products?.name || getProductName(fp.product_id)}
                            </span>
                          </div>

                          {/* Price */}
                          <div className="min-w-0">
                            <InlineEdit
                              value={fp.fabric_price.toFixed(2)}
                              onSave={val => handleInlineSave(fp, 'fabric_price', val)}
                              type="number"
                              prefix="Q."
                              className="text-sm font-bold text-gray-900"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 justify-end w-20">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openEditModal(fp)}
                              className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Editar todo"
                            >
                              <Pencil size={14} />
                            </motion.button>
                            {deleteConfirm === fp.id ? (
                              <div className="flex items-center gap-0.5">
                                <motion.button
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  onClick={() => handleDelete(fp.id)}
                                  disabled={deleting === fp.id}
                                  className="px-2 py-1 text-[11px] font-bold text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                                >
                                  {deleting === fp.id ? <Loader2 size={12} className="animate-spin" /> : 'Sí'}
                                </motion.button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="p-1 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setDeleteConfirm(fp.id)}
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Table Footer */}
              <div className="px-6 py-3 bg-gradient-to-r from-gray-50/50 to-transparent border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">
                  Haz clic en un nombre o precio para editar directamente
                </span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={openAddModal}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} /> Agregar tela
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* ==================== MOBILE CARD VIEW ==================== */}
          <div className="md:hidden space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((fp, idx) => {
                const isExpanded = expandedCard === fp.id
                return (
                  <motion.div
                    key={fp.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03, type: 'spring', stiffness: 150, damping: 22 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden"
                  >
                    {/* Card Main - Tappable */}
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : fp.id)}
                      className="w-full flex items-center gap-3 p-4 text-left active:bg-gray-50/80 transition-colors"
                    >
                      {/* Image */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-100 overflow-hidden shrink-0 relative">
                        {fp.image_url ? (
                          <Image src={fp.image_url} alt={fp.name} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Scissors size={18} className="text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{fp.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md truncate">
                            {fp.products?.name || getProductName(fp.product_id)}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <p className="text-lg font-extrabold text-gray-900">
                          Q.{fp.fabric_price.toFixed(2)}
                        </p>
                      </div>

                      {/* Chevron */}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="shrink-0 ml-1"
                      >
                        <ChevronDown size={16} className="text-gray-300" />
                      </motion.div>
                    </button>

                    {/* Expanded Actions */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                            <div className="flex gap-2">
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { openEditModal(fp); setExpandedCard(null) }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm active:bg-blue-100 transition-colors"
                              >
                                <Pencil size={14} /> Editar
                              </motion.button>
                              {deleteConfirm === fp.id ? (
                                <div className="flex gap-1.5">
                                  <motion.button
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDelete(fp.id)}
                                    disabled={deleting === fp.id}
                                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm"
                                  >
                                    {deleting === fp.id ? <Loader2 size={14} className="animate-spin" /> : 'Eliminar'}
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-semibold text-sm"
                                  >
                                    No
                                  </motion.button>
                                </div>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setDeleteConfirm(fp.id)}
                                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-500 font-semibold text-sm active:bg-red-100 transition-colors"
                                >
                                  <Trash2 size={14} /> Eliminar
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 pb-0">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    {editingFabric ? 'Editar Precio de Tela' : 'Nuevo Precio de Tela'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {editingFabric ? 'Modifica los datos de esta tela' : 'Agrega una nueva tela al catálogo'}
                  </p>
                </div>
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 overflow-y-auto">
                {/* Product */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Producto</label>
                  <div className="relative">
                    <select
                      value={formProductId}
                      onChange={e => setFormProductId(e.target.value)}
                      className="appearance-none w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Seleccionar producto...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre de Tela</label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ej. Translúcido Blanco"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Precio (Q.)</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formPrice}
                      onChange={e => setFormPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    URL de Imagen <span className="text-gray-300 font-normal normal-case">(opcional)</span>
                  </label>
                  <div className="relative">
                    <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={e => setFormImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  {formImageUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2 w-16 h-16 rounded-xl overflow-hidden relative border border-gray-200 shadow-sm"
                    >
                      <Image src={formImageUrl} alt="preview" fill className="object-cover" sizes="64px" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 pt-2 flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving || !formProductId || !formName.trim() || !formPrice}
                  className="flex-[2] py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                  ) : (
                    editingFabric ? 'Guardar Cambios' : 'Agregar Tela'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
