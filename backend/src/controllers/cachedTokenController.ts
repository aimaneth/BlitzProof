import { Request, Response } from 'express';
import { CachedTokenDataService } from '../services/cachedTokenDataService';
import { getManualTokens } from '../config/tokenConfig';

export class CachedTokenController {
  // Get single token data from cache (instant response)
  static async getCachedToken(req: Request, res: Response): Promise<void> {
    try {
      const { tokenId } = req.params;
      
      if (!tokenId) {
        res.status(400).json({ 
          success: false, 
          error: 'Token ID is required' 
        });
        return;
      }

      console.log(`📊 Getting cached data for token: ${tokenId}`);
      
      // Get from cache immediately
      const cachedData = await CachedTokenDataService.getCachedTokenData(tokenId);
      
      if (!cachedData) {
        // Token not in cache - trigger background refresh and return placeholder
        await CachedTokenDataService.createBackgroundJob('refresh_token', tokenId);
        
        res.json({
          success: true,
          data: {
            tokenId,
            name: tokenId.charAt(0).toUpperCase() + tokenId.slice(1),
            symbol: tokenId.toUpperCase(),
            price: 0,
            priceChange24h: 0,
            marketCap: 0,
            volume24h: 0,
            securityScore: 0,
            holderCount: 0,
            dexPairs: [],
            priceHistory: [],
            lastApiUpdate: null,
            isRefreshing: true,
            message: 'Data is being fetched in the background. Refresh in a few seconds.'
          },
          fromCache: false,
          isRefreshing: true
        });
        return;
      }

      // Return cached data
      res.json({
        success: true,
        data: cachedData,
        fromCache: true,
        isRefreshing: cachedData.isRefreshing,
        lastUpdate: cachedData.lastApiUpdate,
        refreshError: cachedData.refreshError
      });

      // Trigger background refresh if data is older than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (cachedData.lastApiUpdate < fiveMinutesAgo && !cachedData.isRefreshing) {
        await CachedTokenDataService.createBackgroundJob('refresh_token', tokenId);
        console.log(`🔄 Triggered background refresh for ${tokenId}`);
      }

    } catch (error) {
      console.error('❌ Error getting cached token:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get cached token data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all tokens for dashboard (instant response)
  static async getCachedDashboard(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 Getting cached dashboard data...');
      
      // Get all cached tokens
      const cachedTokens = await CachedTokenDataService.getAllCachedTokens();
      
      // Get manual tokens to ensure we have all active tokens
      const manualTokens = await getManualTokens();
      
      // Create a map of cached data
      const cachedMap = new Map(cachedTokens.map(token => [token.coinGeckoId, token]));
      
      // Build response with manual tokens as primary source, cached data for prices
      const tokens = manualTokens.map(manualToken => {
        const cached = cachedMap.get(manualToken.coinGeckoId);
        
        // ALWAYS use manual token data for name, symbol, description
        // Only use cached data for price/market information
        return {
          id: manualToken.id, // 🆕 ADDED: Database ID for navigation
          coinGeckoId: manualToken.coinGeckoId, // 🆕 ADDED: CoinGecko ID for API calls
          address: manualToken.address || cached?.address || `generated_${manualToken.coinGeckoId}`,
          symbol: manualToken.symbol, // ALWAYS from manual tokens
          name: manualToken.name, // ALWAYS from manual tokens
          price: cached?.price || 0,
          marketCap: cached?.marketCap || 0,
          volume24h: cached?.volume24h || 0,
          priceChange24h: cached?.priceChange24h || 0,
          holderCount: cached?.holderCount || 0,
          securityScore: cached?.securityScore || 0,
          lastUpdate: cached?.lastApiUpdate || null,
          isRefreshing: cached?.isRefreshing || false,
          refreshError: cached?.refreshError || null,
          // Add manual token fields
          description: manualToken.description,
          network: manualToken.network,
          category: manualToken.category,
          priority: manualToken.priority,
          riskLevel: manualToken.riskLevel,
          monitoringStrategy: manualToken.monitoringStrategy
        };
      });

      // Calculate stats
      const totalTokens = tokens.length;
      const refreshingTokens = tokens.filter(t => t.isRefreshing).length;
      const tokensWithErrors = tokens.filter(t => t.refreshError).length;
      
      res.json({
        success: true,
        data: {
          tokens,
          stats: {
            totalTokens,
            refreshingTokens,
            tokensWithErrors,
            lastUpdate: new Date().toISOString()
          }
        },
        fromCache: true,
        message: refreshingTokens > 0 ? 
          `${refreshingTokens} tokens are being refreshed in the background` : 
          'All data is current'
      });

      // Trigger background refresh for all tokens if needed
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const tokensNeedingRefresh = cachedTokens.filter(
        token => token.lastApiUpdate < tenMinutesAgo && !token.isRefreshing
      );
      
      if (tokensNeedingRefresh.length > 0) {
        await CachedTokenDataService.createBackgroundJob('refresh_all_tokens');
        console.log(`🔄 Triggered background refresh for ${tokensNeedingRefresh.length} tokens`);
      }

    } catch (error) {
      console.error('❌ Error getting cached dashboard:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get cached dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Force refresh a specific token
  static async forceRefreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { tokenId } = req.params;
      
      if (!tokenId) {
        res.status(400).json({ 
          success: false, 
          error: 'Token ID is required' 
        });
        return;
      }

      console.log(`🔄 Force refreshing token: ${tokenId}`);
      
      // Mark as refreshing
      await CachedTokenDataService.markTokenRefreshing(tokenId, true);
      
      // Create background job
      const job = await CachedTokenDataService.createBackgroundJob('refresh_token', tokenId);
      
      res.json({
        success: true,
        message: `Force refresh initiated for ${tokenId}`,
        jobId: job.id,
        estimatedTime: '30-60 seconds'
      });

    } catch (error) {
      console.error('❌ Error force refreshing token:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to force refresh token',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get refresh status
  static async getRefreshStatus(req: Request, res: Response): Promise<void> {
    try {
      const pendingJobs = await CachedTokenDataService.getPendingJobs();
      const refreshingTokens = await CachedTokenDataService.getAllCachedTokens();
      
      const activeRefreshes = refreshingTokens.filter(token => token.isRefreshing);
      
      res.json({
        success: true,
        data: {
          pendingJobs: pendingJobs.length,
          activeRefreshes: activeRefreshes.length,
          tokensRefreshing: activeRefreshes.map(token => ({
            tokenId: token.tokenId,
            name: token.name,
            symbol: token.symbol,
            lastUpdate: token.lastApiUpdate
          }))
        }
      });

    } catch (error) {
      console.error('❌ Error getting refresh status:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get refresh status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Initialize cache for all manual tokens
  static async initializeCache(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔄 Initializing cache for all manual tokens...');
      
      await CachedTokenDataService.initializeCacheForManualTokens();
      
      // Create background job to refresh all tokens
      await CachedTokenDataService.createBackgroundJob('refresh_all_tokens');
      
      res.json({
        success: true,
        message: 'Cache initialization started. All tokens will be refreshed in the background.',
        estimatedTime: '2-5 minutes'
      });

    } catch (error) {
      console.error('❌ Error initializing cache:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to initialize cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
