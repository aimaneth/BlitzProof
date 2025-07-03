import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, bsc, arbitrum, optimism } from 'wagmi/chains'

// For development, use a more permissive configuration
const isDevelopment = process.env.NODE_ENV === 'development'

// Check if we have a valid WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
const hasValidProjectId = projectId && projectId !== 'YOUR_PROJECT_ID_HERE' && projectId !== 'c4f79cc821944d9680842e34466bfbd9'

// Create a more robust configuration with better error handling
export const config = getDefaultConfig({
  appName: 'BlitzProof - Web3 Security Platform',
  projectId: hasValidProjectId ? projectId : 'YOUR_PROJECT_ID',
  chains: [
    mainnet,
    polygon,
    bsc,
    arbitrum,
    optimism,
  ],
  ssr: true,
})

// Add a warning if WalletConnect is not properly configured
if (!hasValidProjectId && typeof window !== 'undefined') {
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