import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Check if public directory exists
    const publicDir = path.join(process.cwd(), 'public')
    const publicExists = await fs.access(publicDir).then(() => true).catch(() => false)
    
    // Check if specific images exist
    const images = [
      'logo.png',
      'networks/ethereum.png',
      'features/scan.png',
      'scanner-preview.png'
    ]
    
    const imageStatus = await Promise.all(
      images.map(async (imagePath) => {
        const fullPath = path.join(publicDir, imagePath)
        const exists = await fs.access(fullPath).then(() => true).catch(() => false)
        return { path: imagePath, exists }
      })
    )
    
    return NextResponse.json({
      publicDirExists: publicExists,
      publicDir: publicDir,
      images: imageStatus,
      cwd: process.cwd()
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      cwd: process.cwd()
    }, { status: 500 })
  }
} 