import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import { metaMask, walletConnect, injected } from 'wagmi/connectors'

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

  // Debug mobile detection and WalletConnect configuration
  if (typeof window !== 'undefined') {
    const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    if (!walletConnectProjectId) {
      console.error('❌ WalletConnect not configured! Please:')
      console.error('1. Go to https://cloud.walletconnect.com')
      console.error('2. Create a new project')
      console.error('3. Add your domain to allowed origins')
      console.error('4. Update NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local')
    } else {
      console.log('✅ WalletConnect project ID configured:', walletConnectProjectId.slice(0, 8) + '...')
      console.log('✅ WalletConnect should work on mobile devices')
    }
    
    // Debug mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    console.log('📱 Mobile detection:', isMobile ? 'Mobile device' : 'Desktop device')
    console.log('🍎 Safari detection:', isSafari ? 'Safari browser' : 'Other browser')
    console.log('🔗 Available connectors:', isMetaMaskAvailable ? 'MetaMask + WalletConnect' : 'WalletConnect only')
    
    // Safari-specific warnings
    if (isSafari && isMobile) {
      console.log('📱 Safari Mobile detected - WalletConnect should work')
      console.log('💡 If no wallets show, try:')
      console.log('1. Check if WalletConnect project has correct domain')
      console.log('2. Try refreshing the page')
      console.log('3. Check if HTTPS is working properly')
    }
  }

  // Create config with mobile-optimized connectors
  try {
    const isMobile = typeof window !== 'undefined' && 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMetaMaskAvailable && !isMobile) {
      console.log('✅ Creating config with MetaMask connector (desktop)')
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
      console.log('📱 Creating mobile-optimized config')
      const walletConnectConfig = walletConnect({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        metadata: {
          name: 'BlitzProof',
          description: 'Web3 Security Platform',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://blitzproof.com',
          icons: ['https://blitzproof.com/favicon.ico']
        }
      })
      
      console.log('🔧 Mobile wallet config created:', {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.slice(0, 8) + '...',
        isMobile,
        domain: typeof window !== 'undefined' ? window.location.origin : 'SSR'
      })
      
      configInstance = createConfig({
        chains: [mainnet, polygon, arbitrum, optimism],
        connectors: [
          walletConnectConfig,
          // Mobile wallet connectors
          injected({
            target: 'metaMask',
          }),
          injected({
            target: 'coinbaseWallet',
          }),
          injected({
            target: 'trust',
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
    
    console.log('🎯 Final config created with connectors:', configInstance.connectors.map(c => c.name || 'Unknown'))
    
  } catch (error) {
    console.error('❌ Failed to create wagmi config:', error)
    // Fallback config with multiple connectors
    console.log('🔄 Using fallback config with multiple connectors')
    configInstance = createConfig({
      chains: [mainnet, polygon, arbitrum, optimism],
      connectors: [
        walletConnect({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        }),
        injected({
          target: 'metaMask',
        }),
        injected({
          target: 'coinbaseWallet',
        }),
        injected({
          target: 'trust',
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