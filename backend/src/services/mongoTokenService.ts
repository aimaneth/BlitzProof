import { getMongoDB } from '../config/mongodb'

export interface Token {
  _id?: string
  coin_gecko_id?: string
  unique_id: string
  name: string
  symbol: string
  contract_address?: string
  network?: string
  current_price?: number
  price_change_24h?: number
  market_cap?: number
  volume_24h?: number
  pairs_count?: number
  total_liquidity?: number
  price_source?: string
  price_reliability?: number
  last_price_update?: Date
  holder_count?: number
  holder_source?: string
  holder_last_update?: Date
  created_at?: Date
  updated_at?: Date
}

export interface TokenWithPrice extends Token {
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

export class MongoTokenService {
  private db: any = null

  private async getDb() {
    if (!this.db) {
      this.db = await getMongoDB()
    }
    return this.db
  }

  // Get all tokens with price data
  async getTokensWithPrice(): Promise<TokenWithPrice[]> {
    try {
      const db = await this.getDb()
      const tokens = await db.collection('tokens').find({}).toArray()

      return tokens.map((token: Token) => this.mapTokenToTokenWithPrice(token))
    } catch (error) {
      console.error('❌ Error getting tokens with price:', error)
      throw error
    }
  }

  // Get token by ID
  async getTokenById(tokenId: string): Promise<Token | null> {
    try {
      const db = await this.getDb()
      const token = await db.collection('tokens').findOne({
        $or: [
          { coin_gecko_id: tokenId },
          { unique_id: tokenId }
        ]
      })

      return token
    } catch (error) {
      console.error(`❌ Error getting token ${tokenId}:`, error)
      return null
    }
  }

  // Update token price data
  async updateTokenPrice(tokenId: string, priceData: {
    current_price?: number
    price_change_24h?: number
    market_cap?: number
    volume_24h?: number
    pairs_count?: number
    total_liquidity?: number
    price_source?: string
    price_reliability?: number
    last_price_update?: Date
  }): Promise<boolean> {
    try {
      const db = await this.getDb()
      
      const result = await db.collection('tokens').updateOne(
        {
          $or: [
            { coin_gecko_id: tokenId },
            { unique_id: tokenId }
          ]
        },
        {
          $set: {
            ...priceData,
            updated_at: new Date()
          }
        }
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error(`❌ Error updating token price ${tokenId}:`, error)
      return false
    }
  }

  // Update token holder data
  async updateTokenHolders(tokenId: string, holderData: {
    holder_count?: number
    holder_source?: string
    holder_last_update?: Date
  }): Promise<boolean> {
    try {
      const db = await this.getDb()
      
      const result = await db.collection('tokens').updateOne(
        {
          $or: [
            { coin_gecko_id: tokenId },
            { unique_id: tokenId }
          ]
        },
        {
          $set: {
            ...holderData,
            updated_at: new Date()
          }
        }
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error(`❌ Error updating token holders ${tokenId}:`, error)
      return false
    }
  }

  // Create or update token
  async upsertToken(token: Partial<Token>): Promise<boolean> {
    try {
      const db = await this.getDb()
      
      const result = await db.collection('tokens').updateOne(
        {
          $or: [
            { coin_gecko_id: token.coin_gecko_id },
            { unique_id: token.unique_id }
          ]
        },
        {
          $set: {
            ...token,
            updated_at: new Date()
          },
          $setOnInsert: {
            created_at: new Date()
          }
        },
        { upsert: true }
      )

      return result.acknowledged
    } catch (error) {
      console.error(`❌ Error upserting token:`, error)
      return false
    }
  }

  // Get cached price data
  async getCachedPrice(tokenId: string): Promise<TokenWithPrice | null> {
    try {
      const token = await this.getTokenById(tokenId)
      if (!token) {
        return null
      }

      return this.mapTokenToTokenWithPrice(token)
    } catch (error) {
      console.error(`❌ Error getting cached price ${tokenId}:`, error)
      return null
    }
  }

  // Clear price cache (set price fields to null)
  async clearPriceCache(tokenId: string): Promise<boolean> {
    try {
      const db = await this.getDb()
      
      const result = await db.collection('tokens').updateOne(
        {
          $or: [
            { coin_gecko_id: tokenId },
            { unique_id: tokenId }
          ]
        },
        {
          $set: {
            current_price: null,
            price_change_24h: null,
            market_cap: null,
            volume_24h: null,
            pairs_count: null,
            total_liquidity: null,
            price_source: null,
            price_reliability: null,
            last_price_update: null,
            updated_at: new Date()
          }
        }
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error(`❌ Error clearing price cache ${tokenId}:`, error)
      return false
    }
  }

  // Helper method to map Token to TokenWithPrice
  private mapTokenToTokenWithPrice(token: Token): TokenWithPrice {
    const safeParseFloat = (value: any): number => {
      if (value === null || value === undefined) return 0
      const parsed = parseFloat(value)
      return isNaN(parsed) ? 0 : parsed
    }

    return {
      ...token,
      price: safeParseFloat(token.current_price),
      priceChange24h: safeParseFloat(token.price_change_24h),
      marketCap: safeParseFloat(token.market_cap),
      volume24h: safeParseFloat(token.volume_24h),
      pairsCount: token.pairs_count || 0,
      totalLiquidity: safeParseFloat(token.total_liquidity),
      source: token.price_source || 'none',
      lastUpdated: token.last_price_update || new Date(),
      reliability: token.price_reliability || 0
    }
  }

  // Initialize with some default tokens if collection is empty
  async initializeDefaultTokens(): Promise<void> {
    try {
      const db = await this.getDb()
      const count = await db.collection('tokens').countDocuments()
      
      if (count === 0) {
        console.log('🔄 Initializing default tokens in MongoDB...')
        
        const defaultTokens: Partial<Token>[] = [
          {
            coin_gecko_id: 'bitcoin',
            unique_id: 'bitcoin',
            name: 'Bitcoin',
            symbol: 'BTC',
            contract_address: undefined,
            network: 'bitcoin'
          },
          {
            coin_gecko_id: 'ethereum',
            unique_id: 'ethereum',
            name: 'Ethereum',
            symbol: 'ETH',
            contract_address: undefined,
            network: 'ethereum'
          },
          {
            coin_gecko_id: 'cardano',
            unique_id: 'cardano',
            name: 'Cardano',
            symbol: 'ADA',
            contract_address: undefined,
            network: 'cardano'
          },
          {
            coin_gecko_id: 'dogecoin',
            unique_id: 'dogecoin',
            name: 'Dogecoin',
            symbol: 'DOGE',
            contract_address: undefined,
            network: 'dogecoin'
          },
          {
            coin_gecko_id: 'blox-myrc',
            unique_id: 'blox-myrc',
            name: 'Blox MYRC',
            symbol: 'MYRC',
            contract_address: '0x3ed03e95dd894235090b3d4a49e0c3239edce59e',
            network: 'arbitrum'
          }
        ]

        await db.collection('tokens').insertMany(defaultTokens)
        console.log('✅ Default tokens initialized in MongoDB')
      }
    } catch (error) {
      console.error('❌ Error initializing default tokens:', error)
    }
  }
}

// Export singleton instance
export const mongoTokenService = new MongoTokenService()
