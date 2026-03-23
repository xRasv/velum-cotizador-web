'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // For standalone minimal auth, we verify a simple hardcoded or env-configured password
    // Using a simple demo password here for immediate testing
    if (password === 'velum2026') {
      document.cookie = "velum_admin_auth=authenticated; path=/; max-age=86400"
      router.push('/admin')
    } else {
      setError('Contraseña incorrecta')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Velum Admin</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="Introduce la contraseña"
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-black transition-colors">
          Entrar
        </button>
      </form>
    </div>
  )
}
