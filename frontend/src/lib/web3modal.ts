import { createConfig, http } from 'wagmi'
import { mainnet, arbitrum, polygon, optimism, base } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'

// Configure chains
const chains = [mainnet, arbitrum, polygon, optimism, base] as const

// Create wagmi config
export const wagmiConfig = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
})

// Create query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})
