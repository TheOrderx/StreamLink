import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID gerekli' }, { status: 400 })
  }

  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    return NextResponse.json({ 
      error: 'YouTube API key bulunamadı. Lütfen .env.local dosyasına YOUTUBE_API_KEY ekleyin.' 
    }, { status: 500 })
  }

  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`YouTube API hatası: ${response.status} - ${errorData.error?.message || 'Bilinmeyen hata'}`)
    }

    const data = await response.json()

    // YouTube API hata kontrolü
    if (data.error) {
      return NextResponse.json({ 
        error: data.error.message || 'YouTube API hatası' 
      }, { status: 500 })
    }

    if (data.items && data.items.length > 0) {
      const video = data.items[0]
      const publishedAt = video.snippet.publishedAt
      
      // Tarihi Türkçe formatına çevir
      const date = new Date(publishedAt)
      const formattedDate = date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      return NextResponse.json({
        publishedAt: publishedAt,
        formattedDate: formattedDate,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url
      })
    } else {
      return NextResponse.json({ error: 'Video bulunamadı' }, { status: 404 })
    }
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'YouTube API\'den veri alınamadı' 
    }, { status: 500 })
  }
}

