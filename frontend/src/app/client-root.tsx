'use client'
import { Web3ModalProvider } from '@/components/providers/web3modal-provider'
import { AuthProvider } from '@/components/providers/session-provider'
import { AuthGuard } from '@/components/providers/auth-guard'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { Toaster } from 'sonner'
import { usePathname } from 'next/navigation'
import ClientOnly from '@/components/ClientOnly'

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route))

  return (
    <ClientOnly>
      <AuthProvider>
        <Web3ModalProvider>
          <NotificationProvider>
            {isProtectedRoute ? (
              <AuthGuard>
                {children}
              </AuthGuard>
            ) : (
              children
            )}
            <Toaster position="top-right" />
          </NotificationProvider>
        </Web3ModalProvider>
      </AuthProvider>
    </ClientOnly>
  )
} 