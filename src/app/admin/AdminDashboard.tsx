'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, ExternalLink, FileText, TrendingUp, Clock, CheckCircle, MoreVertical, Filter, Download } from 'lucide-react'

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
  return 'Q. ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
  const conversionRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0

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
        {/* Table Header */}
        <div className="px-6 md:px-8 py-6 flex items-center justify-between border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">Cotizaciones Recientes</h3>
          <div className="flex gap-4">
            <button className="text-gray-500 text-sm font-medium hover:text-blue-600 flex items-center gap-2 transition-colors">
              <Filter size={16} />
              <span className="hidden sm:inline">Filtrar</span>
            </button>
            <button className="text-gray-500 text-sm font-medium hover:text-blue-600 flex items-center gap-2 transition-colors">
              <Download size={16} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
              {(!invoices || invoices.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                        <FileText size={28} />
                      </div>
                      <p className="text-gray-400 font-medium">No hay cotizaciones todavía.</p>
                      <Link href="/admin/new" className="text-blue-600 font-semibold text-sm hover:underline">
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
                      <Link
                        href={`/q/${invoice.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-lg"
                        title="Ver Cotización"
                      >
                        <Eye size={18} />
                      </Link>
                      <a
                        href={`/q/${invoice.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-lg"
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

        {/* Table Footer */}
        {invoices && invoices.length > 0 && (
          <div className="px-6 md:px-8 py-5 bg-gray-50/30 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Mostrando {invoices.length} de {stats.total} resultados</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
