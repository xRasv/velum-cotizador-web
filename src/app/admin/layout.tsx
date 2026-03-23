'use client'

import { LayoutDashboard, FilePlus, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="text-xl font-bold tracking-widest uppercase">Velum.</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Cotizador Admin</div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <LayoutDashboard size={20} />
            <span className="font-medium">Cotizaciones</span>
          </Link>
          <Link href="/admin/new" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <FilePlus size={20} />
            <span className="font-medium">Nueva Cotización</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => {
              document.cookie = "velum_admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="text-lg font-bold tracking-widest uppercase">Velum.</div>
          <Link href="/admin/new" className="text-primary font-medium">Nueva +</Link>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
