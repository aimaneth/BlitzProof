import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import { metaMask, walletConnect } from 'wagmi/connectors'

// Prevent multiple WalletConnect initializations
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Simple, clean web3 configuration
export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism],
  connectors: [
    metaMask(),
    ...(projectId ? [walletConnect({
      projectId,
      metadata: {
        name: 'BlitzProof Security Scanner',
        description: 'Advanced smart contract security scanner',
        url: typeof window !== 'undefined' ? window.location.origin : '',
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