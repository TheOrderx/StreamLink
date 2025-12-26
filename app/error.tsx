'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Uygulama hatası:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a2e] to-black flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Bir hata oluştu</h2>
        <p className="text-gray-400 mb-6">{error.message || 'Beklenmeyen bir hata meydana geldi'}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}

