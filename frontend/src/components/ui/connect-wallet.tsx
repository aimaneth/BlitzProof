"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useWallet } from "@/hooks/use-wallet"
import { useHydrated } from "@/hooks/use-hydrated"
import { Button } from "./button"
import { Loader2, User, LogOut } from "lucide-react"

export function ConnectWallet() {
  const { isConnected, isAuthenticated, isLoading, shortAddress, disconnect } = useWallet()
  const isHydrated = useHydrated()

  // Show loading state during hydration to prevent mismatch
  if (!isHydrated) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Connecting...
      </Button>
    )
  }

  if (isConnected && isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
          <User className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{shortAddress}</span>
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
        </div>
        <Button variant="outline" size="sm" onClick={disconnect}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return <ConnectButton />
} 