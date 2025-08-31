import { Request, Response } from 'express';
import { SimpleTokenService, SimpleToken } from '../services/simpleTokenService';

// Get all tokens
export const getAllTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📋 Getting all tokens...');
    const tokens = await SimpleTokenService.getAllTokens();
    
    res.json({
      success: true,
      tokens: tokens,
      total: tokens.length
    });
  } catch (error) {
    console.error('❌ Error getting all tokens:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all tokens with price data
export const getAllTokensWithPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📋 Getting all tokens with price data...');
    const tokens = await SimpleTokenService.getAllTokens();
    
    // Get price data for each token
    const tokensWithPrice = await Promise.all(
      tokens.map(async (token) => {
        try {
          const tokenWithPrice = await SimpleTokenService.getTokenWithPrice(token.uniqueId);
          return tokenWithPrice || token; // Fallback to original token if price fetch fails
        } catch (error) {
          console.warn(`⚠️ Failed to get price for ${token.uniqueId}:`, error);
          return token; // Return original token without price data
        }
      })
    );
    
    res.json({
      success: true,
      tokens: tokensWithPrice,
      total: tokensWithPrice.length
    });
  } catch (error) {
    console.error('❌ Error getting all tokens with price:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get tokens with price',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get token by unique ID
export const getTokenByUniqueId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uniqueId } = req.params;
    
    if (!uniqueId) {
      res.status(400).json({ 
        success: false,
        error: 'Unique ID is required' 
      });
      return;
    }

    console.log(`🔍 Getting token with unique ID: ${uniqueId}`);
    const token = await SimpleTokenService.getTokenByUniqueId(uniqueId);
    
    if (!token) {
      res.status(404).json({ 
        success: false,
        error: `Token with unique ID '${uniqueId}' not found` 
      });
      return;
    }
    
    res.json({
      success: true,
      token: token
    });
  } catch (error) {
    console.error('❌ Error getting token:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get token with price data
export const getTokenWithPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uniqueId } = req.params;
    
    if (!uniqueId) {
      res.status(400).json({ 
        success: false,
        error: 'Unique ID is required' 
      });
      return;
    }

    console.log(`💰 Getting token with price data: ${uniqueId}`);
    const token = await SimpleTokenService.getTokenWithPrice(uniqueId);
    
    if (!token) {
      res.status(404).json({ 
        success: false,
        error: `Token with unique ID '${uniqueId}' not found` 
      });
      return;
    }
    
    res.json({
      success: true,
      token: token
    });
  } catch (error) {
    console.error('❌ Error getting token with price:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get token with price',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Add new token
export const addToken = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Request headers:', req.headers);
    
    const { 
      uniqueId, 
      coinGeckoId, 
      name, 
      symbol, 
      description, 
      network, 
      contractAddress, 
      category, 
      priority, 
      riskLevel, 
      monitoringStrategy,
      // New comprehensive fields
      website,
      rank,
      holderCount,
      contractScore,
      auditsCount,
      // Related data
      socials,
      contracts,
      explorers,
      wallets,
      sourceCode,
      auditLinks,
      tags
    } = req.body;
    
    console.log('🔍 Extracted values:', { uniqueId, coinGeckoId, name, symbol });
    
    // Enhanced validation with specific error messages
    const validationErrors: string[] = [];
    
    if (!uniqueId || !uniqueId.trim()) {
      validationErrors.push('Unique ID is required');
    } else if (uniqueId.trim().length < 3) {
      validationErrors.push('Unique ID must be at least 3 characters');
    } else if (!/^[a-zA-Z0-9-_]+$/.test(uniqueId.trim())) {
      validationErrors.push('Unique ID can only contain letters, numbers, hyphens, and underscores');
    }
    
    if (!coinGeckoId || !coinGeckoId.trim()) {
      validationErrors.push('CoinGecko ID is required');
    }
    
    if (!name || !name.trim()) {
      validationErrors.push('Token name is required');
    } else if (name.trim().length < 2) {
      validationErrors.push('Token name must be at least 2 characters');
    }
    
    if (!symbol || !symbol.trim()) {
      validationErrors.push('Token symbol is required');
    } else if (symbol.trim().length < 1) {
      validationErrors.push('Token symbol must be at least 1 character');
    } else if (symbol.trim().length > 10) {
      validationErrors.push('Token symbol must be 10 characters or less');
    }
    
    if (validationErrors.length > 0) {
      res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        received: { uniqueId, coinGeckoId, name, symbol }
      });
      return;
    }

    console.log(`➕ Adding new token: ${name} (${symbol})`);
    
    const newToken = await SimpleTokenService.addToken({
      uniqueId,
      coinGeckoId,
      name,
      symbol,
      description,
      network: network || 'Ethereum',
      contractAddress,
      category: category || 'DeFi',
      priority: priority || 50,
      riskLevel: riskLevel || 'MEDIUM',
      monitoringStrategy: monitoringStrategy || 'REAL_TIME',
      // New comprehensive fields
      website,
      rank,
      holderCount,
      contractScore,
      auditsCount,
      // Related data
      socials,
      contracts,
      explorers,
      wallets,
      sourceCode,
      auditLinks,
      tags,
      isActive: true
    });
    
    res.json({
      success: true,
      message: 'Token added successfully',
      token: newToken
    });
  } catch (error) {
    console.error('❌ Error adding token:', error);
    
    // Enhanced error handling with specific error messages
    let errorMessage = 'Failed to add token';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate key value violates unique constraint')) {
        if (error.message.includes('tokens_unique_id_key')) {
          errorMessage = 'Token ID already exists. Please use a different Token ID';
        } else if (error.message.includes('tokens_coin_gecko_id_key')) {
          errorMessage = 'CoinGecko ID already exists. Please use a different CoinGecko ID';
        } else {
          errorMessage = 'Duplicate entry found. Please check your input data';
        }
        statusCode = 409; // Conflict
      } else if (error.message.includes('violates check constraint')) {
        errorMessage = 'Invalid data format. Please check your input values';
        statusCode = 400; // Bad Request
      } else if (error.message.includes('connection')) {
        errorMessage = 'Database connection error. Please try again later';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('foreign key')) {
        errorMessage = 'Invalid reference data. Please check related fields';
        statusCode = 400; // Bad Request
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update token
export const updateToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uniqueId } = req.params;
    const updates = req.body;
    
    if (!uniqueId) {
      res.status(400).json({ 
        success: false,
        error: 'Unique ID is required' 
      });
      return;
    }

    console.log(`✏️ Updating token: ${uniqueId}`, updates);
    
    const updatedToken = await SimpleTokenService.updateToken(uniqueId, updates);
    
    res.json({
      success: true,
      message: 'Token updated successfully',
      token: updatedToken
    });
  } catch (error) {
    console.error('❌ Error updating token:', error);
    
    // Enhanced error handling with specific error messages
    let errorMessage = 'Failed to update token';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        errorMessage = 'Token not found. It may have been deleted.';
        statusCode = 404; // Not Found
      } else if (error.message.includes('duplicate key value violates unique constraint')) {
        errorMessage = 'Token ID already exists. Please use a different Token ID';
        statusCode = 409; // Conflict
      } else if (error.message.includes('violates check constraint')) {
        errorMessage = 'Invalid data format. Please check your input values';
        statusCode = 400; // Bad Request
      } else if (error.message.includes('connection')) {
        errorMessage = 'Database connection error. Please try again later';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('foreign key')) {
        errorMessage = 'Invalid reference data. Please check related fields';
        statusCode = 400; // Bad Request
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete token
export const deleteToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uniqueId } = req.params;
    
    if (!uniqueId) {
      res.status(400).json({ 
        success: false,
        error: 'Unique ID is required' 
      });
      return;
    }

    console.log(`🗑️ Deleting token: ${uniqueId}`);
    
    await SimpleTokenService.deleteToken(uniqueId);
    
    res.json({
      success: true,
      message: 'Token deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting token:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
