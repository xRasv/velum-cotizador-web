'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Pencil, FileText, TrendingUp, Clock, CheckCircle, Search, Filter, Download, Copy, Trash2, MessageCircle, X } from 'lucide-react'
import { deleteInvoice, duplicateInvoice } from '@/app/actions'

type Invoice = {
  id: string
  reference_code: string
  client_name: string
  total_amount: number
  status: string
  valid_until: string
}

type Stats = {
  total: number
  pending: number
  approved: number
}

const formatCurrency = (amount: number) => {
  return 'Q. ' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const getStatusBadge = (status: string) => {
  const config: Record<string, { bg: string, text: string, label: string }> = {
    accepted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprobada' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazada' },
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Borrador' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendiente' },
  }
  const key = status in config ? status : 'pending'
  const { bg, text, label } = config[key]
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${bg} ${text}`}>
      {label}
    </span>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const stagger: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const rowVariant: any = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
}

const cardVariant: any = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 80, damping: 18 } }
}

export default function AdminDashboard({ invoices, stats }: { invoices: Invoice[] | null, stats: Stats }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const conversionRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0

  const filteredInvoices = invoices?.filter(invoice => 
    invoice.reference_code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Resumen Ejecutivo</h2>
        <p className="text-gray-500 font-medium">Bienvenido de vuelta. Aquí está el estado de tus operaciones hoy.</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12"
      >
        {/* Total Cotizaciones */}
        <motion.div
          variants={cardVariant}
          className="bg-white p-8 rounded-xl shadow-[0_10px_40px_rgba(25,28,30,0.05)] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText size={64} />
          </div>
          <p className="text-gray-500 text-sm font-semibold mb-2">Total Cotizaciones</p>
          <p className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{stats.total.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
            <TrendingUp size={14} />
            <span>Todas las cotizaciones</span>
          </div>
        </motion.div>

        {/* Pendientes */}
        <motion.div
          variants={cardVariant}
          className="bg-white p-8 rounded-xl shadow-[0_10px_40px_rgba(25,28,30,0.05)] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-amber-500">
            <Clock size={64} />
          </div>
          <p className="text-gray-500 text-sm font-semibold mb-2">Pendientes</p>
          <p className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{stats.pending.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold">
            <Clock size={14} />
            <span>Requieren atención</span>
          </div>
        </motion.div>

        {/* Aprobadas */}
        <motion.div
          variants={cardVariant}
          className="bg-white p-8 rounded-xl shadow-[0_10px_40px_rgba(25,28,30,0.05)] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-blue-600">
            <CheckCircle size={64} />
          </div>
          <p className="text-gray-500 text-sm font-semibold mb-2">Aprobadas</p>
          <p className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{stats.approved.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold">
            <CheckCircle size={14} />
            <span>Tasa de conversión {conversionRate}%</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-[0_10px_40px_rgba(25,28,30,0.05)] overflow-hidden"
      >
        {/* Table Header & Search */}
        <div className="px-6 md:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">Cotizaciones Recientes</h3>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64 md:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por referencia o cliente..."
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button className="text-gray-500 text-sm font-medium hover:text-blue-600 flex items-center gap-2 transition-colors">
                <Filter size={16} />
                <span className="hidden lg:inline">Filtrar</span>
              </button>
              <button className="text-gray-500 text-sm font-medium hover:text-blue-600 flex items-center gap-2 transition-colors">
                <Download size={16} />
                <span className="hidden lg:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-4 hide-scrollbar">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 md:px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Referencia</th>
                <th className="px-6 md:px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 md:px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Fecha</th>
                <th className="px-6 md:px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total</th>
                <th className="px-6 md:px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 md:px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <motion.tbody variants={stagger} initial="hidden" animate="show" className="divide-y divide-gray-50">
              {(!filteredInvoices || filteredInvoices.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                        <FileText size={28} />
                      </div>
                      <p className="text-gray-400 font-medium">No se encontraron cotizaciones.</p>
                      {searchQuery ? (
                        <button onClick={() => setSearchQuery('')} className="text-blue-600 font-semibold text-sm hover:underline">
                          Limpiar búsqueda
                        </button>
                      ) : (
                        <Link href="/admin/new" className="text-blue-600 font-semibold text-sm hover:underline">
                          Crear la primera →
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {filteredInvoices?.map((invoice) => (
                <motion.tr
                  variants={rowVariant}
                  key={invoice.id}
                  className="hover:bg-blue-50/50 transition-colors group"
                >
                  <td className="px-6 md:px-8 py-5 font-mono text-xs font-bold text-blue-600">{invoice.reference_code}</td>
                  <td className="px-6 md:px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                        {getInitials(invoice.client_name)}
                      </div>
                      <span className="font-semibold text-sm text-gray-900">{invoice.client_name}</span>
                    </div>
                  </td>
                  <td className="px-6 md:px-8 py-5 text-sm text-gray-500 hidden sm:table-cell">
                    {new Date(invoice.valid_until).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 md:px-8 py-5 font-bold text-sm text-gray-900">{formatCurrency(invoice.total_amount)}</td>
                  <td className="px-6 md:px-8 py-5">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 md:px-8 py-5 text-right">
                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      {/* WhatsApp Share */}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Hola! Aquí está tu cotización de Velum:\n\n📋 Ref: ${invoice.reference_code}\n💰 Total: ${formatCurrency(invoice.total_amount)}\n\n👉 ${typeof window !== 'undefined' ? window.location.origin : ''}/q/${invoice.id}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors hover:bg-green-50 rounded-lg"
                        title="Compartir por WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </a>
                      <Link
                        href={`/q/${invoice.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-lg"
                        title="Ver Cotización"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        href={`/admin/edit/${invoice.id}`}
                        className="p-2 text-gray-400 hover:text-amber-600 transition-colors hover:bg-amber-50 rounded-lg"
                        title="Modificar"
                      >
                        <Pencil size={18} />
                      </Link>
                      {/* Duplicate */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          const result = await duplicateInvoice(invoice.id)
                          if (result.success && result.newId) {
                            router.push(`/admin/edit/${result.newId}`)
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-violet-600 transition-colors hover:bg-violet-50 rounded-lg"
                        title="Duplicar"
                      >
                        <Copy size={18} />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(invoice.id)
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredInvoices && filteredInvoices.length > 0 && (
          <div className="px-6 md:px-8 py-5 bg-gray-50/30 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Mostrando {filteredInvoices.length} de {invoices?.length || 0} resultados</p>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar cotización?</h3>
              <p className="text-gray-500 text-sm mb-6">Esta acción no se puede deshacer. Se eliminarán todos los productos y extras asociados.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setIsDeleting(true)
                    await deleteInvoice(deleteTarget)
                    setDeleteTarget(null)
                    setIsDeleting(false)
                    router.refresh()
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
