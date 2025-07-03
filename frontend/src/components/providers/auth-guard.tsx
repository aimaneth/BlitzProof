'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@/hooks/use-wallet'
import { Shield } from 'lucide-react'
import { ConnectWallet } from '@/components/ui/connect-wallet'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const protectedRoutes = ['/dashboard']

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isConnected } = useWallet()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simple check: if wallet is connected, allow access
    setIsLoading(false)
  }, [isConnected])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show fallback if wallet not connected
  if (!isConnected) {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to access this page.
          </p>
          <ConnectWallet />
        </div>
      </div>
    )
  }

  return <>{children}</>
} 