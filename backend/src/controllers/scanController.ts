import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import pool from '../config/postgres'
import scanService from '../services/scanService'
import explorerService from '../services/explorerService'
import fs from 'fs'
import path from 'path'
import { etherscanService } from '../services/etherscanService'
import redisClient from '../config/redis'
import remediationService from '../services/remediationService'

export const uploadContract = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 Upload contract request received')
    console.log('📁 Request file:', req.file)
    console.log('📋 Request body:', req.body)
    console.log('📋 Request headers:', req.headers)
    
    if (!req.file) {
      console.log('❌ No file uploaded')
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    const { network } = req.body
    console.log('🌐 Network from body:', network)
    
    if (!network) {
      console.log('❌ Network is required')
      res.status(400).json({ error: 'Network is required' })
      return
    }

    const userId = (req as AuthRequest).user?.userId

    // Start the scan process
    const scanId = await scanService.startScan(req.file.path, network, userId)

    // Save scan record to database if user is authenticated
    if (userId) {
      await pool.query(
        'INSERT INTO scans (user_id, contract_name, network, status, scan_id, file_path) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, req.file.originalname, network, 'pending', scanId, req.file.path]
      )
    }

    res.json({
      scanId,
      message: 'Contract uploaded and scan started',
      status: 'pending'
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const scanContractAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address, network } = req.body
    
    if (!address) {
      res.status(400).json({ error: 'Contract address is required' })
      return
    }

    if (!network) {
      res.status(400).json({ error: 'Network is required' })
      return
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      res.status(400).json({ error: 'Invalid Ethereum address format' })
      return
    }

    const userId = (req as AuthRequest).user?.userId

    // Fetch contract source from the appropriate explorer using new etherscanService
    console.log(`Fetching contract source for ${address} on ${network}`)
    
    try {
      const contract = await etherscanService.getContractSource(network, address)
      
      // Format and save the source code to a temporary file
      const fileName = `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.sol`
      const tempFilePath = path.join(process.cwd(), 'uploads', fileName)
      
      // Ensure uploads directory exists
      const uploadsDir = path.dirname(tempFilePath)
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      
      // Write source code to file
      fs.writeFileSync(tempFilePath, contract.sourceCode)
      console.log(`Saved contract source to ${tempFilePath}`)
      
      // Start the scan process
      const scanId = await scanService.startScan(tempFilePath, network, userId)

      // Save scan record to database if user is authenticated
      if (userId) {
        await pool.query(
          'INSERT INTO scans (user_id, contract_name, contract_address, network, file_path, status, scan_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [userId, contract.name, address, network, tempFilePath, 'pending', scanId]
        )
      }

      res.json({
        scanId,
        message: `Contract ${contract.name} (${address.slice(0, 6)}...${address.slice(-4)}) scan started`,
        status: 'pending',
        contractName: contract.name,
        compilerVersion: contract.compilerVersion,
        explorer: contract.explorer
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not verified')) {
          res.status(404).json({ 
            error: error.message,
            suggestion: 'Only verified contracts can be analyzed. Please verify your contract on the blockchain explorer first.'
          })
          return
        }
        if (error.message.includes('Rate limit')) {
          res.status(429).json({ 
            error: 'Rate limit exceeded. Please try again later.'
          })
          return
        }
        if (error.message.includes('API key')) {
          res.status(500).json({ 
            error: 'Explorer API configuration error. Please contact support.'
          })
          return
        }
      }
      
      res.status(500).json({ 
        error: 'Failed to fetch contract source code',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } catch (error) {
    console.error('Address scan error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getScanProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scanId } = req.params

    console.log(`🔍 Controller: Looking for scan status: ${scanId}`)

    // Disable caching for scan status
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })

    const status = await scanService.getScanStatus(scanId)
    
    console.log(`📊 Controller: Scan status result:`, status)
    
    if (!status) {
      console.log(`❌ Controller: Scan not found: ${scanId}`)
      res.status(404).json({ error: 'Scan not found' })
      return
    }
    
    // If scan is completed, transform to frontend format
    if (status.status === 'completed' && status.results) {
      const enhancedVulnerabilities = status.results.vulnerabilities?.map((vuln: any) => {
        // Remediation will be handled by separate remediation endpoints
        return {
          ...vuln,
          remediation: null // Will be generated on-demand via /api/remediation/plan
        }
      }) || []

      // Transform to frontend format
      const frontendResult = {
        scanId: req.params.scanId,
        status: status.status,
        progress: 100,
        vulnerabilities: enhancedVulnerabilities,
        aiAnalysis: status.results.aiAnalysis || [],
        summary: status.results.summary || {
          high: enhancedVulnerabilities.filter((v: any) => v.severity === 'high').length,
          medium: enhancedVulnerabilities.filter((v: any) => v.severity === 'medium').length,
          low: enhancedVulnerabilities.filter((v: any) => v.severity === 'low').length,
          total: enhancedVulnerabilities.length
        },
        score: status.results.score || 0
      }
      
      res.json(frontendResult)
    } else if (status.status === 'pending') {
      res.json({
        scanId: req.params.scanId,
        status: 'pending',
        progress: 0,
        vulnerabilities: [],
        summary: { high: 0, medium: 0, low: 0, total: 0 },
        score: 0
      })
    } else if (status.status === 'error') {
      res.json({
        scanId: req.params.scanId,
        status: 'failed',
        progress: 0,
        vulnerabilities: [],
        summary: { high: 0, medium: 0, low: 0, total: 0 },
        score: 0,
        error: status.error
      })
    } else {
      res.json(status)
    }
  } catch (error) {
    console.error('Get scan progress error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getUserScans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const result = await pool.query(
      'SELECT * FROM scans WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    )

    // Transform the database rows to match the frontend ScanHistory interface
    const scans = result.rows.map(row => ({
      id: row.id,
      contract_name: row.contract_name || 'Unknown Contract',
      network: row.network || 'Unknown Network',
      status: row.status || 'unknown',
      created_at: row.created_at,
      scan_results: row.scan_results || null
    }))

    res.json({ scans })
  } catch (error) {
    console.error('Get user scans error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getScanDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const { scanId } = req.params

    const result = await pool.query(
      'SELECT * FROM scans WHERE id = $1 AND user_id = $2',
      [scanId, req.user.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Scan not found' })
      return
    }

    const scan = result.rows[0]
    const status = await scanService.getScanStatus(scanId)

    res.json({
      scan,
      vulnerabilities: status.vulnerabilities || []
    })
  } catch (error) {
    console.error('Get scan details error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getGlobalStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get global statistics from database
    const totalScansResult = await pool.query('SELECT COUNT(*) as total FROM scans')
    const completedScansResult = await pool.query("SELECT COUNT(*) as completed FROM scans WHERE status = 'completed'")
    const failedScansResult = await pool.query("SELECT COUNT(*) as failed FROM scans WHERE status = 'failed'")
    
    // Get vulnerability statistics
    const vulnResult = await pool.query(`
      SELECT 
        COUNT(*) as total_vulnerabilities,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_vulnerabilities,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_vulnerabilities,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_vulnerabilities
      FROM scan_results
    `)
    
    const totalScans = parseInt(totalScansResult.rows[0]?.total || '0')
    const completedScans = parseInt(completedScansResult.rows[0]?.completed || '0')
    const totalVulnerabilities = parseInt(vulnResult.rows[0]?.total_vulnerabilities || '0')
    
    // Calculate detection accuracy based on completed scans
    const detectionAccuracy = totalScans > 0 ? ((completedScans / totalScans) * 100).toFixed(1) : '0.0'
    
    res.json({
      totalScans: totalScans.toLocaleString(),
      totalVulnerabilities: totalVulnerabilities.toLocaleString(),
      detectionAccuracy: `${detectionAccuracy}%`,
      completedScans,
      failedScans: parseInt(failedScansResult.rows[0]?.failed || '0'),
      highVulnerabilities: parseInt(vulnResult.rows[0]?.high_vulnerabilities || '0'),
      mediumVulnerabilities: parseInt(vulnResult.rows[0]?.medium_vulnerabilities || '0'),
      lowVulnerabilities: parseInt(vulnResult.rows[0]?.low_vulnerabilities || '0')
    })
  } catch (error) {
    console.error('Error fetching global stats:', error)
    res.status(500).json({ error: 'Failed to fetch global statistics' })
  }
}

export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const userId = req.user.userId

    // Get user's scan statistics
    const totalScansResult = await pool.query('SELECT COUNT(*) as total FROM scans WHERE user_id = $1', [userId])
    const completedScansResult = await pool.query("SELECT COUNT(*) as completed FROM scans WHERE user_id = $1 AND status = 'completed'", [userId])
    const failedScansResult = await pool.query("SELECT COUNT(*) as failed FROM scans WHERE user_id = $1 AND status = 'failed'", [userId])
    
    // Get user's vulnerability statistics
    const vulnResult = await pool.query(`
      SELECT 
        COUNT(*) as total_vulnerabilities,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_vulnerabilities,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_vulnerabilities,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_vulnerabilities
      FROM scan_results sr
      JOIN scans s ON sr.scan_id = s.id
      WHERE s.user_id = $1
    `, [userId])
    
    const totalScans = parseInt(totalScansResult.rows[0]?.total || '0')
    const completedScans = parseInt(completedScansResult.rows[0]?.completed || '0')
    const totalVulnerabilities = parseInt(vulnResult.rows[0]?.total_vulnerabilities || '0')
    
    // Calculate success rate
    const successRate = totalScans > 0 ? ((completedScans / totalScans) * 100).toFixed(1) : '0.0'
    
    res.json({
      totalScans,
      completedScans,
      failedScans: parseInt(failedScansResult.rows[0]?.failed || '0'),
      totalVulnerabilities,
      highVulnerabilities: parseInt(vulnResult.rows[0]?.high_vulnerabilities || '0'),
      mediumVulnerabilities: parseInt(vulnResult.rows[0]?.medium_vulnerabilities || '0'),
      lowVulnerabilities: parseInt(vulnResult.rows[0]?.low_vulnerabilities || '0'),
      successRate: `${successRate}%`
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    res.status(500).json({ error: 'Failed to fetch user statistics' })
  }
}

export const getRecentActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const userId = req.user.userId
    const limit = parseInt(req.query.limit as string) || 5

    // Get recent scans with vulnerability counts
    const result = await pool.query(`
      SELECT 
        s.id,
        s.contract_name,
        s.contract_address,
        s.network,
        s.status,
        s.created_at,
        s.updated_at,
        COUNT(sr.id) as vulnerability_count,
        COUNT(CASE WHEN sr.severity = 'high' THEN 1 END) as high_count,
        COUNT(CASE WHEN sr.severity = 'medium' THEN 1 END) as medium_count,
        COUNT(CASE WHEN sr.severity = 'low' THEN 1 END) as low_count
      FROM scans s
      LEFT JOIN scan_results sr ON s.id = sr.scan_id
      WHERE s.user_id = $1
      GROUP BY s.id, s.contract_name, s.contract_address, s.network, s.status, s.created_at, s.updated_at
      ORDER BY s.created_at DESC
      LIMIT $2
    `, [userId, limit])

    const recentActivity = result.rows.map(row => ({
      id: row.id,
      contractName: row.contract_name || 'Unknown Contract',
      contractAddress: row.contract_address,
      network: row.network,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      vulnerabilityCount: parseInt(row.vulnerability_count || '0'),
      highCount: parseInt(row.high_count || '0'),
      mediumCount: parseInt(row.medium_count || '0'),
      lowCount: parseInt(row.low_count || '0')
    }))

    res.json({ recentActivity })
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    res.status(500).json({ error: 'Failed to fetch recent activity' })
  }
}

export const scanController = {
  // Start a new scan
  async startScan(req: Request, res: Response) {
    try {
      const { contractName, contractAddress, network, filePath } = req.body
      const userId = (req as any).user?.id

      if (!contractName || (!contractAddress && !filePath)) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Create scan record
      const result = await pool.query(
        'INSERT INTO scans (user_id, contract_name, contract_address, network, file_path, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [userId, contractName, contractAddress, network, filePath, 'pending']
      )

      const scanId = result.rows[0].id

      // Start scan in background
      scanService.startScan(filePath, network, userId)

      res.json({ 
        scanId, 
        message: 'Scan started successfully',
        status: 'pending'
      })
    } catch (error) {
      console.error('Error starting scan:', error)
      res.status(500).json({ error: 'Failed to start scan' })
    }
  },

  // Get scan status
  async getScanStatus(req: Request, res: Response) {
    try {
      const { scanId } = req.params
      const status = await scanService.getScanStatus(scanId)
      
      // If scan is completed, enhance with remediation suggestions
      if (status.status === 'completed' && status.vulnerabilities) {
        const enhancedVulnerabilities = status.vulnerabilities.map((vuln: any) => {
          // Remediation will be handled by separate remediation endpoints
          return {
            ...vuln,
            remediation: null // Will be generated on-demand via /api/remediation/plan
          }
        })
        
        return res.json({
          ...status,
          vulnerabilities: enhancedVulnerabilities
        })
      }
      
      res.json(status)
    } catch (error) {
      console.error('Error getting scan status:', error)
      res.status(500).json({ error: 'Failed to get scan status' })
    }
  },

  // Get scan results
  async getScanResults(req: Request, res: Response) {
    try {
      const { scanId } = req.params

      // Get scan details
      const scanResult = await pool.query(
        'SELECT * FROM scans WHERE id = $1',
        [scanId]
      )

      if (scanResult.rows.length === 0) {
        return res.status(404).json({ error: 'Scan not found' })
      }

      const scan = scanResult.rows[0]

      // Get vulnerability results
      const vulnResult = await pool.query(
        'SELECT * FROM scan_results WHERE scan_id = $1 ORDER BY severity DESC, id ASC',
        [scanId]
      )

      const vulnerabilities = vulnResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        severity: row.severity,
        line: row.line_number,
        file: row.file_path,
        tool: row.tool,
        recommendation: row.recommendation || 'Review the code for potential security issues.'
      }))

      // Calculate summary
      const summary = {
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length,
        info: vulnerabilities.filter(v => v.severity === 'info').length
      }

      // Calculate security score (0-100)
      const totalVulns = vulnerabilities.length
      const criticalVulns = vulnerabilities.filter(v => v.severity === 'high').length
      const mediumVulns = vulnerabilities.filter(v => v.severity === 'medium').length
      
      let score = 100
      score -= criticalVulns * 20 // High severity: -20 points each
      score -= mediumVulns * 10   // Medium severity: -10 points each
      score = Math.max(0, score)  // Don't go below 0

      res.json({
        scanId,
        contractName: scan.contract_name,
        contractAddress: scan.contract_address,
        network: scan.network,
        status: scan.status,
        createdAt: scan.created_at,
        updatedAt: scan.updated_at,
        vulnerabilities,
        summary,
        score: Math.round(score)
      })
    } catch (error) {
      console.error('Error getting scan results:', error)
      res.status(500).json({ error: 'Failed to get scan results' })
    }
  },

  // Get contract source by address
  async getContractByAddress(req: Request, res: Response) {
    try {
      const { address, network } = req.body

      if (!address || !network) {
        return res.status(400).json({ error: 'Address and network are required' })
      }

      // Validate network
      const supportedNetworks = etherscanService.getSupportedNetworks()
      if (!supportedNetworks.includes(network)) {
        return res.status(400).json({ 
          error: `Unsupported network. Supported networks: ${supportedNetworks.join(', ')}` 
        })
      }

      // Get contract source from blockchain explorer
      const contract = await etherscanService.getContractSource(network, address)

      res.json({
        contractName: contract.name,
        sourceCode: contract.sourceCode,
        compilerVersion: contract.compilerVersion,
        isVerified: contract.isVerified,
        network: contract.network,
        explorer: contract.explorer,
        explorerUrl: etherscanService.getExplorerUrl(network, address)
      })
    } catch (error) {
      console.error('Error fetching contract:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('not verified')) {
          return res.status(404).json({ 
            error: error.message,
            suggestion: 'Only verified contracts can be analyzed. Please verify your contract on the blockchain explorer first.'
          })
        }
        if (error.message.includes('Invalid contract address')) {
          return res.status(400).json({ 
            error: 'Invalid contract address format. Please use a valid 0x... address.'
          })
        }
        if (error.message.includes('Rate limit')) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded. Please try again later.'
          })
        }
        if (error.message.includes('API key')) {
          return res.status(500).json({ 
            error: 'Explorer API configuration error. Please contact support.'
          })
        }
      }
      
      res.status(500).json({ 
        error: 'Failed to fetch contract source code',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  // Validate contract address
  async validateAddress(req: Request, res: Response) {
    try {
      const { address, network } = req.body

      if (!address || !network) {
        return res.status(400).json({ error: 'Address and network are required' })
      }

      const validation = await etherscanService.validateAddress(network, address)

      res.json({
        address,
        network,
        ...validation,
        explorerUrl: validation.isValid ? etherscanService.getExplorerUrl(network, address) : null
      })
    } catch (error) {
      console.error('Error validating address:', error)
      res.status(500).json({ 
        error: 'Failed to validate address',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  // Get user's scan history
  async getUserScans(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const offset = (page - 1) * limit

      const result = await pool.query(
        `SELECT id, contract_name, contract_address, network, status, progress, created_at, updated_at 
         FROM scans 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      )

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM scans WHERE user_id = $1',
        [userId]
      )

      const totalScans = parseInt(countResult.rows[0].count)
      const totalPages = Math.ceil(totalScans / limit)

      res.json({
        scans: result.rows,
        pagination: {
          page,
          limit,
          total: totalScans,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      })
    } catch (error) {
      console.error('Error getting user scans:', error)
      res.status(500).json({ error: 'Failed to get scan history' })
    }
  }
} 