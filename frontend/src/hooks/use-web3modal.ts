'use client'

import { useEffect, useState } from 'react'
import { apiService } from '@/lib/api'

export function useWeb3Modal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [isConnected, setIsConnected] = useState(false)
  const [balance, setBalance] = useState<any>(undefined)

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ""

  // Handle authentication
  useEffect(() => {
    // For now, return safe defaults until Web3Modal is fully integrated
    setIsAuthenticated(false)
    setError('Web3Modal integration in progress')
  }, [])

  const handleAuthentication = async () => {
    if (!address) return

    try {
      setIsLoading(true)
      setError(null)
      
      // Check if user already has a valid token
      const existingToken = localStorage.getItem('auth_token')
      if (existingToken) {
        try {
          await apiService.getProfile()
          setIsAuthenticated(true)
          return
        } catch {
          localStorage.removeItem('auth_token')
        }
      }

      // Register new user
      const response = await apiService.registerUser(address)
      if (response.token) {
        localStorage.setItem('auth_token', response.token)
        setIsAuthenticated(true)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      setError(errorMessage)
      setIsAuthenticated(false)
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    localStorage.removeItem('auth_token')
    setIsAuthenticated(false)
    setError(null)
    setAddress(undefined)
    setIsConnected(false)
    setBalance(undefined)
  }

  return {
    address,
    isConnected,
    isAuthenticated,
    isLoading,
    error,
    shortAddress,
    balance,
    disconnect: handleDisconnect,
  }
}
