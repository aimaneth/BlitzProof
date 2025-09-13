import { etherscanService } from './etherscanService'
import { moralisService } from './moralisService'
import { Pool } from 'pg'

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export interface HolderData {
  holderCount: number
  topHolders: number
  source: string
  lastUpdated: Date
  reliability: number
}

export interface DexPairsData {
  pairsCount: number
  totalLiquidity: number
  source: string
  lastUpdated: Date
  reliability: number
}

export class HolderDataService {
  private lastApiCall: number = 0
  private readonly API_DELAY = 1000 // 1 second between calls to avoid rate limits

  // Rate limiting for API calls
  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastApiCall
    if (timeSinceLastCall < this.API_DELAY) {
      const delay = this.API_DELAY - timeSinceLastCall
      console.log(`⏳ Rate limiting: waiting ${delay}ms before next API call`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    this.lastApiCall = Date.now()
  }

  // 🔍 GET HOLDER COUNT FROM BLOCKCHAIN (WITH MORALIS FALLBACK)
  async getHolderCount(tokenId: string, contractAddress?: string, network: string = 'arbitrum'): Promise<HolderData> {
    try {
      console.log(`🔍 Fetching holder count for: ${tokenId}`)

      // If no contract address, try to get it from database
      if (!contractAddress) {
        console.log(`🔍 Looking up contract address for ${tokenId} in database...`)
        const dbContractAddress = await this.getContractAddressFromDatabase(tokenId)
        if (!dbContractAddress) {
          console.warn(`⚠️ No contract address found for ${tokenId}`)
          return this.getFallbackHolderData(tokenId)
        }
        contractAddress = dbContractAddress
        console.log(`✅ Found contract address for ${tokenId}: ${contractAddress}`)
      }

      // Apply rate limiting
      await this.rateLimit()

      // Try Etherscan first
      try {
        console.log(`🔍 Trying Etherscan for ${tokenId}...`)
        const etherscanData = await etherscanService.getTokenHolderCount(network, contractAddress)
        
        if (etherscanData.holderCount > 0) {
          console.log(`✅ Etherscan success: ${etherscanData.holderCount} holders`)
          return {
            holderCount: etherscanData.holderCount,
            topHolders: etherscanData.topHolders,
            source: etherscanData.source,
            lastUpdated: etherscanData.lastUpdated,
            reliability: 90
          }
        }
      } catch (etherscanError) {
        console.warn(`⚠️ Etherscan failed for ${tokenId}:`, etherscanError instanceof Error ? etherscanError.message : 'Unknown error')
      }

      // Try Moralis as fallback
      if (moralisService.isAvailable()) {
        try {
          console.log(`🔍 Trying Moralis for ${tokenId} with contract ${contractAddress} on ${network}...`)
          console.log(`🔍 Moralis service available: ${moralisService.isAvailable()}`)
          const moralisData = await moralisService.getTokenHolderCount(contractAddress, network)
          console.log(`🔍 Moralis response:`, moralisData)
          
          if (moralisData.holderCount > 0) {
            console.log(`✅ Moralis success: ${moralisData.holderCount} holders`)
            return {
              holderCount: moralisData.holderCount,
              topHolders: moralisData.topHolders,
              source: moralisData.source,
              lastUpdated: moralisData.lastUpdated,
              reliability: 95
            }
          } else {
            console.log(`ℹ️ Moralis returned 0 holders for ${tokenId} - contract may be new or inactive`)
          }
        } catch (moralisError) {
          console.warn(`⚠️ Moralis failed for ${tokenId}:`, moralisError instanceof Error ? moralisError.message : 'Unknown error')
        }
      } else {
        console.warn(`⚠️ Moralis not available (no API key)`)
      }

      // If both fail, return fallback
      console.warn(`⚠️ All holder data sources failed for ${tokenId}`)
      return this.getFallbackHolderData()

    } catch (error) {
      console.error(`❌ Error fetching holder count for ${tokenId}:`, error)
      return this.getFallbackHolderData()
    }
  }

  // 🔍 GET DEX PAIRS DATA (Already available from DexScreener)
  async getDexPairsData(tokenId: string): Promise<DexPairsData> {
    try {
      console.log(`🔍 Fetching DEX pairs for: ${tokenId}`)

      // Get cached price data which includes DEX pairs
      const client = await pool.connect()
      const result = await client.query(
        'SELECT pairs_count, total_liquidity, last_price_update FROM tokens WHERE coin_gecko_id = $1 OR unique_id = $1',
        [tokenId]
      )
      client.release()

      if (result.rows.length > 0) {
        const row = result.rows[0]
        return {
          pairsCount: parseInt(row.pairs_count) || 0,
          totalLiquidity: parseFloat(row.total_liquidity) || 0,
          source: 'DexScreener',
          lastUpdated: row.last_price_update || new Date(),
          reliability: row.pairs_count > 0 ? 95 : 0
        }
      }

      return this.getFallbackDexPairsData()

    } catch (error) {
      console.error(`❌ Error fetching DEX pairs for ${tokenId}:`, error)
      return this.getFallbackDexPairsData()
    }
  }

  // 🔄 UPDATE HOLDER COUNT IN DATABASE
  async updateHolderCount(tokenId: string, holderData: HolderData): Promise<void> {
    try {
      const client = await pool.connect()
      
      await client.query(
        'UPDATE tokens SET holder_count = $1, holder_source = $2, holder_last_update = $3 WHERE coin_gecko_id = $4 OR unique_id = $4',
        [holderData.holderCount, holderData.source, holderData.lastUpdated, tokenId]
      )
      
      client.release()
      console.log(`✅ Updated holder count for ${tokenId}: ${holderData.holderCount} holders`)

    } catch (error) {
      console.error(`❌ Database update error for ${tokenId}:`, error)
      throw error
    }
  }

  // 🔄 BULK UPDATE HOLDER COUNTS
  async bulkUpdateHolderCounts(): Promise<void> {
    try {
      console.log('🔄 Starting bulk holder count update...')

      // Get all tokens with contract addresses
      const client = await pool.connect()
      const result = await client.query(
        'SELECT unique_id, coin_gecko_id, contract_address, network FROM tokens WHERE contract_address IS NOT NULL AND contract_address != \'\' AND is_active = true'
      )
      client.release()

      const tokens = result.rows
      console.log(`📊 Found ${tokens.length} tokens with contract addresses`)

      // Process tokens in batches to avoid rate limits
      const batchSize = 5
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize)
        
        const promises = batch.map(async (token) => {
          try {
            const holderData = await this.getHolderCount(
              token.unique_id, 
              token.contract_address, 
              token.network || 'ethereum'
            )
            
            if (holderData.holderCount > 0) {
              await this.updateHolderCount(token.unique_id, holderData)
            }
            
            return { token: token.unique_id, success: true, holders: holderData.holderCount }
          } catch (error) {
            console.error(`❌ Failed to update ${token.unique_id}:`, error)
            return { token: token.unique_id, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
          }
        })

        const results = await Promise.all(promises)
        const successful = results.filter(r => r.success).length
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${successful}/${batch.length} tokens updated`)

        // Wait between batches
        if (i + batchSize < tokens.length) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      console.log('✅ Bulk holder count update completed')

    } catch (error) {
      console.error('❌ Bulk holder count update failed:', error)
      throw error
    }
  }

  // 🔍 GET CONTRACT ADDRESS FROM DATABASE
  private async getContractAddressFromDatabase(tokenId: string): Promise<string | null> {
    try {
      const client = await pool.connect()
      const result = await client.query(
        'SELECT contract_address FROM tokens WHERE coin_gecko_id = $1 OR unique_id = $1',
        [tokenId]
      )
      client.release()

      return result.rows.length > 0 ? result.rows[0].contract_address : null
    } catch (error) {
      console.error('❌ Error getting contract address from database:', error)
      return null
    }
  }

  // 🔄 FALLBACK DATA WITH REALISTIC ESTIMATES
  private getFallbackHolderData(tokenId?: string): HolderData {
    // Provide realistic holder estimates based on token characteristics
    const holderEstimates: {[key: string]: number} = {
      'bitcoin': 50000000, // BTC has ~50M addresses with balance
      'ethereum': 200000000, // ETH has ~200M addresses
      'cardano': 5000000, // ADA has ~5M holders
      'dogecoin': 10000000, // DOGE has ~10M holders
      'blox-myrc': 1000, // MYRC is smaller, estimate 1K holders
    }
    
    const estimatedHolders = tokenId ? holderEstimates[tokenId.toLowerCase()] || 1000 : 1000
    
    return {
      holderCount: estimatedHolders,
      topHolders: Math.min(estimatedHolders, 10000),
      source: 'estimated',
      lastUpdated: new Date(),
      reliability: 60 // Lower reliability for estimates
    }
  }

  private getFallbackDexPairsData(): DexPairsData {
    return {
      pairsCount: 0,
      totalLiquidity: 0,
      source: 'fallback',
      lastUpdated: new Date(),
      reliability: 0
    }
  }
}

export const holderDataService = new HolderDataService()
export default holderDataService
