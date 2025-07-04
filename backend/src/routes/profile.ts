import express from 'express'
import { getProfile, updateProfile, createApiKey, deleteApiKey, getUserStats } from '../controllers/profileController'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Add JSON parsing for profile routes
router.use(express.json({ limit: '50mb' }))

// All routes require authentication
router.use(authenticateToken)

// Get user profile
router.get('/', getProfile)

// Update user profile
router.put('/', updateProfile)

// Get user statistics
router.get('/stats', getUserStats)

// API Key management
router.post('/api-keys', createApiKey)
router.delete('/api-keys/:keyId', deleteApiKey)

export default router 