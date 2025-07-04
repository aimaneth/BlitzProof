'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/web3'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { useState, useEffect } from 'react'

interface Web3ProviderProps {
  children: React.ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        retryDelay: 1000,
        staleTime: 30000,
        gcTime: 300000,
      },
    },
  }))

  // Debug wallet detection
  useEffect(() => {
    // Use a timeout to ensure this runs after hydration
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        console.log('🔧 Web3Provider Debug:')
        console.log('- Wagmi config:', config)
        console.log('- QueryClient configured')
        console.log('- RainbowKitProvider initialized')
        
        // Check for common wallet injection issues
        console.log('🔍 Post-initialization wallet check:')
        console.log('- window.ethereum:', window.ethereum)
        console.log('- window.ethereum?.isMetaMask:', window.ethereum?.isMetaMask)
        console.log('- window.ethereum?.providers?.length:', window.ethereum?.providers?.length)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={config.chains[0]}
          showRecentTransactions={false}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 