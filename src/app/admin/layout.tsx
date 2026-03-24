'use client'

import { LayoutDashboard, FilePlus, LogOut, Menu, X, Search, Bell, Plus, Settings, History } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/new', label: 'Nueva Cotización', icon: FilePlus },
  { href: '#', label: 'Historial', icon: History },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    document.cookie = "velum_admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex">
      {/* Desktop Sidebar — Dark Theme */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-[260px] bg-slate-950 hidden md:flex flex-col py-8 justify-between shadow-2xl fixed left-0 top-0 h-screen z-50"
      >
        <div>
          {/* Logo */}
          <div className="px-8">
            <h1 className="text-lg font-black tracking-widest text-white mb-8">VELUM.</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 ease-in-out text-sm font-light
                    ${isActive
                      ? 'bg-blue-600/10 text-blue-400 border-r-2 border-blue-500'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div>
          {/* User Profile */}
          <div className="border-t border-slate-800 pt-6 px-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border-2 border-slate-600">
                AP
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">Admin Panel</p>
                <p className="text-slate-500 text-xs truncate">Velum Management</p>
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              <button className="text-slate-400 flex items-center gap-3 py-2 hover:text-white transition-colors text-sm font-light text-left">
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-slate-400 flex items-center gap-3 py-2 hover:text-white transition-colors text-sm font-light text-left"
              >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </nav>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay Menu — Dark Theme */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm" 
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-slate-950 z-50 md:hidden flex flex-col py-8 justify-between shadow-2xl"
            >
              <div>
                <div className="px-6 flex justify-between items-center mb-6">
                  <h1 className="text-lg font-black tracking-widest text-white">VELUM.</h1>
                  <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                    <X size={20} />
                  </button>
                </div>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-6 py-3 text-sm font-light transition-all
                          ${isActive ? 'bg-blue-600/10 text-blue-400 border-r-2 border-blue-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}
                        `}
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
              <div className="border-t border-slate-800 pt-6 px-6">
                <button onClick={handleLogout} className="flex items-center gap-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-light w-full text-left">
                  <LogOut size={18} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Canvas */}
      <main className="md:ml-[260px] flex-1 min-h-screen flex flex-col">
        {/* Desktop Top Bar — Glassmorphism */}
        <header className="hidden md:flex h-20 items-center justify-between px-12 sticky top-0 z-40 bg-white/70 backdrop-blur-[20px]" style={{ WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cotizaciones, clientes o facturas..."
                className="w-full bg-[#f2f4f6] border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-gray-500 hover:text-blue-600 transition-colors">
              <Bell size={22} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/admin/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 group"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                Nueva Cotización
              </Link>
            </motion.div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden bg-white/80 backdrop-blur-lg border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu size={22} />
          </button>
          <h1 className="text-sm font-black tracking-widest">VELUM.</h1>
          <Link href="/admin/new" className="text-blue-600 font-semibold text-sm bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
            Nueva +
          </Link>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto px-6 md:px-12 py-6 md:py-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
