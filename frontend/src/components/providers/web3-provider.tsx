'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

interface Web3ProviderProps {
  children: React.ReactNode
}

// Dynamically import the Web3 client provider to avoid SSR issues
const Web3ClientProvider = dynamic(
  () => import('./web3-client-provider').then(mod => ({ default: mod.Web3ClientProvider })),
  {
    ssr: false,
    loading: () => null,
  }
)

export function Web3Provider({ children }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>
  }

  return (
    <Web3ClientProvider>
      {children}
    </Web3ClientProvider>
  )
} 