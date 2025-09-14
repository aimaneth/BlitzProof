"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, User, LogOut, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import { useWeb3Modal } from "@/hooks/use-web3modal"
import { createPortal } from "react-dom"
import { useHydrated } from "@/hooks/use-hydrated"
// Removed AppKit import for now
import { Loader2 } from "lucide-react"

// Navigation items that are always visible
const publicNavigation = [
  { name: "Services", href: "/services" },
  { name: "Scanner", href: "/scanner" },
  { name: "BlockNet", href: "/blocknet" },
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
  const { isConnected, isAuthenticated, isLoading, shortAddress, disconnect, connect } = useWeb3Modal()
  const isHydrated = useHydrated()
  // Removed AppKit hook for now

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
      // Connect wallet using our custom hook
      connect()
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
                className="h-6 w-6 rounded object-cover"
                width={24}
                height={24}
              />
              <span className="text-base font-bold text-foreground">BlitzProof</span>
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
  const [isScrolled, setIsScrolled] = useState(false)
  const { isConnected, isAuthenticated } = useWeb3Modal()
  
  // Show authenticated navigation only when user is connected and authenticated
  const navigation = [
    ...publicNavigation,
    ...(isConnected && isAuthenticated ? authenticatedNavigation : [])
  ]

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled 
          ? "bg-background/70 backdrop-blur-xl border-b border-border/30 shadow-lg shadow-black/5" 
          : "bg-transparent border-b border-transparent"
      )}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4" aria-label="Global">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center">
              <span className="sr-only">BlitzProof</span>
              <div className="flex items-center space-x-2">
                <Image
                  src="/logo.png"
                  alt="BlitzProof Logo"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded object-cover"
                  width={32}
                  height={32}
                  priority
                />
                <span className="text-lg sm:text-xl font-bold text-foreground">BlitzProof</span>
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
              className="h-10 w-10 p-0"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
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