import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../config/database'

export interface AuthRequest extends Request {
  user?: {
    userId: number
    wallet_address: string
  }
}

// Simple rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 100 // requests per window

const checkRateLimit = (walletAddress: string): boolean => {
  const now = Date.now()
  const userLimit = rateLimitStore.get(walletAddress)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(walletAddress, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  userLimit.count++
  return true
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    
    if (!decoded.wallet_address) {
      res.status(401).json({ error: 'Invalid token format' })
      return
    }

    // Check rate limiting
    if (!checkRateLimit(decoded.wallet_address)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' })
      return
    }

    const result = await pool.query(
      'SELECT id, wallet_address, created_at FROM users WHERE wallet_address = $1 AND is_active = true',
      [decoded.wallet_address]
    )
    
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User not found or inactive' })
      return
    }

    const user = result.rows[0]
    
    // Check if token is not too old (optional: implement token refresh)
    const tokenAge = Date.now() - (decoded.iat * 1000)
    const maxTokenAge = 7 * 24 * 60 * 60 * 1000 // 7 days
    
    if (tokenAge > maxTokenAge) {
      res.status(401).json({ error: 'Token expired. Please reconnect your wallet.' })
      return
    }

    req.user = {
      userId: user.id,
      wallet_address: user.wallet_address
    }

    // Add security headers
    res.setHeader('X-User-ID', user.id.toString())
    res.setHeader('X-Wallet-Address', user.wallet_address)
    
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: 'Invalid token' })
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' })
    } else {
      console.error('Auth error:', error)
      res.status(500).json({ error: 'Authentication error' })
    }
  }
}

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    next()
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    
    if (!decoded.wallet_address) {
      next()
      return
    }

    const result = await pool.query(
      'SELECT id, wallet_address FROM users WHERE wallet_address = $1 AND is_active = true',
      [decoded.wallet_address]
    )
    
    if (result.rows.length > 0) {
      req.user = {
        userId: result.rows[0].id,
        wallet_address: result.rows[0].wallet_address
      }
    }
    
    next()
  } catch (error) {
    // For optional auth, just continue without user
    next()
  }
}

// Middleware to add security headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Note: CORS headers are handled by the cors middleware in index.ts
  // Don't set CORS headers here to avoid conflicts
  
  next()
} 