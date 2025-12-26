import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const analyticsFilePath = path.join(process.cwd(), 'data', 'analytics.json')

interface LinkClickRecord {
  linkId: number
  linkName: string
  timestamp: number
  ip?: string
}

interface AnalyticsData {
  views: any[]
  linkClicks: LinkClickRecord[]
}

function getAnalyticsData(): AnalyticsData {
  try {
    if (fs.existsSync(analyticsFilePath)) {
      const fileContents = fs.readFileSync(analyticsFilePath, 'utf8')
      const data = JSON.parse(fileContents)
      return {
        views: data.views || [],
        linkClicks: data.linkClicks || []
      }
    }
  } catch (error) {
    // Dosya yoksa veya hata varsa boş veri döndür
  }
  return { views: [], linkClicks: [] }
}

function saveAnalyticsData(data: AnalyticsData) {
  try {
    // Eski kayıtları temizle (30 günden eski kayıtları sil)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const filteredLinkClicks = data.linkClicks.filter(click => click.timestamp > thirtyDaysAgo)
    
    const analyticsData: AnalyticsData = {
      views: data.views,
      linkClicks: filteredLinkClicks
    }
    
    // data klasörü yoksa oluştur
    const dataDir = path.dirname(analyticsFilePath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    fs.writeFileSync(analyticsFilePath, JSON.stringify(analyticsData, null, 2), 'utf8')
  } catch (error) {
    console.error('Analytics verisi kaydedilemedi:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { linkId, linkName } = body

    if (!linkId || !linkName) {
      return NextResponse.json(
        { error: 'linkId ve linkName gerekli' },
        { status: 400 }
      )
    }

    const analyticsData = getAnalyticsData()
    
    // IP adresini al
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // User-Agent'ı al
    const userAgent = request.headers.get('user-agent') || ''
    
    // Bot/crawler kontrolü (spam koruması)
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
      /baiduspider/i, /yandexbot/i, /sogou/i, /exabot/i,
      /facebot/i, /ia_archiver/i, /curl/i, /wget/i,
      /python/i, /java/i, /node/i, /postman/i,
      /headless/i, /phantom/i, /selenium/i, /puppeteer/i
    ]
    
    const isBot = botPatterns.some(pattern => pattern.test(userAgent))
    
    // Bot isteklerini sayma
    if (isBot && userAgent !== '') {
      return NextResponse.json({ success: true, skipped: true, reason: 'bot' })
    }
    
    // Spam koruması: Aynı IP'den aynı linke son 10 saniye içinde tıklama var mı?
    const tenSecondsAgo = Date.now() - (10 * 1000)
    const recentClickFromSameIP = analyticsData.linkClicks.find(
      click => click.ip === ip && 
               click.linkId === linkId && 
               click.timestamp > tenSecondsAgo
    )
    
    // Aynı IP'den aynı linke son 10 saniye içinde tıklama varsa, yeni kayıt oluşturma
    if (recentClickFromSameIP) {
      return NextResponse.json({ 
        success: true, 
        skipped: true, 
        reason: 'spam_protection',
        lastClick: recentClickFromSameIP.timestamp
      })
    }
    
    // Spam koruması: Aynı IP'den son 1 dakika içinde 10'dan fazla farklı linke tıklama var mı?
    const oneMinuteAgo = Date.now() - (60 * 1000)
    const recentClicksFromSameIP = analyticsData.linkClicks.filter(
      click => click.ip === ip && click.timestamp > oneMinuteAgo
    )
    
    // Son 1 dakikada 10'dan fazla tıklama varsa spam olarak kabul et
    if (recentClicksFromSameIP.length >= 10) {
      return NextResponse.json({ 
        success: true, 
        skipped: true, 
        reason: 'rate_limit_exceeded',
        clicksInLastMinute: recentClicksFromSameIP.length
      })
    }
    
    // Yeni tıklama kaydı ekle
    const clickRecord: LinkClickRecord = {
      linkId: linkId,
      linkName: linkName,
      timestamp: Date.now(),
      ip: ip
    }
    
    analyticsData.linkClicks.push(clickRecord)
    
    // Veriyi kaydet
    saveAnalyticsData(analyticsData)
    
    return NextResponse.json({ success: true, tracked: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to track link click' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const analyticsData = getAnalyticsData()
    
    // Son 24 saatteki tıklamaları filtrele
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)
    const recentClicks = analyticsData.linkClicks.filter(click => click.timestamp > twentyFourHoursAgo)
    
    // Son 7 günlük tıklamaları filtrele
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const last7DaysClicks = analyticsData.linkClicks.filter(click => click.timestamp > sevenDaysAgo)
    
    // Son 30 günlük tıklamaları filtrele
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const last30DaysClicks = analyticsData.linkClicks.filter(click => click.timestamp > thirtyDaysAgo)
    
    // Link bazında tıklama sayılarını hesapla (tüm zamanlar)
    const linkClickCounts: Record<number, { name: string; count: number }> = {}
    analyticsData.linkClicks.forEach(click => {
      if (!linkClickCounts[click.linkId]) {
        linkClickCounts[click.linkId] = { name: click.linkName, count: 0 }
      }
      linkClickCounts[click.linkId].count++
    })
    
    // Son 24 saat için link bazında tıklama sayıları
    const linkClickCounts24h: Record<number, { name: string; count: number }> = {}
    recentClicks.forEach(click => {
      if (!linkClickCounts24h[click.linkId]) {
        linkClickCounts24h[click.linkId] = { name: click.linkName, count: 0 }
      }
      linkClickCounts24h[click.linkId].count++
    })
    
    // En çok tıklanan linkleri sırala (tüm zamanlar)
    const topLinks = Object.entries(linkClickCounts)
      .map(([linkId, data]) => ({
        linkId: parseInt(linkId),
        name: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // İlk 10 link
    
    // En çok tıklanan linkleri sırala (son 24 saat)
    const topLinks24h = Object.entries(linkClickCounts24h)
      .map(([linkId, data]) => ({
        linkId: parseInt(linkId),
        name: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // İlk 10 link
    
    return NextResponse.json({
      last24Hours: recentClicks.length,
      last7Days: last7DaysClicks.length,
      last30Days: last30DaysClicks.length,
      total: analyticsData.linkClicks.length,
      topLinks,
      topLinks24h
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get link click analytics' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const analyticsData = getAnalyticsData()
    
    // Link tıklamalarını sıfırla, görüntülenmeleri koru
    const resetData: AnalyticsData = {
      views: analyticsData.views || [],
      linkClicks: []
    }
    
    // data klasörü yoksa oluştur
    const dataDir = path.dirname(analyticsFilePath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    // Dosyaya sıfırlanmış veriyi yaz
    fs.writeFileSync(analyticsFilePath, JSON.stringify(resetData, null, 2), 'utf8')
    
    return NextResponse.json({ success: true, message: 'Link tıklama istatistikleri başarıyla sıfırlandı' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to reset link click analytics' },
      { status: 500 }
    )
  }
}

