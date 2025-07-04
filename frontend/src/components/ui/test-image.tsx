'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export function TestImage() {
  const [imageStatus, setImageStatus] = useState<Record<string, string>>({})

  const testImages = [
    { src: '/logo.png', name: 'Logo' },
    { src: '/networks/ethereum.png', name: 'Ethereum' },
    { src: '/features/scan.png', name: 'Scan Feature' },
    { src: '/scanner-preview.png', name: 'Scanner Preview' },
  ]

  useEffect(() => {
    testImages.forEach(({ src, name }) => {
      const img = new window.Image()
      img.onload = () => setImageStatus(prev => ({ ...prev, [name]: '✅ Loaded' }))
      img.onerror = () => setImageStatus(prev => ({ ...prev, [name]: '❌ Failed' }))
      img.src = src
    })
  }, [])

  return (
    <div className="p-4 space-y-4 bg-card border border-border rounded-lg">
      <h3 className="text-lg font-semibold">Image Loading Test</h3>
      
      {/* Status */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Image Status:</p>
        {testImages.map(({ name }) => (
          <div key={name} className="text-sm">
            {name}: {imageStatus[name] || '⏳ Testing...'}
          </div>
        ))}
      </div>
      
      {/* Test with Next.js Image */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Next.js Image Component:</p>
        <Image
          src="/logo.png"
          alt="Test Logo"
          width={64}
          height={64}
          className="border border-border"
        />
      </div>
      
      {/* Test with regular img tag */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Regular img tag:</p>
        <img
          src="/logo.png"
          alt="Test Logo"
          width={64}
          height={64}
          className="border border-border"
        />
      </div>
      
      {/* Test network images */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Network images:</p>
        <div className="flex gap-2">
          <Image
            src="/networks/ethereum.png"
            alt="Ethereum"
            width={32}
            height={32}
            className="border border-border"
          />
          <Image
            src="/networks/polygon.png"
            alt="Polygon"
            width={32}
            height={32}
            className="border border-border"
          />
        </div>
      </div>
      
      {/* Test feature images */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Feature images:</p>
        <div className="flex gap-2">
          <Image
            src="/features/scan.png"
            alt="Scan"
            width={100}
            height={100}
            className="border border-border object-cover"
          />
        </div>
      </div>

      {/* Direct link test */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Direct links (click to test):</p>
        <div className="space-y-1">
          {testImages.map(({ src, name }) => (
            <a 
              key={src}
              href={src} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-sm text-blue-500 hover:underline"
            >
              {name}: {src}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
} 