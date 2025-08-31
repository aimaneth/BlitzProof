import { Request, Response } from 'express'
import pool from '../config/postgres'
import path from 'path'
import fs from 'fs'

export class TokenLogoController {
  // Get a specific token logo
  static async getTokenLogo(req: Request, res: Response) {
    try {
      const { tokenId } = req.params

      const result = await pool.query(
        'SELECT token_id, symbol, name, logo_url FROM token_logos WHERE token_id = $1',
        [tokenId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Logo not found'
        })
      }

      res.json({
        success: true,
        logoUrl: result.rows[0].logo_url,
        tokenId: result.rows[0].token_id,
        symbol: result.rows[0].symbol,
        name: result.rows[0].name
      })
    } catch (error) {
      console.error('Error fetching token logo:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch token logo'
      })
    }
  }

  // Get all token logos
  static async getTokenLogos(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT id, token_id, symbol, name, logo_url, created_at
        FROM token_logos
        ORDER BY created_at DESC
      `)

      res.json({
        success: true,
        tokens: result.rows
      })
    } catch (error: any) {
      console.error('Error fetching token logos:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch token logos'
      })
    }
  }

  // Upload a new token logo
  static async uploadTokenLogo(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No logo file provided'
        })
      }

      const { tokenId, symbol, name } = req.body

      if (!tokenId) {
        return res.status(400).json({
          success: false,
          message: 'Token ID is required'
        })
      }

      // Create logo URL
      const logoUrl = `/uploads/token-logos/${req.file.filename}`

      // Check if logo already exists for this token
      const existingLogo = await pool.query(
        'SELECT id, logo_url FROM token_logos WHERE token_id = $1',
        [tokenId]
      )

      if (existingLogo.rows.length > 0) {
        // Delete old file if it exists
        const oldLogoUrl = existingLogo.rows[0].logo_url
        if (oldLogoUrl) {
          const oldFilePath = path.join(__dirname, '../../', oldLogoUrl)
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath)
            console.log(`🗑️ Deleted old logo file: ${oldFilePath}`)
          }
        }
        
        // Update existing logo
        await pool.query(
          'UPDATE token_logos SET symbol = $1, name = $2, logo_url = $3, updated_at = NOW() WHERE token_id = $4',
          [symbol || null, name || null, logoUrl, tokenId]
        )
        console.log(`🔄 Updated logo for token: ${tokenId}`)
      } else {
        // Insert new logo
        await pool.query(
          'INSERT INTO token_logos (token_id, symbol, name, logo_url, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [tokenId, symbol || null, name || null, logoUrl]
        )
      }

      res.json({
        success: true,
        message: 'Logo uploaded successfully',
        tokenId,
        logoUrl
      })
    } catch (error) {
      console.error('Error uploading token logo:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to upload logo'
      })
    }
  }

  // Remove a token logo
  static async removeTokenLogo(req: Request, res: Response) {
    try {
      const { tokenId } = req.params

      // Get logo info before deletion
      const logoResult = await pool.query(
        'SELECT logo_url FROM token_logos WHERE token_id = $1',
        [tokenId]
      )

      if (logoResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Logo not found'
        })
      }

      // Delete from database
      await pool.query(
        'DELETE FROM token_logos WHERE token_id = $1',
        [tokenId]
      )

      // Delete file from filesystem
      const logoUrl = logoResult.rows[0].logo_url
      const filePath = path.join(__dirname, '../../', logoUrl)
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      res.json({
        success: true,
        message: 'Logo removed successfully',
        tokenId
      })
    } catch (error) {
      console.error('Error removing token logo:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to remove logo'
      })
    }
  }
}
