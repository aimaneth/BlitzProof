import express from 'express'
import { submitContactForm, getContactRequests } from '../controllers/contactController'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Submit contact form (public endpoint)
router.post('/submit', express.json({ limit: '10mb' }), submitContactForm)

// Get contact requests (admin only)
router.get('/requests', authenticateToken, getContactRequests)

export default router
