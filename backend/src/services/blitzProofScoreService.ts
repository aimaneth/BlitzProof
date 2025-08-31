import { Pool } from 'pg'
import redis from '../config/redis'
import { BlitzProofDataCollectionService } from './blitzProofDataCollectionService'
import { BlitzProofScoringEngine } from './blitzProofScoringEngine'

export interface BlitzProofScore {
  tokenId: string
  overallScore: number
  rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D'
  categories: {
    codeSecurity: number
    market: number
    governance: number
    fundamental: number
    community: number
    operational: number
  }
  summary: {
    verified: number
    informational: number
    warnings: number
    critical: number
  }
  lastUpdated: Date
  updatedBy: string
}

export interface TokenInfo {
  tokenId: string
  name: string
  symbol: string
  rank: number
  audits: number
  website: string
  contractAddress: string
  contractScore: number
  tags: string[]
  socials: {
    twitter?: string
    telegram?: string
    discord?: string
    github?: string
    linkedin?: string
    medium?: string
    website?: string
  }
  description: string
  lastUpdated: Date
  updatedBy: string
}

export class BlitzProofScoreService {
  private pool: Pool
  private dataCollectionService: BlitzProofDataCollectionService
  private scoringEngine: BlitzProofScoringEngine

  constructor(pool: Pool) {
    this.pool = pool
    this.dataCollectionService = new BlitzProofDataCollectionService(pool)
    this.scoringEngine = new BlitzProofScoringEngine(this.dataCollectionService)
  }

  // Get BlitzProof score for a token
  async getBlitzProofScore(tokenId: string, contractAddress?: string): Promise<BlitzProofScore | null> {
    try {
      const cacheKey = `blitzproof:score:${tokenId}`
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Try to get from database first
      const query = `
        SELECT * FROM blitzproof_scores 
        WHERE token_id = $1 
        ORDER BY last_updated DESC 
        LIMIT 1
      `
      const result = await this.pool.query(query, [tokenId])
      
      if (result.rows.length > 0) {
        const score = result.rows[0]
        const blitzProofScore: BlitzProofScore = {
          tokenId: score.token_id,
          overallScore: score.overall_score,
          rating: score.rating,
          categories: {
            codeSecurity: score.code_security,
            market: score.market,
            governance: score.governance,
            fundamental: score.fundamental,
            community: score.community,
            operational: score.operational
          },
          summary: {
            verified: score.verified_count,
            informational: score.informational_count,
            warnings: score.warnings_count,
            critical: score.critical_count
          },
          lastUpdated: score.last_updated,
          updatedBy: score.updated_by
        }

        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(blitzProofScore))
        return blitzProofScore
      }

      // If no cached score, calculate new one
      console.log(`🔄 Calculating new BlitzProof score for ${tokenId}`)
      const calculatedScore = await this.scoringEngine.calculateBlitzProofScore(tokenId, contractAddress)
      
      // Save to database
      await this.saveScoreToDatabase(tokenId, calculatedScore, 'system')

      const blitzProofScore: BlitzProofScore = {
        tokenId,
        overallScore: calculatedScore.overallScore,
        rating: calculatedScore.rating as any,
        categories: calculatedScore.categories,
        summary: calculatedScore.summary,
        lastUpdated: new Date(),
        updatedBy: 'system'
      }

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(blitzProofScore))
      
