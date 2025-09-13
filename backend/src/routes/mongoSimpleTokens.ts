import express from 'express'
import { mongoSimpleTokenService } from '../services/mongoSimpleTokenService'

const router = express.Router()

// Add JSON parsing middleware
router.use(express.json({ limit: '10mb' }))

// Get all tokens with price data
router.get('/with-price', async (req, res) => {
  try {
    console.log('🔄 GET /api/simple-tokens/with-price - Fetching tokens with price data from MongoDB')
    
    const result = await mongoSimpleTokenService.getTokensWithPrice()
    
    if (!result.success) {
      console.error('❌ Failed to get tokens with price:', result.error)
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to get tokens with price',
        details: 'MongoDB connection or query failed'
      })
    }

    console.log(`✅ Successfully returned ${result.data?.length || 0} tokens with price data`)
    
    res.json({
      success: true,
      tokens: result.data || [],
      total: result.data?.length || 0
    })
  } catch (error) {
    console.error('❌ Error in /api/simple-tokens/with-price:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get token by ID
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params
    console.log(`🔄 GET /api/simple-tokens/${tokenId} - Fetching token from MongoDB`)
    
    const result = await mongoSimpleTokenService.getTokenById(tokenId)
    
    if (!result.success) {
      console.error(`❌ Failed to get token ${tokenId}:`, result.error)
      return res.status(404).json({
        success: false,
        error: result.error || 'Token not found'
      })
    }

    console.log(`✅ Successfully returned token ${tokenId}`)
    
    res.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error(`❌ Error in /api/simple-tokens/${req.params.tokenId}:`, error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update token price data
router.put('/:tokenId/price', async (req, res) => {
  try {
    const { tokenId } = req.params
    const priceData = req.body
    
    console.log(`🔄 PUT /api/simple-tokens/${tokenId}/price - Updating token price in MongoDB`)
    
    const result = await mongoSimpleTokenService.updateTokenPrice(tokenId, priceData)
    
    if (!result.success) {
      console.error(`❌ Failed to update token price ${tokenId}:`, result.error)
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to update token price'
      })
    }

    console.log(`✅ Successfully updated token price ${tokenId}`)
    
    res.json({
      success: true,
      message: 'Token price updated successfully'
    })
  } catch (error) {
    console.error(`❌ Error in /api/simple-tokens/${req.params.tokenId}/price:`, error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update token holder data
router.put('/:tokenId/holders', async (req, res) => {
  try {
    const { tokenId } = req.params
    const holderData = req.body
    
    console.log(`🔄 PUT /api/simple-tokens/${tokenId}/holders - Updating token holders in MongoDB`)
    
    const result = await mongoSimpleTokenService.updateTokenHolders(tokenId, holderData)
    
    if (!result.success) {
      console.error(`❌ Failed to update token holders ${tokenId}:`, result.error)
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to update token holders'
      })
    }

    console.log(`✅ Successfully updated token holders ${tokenId}`)
    
    res.json({
      success: true,
      message: 'Token holders updated successfully'
    })
  } catch (error) {
    console.error(`❌ Error in /api/simple-tokens/${req.params.tokenId}/holders:`, error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Clear price cache
router.delete('/:tokenId/cache', async (req, res) => {
  try {
    const { tokenId } = req.params
    
    console.log(`🔄 DELETE /api/simple-tokens/${tokenId}/cache - Clearing price cache in MongoDB`)
    
    const result = await mongoSimpleTokenService.clearPriceCache(tokenId)
    
    if (!result.success) {
      console.error(`❌ Failed to clear price cache ${tokenId}:`, result.error)
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to clear price cache'
      })
    }

    console.log(`✅ Successfully cleared price cache ${tokenId}`)
    
    res.json({
      success: true,
      message: 'Price cache cleared successfully'
    })
  } catch (error) {
    console.error(`❌ Error in /api/simple-tokens/${req.params.tokenId}/cache:`, error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
