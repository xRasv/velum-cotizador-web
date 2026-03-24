'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    // Small delay for visual feedback
    await new Promise(r => setTimeout(r, 400))
    
    if (password === 'velum2026') {
      document.cookie = "velum_admin_auth=authenticated; path=/; max-age=86400"
      router.push('/admin')
    } else {
      setError('Contraseña incorrecta')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary/5 p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
        className="relative z-10 w-full max-w-sm"
      >
        <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl shadow-gray-200/50 border border-white/80">
          {/* Logo */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <Image src="/assets/logos/long_logo.png" alt="Velum Logo" width={180} height={50} className="object-contain" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-xl font-bold text-center mb-1 tracking-tight">Portal de Administración</h1>
            <p className="text-sm text-gray-500 text-center mb-8">Ingresa tu contraseña para continuar</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-5"
          >
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-sm bg-white/50 placeholder:text-gray-400"
              placeholder="••••••••"
              autoFocus
            />
          </motion.div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100 font-medium"
            >
              {error}
            </motion.p>
          )}

          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-xl hover:bg-black transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/15 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Entrar
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-gray-400 mt-6"
        >
          Acceso exclusivo para el equipo de Velum.
        </motion.p>
      </motion.div>
    </div>
  )
}
