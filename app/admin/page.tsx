'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Save, Plus, Trash2, ArrowLeft, User, Link2, Video, Menu, X, LogOut, Lock, Settings, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SocialLink {
  id: number
  name: string
  url: string
  icon: string
  iconColor: string
  color: string
  bgGlow: string
  borderColor?: string
  glowColor?: string
}

interface Video {
  id: number
  title: string
  date: string
  thumbnail: string
  url: string
}

interface Profile {
  name: string
  image: string
  status: string
  musicUrl?: string
  isLive?: boolean
  youtubeChannelId?: string
  kickUsername?: string
  isKickLive?: boolean
  youtubeOfflineMessage?: string
  kickOfflineMessage?: string
}

interface Data {
  socialLinks: SocialLink[]
  videos: Video[]
  profile: Profile
}

type MenuItem = 'dashboard' | 'profile' | 'social' | 'videos' | 'security'

export default function AdminPage() {
  const router = useRouter()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeMenu, setActiveMenu] = useState<MenuItem>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [analytics, setAnalytics] = useState<{
    last24Hours: number
    last7Days: number
    last30Days: number
    total: number
    hourlyViews: Record<number, number>
  } | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [linkAnalytics, setLinkAnalytics] = useState<{
    last24Hours: number
    last7Days: number
    last30Days: number
    total: number
    topLinks: Array<{ linkId: number; name: string; count: number }>
    topLinks24h: Array<{ linkId: number; name: string; count: number }>
  } | null>(null)
  const [linkAnalyticsLoading, setLinkAnalyticsLoading] = useState(true)

  // Şifre kontrolü
  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = sessionStorage.getItem('admin_authenticated')
      const authTime = sessionStorage.getItem('admin_auth_time')
      
      // 24 saatlik session kontrolü
      if (authTime) {
        const timeDiff = Date.now() - parseInt(authTime)
        const hours24 = 24 * 60 * 60 * 1000
        
        if (timeDiff > hours24) {
          sessionStorage.removeItem('admin_authenticated')
          sessionStorage.removeItem('admin_auth_time')
          router.push('/admin/login')
          return
        }
      }
      
      if (isAuthenticated === 'true') {
        setAuthenticated(true)
      } else {
        router.push('/admin/login')
      }
    }
    
    checkAuth()
  }, [router])

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/links')
      const json = await response.json()
      setData(json)
    } catch (error) {
      setMessage({ type: 'error', text: 'Veriler yüklenemedi' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authenticated) {
      fetchData()
      fetchAnalytics()
      fetchLinkAnalytics()
    }
  }, [authenticated, fetchData])

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true)
      const response = await fetch('/api/analytics/track')
      const json = await response.json()
      setAnalytics(json)
    } catch (error) {
      setMessage({ type: 'error', text: 'Analytics verileri yüklenemedi' })
    } finally {
      setAnalyticsLoading(false)
    }
  }, [setMessage])

  const fetchLinkAnalytics = useCallback(async () => {
    try {
      setLinkAnalyticsLoading(true)
      const response = await fetch('/api/analytics/link-click')
      const json = await response.json()
      setLinkAnalytics(json)
    } catch (error) {
      setMessage({ type: 'error', text: 'Link analytics verileri yüklenemedi' })
    } finally {
      setLinkAnalyticsLoading(false)
    }
  }, [setMessage])

  // Dashboard aktifken analytics'i yenile
  useEffect(() => {
    if (activeMenu === 'dashboard' && authenticated) {
      fetchAnalytics()
      fetchLinkAnalytics()
      const interval = setInterval(() => {
        fetchAnalytics()
        fetchLinkAnalytics()
      }, 60000) // Her 60 saniyede bir yenile
      return () => clearInterval(interval)
    }
  }, [activeMenu, authenticated, fetchAnalytics, fetchLinkAnalytics])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending operations
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!data) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/links', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Değişiklikler kaydedildi!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Kaydetme başarısız oldu' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    } finally {
      setSaving(false)
    }
  }, [data])

  // Optimized update functions - batch updates
  const updateSocialLink = useCallback((index: number, field: keyof SocialLink, value: string) => {
    setData((prevData) => {
      if (!prevData) return prevData
      const newLinks = [...prevData.socialLinks]
      if (newLinks[index] && newLinks[index][field] === value) return prevData // Skip if unchanged
      newLinks[index] = { ...newLinks[index], [field]: value }
      return { ...prevData, socialLinks: newLinks }
    })
  }, [])

  // YouTube video ID çıkarma
  const getYouTubeVideoId = useCallback((url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }, [])

  // YouTube URL kontrolü
  const isYouTubeUrl = useCallback((url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }, [])


  const updateVideo = useCallback((index: number, field: keyof Video, value: string) => {
    setData((prevData) => {
      if (!prevData) return prevData
      const newVideos = [...prevData.videos]
      if (newVideos[index] && newVideos[index][field] === value) return prevData // Skip if unchanged
      
      const updatedVideo = { ...newVideos[index], [field]: value }
      
      // Eğer URL değiştiyse ve YouTube linkiyse, thumbnail ve tarihi otomatik oluştur
      if (field === 'url' && isYouTubeUrl(value)) {
        const videoId = getYouTubeVideoId(value)
        if (videoId) {
          updatedVideo.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          
          // Debounce: Kullanıcı yazmayı bitirdikten sonra API çağrısı yap
          setTimeout(() => {
            // URL hala aynı mı kontrol et
            setData((currentData) => {
              if (!currentData || !currentData.videos[index] || currentData.videos[index].url !== value) {
                return currentData
              }
              return currentData
            })
            
            // YouTube'dan video bilgilerini çek
            fetch(`/api/youtube?videoId=${videoId}`)
              .then(res => {
                if (!res.ok) {
                  return res.json().then(err => {
                    throw new Error(err.error || 'API hatası')
                  })
                }
                return res.json()
              })
              .then(data => {
                if (data.error) {
                  setMessage({ type: 'error', text: `YouTube API: ${data.error}` })
                  return
                }
                
                // URL hala aynı mı kontrol et
                setData((currentData) => {
                  if (!currentData || !currentData.videos[index] || currentData.videos[index].url !== value) {
                    return currentData
                  }
                  
                  const updatedVideos = [...currentData.videos]
                  if (updatedVideos[index]) {
                    if (data.formattedDate) {
                      updatedVideos[index] = { ...updatedVideos[index], date: data.formattedDate }
                    }
                    if (data.title && !updatedVideos[index].title) {
                      updatedVideos[index] = { ...updatedVideos[index], title: data.title }
                    }
                  }
                  return { ...currentData, videos: updatedVideos }
                })
              })
              .catch(error => {
                setMessage({ type: 'error', text: `Video bilgileri alınamadı: ${error.message}` })
              })
          }, 1000) // 1 saniye bekle
        }
      }
      
      newVideos[index] = updatedVideo
      return { ...prevData, videos: newVideos }
    })
  }, [isYouTubeUrl, getYouTubeVideoId])

  const updateProfile = useCallback((field: keyof Profile, value: string | boolean) => {
    setData((prevData) => {
      if (!prevData) return prevData
      if (prevData.profile[field] === value) return prevData // Skip if unchanged
      return { ...prevData, profile: { ...prevData.profile, [field]: value } }
    })
  }, [])

  const addVideo = useCallback(() => {
    setData((prevData) => {
      if (!prevData) return prevData
      const newVideo: Video = {
        id: Date.now(),
        title: 'Yeni Video',
        date: new Date().toLocaleDateString('tr-TR'),
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        url: '#',
      }
      return { ...prevData, videos: [...prevData.videos, newVideo] }
    })
  }, [])

  const deleteVideo = useCallback((id: number) => {
    setData((prevData) => {
      if (!prevData) return prevData
      return { ...prevData, videos: prevData.videos.filter((v) => v.id !== id) }
    })
  }, [])

  const addSocialLink = useCallback(() => {
    setData((prevData) => {
      if (!prevData) return prevData
      const newLink: SocialLink = {
        id: Date.now(),
        name: 'Yeni Platform',
        url: '#',
        icon: 'MessageCircle',
        iconColor: 'text-white',
        color: 'hover:border-gray-400 hover:shadow-[0_0_20px_rgba(156,163,175,0.5)]',
        bgGlow: 'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-gray-400/30 before:via-gray-500/20 before:to-gray-600/10 before:blur-2xl before:-z-10',
        borderColor: 'rgba(156, 163, 175, 0.4)',
        glowColor: 'rgba(156, 163, 175, 0.3)',
      }
      return { ...prevData, socialLinks: [...prevData.socialLinks, newLink] }
    })
  }, [])

  const deleteSocialLink = useCallback((id: number) => {
    setData((prevData) => {
      if (!prevData) return prevData
      return { ...prevData, socialLinks: prevData.socialLinks.filter((link) => link.id !== id) }
    })
  }, [])

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('admin_authenticated')
    sessionStorage.removeItem('admin_auth_time')
    router.push('/admin/login')
  }, [router])

  const availableIcons = useMemo(() => [
    { value: 'Youtube', label: 'YouTube' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'MessageCircle', label: 'Discord' },
    { value: 'Music', label: 'TikTok' },
    { value: 'Twitter', label: 'X (Twitter)' },
    { value: 'Megaphone', label: 'Megafon' },
    { value: 'Radio', label: 'Kick' },
  ], [])

  const menuItems = useMemo(() => [
    { id: 'dashboard' as MenuItem, label: 'Dashboard', icon: BarChart3 },
    { id: 'profile' as MenuItem, label: 'Profil', icon: User },
    { id: 'social' as MenuItem, label: 'Sosyal Medya', icon: Link2 },
    { id: 'videos' as MenuItem, label: 'Videolar', icon: Video },
    { id: 'security' as MenuItem, label: 'Güvenlik', icon: Lock },
  ], [])

  // Şifre değiştirme formu component'i
  const PasswordChangeForm = memo(({ setMessage }: { setMessage: (msg: { type: 'success' | 'error', text: string }) => void }) => {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handlePasswordChange = useCallback(async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        setMessage({ type: 'error', text: 'Lütfen tüm alanları doldurun' })
        return
      }

      if (newPassword.length < 3) {
        setMessage({ type: 'error', text: 'Yeni şifre en az 3 karakter olmalıdır' })
        return
      }

      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor' })
        return
      }

      setLoading(true)
      try {
        const res = await fetch('/api/admin/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword })
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setMessage({ type: 'success', text: 'Şifre başarıyla güncellendi!' })
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        } else {
          setMessage({ type: 'error', text: data.error || 'Şifre güncellenemedi' })
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Bir hata oluştu' })
      } finally {
        setLoading(false)
      }
    }, [currentPassword, newPassword, confirmPassword, setMessage])

    return (
      <form onSubmit={handlePasswordChange} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-gray-300">
            Mevcut Şifre
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Mevcut şifrenizi girin"
            className="w-full glass rounded-lg p-2.5 text-sm border border-white/10 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-gray-300">
            Yeni Şifre
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Yeni şifrenizi girin (min. 3 karakter)"
            className="w-full glass rounded-lg p-2.5 text-sm border border-white/10 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-gray-300">
            Yeni Şifre (Tekrar)
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Yeni şifrenizi tekrar girin"
            className="w-full glass rounded-lg p-2.5 text-sm border border-white/10 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          className="w-full glass rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-orange-500/20 hover:border-orange-500/50 border border-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 font-medium text-sm"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin"></div>
              <span>Güncelleniyor...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Şifreyi Güncelle</span>
            </>
          )}
        </button>
      </form>
    )
  })

  // Şifre kontrolü yapılıyor - tüm hooks çağrıldıktan sonra render kontrolü
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a2e] to-black flex items-center justify-center">
        <div className="glass rounded-2xl p-8 border border-white/10 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-white text-lg font-medium">Kontrol ediliyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a2e] to-black flex items-center justify-center">
        <div className="glass rounded-2xl p-8 border border-white/10 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-white text-lg font-medium">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a2e] to-black flex items-center justify-center">
        <div className="glass rounded-2xl p-8 border border-red-500/50 backdrop-blur-xl bg-red-500/10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 text-2xl">⚠</span>
            </div>
            <p className="text-white text-lg font-medium">Veri yüklenemedi</p>
            <button
              onClick={fetchData}
              className="glass rounded-xl px-6 py-2 hover:bg-white/20 transition-colors text-sm font-medium"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a2e] to-black text-white flex relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 ${sidebarOpen ? 'w-56' : 'w-0'} md:w-56 transition-all duration-300 overflow-hidden border-r border-white/10 bg-black/40 backdrop-blur-xl`}>
        <div className={`h-full flex flex-col p-3 ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'} transition-opacity duration-300`}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Admin
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Yönetim Paneli</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden glass rounded-lg p-1.5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 ${
                    activeMenu === item.id
                      ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/20'
                      : 'hover:bg-white/5 border border-transparent text-gray-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="pt-3 border-t border-white/10 space-y-1.5">
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium text-sm">Ana Sayfa</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-500/20 hover:border-red-500/50 border border-transparent transition-all duration-300 text-gray-300 hover:text-red-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium text-sm">Çıkış Yap</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="glass border-b border-white/10 backdrop-blur-xl p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="glass rounded-lg p-1.5 hover:bg-white/10 transition-colors md:hidden"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-bold">
                  {menuItems.find((item) => item.id === activeMenu)?.label}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">İçeriğinizi yönetin ve düzenleyin</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="glass rounded-lg px-3 py-2 flex items-center gap-1.5 hover:bg-red-500/20 hover:border-red-500/50 border border-white/10 transition-all duration-300 text-gray-300 hover:text-red-300"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium text-sm hidden md:inline">Çıkış</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="glass rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-green-500/20 hover:border-green-500/50 border border-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
              >
                <Save className="w-4 h-4" />
                <span className="font-medium text-sm">{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-5">
          <div className="max-w-5xl mx-auto space-y-4">

            {/* Message */}
            {message && (
              <div
                className={`glass rounded-lg p-3 border-2 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300 ${
                  message.type === 'success'
                    ? 'border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20'
                    : 'border-red-500/50 bg-red-500/10 shadow-lg shadow-red-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${message.type === 'success' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                  <span className="font-medium text-sm">{message.text}</span>
                </div>
              </div>
            )}

            {/* Dashboard Section */}
            {activeMenu === 'dashboard' && (
            <section className="glass rounded-xl p-4 md:p-5 space-y-4 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full"></div>
              <h2 className="text-lg md:text-xl font-bold">Dashboard</h2>
            </div>
            <button
              onClick={async () => {
                if (!confirm('TÜM istatistikleri (görüntülenme + link tıklamaları) sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
                  return
                }
                
                try {
                  // Hem görüntülenme hem de link tıklama istatistiklerini sıfırla
                  const [viewsResponse, linksResponse] = await Promise.all([
                    fetch('/api/analytics/track', { method: 'DELETE' }),
                    fetch('/api/analytics/link-click', { method: 'DELETE' })
                  ])
                  
                  const viewsData = await viewsResponse.json()
                  const linksData = await linksResponse.json()
                  
                  if (viewsResponse.ok && linksResponse.ok && viewsData.success && linksData.success) {
                    setMessage({ type: 'success', text: 'Tüm istatistikler başarıyla sıfırlandı!' })
                    // Her iki analytics'i de yeniden yükle
                    await Promise.all([fetchAnalytics(), fetchLinkAnalytics()])
                  } else {
                    setMessage({ type: 'error', text: 'İstatistikler sıfırlanırken bir hata oluştu' })
                  }
                } catch (error) {
                  setMessage({ type: 'error', text: 'Bir hata oluştu' })
                }
              }}
              className="glass rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-red-500/20 hover:border-red-500/50 border border-white/10 transition-all duration-300 text-red-400 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 font-medium text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Tümünü Sıfırla</span>
            </button>
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
            </div>
          ) : analytics ? (
            <>
            <div className="mb-4 p-3 glass rounded-lg border border-blue-500/30 bg-blue-500/10">
              <p className="text-xs text-blue-300">
                <strong>📊 Sayma Kriterleri:</strong> Her benzersiz IP adresinden 5 dakikada bir sayılır. Botlar ve crawler'lar sayılmaz. Aynı kullanıcı sayfayı yenilerse 5 dakika içinde tekrar sayılmaz.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Son 24 Saat */}
              <div className="glass rounded-xl p-4 md:p-5 border border-white/10 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-300 bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Son 24 Saat</h3>
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{analytics.last24Hours}</p>
                <p className="text-xs text-gray-400">Benzersiz Görüntülenme</p>
              </div>

              {/* Son 7 Gün */}
              <div className="glass rounded-xl p-4 md:p-5 border border-white/10 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Son 7 Gün</h3>
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{analytics.last7Days}</p>
                <p className="text-xs text-gray-400">Benzersiz Görüntülenme</p>
              </div>

              {/* Son 30 Gün */}
              <div className="glass rounded-xl p-4 md:p-5 border border-white/10 backdrop-blur-xl hover:border-green-500/50 transition-all duration-300 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Son 30 Gün</h3>
                  <BarChart3 className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{analytics.last30Days}</p>
                <p className="text-xs text-gray-400">Benzersiz Görüntülenme</p>
              </div>

              {/* Toplam */}
              <div className="glass rounded-xl p-4 md:p-5 border border-white/10 backdrop-blur-xl hover:border-orange-500/50 transition-all duration-300 bg-gradient-to-br from-orange-500/10 to-red-500/5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Toplam</h3>
                  <BarChart3 className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{analytics.total}</p>
                <p className="text-xs text-gray-400">Benzersiz Görüntülenme</p>
              </div>
            </div>
            </>
          ) : (
            <div className="glass rounded-xl p-4 md:p-5 border border-red-500/50 bg-red-500/10">
              <p className="text-red-400 text-sm">Analytics verileri yüklenemedi</p>
            </div>
          )}

          {/* En Çok Tıklanan Linkler */}
          <div className="mt-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></div>
                <h3 className="text-lg md:text-xl font-bold">En Çok Tıklanan Linkler</h3>
              </div>
              <button
                onClick={async () => {
                  if (!confirm('Tüm link tıklama istatistiklerini sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
                    return
                  }
                  
                  try {
                    const response = await fetch('/api/analytics/link-click', {
                      method: 'DELETE'
                    })
                    
                    const data = await response.json()
                    
                    if (response.ok && data.success) {
                      setMessage({ type: 'success', text: 'Link tıklama istatistikleri başarıyla sıfırlandı!' })
                      // Link analytics'i yeniden yükle
                      await fetchLinkAnalytics()
                    } else {
                      setMessage({ type: 'error', text: data.error || 'Link istatistikleri sıfırlanamadı' })
                    }
                  } catch (error) {
                    setMessage({ type: 'error', text: 'Bir hata oluştu' })
                  }
                }}
                className="glass rounded-lg px-3 py-1.5 flex items-center gap-2 hover:bg-red-500/20 hover:border-red-500/50 border border-white/10 transition-all duration-300 text-red-400 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 font-medium text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sıfırla</span>
              </button>
            </div>

            {linkAnalyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
              </div>
            ) : linkAnalytics ? (
              <>
                {/* İstatistik Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="glass rounded-xl p-4 border border-white/10 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Son 24 Saat</p>
                    <p className="text-2xl font-bold text-white">{linkAnalytics.last24Hours}</p>
                    <p className="text-xs text-gray-400 mt-1">Toplam Tıklama</p>
                  </div>
                  <div className="glass rounded-xl p-4 border border-white/10 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Son 7 Gün</p>
                    <p className="text-2xl font-bold text-white">{linkAnalytics.last7Days}</p>
                    <p className="text-xs text-gray-400 mt-1">Toplam Tıklama</p>
                  </div>
                  <div className="glass rounded-xl p-4 border border-white/10 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Toplam</p>
                    <p className="text-2xl font-bold text-white">{linkAnalytics.total}</p>
                    <p className="text-xs text-gray-400 mt-1">Tüm Zamanlar</p>
                  </div>
                </div>

                {/* En Çok Tıklanan Linkler Listesi */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Son 24 Saatte En Çok Tıklananlar</h4>
                  {linkAnalytics.topLinks24h.length > 0 ? (
                    linkAnalytics.topLinks24h.map((link, index) => (
                      <div
                        key={link.linkId}
                        className="glass rounded-lg p-3 border border-white/10 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/50' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
                            'bg-white/10 text-white border border-white/20'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-white font-medium">{link.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-400 font-bold">{link.count}</span>
                          <span className="text-xs text-gray-400">tıklama</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="glass rounded-lg p-4 border border-white/10 text-center">
                      <p className="text-gray-400 text-sm">Henüz tıklama yok</p>
                    </div>
                  )}
                </div>

                {/* Tüm Zamanlar En Çok Tıklananlar */}
                {linkAnalytics.topLinks.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Tüm Zamanlar En Çok Tıklananlar</h4>
                    {linkAnalytics.topLinks.slice(0, 5).map((link, index) => (
                      <div
                        key={link.linkId}
                        className="glass rounded-lg p-3 border border-white/10 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/50' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
                            'bg-white/10 text-white border border-white/20'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-white font-medium">{link.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-400 font-bold">{link.count}</span>
                          <span className="text-xs text-gray-400">tıklama</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="glass rounded-xl p-4 md:p-5 border border-red-500/50 bg-red-500/10">
                <p className="text-red-400 text-sm">Link analytics verileri yüklenemedi</p>
              </div>
            )}
          </div>
        </section>
            )}

            {/* Profile Section */}
            {activeMenu === 'profile' && data && (
        <section className="space-y-4">
          {/* Temel Bilgiler */}
          <div className="glass rounded-xl p-4 md:p-5 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-4">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></div>
              <h2 className="text-lg md:text-xl font-bold">Temel Bilgiler</h2>
            </div>
            <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-300">İsim</label>
              <input
                type="text"
                value={data.profile.name}
                onChange={(e) => updateProfile('name', e.target.value)}
                className="w-full glass rounded-lg p-2.5 text-sm border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-300">Profil Fotoğrafı URL</label>
              <input
                type="text"
                value={data.profile.image}
                onChange={(e) => updateProfile('image', e.target.value)}
                className="w-full glass rounded-lg p-2.5 text-sm border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
              />
            </div>
            </div>
          </div>

          {/* Canlı Yayın Ayarları */}
          <div className="glass rounded-xl p-4 md:p-5 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-4">
              <div className="w-1 h-5 bg-gradient-to-b from-red-400 to-pink-500 rounded-full"></div>
              <h2 className="text-lg md:text-xl font-bold">Canlı Yayın Ayarları</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-300">
                  YouTube Kanal ID
                </label>
                <input
                  type="text"
                  value={data.profile.youtubeChannelId || ''}
                  onChange={(e) => updateProfile('youtubeChannelId', e.target.value)}
                  placeholder="UC12345678901234567890"
                  className="w-full glass rounded-lg p-2.5 text-sm border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                />
                <details className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mt-2 cursor-pointer">
                  <summary className="text-yellow-300 font-semibold text-xs cursor-pointer">📌 Kanal ID'sini Nasıl Bulurum?</summary>
                  <ol className="list-decimal list-inside space-y-1 text-yellow-200/80 text-xs mt-2 ml-2">
                    <li>YouTube'da kanal sayfanıza gidin</li>
                    <li>URL'deki <code className="bg-black/30 px-1 rounded">UC...</code> kısmı kanal ID'nizdir</li>
                    <li>Örnek: <code className="bg-black/30 px-1 rounded">UC12345678901234567890</code></li>
                  </ol>
                </details>
              </div>
              
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-300">
                  Kick Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={data.profile.kickUsername || ''}
                  onChange={(e) => updateProfile('kickUsername', e.target.value)}
                  placeholder="Kick kullanıcı adınız (örn: orderflex)"
                  className="w-full glass rounded-lg p-2.5 text-sm border border-white/10 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Kick profil URL'nizdeki "kick.com/<span className="font-bold">kullaniciadi</span>" kısmındaki kullanıcı adınızı girin.
                </p>
              </div>
            </div>
          </div>

          {/* Mesajlar */}
          <div className="glass rounded-xl p-4 md:p-5 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-4">
              <div className="w-1 h-5 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></div>
              <h2 className="text-lg md:text-xl font-bold">Mesajlar</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-300">YouTube Çevrimdışı Mesajı</label>
                <input
                  type="text"
                  value={data.profile.youtubeOfflineMessage || ''}
                  onChange={(e) => updateProfile('youtubeOfflineMessage', e.target.value)}
                  placeholder="İyi ki canlı yayında değiliz. 😛"
                  className="w-full glass rounded-lg p-2.5 text-sm border border-white/10 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                />
                <p className="text-xs text-gray-400 mt-1">
                  YouTube'da yayında değilken gösterilecek mesaj. Emojiler kullanabilirsiniz! 😊
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-300">Kick Çevrimdışı Mesajı</label>
                <input
                  type="text"
                  value={data.profile.kickOfflineMessage || ''}
                  onChange={(e) => updateProfile('kickOfflineMessage', e.target.value)}
                  placeholder="Şimdilik Kick'te değiliz. 😊"
                  className="w-full glass rounded-lg p-2.5 text-sm border border-white/10 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Kick'te yayında değilken gösterilecek mesaj. Emojiler kullanabilirsiniz! 😊
                </p>
              </div>
            </div>
          </div>

          {/* Medya */}
          <div className="glass rounded-xl p-4 md:p-5 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-4">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
              <h2 className="text-lg md:text-xl font-bold">Medya</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-300">
                  Müzik URL
                </label>
                <input
                  type="text"
                  value={data.profile.musicUrl || ''}
                  onChange={(e) => updateProfile('musicUrl', e.target.value)}
                  placeholder="YouTube URL veya direkt müzik linki"
                  className="w-full glass rounded-lg p-2.5 text-sm border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Sayfa yüklendiğinde otomatik çalacak müzik. YouTube URL'si veya direkt müzik linki kullanabilirsiniz.
                </p>
              </div>
            </div>
          </div>

        </section>
            )}

            {/* Security Section */}
            {activeMenu === 'security' && (
            <section className="glass rounded-xl p-4 md:p-5 space-y-4 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-4">
            <div className="w-1 h-5 bg-gradient-to-b from-orange-400 to-red-500 rounded-full"></div>
            <h2 className="text-lg md:text-xl font-bold">Güvenlik Ayarları</h2>
          </div>
          <div className="glass rounded-xl p-4 md:p-5 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
            <PasswordChangeForm setMessage={setMessage} />
          </div>
        </section>
            )}

            {/* Social Links Section */}
            {activeMenu === 'social' && data && (
            <section className="glass rounded-xl p-4 md:p-5 space-y-4 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-pink-400 to-purple-500 rounded-full"></div>
              <h2 className="text-lg md:text-xl font-bold">Sosyal Medya Linkleri</h2>
            </div>
            <button
              onClick={addSocialLink}
              className="glass rounded-lg px-3 py-2 flex items-center gap-1.5 hover:bg-blue-500/20 hover:border-blue-500/50 border border-white/10 transition-all duration-300 text-xs font-medium hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Buton Ekle
            </button>
          </div>
          <div className="space-y-3">
            {data.socialLinks.map((link, index) => (
              <div
                key={link.id}
                className="glass rounded-lg p-3 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all duration-300 bg-black/20 hover:bg-black/30 space-y-3"
              >
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Buton #{index + 1}</h3>
                  <button
                    onClick={() => deleteSocialLink(link.id)}
                    className="glass rounded-lg p-1.5 hover:bg-red-500/20 hover:border-red-500/50 border border-white/10 transition-all duration-300 text-red-400 hover:scale-110 hover:shadow-lg hover:shadow-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-300">Platform Adı</label>
                    <input
                      type="text"
                      value={link.name}
                      onChange={(e) => updateSocialLink(index, 'name', e.target.value)}
                      className="w-full glass rounded-lg p-2 text-sm border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-300">URL</label>
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      className="w-full glass rounded-lg p-2 text-sm border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-300">İkon</label>
                    <select
                      value={link.icon}
                      onChange={(e) => updateSocialLink(index, 'icon', e.target.value)}
                      className="w-full glass rounded-lg p-2 border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm bg-black/40 backdrop-blur-md hover:bg-black/50 transition-all duration-300"
                    >
                      {availableIcons.map((icon) => (
                        <option key={icon.value} value={icon.value} className="bg-black">
                          {icon.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-300">İkon Rengi</label>
                    <input
                      type="text"
                      value={link.iconColor}
                      onChange={(e) => updateSocialLink(index, 'iconColor', e.target.value)}
                      placeholder="text-red-500"
                      className="w-full glass rounded-lg p-2 text-sm border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-300">Border Rengi</label>
                    <input
                      type="text"
                      value={link.borderColor || ''}
                      onChange={(e) => updateSocialLink(index, 'borderColor', e.target.value)}
                      placeholder="rgba(239, 68, 68, 0.4)"
                      className="w-full glass rounded-lg p-2 text-sm border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-300">Glow Rengi</label>
                    <input
                      type="text"
                      value={link.glowColor || ''}
                      onChange={(e) => updateSocialLink(index, 'glowColor', e.target.value)}
                      placeholder="rgba(239, 68, 68, 0.3)"
                      className="w-full glass rounded-lg p-2 text-sm border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
            )}

            {/* Videos Section */}
            {activeMenu === 'videos' && data && (
            <section className="glass rounded-xl p-4 md:p-5 space-y-4 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
              <h2 className="text-lg md:text-xl font-bold">Son Videolar</h2>
            </div>
            <button
              onClick={addVideo}
              className="glass rounded-lg px-3 py-2 flex items-center gap-1.5 hover:bg-cyan-500/20 hover:border-cyan-500/50 border border-white/10 transition-all duration-300 text-xs font-medium hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Video Ekle
            </button>
          </div>
          <div className="space-y-3">
            {data.videos.map((video, index) => (
              <div
                key={video.id}
                className="glass rounded-lg p-3 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all duration-300 bg-black/20 hover:bg-black/30 space-y-3"
              >
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Video #{index + 1}</h3>
                  <button
                    onClick={() => deleteVideo(video.id)}
                    className="glass rounded-lg p-1.5 hover:bg-red-500/20 hover:border-red-500/50 border border-white/10 transition-all duration-300 text-red-400 hover:scale-110 hover:shadow-lg hover:shadow-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-300">Video Başlığı</label>
                    <input
                      type="text"
                      value={video.title}
                      onChange={(e) => updateVideo(index, 'title', e.target.value)}
                      className="w-full glass rounded-lg p-2 text-sm border border-white/10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-300">Tarih</label>
                    <input
                      type="text"
                      value={video.date}
                      onChange={(e) => updateVideo(index, 'date', e.target.value)}
                      placeholder="YouTube URL girildiğinde otomatik doldurulur"
                      className="w-full glass rounded-lg p-2 text-sm border border-white/10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-300">Thumbnail URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={video.thumbnail}
                        onChange={(e) => updateVideo(index, 'thumbnail', e.target.value)}
                        className="flex-1 glass rounded-lg p-2 text-sm border border-white/10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                      />
                      {isYouTubeUrl(video.url) && (
                        <button
                          type="button"
                          onClick={() => {
                            const videoId = getYouTubeVideoId(video.url)
                            if (videoId) {
                              updateVideo(index, 'thumbnail', `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)
                            }
                          }}
                          className="px-3 py-2 glass rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all duration-300 text-xs font-medium whitespace-nowrap"
                          title="YouTube'dan thumbnail al"
                        >
                          YouTube'dan Al
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-gray-300">Video URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={video.url}
                        onChange={(e) => updateVideo(index, 'url', e.target.value)}
                        className="flex-1 glass rounded-lg p-2 text-sm border border-white/10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all duration-300 bg-black/30 backdrop-blur-md hover:bg-black/40"
                        placeholder="YouTube URL'si girildiğinde thumbnail ve tarih otomatik oluşturulur"
                      />
                      {isYouTubeUrl(video.url) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const videoId = getYouTubeVideoId(video.url)
                            if (videoId) {
                              try {
                                const res = await fetch(`/api/youtube?videoId=${videoId}`)
                                const data = await res.json()
                                
                                if (data.error) {
                                  setMessage({ type: 'error', text: `Hata: ${data.error}` })
                                  return
                                }
                                
                                setData((currentData) => {
                                  if (!currentData) return currentData
                                  const updatedVideos = [...currentData.videos]
                                  if (updatedVideos[index]) {
                                    if (data.formattedDate) {
                                      updatedVideos[index] = { ...updatedVideos[index], date: data.formattedDate }
                                    }
                                    if (data.title) {
                                      updatedVideos[index] = { ...updatedVideos[index], title: data.title }
                                    }
                                  }
                                  return { ...currentData, videos: updatedVideos }
                                })
                                
                                setMessage({ type: 'success', text: 'Video bilgileri güncellendi!' })
                              } catch (error: any) {
                                setMessage({ type: 'error', text: `Hata: ${error.message}` })
                              }
                            }
                          }}
                          className="px-3 py-2 glass rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all duration-300 text-xs font-medium whitespace-nowrap"
                          title="Video bilgilerini YouTube'dan çek"
                        >
                          Bilgileri Çek
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

