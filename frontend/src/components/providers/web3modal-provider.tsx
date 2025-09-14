'use client'

import { useEffect, useState } from 'react'

interface Web3ModalProviderProps {
  children: React.ReactNode
}

export function Web3ModalProvider({ children }: Web3ModalProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  // For now, just return children without WagmiProvider to avoid errors
  // Web3Modal integration will be completed later
  return <>{children}</>
}
