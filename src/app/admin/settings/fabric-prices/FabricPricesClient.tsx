'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Pencil, X, Loader2, Search, Scissors, DollarSign, ChevronDown, AlertCircle } from 'lucide-react'
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

  // Form state
  const [formProductId, setFormProductId] = useState('')
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')

  const nameInputRef = useRef<HTMLInputElement>(null)

  const fetchPrices = async () => {
    setLoading(true)
    const data = await apiFetch('GET', undefined, filterProduct ? `product_id=${filterProduct}` : undefined)
    if (data.success) setFabricPrices(data.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPrices() }, [filterProduct])

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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>

        {/* Product Filter */}
        <div className="relative">
          <select
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
            className="appearance-none w-full sm:w-52 bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary outline-none cursor-pointer transition-all"
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
          whileTap={{ scale: 0.98 }}
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors shrink-0"
        >
          <Plus size={16} /> Agregar
        </motion.button>
      </motion.div>

      {/* Results Count */}
      {!loading && (
        <p className="text-xs font-medium text-gray-400 mb-4">
          {filtered.length} tela{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Scissors size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No hay precios de tela</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">Agrega precios de tela para que aparezcan en la calculadora de cotizaciones.</p>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Agregar Precio de Tela
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((fp, idx) => (
              <motion.div
                key={fp.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03, type: 'spring', stiffness: 100, damping: 20 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-shadow group"
              >
                {/* Card Image */}
                <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100">
                  {fp.image_url ? (
                    <Image src={fp.image_url} alt={fp.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Scissors size={32} className="text-gray-200" />
                    </div>
                  )}
                  {/* Product Badge */}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    {fp.products?.name || getProductName(fp.product_id)}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{fp.name}</h3>
                      <p className="text-xl font-extrabold text-primary mt-1">
                        Q. {fp.fabric_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(fp)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      {deleteConfirm === fp.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(fp.id)}
                            disabled={deleting === fp.id}
                            className="p-2 text-red-600 bg-red-50 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                          >
                            {deleting === fp.id ? <Loader2 size={15} className="animate-spin" /> : 'Sí'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(fp.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
                <h3 className="text-lg font-extrabold text-gray-900">
                  {editingFabric ? 'Editar Precio de Tela' : 'Nuevo Precio de Tela'}
                </h3>
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
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={e => setFormImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  {formImageUrl && (
                    <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden relative border border-gray-200">
                      <Image src={formImageUrl} alt="preview" fill className="object-cover" sizes="64px" />
                    </div>
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
                <button
                  onClick={handleSave}
                  disabled={saving || !formProductId || !formName.trim() || !formPrice}
                  className="flex-[2] py-3 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                  ) : (
                    editingFabric ? 'Guardar Cambios' : 'Agregar Tela'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
