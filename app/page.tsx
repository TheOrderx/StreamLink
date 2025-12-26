'use client'

import { useState, useEffect, useCallback } from 'react'
import { Youtube, Instagram, MessageCircle, Music, Twitter, Megaphone, BadgeCheck, Radio, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'

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

const iconMap: Record<string, any> = {
  Youtube,
  Instagram,
  MessageCircle,
  Music,
  Twitter,
  Megaphone,
  Radio,
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function Home() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null)

  useEffect(() => {
    fetchData()
    
    // Görüntülenme takibi - sadece bir kez çalışsın (React Strict Mode için)
    const trackView = () => {
      // SessionStorage ile aynı session'da tekrar saymayı engelle
      const lastTracked = sessionStorage.getItem('last_view_tracked')
      const now = Date.now()
      
      // Aynı session'da son 5 dakika içinde zaten sayıldıysa tekrar sayma
      if (lastTracked) {
        const timeDiff = now - parseInt(lastTracked)
        if (timeDiff < 5 * 60 * 1000) { // 5 dakika
          return
        }
      }
      
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(() => {
          // Başarılı olursa sessionStorage'a kaydet
          sessionStorage.setItem('last_view_tracked', now.toString())
        })
        .catch(() => {
          // Sessizce hata yok say (analytics kritik değil)
        })
    }
    
    // Kısa bir gecikme ile çalıştır (sayfa tam yüklendikten sonra)
    const timeout = setTimeout(trackView, 1000)
    
    return () => clearTimeout(timeout)
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/links')
      const json = await response.json()
      
      // Önce data'yı set et (hemen göster, loading'i kapat)
      setData(json)
      setLoading(false)
      
      // Data yüklendiğinde hemen canlı yayın durumunu kontrol et (bekletmeden, paralel, await beklemeden)
      // YouTube kontrolü - bağımsız
      if (json.profile?.youtubeChannelId) {
        (async () => {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 1500)
            
            const liveStatusResponse = await fetch(`/api/youtube/live-status?channelId=${json.profile.youtubeChannelId}`, {
              signal: controller.signal
            })
            clearTimeout(timeoutId)
            
            if (liveStatusResponse.ok) {
              const liveStatusResult = await liveStatusResponse.json()
              if (liveStatusResult.isLive !== undefined) {
                setData((prevData) => {
                  if (!prevData) return prevData
                  return {
                    ...prevData,
                    profile: {
                      ...prevData.profile,
                      isLive: liveStatusResult.isLive
                    }
                  }
                })
              }
            }
          } catch (error) {
            // Timeout veya hata - sessizce geç
          }
        })()
      }
      
      // Kick kontrolü - bağımsız
      if (json.profile?.kickUsername) {
        (async () => {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 1500)
            
            const kickResponse = await fetch(`/api/kick/live?username=${json.profile.kickUsername}`, {
              signal: controller.signal
            })
            clearTimeout(timeoutId)
            
            if (kickResponse.ok) {
              const kickResult = await kickResponse.json()
              if (kickResult.isLive !== undefined) {
                setData((prevData) => {
                  if (!prevData) return prevData
                  return {
                    ...prevData,
                    profile: {
                      ...prevData.profile,
                      isKickLive: kickResult.isLive
                    }
                  }
                })
              }
            }
          } catch (error) {
            // Timeout veya hata - sessizce geç
          }
        })()
      }
    } catch (error) {
      // Sessizce hata yok say
      setLoading(false)
    }
  }

  // YouTube link kontrolü
  const isYouTubeUrl = useCallback((url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }, [])

  // YouTube video ID çıkarma
  const getYouTubeVideoId = useCallback((url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }, [])

  const [youtubeAPIReady, setYoutubeAPIReady] = useState(false)

  // YouTube iframe API yükleme
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
      
      window.onYouTubeIframeAPIReady = () => {
        setYoutubeAPIReady(true)
      }
    } else {
      setYoutubeAPIReady(true)
    }
  }, [])

  // Müzik çalma efekti - hooks her zaman aynı sırada çağrılmalı
  useEffect(() => {
    if (data?.profile?.musicUrl) {
      const musicUrl = data.profile.musicUrl
      
      // YouTube linki ise YouTube player oluştur
      if (isYouTubeUrl(musicUrl)) {
        const videoId = getYouTubeVideoId(musicUrl)
        
        // API ve container hazır olduğunda player oluştur
        const initYouTubePlayer = () => {
          if (videoId && youtubeAPIReady && window.YT && window.YT.Player) {
            const container = document.getElementById('youtube-player')
            if (!container) {
              // Container henüz yok, biraz bekle
              setTimeout(initYouTubePlayer, 100)
              return
            }
            
            // Eski player'ı temizle
            if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
              try {
                youtubePlayer.destroy()
              } catch (error) {
                // Sessizce hata yok say
              }
            }
            
            try {
              const player = new window.YT.Player('youtube-player', {
                videoId: videoId,
                width: 1,
                height: 1,
                playerVars: {
                  autoplay: 1,
                  loop: 1,
                  playlist: videoId,
                  controls: 0,
                  modestbranding: 1,
                  rel: 0,
                  iv_load_policy: 3,
                  enablejsapi: 1,
                },
                events: {
                  onReady: (event: any) => {
                    try {
                      event.target.setVolume(50)
                      setYoutubePlayer(event.target)
                      
                      // Otomatik çal - birden fazla yöntem dene
                      const playMusic = async () => {
                        if (event.target && typeof event.target.playVideo === 'function') {
                          try {
                            // Önce direkt playVideo dene
                            event.target.playVideo()
                            setIsPlaying(true)
                            
                            // 1 saniye sonra kontrol et, çalmıyorsa tekrar dene
                            setTimeout(() => {
                              try {
                                const playerState = event.target.getPlayerState()
                                if (playerState !== window.YT.PlayerState.PLAYING) {
                                  event.target.playVideo()
                                }
                              } catch (e) {
                                // Sessizce geç
                              }
                            }, 1000)
                          } catch (playError) {
                            // Hata varsa sessizce geç
                          }
                        }
                      }
                      
                      // Sayfa yüklendiğinde otomatik click simüle et (tarayıcı autoplay politikasını bypass etmek için)
                      const simulateUserInteraction = () => {
                        // Body'ye programatik click event'i gönder
                        const clickEvent = new MouseEvent('click', {
                          view: window,
                          bubbles: true,
                          cancelable: true
                        })
                        document.body.dispatchEvent(clickEvent)
                        
                        // Touch event'i de gönder (mobil için)
                        const touchEvent = new TouchEvent('touchstart', {
                          bubbles: true,
                          cancelable: true
                        } as any)
                        document.body.dispatchEvent(touchEvent)
                      }
                      
                      // Kullanıcı etkileşimi bekle (herhangi bir yere tıklama)
                      const playOnInteraction = () => {
                        playMusic()
                      }
                      
                      // Sayfa yüklendiğinde otomatik click simüle et
                      setTimeout(() => {
                        simulateUserInteraction()
                        playMusic()
                      }, 1000) // 1 saniye bekle (player tamamen hazır olsun)
                      
                      // Kullanıcı sayfanın herhangi bir yerine tıkladığında çal
                      document.addEventListener('click', playOnInteraction, { once: true })
                      document.addEventListener('touchstart', playOnInteraction, { once: true })
                      document.addEventListener('keydown', playOnInteraction, { once: true })
                      document.addEventListener('mousemove', playOnInteraction, { once: true })
                    } catch (error) {
                      // Sessizce hata yok say
                    }
                  },
                  onStateChange: (event: any) => {
                    try {
                      if (event.data === window.YT.PlayerState.PLAYING) {
                        setIsPlaying(true)
                      } else if (event.data === window.YT.PlayerState.PAUSED) {
                        setIsPlaying(false)
                      }
                    } catch (error) {
                      // Sessizce hata yok say
                    }
                  },
                  onError: () => {
                    // Sessizce hata yok say
                  },
                },
              })
              
              // Player'ı hemen state'e kaydet (onReady'den önce)
              setYoutubePlayer(player)
            } catch (error) {
              // Sessizce hata yok say
            }
          } else if (videoId && !youtubeAPIReady) {
            // API henüz yüklenmedi, biraz bekle
            setTimeout(initYouTubePlayer, 500)
          }
        }
        
        initYouTubePlayer()
        
        return () => {
          if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
            try {
              youtubePlayer.destroy()
              } catch (error) {
                // Sessizce hata yok say
              }
          }
          setYoutubePlayer(null)
        }
      } else {
        // YouTube linki değilse direkt audio çal
        const audio = new Audio(musicUrl)
        audio.loop = true
        audio.volume = 0.5
        setAudioRef(audio)
        
        // Kullanıcı etkileşimi sonrası çal (tarayıcı politikası)
        const playMusic = () => {
          audio.play()
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Sessizce hata yok say
            })
        }
        
        // İlk tıklamada çal
        document.addEventListener('click', playMusic, { once: true })
        document.addEventListener('touchstart', playMusic, { once: true })
        
        return () => {
          audio.pause()
          audio.src = ''
          document.removeEventListener('click', playMusic)
          document.removeEventListener('touchstart', playMusic)
        }
      }
    }
  }, [data?.profile?.musicUrl, isYouTubeUrl, getYouTubeVideoId, youtubeAPIReady])

  // YouTube canlı yayın durumu kontrolü - Bağımsız
  useEffect(() => {
    if (!data?.profile?.youtubeChannelId) return

    let liveStatusCheckInterval = 20000 // Live Status: 20 saniye (quota kullanmaz)
    let lastYouTubeResult: { isLive: boolean; timestamp: number } | null = null
    const CACHE_DURATION = 300000 // Sonuçları 5 dakika cache'le (API route'da zaten 5 dakika cache var)

    const checkYouTubeLiveStatus = async () => {
      try {
        const channelId = data.profile.youtubeChannelId
        if (!channelId) return

        const now = Date.now()
        
        // Cache kontrolü - son kontrol sonucu hala geçerliyse kullan
        if (lastYouTubeResult && (now - lastYouTubeResult.timestamp) < CACHE_DURATION) {
          setData((prevData) => {
            if (!prevData) return prevData
            return {
              ...prevData,
              profile: {
                ...prevData.profile,
                isLive: lastYouTubeResult!.isLive
              }
            }
          })
          return
        }
        
        // Yeni live-status API ile kontrol et (API kullanmadan, quota kullanmaz)
        const liveStatusResponse = await fetch(`/api/youtube/live-status?channelId=${channelId}`)
        if (liveStatusResponse.ok) {
          const liveStatusResult = await liveStatusResponse.json()
          // Detaylı log (debug için)
          console.log('📡 YouTube Live Status kontrolü:', {
            isLive: liveStatusResult.isLive ? '✅ YAYINDA' : '❌ YAYINDA DEĞİL',
            videoId: liveStatusResult.videoId || 'yok',
            checkedAt: liveStatusResult.checkedAt || 'yok'
          })
          
          if (liveStatusResult.isLive !== undefined) {
            lastYouTubeResult = { isLive: liveStatusResult.isLive, timestamp: now }
            
            setData((prevData) => {
              if (!prevData) return prevData
              return {
                ...prevData,
                profile: {
                  ...prevData.profile,
                  isLive: liveStatusResult.isLive
                }
              }
            })
          }
        }
      } catch (error: any) {
        console.error('YouTube live status kontrolü hatası:', error.message)
      }
    }

    // Interval referansı
    const intervalRef = { current: null as NodeJS.Timeout | null }

    // İlk kontrolü hemen yap (sayfa yüklendiğinde)
    checkYouTubeLiveStatus()
    
    // Live Status kontrolü için interval (20 saniyede bir, quota kullanmaz)
    intervalRef.current = setInterval(checkYouTubeLiveStatus, liveStatusCheckInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [data?.profile?.youtubeChannelId])

  // Kick canlı yayın durumu kontrolü - Bağımsız
  useEffect(() => {
    if (!data?.profile?.kickUsername) return

    let kickCheckInterval = 20000 // Kick: 20 saniye
    let lastKickResult: { isLive: boolean; timestamp: number } | null = null
    const CACHE_DURATION = 300000 // Sonuçları 5 dakika cache'le

    const checkKickLiveStatus = async () => {
      try {
        const kickUsername = data.profile.kickUsername
        if (!kickUsername) return

        const now = Date.now()
        
        // Cache kontrolü - son kontrol sonucu hala geçerliyse kullan
        if (lastKickResult && (now - lastKickResult.timestamp) < CACHE_DURATION) {
          setData((prevData) => {
            if (!prevData) return prevData
            return {
              ...prevData,
              profile: {
                ...prevData.profile,
                isKickLive: lastKickResult!.isLive
              }
            }
          })
          return
        }
        
        const kickResponse = await fetch(`/api/kick/live?username=${kickUsername}`)
        if (kickResponse.ok) {
          const kickResult = await kickResponse.json()
          console.log('📡 Kick Live Status kontrolü:', {
            isLive: kickResult.isLive ? '✅ YAYINDA' : '❌ YAYINDA DEĞİL',
            username: kickUsername
          })
          
          if (kickResult.isLive !== undefined) {
            lastKickResult = { isLive: kickResult.isLive, timestamp: now }
            
            setData((prevData) => {
              if (!prevData) return prevData
              return {
                ...prevData,
                profile: {
                  ...prevData.profile,
                  isKickLive: kickResult.isLive
                }
              }
            })
          }
        }
      } catch (error: any) {
        console.error('Kick live status kontrolü hatası:', error.message)
      }
    }

    // Interval referansı
    const intervalRef = { current: null as NodeJS.Timeout | null }

    // İlk kontrolü hemen yap (sayfa yüklendiğinde)
    checkKickLiveStatus()
    
    // Kick kontrolü için interval (20 saniyede bir)
    intervalRef.current = setInterval(checkKickLiveStatus, kickCheckInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [data?.profile?.kickUsername])

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1a2e] to-black flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    )
  }

  const { socialLinks, videos, profile } = data

  const videoId = profile.musicUrl && isYouTubeUrl(profile.musicUrl) 
    ? getYouTubeVideoId(profile.musicUrl) 
    : null

  const toggleMusic = () => {
    if (youtubePlayer && typeof youtubePlayer.playVideo === 'function') {
      try {
        if (isPlaying) {
          youtubePlayer.pauseVideo()
          setIsPlaying(false)
        } else {
          youtubePlayer.playVideo()
          setIsPlaying(true)
        }
      } catch (error) {
        // Sessizce hata yok say
      }
    } else if (audioRef) {
      // Normal audio için
      if (isPlaying) {
        audioRef.pause()
        setIsPlaying(false)
      } else {
        audioRef.play().catch(() => {
          // Sessizce hata yok say
        })
        setIsPlaying(true)
      }
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-12 pb-12 px-4 relative">
      {/* YouTube Player Container (Gizli) */}
      {videoId && (
        <div id="youtube-player" className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none"></div>
      )}

      {/* Müzik Kontrol Butonu */}
      {profile.musicUrl && (
        <button
          onClick={toggleMusic}
          className="fixed top-4 right-4 z-50 glass rounded-full p-3 hover:bg-white/20 border border-white/10 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20"
          title={isPlaying ? 'Müziği Durdur' : 'Müziği Çal'}
        >
          {isPlaying ? (
            <Volume2 className="w-5 h-5 text-blue-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-gray-400" />
          )}
        </button>
      )}
      
      <div className="w-full max-w-2xl space-y-10">
        {/* Header Section */}
        <header className="flex flex-col items-center space-y-4">
          {/* Profile Picture */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-lg glow-red">
            <Image
              src={profile.image}
              alt={profile.name}
              fill
              sizes="128px"
              className="object-cover"
              priority
            />
          </div>

          {/* Name with Verified Badge */}
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              {profile.name}
            </h1>
            <BadgeCheck className="w-6 h-6 text-blue-500" fill="#3b82f6" />
          </div>

          {/* Status Badges - YouTube ve Kick */}
          <div className="flex flex-col gap-3 items-center w-full">
            <div className="flex gap-3 items-center">
              {/* YouTube Status Badge */}
              {profile.youtubeChannelId && (
                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${profile.isLive ? 'bg-red-500/30 border-red-500/70 glow-red-strong' : 'bg-gray-500/20 border-gray-500/50'}`}>
                  <Youtube className={`w-4 h-4 ${profile.isLive ? 'text-red-400' : 'text-gray-400'}`} />
                  <span className={`w-2 h-2 rounded-full ${profile.isLive ? 'bg-red-400 animate-pulse' : 'bg-gray-400'}`}></span>
                  <p className="text-sm font-semibold text-white">
                    {profile.isLive ? 'Canlı Yayında! 🔴' : (profile.youtubeOfflineMessage || 'YouTube\'da değil')}
                  </p>
                </div>
              )}
              
              {/* Kick Status Badge */}
              {profile.kickUsername && (
                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${profile.isKickLive ? 'bg-green-500/30 border-green-500/70' : 'bg-gray-500/20 border-gray-500/50'}`}>
                  <Radio className={`w-4 h-4 ${profile.isKickLive ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className={`w-2 h-2 rounded-full ${profile.isKickLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                  <p className="text-sm font-semibold text-white">
                    {profile.isKickLive ? 'Kick\'te yayında! 🟢' : (profile.kickOfflineMessage || 'Kick\'te değil')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Social Media Buttons */}
        <section className="space-y-5">
          <h2 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-3 pl-3 border-l-2 border-white">
            SOSYAL MEDYA HESAPLARI
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {socialLinks
              .sort((a, b) => {
                // Görseldeki sıralama: YouTube, Instagram, IG Kanalı, Discord, TikTok, X, Kick
                const order = [1, 2, 5, 3, 4, 6, 7]
                return order.indexOf(a.id) - order.indexOf(b.id)
              })
              .map((social) => {
              const Icon = iconMap[social.icon] || MessageCircle
              
              // Admin panelinden gelen renkleri kullan, yoksa varsayılan renkleri kullan
              const getBrandColors = (social: SocialLink) => {
                // Eğer admin panelinden renk girilmişse onları kullan
                if (social.borderColor && social.glowColor) {
                  // Glow rengini daha parlak yapmak için opacity'yi artır
                  const glowColorHover = social.glowColor.replace(/0\.\d+\)$/, '0.5)')
                  return {
                    border: social.borderColor,
                    shadow: `0 0 15px ${social.glowColor}`,
                    shadowHover: `0 0 25px ${glowColorHover}`
                  }
                }
                
                // Varsayılan renkler (geriye dönük uyumluluk için)
                switch(social.id) {
                  case 1: // YouTube
                    return {
                      border: 'rgba(239, 68, 68, 0.4)',
                      shadow: '0 0 15px rgba(239, 68, 68, 0.3)',
                      shadowHover: '0 0 25px rgba(239, 68, 68, 0.5)'
                    }
                  case 2: // Instagram
                    return {
                      border: 'rgba(236, 72, 153, 0.4)',
                      shadow: '0 0 15px rgba(236, 72, 153, 0.3)',
                      shadowHover: '0 0 25px rgba(236, 72, 153, 0.5)'
                    }
                  case 3: // Discord
                    return {
                      border: 'rgba(99, 102, 241, 0.4)',
                      shadow: '0 0 15px rgba(99, 102, 241, 0.3)',
                      shadowHover: '0 0 25px rgba(99, 102, 241, 0.5)'
                    }
                  case 4: // TikTok
                    return {
                      border: 'rgba(6, 182, 212, 0.4)',
                      shadow: '0 0 15px rgba(6, 182, 212, 0.3)',
                      shadowHover: '0 0 25px rgba(6, 182, 212, 0.5)'
                    }
                  case 5: // IG Kanalı
                    return {
                      border: 'rgba(236, 72, 153, 0.4)',
                      shadow: '0 0 15px rgba(236, 72, 153, 0.3)',
                      shadowHover: '0 0 25px rgba(236, 72, 153, 0.5)'
                    }
                  case 6: // X (Twitter)
                    return {
                      border: 'rgba(156, 163, 175, 0.4)',
                      shadow: '0 0 15px rgba(156, 163, 175, 0.3)',
                      shadowHover: '0 0 25px rgba(156, 163, 175, 0.5)'
                    }
                  case 7: // Kick
                    return {
                      border: 'rgba(34, 197, 94, 0.4)',
                      shadow: '0 0 15px rgba(34, 197, 94, 0.3)',
                      shadowHover: '0 0 25px rgba(34, 197, 94, 0.5)'
                    }
                  default:
                    return {
                      border: 'rgba(255, 255, 255, 0.1)',
                      shadow: '0 0 15px rgba(255, 255, 255, 0.1)',
                      shadowHover: '0 0 25px rgba(255, 255, 255, 0.2)'
                    }
                }
              }
              
              const colors = getBrandColors(social)
              
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-xl p-3 flex items-center gap-2.5 transition-all duration-300 cursor-pointer bg-black/40 backdrop-blur-md hover:-translate-y-1"
                  style={{
                    border: `1px solid ${colors.border}`,
                    boxShadow: colors.shadow,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = colors.shadowHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = colors.shadow
                  }}
                  onClick={() => {
                    // Link tıklama takibi - spam koruması için sessionStorage kontrolü
                    const clickKey = `link_click_${social.id}`
                    const lastClick = sessionStorage.getItem(clickKey)
                    const now = Date.now()
                    
                    // Aynı linke son 5 saniye içinde tıklanmışsa sayma (client-side spam koruması)
                    if (lastClick) {
                      const timeDiff = now - parseInt(lastClick)
                      if (timeDiff < 5000) { // 5 saniye
                        return
                      }
                    }
                    
                    // Tıklamayı kaydet
                    sessionStorage.setItem(clickKey, now.toString())
                    
                    // API'ye gönder
                    fetch('/api/analytics/link-click', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        linkId: social.id,
                        linkName: social.name
                      })
                    }).catch(() => {
                      // Sessizce hata yok say
                    })
                  }}
                >
                  <Icon className={`w-5 h-5 ${social.iconColor} flex-shrink-0`} />
                  <span className="text-white font-medium text-sm flex-1">{social.name}</span>
                </a>
              )
            })}
          </div>
        </section>

        {/* Latest Videos Section */}
        {videos && videos.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <span className="w-1 h-4 bg-white rounded-full"></span>
              SON VİDEOLAR
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map((video, index) => {
                // YouTube video ise thumbnail'i otomatik oluştur
                let thumbnailUrl = video.thumbnail
                if (isYouTubeUrl(video.url)) {
                  const videoId = getYouTubeVideoId(video.url)
                  if (videoId) {
                    // Önce maxresdefault'u dene, yoksa hqdefault kullan
                    thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                  }
                }
                
                return (
                  <a
                    key={video.id}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105 glow-red-strong"
                  >
                    <div className="relative w-full h-48">
                      <Image
                        src={thumbnailUrl}
                        alt={video.title}
                        fill
                        priority={index === 0}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          // maxresdefault yoksa hqdefault'a geç
                          if (isYouTubeUrl(video.url)) {
                            const videoId = getYouTubeVideoId(video.url)
                            if (videoId && thumbnailUrl.includes('maxresdefault')) {
                              const target = e.target as HTMLImageElement
                              target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="text-white font-semibold text-lg line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-gray-300 text-sm">{video.date}</p>
                    </div>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center pt-8">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {profile.name}. Tüm hakları saklıdır.
          </p>
        </footer>
      </div>
    </main>
  )
}

