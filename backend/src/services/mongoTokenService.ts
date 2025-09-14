import { getMongoDB } from '../config/mongodb'

export interface Token {
  _id?: string
  coin_gecko_id?: string
  unique_id: string
  name: string
  symbol: string
  description?: string
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  reddit?: string
  github?: string
  whitepaper?: string
  contract_address?: string
  network?: string
  audit_status?: string
  audit_links?: string[]
  // New fields from admin form
  category?: string
  priority?: number
  risk_level?: string
  monitoring_strategy?: string
  rank?: number
  contract_score?: number
  audits_count?: number
  // Existing price and holder fields
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

  // Get all tokens
  async getAllTokens(): Promise<Token[]> {
    try {
      const db = await this.getDb()
      const tokens = await db.collection('tokens').find({}).toArray()
      
      console.log(`✅ Retrieved ${tokens.length} tokens from MongoDB`)
      return tokens
    } catch (error) {
      console.error('❌ Error getting all tokens:', error)
      return []
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
      
      // For new tokens, use insertOne instead of updateOne with upsert
      // This avoids issues with unique indexes and upsert operations
      const tokenToInsert = {
        ...token,
        created_at: new Date(),
        updated_at: new Date()
      }
      
      const result = await db.collection('tokens').insertOne(tokenToInsert)
      return result.acknowledged
    } catch (error) {
      console.error(`❌ Error upserting token:`, error)
      return false
    }
  }

  // Update existing token
  async updateToken(uniqueId: string, updates: Partial<Token>): Promise<boolean> {
    try {
      const db = await this.getDb()
      
      const result = await db.collection('tokens').updateOne(
        { unique_id: uniqueId },
        {
          $set: {
            ...updates,
            updated_at: new Date()
          }
        }
      )
      
      return result.acknowledged
    } catch (error) {
      console.error(`❌ Error updating token:`, error)
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

  // Delete token
  async deleteToken(tokenId: string): Promise<boolean> {
    try {
      const db = await this.getDb()
      
      const result = await db.collection('tokens').deleteOne({
        $or: [
          { coin_gecko_id: tokenId },
          { unique_id: tokenId }
        ]
      })

      return result.deletedCount > 0
    } catch (error) {
      console.error(`❌ Error deleting token ${tokenId}:`, error)
      return false
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
            network: 'bitcoin',
            description: 'Bitcoin is a decentralized digital currency that enables peer-to-peer transactions without the need for a central authority. It was created in 2009 by an anonymous person or group using the pseudonym Satoshi Nakamoto.',
            website: 'https://bitcoin.org',
            twitter: 'https://twitter.com/bitcoin',
            reddit: 'https://reddit.com/r/bitcoin',
            github: 'https://github.com/bitcoin/bitcoin',
            whitepaper: 'https://bitcoin.org/bitcoin.pdf',
            audit_status: 'AUDITED',
            audit_links: ['https://bitcoin.org/bitcoin.pdf'],
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            coin_gecko_id: 'ethereum',
            unique_id: 'ethereum',
            name: 'Ethereum',
            symbol: 'ETH',
            contract_address: undefined,
            network: 'ethereum',
            description: 'Ethereum is a decentralized platform that runs smart contracts: applications that run exactly as programmed without any possibility of downtime, censorship, fraud or third-party interference.',
            website: 'https://ethereum.org',
            twitter: 'https://twitter.com/ethereum',
            reddit: 'https://reddit.com/r/ethereum',
            github: 'https://github.com/ethereum/go-ethereum',
            whitepaper: 'https://ethereum.org/en/whitepaper/',
            telegram: 'https://t.me/ethereum',
            discord: 'https://discord.gg/ethereum',
            audit_status: 'AUDITED',
            audit_links: ['https://ethereum.org/en/whitepaper/'],
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            coin_gecko_id: 'cardano',
            unique_id: 'cardano',
            name: 'Cardano',
            symbol: 'ADA',
            contract_address: undefined,
            network: 'cardano',
            description: 'Cardano is a blockchain platform for changemakers, innovators, and visionaries, with the tools and technologies required to create possibility for the many, as well as the few, and bring about positive global change.',
            website: 'https://cardano.org',
            twitter: 'https://twitter.com/cardano',
            reddit: 'https://reddit.com/r/cardano',
            github: 'https://github.com/input-output-hk/cardano-node',
            whitepaper: 'https://cardano.org/whitepaper/',
            telegram: 'https://t.me/cardano',
            discord: 'https://discord.gg/cardano',
            audit_status: 'AUDITED',
            audit_links: ['https://cardano.org/whitepaper/'],
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            coin_gecko_id: 'dogecoin',
            unique_id: 'dogecoin',
            name: 'Dogecoin',
            symbol: 'DOGE',
            contract_address: undefined,
            network: 'dogecoin',
            description: 'Dogecoin is an open source peer-to-peer digital currency, favored by Shiba Inus worldwide. It was created as a fun, light-hearted cryptocurrency that would have broader appeal beyond the core Bitcoin audience.',
            website: 'https://dogecoin.com',
            twitter: 'https://twitter.com/dogecoin',
            reddit: 'https://reddit.com/r/dogecoin',
            github: 'https://github.com/dogecoin/dogecoin',
            whitepaper: 'https://github.com/dogecoin/dogecoin/blob/master/README.md',
            telegram: 'https://t.me/dogecoin',
            discord: 'https://discord.gg/dogecoin',
            audit_status: 'AUDITED',
            audit_links: ['https://github.com/dogecoin/dogecoin/blob/master/README.md'],
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            coin_gecko_id: 'blox-myrc',
            unique_id: 'blox-myrc',
            name: 'Blox MYRC',
            symbol: 'MYRC',
            contract_address: '0x3ed03e95dd894235090b3d4a49e0c3239edce59e',
            network: 'arbitrum',
            description: 'Blox MYRC is a revolutionary token built on the Arbitrum network, designed to provide innovative solutions in the DeFi space with advanced security features and community-driven governance.',
            website: 'https://blox.xyz',
            twitter: 'https://twitter.com/blox_xyz',
            reddit: 'https://reddit.com/r/blox',
            github: 'https://github.com/blox-xyz',
            whitepaper: 'https://blox.xyz/whitepaper.pdf',
            telegram: 'https://t.me/blox_community',
            discord: 'https://discord.gg/blox',
            audit_status: 'AUDITED',
            audit_links: ['https://blox.xyz/audit-report.pdf'],
            created_at: new Date(),
            updated_at: new Date()
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
