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

  // Check for existing wallet connection on mount
  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          console.log('Found existing wallet connection:', accounts[0])
          setAddress(accounts[0])
          setIsConnected(true)
          
          // Try authentication but don't let it block the UI update
          try {
            await handleAuthentication(accounts[0])
          } catch (authError) {
            console.warn('Authentication failed for existing connection:', authError)
            // Don't set error here - wallet is still connected
          }
        }
      } catch (error) {
        console.log('No wallet connected')
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        setIsLoading(true)
        setError(null)
        
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })
        
        if (accounts.length > 0) {
          console.log('Wallet connected:', accounts[0])
          setAddress(accounts[0])
          setIsConnected(true)
          
          // Try authentication but don't let it block the UI update
          try {
            await handleAuthentication(accounts[0])
          } catch (authError) {
            console.warn('Authentication failed, but wallet is connected:', authError)
            // Don't set error here - wallet is still connected
          }
        }
      } catch (error) {
        setError('Failed to connect wallet')
        console.error('Wallet connection error:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      setError('MetaMask not installed')
    }
  }

  const handleAuthentication = async (walletAddress?: string) => {
    const authAddress = walletAddress || address
    if (!authAddress) return

    // Temporarily disable authentication due to backend issues
    console.log('Authentication temporarily disabled due to backend issues')
    console.log('Wallet connected:', authAddress)
    
    // Set as authenticated locally for now
    setIsAuthenticated(true)
    setError(null)
    
    // TODO: Re-enable authentication when backend is fixed
    /*
    try {
      setIsLoading(true)
      setError(null)
      
      // Check if user already has a valid token
      const existingToken = localStorage.getItem('auth_token')
      if (existingToken) {
        try {
          console.log('Checking existing token...')
          await apiService.getProfile()
          setIsAuthenticated(true)
          console.log('Authentication successful with existing token')
          return
        } catch {
          console.log('Existing token invalid, removing...')
          localStorage.removeItem('auth_token')
        }
      }

      // Register new user
      console.log('Registering new user with address:', authAddress)
      const response = await apiService.registerUser(authAddress)
      console.log('Registration response:', response)
      
      if (response.token) {
        localStorage.setItem('auth_token', response.token)
        setIsAuthenticated(true)
        console.log('Authentication successful with new token')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      console.error('Authentication error:', error)
      setError(errorMessage)
      setIsAuthenticated(false)
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
    */
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
    connect: connectWallet,
    disconnect: handleDisconnect,
  }
}
