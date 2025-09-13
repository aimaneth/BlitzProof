'use client'

import dynamic from 'next/dynamic'

interface Web3ProviderProps {
  children: React.ReactNode
}

// Dynamically import the Web3 client provider to avoid SSR issues
const Web3ClientProvider = dynamic(
  () => import('./web3-client-provider').then(mod => ({ default: mod.Web3ClientProvider })),
  {
    ssr: false,
    loading: () => null,
  }
)

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <Web3ClientProvider>
      {children}
    </Web3ClientProvider>
  )
} 