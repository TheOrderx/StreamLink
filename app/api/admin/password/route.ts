import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'links.json')

export async function GET() {
  try {
    const fileContents = fs.readFileSync(dataFilePath, 'utf8')
    const data = JSON.parse(fileContents)
    // Şifreyi güvenlik için döndürmüyoruz, sadece varlığını kontrol ediyoruz
    return NextResponse.json({ hasPassword: !!data.adminPassword })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read data' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { newPassword, currentPassword } = body

    if (!newPassword || newPassword.length < 3) {
      return NextResponse.json(
        { error: 'Yeni şifre en az 3 karakter olmalıdır' },
        { status: 400 }
      )
    }

    // Mevcut veriyi oku
    const fileContents = fs.readFileSync(dataFilePath, 'utf8')
    const data = JSON.parse(fileContents)

    // Mevcut şifreyi kontrol et
    const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'test123'
    const savedPassword = data.adminPassword || envPassword

    if (currentPassword !== savedPassword && currentPassword !== envPassword) {
      return NextResponse.json(
        { error: 'Mevcut şifre hatalı' },
        { status: 401 }
      )
    }

    // Şifreyi güncelle
    data.adminPassword = newPassword

    // Dosyaya kaydet
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8')

    return NextResponse.json({ success: true, message: 'Şifre başarıyla güncellendi' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: 500 }
    )
  }
}

