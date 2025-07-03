'use client'

import { useAccount, useBalance, useDisconnect } from "wagmi"
import { useEffect, useState, useCallback } from "react"
import { apiService } from "@/lib/api"

export function useWallet() {
  const { address, isConnected } = useAccount()
  // Handle balance fetching errors gracefully
  const { data: balance, error: balanceError } = useBalance({ address })
  const { disconnect } = useDisconnect()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ""

  const handleUserRegistration = useCallback(async () => {
    if (!address) return

    try {
      setIsLoading(true)
      setError(null)
      
      // First, test backend connection
      const isBackendConnected = await apiService.testConnection()
      if (!isBackendConnected) {
        throw new Error('Backend server is not available. Please check if the backend is running.')
      }

      // Check if user already has a token
      const existingToken = localStorage.getItem('auth_token')
      if (existingToken) {
        // Verify token is still valid
        try {
          await apiService.getProfile()
          setIsAuthenticated(true)
          console.log('✅ User authenticated with existing token')
          return
        } catch (tokenError) {
          console.log('❌ Existing token invalid, removing...')
          localStorage.removeItem('auth_token')
        }
      }

      // Register new user with retry logic
      let retries = 3
      let lastError: Error | null = null
      
      while (retries > 0) {
        try {
          console.log(`🔄 Attempting user registration (attempt ${4 - retries}/3)`)
          const response = await apiService.registerUser(address)
          
          if (response.token) {
            localStorage.setItem('auth_token', response.token)
            setIsAuthenticated(true)
            console.log('✅ User registered and authenticated successfully')
            return
          } else {
            throw new Error('Registration response missing token')
          }
        } catch (registrationError) {
          lastError = registrationError as Error
          console.error(`❌ Registration attempt ${4 - retries}/3 failed:`, registrationError)
          retries--
          
          if (retries > 0) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
      
      // All retries failed
      throw lastError || new Error('Registration failed after all attempts')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('❌ User registration failed:', errorMessage)
      setError(errorMessage)
      setIsAuthenticated(false)
      
      // Clear any invalid tokens
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }, [address])

  // Handle wallet connection and user registration
  useEffect(() => {
    if (isConnected && address) {
      console.log('🔗 Wallet connected, starting authentication...')
      handleUserRegistration()
    } else {
      console.log('🔌 Wallet disconnected, clearing authentication...')
      setIsAuthenticated(false)
      setError(null)
      // Clear auth token when wallet disconnects
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
      }
    }
  }, [isConnected, address, handleUserRegistration])

  // Handle balance errors gracefully
  useEffect(() => {
    if (balanceError) {
      console.warn('Balance fetch error (this is normal during development):', balanceError.message)
    }
  }, [balanceError])

  const handleDisconnect = () => {
    console.log('👋 User disconnecting...')
    localStorage.removeItem('auth_token')
    setIsAuthenticated(false)
    setError(null)
    disconnect()
  }

  const retryAuthentication = () => {
    if (address) {
      console.log('🔄 Retrying authentication...')
      handleUserRegistration()
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
    retryAuthentication
  }
} 