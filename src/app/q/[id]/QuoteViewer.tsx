/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
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

// Animated Counter component for smooth price transitions
function AnimatedCounter({ value }: { value: number }) {
  const rounded = useSpring(value, { bounce: 0, duration: 800 })
  const [display, setDisplay] = useState(value)
  
  useEffect(() => {
    rounded.on("change", (latest) => {
      setDisplay(latest)
    })
  }, [rounded])

  useEffect(() => {
    rounded.set(value)
  }, [value, rounded])

  return <span>{display.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
}

export default function QuoteViewer({ invoice }: { invoice: Invoice }) {
  const [mounted, setMounted] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  
  // Parallax effects
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, 200])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])
  const scale = useTransform(scrollY, [0, 600], [1, 1.1])
  
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
    if (approved) return // disable changes if approved
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
    setIsApproving(true)
    const res = await acceptInvoice(invoice.id)
    if (res.success) {
      setApproved(true)
      // Remove visual elements by scrolling top, then reload after showing success screen
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } else {
      alert("Hubo un error al aprobar la cotización.")
      setIsApproving(false)
    }
  }

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 60, damping: 20 } }
  }

  if (approved) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="text-center"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/30"
          >
            <Check size={48} className="text-white" strokeWidth={3} />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">¡Cotización Aprobada!</h1>
          <p className="text-xl text-slate-500 font-medium">Gracias por confiar en Velum.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-[160px] bg-[#fdfdfc] text-slate-900 font-sans print:bg-white print:pb-0 overflow-x-hidden selection:bg-blue-600/20">
      
      {/* Background ambient noise/gradient */}
      <div className="fixed inset-0 pointer-events-none before:fixed before:inset-0 before:-z-20 before:bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] before:from-blue-50/50 before:via-transparent before:to-transparent opacity-60 print:hidden" />

      {/* Cinematic Hero Section */}
      <motion.header 
        style={{ y, opacity }}
        className="relative h-[38vh] min-h-[320px] md:h-[45vh] md:min-h-[400px] flex flex-col justify-end p-6 md:p-8 text-white print:h-auto print:min-h-0 print:p-0 print:text-black print:mb-8 overflow-hidden"
      >
        <motion.div 
          style={{ scale }}
          className="absolute inset-0 z-0 bg-cover bg-center print:hidden"
        >
          <div className="absolute inset-0 bg-[url('/assets/hero.png')] bg-cover bg-center mix-blend-overlay opacity-90" />
          <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-slate-900/40 to-transparent" />
        </motion.div>
        
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="absolute top-6 left-6 md:top-8 md:left-8 z-20 print:static print:mb-4"
        >
          <img 
            src="/assets/logos/long_logo.png" 
            alt="VELUM" 
            className="h-8 md:h-10 w-auto object-contain brightness-0 invert print:filter-none"
          />
        </motion.div>

        <div className="max-w-4xl mx-auto w-full relative z-10 px-4 md:px-8 pb-4">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring" } as any}
          >
            <p className="text-blue-200/80 uppercase tracking-widest text-sm font-semibold mb-3">Propuesta Exclusiva</p>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-light mb-4 leading-tight tracking-tight text-white">
              Cotización <br className="hidden md:block" /><span className="font-semibold">a la Medida</span>
            </h1>
            <p className="text-lg md:text-2xl opacity-90 font-light flex items-center gap-3">
              Preparado para <strong className="font-medium text-white">{invoice.client_name}</strong>
            </p>
          </motion.div>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto -mt-6 relative z-20 px-4 md:px-8 print:mt-0 print:px-0">
        
        {/* Editorial Summary Card */}
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 100, damping: 20 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-8 mb-6 md:mb-12 ring-1 ring-black/5 print:border-t-4 print:border-blue-900 print:shadow-none print:ring-0 print:rounded-none"
        >
          <div>
            <p className="text-slate-400 text-xs md:text-sm uppercase tracking-widest mb-2 font-bold">Referencia #{invoice.reference_code}</p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight">Proyecto Residencial</h2>
          </div>
          <div className="sm:text-right bg-slate-50 p-4 md:p-5 rounded-2xl w-full sm:w-auto border border-slate-100 print:bg-transparent print:border-0 print:p-0">
            <p className="text-slate-400 text-xs md:text-sm uppercase tracking-widest mb-1 font-bold">Fecha de validez</p>
            <strong className="text-lg md:text-xl text-slate-800 font-medium">
              {new Date(invoice.valid_until).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </strong>
          </div>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm md:text-base text-slate-400 uppercase tracking-[0.2em] mt-6 md:mt-16 mb-6 md:mb-8 font-bold text-center print:text-left print:text-black print:mt-8"
        >
          Detalles de los Productos
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
              key={item.id} 
              className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5 mb-8 md:flex md:flex-row transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] group print:shadow-none print:ring-gray-200 print:mb-6 print:page-break-inside-avoid print:rounded-xl"
            >
              {/* Product Image */}
              <div className="w-full md:w-[35%] h-[240px] md:h-auto relative overflow-hidden bg-slate-50 print:h-[200px]">
                {item.image_url ? (
                  <motion.img 
                    whileHover={{ scale: 1.05 }} 
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    src={item.image_url} 
                    alt={item.product_name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 font-medium tracking-wide">
                    Sin imagen
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none md:hidden" />
              </div>
              
              {/* Product Info */}
              <div className="flex-1 p-5 md:p-8 flex flex-col justify-center">
                <div className="flex flex-col xl:flex-row justify-between items-start gap-4 mb-5 md:mb-6">
                  <div className="flex-1 min-w-0 pr-0 md:pr-4">
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-widest mb-3">
                      Habitación: {item.room_name}
                    </span>
                    <h3 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 truncate">
                      {item.product_name}
                    </h3>
                  </div>
                  <div className="text-2xl md:text-3xl font-light text-slate-900 mt-1 md:mt-0 xl:mt-0 bg-slate-50 px-4 py-2 rounded-2xl print:bg-transparent print:p-0 whitespace-nowrap flex-shrink-0 self-start">
                    {formatCurrency(Number(item.base_price))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6 pt-5 md:pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Ancho</p>
                    <p className="text-sm md:text-base font-medium text-slate-800">{item.width}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Alto</p>
                    <p className="text-sm md:text-base font-medium text-slate-800">{item.height}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Tela</p>
                    <p className="text-sm md:text-base font-medium text-slate-800 truncate">{item.fabric_name}</p>
                  </div>
                </div>
                
                {/* Interactive Add-ons */}
                {item.addons.length > 0 && (
                  <div className="bg-slate-50/50 rounded-2xl p-4 md:p-6 ring-1 ring-slate-100/50 print:bg-white print:ring-0 print:border print:border-gray-200">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-4">Opciones de Mejora</p>
                    <div className="grid gap-3">
                      {item.addons.map(addon => {
                        const isSelected = selectedAddons.has(addon.id)
                        return (
                          <motion.div 
                            layout
                            key={addon.id}
                            onClick={() => toggleAddon(addon.id)}
                            className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition-all duration-300
                              ${isSelected 
                                ? 'bg-blue-600 ring-1 ring-blue-600 shadow-md shadow-blue-600/20' 
                                : 'bg-white ring-1 ring-slate-200 hover:ring-blue-300 hover:shadow-sm'}
                              print:ring-0 print:bg-transparent print:border-b print:border-gray-100 print:rounded-none print:p-2
                            `}
                          >
                            <div className="flex items-center gap-3 md:gap-4">
                              <motion.div 
                                layout
                                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors
                                  ${isSelected ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-400'}
                                  print:hidden
                                `}
                              >
                                {isSelected ? <Check size={14} strokeWidth={4} /> : <Plus size={14} strokeWidth={3} />}
                              </motion.div>
                              <h4 className={`font-medium tracking-wide text-sm md:text-base ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                                {addon.addon_name}
                              </h4>
                            </div>
                            
                            <div className={`font-medium text-sm md:text-base tabular-nums ${isSelected ? 'text-blue-100' : 'text-slate-500'} print:text-black`}>
                              {isSelected ? '' : '+ '} {formatCurrency(Number(addon.price))}
                              <span className="hidden print:inline"> ( {isSelected ? 'Inscrito' : 'Opcional'} )</span>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </main>

      {/* Floating Action Bar Console */}
      <AnimatePresence>
        <motion.div 
          initial={{ y: 150, opacity: 0, scale: 0.9, x: "-50%" }}
          animate={{ y: 0, opacity: 1, scale: 1, x: "-50%" }}
          transition={{ type: "spring", stiffness: 200, damping: 25, delay: 1 }}
          className="fixed bottom-6 md:bottom-10 left-1/2 w-[95%] md:w-max min-w-[320px] max-w-2xl z-50 print:hidden"
        >
          <div className="bg-white/90 backdrop-blur-2xl ring-1 ring-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] rounded-full py-2 px-3 md:p-3 flex flex-row items-center justify-between w-full border border-slate-200/60">
            
            <div className="flex flex-col pl-4 md:pl-6 pr-4">
              <p className="text-[9px] md:text-xs text-slate-500 uppercase tracking-widest font-bold leading-tight">Total</p>
              <div className="flex items-baseline gap-1 text-slate-900 font-extrabold text-xl md:text-3xl tracking-tight leading-none mt-1">
                <span className="text-sm md:text-xl font-medium text-slate-400">Q.</span>
                <span>{mounted ? <AnimatedCounter value={grandTotal} /> : formatCurrency(grandTotal).replace('Q. ', '')}</span>
              </div>
            </div>
            
            <div className="w-px h-8 md:h-10 bg-slate-200 mx-2 md:mx-4" />
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.print()} 
                className="hidden sm:flex w-12 h-12 md:w-14 md:h-14 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors focus:ring-4 focus:ring-slate-100"
                title="Descargar PDF"
              >
                <FileDown size={20} strokeWidth={2.5} />
              </button>
              <button 
                onClick={handleApprove}
                disabled={isApproving}
                className="flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 h-12 md:h-14 rounded-full font-bold bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 transition-all text-sm md:text-base focus:ring-4 focus:ring-blue-600/30 group disabled:opacity-70 disabled:pointer-events-none overflow-hidden relative whitespace-nowrap"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                
                {isApproving ? (
                  <span className="animate-pulse">Procesando...</span>
                ) : (
                  <>
                    <CheckCircle size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform md:w-5 md:h-5" />
                    <span className="tracking-wide">Aprobar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

    </div>
  )
}
