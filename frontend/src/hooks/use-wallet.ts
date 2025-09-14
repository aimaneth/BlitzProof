'use client'

import { useAccount, useBalance, useDisconnect, useConfig } from "wagmi"
import { useEffect, useState } from "react"
import { apiService } from "@/lib/api"

export function useWallet() {
  // Always call hooks at the top level
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wagmiAvailable, setWagmiAvailable] = useState(false)

  // Check if wagmi is properly configured
  let config
  let address, isConnected, balance, disconnect

  try {
    config = useConfig()
    const account = useAccount()
    const balanceData = useBalance({ address: account.address })
    const disconnectFn = useDisconnect()
    
    address = account.address
    isConnected = account.isConnected
    balance = balanceData.data
    disconnect = disconnectFn.disconnect
    
    if (!wagmiAvailable) {
      setWagmiAvailable(true)
    }
  } catch (error) {
    // WagmiProvider not found, use safe defaults
    address = undefined
    isConnected = false
    balance = undefined
    disconnect = () => {}
    
    if (wagmiAvailable) {
      setWagmiAvailable(false)
    }
  }

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ""

  // Handle wallet connection and authentication
  useEffect(() => {
    if (!wagmiAvailable) {
      setIsAuthenticated(false)
      setError('Web3 provider not available')
      return
    }

    if (isConnected && address) {
      handleAuthentication()
    } else {
      setIsAuthenticated(false)
      setError(null)
      localStorage.removeItem('auth_token')
    }
  }, [isConnected, address, wagmiAvailable])

  const handleAuthentication = async () => {
    if (!address || !wagmiAvailable) return

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
    if (wagmiAvailable && disconnect) {
      disconnect()
    }
  }

  // Return safe defaults if wagmi is not available
  if (!wagmiAvailable) {
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