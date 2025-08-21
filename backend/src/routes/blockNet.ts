import express from 'express'
import {
  addTokenMonitor,
  getMonitoredTokens,
  getTokenMetrics,
  analyzeTokenTransactions,
  getSecurityAlerts,
  markAlertAsRead,
  getDashboardData,
  getTokenRanking,
  removeTokenMonitor,
  updateMonitoringSettings
} from '../controllers/blockNetController'
import { authenticateToken, optionalAuth } from '../middleware/auth'

const router = express.Router()

// Token monitoring endpoints
router.post('/monitors', express.json({ limit: '10mb' }), optionalAuth, addTokenMonitor)
router.get('/monitors', optionalAuth, getMonitoredTokens)
router.delete('/monitors/:tokenAddress', optionalAuth, removeTokenMonitor)
router.put('/monitors/:tokenAddress/settings', express.json({ limit: '10mb' }), optionalAuth, updateMonitoringSettings)

// Token analysis endpoints
router.get('/tokens/:tokenAddress/metrics', optionalAuth, getTokenMetrics)
router.get('/tokens/:tokenAddress/transactions', optionalAuth, analyzeTokenTransactions)

// Security alerts endpoints
router.get('/alerts', optionalAuth, getSecurityAlerts)
router.put('/alerts/:alertId/read', optionalAuth, markAlertAsRead)

// Dashboard and ranking endpoints
router.get('/dashboard', optionalAuth, getDashboardData)
router.get('/ranking', optionalAuth, getTokenRanking)

export default router
