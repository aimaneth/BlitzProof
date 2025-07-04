import express from 'express'
import { registerUser, getProfile } from '../controllers/authController'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Add JSON parsing for auth routes
router.use(express.json({ limit: '50mb' }))

router.post('/register', registerUser)
router.get('/profile', authenticateToken, getProfile)

export default router 