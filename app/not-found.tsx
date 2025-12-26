import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a2e] to-black flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">404</h2>
        <p className="text-gray-400 mb-6">Sayfa bulunamadı</p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors inline-block"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}

