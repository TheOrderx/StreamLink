import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const analyticsFilePath = path.join(process.cwd(), 'data', 'analytics.json')

interface ViewRecord {
  timestamp: number
  ip?: string
  userAgent?: string
}

interface AnalyticsData {
  views: ViewRecord[]
}

function getAnalyticsData(): AnalyticsData {
  try {
    if (fs.existsSync(analyticsFilePath)) {
      const fileContents = fs.readFileSync(analyticsFilePath, 'utf8')
      return JSON.parse(fileContents)
    }
  } catch (error) {
    // Dosya yoksa veya hata varsa boş veri döndür
  }
  return { views: [] }
}

function saveAnalyticsData(data: AnalyticsData) {
  try {
    // Eski kayıtları temizle (30 günden eski kayıtları sil)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const filteredViews = data.views.filter(view => view.timestamp > thirtyDaysAgo)
    
    const analyticsData: AnalyticsData = {
      views: filteredViews
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
    const analyticsData = getAnalyticsData()
    
    // IP adresini al
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // User-Agent'ı al
    const userAgent = request.headers.get('user-agent') || ''
    
    // Bot/crawler kontrolü (basit filtreleme)
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
      /baiduspider/i, /yandexbot/i, /sogou/i, /exabot/i,
      /facebot/i, /ia_archiver/i, /curl/i, /wget/i,
      /python/i, /java/i, /node/i, /postman/i
    ]
    
    const isBot = botPatterns.some(pattern => pattern.test(userAgent))
    
    // Bot isteklerini sayma
    if (isBot && userAgent !== '') {
      return NextResponse.json({ success: true, skipped: true, reason: 'bot' })
    }
    
    // Aynı IP'den son 5 dakika içinde kayıt var mı kontrol et
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    const recentViewFromSameIP = analyticsData.views.find(
      view => view.ip === ip && view.timestamp > fiveMinutesAgo
    )
    
    // Aynı IP'den son 5 dakika içinde kayıt varsa, yeni kayıt oluşturma
    if (recentViewFromSameIP) {
      return NextResponse.json({ 
        success: true, 
        skipped: true, 
        reason: 'duplicate',
        lastView: recentViewFromSameIP.timestamp
      })
    }
    
    // Yeni görüntülenme kaydı ekle
    const viewRecord: ViewRecord = {
      timestamp: Date.now(),
      ip: ip,
      userAgent: userAgent
    }
    
    analyticsData.views.push(viewRecord)
    
    // Veriyi kaydet
    saveAnalyticsData(analyticsData)
    
    return NextResponse.json({ success: true, tracked: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to track view' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const analyticsData = getAnalyticsData()
    
    // Son 24 saatteki görüntülenmeleri filtrele
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)
    const recentViews = analyticsData.views.filter(view => view.timestamp > twentyFourHoursAgo)
    
    // Son 7 günlük görüntülenmeleri de hesapla
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const last7DaysViews = analyticsData.views.filter(view => view.timestamp > sevenDaysAgo)
    
    // Son 30 günlük görüntülenmeleri de hesapla
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const last30DaysViews = analyticsData.views.filter(view => view.timestamp > thirtyDaysAgo)
    
    // Saatlik dağılım (son 24 saat)
    const hourlyViews: Record<number, number> = {}
    recentViews.forEach(view => {
      const date = new Date(view.timestamp)
      const hour = date.getHours()
      hourlyViews[hour] = (hourlyViews[hour] || 0) + 1
    })
    
    return NextResponse.json({
      last24Hours: recentViews.length,
      last7Days: last7DaysViews.length,
      last30Days: last30DaysViews.length,
      total: analyticsData.views.length,
      hourlyViews,
      recentViews: recentViews.slice(-100) // Son 100 görüntülenme
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get analytics' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Boş analytics verisi oluştur (linkClicks'i de koru)
    const currentData = getAnalyticsData()
    const emptyData: any = {
      views: [],
      linkClicks: currentData.linkClicks || [] // Link tıklamalarını koru
    }
    
    // data klasörü yoksa oluştur
    const dataDir = path.dirname(analyticsFilePath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    // Dosyaya boş veriyi yaz
    fs.writeFileSync(analyticsFilePath, JSON.stringify(emptyData, null, 2), 'utf8')
    
    return NextResponse.json({ success: true, message: 'Görüntülenme istatistikleri başarıyla sıfırlandı' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to reset analytics' },
      { status: 500 }
    )
  }
}

