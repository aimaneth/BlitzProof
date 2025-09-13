'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { createWeb3Config } from '@/lib/web3'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { useState, useMemo, useEffect } from 'react'

interface Web3ClientProviderProps {
  children: React.ReactNode
}

export function Web3ClientProvider({ children }: Web3ClientProviderProps) {
  const [mounted, setMounted] = useState(false)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30000,
      },
    },
  }))

  // Use useMemo to create config only once and avoid hydration issues
  const config = useMemo(() => createWeb3Config(), [])

  // Prevent hydration issues by only rendering after mount with delay
  useEffect(() => {
    // Add a small delay to ensure hydration is completely finished
    const timer = setTimeout(() => {
      setMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Don't render Web3 providers until mounted to prevent hydration issues
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
