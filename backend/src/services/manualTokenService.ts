import pool from '../config/postgres';
import { ManualToken } from '../config/tokenConfig';

export interface DatabaseManualToken {
  id: number;
  token_id: string;
  coin_gecko_id: string;
  name: string;
  symbol: string;
  address?: string;
  network?: string;
  contract_type?: string;
  description?: string;
  added_at: Date;
  is_active: boolean;
  priority?: number;
  category: string;
  monitoring_strategy: string;
  risk_level: string;
  alert_thresholds: any;
  created_at: Date;
  updated_at: Date;
}

export class ManualTokenService {
  // Convert database row to ManualToken interface
  private static mapToManualToken(dbToken: DatabaseManualToken): ManualToken {
    return {
      id: dbToken.token_id,
      coinGeckoId: dbToken.coin_gecko_id,
      name: dbToken.name,
      symbol: dbToken.symbol,
      address: dbToken.address,
      network: dbToken.network,
      contractType: dbToken.contract_type,
      description: dbToken.description,
      addedAt: dbToken.added_at,
      isActive: dbToken.is_active,
      priority: dbToken.priority,
      category: dbToken.category as any,
      monitoringStrategy: dbToken.monitoring_strategy as any,
      riskLevel: dbToken.risk_level as any,
      alertThresholds: dbToken.alert_thresholds
    };
  }

  // Get all manual tokens
  static async getAllTokens(): Promise<ManualToken[]> {
    try {
      const query = `
        SELECT * FROM manual_tokens 
        ORDER BY priority DESC, added_at DESC
      `;
      const result = await pool.query(query);
      return result.rows.map(this.mapToManualToken);
    } catch (error) {
      console.error('Error getting all manual tokens:', error);
      throw error;
    }
  }

  // Get active manual tokens only
  static async getActiveTokens(): Promise<ManualToken[]> {
    try {
      const query = `
        SELECT * FROM manual_tokens 
        WHERE is_active = true 
        ORDER BY priority DESC, added_at DESC
      `;
      const result = await pool.query(query);
      return result.rows.map(this.mapToManualToken);
    } catch (error) {
      console.error('Error getting active manual tokens:', error);
      throw error;
    }
  }

  // Get token by ID
  static async getTokenById(tokenId: string): Promise<ManualToken | null> {
    try {
      const query = 'SELECT * FROM manual_tokens WHERE token_id = $1';
      console.log(`🔍 Service: getTokenById query: ${query} with tokenId: ${tokenId}`);
      
      const result = await pool.query(query, [tokenId]);
      console.log(`🔍 Service: getTokenById result:`, {
        rowCount: result.rowCount,
        rows: result.rows,
        found: result.rows.length > 0
      });
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const mappedToken = this.mapToManualToken(result.rows[0]);
      console.log(`🔍 Service: getTokenById mapped token:`, mappedToken);
      
      return mappedToken;
    } catch (error) {
      console.error('Error getting token by ID:', error);
      throw error;
    }
  }

