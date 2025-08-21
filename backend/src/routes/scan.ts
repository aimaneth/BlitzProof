import express from 'express'
import { uploadContract, scanContractAddress, getScanProgress, getUserScans, getScanDetails, getGlobalStats, getUserStats, getRecentActivity } from '../controllers/scanController'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import { upload } from '../middleware/upload'
import scanService from '../services/scanService'

const router = express.Router()

// Add JSON parsing only for the address route (not for upload)
router.post('/address', express.json({ limit: '50mb' }), optionalAuth, scanContractAddress)

// Test endpoint for debugging
router.post('/test-upload', upload.single('test'), (req: any, res: any) => {
  console.log('🧪 Test upload endpoint hit')
  console.log('📁 Test file:', req.file)
  console.log('📋 Test body:', req.body)
  res.json({ 
    success: true, 
    file: req.file ? 'File received' : 'No file',
    body: req.body 
  })
})

// Add debugging middleware for upload route
router.post('/upload', (req: any, res: any, next: any) => {
  console.log('🔍 Upload route hit')
  console.log('📋 Request headers:', req.headers)
  console.log('📋 Request method:', req.method)
  console.log('📋 Content-Type:', req.headers['content-type'])
  console.log('📋 Request body keys:', Object.keys(req.body))
  console.log('📋 Request files:', req.files)
  next()
}, optionalAuth, upload.single('contract'), (err: any, req: any, res: any, next: any) => {
  if (err) {
    console.log('❌ Upload middleware error:', err)
    return res.status(400).json({ error: err.message })
  }
  console.log('✅ Multer processing completed')
  console.log('📁 File after multer:', req.file)
  console.log('📋 Body after multer:', req.body)
  next()
}, uploadContract)

// New routes for real statistics
router.get('/stats/global', getGlobalStats)
router.get('/stats/user', authenticateToken, getUserStats)
router.get('/recent-activity', authenticateToken, getRecentActivity)

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