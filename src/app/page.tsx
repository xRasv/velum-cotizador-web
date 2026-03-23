import Link from 'next/link'
import { MessageCircle, FileText, ArrowRight, ShieldCheck, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary/5 to-accent/10 font-sans selection:bg-primary selection:text-white">
      {/* Navbar */}
      <nav className="p-6 md:p-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="text-2xl font-black tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">V</div>
          <span>Velum.</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-black transition-colors hidden sm:block">
            Acceso Empleados
          </Link>
          <a href="https://wa.me/50212345678" target="_blank" rel="noreferrer" className="bg-green-500 text-white px-5 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 hover:-translate-y-0.5">
            <MessageCircle size={18} />
            Escríbenos
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Cotizaciones Inteligentes En Línea
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 max-w-4xl leading-[1.1] mb-6">
          Viste tus ventanas con elegancia y <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">precisión.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-12 leading-relaxed">
          Has llegado al portal oficial de cotizaciones de Velum. Si buscas persianas y cortinas a la medida en Guatemala, estás en el lugar correcto.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <a href="https://wa.me/50212345678" target="_blank" rel="noreferrer" className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg hover:bg-black transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 group">
            <MessageCircle className="group-hover:text-green-400 transition-colors" />
            Cotizar por WhatsApp
          </a>
          <Link href="/q/11111111-1111-1111-1111-111111111111" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-2xl font-semibold text-lg hover:border-gray-900 transition-all flex items-center justify-center gap-2 group">
            Ver Demo Cotización
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 text-left max-w-5xl">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <Star size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Diseño Premium</h3>
            <p className="text-gray-600">Materiales de la más alta calidad para asegurar que tus espacios luzcan modernos y espectaculares.</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Cotización Interactiva</h3>
            <p className="text-gray-600">Nuestros clientes reciben un enlace único donde pueden aprobar el diseño y añadir o quitar extras en tiempo real.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Aprobación Rápida</h3>
            <p className="text-gray-600">Confirma tu pedido y descarga tu PDF oficial con un solo clic. Sin complicaciones ni tiempos de espera largos.</p>
          </div>
        </div>

      </main>
      
      {/* Footer */}
      <footer className="text-center pb-12 pt-10 border-t border-gray-200/50 text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Velum. Todos los derechos reservados.</p>
        <p className="mt-2 text-xs">Hecho con ❤️ para Guatemala.</p>
      </footer>
    </div>
  )
}
