import express from 'express'
import { mongoSimpleTokenService } from '../services/mongoSimpleTokenService'
import { mongoTokenService } from '../services/mongoTokenService'
import { getMongoDB } from '../config/mongodb'

const router = express.Router()

// Add JSON parsing middleware
router.use(express.json({ limit: '10mb' }))

// Get all tokens (basic endpoint for admin)
router.get('/', async (req, res) => {
  try {
    console.log('🔄 GET /api/simple-tokens - Fetching all tokens from MongoDB')
    
    const result = await mongoSimpleTokenService.getAllTokens()
    
    if (!result.success) {
      console.error('❌ Failed to get tokens:', result.error)
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to get tokens',
        details: 'MongoDB connection or query failed'
      })
    }

    console.log(`✅ Successfully returned ${result.data?.length || 0} tokens`)
    
    res.json({
      success: true,
      tokens: result.data || [],
      total: result.data?.length || 0
    })
  } catch (error) {
    console.error('❌ Error in /api/simple-tokens:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

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
      token: result.data
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

// Get token with price data
router.get('/:tokenId/price', async (req, res) => {
  try {
    const { tokenId } = req.params
    
    console.log(`🔄 GET /api/simple-tokens/${tokenId}/price - Fetching token with price data from MongoDB`)
    
    const result = await mongoSimpleTokenService.getTokenById(tokenId)
    
    if (!result.success) {
      console.error(`❌ Failed to get token with price ${tokenId}:`, result.error)
      return res.status(404).json({
        success: false,
        error: result.error || 'Token not found'
      })
    }

    console.log(`✅ Successfully returned token with price data ${tokenId}`)
    
    res.json({
      success: true,
      token: result.data
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


// Add new token
router.post('/', async (req, res) => {
  try {
    const tokenData = req.body
    console.log('🔄 POST /api/simple-tokens - Adding new token to MongoDB')
    
    const result = await mongoSimpleTokenService.addToken(tokenData)
    
    if (!result.success) {
      console.error('❌ Failed to add token:', result.error)
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to add token',
        details: result.details || []
      })
    }

    console.log(`✅ Successfully added token: ${result.data?.name}`)
    
    res.status(201).json({
      success: true,
      message: 'Token added successfully',
      token: result.data
    })
  } catch (error) {
    console.error('❌ Error in POST /api/simple-tokens:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update token
router.put('/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params
    const updates = req.body
    
    console.log(`🔄 PUT /api/simple-tokens/${uniqueId} - Updating token in MongoDB`)
    
    const result = await mongoSimpleTokenService.updateToken(uniqueId, updates)
    
    if (!result.success) {
      console.error(`❌ Failed to update token ${uniqueId}:`, result.error)
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to update token',
        details: result.details || []
      })
    }

    console.log(`✅ Successfully updated token ${uniqueId}`)
    
    res.json({
      success: true,
      message: 'Token updated successfully',
      token: result.data
    })
  } catch (error) {
    console.error(`❌ Error in PUT /api/simple-tokens/${req.params.uniqueId}:`, error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete token
router.delete('/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params
    
    console.log(`🔄 DELETE /api/simple-tokens/${uniqueId} - Deleting token from MongoDB`)
    
    const result = await mongoSimpleTokenService.deleteToken(uniqueId)
    
    if (!result.success) {
      console.error(`❌ Failed to delete token ${uniqueId}:`, result.error)
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to delete token'
      })
    }

    console.log(`✅ Successfully deleted token ${uniqueId}`)
    
    res.json({
      success: true,
      message: 'Token deleted successfully'
    })
  } catch (error) {
    console.error(`❌ Error in DELETE /api/simple-tokens/${req.params.uniqueId}:`, error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get token fundamental data
router.get('/:tokenId/fundamental', async (req, res) => {
  try {
    const { tokenId } = req.params
    
    console.log(`🔄 GET /api/simple-tokens/${tokenId}/fundamental - Fetching token fundamental data from MongoDB`)
    
    // For now, return mock fundamental data since we don't have this implemented yet
    const mockFundamentalData = {
      healthScore: {
        overall: 85
      },
      performance: {
        marketCap: 1000000000 // Mock data
      },
      supplyMetrics: {
        circulatingRatio: 75.5
      },
      liquidity: {
        totalLiquidityUSD: 50000000,
        liquidityHealth: 'HIGH',
        volume24h: 2500000,
        liquidityPairs: 12
      },
      utility: {
        stakingEnabled: true,
        defiIntegration: true
      },
      riskFactors: {
        concentrationRisk: 'LOW',
        technicalRisk: 'MEDIUM'
      },
      tokenomics: {
        stakingAPY: 8.5
      },
      development: {
        auditCount: 3,
        teamSize: 12,
        partnershipCount: 5,
        roadmapProgress: 80
      },
      distribution: {
        top10Holders: 25.3
      }
    }
    
    console.log(`✅ Successfully returned fundamental data for ${tokenId}`)
    
    res.json({
      success: true,
      data: mockFundamentalData
    })
  } catch (error) {
    console.error(`❌ Error in /api/simple-tokens/${req.params.tokenId}/fundamental:`, error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update token with comprehensive data
router.post('/update-comprehensive-data', async (req, res) => {
  try {
    console.log('🔄 POST /api/simple-tokens/update-comprehensive-data - Updating tokens with comprehensive data')
    
    const comprehensiveTokenData = {
      'bitcoin': {
        description: 'Bitcoin is a decentralized digital currency that enables peer-to-peer transactions without the need for a central authority. It was created in 2009 by an anonymous person or group using the pseudonym Satoshi Nakamoto.',
        website: 'https://bitcoin.org',
        twitter: 'https://twitter.com/bitcoin',
        reddit: 'https://reddit.com/r/bitcoin',
        github: 'https://github.com/bitcoin/bitcoin',
        whitepaper: 'https://bitcoin.org/bitcoin.pdf',
        audit_status: 'AUDITED',
        audit_links: ['https://bitcoin.org/bitcoin.pdf']
      },
      'ethereum': {
        description: 'Ethereum is a decentralized platform that runs smart contracts: applications that run exactly as programmed without any possibility of downtime, censorship, fraud or third-party interference.',
        website: 'https://ethereum.org',
        twitter: 'https://twitter.com/ethereum',
        reddit: 'https://reddit.com/r/ethereum',
        github: 'https://github.com/ethereum/go-ethereum',
        whitepaper: 'https://ethereum.org/en/whitepaper/',
        telegram: 'https://t.me/ethereum',
        discord: 'https://discord.gg/ethereum',
        audit_status: 'AUDITED',
        audit_links: ['https://ethereum.org/en/whitepaper/']
      },
      'cardano': {
        description: 'Cardano is a blockchain platform for changemakers, innovators, and visionaries, with the tools and technologies required to create possibility for the many, as well as the few, and bring about positive global change.',
        website: 'https://cardano.org',
        twitter: 'https://twitter.com/cardano',
        reddit: 'https://reddit.com/r/cardano',
        github: 'https://github.com/input-output-hk/cardano-node',
        whitepaper: 'https://cardano.org/whitepaper/',
        telegram: 'https://t.me/cardano',
        discord: 'https://discord.gg/cardano',
        audit_status: 'AUDITED',
        audit_links: ['https://cardano.org/whitepaper/']
      },
      'dogecoin': {
        description: 'Dogecoin is an open source peer-to-peer digital currency, favored by Shiba Inus worldwide. It was created as a fun, light-hearted cryptocurrency that would have broader appeal beyond the core Bitcoin audience.',
        website: 'https://dogecoin.com',
        twitter: 'https://twitter.com/dogecoin',
        reddit: 'https://reddit.com/r/dogecoin',
        github: 'https://github.com/dogecoin/dogecoin',
        whitepaper: 'https://github.com/dogecoin/dogecoin/blob/master/README.md',
        telegram: 'https://t.me/dogecoin',
        discord: 'https://discord.gg/dogecoin',
        audit_status: 'AUDITED',
        audit_links: ['https://github.com/dogecoin/dogecoin/blob/master/README.md']
      },
      'blox-myrc': {
        description: 'Blox MYRC is a revolutionary token built on the Arbitrum network, designed to provide innovative solutions in the DeFi space with advanced security features and community-driven governance.',
        website: 'https://blox.xyz',
        twitter: 'https://twitter.com/blox_xyz',
        reddit: 'https://reddit.com/r/blox',
        github: 'https://github.com/blox-xyz',
        whitepaper: 'https://blox.xyz/whitepaper.pdf',
        telegram: 'https://t.me/blox_community',
        discord: 'https://discord.gg/blox',
        audit_status: 'AUDITED',
        audit_links: ['https://blox.xyz/audit-report.pdf']
      }
    }

    // Update each token with comprehensive data
    const updatePromises = Object.entries(comprehensiveTokenData).map(async ([tokenId, data]) => {
      const result = await mongoSimpleTokenService.updateToken(tokenId, data)
      return { tokenId, success: result.success, error: result.error }
    })

    const results = await Promise.all(updatePromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success)

    console.log(`✅ Successfully updated ${successful} tokens with comprehensive data`)
    if (failed.length > 0) {
      console.log(`❌ Failed to update ${failed.length} tokens:`, failed)
    }
    
    res.json({
      success: true,
      message: `Updated ${successful} tokens with comprehensive data`,
      results: {
        successful,
        failed: failed.length,
        details: results
      }
    })
  } catch (error) {
    console.error('❌ Error updating tokens with comprehensive data:', error)
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

// Debug endpoint to see raw database data
router.get('/debug/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params
    
    console.log(`🔍 DEBUG: Getting raw database data for ${tokenId}`)
    
    // Get raw data from MongoDB service
    const rawToken = await mongoTokenService.getTokenById(tokenId)
    
    console.log(`🔍 DEBUG: Raw token data:`, rawToken)
    
    if (!rawToken) {
      return res.status(404).json({
        success: false,
        error: 'Token not found in database'
      })
    }
    
    res.json({
      success: true,
      message: 'Raw database data',
      rawData: rawToken
    })
  } catch (error) {
    console.error(`❌ Error in debug endpoint:`, error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
