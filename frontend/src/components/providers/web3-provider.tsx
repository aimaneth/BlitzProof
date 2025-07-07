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

  const [isClient, setIsClient] = useState(false)

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Debug wallet detection
  useEffect(() => {
    if (!isClient) return
    
    // Use a timeout to ensure this runs after hydration
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        console.log('🔧 Web3Provider Debug:')
        console.log('- Wagmi config:', config)
        console.log('- QueryClient configured')
        console.log('- RainbowKitProvider initialized')
        
        // Safari-specific debugging
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        console.log('🌐 Browser detection:', {
          isSafari,
          isMobile,
          userAgent: navigator.userAgent,
          platform: navigator.platform
        })
        
        // Check for common wallet injection issues
        console.log('🔍 Post-initialization wallet check:')
        console.log('- window.ethereum:', window.ethereum)
        console.log('- window.ethereum?.isMetaMask:', window.ethereum?.isMetaMask)
        console.log('- window.ethereum?.providers?.length:', window.ethereum?.providers?.length)
        
        // Check WalletConnect configuration
        const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
        console.log('🔗 WalletConnect config:', {
          projectId: walletConnectProjectId ? walletConnectProjectId.slice(0, 8) + '...' : 'NOT SET',
          domain: window.location.origin,
          isSecure: window.location.protocol === 'https:'
        })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isClient])

  // Show loading state during SSR to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing Web3...</p>
        </div>
      </div>
    )
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={config.chains[0]}
          showRecentTransactions={false}
          locale="en-US"
          // Mobile-specific configuration
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 