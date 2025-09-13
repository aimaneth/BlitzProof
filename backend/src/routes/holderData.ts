import express from 'express'
import { holderDataService } from '../services/holderDataService'

const router = express.Router()

// 🔍 GET HOLDER COUNT FOR SPECIFIC TOKEN
// GET /api/holder-data/:tokenId
router.get('/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params
    const { contractAddress, network } = req.query

    console.log(`📊 Fetching holder data for token: ${tokenId}`)

    const holderData = await holderDataService.getHolderCount(
      tokenId,
      contractAddress as string,
      (network as string) || 'eth'
    )

    res.json({
      success: true,
      data: holderData
    })

  } catch (error) {
    console.error('❌ Error fetching holder data:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 🔍 GET DEX PAIRS FOR SPECIFIC TOKEN
// GET /api/holder-data/:tokenId/dex-pairs
router.get('/:tokenId/dex-pairs', async (req, res) => {
  try {
    const { tokenId } = req.params

    console.log(`📊 Fetching DEX pairs for token: ${tokenId}`)

    const dexPairsData = await holderDataService.getDexPairsData(tokenId)

    res.json({
      success: true,
      data: dexPairsData
    })

  } catch (error) {
    console.error('❌ Error fetching DEX pairs:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 🔄 REFRESH HOLDER COUNT FOR SPECIFIC TOKEN
// POST /api/holder-data/:tokenId/refresh
router.post('/:tokenId/refresh', async (req, res) => {
  try {
    const { tokenId } = req.params
    const { contractAddress, network } = req.body

    console.log(`🔄 Refreshing holder data for token: ${tokenId}`)

    const holderData = await holderDataService.getHolderCount(
      tokenId,
      contractAddress,
      network || 'eth'
    )

    // Update in database
    await holderDataService.updateHolderCount(tokenId, holderData)

    res.json({
      success: true,
      data: holderData,
      message: `Holder count updated: ${holderData.holderCount} holders`
    })

  } catch (error) {
    console.error('❌ Error refreshing holder data:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 🔄 BULK REFRESH ALL HOLDER COUNTS
// POST /api/holder-data/bulk-refresh
router.post('/bulk-refresh', async (req, res) => {
  try {
    console.log('🔄 Starting bulk holder count refresh...')

    // Run bulk update in background
    holderDataService.bulkUpdateHolderCounts().catch(error => {
      console.error('❌ Background bulk update failed:', error)
    })

    res.json({
      success: true,
      message: 'Bulk holder count refresh started in background'
    })

  } catch (error) {
    console.error('❌ Error starting bulk refresh:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
