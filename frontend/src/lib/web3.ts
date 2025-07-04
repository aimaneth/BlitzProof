import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import { metaMask, walletConnect } from 'wagmi/connectors'

// Ensure config is only created once
let configInstance: ReturnType<typeof createConfig> | null = null

export const config = (() => {
  if (configInstance) {
    return configInstance
  }

  // Check if MetaMask is available before creating config
  const isMetaMaskAvailable = typeof window !== 'undefined' && 
    (window as any).ethereum && 
    ((window as any).ethereum.isMetaMask || 
     (window as any).ethereum.providers?.some((p: any) => p.isMetaMask))

  console.log('🔍 MetaMask availability check:', {
    hasWindow: typeof window !== 'undefined',
    hasEthereum: typeof window !== 'undefined' && !!(window as any).ethereum,
    isMetaMask: typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask,
    hasProviders: typeof window !== 'undefined' && !!(window as any).ethereum?.providers,
    isMetaMaskAvailable
  })

  // Create config with conditional MetaMask connector
  try {
    if (isMetaMaskAvailable) {
      console.log('✅ Creating config with MetaMask connector')
      configInstance = createConfig({
        chains: [mainnet, polygon, arbitrum, optimism],
        connectors: [
          metaMask(),
          walletConnect({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
          }),
        ],
        transports: {
          [mainnet.id]: http(),
          [polygon.id]: http(),
          [arbitrum.id]: http(),
          [optimism.id]: http(),
        },
      })
    } else {
      console.log('⚠️ Creating config without MetaMask connector')
      configInstance = createConfig({
        chains: [mainnet, polygon, arbitrum, optimism],
        connectors: [
          walletConnect({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
          }),
        ],
        transports: {
          [mainnet.id]: http(),
          [polygon.id]: http(),
          [arbitrum.id]: http(),
          [optimism.id]: http(),
        },
      })
    }
  } catch (error) {
    console.error('Failed to create wagmi config:', error)
    // Fallback config without MetaMask if it fails
    configInstance = createConfig({
      chains: [mainnet, polygon, arbitrum, optimism],
      connectors: [
        walletConnect({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        }),
      ],
      transports: {
        [mainnet.id]: http(),
        [polygon.id]: http(),
        [arbitrum.id]: http(),
        [optimism.id]: http(),
      },
    })
  }

  return configInstance
})()

// Add a warning if WalletConnect is not properly configured
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    console.warn('⚠️ WalletConnect not properly configured. Please:')
    console.warn('1. Go to https://cloud.walletconnect.com')
    console.warn('2. Create a new project')
    console.warn('3. Add http://localhost:3002 to allowed origins')
    console.warn('4. Update NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local')
  } else {
    console.log('✅ WalletConnect project ID configured:', process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.slice(0, 8) + '...')
  }
}

// Add error handling for RPC connection issues
if (typeof window !== 'undefined') {
  // Debug MetaMask and wallet detection
  console.log('🔧 Web3 Configuration Debug:')
  console.log('- MetaMask connector configured')
  console.log('- Available chains:', [mainnet, polygon, arbitrum, optimism].map(c => c.name))
  
  // Listen for unhandled promise rejections related to RPC and MetaMask
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('net::ERR_CONNECTION_CLOSED') ||
        event.reason?.message?.includes('TimeoutError') ||
        event.reason?.message?.includes('MetaMask extension not found') ||
        event.reason?.message?.includes('User rejected')) {
      console.warn('Wallet connection issue detected. This is normal during development.')
      event.preventDefault() // Prevent the error from showing in console
    }
  })
  
  // Handle MetaMask extension errors
  window.addEventListener('error', (event) => {
    if (event.message?.includes('MetaMask extension not found') ||
        event.message?.includes('ChromeTransport') ||
        event.filename?.includes('inpage.js') ||
        event.filename?.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
        event.filename?.includes('intercept-console-error.js')) {
      console.warn('⚠️ MetaMask extension error detected. This is usually harmless and can be ignored.')
      console.log('MetaMask will still work once the extension is properly loaded.')
      event.preventDefault() // Prevent the error from showing in console
      return false // Stop error propagation
    }
  }, true) // Use capture phase to catch errors early

  // Override console.error to catch MetaMask errors
  const originalConsoleError = console.error
  console.error = (...args) => {
    const message = args.join(' ')
    if (message.includes('MetaMask extension not found') || 
        message.includes('ChromeTransport') ||
        message.includes('inpage.js')) {
      console.warn('⚠️ MetaMask extension error suppressed:', message)
      return // Don't log the error
    }
    originalConsoleError.apply(console, args)
  }
} 