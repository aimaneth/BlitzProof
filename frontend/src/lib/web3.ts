import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import { metaMask, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
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

// Add a warning if WalletConnect is not properly configured
if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID && typeof window !== 'undefined') {
  console.warn('⚠️ WalletConnect not properly configured. Please:')
  console.warn('1. Go to https://cloud.walletconnect.com')
  console.warn('2. Create a new project')
  console.warn('3. Add http://localhost:3002 to allowed origins')
  console.warn('4. Update NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local')
}

// Add error handling for RPC connection issues
if (typeof window !== 'undefined') {
  // Listen for unhandled promise rejections related to RPC
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('net::ERR_CONNECTION_CLOSED') ||
        event.reason?.message?.includes('TimeoutError')) {
      console.warn('RPC connection issue detected. This is normal during development.')
      event.preventDefault() // Prevent the error from showing in console
    }
  })
} 