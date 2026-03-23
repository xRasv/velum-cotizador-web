import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Eye, ExternalLink } from 'lucide-react'

export const revalidate = 0 // Disable caching for the admin dashboard

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  const formatCurrency = (amount: number) => {
    return 'Q. ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Aceptada</span>
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rechazada</span>
      case 'draft':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Borrador</span>
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendiente</span>
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones Recientes</h1>
        <Link 
          href="/admin/new" 
          className="hidden md:inline-flex bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-black transition-colors"
        >
          Crear Nueva Cotización
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Referencia</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto Base</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Vencimiento</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No hay cotizaciones todavía.</td>
                </tr>
              )}
              {invoices?.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-sm">{invoice.reference_code}</td>
                  <td className="p-4 font-medium">{invoice.client_name}</td>
                  <td className="p-4 font-semibold text-gray-900">{formatCurrency(invoice.total_amount)}</td>
                  <td className="p-4">{getStatusBadge(invoice.status)}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(invoice.valid_until).toLocaleDateString('es-GT')}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/q/${invoice.id}`}
                        className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-gray-100 rounded-lg"
                        title="Ver Detalles"
                      >
                        <Eye size={18} />
                      </Link>
                      <a 
                        href={`/q/${invoice.id}`} 
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-accent transition-colors hover:bg-gray-100 rounded-lg"
                        title="Abrir URL Pública"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