      return blitzProofScore
    } catch (error) {
      console.error('Error getting BlitzProof score:', error)
      throw error
    }
  }

  // Save score to database
  private async saveScoreToDatabase(tokenId: string, scoreData: any, updatedBy: string): Promise<void> {
    try {
      const query = `
        INSERT INTO blitzproof_scores (
          token_id, overall_score, rating, code_security, market, governance, 
          fundamental, community, operational, verified_count, informational_count, 
          warnings_count, critical_count, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (token_id) DO UPDATE SET
          overall_score = EXCLUDED.overall_score,
          rating = EXCLUDED.rating,
          code_security = EXCLUDED.code_security,
          market = EXCLUDED.market,
          governance = EXCLUDED.governance,
          fundamental = EXCLUDED.fundamental,
          community = EXCLUDED.community,
          operational = EXCLUDED.operational,
          verified_count = EXCLUDED.verified_count,
          informational_count = EXCLUDED.informational_count,
          warnings_count = EXCLUDED.warnings_count,
          critical_count = EXCLUDED.critical_count,
          updated_by = EXCLUDED.updated_by,
          last_updated = NOW()
      `

      await this.pool.query(query, [
        tokenId,
        scoreData.overallScore,
        scoreData.rating,
        scoreData.categories.codeSecurity,
        scoreData.categories.market,
        scoreData.categories.governance,
        scoreData.categories.fundamental,
        scoreData.categories.community,
        scoreData.categories.operational,
        scoreData.summary.verified,
        scoreData.summary.informational,
        scoreData.summary.warnings,
        scoreData.summary.critical,
        updatedBy
      ])

      // Clear cache
      const cacheKey = `blitzproof:score:${tokenId}`
      await redis.del(cacheKey)
    } catch (error) {
      console.error('Error saving score to database:', error)
      throw error
    }
  }

  // Update BlitzProof score (admin only)
  async updateBlitzProofScore(tokenId: string, scoreData: Omit<BlitzProofScore, 'tokenId' | 'lastUpdated' | 'updatedBy'>, updatedBy: string): Promise<BlitzProofScore> {
    try {
      const query = `
        INSERT INTO blitzproof_scores (
          token_id, overall_score, rating, code_security, market, governance, 
          fundamental, community, operational, verified_count, informational_count, 
          warnings_count, critical_count, last_updated, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14)
        RETURNING *
      `
      
      const values = [
        tokenId,
        scoreData.overallScore,
        scoreData.rating,
        scoreData.categories.codeSecurity,
        scoreData.categories.market,
        scoreData.categories.governance,
        scoreData.categories.fundamental,
        scoreData.categories.community,
        scoreData.categories.operational,
        scoreData.summary.verified,
        scoreData.summary.informational,
        scoreData.summary.warnings,
        scoreData.summary.critical,
        updatedBy
      ]

      const result = await this.pool.query(query, values)
      const score = result.rows[0]

      const blitzProofScore: BlitzProofScore = {
        tokenId: score.token_id,
        overallScore: score.overall_score,
        rating: score.rating,
        categories: {
          codeSecurity: score.code_security,
          market: score.market,
          governance: score.governance,
          fundamental: score.fundamental,
          community: score.community,
          operational: score.operational
        },
        summary: {
          verified: score.verified_count,
          informational: score.informational_count,
          warnings: score.warnings_count,
          critical: score.critical_count
        },
        lastUpdated: score.last_updated,
        updatedBy: score.updated_by
      }

      // Clear cache
      await redis.del(`blitzproof:score:${tokenId}`)
      
      return blitzProofScore
    } catch (error) {
      console.error('Error updating BlitzProof score:', error)
      throw error
    }
  }

  // Get token info
  async getTokenInfo(tokenId: string): Promise<TokenInfo | null> {
    try {
      const cacheKey = `blitzproof:info:${tokenId}`
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      const query = `
        SELECT * FROM token_info 
        WHERE token_id = $1 
        ORDER BY last_updated DESC 
        LIMIT 1
      `
      const result = await this.pool.query(query, [tokenId])
      
      if (result.rows.length === 0) {
        return null
      }

      const info = result.rows[0]
      const tokenInfo: TokenInfo = {
        tokenId: info.token_id,
        name: info.name,
        symbol: info.symbol,
        rank: info.rank,
        audits: info.audits,
        website: info.website,
        contractAddress: info.contract_address,
        contractScore: info.contract_score,
        tags: info.tags,
        socials: info.socials,
        description: info.description,
        lastUpdated: info.last_updated,
        updatedBy: info.updated_by
      }

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(tokenInfo))
      
      return tokenInfo
    } catch (error) {
      console.error('Error getting token info:', error)
      throw error
    }
  }

  // Update token info (admin only)
  async updateTokenInfo(tokenId: string, infoData: Omit<TokenInfo, 'tokenId' | 'lastUpdated' | 'updatedBy'>, updatedBy: string): Promise<TokenInfo> {
    try {
      const query = `
        INSERT INTO token_info (
          token_id, name, symbol, rank, audits, website, contract_address, 
          contract_score, tags, socials, description, last_updated, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
        RETURNING *
      `
      
      const values = [
        tokenId,
        infoData.name,
        infoData.symbol,
        infoData.rank,
        infoData.audits,
        infoData.website,
        infoData.contractAddress,
        infoData.contractScore,
        infoData.tags,
        infoData.socials,
        infoData.description,
        updatedBy
      ]

      const result = await this.pool.query(query, values)
      const info = result.rows[0]

      const tokenInfo: TokenInfo = {
        tokenId: info.token_id,
        name: info.name,
        symbol: info.symbol,
        rank: info.rank,
        audits: info.audits,
        website: info.website,
        contractAddress: info.contract_address,
        contractScore: info.contract_score,
        tags: info.tags,
        socials: info.socials,
        description: info.description,
        lastUpdated: info.last_updated,
        updatedBy: info.updated_by
      }

      // Clear cache
      await redis.del(`blitzproof:info:${tokenId}`)
      
      return tokenInfo
    } catch (error) {
      console.error('Error updating token info:', error)
      throw error
    }
  }

  // Get all tokens with scores (for admin dashboard)
  async getAllTokensWithScores(): Promise<Array<BlitzProofScore & TokenInfo>> {
    try {
      const query = `
        SELECT 
          bs.*,
          ti.name, ti.symbol, ti.rank, ti.audits, ti.website, 
          ti.contract_address, ti.contract_score, ti.tags, ti.socials, ti.description
        FROM blitzproof_scores bs
        LEFT JOIN token_info ti ON bs.token_id = ti.token_id
        ORDER BY bs.last_updated DESC
      `
      
      const result = await this.pool.query(query)
      
      return result.rows.map(row => ({
        tokenId: row.token_id,
        overallScore: row.overall_score,
        rating: row.rating,
        categories: {
          codeSecurity: row.code_security,
          market: row.market,
          governance: row.governance,
          fundamental: row.fundamental,
          community: row.community,
          operational: row.operational
        },
        summary: {
          verified: row.verified_count,
          informational: row.informational_count,
          warnings: row.warnings_count,
          critical: row.critical_count
        },
        lastUpdated: row.last_updated,
        updatedBy: row.updated_by,
        name: row.name || 'Unknown',
        symbol: row.symbol || 'UNKNOWN',
        rank: row.rank || 0,
        audits: row.audits || 0,
        website: row.website || '',
        contractAddress: row.contract_address || '',
        contractScore: row.contract_score || 0,
        tags: row.tags || [],
        socials: row.socials || {},
        description: row.description || ''
      }))
    } catch (error) {
      console.error('Error getting all tokens with scores:', error)
      throw error
    }
  }

  // Delete token data (admin only)
  async deleteTokenData(tokenId: string): Promise<void> {
    try {
      await this.pool.query('DELETE FROM blitzproof_scores WHERE token_id = $1', [tokenId])
      await this.pool.query('DELETE FROM token_info WHERE token_id = $1', [tokenId])
      
      // Clear cache
      await redis.del(`blitzproof:score:${tokenId}`)
      await redis.del(`blitzproof:info:${tokenId}`)
    } catch (error) {
      console.error('Error deleting token data:', error)
      throw error
    }
  }
}
