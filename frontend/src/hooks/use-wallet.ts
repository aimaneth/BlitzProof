'use client'

import { useEffect, useState } from "react"
import { apiService } from "@/lib/api"

export function useWallet() {
  // Always call hooks at the top level - no conditional calls
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [isConnected, setIsConnected] = useState(false)
  const [balance, setBalance] = useState<any>(undefined)

  // Safe defaults - no wagmi integration
  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ""

  const disconnect = () => {
    localStorage.removeItem('auth_token')
    setIsAuthenticated(false)
    setError(null)
    setAddress(undefined)
    setIsConnected(false)
    setBalance(undefined)
  }

  // Handle wallet connection and authentication
  useEffect(() => {
    // For now, just return safe defaults
    // Web3 integration can be added later when needed
    setIsAuthenticated(false)
    setError('Web3 provider not available')
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

  return {
    address,
    isConnected,
    isAuthenticated,
    isLoading,
    error,
    shortAddress,
    balance,
    disconnect,
  }
} 