'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Scissors } from 'lucide-react'

const tabs = [
  { href: '/admin/settings', label: 'Productos', icon: Package },
  { href: '/admin/settings/fabric-prices', label: 'Precios de Tela', icon: Scissors },
]

export default function SettingsTabNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 max-w-sm">
      {tabs.map(tab => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
