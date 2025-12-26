import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 300 // 5 dakika cache

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const channelId = searchParams.get('channelId')

  if (!channelId) {
    return NextResponse.json({ error: 'Kanal ID gerekli' }, { status: 400 })
  }

  try {
    // YouTube kanal canlı yayın sayfasına istek at
    const livePageUrl = `https://www.youtube.com/channel/${channelId}/live`
    
    const response = await fetch(livePageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    })

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'YouTube sayfasına erişilemedi',
        isLive: false
      }, { status: response.status })
    }

    const html = await response.text()
    
    // 1. HTML içinde "isLive":true kontrolü
    const hasIsLiveTrue = /"isLive"\s*:\s*true/.test(html)
    
    // 2. Canonical link kontrolü - canlı yayındaysa /watch?v= içerir
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
    const hasWatchUrl = canonicalMatch ? canonicalMatch[1].includes('/watch?v=') : false
    
    // 3. URL yönlendirme kontrolü - canlı yayındaysa URL videoya yönlendirilir
    const finalUrl = response.url
    const isRedirectedToVideo = finalUrl.includes('/watch?v=')
    
    // 4. HTML içinde canlı yayın göstergeleri
    const hasLiveIndicators = 
      /LIVE NOW/i.test(html) ||
      /Canlı Yayın/i.test(html) ||
      /CANLI/i.test(html) ||
      /🔴/.test(html) ||
      /BADGE_STYLE_TYPE_LIVE_NOW/.test(html) ||
      /"liveBroadcastContent"\s*:\s*"live"/.test(html) ||
      /"isLiveContent"\s*:\s*true/.test(html) ||
      /"isLiveNow"\s*:\s*true/.test(html) ||
      /"concurrentViewers"/.test(html) ||
      /"liveChatRenderer"/.test(html) ||
      /"watching"/i.test(html) ||
      /izleniyor/i.test(html)
    
    // Canlı yayın kontrolü: Herhangi biri true ise canlı yayında
    const isLive = hasIsLiveTrue || hasWatchUrl || isRedirectedToVideo || hasLiveIndicators
    
    // Video ID'yi bul (varsa)
    let videoId = null
    if (isLive) {
      const videoIdMatch = html.match(/watch\?v=([a-zA-Z0-9_-]{11})/) || 
                          html.match(/"videoId"\s*:\s*"([^"]{11})"/)
      if (videoIdMatch) {
        videoId = videoIdMatch[1]
      }
    }

    return NextResponse.json({
      isLive,
      videoId,
      checkedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Live status kontrolü hatası:', error.message)
    return NextResponse.json({ 
      error: error.message || 'Canlı yayın durumu kontrol edilemedi',
      isLive: false
    }, { status: 500 })
  }
}