  // Get token by CoinGecko ID
  static async getTokenByCoinGeckoId(coinGeckoId: string): Promise<ManualToken | null> {
    try {
      const query = 'SELECT * FROM manual_tokens WHERE coin_gecko_id = $1';
      const result = await pool.query(query, [coinGeckoId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToManualToken(result.rows[0]);
    } catch (error) {
      console.error('Error getting token by CoinGecko ID:', error);
      throw error;
    }
  }

  // Add new manual token
  static async addToken(token: Omit<ManualToken, 'id' | 'addedAt'>): Promise<ManualToken> {
    try {
      const query = `
        INSERT INTO manual_tokens (
          token_id, coin_gecko_id, name, symbol, address, network, 
          contract_type, description, priority, category, 
          monitoring_strategy, risk_level, alert_thresholds
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      
      const values = [
        Date.now().toString(), // token_id
        token.coinGeckoId,
        token.name,
        token.symbol,
        token.address,
        token.network,
        token.contractType,
        token.description,
        token.priority || 0,
        token.category,
        token.monitoringStrategy,
        token.riskLevel,
        JSON.stringify(token.alertThresholds)
      ];
      
      const result = await pool.query(query, values);
      return this.mapToManualToken(result.rows[0]);
    } catch (error) {
      console.error('Error adding manual token:', error);
      throw error;
    }
  }

  // Update manual token with comprehensive cache invalidation
  static async updateToken(tokenId: string, updates: Partial<ManualToken>): Promise<ManualToken> {
    try {
      console.log(`🔍 Service: Updating token ${tokenId} with updates:`, updates);
      console.log(`🔍 Service: Token ID type: ${typeof tokenId}, value: ${tokenId}`);
      
      // First, check if the token exists
      const existingToken = await this.getTokenById(tokenId);
      console.log(`🔍 Service: Existing token found:`, existingToken);
      
      if (!existingToken) {
        console.log(`🔍 Service: Token not found by ID, checking by coinGeckoId...`);
        const tokenByCoinGecko = await this.getTokenByCoinGeckoId(tokenId);
        console.log(`🔍 Service: Token by coinGeckoId:`, tokenByCoinGecko);
        
        if (tokenByCoinGecko) {
          console.log(`🔍 Service: Found token by coinGeckoId, using that ID: ${tokenByCoinGecko.id}`);
          tokenId = tokenByCoinGecko.id; // Use the correct ID
        } else {
          throw new Error(`Token with ID '${tokenId}' not found`);
        }
      }
      
      const setFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Build dynamic update query
      if (updates.name !== undefined) {
        setFields.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.symbol !== undefined) {
        setFields.push(`symbol = $${paramCount++}`);
        values.push(updates.symbol);
      }
      if (updates.address !== undefined) {
        console.log(`📍 Adding address field: ${updates.address}`);
        setFields.push(`address = $${paramCount++}`);
        values.push(updates.address);
      }
      if (updates.network !== undefined) {
        setFields.push(`network = $${paramCount++}`);
        values.push(updates.network);
      }
      if (updates.contractType !== undefined) {
        setFields.push(`contract_type = $${paramCount++}`);
        values.push(updates.contractType);
      }
      if (updates.description !== undefined) {
        setFields.push(`description = $${paramCount++}`);
        values.push(updates.description);
      }
      if (updates.priority !== undefined) {
        setFields.push(`priority = $${paramCount++}`);
        values.push(updates.priority);
      }
      if (updates.category !== undefined) {
        setFields.push(`category = $${paramCount++}`);
        values.push(updates.category);
      }
      if (updates.monitoringStrategy !== undefined) {
        setFields.push(`monitoring_strategy = $${paramCount++}`);
        values.push(updates.monitoringStrategy);
      }
      if (updates.riskLevel !== undefined) {
        setFields.push(`risk_level = $${paramCount++}`);
        values.push(updates.riskLevel);
      }
      if (updates.alertThresholds !== undefined) {
        setFields.push(`alert_thresholds = $${paramCount++}`);
        values.push(JSON.stringify(updates.alertThresholds));
      }

      if (setFields.length === 0) {
        // If no fields changed, just return the existing token
        console.log('No fields changed, returning existing token');
        const existingToken = await this.getTokenById(tokenId);
        if (!existingToken) {
          throw new Error(`Token with ID '${tokenId}' not found`);
        }
        return existingToken;
      }

      values.push(tokenId);
      const query = `
        UPDATE manual_tokens 
        SET ${setFields.join(', ')}
        WHERE token_id = $${paramCount}
        RETURNING *
      `;
      
      console.log(`🔍 Service: Final SQL query: ${query}`);
      console.log(`🔍 Service: Query values:`, values);
      console.log(`🔍 Service: Number of fields to update: ${setFields.length}`);
      console.log(`🔍 Service: Looking for token_id: ${tokenId}`);
      
      const result = await pool.query(query, values);
      
      console.log(`🔍 Service: Query result:`, {
        rowCount: result.rowCount,
        rows: result.rows,
        found: result.rows.length > 0
      });
      
      if (result.rows.length === 0) {
        console.log(`❌ Service: No rows updated! Token with ID '${tokenId}' not found in database`);
        throw new Error(`Token with ID '${tokenId}' not found`);
      }
      
      const updatedToken = this.mapToManualToken(result.rows[0]);
      console.log(`🔍 Service: Updated token:`, updatedToken);
      
      // 🔄 COMPREHENSIVE CACHE INVALIDATION
      await this.invalidateRelatedCaches(updatedToken);
      
      return updatedToken;
    } catch (error) {
      console.error('Error updating manual token:', error);
      throw error;
    }
  }

  // Toggle token active status
  static async toggleTokenStatus(tokenId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE manual_tokens 
        SET is_active = NOT is_active 
        WHERE token_id = $1 
        RETURNING is_active
      `;
      
      const result = await pool.query(query, [tokenId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Token with ID '${tokenId}' not found`);
      }
      
      return result.rows[0].is_active;
    } catch (error) {
      console.error('Error toggling token status:', error);
      throw error;
    }
  }

  // Remove manual token
  static async removeToken(tokenId: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM manual_tokens WHERE token_id = $1 RETURNING *';
      const result = await pool.query(query, [tokenId]);
      
      if (result.rows.length === 0) {
        throw new Error(`Token with ID '${tokenId}' not found`);
      }
      
      return true;
    } catch (error) {
      console.error('Error removing manual token:', error);
      throw error;
    }
  }

  // Get active token CoinGecko IDs for API calls
  static async getActiveTokenIds(): Promise<string[]> {
    try {
      const query = 'SELECT coin_gecko_id FROM manual_tokens WHERE is_active = true';
      const result = await pool.query(query);
      return result.rows.map((row: any) => row.coin_gecko_id);
    } catch (error) {
      console.error('Error getting active token IDs:', error);
      throw error;
    }
  }

  // 🔄 NEW: Comprehensive cache invalidation method
  private static async invalidateRelatedCaches(updatedToken: ManualToken): Promise<void> {
    try {
      console.log(`🔄 Invalidating caches for token: ${updatedToken.id} (${updatedToken.coinGeckoId})`);
      
      // 🆕 ONLY CLEAR PRICE CACHES - STATIC DATA COMES FROM MANUAL TOKENS
      await this.clearRedisCaches(updatedToken);
      
      // 🆕 TRIGGER BACKGROUND REFRESH FOR PRICE DATA
      await this.triggerBackgroundRefresh(updatedToken);
      
      // 🆕 BROADCAST WEBSOCKET UPDATE
      await this.broadcastTokenUpdate(updatedToken);
      
      console.log(`✅ Cache invalidation completed for token: ${updatedToken.id}`);
    } catch (error) {
      console.error('❌ Error during cache invalidation:', error);
      // Don't throw error - cache invalidation failure shouldn't break the update
    }
  }

  // 🆕 REMOVED: Update cached_token_data table with new token information
  // Static data (name, symbol, network, etc.) should only come from manual_tokens table

  // Clear Redis caches - ONLY price-related caches
  private static async clearRedisCaches(token: ManualToken): Promise<void> {
    try {
      // Import Redis dynamically to avoid circular dependencies
      const { default: redis } = await import('../config/redis');
      
      const cacheKeys = [
        `price:${token.coinGeckoId}`,
        `chart:${token.coinGeckoId}`,
        `pairs:${token.coinGeckoId}`,
        `market_data:${token.coinGeckoId}`,
        `dashboard:prices`,
        `trending:prices`
      ];
      
      for (const key of cacheKeys) {
        await redis.del(key);
      }
      
      console.log(`🗑️ Cleared price caches for token: ${token.id}`);
    } catch (error) {
      console.error('Error clearing Redis caches:', error);
    }
  }

  // Trigger background refresh for real-time data
  private static async triggerBackgroundRefresh(token: ManualToken): Promise<void> {
    try {
      // Import services dynamically to avoid circular dependencies
      const { CachedTokenDataService } = await import('./cachedTokenDataService');
      
      // Create background job to refresh token data
      await CachedTokenDataService.createBackgroundJob('refresh_token', token.coinGeckoId);
      console.log(`🔄 Triggered background refresh for token: ${token.coinGeckoId}`);
    } catch (error) {
      console.error('Error triggering background refresh:', error);
    }
  }

  // Broadcast WebSocket update
  private static async broadcastTokenUpdate(token: ManualToken): Promise<void> {
    try {
      // Note: WebSocket broadcasting is handled in the controller layer
      // where we have access to the app context
      console.log(`📡 Token update ready for broadcast: ${token.id}`);
    } catch (error) {
      console.error('Error preparing token update broadcast:', error);
    }
  }
}
