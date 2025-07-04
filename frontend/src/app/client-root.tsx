'use client'
import { Web3Provider } from '@/components/providers/web3-provider'
import { AuthGuard } from '@/components/providers/auth-guard'
import { Toaster } from 'sonner'
import { usePathname } from 'next/navigation'

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/scanner', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route))

  return (
    <Web3Provider>
      {isProtectedRoute ? (
        <AuthGuard>
          {children}
        </AuthGuard>
      ) : (
        children
      )}
      <Toaster position="top-right" />
    </Web3Provider>
  )
} 