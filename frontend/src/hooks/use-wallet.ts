'use client'

import { useAccount, useBalance, useDisconnect, useConfig } from "wagmi"
import { useEffect, useState } from "react"
import { apiService } from "@/lib/api"

export function useWallet() {
  // Always call hooks at the top level - no conditional calls
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wagmiAvailable, setWagmiAvailable] = useState(false)

  // Always call wagmi hooks - they will throw if provider is not available
  let config, account, balanceData, disconnectFn
  
  try {
    config = useConfig()
    account = useAccount()
    balanceData = useBalance({ address: account.address })
    disconnectFn = useDisconnect()
  } catch (wagmiError) {
    // If wagmi hooks fail, we'll handle it in useEffect
    config = null
    account = null
    balanceData = null
    disconnectFn = null
  }

  // Extract values safely
  const address = account?.address
  const isConnected = account?.isConnected || false
  const balance = balanceData?.data
  const disconnect = disconnectFn?.disconnect || (() => {})

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ""

  // Handle wallet connection and authentication
  useEffect(() => {
    // Check if wagmi is available
    const isWagmiAvailable = config !== null && account !== null
    
    if (!isWagmiAvailable) {
      setIsAuthenticated(false)
      setError('Web3 provider not available')
      setWagmiAvailable(false)
      return
    }

    setWagmiAvailable(true)

    if (isConnected && address) {
      handleAuthentication()
    } else {
      setIsAuthenticated(false)
      setError(null)
      localStorage.removeItem('auth_token')
    }
  }, [isConnected, address, config, account])

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
  if (config === null || account === null) {
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