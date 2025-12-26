import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Kick kullanıcı adı gerekli' }, { status: 400 })
  }

  try {
    // Kick API endpoint'lerini dene (farklı versiyonlar)
    let kickApiUrl = `https://kick.com/api/v2/channels/${username}`
    let response = await fetch(kickApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    })
    
    // Eğer v2 çalışmazsa v1'i dene
    if (!response.ok && response.status !== 404) {
      kickApiUrl = `https://kick.com/api/v1/channels/${username}`
      response = await fetch(kickApiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      })
    }

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ 
          error: 'Kick kullanıcısı bulunamadı',
          isLive: false
        }, { status: 404 })
      }
      return NextResponse.json({ 
        error: 'Kick API hatası',
        isLive: false
      }, { status: response.status })
    }

    const data = await response.json()
    
    // Kick API response'unda canlı yayın kontrolü
    // Farklı response formatları olabilir, hepsini kontrol et
    let isLive = false
    
    // 1. livestream objesi var mı ve null değil mi kontrol et
    if (data.livestream && data.livestream !== null) {
      // livestream varsa ve id varsa canlı yayındadır
      if (data.livestream.id) {
        isLive = true
      }
      // veya is_live field'ı varsa
      if (data.livestream.is_live === true) {
        isLive = true
      }
    }
    
    // 2. Direkt is_live field'ı kontrol et
    if (data.is_live === true) {
      isLive = true
    }
    
    // 3. livestreams array'i varsa kontrol et
    if (data.livestreams && Array.isArray(data.livestreams) && data.livestreams.length > 0) {
      const activeStream = data.livestreams.find((stream: any) => stream.is_live === true)
      if (activeStream) {
        isLive = true
      }
    }
    
    // Debug için response'u logla (her zaman - sorun tespiti için)
    console.log('Kick API Response (username:', username, '):', JSON.stringify(data, null, 2))
    console.log('Kick isLive result:', isLive)

    return NextResponse.json({
      isLive: isLive,
      username: username,
      title: data.livestream?.session_title || null,
      viewerCount: data.livestream?.viewer_count || 0
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Kick API\'den veri alınamadı',
      isLive: false
    }, { status: 500 })
  }
}

