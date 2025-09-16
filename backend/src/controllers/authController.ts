import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import pool from '../config/postgres'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address, name, email, password } = req.body

    // Handle wallet-based registration (existing)
    if (wallet_address && !email) {
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
      return
    }

    // Handle email/password registration (new)
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' })
      return
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'User with this email already exists' })
      return
    }

    // Hash password (in production, use bcrypt)
    const hashedPassword = password // TODO: Implement proper password hashing

    // Create new user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, hashedPassword]
    )

    const user = result.rows[0]
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ user, token })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const user = result.rows[0]

    // Verify password (in production, use bcrypt.compare)
    if (user.password_hash !== password) { // TODO: Implement proper password verification
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      },
      token 
    })
  } catch (error) {
    console.error('Login error:', error)
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