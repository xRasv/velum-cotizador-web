/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import { FileDown, CheckCircle, Plus, Check, MessageCircle } from 'lucide-react'
import { acceptInvoice, saveFabricSelection } from '@/app/actions'

type Addon = {
  id: string
  addon_name: string
  price: number
  is_selected: boolean
}

type FabricOption = {
  name: string
  image_url: string | null
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
  fabric_image_url?: string | null
  available_fabrics?: FabricOption[]
  addons: Addon[]
}

type Invoice = {
  id: string
  client_name: string
  reference_code: string
  valid_until: string
  total_amount: number
  notes?: string | null
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

  return <span>{display.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
}

export default function QuoteViewer({ invoice }: { invoice: Invoice }) {
  const [mounted, setMounted] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  
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

  // Track selected fabrics per item
  const [selectedFabrics, setSelectedFabrics] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    invoice.items.forEach(item => {
      if (item.fabric_name) {
        initial[item.id] = item.fabric_name
      }
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

  const handleFabricSelect = (itemId: string, fabricName: string) => {
    if (approved) return
    const newName = selectedFabrics[itemId] === fabricName ? '' : fabricName
    setSelectedFabrics(prev => ({
      ...prev,
      [itemId]: newName
    }))
    // Persist to DB
    saveFabricSelection(itemId, newName)
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
    return 'Q. ' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return
    setIsGeneratingPdf(true)

    // Open tab synchronously before any 'await' to appease strict popup blockers on Apple devices
    const isApple = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
    let newTab: Window | null = null
    
    if (isApple) {
      newTab = window.open('', '_blank')
      if (newTab) {
        newTab.document.write('<!DOCTYPE html><html><head><title>Generando Cotización...</title><style>body{display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;color:#334155;background:#f8fafc;}h1{font-weight:600;font-size:18px;}</style></head><body><h1>Preparando PDF, por favor espere unos segundos...</h1></body></html>')
      }
    }

    try {
      // DYNAMICALLY import react-pdf and the template so it doesn't break SSR or bloat initial load
      const { pdf } = await import('@react-pdf/renderer')
      const { QuotePDF } = await import('@/components/pdf/QuotePDF')

      const filename = `Cotizacion-${invoice.reference_code || 'Velum'}.pdf`
      
      // Generate standard Blob via @react-pdf/renderer
      const blob = await pdf(<QuotePDF invoice={invoice} selectedAddons={Array.from(selectedAddons)} />).toBlob()
      const url = URL.createObjectURL(blob)
      
      if (isApple && newTab) {
        // Tab was successfully opened initially; redirect it to the blob URL
        newTab.location.href = url
      } else if (isApple && !newTab) {
        // Fallback if popup blocker still managed to block the blank synchronous window
        window.location.assign(url)
      } else {
        // Standard hidden download link behavior for Windows/Android/Chrome
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error('PDF generation failed:', err)
      if (newTab) newTab.close()
      // Fallback
      window.print()
    } finally {
      setIsGeneratingPdf(false)
    }
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
    <div className="min-h-screen pb-[100px] bg-[#fdfdfc] text-slate-900 font-sans print:bg-white print:pb-0 overflow-x-hidden selection:bg-blue-600/20">
      
      {/* Background ambient noise/gradient */}
      <div className="fixed inset-0 pointer-events-none before:fixed before:inset-0 before:-z-20 before:bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] before:from-blue-50/50 before:via-transparent before:to-transparent opacity-60 print:hidden" />

      {/* Cinematic Hero Section */}
      <motion.header 
        style={{ y, opacity }}
        className="relative h-[32vh] min-h-[260px] md:h-[45vh] md:min-h-[400px] flex flex-col justify-end p-6 md:p-8 text-white print:h-auto print:min-h-0 print:p-0 print:text-black print:mb-8 overflow-hidden"
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
          className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_12px_40px_rgb(0,0,0,0.10)] border-l-4 border-l-blue-600 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-8 mb-6 md:mb-12 print:border-t-4 print:border-blue-900 print:shadow-none print:ring-0 print:rounded-none"
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

        {/* Notes */}
        {invoice.notes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="max-w-4xl mx-auto bg-amber-50/60 border border-amber-200/50 rounded-2xl p-5 md:p-6 mb-8 print:bg-yellow-50 print:border-yellow-200"
          >
            <p className="text-xs text-amber-600 uppercase tracking-widest font-bold mb-2">Notas</p>
            <p className="text-sm md:text-base text-amber-900/80 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
          </motion.div>
        )}

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

                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5 md:mb-6 pt-5 md:pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Ancho</p>
                    <p className="text-sm md:text-base font-medium text-slate-800">{item.width}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Alto</p>
                    <p className="text-sm md:text-base font-medium text-slate-800">{item.height}m</p>
                  </div>
                </div>

                {/* ✨ Interactive Fabric / Color Picker */}
                {(item.available_fabrics && item.available_fabrics.length > 0) ? (
                  <div className="mb-5 md:mb-6">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Elige tu Tela / Color
                    </p>
                    
                    {/* Horizontally scrollable swatch strip */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {item.available_fabrics.map((fabric) => {
                        const isActive = (selectedFabrics[item.id] ?? item.fabric_name) === fabric.name
                        return (
                          <motion.button
                            key={fabric.name}
                            type="button"
                            onClick={() => handleFabricSelect(item.id, fabric.name)}
                            whileTap={{ scale: 0.92 }}
                            className={`relative flex-shrink-0 snap-start flex flex-col items-center gap-1.5 py-2 px-2.5 rounded-xl transition-all duration-500 cursor-pointer min-w-[72px]
                              ${isActive 
                                ? 'bg-gradient-to-b from-blue-50 to-blue-100/50 shadow-lg shadow-blue-200/40 border-2 border-blue-400/50' 
                                : 'bg-white border-2 border-slate-100 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/30 active:bg-slate-50'
                              }
                            `}
                          >
                            {/* Swatch circle */}
                            <div className="relative">
                              {fabric.image_url ? (
                                <motion.div
                                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                  className={`w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden transition-all duration-500
                                    ${isActive 
                                      ? 'ring-[3px] ring-blue-500 ring-offset-2 ring-offset-blue-50' 
                                      : 'ring-2 ring-slate-200/50'
                                    }
                                  `}
                                >
                                  <img src={fabric.image_url} alt={fabric.name} className="w-full h-full object-cover" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                  className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500
                                    ${isActive 
                                      ? 'bg-blue-100 ring-[3px] ring-blue-500 ring-offset-2' 
                                      : 'bg-slate-100 ring-2 ring-slate-200/50'
                                    }
                                  `}
                                >
                                  <span className="text-lg">🎨</span>
                                </motion.div>
                              )}
                              
                              {/* Animated check badge */}
                              <AnimatePresence>
                                {isActive && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/40 border-2 border-white"
                                  >
                                    <Check size={12} strokeWidth={3} className="text-white" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Fabric name */}
                            <motion.span 
                              animate={{ color: isActive ? '#2563eb' : '#64748b' }}
                              className="text-[10px] md:text-[11px] font-bold leading-tight text-center max-w-[68px] line-clamp-2"
                            >
                              {fabric.name}
                            </motion.span>
                          </motion.button>
                        )
                      })}
                    </div>

                    {/* Selected fabric display */}
                    <AnimatePresence mode="wait">
                      {(selectedFabrics[item.id] ?? item.fabric_name) && (
                        <motion.div
                          key={selectedFabrics[item.id] ?? item.fabric_name}
                          initial={{ opacity: 0, y: 8, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -8, height: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className="mt-3 overflow-hidden"
                        >
                          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/80 rounded-xl border border-blue-100">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-bold text-blue-700">Selección:</span>
                            <span className="text-xs font-medium text-blue-600">{selectedFabrics[item.id] ?? item.fabric_name}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  // Static display when no fabrics are configured
                  item.fabric_name ? (
                    <div className="mb-5 md:mb-6">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Tela</p>
                      <div className="flex items-center gap-2">
                        {item.fabric_image_url && (
                          <div className="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-blue-100 flex-shrink-0">
                            <img src={item.fabric_image_url} alt={item.fabric_name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <p className="text-sm md:text-base font-medium text-slate-800 truncate">{item.fabric_name}</p>
                      </div>
                    </div>
                  ) : null
                )}
                
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
                            initial={{ opacity: 0, scale: 0.95, borderColor: 'rgba(99,102,241,0.5)' }}
                            animate={{ opacity: 1, scale: 1, borderColor: 'rgba(226,232,240,1)' }}
                            transition={{ duration: 0.6, type: 'spring', stiffness: 300, damping: 25 }}
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
                            
                            <div className={`font-medium text-sm md:text-base tabular-nums whitespace-nowrap flex-shrink-0 ${isSelected ? 'text-blue-100' : 'text-slate-500'} print:text-black`}>
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
              {/* WhatsApp Share */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hola! Mira mi cotización de Velum:\n\n📋 Ref: ${invoice.reference_code}\n💰 Total: ${formatCurrency(grandTotal)}\n\n👉 ${typeof window !== 'undefined' ? window.location.origin : ''}/q/${invoice.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-12 h-12 md:w-14 md:h-14 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                title="Compartir por WhatsApp"
              >
                <MessageCircle size={20} strokeWidth={2.5} />
              </a>
              <button 
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex w-12 h-12 md:w-14 md:h-14 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors focus:ring-4 focus:ring-slate-100 disabled:opacity-50 disabled:pointer-events-none"
                title="Descargar PDF"
              >
                {isGeneratingPdf ? (
                  <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <FileDown size={20} strokeWidth={2.5} />
                )}
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
