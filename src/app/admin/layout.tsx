'use client'

import { LayoutDashboard, FilePlus, LogOut, Menu, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/admin', label: 'Cotizaciones', icon: LayoutDashboard },
  { href: '/admin/new', label: 'Nueva Cotización', icon: FilePlus },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    document.cookie = "velum_admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col shadow-sm"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col gap-2">
            <Image src="/assets/logos/long_logo.png" alt="Velum Logo" width={110} height={32} className="object-contain" />
            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold ml-1">Cotizador Admin</div>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                  ${isActive 
                    ? 'bg-primary/5 text-primary' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-primary/5 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={20} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 w-full rounded-xl transition-all text-sm font-medium"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Overlay Menu */}
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
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 md:hidden flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center">
                  <Image src="/assets/logos/long_logo.png" alt="Velum Logo" width={110} height={32} className="object-contain" />
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 mt-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all
                        ${isActive ? 'bg-primary/5 text-primary' : 'text-gray-500 hover:bg-gray-50'}
                      `}
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
              <div className="p-3 border-t border-gray-100">
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 w-full rounded-xl text-sm font-medium transition-all">
                  <LogOut size={20} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white/80 backdrop-blur-lg border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu size={22} />
          </button>
          <Image src="/assets/logos/long_logo.png" alt="Velum" width={100} height={28} className="object-contain" />
          <Link href="/admin/new" className="text-primary font-semibold text-sm bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
            Nueva +
          </Link>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
