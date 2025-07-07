"use client"

import { useEffect, useState } from "react"
import { Button } from "./button"
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"

export function WalletDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = {
        // Environment
        environment: process.env.NEXT_PUBLIC_APP_ENVIRONMENT,
        domain: window.location.origin,
        protocol: window.location.protocol,
        isSecure: window.location.protocol === 'https:',
        
        // WalletConnect
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID 
          ? `${process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.slice(0, 8)}...` 
          : 'NOT SET',
        walletConnectProjectIdFull: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'NOT SET',
        
        // Browser
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        isChrome: /chrome/i.test(navigator.userAgent),
        
        // Ethereum
        hasEthereum: !!(window as any).ethereum,
        ethereumIsMetaMask: (window as any).ethereum?.isMetaMask,
        ethereumProviders: (window as any).ethereum?.providers?.length || 0,
        
        // RainbowKit/Wagmi
        wagmiConfig: typeof window !== 'undefined' ? 'Available' : 'SSR',
        
        // Timestamp
        timestamp: new Date().toISOString()
      }
      
      setDebugInfo(info)
    }
  }, [])

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Debug Wallet
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-y-auto bg-background/95 backdrop-blur border border-border rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Wallet Debug Info</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3 text-xs">
        {/* Environment */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Info className="h-3 w-3" />
            <span className="font-medium">Environment</span>
          </div>
          <div className="pl-5 space-y-1">
            <div>Domain: {debugInfo.domain}</div>
            <div>Protocol: {debugInfo.protocol}</div>
            <div>Secure: {debugInfo.isSecure ? '✅' : '❌'}</div>
            <div>Environment: {debugInfo.environment}</div>
          </div>
        </div>

        {/* WalletConnect */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {debugInfo.walletConnectProjectId !== 'NOT SET' ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <XCircle className="h-3 w-3 text-red-500" />
            )}
            <span className="font-medium">WalletConnect</span>
          </div>
          <div className="pl-5 space-y-1">
            <div>Project ID: {debugInfo.walletConnectProjectId}</div>
            <div className="text-xs text-muted-foreground">Full ID: {debugInfo.walletConnectProjectIdFull}</div>
            {debugInfo.walletConnectProjectId === 'NOT SET' && (
              <div className="text-red-500 text-xs">
                ❌ Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to Vercel environment
              </div>
            )}
          </div>
        </div>

        {/* Browser */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Info className="h-3 w-3" />
            <span className="font-medium">Browser</span>
          </div>
          <div className="pl-5 space-y-1">
            <div>Mobile: {debugInfo.isMobile ? '✅' : '❌'}</div>
            <div>Safari: {debugInfo.isSafari ? '✅' : '❌'}</div>
            <div>Chrome: {debugInfo.isChrome ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* Ethereum */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {debugInfo.hasEthereum ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <XCircle className="h-3 w-3 text-red-500" />
            )}
            <span className="font-medium">Ethereum</span>
          </div>
          <div className="pl-5 space-y-1">
            <div>Available: {debugInfo.hasEthereum ? '✅' : '❌'}</div>
            <div>MetaMask: {debugInfo.ethereumIsMetaMask ? '✅' : '❌'}</div>
            <div>Providers: {debugInfo.ethereumProviders}</div>
          </div>
        </div>

        {/* Mobile Issues */}
        {debugInfo.isMobile && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              <span className="font-medium">Mobile Issues</span>
            </div>
            <div className="pl-5 space-y-1 text-xs text-yellow-600">
              <div>• MetaMask doesn't work as browser extension on mobile</div>
              <div>• Need WalletConnect with mobile wallet apps</div>
              <div>• Check WalletConnect allowed origins</div>
            </div>
          </div>
        )}

        {/* Solutions */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Info className="h-3 w-3 text-blue-500" />
            <span className="font-medium">Solutions</span>
          </div>
          <div className="pl-5 space-y-1 text-xs text-blue-600">
            <div>1. Go to https://cloud.walletconnect.com</div>
            <div>2. Find project: {debugInfo.walletConnectProjectIdFull}</div>
            <div>3. Add {debugInfo.domain} to allowed origins</div>
            <div>4. Use mobile wallet apps (MetaMask, Trust, etc.)</div>
          </div>
        </div>
      </div>
    </div>
  )
} 