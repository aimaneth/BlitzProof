'use client'

import { useAccount, useBalance, useDisconnect, useConfig } from "wagmi"
import { useEffect, useState } from "react"
import { apiService } from "@/lib/api"

export function useWallet() {
  // Check if wagmi is properly configured
  let config
  try {
    config = useConfig()
  } catch (error) {
    // WagmiProvider not found, return safe defaults
    return {
      address: undefined,
      isConnected: false,
      isAuthenticated: false,
      isLoading: false,
      error: 'Web3 provider not available',
      shortAddress: '',
      balance: undefined,
      disconnect: () => {},
    }
  }

  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const { disconnect } = useDisconnect()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ""

  // Handle wallet connection and authentication
  useEffect(() => {
    if (isConnected && address) {
      handleAuthentication()
    } else {
      setIsAuthenticated(false)
      setError(null)
      localStorage.removeItem('auth_token')
    }
  }, [isConnected, address])

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
    disconnect()
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