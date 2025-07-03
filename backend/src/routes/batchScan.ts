import express from 'express'
import batchScanService from '../services/batchScanService'
import { authenticateToken } from '../middleware/auth'
import multer from 'multer'
import path from 'path'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.sol')) {
      cb(null, true)
    } else {
      cb(new Error('Only .sol files are allowed'))
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

// Start batch scan
router.post('/start', authenticateToken, upload.array('files', 20), async (req, res) => {
  try {
    const userId = (req as any).user.id
    const config = req.body.config ? JSON.parse(req.body.config) : {}
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' })
    }
    
    const filePaths = (req.files as Express.Multer.File[]).map(file => file.path)
    const jobId = await batchScanService.startBatchScan(filePaths, userId, config)
    
    res.json({ success: true, jobId })
  } catch (error) {
    console.error('Error starting batch scan:', error)
    res.status(500).json({ success: false, error: 'Failed to start batch scan' })
  }
})

// Get batch scan status
router.get('/status/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params
    const status = await batchScanService.getBatchScanStatus(jobId)
    
    if (!status) {
      return res.status(404).json({ success: false, error: 'Job not found' })
    }
    
    res.json({ success: true, status })
  } catch (error) {
    console.error('Error getting batch scan status:', error)
    res.status(500).json({ success: false, error: 'Failed to get status' })
  }
})

// Get batch scan results
router.get('/results/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params
    const results = await batchScanService.getBatchScanResults(jobId)
    
    res.json({ success: true, results })
  } catch (error) {
    console.error('Error getting batch scan results:', error)
    res.status(500).json({ success: false, error: 'Failed to get results' })
  }
})

// Get batch scan summary
router.get('/summary/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params
    const summary = await batchScanService.getBatchScanSummary(jobId)
    
    if (!summary) {
      return res.status(404).json({ success: false, error: 'Summary not found' })
    }
    
    res.json({ success: true, summary })
  } catch (error) {
    console.error('Error getting batch scan summary:', error)
    res.status(500).json({ success: false, error: 'Failed to get summary' })
  }
})

// Cancel batch scan
router.post('/cancel/:jobId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { jobId } = req.params
    
    const success = await batchScanService.cancelBatchScan(jobId, userId)
    res.json({ success })
  } catch (error) {
    console.error('Error cancelling batch scan:', error)
    res.status(500).json({ success: false, error: 'Failed to cancel batch scan' })
  }
})

// Export batch results
router.get('/export/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params
    const { format = 'json' } = req.query
    
    if (!['json', 'csv', 'html'].includes(format as string)) {
      return res.status(400).json({ success: false, error: 'Invalid export format' })
    }
    
    const exportData = await batchScanService.exportBatchResults(jobId, format as 'json' | 'csv' | 'html')
    
    // Set appropriate headers based on format
    switch (format) {
      case 'json':
        res.setHeader('Content-Type', 'application/json')
        break
      case 'csv':
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="batch-scan-${jobId}.csv"`)
        break
      case 'html':
        res.setHeader('Content-Type', 'text/html')
        res.setHeader('Content-Disposition', `attachment; filename="batch-scan-${jobId}.html"`)
        break
    }
    
    res.send(exportData)
  } catch (error) {
    console.error('Error exporting batch results:', error)
    res.status(500).json({ success: false, error: 'Failed to export results' })
  }
})

// Get user's batch scan jobs
router.get('/jobs', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id
    const jobs = await batchScanService.getUserJobs(userId)
    
    res.json({ success: true, jobs })
  } catch (error) {
    console.error('Error fetching user jobs:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' })
  }
})

// Get batch scan configuration
router.get('/config', async (req, res) => {
  try {
    const config = await batchScanService.getConfig()
    res.json({ success: true, config })
  } catch (error) {
    console.error('Error fetching batch config:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch config' })
  }
})

// Update batch scan configuration
router.put('/config', authenticateToken, async (req, res) => {
  try {
    const config = req.body
    await batchScanService.updateConfig(config)
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating batch config:', error)
    res.status(500).json({ success: false, error: 'Failed to update config' })
  }
})

export default router 