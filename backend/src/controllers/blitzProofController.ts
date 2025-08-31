import { Request, Response } from 'express'
import { BlitzProofScoreService } from '../services/blitzProofScoreService'
import { AuthRequest } from '../middleware/auth'
import pool from '../config/postgres'
import redis from '../config/redis'

const blitzProofService = new BlitzProofScoreService(pool)

export class BlitzProofController {
  // Get BlitzProof score for a token
  static async getBlitzProofScore(req: Request, res: Response) {
    try {
      const { tokenId } = req.params
      
      if (!tokenId) {
        return res.status(400).json({
          success: false,
          error: 'Token ID is required'
        })
      }

      const score = await blitzProofService.getBlitzProofScore(tokenId)
      
      if (!score) {
        return res.status(404).json({
          success: false,
          error: 'BlitzProof score not found for this token'
        })
      }

      res.json({
        success: true,
        data: score
      })
    } catch (error) {
      console.error('Error getting BlitzProof score:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // Update BlitzProof score (admin only)
  static async updateBlitzProofScore(req: AuthRequest, res: Response) {
    try {
      const { tokenId } = req.params
      const { overallScore, rating, categories, summary } = req.body
      const updatedBy = req.user?.userId?.toString() || 'admin' // Get from auth middleware

      if (!tokenId) {
        return res.status(400).json({
          success: false,
          error: 'Token ID is required'
        })
      }

      if (!overallScore || !rating || !categories || !summary) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: overallScore, rating, categories, summary'
        })
      }

      const updatedScore = await blitzProofService.updateBlitzProofScore(
        tokenId,
        { overallScore, rating, categories, summary },
        updatedBy
      )

      res.json({
        success: true,
        data: updatedScore,
        message: 'BlitzProof score updated successfully'
      })
    } catch (error) {
      console.error('Error updating BlitzProof score:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // Get token info
  static async getTokenInfo(req: Request, res: Response) {
    try {
      const { tokenId } = req.params
      
      if (!tokenId) {
        return res.status(400).json({
          success: false,
          error: 'Token ID is required'
        })
      }

      const info = await blitzProofService.getTokenInfo(tokenId)
      
      if (!info) {
        return res.status(404).json({
          success: false,
          error: 'Token info not found'
        })
      }

      res.json({
        success: true,
        data: info
      })
    } catch (error) {
      console.error('Error getting token info:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // Update token info (admin only)
  static async updateTokenInfo(req: AuthRequest, res: Response) {
    try {
      const { tokenId } = req.params
      const { name, symbol, rank, audits, website, contractAddress, contractScore, tags, socials, description } = req.body
      const updatedBy = req.user?.userId?.toString() || 'admin' // Get from auth middleware

      if (!tokenId) {
        return res.status(400).json({
          success: false,
          error: 'Token ID is required'
        })
      }

      if (!name || !symbol) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, symbol'
        })
      }

      const updatedInfo = await blitzProofService.updateTokenInfo(
        tokenId,
        { name, symbol, rank, audits, website, contractAddress, contractScore, tags, socials, description },
        updatedBy
      )

      res.json({
        success: true,
        data: updatedInfo,
        message: 'Token info updated successfully'
      })
    } catch (error) {
      console.error('Error updating token info:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // Get all tokens with scores (admin dashboard)
  static async getAllTokensWithScores(req: Request, res: Response) {
    try {
      const tokens = await blitzProofService.getAllTokensWithScores()

      res.json({
        success: true,
        data: tokens
      })
    } catch (error) {
      console.error('Error getting all tokens with scores:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // Delete token data (admin only)
  static async deleteTokenData(req: Request, res: Response) {
    try {
      const { tokenId } = req.params

      if (!tokenId) {
        return res.status(400).json({
          success: false,
          error: 'Token ID is required'
        })
      }

      await blitzProofService.deleteTokenData(tokenId)

      res.json({
        success: true,
        message: 'Token data deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting token data:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // Get combined token data (score + info)
  static async getCombinedTokenData(req: Request, res: Response) {
    try {
      const { tokenId } = req.params
      
      if (!tokenId) {
        return res.status(400).json({
          success: false,
          error: 'Token ID is required'
        })
      }

      const [score, info] = await Promise.all([
        blitzProofService.getBlitzProofScore(tokenId),
        blitzProofService.getTokenInfo(tokenId)
      ])

      if (!score && !info) {
        return res.status(404).json({
          success: false,
          error: 'Token data not found'
        })
      }

      res.json({
        success: true,
        data: {
          blitzProofScore: score,
          tokenInfo: info
        }
      })
    } catch (error) {
      console.error('Error getting combined token data:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  // Calculate BlitzProof score for a token
  static async calculateBlitzProofScore(req: Request, res: Response) {
    try {
      const { tokenId } = req.params
      const { contractAddress } = req.body
      
      if (!tokenId) {
        return res.status(400).json({
          success: false,
          error: 'Token ID is required'
        })
      }

      console.log(`🔄 Calculating BlitzProof score for ${tokenId}`)
      
      // Force recalculation by clearing cache first
      const cacheKey = `blitzproof:score:${tokenId}`
      await redis.del(cacheKey)
      
      const score = await blitzProofService.getBlitzProofScore(tokenId, contractAddress)
      
      if (!score) {
        return res.status(404).json({
          success: false,
          error: 'Failed to calculate BlitzProof score'
        })
      }

      res.json({
        success: true,
        data: score,
        message: 'BlitzProof score calculated successfully'
      })
    } catch (error) {
      console.error('Error calculating BlitzProof score:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }
}
