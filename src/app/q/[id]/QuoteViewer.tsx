'use client'

import { useState } from 'react'
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

  return (
    <div className="min-h-screen pb-[240px]">
      <header className="relative bg-black/50 h-[40vh] min-h-[300px] flex flex-col justify-end p-8 text-white">
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent -z-10" />
        
        <div className="absolute top-8 left-8 text-2xl font-extrabold tracking-widest uppercase">
          Velum.
        </div>
        <h1 className="text-3xl md:text-5xl font-light mb-2 leading-tight">
          Cotización de Diseño
        </h1>
        <p className="text-lg opacity-90">Preparado especialmente para {invoice.client_name}</p>
      </header>

      <main className="max-w-4xl mx-auto -mt-10 md:-mt-14 relative z-10 px-6">
        
        <div className="bg-card rounded-xl p-6 md:p-8 shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t-4 border-primary gap-4">
          <div>
            <p className="text-muted text-sm uppercase tracking-wider mb-1">Referencia: #{invoice.reference_code}</p>
            <h2 className="text-2xl font-semibold">Proyecto Residencial</h2>
          </div>
          <div>
            <p className="text-muted text-sm uppercase tracking-wider mb-1">Fecha de validez</p>
            <strong className="text-lg">{new Date(invoice.valid_until).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
          </div>
        </div>

        <h2 className="text-xl text-muted uppercase tracking-wider mt-12 mb-6">Detalles por Habitación</h2>

        {invoice.items.map((item) => (
          <article key={item.id} className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow mb-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row p-6 border-b border-gray-100 gap-6">
              {item.image_url && (
                <img src={item.image_url} alt={item.product_name} className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-lg bg-gray-100" />
              )}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{item.product_name}</h3>
                    <span className="inline-block px-3 py-1 bg-gray-100 text-muted text-xs rounded-full mb-3">
                      Ubicación: {item.room_name}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-primary mt-2 sm:mt-0">
                    {formatCurrency(Number(item.base_price))}
                  </div>
                </div>
                <p className="text-muted text-sm">
                  Ancho: {item.width}m &nbsp;|&nbsp; Alto: {item.height}m &nbsp;|&nbsp; Tela: {item.fabric_name}
                </p>
              </div>
            </div>
            
            {item.addons.length > 0 && (
              <div className="p-6 bg-gray-50 flex flex-col gap-3">
                <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">Opciones de Mejora</p>
                {item.addons.map(addon => {
                  const isSelected = selectedAddons.has(addon.id)
                  return (
                    <div 
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg cursor-pointer transition-all gap-2 ${isSelected ? 'border-accent bg-[#fffdf5]' : 'border-gray-200 bg-white hover:border-accent/50'}`}
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900">{addon.addon_name}</h4>
                      </div>
                      <div className="font-semibold text-accent">
                        + {formatCurrency(Number(addon.price))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </article>
        ))}

      </main>

      <div className="fixed bottom-0 left-0 w-full bg-card shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted uppercase tracking-wider">Inversión Total Estimada</p>
            <h2 className="text-3xl font-bold text-primary transition-all duration-300">
              {formatCurrency(grandTotal)}
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button onClick={() => window.print()} className="px-6 py-3 rounded-full font-semibold border-2 border-muted text-foreground hover:border-primary hover:text-primary transition-all w-full sm:w-auto">
              📄 Descargar PDF
            </button>
            <button 
              onClick={handleApprove}
              className="px-6 py-3 rounded-full font-semibold bg-primary text-white shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all w-full sm:w-auto"
            >
              ✅ Aprobar Cotización
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
