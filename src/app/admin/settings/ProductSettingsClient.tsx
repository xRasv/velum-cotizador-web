'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Save, X, Image as ImageIcon, Upload, Loader2, CheckCircle2, Plus, Trash2, Palette } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { updateProduct, addProductFabric, deleteProductFabric } from '@/app/actions'

type Fabric = {
  id: string
  product_id: string
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

export default function ProductSettingsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Edit State
  const [editName, setEditName] = useState('')
  const [editVisibleName, setEditVisibleName] = useState('')
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Fabric state
  const [newFabricName, setNewFabricName] = useState('')
  const [newFabricFile, setNewFabricFile] = useState<File | null>(null)
  const [newFabricPreview, setNewFabricPreview] = useState<string | null>(null)
  const [isAddingFabric, setIsAddingFabric] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fabricFileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setEditName(product.name)
    setEditVisibleName(product.visible_name || '')
    setEditFile(null)
    setEditPreviewUrl(product.image_url)
    setNewFabricName('')
    setNewFabricFile(null)
    setNewFabricPreview(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditVisibleName('')
    setEditFile(null)
    setEditPreviewUrl(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setEditFile(file)
      const objectUrl = URL.createObjectURL(file)
      setEditPreviewUrl(objectUrl)
    }
  }

  const handleFabricFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewFabricFile(e.target.files[0])
      setNewFabricPreview(URL.createObjectURL(e.target.files[0]))
    }
  }

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `images/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSave = async (id: string) => {
    if (!editName.trim()) return
    setIsSaving(true)

    try {
      let finalImageUrl = editPreviewUrl

      if (editFile) {
        finalImageUrl = await uploadFile(editFile)
      }

      const result = await updateProduct(id, editName, finalImageUrl, editVisibleName)
      
      if (result.error) {
        alert(result.error)
      } else {
        setProducts(products.map(p => p.id === id ? { ...p, name: editName, visible_name: editVisibleName || null, image_url: finalImageUrl } : p))
        setEditingId(null)
      }
    } catch (err) {
      console.error(err)
      alert("Error inesperado al guardar.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddFabric = async (productId: string) => {
    if (!newFabricName.trim()) return
    setIsAddingFabric(true)

    try {
      let fabricImageUrl: string | null = null
      if (newFabricFile) {
        fabricImageUrl = await uploadFile(newFabricFile)
      }

      const result = await addProductFabric(productId, newFabricName, fabricImageUrl)

      if (result.error) {
        alert(result.error)
      } else if (result.fabric) {
        setProducts(products.map(p => {
          if (p.id === productId) {
            return { ...p, fabrics: [...p.fabrics, result.fabric as Fabric] }
          }
          return p
        }))
        setNewFabricName('')
        setNewFabricFile(null)
        setNewFabricPreview(null)
      }
    } catch (err) {
      console.error(err)
      alert("Error al agregar tela.")
    } finally {
      setIsAddingFabric(false)
    }
  }

  const handleDeleteFabric = async (productId: string, fabricId: string) => {
    if (!confirm('¿Eliminar esta tela/color?')) return

    const result = await deleteProductFabric(fabricId)
    if (result.error) {
      alert(result.error)
    } else {
      setProducts(products.map(p => {
        if (p.id === productId) {
          return { ...p, fabrics: p.fabrics.filter(f => f.id !== fabricId) }
        }
        return p
      }))
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-3">Configuración de Productos</h2>
        <p className="text-gray-500 font-medium max-w-2xl">Administra el catálogo de productos. Aquí puedes modificar los nombres, imágenes y las telas/colores disponibles.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product, idx) => {
          const isEditing = editingId === product.id

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 + 0.1, type: "spring", stiffness: 100, damping: 20 }}
              className={`bg-white rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(25,28,30,0.06)] border border-gray-100/50 flex flex-col transition-all duration-300 ${isEditing ? 'ring-4 ring-blue-500/20 col-span-1 md:col-span-2 lg:col-span-3' : 'hover:shadow-[0_20px_60px_rgba(25,28,30,0.08)] hover:-translate-y-1'}`}
            >
              <AnimatePresence mode="wait">
                {isEditing ? (
                  // EDIT MODE
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col h-full bg-blue-50/30 p-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Column: Product Info */}
                      <div>
                        {/* Image Upload Area */}
                        <div 
                          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer group border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all mb-6"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {editPreviewUrl ? (
                            <>
                              <Image src={editPreviewUrl} alt="Preview" fill className="object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-800 drop-shadow-md backdrop-blur-[2px]">
                                <Upload size={32} className="mb-2 text-blue-600" />
                                <span className="font-semibold text-sm">Cambiar Imagen</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-500">
                              <ImageIcon size={40} className="mb-3 opacity-50" />
                              <span className="font-medium text-sm">Subir Nueva Imagen</span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/png, image/jpeg, image/webp" 
                          />
                        </div>

                        {/* Name Input */}
                        <div className="mb-4">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Nombre Interno (Empleados)</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full bg-white border-2 border-transparent focus:border-blue-500/50 rounded-xl px-4 py-3 text-gray-900 font-bold focus:ring-0 outline-none shadow-sm transition-all"
                            placeholder="Ej. Enrollable Blackout..."
                          />
                        </div>

                        {/* Visible Name Input */}
                        <div className="mb-6">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Nombre Visible (Clientes)</label>
                          <input
                            type="text"
                            value={editVisibleName}
                            onChange={e => setEditVisibleName(e.target.value)}
                            className="w-full bg-white border-2 border-transparent focus:border-green-500/50 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-0 outline-none shadow-sm transition-all"
                            placeholder="Ej. Cortina Enrollable Premium (si se deja vacío, se usa el nombre interno)"
                          />
                          <p className="text-xs text-gray-400 mt-1 ml-1">Este nombre es el que verán los clientes en las cotizaciones y PDFs.</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={cancelEdit}
                            disabled={isSaving}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={() => handleSave(product.id)}
                            disabled={isSaving || !editName.trim()}
                            className="flex-[2] py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isSaving ? (
                              <><Loader2 size={18} className="animate-spin" /> Guardando...</>
                            ) : (
                              <><Save size={18} /> Guardar Cambios</>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Right Column: Fabrics */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Palette size={18} className="text-blue-600" />
                          <h3 className="font-bold text-gray-900">Telas / Colores</h3>
                        </div>

                        {/* Existing Fabrics */}
                        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
                          {product.fabrics.length === 0 && (
                            <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4 text-center">No hay telas/colores registrados aún.</p>
                          )}
                          {product.fabrics.map(fabric => (
                            <div key={fabric.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                              {fabric.image_url ? (
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                                  <Image src={fabric.image_url} alt={fabric.name} fill className="object-cover" sizes="48px" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Palette size={16} className="text-gray-300" />
                                </div>
                              )}
                              <span className="flex-1 font-medium text-sm text-gray-800 truncate">{fabric.name}</span>
                              <button
                                onClick={() => handleDeleteFabric(product.id, fabric.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add New Fabric */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Agregar Nueva Tela/Color</label>
                          <div className="flex gap-3 mb-3">
                            <input
                              type="text"
                              value={newFabricName}
                              onChange={e => setNewFabricName(e.target.value)}
                              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Ej. Gris Oscuro"
                            />
                          </div>
                          <div className="flex gap-3 items-center">
                            <button
                              type="button"
                              onClick={() => fabricFileInputRef.current?.click()}
                              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              <Upload size={14} />
                              {newFabricPreview ? 'Cambiar' : 'Imagen'}
                            </button>
                            {newFabricPreview && (
                              <div className="w-8 h-8 rounded-md overflow-hidden relative flex-shrink-0">
                                <Image src={newFabricPreview} alt="preview" fill className="object-cover" sizes="32px" />
                              </div>
                            )}
                            <input
                              type="file"
                              ref={fabricFileInputRef}
                              onChange={handleFabricFileChange}
                              className="hidden"
                              accept="image/png, image/jpeg, image/webp"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddFabric(product.id)}
                              disabled={!newFabricName.trim() || isAddingFabric}
                              className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                            >
                              {isAddingFabric ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                              Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // VIEW MODE
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col h-full"
                  >
                    <div className="relative w-full aspect-[4/3] bg-gray-50">
                      {product.image_url ? (
                        <Image 
                          src={product.image_url} 
                          alt={product.name} 
                          fill 
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                          <ImageIcon size={48} />
                        </div>
                      )}
                      
                      {/* Edit Floating Button */}
                      <button 
                        onClick={() => startEdit(product)}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-white shadow-lg transition-all hover:scale-110 active:scale-95 z-10"
                      >
                        <Pencil size={18} />
                      </button>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-1 bg-white">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Activo</span>
                        {product.fabrics.length > 0 && (
                          <span className="ml-auto text-xs font-medium text-gray-400 flex items-center gap-1">
                            <Palette size={12} /> {product.fabrics.length} tela{product.fabrics.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 leading-tight pr-4">{product.name}</h3>
                      {product.visible_name && (
                        <p className="text-sm text-gray-400 mt-1">Visible: {product.visible_name}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
