'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, ExternalLink, Plus, FileText } from 'lucide-react'

type Invoice = {
  id: string
  reference_code: string
  client_name: string
  total_amount: number
  status: string
  valid_until: string
}

const formatCurrency = (amount: number) => {
  return 'Q. ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    draft: 'bg-gray-50 text-gray-600 border-gray-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  const labels: Record<string, string> = {
    accepted: 'Aceptada',
    rejected: 'Rechazada',
    draft: 'Borrador',
    pending: 'Pendiente',
  }
  const key = status in styles ? status : 'pending'
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${styles[key]}`}>
      {labels[key]}
    </span>
  )
}

const stagger: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const rowVariant: any = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
}

export default function AdminDashboard({ invoices }: { invoices: Invoice[] | null }) {
  return (
    <div>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-gray-400 mt-1">{invoices?.length || 0} cotizaciones en total</p>
        </div>
        <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}>
          <Link 
            href="/admin/new" 
            className="hidden md:inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-black transition-all shadow-lg shadow-primary/10"
          >
            <Plus size={18} />
            Nueva Cotización
          </Link>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Referencia</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monto Base</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Vencimiento</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <motion.tbody variants={stagger} initial="hidden" animate="show" className="divide-y divide-gray-50">
              {(!invoices || invoices.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                        <FileText size={28} />
                      </div>
                      <p className="text-gray-400 font-medium">No hay cotizaciones todavía.</p>
                      <Link href="/admin/new" className="text-primary font-semibold text-sm hover:underline">
                        Crear la primera →
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
              {invoices?.map((invoice) => (
                <motion.tr 
                  variants={rowVariant}
                  key={invoice.id} 
                  className="hover:bg-primary/[0.02] transition-colors group"
                >
                  <td className="p-4 font-mono text-sm text-gray-600">{invoice.reference_code}</td>
                  <td className="p-4 font-semibold text-gray-900">{invoice.client_name}</td>
                  <td className="p-4 font-bold text-primary text-sm">{formatCurrency(invoice.total_amount)}</td>
                  <td className="p-4">{getStatusBadge(invoice.status)}</td>
                  <td className="p-4 text-sm text-gray-500 hidden sm:table-cell">
                    {new Date(invoice.valid_until).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/q/${invoice.id}`}
                        className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                        title="Ver Detalles"
                      >
                        <Eye size={18} />
                      </Link>
                      <a 
                        href={`/q/${invoice.id}`} 
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-accent transition-colors hover:bg-accent/5 rounded-lg"
                        title="Abrir URL Pública"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
