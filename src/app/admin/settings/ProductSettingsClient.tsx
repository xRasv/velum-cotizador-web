'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Save, X, Image as ImageIcon, Upload, Loader2, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { updateProduct } from '@/app/actions'

type Product = {
  id: string
  name: string
  image_url: string | null
}

export default function ProductSettingsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Edit State
  const [editName, setEditName] = useState('')
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setEditName(product.name)
    setEditFile(null)
    setEditPreviewUrl(product.image_url)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditFile(null)
    setEditPreviewUrl(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setEditFile(file)
      // Show local preview
      const objectUrl = URL.createObjectURL(file)
      setEditPreviewUrl(objectUrl)
    }
  }

  const handleSave = async (id: string) => {
    if (!editName.trim()) return
    setIsSaving(true)

    try {
      let finalImageUrl = editPreviewUrl

      // Upload new file if selected
      if (editFile) {
        const fileExt = editFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, editFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error("Upload error:", uploadError)
          alert("Error al subir la imagen.")
          setIsSaving(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath)

        finalImageUrl = publicUrl
      }

      // Update Database via Server Action
      const result = await updateProduct(id, editName, finalImageUrl)
      
      if (result.error) {
        alert(result.error)
      } else {
        // Update local state
        setProducts(products.map(p => p.id === id ? { ...p, name: editName, image_url: finalImageUrl } : p))
        setEditingId(null)
      }
    } catch (err) {
      console.error(err)
      alert("Error inesperado al guardar.")
    } finally {
      setIsSaving(false)
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
        <p className="text-gray-500 font-medium max-w-2xl">Administra el catálogo de productos. Aquí puedes modificar los nombres y actualizar las imágenes que se mostrarán en todas las cotizaciones.</p>
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
              className={`bg-white rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(25,28,30,0.06)] border border-gray-100/50 flex flex-col transition-all duration-300 ${isEditing ? 'ring-4 ring-blue-500/20' : 'hover:shadow-[0_20px_60px_rgba(25,28,30,0.08)] hover:-translate-y-1'}`}
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
                    <div className="flex-1 mb-8">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Nombre del Producto</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-white border-2 border-transparent focus:border-blue-500/50 rounded-xl px-4 py-3 text-gray-900 font-bold focus:ring-0 outline-none shadow-sm transition-all"
                        placeholder="Ej. Enrollable Blackout..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-auto">
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
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 leading-tight pr-4">{product.name}</h3>
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
