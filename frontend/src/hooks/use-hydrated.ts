'use client'

import { useState, useEffect } from 'react'

export function useHydrated() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Use a small delay to ensure all components are properly mounted
    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  return isHydrated
} 