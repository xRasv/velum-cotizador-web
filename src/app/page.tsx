'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle, FileText, ArrowRight, ShieldCheck, Star } from 'lucide-react'

const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 60, damping: 15, delay: i * 0.12 }
  })
}

const stagger: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.6 }
  }
}

const cardVariant: any = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { 
    opacity: 1, y: 0, scale: 1, 
    transition: { type: "spring", stiffness: 80, damping: 18 } 
  }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary/5 to-accent/10 font-sans selection:bg-primary selection:text-white overflow-hidden">
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="p-6 md:p-8 flex justify-between items-center max-w-7xl mx-auto"
      >
        <div className="text-2xl font-black tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">V</div>
          <span>Velum.</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-black transition-colors hidden sm:block">
            Acceso Empleados
          </Link>
          <motion.a 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            href="https://wa.me/50212345678" 
            target="_blank" 
            rel="noreferrer" 
            className="bg-green-500 text-white px-5 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
          >
            <MessageCircle size={18} />
            Escríbenos
          </motion.a>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        
        <motion.div 
          custom={0} variants={fadeUp} initial="hidden" animate="show"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Cotizaciones Inteligentes En Línea
        </motion.div>

        <motion.h1 
          custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 max-w-4xl leading-[1.1] mb-6"
        >
          Viste tus ventanas con elegancia y <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">precisión.</span>
        </motion.h1>
        
        <motion.p 
          custom={2} variants={fadeUp} initial="hidden" animate="show"
          className="text-lg md:text-xl text-gray-600 max-w-2xl mb-12 leading-relaxed"
        >
          Has llegado al portal oficial de cotizaciones de Velum. Si buscas persianas y cortinas a la medida en Guatemala, estás en el lugar correcto.
        </motion.p>

        <motion.div 
          custom={3} variants={fadeUp} initial="hidden" animate="show"
          className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md"
        >
          <motion.a 
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.97 }}
            href="https://wa.me/50212345678" 
            target="_blank" 
            rel="noreferrer" 
            className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 group"
          >
            <MessageCircle className="group-hover:text-green-400 transition-colors" />
            Cotizar por WhatsApp
          </motion.a>
          <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}>
            <Link href="/q/11111111-1111-1111-1111-111111111111" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-2xl font-semibold text-lg hover:border-gray-900 transition-all flex items-center justify-center gap-2 group">
              Ver Demo Cotización
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 text-left max-w-5xl"
        >
          <motion.div variants={cardVariant} whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }} className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-shadow">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <Star size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Diseño Premium</h3>
            <p className="text-gray-600">Materiales de la más alta calidad para asegurar que tus espacios luzcan modernos y espectaculares.</p>
          </motion.div>
          
          <motion.div variants={cardVariant} whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }} className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-shadow">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Cotización Interactiva</h3>
            <p className="text-gray-600">Nuestros clientes reciben un enlace único donde pueden aprobar el diseño y añadir o quitar extras en tiempo real.</p>
          </motion.div>

          <motion.div variants={cardVariant} whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }} className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-shadow">
            <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Aprobación Rápida</h3>
            <p className="text-gray-600">Confirma tu pedido y descarga tu PDF oficial con un solo clic. Sin complicaciones ni tiempos de espera largos.</p>
          </motion.div>
        </motion.div>

      </main>
      
      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center pb-12 pt-10 border-t border-gray-200/50 text-gray-500 text-sm"
      >
        <p>© {new Date().getFullYear()} Velum. Todos los derechos reservados.</p>
        <p className="mt-2 text-xs">Hecho con ❤️ para Guatemala.</p>
      </motion.footer>
    </div>
  )
}
