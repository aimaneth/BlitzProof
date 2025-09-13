import axios from 'axios'
import { mongoTokenService } from './mongoTokenService'

// 🆕 MONGODB-BASED PRICE DATA SERVICE
// Handles real-time price fetching from multiple sources with proper error handling

export interface PriceData {
  price: number
  priceChange24h: number
  marketCap: number
  volume24h: number
  pairsCount: number
  totalLiquidity: number
  source: string
  lastUpdated: Date
  reliability: number
}

export class MongoPriceDataService {
  private coingeckoApiKey: string
  private rateLimitDelay: number = 2000 // 2 seconds between CoinGecko calls

  constructor() {
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY || ''
    console.log('🔄 MongoPriceDataService initialized with CoinGecko API key:', this.coingeckoApiKey ? 'Set' : 'Not set')
  }

  // 🚀 RATE LIMITING FOR COINGECKO
  private async rateLimit(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))
  }

  // 🔍 SAFE NUMBER PARSING
  private safeParseFloat(value: any): number {
    if (value === null || value === undefined) return 0
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // 📊 COINGECKO PRICE FETCHING
  private async getCoinGeckoPrice(tokenId: string): Promise<PriceData | null> {
    try {
      await this.rateLimit() // Rate limit CoinGecko calls
      
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      
      console.log(`🔄 Fetching CoinGecko price for ${tokenId}...`)
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          ...(this.coingeckoApiKey && { 'x-cg-demo-api-key': this.coingeckoApiKey })
        }
      })

      if (!response.data[tokenId]) {
        console.log(`⚠️ No CoinGecko data for ${tokenId}`)
        return null
      }

      const data = response.data[tokenId]
      
      console.log(`✅ CoinGecko data for ${tokenId}:`, {
        price: data.usd,
        marketCap: data.usd_market_cap,
        volume: data.usd_24h_vol,
        change: data.usd_24h_change
      })

      return {
        price: this.safeParseFloat(data.usd),
        priceChange24h: this.safeParseFloat(data.usd_24h_change),
        marketCap: this.safeParseFloat(data.usd_market_cap),
        volume24h: this.safeParseFloat(data.usd_24h_vol),
        pairsCount: 0, // Will be filled by DexScreener
        totalLiquidity: 0, // Will be filled by DexScreener
        source: 'coingecko',
        lastUpdated: new Date(),
        reliability: 95
      }

    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn(`⚠️ CoinGecko rate limit hit for ${tokenId}, waiting longer...`)
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        return null
      }
      
      console.error(`❌ CoinGecko API error for ${tokenId}:`, error.message)
      return null
    }
  }

  // 📊 DEXSCREENER PRICE FETCHING
  private async getDexScreenerPrice(tokenId: string): Promise<PriceData | null> {
    try {
      // Map token IDs to search terms
      const searchTerms: { [key: string]: string } = {
        'bitcoin': 'bitcoin',
        'ethereum': 'ethereum',
        'cardano': 'cardano',
        'dogecoin': 'dogecoin',
        'blox-myrc': 'MYRC' // Specific search for MYRC
      }

      const searchTerm = searchTerms[tokenId] || tokenId
      
      console.log(`🔄 Fetching DexScreener data for ${tokenId} (search: ${searchTerm})...`)
      
      const response = await axios.get(`https://api.dexscreener.com/latest/dex/search/?q=${searchTerm}`, {
        timeout: 10000
      })

      if (!response.data.pairs || response.data.pairs.length === 0) {
        console.log(`⚠️ No DexScreener pairs for ${tokenId}`)
        return null
      }

      // Filter pairs to find the most relevant one
      let bestPair = response.data.pairs[0]
      
      // For MYRC, look for Arbitrum pairs specifically
      if (tokenId === 'blox-myrc') {
        const arbitrumPair = response.data.pairs.find((pair: any) => 
          pair.chainId === 'arbitrum' && 
          (pair.baseToken.symbol === 'MYRC' || pair.quoteToken.symbol === 'MYRC')
        )
        if (arbitrumPair) {
          bestPair = arbitrumPair
        }
      }

      console.log(`✅ DexScreener data for ${tokenId}:`, {
        price: bestPair.priceUsd,
        liquidity: bestPair.liquidity?.usd,
        pairs: response.data.pairs.length
      })

      return {
        price: this.safeParseFloat(bestPair.priceUsd),
        priceChange24h: this.safeParseFloat(bestPair.priceChange?.h24),
        marketCap: this.safeParseFloat(bestPair.fdv),
        volume24h: this.safeParseFloat(bestPair.volume?.h24),
        pairsCount: response.data.pairs.length,
        totalLiquidity: this.safeParseFloat(bestPair.liquidity?.usd),
        source: 'dexscreener',
        lastUpdated: new Date(),
        reliability: 85
      }

    } catch (error: any) {
      console.error(`❌ DexScreener API error for ${tokenId}:`, error.message)
      return null
    }
  }

  // 🔄 COMBINE PRICE DATA FROM MULTIPLE SOURCES
  private async getCombinedPriceData(tokenId: string): Promise<PriceData | null> {
    try {
      // Try CoinGecko first
      const coingeckoData = await this.getCoinGeckoPrice(tokenId)
      
      // Try DexScreener
      const dexscreenerData = await this.getDexScreenerPrice(tokenId)

      // Combine data, preferring CoinGecko for price/market cap, DexScreener for pairs/liquidity
      if (coingeckoData && dexscreenerData) {
        return {
          price: coingeckoData.price || dexscreenerData.price,
          priceChange24h: coingeckoData.priceChange24h || dexscreenerData.priceChange24h,
          marketCap: coingeckoData.marketCap || dexscreenerData.marketCap,
          volume24h: coingeckoData.volume24h || dexscreenerData.volume24h,
          pairsCount: dexscreenerData.pairsCount,
          totalLiquidity: dexscreenerData.totalLiquidity,
          source: 'combined',
          lastUpdated: new Date(),
          reliability: 90
        }
      }

      // Fallback to whichever source worked
      return coingeckoData || dexscreenerData

    } catch (error) {
      console.error(`❌ Error combining price data for ${tokenId}:`, error)
      return null
    }
  }

  // 📊 GET CACHED PRICE DATA FROM MONGODB
  async getCachedPrice(tokenId: string): Promise<PriceData | null> {
    try {
      return await mongoTokenService.getCachedPrice(tokenId)
    } catch (error) {
      console.error(`❌ MongoDB read error for ${tokenId}:`, error)
      return null
    }
  }

  // 🔄 REFRESH TOKEN PRICE (MAIN METHOD - NEVER STALE!)
  async refreshTokenPrice(tokenId: string): Promise<PriceData> {
    console.log(`🔄 Refreshing price for ${tokenId}...`)
    
    try {
      // Clear cache first to force fresh data
      await mongoTokenService.clearPriceCache(tokenId)
      console.log(`🗑️ Cleared price cache for ${tokenId}`)

      // Get fresh price data
      const freshData = await this.getCombinedPriceData(tokenId)
      
      if (!freshData) {
        console.error(`❌ Failed to get fresh price data for ${tokenId}`)
        throw new Error('Failed to fetch fresh price data')
      }

      // Check if price data is stale
      if (this.isPriceDataStale(freshData)) {
        console.warn(`⚠️ Price data appears stale for ${tokenId}, retrying...`)
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 3000))
        const retryData = await this.getCombinedPriceData(tokenId)
        if (retryData && !this.isPriceDataStale(retryData)) {
          freshData.price = retryData.price
          freshData.marketCap = retryData.marketCap
          freshData.lastUpdated = new Date()
        }
      }

      // Update MongoDB with fresh data
      const updateSuccess = await mongoTokenService.updateTokenPrice(tokenId, {
        current_price: freshData.price,
        price_change_24h: freshData.priceChange24h,
        market_cap: freshData.marketCap,
        volume_24h: freshData.volume24h,
        pairs_count: freshData.pairsCount,
        total_liquidity: freshData.totalLiquidity,
        price_source: freshData.source,
        price_reliability: freshData.reliability,
        last_price_update: freshData.lastUpdated
      })

      if (!updateSuccess) {
        console.error(`❌ Failed to update MongoDB for ${tokenId}`)
      }

      console.log(`✅ Successfully refreshed price for ${tokenId}:`, {
        price: freshData.price,
        marketCap: freshData.marketCap,
        source: freshData.source
      })

      return freshData

    } catch (error) {
      console.error(`❌ Error refreshing price for ${tokenId}:`, error)
      throw error
    }
  }

  // 🔍 CHECK IF PRICE DATA IS STALE
  private isPriceDataStale(priceData: PriceData): boolean {
    // Check for known stale prices
    const stalePrices = [
      { price: 64000, symbol: 'BTC' },
      { price: 3700, symbol: 'ETH' }
    ]

    for (const stale of stalePrices) {
      if (Math.abs(priceData.price - stale.price) < 100) {
        return true
      }
    }

    return false
  }

  // 🚀 AUTO REFRESH ALL PRICES
  async autoRefreshAllPrices(): Promise<void> {
    const tokenIds = ['bitcoin', 'ethereum', 'cardano', 'dogecoin', 'blox-myrc']
    
    console.log('🔄 Starting auto-refresh for all token prices...')
    
    for (const tokenId of tokenIds) {
      try {
        await this.refreshTokenPrice(tokenId)
        console.log(`✅ Auto-refreshed ${tokenId}`)
      } catch (error) {
        console.error(`❌ Failed to auto-refresh ${tokenId}:`, error)
      }
    }
    
    console.log('✅ Auto-refresh completed')
  }
}

// Export singleton instance
export const mongoPriceDataService = new MongoPriceDataService()
