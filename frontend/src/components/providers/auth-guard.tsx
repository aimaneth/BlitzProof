'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/hooks/use-wallet"
import { Shield } from 'lucide-react'
import { ConnectWallet } from '@/components/ui/connect-wallet'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isConnected } = useWallet()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !isConnected) {
      router.push("/")
    }
  }, [isConnected, router, isClient])

  // Show loading state during SSR/hydration to prevent mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Loading...
          </h2>
          <p className="text-muted-foreground mb-6">
            Initializing authentication...
          </p>
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