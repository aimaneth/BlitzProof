"use client"

import Link from "next/link"
import Image from "next/image"
import { useWeb3Modal } from "@/hooks/use-web3modal"

export function Footer() {
  const { isConnected, isAuthenticated } = useWeb3Modal()
  
  // Show authenticated links only when user is connected and authenticated
  const showAuthenticatedLinks = isConnected && isAuthenticated
  
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="BlitzProof Logo"
              className="h-6 w-6 rounded object-cover"
              width={24}
              height={24}
            />
            <span className="text-sm font-medium text-foreground">BlitzProof</span>
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link href="/scanner" className="hover:text-foreground transition-colors">
              Scanner
            </Link>
            <Link href="/services" className="hover:text-foreground transition-colors">
              Services
            </Link>
            {showAuthenticatedLinks && (
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BlitzProof Security
          </p>
        </div>
      </div>
    </footer>
  )
} 