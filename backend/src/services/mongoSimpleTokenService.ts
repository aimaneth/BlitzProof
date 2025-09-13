import { mongoTokenService, TokenWithPrice } from './mongoTokenService'

export interface SimpleToken {
  id: string
  uniqueId: string
  coinGeckoId: string
  name: string
  symbol: string
  description?: string
  logoUrl?: string
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  reddit?: string
  github?: string
  whitepaper?: string
  contractAddress?: string
  network?: string
  securityScore?: number
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  auditStatus?: 'AUDITED' | 'UNAUDITED' | 'PENDING'
  auditLinks?: string[]
  liquidityScore?: number
  holderCount?: number
  marketCap?: number
  volume24h?: number
  price?: number
  priceChange24h?: number
  pairsCount?: number
  totalLiquidity?: number
  source?: string
  lastUpdated?: Date
  reliability?: number
}

export class MongoSimpleTokenService {
  
  // Get all tokens with price data
  async getTokensWithPrice(): Promise<{ success: boolean; data?: SimpleToken[]; error?: string }> {
    try {
      console.log('🔄 Fetching tokens with price data from MongoDB...')
      
      const tokensWithPrice = await mongoTokenService.getTokensWithPrice()
      
      if (!tokensWithPrice || tokensWithPrice.length === 0) {
        console.log('⚠️ No tokens found in MongoDB, initializing default tokens...')
        await mongoTokenService.initializeDefaultTokens()
        
        // Try again after initialization
        const retryTokens = await mongoTokenService.getTokensWithPrice()
        if (!retryTokens || retryTokens.length === 0) {
          return {
            success: false,
            error: 'No tokens available after initialization'
          }
        }
        
        return {
          success: true,
          data: retryTokens.map(token => this.mapToSimpleToken(token))
        }
      }

      const simpleTokens = tokensWithPrice.map(token => this.mapToSimpleToken(token))
      
      console.log(`✅ Successfully fetched ${simpleTokens.length} tokens from MongoDB`)
      
      return {
        success: true,
        data: simpleTokens
      }
    } catch (error) {
      console.error('❌ Error fetching tokens with price:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get all tokens (basic endpoint for admin)
  async getAllTokens(): Promise<{ success: boolean; data?: SimpleToken[]; error?: string }> {
    try {
      console.log('🔄 Fetching all tokens from MongoDB...')
      
      const tokens = await mongoTokenService.getAllTokens()
      
      if (!tokens || tokens.length === 0) {
        console.log('⚠️ No tokens found in MongoDB, initializing default tokens...')
        await mongoTokenService.initializeDefaultTokens()
        
        // Try again after initialization
        const retryTokens = await mongoTokenService.getAllTokens()
        if (!retryTokens || retryTokens.length === 0) {
          return {
            success: false,
            error: 'No tokens found even after initialization'
          }
        }
        
        return {
          success: true,
          data: retryTokens.map(token => this.mapToSimpleToken(token))
        }
      }
      
      const simpleTokens = tokens.map(token => this.mapToSimpleToken(token))
      
      console.log(`✅ Successfully fetched ${simpleTokens.length} tokens`)
      
      return {
        success: true,
        data: simpleTokens
      }
    } catch (error) {
      console.error('❌ Error fetching all tokens:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Get token by ID
  async getTokenById(tokenId: string): Promise<{ success: boolean; data?: SimpleToken; error?: string }> {
    try {
      const token = await mongoTokenService.getTokenById(tokenId)
      
      if (!token) {
        return {
          success: false,
          error: 'Token not found'
        }
      }

      const tokenWithPrice = mongoTokenService['mapTokenToTokenWithPrice'](token)
      const simpleToken = this.mapToSimpleToken(tokenWithPrice)

      return {
        success: true,
        data: simpleToken
      }
    } catch (error) {
      console.error(`❌ Error getting token ${tokenId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
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
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const success = await mongoTokenService.updateTokenPrice(tokenId, {
        ...priceData,
        last_price_update: new Date()
      })

      if (!success) {
        return {
          success: false,
          error: 'Failed to update token price'
        }
      }

      return { success: true }
    } catch (error) {
      console.error(`❌ Error updating token price ${tokenId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Update token holder data
  async updateTokenHolders(tokenId: string, holderData: {
    holder_count?: number
    holder_source?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const success = await mongoTokenService.updateTokenHolders(tokenId, {
        ...holderData,
        holder_last_update: new Date()
      })

      if (!success) {
        return {
          success: false,
          error: 'Failed to update token holders'
        }
      }

      return { success: true }
    } catch (error) {
      console.error(`❌ Error updating token holders ${tokenId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Clear price cache
  async clearPriceCache(tokenId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const success = await mongoTokenService.clearPriceCache(tokenId)

      if (!success) {
        return {
          success: false,
          error: 'Failed to clear price cache'
        }
      }

      return { success: true }
    } catch (error) {
      console.error(`❌ Error clearing price cache ${tokenId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Helper method to map TokenWithPrice to SimpleToken
  private mapToSimpleToken(token: TokenWithPrice): SimpleToken {
    // Generate a simple ID from the unique_id
    const id = token.unique_id || token.coin_gecko_id || 'unknown'

    // Determine risk level based on various factors
    const riskLevel = this.determineRiskLevel(token)
    
    // Calculate security score (simplified)
    const securityScore = this.calculateSecurityScore(token)

    return {
      id,
      uniqueId: token.unique_id || '',
      coinGeckoId: token.coin_gecko_id || '',
      name: token.name || '',
      symbol: token.symbol || '',
      contractAddress: token.contract_address,
      network: token.network,
      securityScore,
      riskLevel,
      auditStatus: 'UNAUDITED', // Default, can be updated later
      auditLinks: [],
      liquidityScore: token.totalLiquidity > 0 ? Math.min(100, (token.totalLiquidity / 1000000) * 10) : 0,
      holderCount: token.holder_count || 0,
      marketCap: token.marketCap,
      volume24h: token.volume24h,
      price: token.price,
      priceChange24h: token.priceChange24h,
      pairsCount: token.pairsCount,
      totalLiquidity: token.totalLiquidity,
      source: token.source,
      lastUpdated: token.lastUpdated,
      reliability: token.reliability
    }
  }

  // Determine risk level based on token data
  private determineRiskLevel(token: TokenWithPrice): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    let riskScore = 0

    // Market cap risk
    if (token.marketCap < 1000000) riskScore += 3 // Very low market cap
    else if (token.marketCap < 10000000) riskScore += 2 // Low market cap
    else if (token.marketCap < 100000000) riskScore += 1 // Medium market cap

    // Liquidity risk
    if (token.totalLiquidity < 100000) riskScore += 3 // Very low liquidity
    else if (token.totalLiquidity < 1000000) riskScore += 2 // Low liquidity
    else if (token.totalLiquidity < 10000000) riskScore += 1 // Medium liquidity

    // Price volatility risk
    if (Math.abs(token.priceChange24h) > 50) riskScore += 2 // High volatility
    else if (Math.abs(token.priceChange24h) > 20) riskScore += 1 // Medium volatility

    // Holder count risk
    if (token.holder_count && token.holder_count < 100) riskScore += 2 // Very few holders
    else if (token.holder_count && token.holder_count < 1000) riskScore += 1 // Few holders

    // Determine risk level
    if (riskScore >= 6) return 'CRITICAL'
    if (riskScore >= 4) return 'HIGH'
    if (riskScore >= 2) return 'MEDIUM'
    return 'LOW'
  }

  // Calculate security score (simplified)
  private calculateSecurityScore(token: TokenWithPrice): number {
    let score = 50 // Base score

    // Market cap bonus
    if (token.marketCap > 1000000000) score += 20 // Large cap
    else if (token.marketCap > 100000000) score += 15 // Mid cap
    else if (token.marketCap > 10000000) score += 10 // Small cap

    // Liquidity bonus
    if (token.totalLiquidity > 10000000) score += 15 // High liquidity
    else if (token.totalLiquidity > 1000000) score += 10 // Medium liquidity
    else if (token.totalLiquidity > 100000) score += 5 // Low liquidity

    // Holder count bonus
    if (token.holder_count && token.holder_count > 10000) score += 10 // Many holders
    else if (token.holder_count && token.holder_count > 1000) score += 5 // Some holders

    // Price stability bonus
    if (Math.abs(token.priceChange24h) < 5) score += 5 // Stable price
    else if (Math.abs(token.priceChange24h) < 15) score += 2 // Somewhat stable

    return Math.min(100, Math.max(0, score))
  }
}

// Export singleton instance
export const mongoSimpleTokenService = new MongoSimpleTokenService()
