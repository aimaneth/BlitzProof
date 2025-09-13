import express from 'express'
import { mongoPriceDataService } from '../services/mongoPriceDataService'

const router = express.Router()

// 🆕 GET TOKEN PRICE DATA
// GET /api/price-data/:tokenId
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params
    const { refresh = 'false' } = req.query

    console.log(`📊 Price data request for: ${tokenId}, refresh: ${refresh}`)

    if (refresh === 'true') {
      // Force refresh from APIs
      const freshData = await mongoPriceDataService.refreshTokenPrice(tokenId)
      res.json({
        success: true,
        data: freshData,
        message: 'Price data refreshed successfully'
      })
    } else {
      // Get cached data first, refresh if stale
      const cachedData = await mongoPriceDataService.getCachedPrice(tokenId)
      
      if (cachedData && cachedData.price > 0) {
        // Check if data is fresh (less than 5 minutes old)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        if (cachedData.lastUpdated > fiveMinutesAgo) {
          res.json({
            success: true,
            data: cachedData,
            message: 'Cached price data retrieved',
            source: 'cache'
          })
          return
        }
      }

      // Data is stale or missing, refresh it
      const freshData = await mongoPriceDataService.refreshTokenPrice(tokenId)
      res.json({
        success: true,
        data: freshData,
        message: 'Price data refreshed successfully',
        source: 'api'
      })
    }

  } catch (error) {
    console.error('❌ Price data API error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price data',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 🆕 REFRESH TOKEN PRICE
// POST /api/price-data/:tokenId/refresh
router.post('/:tokenId/refresh', async (req, res) => {
  try {
    const { tokenId } = req.params

    console.log(`🔄 Force refresh price data for: ${tokenId}`)

    const freshData = await mongoPriceDataService.refreshTokenPrice(tokenId)
    
    res.json({
      success: true,
      data: freshData,
      message: 'Price data refreshed successfully'
    })

  } catch (error) {
    console.error('❌ Price refresh API error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to refresh price data',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 🚀 AUTO-REFRESH ALL PRICES (PREVENT STALE DATA)
// POST /api/price-data/auto-refresh
router.post('/auto-refresh', async (req, res) => {
  try {
    console.log(`🚀 Starting auto-refresh of all prices...`)

    // Run auto-refresh in background
    mongoPriceDataService.autoRefreshAllPrices().catch(error => {
      console.error('❌ Auto-refresh failed:', error)
    })

    res.json({
      success: true,
      message: 'Auto-refresh started - all prices will be updated with fresh data'
    })

  } catch (error) {
    console.error('❌ Error starting auto-refresh:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 🆕 BULK PRICE UPDATE
// POST /api/price-data/bulk-refresh
router.post('/bulk-refresh', async (req, res) => {
  try {
    const { tokenIds } = req.body

    if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token IDs array'
      })
    }

    console.log(`🔄 Bulk refresh price data for ${tokenIds.length} tokens`)

    const results: any[] = []
    const errors: any[] = []

    // Process tokens in batches to avoid overwhelming APIs
    const batchSize = 5
    for (let i = 0; i < tokenIds.length; i += batchSize) {
      const batch = tokenIds.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (tokenId: string) => {
        try {
          const data = await mongoPriceDataService.refreshTokenPrice(tokenId)
          return { tokenId, success: true, data }
        } catch (error) {
          return { tokenId, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result)
        } else {
          errors.push(result)
        }
      })

      // Add delay between batches to respect rate limits
      if (i + batchSize < tokenIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    res.json({
      success: true,
      results,
      errors,
      message: `Processed ${tokenIds.length} tokens: ${results.length} successful, ${errors.length} failed`
    })

  } catch (error) {
    console.error('❌ Bulk price refresh API error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk price refresh',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
