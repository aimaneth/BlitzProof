import express from 'express'
import { registerUser, getProfile } from '../controllers/authController'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

router.post('/register', registerUser)
router.get('/profile', authenticateToken, getProfile)

export default router 