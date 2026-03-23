/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileDown, CheckCircle, Plus, Check } from 'lucide-react'
import { acceptInvoice } from '@/app/actions'

type Addon = {
  id: string
  addon_name: string
  price: number
  is_selected: boolean
}

type Item = {
  id: string
  room_name: string
  product_name: string
  width: number
  height: number
  fabric_name: string
  base_price: number
  image_url: string
  addons: Addon[]
}

type Invoice = {
  id: string
  client_name: string
  reference_code: string
  valid_until: string
  total_amount: number
  items: Item[]
}

export default function QuoteViewer({ invoice }: { invoice: Invoice }) {
  const [mounted, setMounted] = useState(false)
  
  // Calculate base total from all item base prices
  const baseTotal = invoice.items.reduce((acc, item) => acc + Number(item.base_price), 0)
  
  // Track selected addons by their ID
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    invoice.items.forEach(item => {
      item.addons.forEach(addon => {
        if (addon.is_selected) {
          initial.add(addon.id)
        }
      })
    })
    return initial
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleAddon = (addonId: string) => {
    const newSet = new Set(selectedAddons)
    if (newSet.has(addonId)) {
      newSet.delete(addonId)
    } else {
      newSet.add(addonId)
    }
    setSelectedAddons(newSet)
  }

  // Calculate extra cost from selected addons
  let addonsTotal = 0
  invoice.items.forEach(item => {
    item.addons.forEach(addon => {
      if (selectedAddons.has(addon.id)) {
        addonsTotal += Number(addon.price)
      }
    })
  })

  const grandTotal = baseTotal + addonsTotal

  const formatCurrency = (amount: number) => {
    return 'Q. ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleApprove = async () => {
    const res = await acceptInvoice(invoice.id)
    if (res.success) {
      alert("¡Cotización aprobada y notificada correctamente!")
      window.location.reload()
    } else {
      alert("Hubo un error al aprobar la cotización.")
    }
  }

  // Animation variants
  const staggerContainer: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const fadeIn: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  }

  return (
    <div className="min-h-screen pb-[240px] md:pb-[140px] bg-background text-foreground font-sans print:bg-white print:pb-0">
      {/* Hero Section */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative h-[40vh] min-h-[300px] flex flex-col justify-end p-8 text-white print:h-auto print:min-h-0 print:p-0 print:text-black print:mb-8"
      >
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center print:hidden"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-black/50 -z-10 print:hidden" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent -z-10 print:hidden" />
        
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute top-6 left-6 md:top-8 md:left-8 text-2xl font-extrabold tracking-widest uppercase print:static print:text-primary print:mb-4"
        >
          Velum.
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-4xl md:text-5xl font-light mb-2 leading-tight">
            Cotización de Diseño
          </h1>
          <p className="text-lg opacity-90 font-light">
            Preparado especialmente para <span className="font-medium">{invoice.client_name}</span>
          </p>
        </motion.div>
      </motion.header>

      <main className="max-w-4xl mx-auto -mt-10 md:-mt-12 relative z-10 px-4 md:px-8 print:mt-0 print:px-0">
        
        {/* Summary Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-xl p-6 md:p-8 shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t-4 border-primary gap-6 print:border-t-2 print:shadow-none print:border-gray-200"
        >
          <div>
            <p className="text-muted text-sm uppercase tracking-wider mb-1 font-semibold">Referencia: #{invoice.reference_code}</p>
            <h2 className="text-2xl font-semibold text-primary">Proyecto Residencial</h2>
          </div>
          <div className="sm:text-right">
            <p className="text-muted text-sm uppercase tracking-wider mb-1 font-semibold">Fecha de validez</p>
            <strong className="text-lg text-primary">
              {new Date(invoice.valid_until).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </strong>
          </div>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-lg md:text-xl text-muted uppercase tracking-wider mt-12 mb-6 font-semibold print:mt-8 print:text-black"
        >
          Detalles por Habitación
        </motion.h2>

        {/* Room Breakdown Items */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {invoice.items.map((item) => (
            <motion.article 
              variants={fadeIn}
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              key={item.id} 
              className="bg-card rounded-xl overflow-hidden shadow-sm mb-6 transition-all duration-300 print:shadow-none print:border print:border-gray-200 print:mb-4 print:page-break-inside-avoid"
            >
              <div className="flex flex-col sm:flex-row p-6 border-b border-gray-100/50 gap-6">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_name} className="w-full sm:w-[120px] h-48 sm:h-[120px] object-cover rounded-lg bg-gray-50 print:hidden" />
                ) : (
                  <div className="w-full sm:w-[120px] h-48 sm:h-[120px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 print:hidden">
                    Sin imagen
                  </div>
                )}
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                    <div>
                      <h3 className="text-xl md:text-2xl font-semibold mb-2 text-primary">{item.product_name}</h3>
                      <span className="inline-block px-3 py-1 bg-gray-100 text-muted text-xs font-medium rounded-full uppercase tracking-wider">
                        Ubicación: {item.room_name}
                      </span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-primary mt-2 sm:mt-0">
                      {formatCurrency(Number(item.base_price))}
                    </div>
                  </div>
                  <p className="text-muted text-sm md:text-base">
                    Ancho: <span className="font-medium text-foreground">{item.width}m</span> &nbsp;|&nbsp; 
                    Alto: <span className="font-medium text-foreground">{item.height}m</span> &nbsp;|&nbsp; 
                    Tela: <span className="font-medium text-foreground">{item.fabric_name}</span>
                  </p>
                </div>
              </div>
              
              {/* Interactive Add-ons */}
              {item.addons.length > 0 && (
                <div className="p-4 sm:p-6 bg-[#fafafa] flex flex-col gap-3 print:bg-white print:p-4">
                  <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1 print:text-black">Opciones de Mejora</p>
                  <div className="grid gap-3">
                    {item.addons.map(addon => {
                      const isSelected = selectedAddons.has(addon.id)
                      return (
                        <motion.div 
                          layout
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg cursor-pointer transition-colors duration-300 gap-3
                            ${isSelected ? 'border-accent bg-[#fffdf5]' : 'border-gray-200 bg-white hover:border-accent/60'}
                            print:border-none print:p-0 print:mt-1
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div 
                              layout
                              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors
                                ${isSelected ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400'}
                                print:hidden
                              `}
                            >
                              {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                            </motion.div>
                            <div>
                              <h4 className={`font-semibold ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                                {addon.addon_name}
                              </h4>
                            </div>
                          </div>
                          
                          <div className={`font-semibold sm:ml-auto ml-9 ${isSelected ? 'text-accent' : 'text-muted'} print:text-black`}>
                            {isSelected ? '' : '+ '} {formatCurrency(Number(addon.price))}
                            <span className="hidden print:inline"> ( {isSelected ? 'Incluido' : 'Opcional'} )</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.article>
          ))}
        </motion.div>

      </main>

      {/* Fixed Action Bar */}
      <AnimatePresence>
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 1 }}
          className="fixed bottom-0 left-0 w-full bg-card shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-50 print:hidden"
        >
          <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
            <div className="text-center md:text-left w-full md:w-auto">
              <p className="text-xs md:text-sm text-muted uppercase tracking-wider font-semibold mb-1">Inversión Total Estimada</p>
              
              <AnimatePresence mode="popLayout">
                {mounted && (
                  <motion.h2 
                    key={grandTotal}
                    initial={{ scale: 1.1, color: 'var(--color-accent)' }}
                    animate={{ scale: 1, color: 'var(--color-primary)' }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="text-3xl md:text-4xl font-bold text-primary"
                  >
                    {formatCurrency(grandTotal)}
                  </motion.h2>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
              <button 
                onClick={() => window.print()} 
                className="flex items-center justify-center gap-2 px-6 py-3 md:py-4 rounded-full font-semibold border-2 border-muted text-foreground hover:border-primary hover:text-primary transition-colors focus:ring-4 focus:ring-gray-100"
              >
                <FileDown size={20} />
                <span>Descargar PDF</span>
              </button>
              <button 
                onClick={handleApprove}
                className="group flex items-center justify-center gap-2 px-6 py-3 md:py-4 rounded-full font-semibold bg-primary text-white shadow-lg shadow-black/10 hover:bg-black hover:-translate-y-1 hover:shadow-xl transition-all focus:ring-4 focus:ring-primary/30"
              >
                <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                <span>Aprobar Cotización</span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
