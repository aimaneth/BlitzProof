"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, User, LogOut, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import { useWallet } from "@/hooks/use-wallet"
import { createPortal } from "react-dom"
import { useHydrated } from "@/hooks/use-hydrated"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { Loader2 } from "lucide-react"

// Navigation items that are always visible
const publicNavigation = [
  { name: "Services", href: "/services" },
  { name: "Scanner", href: "/scanner" },
]

// Navigation items that require authentication
const authenticatedNavigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Profile", href: "/profile" },
]

// Mobile Menu Component
function MobileMenu({ 
  isOpen, 
  onClose, 
  navigation 
}: { 
  isOpen: boolean
  onClose: () => void
  navigation: typeof publicNavigation
}) {
  const { isConnected, isAuthenticated, isLoading, shortAddress, disconnect } = useWallet()
  const isHydrated = useHydrated()
  const { openConnectModal } = useConnectModal()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Custom mobile wallet component
  const MobileWalletConnect = () => {
    const handleConnect = () => {
      if (isHydrated && openConnectModal) {
        openConnectModal()
      }
    }

    if (!isHydrated) {
      return (
        <div className="bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted/30 rounded-full flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Loading...</p>
              <p className="text-xs text-muted-foreground/70">Initializing wallet</p>
            </div>
          </div>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Connecting...</p>
              <p className="text-xs text-muted-foreground">Please approve in your wallet</p>
            </div>
          </div>
        </div>
      )
    }

    if (isConnected && isAuthenticated) {
      return (
        <div className="space-y-4">
          {/* Connected Status Card */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Wallet Connected</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{shortAddress}</p>
              </div>
            </div>
          </div>
          
          {/* Disconnect Button */}
          <Button 
            variant="outline" 
            onClick={disconnect}
            className="w-full h-11 bg-background/50 border-border/50 hover:bg-background hover:border-border"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect Wallet
          </Button>
        </div>
      )
    }

    return (
      <Button 
        onClick={handleConnect}
        disabled={!isHydrated}
        className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/25 disabled:opacity-50"
      >
        <Wallet className="h-4 w-4 mr-2" />
        {isHydrated ? 'Connect Wallet' : 'Loading...'}
      </Button>
    )
  }

  if (!isOpen) return null

  const menuContent = (
    <div className="fixed inset-0 z-[999999] lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Menu panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-background shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link href="/" className="flex items-center" onClick={onClose}>
            <span className="sr-only">BlitzProof</span>
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="BlitzProof Logo"
                className="h-8 w-8 rounded object-cover"
                width={32}
                height={32}
              />
              <span className="text-lg font-bold text-foreground">BlitzProof</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 p-0"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        
        <div className="px-4 py-6">
          {/* Navigation Links */}
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={onClose}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Connect Wallet */}
          <div className="mt-8 pt-6 border-t border-border">
            <MobileWalletConnect />
          </div>
        </div>
      </div>
    </div>
  )

  // Render to document.body to avoid stacking context issues
  if (typeof window !== 'undefined') {
    return createPortal(menuContent, document.body)
  }

  return menuContent
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isConnected, isAuthenticated } = useWallet()
  
  // Show authenticated navigation only when user is connected and authenticated
  const navigation = [
    ...publicNavigation,
    ...(isConnected && isAuthenticated ? authenticatedNavigation : [])
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-6" aria-label="Global">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center">
              <span className="sr-only">BlitzProof</span>
              <div className="flex items-center space-x-2">
                <Image
                  src="/logo.png"
                  alt="BlitzProof Logo"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded object-cover"
                  width={48}
                  height={48}
                  priority
                />
                <span className="text-xl sm:text-2xl font-bold text-foreground">BlitzProof</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-semibold leading-6 text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-md hover:bg-accent/50"
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Desktop Connect Wallet */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <ConnectWallet />
          </div>
          
          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 p-0"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu - Rendered outside header */}
      <MobileMenu 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navigation={navigation}
      />
    </>
  )
} 