import { Router } from 'express'
import { BlitzProofController } from '../controllers/blitzProofController'

const router = Router()

// Public routes (read-only)
router.get('/score/:tokenId', BlitzProofController.getBlitzProofScore)
router.get('/info/:tokenId', BlitzProofController.getTokenInfo)
router.get('/combined/:tokenId', BlitzProofController.getCombinedTokenData)
router.post('/calculate/:tokenId', BlitzProofController.calculateBlitzProofScore)

// Admin routes (require authentication)
router.put('/score/:tokenId', BlitzProofController.updateBlitzProofScore)
router.put('/info/:tokenId', BlitzProofController.updateTokenInfo)
router.get('/admin/all', BlitzProofController.getAllTokensWithScores)
router.delete('/admin/:tokenId', BlitzProofController.deleteTokenData)

export default router
