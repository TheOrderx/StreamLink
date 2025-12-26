import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'links.json')

export async function GET() {
  try {
    const fileContents = fs.readFileSync(dataFilePath, 'utf8')
    const data = JSON.parse(fileContents)
    return NextResponse.json(data)
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
    
    // Validate data structure
    if (!body.socialLinks || !body.videos || !body.profile) {
      return NextResponse.json(
        { error: 'Invalid data structure' },
        { status: 400 }
      )
    }

    // Write to file
    fs.writeFileSync(dataFilePath, JSON.stringify(body, null, 2), 'utf8')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    )
  }
}

