import pool from '../config/postgres';

export interface CachedTokenData {
  tokenId: string;
  coinGeckoId: string;
  // 🆕 ONLY PRICE/REAL-TIME DATA IN CACHE
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  securityScore: number;
  holderCount: number;
  dexPairs: any[];
  priceHistory: any[];
  apiData: any;
  lastApiUpdate: Date;
  isRefreshing: boolean;
  refreshError?: string;
}

export interface BackgroundJob {
  id?: number;
  jobType: string;
  tokenId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

export class CachedTokenDataService {
  // Get cached token data - returns immediately from database
  static async getCachedTokenData(tokenId: string): Promise<CachedTokenData | null> {
    try {
      const query = `
        SELECT 
          token_id, coin_gecko_id, price, price_change_24h,
          market_cap, volume_24h, security_score, holder_count,
          dex_pairs, price_history, api_data,
          last_api_update, is_refreshing, refresh_error
        FROM cached_token_data 
        WHERE token_id = $1 OR coin_gecko_id = $1
        ORDER BY last_api_update DESC 
        LIMIT 1
      `;
      
      const result = await pool.query(query, [tokenId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        tokenId: row.token_id,
        coinGeckoId: row.coin_gecko_id,
        // 🆕 ONLY PRICE/REAL-TIME DATA
        price: parseFloat(row.price) || 0,
        priceChange24h: parseFloat(row.price_change_24h) || 0,
        marketCap: parseInt(row.market_cap) || 0,
        volume24h: parseInt(row.volume_24h) || 0,
        securityScore: row.security_score || 0,
        holderCount: row.holder_count || 0,
        dexPairs: row.dex_pairs || [],
        priceHistory: row.price_history || [],
        apiData: row.api_data || {},
        lastApiUpdate: row.last_api_update,
        isRefreshing: row.is_refreshing || false,
        refreshError: row.refresh_error
      };
    } catch (error) {
      console.error('Error getting cached token data:', error);
      return null;
    }
  }

  // Get all cached tokens for dashboard - combines manual token info with cached price data
  static async getAllCachedTokens(): Promise<Array<CachedTokenData & {
    // 🆕 STATIC DATA FROM MANUAL TOKENS
    name: string;
    symbol: string;
    network?: string;
    address?: string;
    contractType?: string;
    category?: string;
    priority?: number;
    riskLevel?: string;
    monitoringStrategy?: string;
    description?: string;
  }>> {
    try {
      const query = `
        SELECT 
          -- 🆕 CACHED PRICE/REAL-TIME DATA
          ctd.token_id, ctd.coin_gecko_id, ctd.price, ctd.price_change_24h,
          ctd.market_cap, ctd.volume_24h, ctd.security_score, ctd.holder_count,
          ctd.dex_pairs, ctd.price_history, ctd.api_data, ctd.last_api_update,
          ctd.is_refreshing, ctd.refresh_error,
          -- 🆕 STATIC DATA FROM MANUAL TOKENS (PRIMARY SOURCE)
          mt.name, mt.symbol, mt.network, mt.address, mt.contract_type,
          mt.category, mt.priority, mt.risk_level, mt.monitoring_strategy, mt.description
        FROM manual_tokens mt
        LEFT JOIN cached_token_data ctd ON mt.coin_gecko_id = ctd.coin_gecko_id
        WHERE mt.is_active = true
        ORDER BY mt.priority DESC, ctd.last_api_update DESC NULLS LAST
      `;
      
      const result = await pool.query(query);
      
      return result.rows.map(row => ({
        // 🆕 CACHED PRICE/REAL-TIME DATA
        tokenId: row.token_id,
        coinGeckoId: row.coin_gecko_id,
        price: parseFloat(row.price) || 0,
        priceChange24h: parseFloat(row.price_change_24h) || 0,
        marketCap: parseInt(row.market_cap) || 0,
        volume24h: parseInt(row.volume_24h) || 0,
        securityScore: row.security_score || 0,
        holderCount: row.holder_count || 0,
        dexPairs: row.dex_pairs || [],
        priceHistory: row.price_history || [],
        apiData: row.api_data || {},
        lastApiUpdate: row.last_api_update,
        isRefreshing: row.is_refreshing || false,
        refreshError: row.refresh_error,
        // 🆕 STATIC DATA FROM MANUAL TOKENS (PRIMARY SOURCE)
        name: row.name,
        symbol: row.symbol,
        network: row.network,
        address: row.address,
        contractType: row.contract_type,
        category: row.category,
        priority: row.priority,
        riskLevel: row.risk_level,
        monitoringStrategy: row.monitoring_strategy,
        description: row.description
      }));
    } catch (error) {
      console.error('Error getting all cached tokens:', error);
      return [];
    }
  }

  // Save/update cached token data - ONLY price/real-time data
  static async saveCachedTokenData(data: Omit<CachedTokenData, 'lastApiUpdate' | 'isRefreshing'>): Promise<CachedTokenData> {
    try {
      const query = `
        INSERT INTO cached_token_data (
          token_id, coin_gecko_id, price, price_change_24h,
          market_cap, volume_24h, security_score, holder_count,
          dex_pairs, price_history, api_data,
          last_api_update, is_refreshing
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false
        )
        ON CONFLICT (token_id) DO UPDATE SET
          coin_gecko_id = EXCLUDED.coin_gecko_id,
          price = EXCLUDED.price,
          price_change_24h = EXCLUDED.price_change_24h,
          market_cap = EXCLUDED.market_cap,
          volume_24h = EXCLUDED.volume_24h,
          security_score = EXCLUDED.security_score,
          holder_count = EXCLUDED.holder_count,
          dex_pairs = EXCLUDED.dex_pairs,
          price_history = EXCLUDED.price_history,
          api_data = EXCLUDED.api_data,
          last_api_update = CURRENT_TIMESTAMP,
          is_refreshing = false,
          refresh_error = NULL
        RETURNING *
      `;

      const values = [
        data.tokenId,
        data.coinGeckoId,
        data.price,
        data.priceChange24h,
        data.marketCap,
        data.volume24h,
        data.securityScore,
        data.holderCount,
        JSON.stringify(data.dexPairs),
        JSON.stringify(data.priceHistory),
        JSON.stringify(data.apiData),
        new Date()
      ];

      const result = await pool.query(query, values);
      
      const row = result.rows[0];
      return {
        tokenId: row.token_id,
        coinGeckoId: row.coin_gecko_id,
        price: parseFloat(row.price) || 0,
        priceChange24h: parseFloat(row.price_change_24h) || 0,
        marketCap: parseInt(row.market_cap) || 0,
        volume24h: parseInt(row.volume_24h) || 0,
        securityScore: row.security_score || 0,
        holderCount: row.holder_count || 0,
        dexPairs: row.dex_pairs || [],
        priceHistory: row.price_history || [],
        apiData: row.api_data || {},
        lastApiUpdate: row.last_api_update,
        isRefreshing: row.is_refreshing || false,
        refreshError: row.refresh_error
      };
    } catch (error) {
      console.error('Error saving cached token data:', error);
      throw error;
    }
  }

  // Mark token as refreshing
  static async markTokenRefreshing(tokenId: string, isRefreshing: boolean): Promise<void> {
    try {
      const query = `
        UPDATE cached_token_data 
        SET is_refreshing = $1, refresh_error = NULL
        WHERE token_id = $2 OR coin_gecko_id = $2
      `;
      
      await pool.query(query, [isRefreshing, tokenId]);
    } catch (error) {
      console.error('Error marking token refreshing status:', error);
    }
  }

  // Set refresh error
  static async setRefreshError(tokenId: string, error: string): Promise<void> {
    try {
      const query = `
        UPDATE cached_token_data 
        SET is_refreshing = false, refresh_error = $1
        WHERE token_id = $2 OR coin_gecko_id = $2
      `;
      
      await pool.query(query, [error, tokenId]);
    } catch (error) {
      console.error('Error setting refresh error:', error);
    }
  }

  // Initialize cache entries for manual tokens - ONLY price data
  static async initializeCacheForManualTokens(): Promise<void> {
    try {
      console.log('🔄 Initializing cache entries for manual tokens...');
      
      const manualTokensQuery = `
        SELECT token_id, coin_gecko_id
        FROM manual_tokens 
        WHERE is_active = true
      `;
      
      const manualTokensResult = await pool.query(manualTokensQuery);
      
      for (const token of manualTokensResult.rows) {
        // Check if cache entry exists
        const existingCache = await this.getCachedTokenData(token.coin_gecko_id);
        
        if (!existingCache) {
          // Create initial cache entry with placeholder price data
          const initialData: Omit<CachedTokenData, 'lastApiUpdate' | 'isRefreshing'> = {
            tokenId: token.token_id,
            coinGeckoId: token.coin_gecko_id,
            // 🆕 ONLY PRICE/REAL-TIME DATA
            price: 0,
            priceChange24h: 0,
            marketCap: 0,
            volume24h: 0,
            securityScore: 0,
            holderCount: 0,
            dexPairs: [],
            priceHistory: [],
            apiData: {},
            refreshError: 'Initial cache entry - price data will be updated shortly'
          };
          
          await this.saveCachedTokenData(initialData);
          console.log(`✅ Initialized price cache for ${token.coin_gecko_id}`);
        }
      }
      
      console.log('✅ Price cache initialization completed');
    } catch (error) {
      console.error('Error initializing cache for manual tokens:', error);
    }
  }

  // Background job management
  static async createBackgroundJob(jobType: string, tokenId?: string): Promise<BackgroundJob> {
    try {
      const query = `
        INSERT INTO background_jobs (job_type, token_id, status, started_at, retry_count, max_retries)
        VALUES ($1, $2, 'pending', $3, 0, 3)
        RETURNING *
      `;
      
      const result = await pool.query(query, [jobType, tokenId, new Date()]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        jobType: row.job_type,
        tokenId: row.token_id,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        errorMessage: row.error_message,
        retryCount: row.retry_count,
        maxRetries: row.max_retries
      };
    } catch (error) {
      console.error('Error creating background job:', error);
      throw error;
    }
  }

  static async updateBackgroundJob(jobId: number, updates: Partial<BackgroundJob>): Promise<void> {
    try {
      const setFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.status !== undefined) {
        setFields.push(`status = $${paramCount++}`);
        values.push(updates.status);
      }
      
      if (updates.completedAt !== undefined) {
        setFields.push(`completed_at = $${paramCount++}`);
        values.push(updates.completedAt);
      }
      
      if (updates.errorMessage !== undefined) {
        setFields.push(`error_message = $${paramCount++}`);
        values.push(updates.errorMessage);
      }
      
      if (updates.retryCount !== undefined) {
        setFields.push(`retry_count = $${paramCount++}`);
        values.push(updates.retryCount);
      }

      if (setFields.length === 0) return;

      values.push(jobId);
      const query = `
        UPDATE background_jobs 
        SET ${setFields.join(', ')}
        WHERE id = $${paramCount}
      `;
      
      await pool.query(query, values);
    } catch (error) {
      console.error('Error updating background job:', error);
    }
  }

  // Get pending background jobs
  static async getPendingJobs(): Promise<BackgroundJob[]> {
    try {
      const query = `
        SELECT * FROM background_jobs 
        WHERE status IN ('pending', 'failed') AND retry_count < max_retries
        ORDER BY created_at ASC
        LIMIT 10
      `;
      
      const result = await pool.query(query);
      
      return result.rows.map((row: any) => ({
        id: row.id,
        jobType: row.job_type,
        tokenId: row.token_id,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        errorMessage: row.error_message,
        retryCount: row.retry_count,
        maxRetries: row.max_retries
      }));
    } catch (error) {
      console.error('Error getting pending jobs:', error);
      return [];
    }
  }
}
