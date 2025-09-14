"use client"

// Removed RainbowKit ConnectButton to fix wagmi errors
import { useWallet } from "@/hooks/use-wallet"
import { Button } from "./button"
import { Loader2, User, LogOut } from "lucide-react"

export function ConnectWallet() {
  const { isConnected, isAuthenticated, isLoading, shortAddress, disconnect } = useWallet()

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
    <Button 
      variant="outline" 
      onClick={() => console.log('Connect wallet clicked - wagmi integration removed')}
      className="h-9 px-3 text-sm"
    >
      Connect Wallet
    </Button>
  )
} 