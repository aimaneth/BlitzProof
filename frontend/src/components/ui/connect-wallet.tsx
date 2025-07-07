"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useWallet } from "@/hooks/use-wallet"
import { useHydrated } from "@/hooks/use-hydrated"
import { Button } from "./button"
import { Loader2, User, LogOut } from "lucide-react"
import { useEffect } from "react"

export function ConnectWallet() {
  const { isConnected, isAuthenticated, isLoading, shortAddress, disconnect } = useWallet()
  const isHydrated = useHydrated()

  // Debug MetaMask detection
  useEffect(() => {
    // Only run after hydration to prevent hydration mismatches
    if (!isHydrated) return
    
    if (typeof window !== 'undefined') {
      console.log('🔍 Checking MetaMask availability...')
      console.log('window.ethereum:', window.ethereum)
      console.log('window.ethereum?.isMetaMask:', window.ethereum?.isMetaMask)
      console.log('window.ethereum?.providers:', window.ethereum?.providers)
      
      // Check for MetaMask in different ways
      const hasMetaMask = window.ethereum?.isMetaMask
      const hasProviders = window.ethereum?.providers?.length > 0
      const hasMetaMaskInProviders = window.ethereum?.providers?.some((p: any) => p.isMetaMask)
      
      console.log('MetaMask detection results:')
      console.log('- Direct detection:', hasMetaMask)
      console.log('- Has providers:', hasProviders)
      console.log('- MetaMask in providers:', hasMetaMaskInProviders)
      
      if (window.ethereum?.providers) {
        const metamaskProvider = window.ethereum.providers.find(
          (provider: any) => provider.isMetaMask
        )
        console.log('MetaMask provider found:', metamaskProvider)
      }
      
      // Check if MetaMask is available but not detected
      if (!hasMetaMask && !hasMetaMaskInProviders) {
        console.warn('⚠️ MetaMask not detected! Please ensure:')
        console.warn('1. MetaMask extension is installed')
        console.warn('2. MetaMask is unlocked')
        console.warn('3. You are on a supported network')
        console.warn('4. No other wallet extensions are interfering')
        
        // Try to detect MetaMask in other ways
        const allProviders = window.ethereum?.providers || []
        console.log('All available providers:', allProviders.map((p: any) => ({
          name: p.name || 'Unknown',
          isMetaMask: p.isMetaMask,
          isWalletConnect: p.isWalletConnect,
          isCoinbaseWallet: p.isCoinbaseWallet
        })))
      } else {
        console.log('✅ MetaMask detected successfully!')
      }
    }
  }, [isHydrated])

  if (!isHydrated) {
    return (
      <Button variant="outline" disabled className="h-9 px-3 text-sm">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="h-9 px-3 text-sm">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Connecting...
      </Button>
    )
  }

  if (isConnected && isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg min-w-0">
          <User className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium truncate max-w-20 sm:max-w-32">{shortAddress}</span>
          <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0"></div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={disconnect}
          className="h-9 px-2 sm:px-3"
          aria-label="Disconnect wallet"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Disconnect</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="[&_.rainbow-kit-connect]:!h-9 [&_.rainbow-kit-connect]:!px-3 [&_.rainbow-kit-connect]:!text-sm [&_.rainbow-kit-connect]:!justify-center [&_.rainbow-kit-connect]:!items-center [&_.rainbow-kit-connect]:!w-full [&_.rainbow-kit-connect]:!flex">
      {(() => {
        console.log('🔧 ConnectWallet render debug:', {
          isHydrated,
          isConnected,
          isAuthenticated,
          isLoading,
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR'
        })
        return <ConnectButton />
      })()}
    </div>
  )
} 