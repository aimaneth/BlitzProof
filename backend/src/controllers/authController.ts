import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import pool from '../config/postgres'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address } = req.body

    if (!wallet_address) {
      res.status(400).json({ error: 'Wallet address is required' })
      return
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [wallet_address]
    )

    if (existingUser.rows.length > 0) {
      // User exists, generate new token
      const token = jwt.sign(
        { userId: existingUser.rows[0].id, wallet_address },
        JWT_SECRET,
        { expiresIn: '7d' }
      )
      res.json({ 
        user: existingUser.rows[0], 
        token,
        message: 'User already exists, token refreshed'
      })
      return
    }

    // Create new user
    const result = await pool.query(
      'INSERT INTO users (wallet_address) VALUES ($1) RETURNING *',
      [wallet_address]
    )

    const user = result.rows[0]
    const token = jwt.sign(
      { userId: user.id, wallet_address },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ user, token })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' })
      return
    }

    const result = await pool.query(
      'SELECT id, wallet_address, created_at FROM users WHERE id = $1',
      [req.user.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 