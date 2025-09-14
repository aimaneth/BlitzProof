'use client'

import { useAccount, useBalance, useDisconnect, useConfig } from "wagmi"
import { useEffect, useState } from "react"
import { apiService } from "@/lib/api"

// Custom hook to safely use wagmi hooks
function useWagmiHooks() {
  const [isProviderReady, setIsProviderReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  
  // Initialize with safe defaults
  let config = null
  let account = null
  let balanceData = null
  let disconnectFn = null
  
  try {
    // Always call hooks at the top level
    config = useConfig()
    account = useAccount()
    balanceData = useBalance({ address: account.address })
    disconnectFn = useDisconnect()
    setHasError(false)
  } catch (error) {
    // If any wagmi hook fails, we're not ready
    setHasError(true)
  }

  useEffect(() => {
    // Check if provider is ready and no errors occurred
    if (!hasError && config && account && balanceData && disconnectFn) {
      setIsProviderReady(true)
    } else {
      setIsProviderReady(false)
    }
  }, [config, account, balanceData, disconnectFn, hasError])

  return {
    config,
    account,
    balanceData,
    disconnectFn,
    isProviderReady,
    hasError
  }
}

export function useWallet() {
  // Always call hooks at the top level - no conditional calls
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use our safe wagmi hooks
  const { config, account, balanceData, disconnectFn, isProviderReady, hasError } = useWagmiHooks()

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
    if (hasError || !isProviderReady) {
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
  }, [isConnected, address, isProviderReady, hasError])

  const handleAuthentication = async () => {
    if (!address || !isProviderReady) return

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
    if (isProviderReady && disconnect) {
      disconnect()
    }
  }

  // Return safe defaults if wagmi is not available or has errors
  if (hasError || !isProviderReady) {
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