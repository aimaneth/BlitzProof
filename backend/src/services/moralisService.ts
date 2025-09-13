import axios from 'axios'

export interface MoralisHolderData {
  holderCount: number
  topHolders: number
  source: string
  lastUpdated: Date
  reliability: number
}

export class MoralisService {
  private apiKey: string
  private baseUrl: string = 'https://deep-index.moralis.io/api/v2.2'

  constructor() {
    this.apiKey = process.env.MORALIS_API_KEY || ''
    if (!this.apiKey) {
      console.warn('⚠️ MORALIS_API_KEY not found in environment variables')
    }
  }

  // 🔍 GET TOKEN HOLDER COUNT FROM MORALIS
  async getTokenHolderCount(contractAddress: string, network: string = 'eth'): Promise<MoralisHolderData> {
    try {
      if (!this.apiKey) {
        throw new Error('Moralis API key not configured')
      }

      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
        throw new Error('Invalid contract address format')
      }

      console.log(`🔍 Fetching holder count from Moralis for ${contractAddress} on ${network}`)

      // Get token holders from Moralis using the correct endpoint
      const response = await axios.get(
        `${this.baseUrl}/erc20/${contractAddress}/owners`,
        {
          params: {
            chain: network,
            limit: 100, // Moralis max limit per request
            cursor: ''
          },
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      )

      const holders = (response.data as any).result || []
      const holderCount = holders.length

      // Moralis gives us actual holder count up to the limit
      // For tokens with many holders, this is a minimum count
      const estimatedTotal = holderCount >= 10000 ? 
        Math.round(holderCount * 1.5) : // Estimate 50% more for large tokens
        holderCount

      console.log(`✅ Moralis holder data: ${holderCount} actual, ${estimatedTotal} estimated`)

      return {
        holderCount: estimatedTotal,
        topHolders: holderCount,
        source: 'moralis',
        lastUpdated: new Date(),
        reliability: holderCount > 0 ? 95 : 0 // Moralis is very reliable
      }

    } catch (error) {
      console.warn(`⚠️ Moralis API error for ${contractAddress}:`, error instanceof Error ? error.message : 'Unknown error')
      
      return {
        holderCount: 0,
        topHolders: 0,
        source: 'moralis-error',
        lastUpdated: new Date(),
        reliability: 0
      }
    }
  }

  // 🔍 GET TOKEN METADATA FROM MORALIS
  async getTokenMetadata(contractAddress: string, network: string = 'eth'): Promise<{
    name: string
    symbol: string
    decimals: number
    totalSupply: string
  }> {
    try {
      if (!this.apiKey) {
        throw new Error('Moralis API key not configured')
      }

      const response = await axios.get(
        `${this.baseUrl}/${contractAddress}/metadata`,
        {
          params: { chain: network },
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      const metadata = response.data as any
      return {
        name: metadata.name || 'Unknown Token',
        symbol: metadata.symbol || 'UNKNOWN',
        decimals: parseInt(metadata.decimals) || 18,
        totalSupply: metadata.total_supply || '0'
      }

    } catch (error) {
      console.warn(`⚠️ Moralis metadata error for ${contractAddress}:`, error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  // 🔍 GET NETWORK MAPPING
  getNetworkMapping(): {[key: string]: string} {
    return {
      'ethereum': 'eth',
      'polygon': 'polygon',
      'bsc': 'bsc',
      'arbitrum': 'arbitrum',
      'optimism': 'optimism',
      'avalanche': 'avalanche'
    }
  }

  // 🔍 CHECK IF MORALIS IS AVAILABLE
  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }
}

export const moralisService = new MoralisService()
