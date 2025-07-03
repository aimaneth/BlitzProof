'use client'
import { Web3Provider } from '@/components/providers/web3-provider'
import { AuthGuard } from '@/components/providers/auth-guard'
import { Toaster } from 'sonner'

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <AuthGuard>
        {children}
      </AuthGuard>
      <Toaster position="top-right" />
    </Web3Provider>
  )
} 