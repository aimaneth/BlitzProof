"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import { useWallet } from "@/hooks/use-wallet"

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

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isConnected, isAuthenticated } = useWallet()
  
  // Show authenticated navigation only when user is connected and authenticated
  const navigation = [
    ...publicNavigation,
    ...(isConnected && isAuthenticated ? authenticatedNavigation : [])
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Global">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center">
            <span className="sr-only">BlitzProof</span>
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="BlitzProof Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded object-cover"
                width={40}
                height={40}
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
              className="text-sm font-semibold leading-6 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent/50"
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
      
      {/* Mobile menu */}
      <div className={cn("lg:hidden", mobileMenuOpen ? "fixed inset-0 z-50" : "hidden")}>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu panel */}
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-background shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
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
              onClick={() => setMobileMenuOpen(false)}
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
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            {/* Connect Wallet */}
            <div className="mt-8 pt-6 border-t border-border">
              <ConnectWallet />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 