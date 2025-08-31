'use client'

import { useState, useEffect } from 'react'

interface ClientOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ClientOnly({ children, fallback }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return fallback ? <>{fallback}</> : <div className="min-h-screen bg-[#0D0E0E]" />
  }

  return <>{children}</>
}
