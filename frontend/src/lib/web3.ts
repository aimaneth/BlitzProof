import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import { metaMask, walletConnect } from 'wagmi/connectors'

// Prevent multiple WalletConnect initializations
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Create a function to get the config to avoid hydration issues
export function createWeb3Config() {
  // Use a static URL to avoid hydration mismatches
  const appUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3002'
  
  return createConfig({
    chains: [mainnet, polygon, arbitrum, optimism],
    connectors: [
      metaMask(),
      ...(projectId ? [walletConnect({
        projectId,
        metadata: {
          name: 'BlitzProof Security Scanner',
          description: 'Advanced smart contract security scanner',
          url: appUrl,
          icons: ['https://walletconnect.com/walletconnect-logo.png']
        }
      })] : []),
    ],
    transports: {
      [mainnet.id]: http(),
      [polygon.id]: http(),
      [arbitrum.id]: http(),
      [optimism.id]: http(),
    },
  })
}

// Export a default config for backward compatibility
export const config = createWeb3Config() 