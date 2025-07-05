import express, { RequestHandler } from 'express'
import { 
  generateRemediationPlan,
  generateAutomatedFix,
  getBestPractices,
  getSecurityRecommendations,
  generateBatchRemediation,
  getRemediationStats
} from '../controllers/remediationController'

const router = express.Router()

// Generate remediation plan for a single vulnerability
router.post('/plan', generateRemediationPlan as RequestHandler)

// Generate automated fix for a vulnerability
router.post('/fix', generateAutomatedFix as RequestHandler)

// Get security best practices
router.get('/best-practices', getBestPractices as RequestHandler)

// Get security recommendations for multiple vulnerabilities
router.post('/recommendations', getSecurityRecommendations as RequestHandler)

// Generate batch remediation for multiple vulnerabilities
router.post('/batch', generateBatchRemediation as RequestHandler)

// Get remediation statistics
router.get('/stats', getRemediationStats as RequestHandler)

export default router 