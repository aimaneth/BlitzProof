'use client'

import Image from 'next/image'

export function TestImage() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Image Loading Test</h3>
      
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
    </div>
  )
} 