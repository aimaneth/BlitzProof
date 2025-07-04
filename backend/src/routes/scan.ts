import express from 'express'
import { uploadContract, scanContractAddress, getScanProgress, getUserScans, getScanDetails } from '../controllers/scanController'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import { upload } from '../middleware/upload'
import scanService from '../services/scanService'

const router = express.Router()

// Add JSON parsing only for the address route (not for upload)
router.post('/address', express.json({ limit: '50mb' }), optionalAuth, scanContractAddress)
router.post('/upload', optionalAuth, upload.single('contract'), uploadContract)
router.get('/status/:scanId', async (req, res, next) => {
  try {
    console.log('🔍 STATUS ROUTE HIT with scanId:', req.params.scanId)
    await getScanProgress(req, res)
  } catch (error) {
    console.error('❌ STATUS ROUTE ERROR:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
router.get('/test', (req, res) => {
  console.log('🔍 TEST ROUTE HIT')
  res.json({ message: 'Test route working' })
})

router.get('/test-scan-service', async (req, res) => {
  try {
    console.log('🔍 TESTING SCAN SERVICE')
    const testScanId = 'test_scan_123'
    
    // Test if scanService is working
    const result = await scanService.getScanStatus(testScanId)
    console.log('📊 Scan service test result:', result)
    
    res.json({ 
      message: 'Scan service test',
      result,
      availableScans: Array.from((scanService as any).scanResults.keys()),
      allScans: scanService.getAllScans()
    })
  } catch (error) {
    console.error('❌ Scan service test error:', error)
    res.status(500).json({ error: 'Scan service test failed' })
  }
})
router.get('/user-scans', authenticateToken, getUserScans)
router.get('/history', authenticateToken, getUserScans)
router.get('/details/:scanId', authenticateToken, getScanDetails)

export default router 