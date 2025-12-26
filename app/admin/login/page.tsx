'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ArrowRight } from 'lucide-react'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'test123'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedPassword, setSavedPassword] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Kaydedilmiş şifreyi kontrol et
    fetch('/api/links')
      .then(res => res.json())
      .then(data => {
        if (data.adminPassword) {
          setSavedPassword(data.adminPassword)
        }
      })
      .catch(() => {})
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Önce kaydedilmiş şifreyi kontrol et, yoksa env'deki şifreyi kullan
      const correctPassword = savedPassword || ADMIN_PASSWORD

      // Simüle edilmiş gecikme (güvenlik için)
      await new Promise(resolve => setTimeout(resolve, 500))

      if (password === correctPassword) {
        // Şifre doğru, session'a kaydet
        sessionStorage.setItem('admin_authenticated', 'true')
        sessionStorage.setItem('admin_auth_time', Date.now().toString())
        router.push('/admin')
      } else {
        setError('Hatalı şifre!')
        setLoading(false)
      }
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a2e] to-black flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 md:p-12 border border-white/10 backdrop-blur-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/50 mb-4">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Admin Girişi
          </h1>
          <p className="text-gray-400 text-sm">Yönetim paneline erişmek için şifrenizi girin</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2.5 text-gray-300">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Şifrenizi girin"
              className="w-full glass rounded-xl p-4 border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40 text-white placeholder-gray-500"
              autoFocus
            />
          </div>

          {error && (
            <div className="glass rounded-xl p-3 border border-red-500/50 bg-red-500/10">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full glass rounded-xl px-6 py-4 flex items-center justify-center gap-2 hover:bg-blue-500/20 hover:border-blue-500/50 border border-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 font-medium"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                <span>Giriş yapılıyor...</span>
              </>
            ) : (
              <>
                <span>Giriş Yap</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Ana Sayfaya Dön
          </a>
        </div>
      </div>
    </div>
  )
}

