import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import pool from '../config/database'
import crypto from 'crypto'

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const result = await pool.query(
      'SELECT id, wallet_address, username, email, created_at FROM users WHERE id = $1',
      [req.user.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const user = result.rows[0]

    // Get user statistics
    const statsResult = await pool.query(
      'SELECT COUNT(*) as scan_count FROM scans WHERE user_id = $1',
      [req.user.userId]
    )

    const scanCount = parseInt(statsResult.rows[0].scan_count) || 0

    // Get API keys
    const apiKeysResult = await pool.query(
      'SELECT id, name, key_hash, created_at, last_used, permissions FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    )

    res.json({
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      },
      stats: {
        scan_count: scanCount,
        total_vulnerabilities: 0, // TODO: Calculate from scan results
        average_score: 0 // TODO: Calculate from scan results
      },
      api_keys: apiKeysResult.rows.map(key => ({
        id: key.id,
        name: key.name,
        key: key.key_hash, // Use key_hash as the key value
        created_at: key.created_at,
        last_used: key.last_used,
        permissions: key.permissions || []
      }))
    })
  } catch (error) {
    console.error('Get profile error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.userId
    })
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const { username, email, preferences } = req.body

    // Update user profile
    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [username, email, req.user.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Update user preferences (store as JSON in a separate table or column)
    if (preferences) {
      await pool.query(
        'UPDATE users SET preferences = $1 WHERE id = $2',
        [JSON.stringify(preferences), req.user.userId]
      )
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: result.rows[0].id,
        wallet_address: result.rows[0].wallet_address,
        username: result.rows[0].username,
        email: result.rows[0].email,
        created_at: result.rows[0].created_at
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    // Get scan statistics
    const scanStats = await pool.query(
      'SELECT COUNT(*) as total_scans, COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_scans FROM scans WHERE user_id = $1',
      [req.user.userId]
    )

    // Get vulnerability statistics
    const vulnStats = await pool.query(
      `SELECT 
        COUNT(*) as total_vulnerabilities,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_vulnerabilities,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_vulnerabilities,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_vulnerabilities
      FROM scan_results sr
      JOIN scans s ON sr.scan_id = s.id
      WHERE s.user_id = $1`,
      [req.user.userId]
    )

    // Calculate average security score
    const scoreStats = await pool.query(
      `SELECT AVG(score) as average_score
      FROM (
        SELECT 
          CASE 
            WHEN COUNT(*) = 0 THEN 100
            ELSE 100 - (COUNT(CASE WHEN severity = 'high' THEN 1 END) * 20 + 
                       COUNT(CASE WHEN severity = 'medium' THEN 1 END) * 10 + 
                       COUNT(CASE WHEN severity = 'low' THEN 1 END) * 5)
          END as score
        FROM scan_results sr
        JOIN scans s ON sr.scan_id = s.id
        WHERE s.user_id = $1 AND s.status = 'completed'
        GROUP BY s.id
      ) scores`,
      [req.user.userId]
    )

    res.json({
      scan_count: parseInt(scanStats.rows[0].total_scans) || 0,
      completed_scans: parseInt(scanStats.rows[0].completed_scans) || 0,
      total_vulnerabilities: parseInt(vulnStats.rows[0].total_vulnerabilities) || 0,
      high_vulnerabilities: parseInt(vulnStats.rows[0].high_vulnerabilities) || 0,
      medium_vulnerabilities: parseInt(vulnStats.rows[0].medium_vulnerabilities) || 0,
      low_vulnerabilities: parseInt(vulnStats.rows[0].low_vulnerabilities) || 0,
      average_score: Math.round(parseFloat(scoreStats.rows[0].average_score) || 100)
    })
  } catch (error) {
    console.error('Get user stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const { name, permissions = ['read', 'scan'] } = req.body

    if (!name) {
      res.status(400).json({ error: 'API key name is required' })
      return
    }

    // Generate API key
    const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`

    // Store API key in database
    const result = await pool.query(
      'INSERT INTO api_keys (user_id, name, key_hash, permissions) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, name, apiKey, permissions]
    )

    res.json({
      message: 'API key created successfully',
      api_key: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        key: result.rows[0].key_hash, // Use key_hash as the key value
        created_at: result.rows[0].created_at,
        permissions: result.rows[0].permissions
      }
    })
  } catch (error) {
    console.error('Create API key error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const { keyId } = req.params

    // Delete API key (only if it belongs to the user)
    const result = await pool.query(
      'DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING *',
      [keyId, req.user.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'API key not found' })
      return
    }

    res.json({ message: 'API key deleted successfully' })
  } catch (error) {
    console.error('Delete API key error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 