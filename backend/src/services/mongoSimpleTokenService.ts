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
  // New fields from admin form
  category?: string
  priority?: number
  monitoringStrategy?: string
  rank?: number
  contractScore?: number
  auditsCount?: number
  // Complex data structures from frontend form
  socials?: Array<{ platform: string; url: string }>
  contracts?: Array<{ network: string; contractAddress: string }>
  explorers?: Array<{ explorerName: string; explorerUrl: string; network: string }>
  wallets?: Array<{ walletName: string; walletUrl: string; walletType: string }>
  sourceCode?: Array<{ sourceType: string; sourceName: string; sourceUrl: string; network: string }>
  tags?: string[]
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
          data: retryTokens.map(token => this.mapTokenToSimpleToken(token))
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
          data: retryTokens.map(token => this.mapTokenToSimpleToken(token))
        }
      }
      
      const simpleTokens = tokens.map(token => this.mapTokenToSimpleToken(token))
      
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

  // Add new token
  async addToken(tokenData: Partial<SimpleToken>): Promise<{ success: boolean; data?: SimpleToken; error?: string; details?: string[] }> {
    try {
      console.log('🔄 Adding new token to MongoDB...')
      
      // Validate required fields
      const errors: string[] = []
      if (!tokenData.uniqueId) errors.push('uniqueId is required')
      if (!tokenData.name) errors.push('name is required')
      if (!tokenData.symbol) errors.push('symbol is required')
      
      if (errors.length > 0) {
        return {
          success: false,
          error: 'Validation failed',
          details: errors
        }
      }

      // Check if token already exists
      const existingToken = await mongoTokenService.getTokenById(tokenData.uniqueId!)
      if (existingToken) {
        return {
          success: false,
          error: 'Token with this uniqueId already exists',
          details: ['A token with this uniqueId is already in the database']
        }
      }

      // Extract social media links from socials array
      const socials = tokenData.socials || []
      const twitter = socials.find((s: any) => s.platform === 'twitter')?.url || ''
      const telegram = socials.find((s: any) => s.platform === 'telegram')?.url || ''
      const discord = socials.find((s: any) => s.platform === 'discord')?.url || ''
      const reddit = socials.find((s: any) => s.platform === 'reddit')?.url || ''
      const github = socials.find((s: any) => s.platform === 'github')?.url || ''
      const whitepaper = socials.find((s: any) => s.platform === 'whitepaper')?.url || ''

      // Extract contract address from contracts array (use first one)
      const contracts = tokenData.contracts || []
      const contractAddress = contracts.length > 0 ? contracts[0].contractAddress : ''

      // Extract audit links from auditLinks array
      const auditLinks = tokenData.auditLinks || []
      const auditLinksArray = Array.isArray(auditLinks) 
        ? auditLinks.map((audit: any) => audit.auditUrl || audit).filter((url: string) => url)
        : []

      // Map SimpleToken to Token format
      const tokenToAdd = {
        unique_id: tokenData.uniqueId,
        coin_gecko_id: tokenData.coinGeckoId && tokenData.coinGeckoId.trim() ? tokenData.coinGeckoId : tokenData.uniqueId,
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description || '',
        website: tokenData.website || '',
        twitter: twitter,
        telegram: telegram,
        discord: discord,
        reddit: reddit,
        github: github,
        whitepaper: whitepaper,
        contract_address: contractAddress,
        network: tokenData.network || '',
        audit_status: tokenData.auditStatus || 'UNAUDITED',
        audit_links: auditLinksArray,
        // Additional fields from the new structure
        category: tokenData.category || '',
        priority: tokenData.priority || 50,
        risk_level: tokenData.riskLevel || 'MEDIUM',
        monitoring_strategy: tokenData.monitoringStrategy || 'REAL_TIME',
        rank: tokenData.rank || 0,
        holder_count: tokenData.holderCount || 0,
        contract_score: tokenData.contractScore || 0,
        audits_count: tokenData.auditsCount || 0,
        created_at: new Date(),
        updated_at: new Date()
      }

      const success = await mongoTokenService.upsertToken(tokenToAdd)
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to add token to database'
        }
      }

      // Get the added token
      const addedToken = await mongoTokenService.getTokenById(tokenData.uniqueId!)
      if (!addedToken) {
        return {
          success: false,
          error: 'Token was added but could not be retrieved'
        }
      }

      const simpleToken = this.mapTokenToSimpleToken(addedToken)
      
      console.log(`✅ Successfully added token: ${simpleToken.name}`)
      
      return {
        success: true,
        data: simpleToken
      }
    } catch (error) {
      console.error('❌ Error adding token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Update token
  async updateToken(uniqueId: string, updates: Partial<SimpleToken>): Promise<{ success: boolean; data?: SimpleToken; error?: string; details?: string[] }> {
    try {
      console.log(`🔄 Updating token ${uniqueId} in MongoDB...`)
      
      // Check if token exists
      const existingToken = await mongoTokenService.getTokenById(uniqueId)
      if (!existingToken) {
        return {
          success: false,
          error: 'Token not found',
          details: ['No token found with the provided uniqueId']
        }
      }

      // Map SimpleToken updates to Token format
      const tokenUpdates: any = {
        updated_at: new Date()
      }

      if (updates.name !== undefined) tokenUpdates.name = updates.name
      if (updates.symbol !== undefined) tokenUpdates.symbol = updates.symbol
      if (updates.description !== undefined) tokenUpdates.description = updates.description
      if (updates.website !== undefined) tokenUpdates.website = updates.website
      if (updates.twitter !== undefined) tokenUpdates.twitter = updates.twitter
      if (updates.telegram !== undefined) tokenUpdates.telegram = updates.telegram
      if (updates.discord !== undefined) tokenUpdates.discord = updates.discord
      if (updates.reddit !== undefined) tokenUpdates.reddit = updates.reddit
      if (updates.github !== undefined) tokenUpdates.github = updates.github
      if (updates.whitepaper !== undefined) tokenUpdates.whitepaper = updates.whitepaper
      if (updates.contractAddress !== undefined) tokenUpdates.contract_address = updates.contractAddress
      if (updates.network !== undefined) tokenUpdates.network = updates.network
      if (updates.coinGeckoId !== undefined) tokenUpdates.coin_gecko_id = updates.coinGeckoId
      if (updates.auditStatus !== undefined) tokenUpdates.audit_status = updates.auditStatus
      if (updates.auditLinks !== undefined) tokenUpdates.audit_links = updates.auditLinks

      const success = await mongoTokenService.updateToken(uniqueId, tokenUpdates)
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to update token in database'
        }
      }

      // Get the updated token
      const updatedToken = await mongoTokenService.getTokenById(uniqueId)
      if (!updatedToken) {
        return {
          success: false,
          error: 'Token was updated but could not be retrieved'
        }
      }

      const simpleToken = this.mapTokenToSimpleToken(updatedToken)
      
      console.log(`✅ Successfully updated token: ${simpleToken.name}`)
      
      return {
        success: true,
        data: simpleToken
      }
    } catch (error) {
      console.error('❌ Error updating token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Delete token
  async deleteToken(uniqueId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Deleting token ${uniqueId} from MongoDB...`)
      
      // Check if token exists
      const existingToken = await mongoTokenService.getTokenById(uniqueId)
      if (!existingToken) {
        return {
          success: false,
          error: 'Token not found'
        }
      }

      const success = await mongoTokenService.deleteToken(uniqueId)
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to delete token from database'
        }
      }
      
      console.log(`✅ Successfully deleted token: ${uniqueId}`)
      
      return {
        success: true
      }
    } catch (error) {
      console.error('❌ Error deleting token:', error)
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

  // Helper method to map Token to SimpleToken (for basic token data)
  private mapTokenToSimpleToken(token: any): SimpleToken {
    // Generate a simple ID from the unique_id
    const id = token.unique_id || token.coin_gecko_id || 'unknown'

    // Determine risk level based on various factors
    const riskLevel = this.determineRiskLevel(token)
    
    // Calculate security score (simplified)
    const securityScore = this.calculateSecurityScore(token)

    return {
      id,
      uniqueId: token.unique_id || token.coin_gecko_id || 'unknown',
      coinGeckoId: token.coin_gecko_id || '',
      name: token.name || 'Unknown Token',
      symbol: token.symbol || 'UNKNOWN',
      description: token.description || '',
      logoUrl: token.logo_url || '',
      website: token.website || '',
      twitter: token.twitter || '',
      telegram: token.telegram || '',
      discord: token.discord || '',
      reddit: token.reddit || '',
      github: token.github || '',
      whitepaper: token.whitepaper || '',
      contractAddress: token.contract_address || undefined,
      network: token.network || 'ethereum',
      securityScore: securityScore,
      riskLevel: riskLevel,
      auditStatus: token.audit_status || 'UNAUDITED',
      auditLinks: token.audit_links || [],
      liquidityScore: token.liquidity_score || 0,
      holderCount: token.holder_count || 0,
      marketCap: token.market_cap || 0,
      volume24h: token.volume_24h || 0,
      price: token.current_price || 0,
      priceChange24h: token.price_change_24h || 0,
      pairsCount: token.pairs_count || 0,
      totalLiquidity: token.total_liquidity || 0,
      source: token.source || 'manual',
      lastUpdated: token.last_updated ? new Date(token.last_updated) : new Date(),
      reliability: token.reliability || 0,
      // New fields from admin form
      category: token.category || '',
      priority: token.priority || 50,
      monitoringStrategy: token.monitoring_strategy || 'REAL_TIME',
      rank: token.rank || 0,
      contractScore: token.contract_score || 0,
      auditsCount: token.audits_count || 0
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
      description: token.description || '',
      logoUrl: '',
      website: token.website || '',
      twitter: token.twitter || '',
      telegram: token.telegram || '',
      discord: token.discord || '',
      reddit: token.reddit || '',
      github: token.github || '',
      whitepaper: token.whitepaper || '',
      contractAddress: token.contract_address,
      network: token.network,
      securityScore,
      riskLevel,
      auditStatus: (token.audit_status as 'AUDITED' | 'UNAUDITED' | 'PENDING') || 'UNAUDITED',
      auditLinks: token.audit_links || [],
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
