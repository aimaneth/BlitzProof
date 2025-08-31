import { CachedTokenDataService, BackgroundJob } from './cachedTokenDataService';
import { BlockNetDataService } from './blockNetDataService';
import { getManualTokens } from '../config/tokenConfig';
import WebSocketService from './websocketService';

export class BackgroundRefreshService {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;
  private static blockNetDataService = new BlockNetDataService();
  private static wsService: WebSocketService | null = null;

  // Start the background refresh service
  static start(wsService?: WebSocketService): void {
    if (this.isRunning) {
      console.log('⚠️ Background refresh service is already running');
      return;
    }

    console.log('🚀 Starting background refresh service...');
    this.isRunning = true;
    this.wsService = wsService || null;

    // Process jobs every 30 seconds
    this.intervalId = setInterval(() => {
      this.processJobs().catch(error => {
        console.error('❌ Error in background job processing:', error);
      });
    }, 30000);

    // Initial job processing
    this.processJobs().catch(error => {
      console.error('❌ Error in initial job processing:', error);
    });

    console.log('✅ Background refresh service started');
  }

  // Stop the background refresh service
  static stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Background refresh service is not running');
      return;
    }

    console.log('🛑 Stopping background refresh service...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('✅ Background refresh service stopped');
  }

  // Process pending background jobs
  private static async processJobs(): Promise<void> {
    try {
      const pendingJobs = await CachedTokenDataService.getPendingJobs();
      
      if (pendingJobs.length === 0) {
        return;
      }

      console.log(`🔄 Processing ${pendingJobs.length} background jobs...`);

      for (const job of pendingJobs) {
        try {
          await this.processJob(job);
        } catch (error) {
          console.error(`❌ Error processing job ${job.id}:`, error);
          
          // Update job with error
          await CachedTokenDataService.updateBackgroundJob(job.id!, {
            status: 'failed',
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            retryCount: job.retryCount + 1
          });
        }
      }
    } catch (error) {
      console.error('❌ Error getting pending jobs:', error);
    }
  }

  // Process a single background job
  private static async processJob(job: BackgroundJob): Promise<void> {
    console.log(`🔄 Processing job ${job.id}: ${job.jobType} for ${job.tokenId || 'all tokens'}`);

    // Update job status to running
    await CachedTokenDataService.updateBackgroundJob(job.id!, {
      status: 'running',
      startedAt: new Date()
    });

    try {
      switch (job.jobType) {
        case 'refresh_token':
          await this.refreshSingleToken(job.tokenId!);
          break;
        
        case 'refresh_all_tokens':
          await this.refreshAllTokens();
          break;
        
        default:
          throw new Error(`Unknown job type: ${job.jobType}`);
      }

      // Mark job as completed
      await CachedTokenDataService.updateBackgroundJob(job.id!, {
        status: 'completed',
        completedAt: new Date()
      });

      console.log(`✅ Completed job ${job.id}: ${job.jobType}`);

    } catch (error) {
      console.error(`❌ Failed job ${job.id}:`, error);
      
      // Set error on the token if it's a specific token job
      if (job.tokenId) {
        await CachedTokenDataService.setRefreshError(
          job.tokenId, 
          error instanceof Error ? error.message : 'Refresh failed'
        );
      }
      
      throw error;
    }
  }

  // Refresh a single token
  private static async refreshSingleToken(tokenId: string): Promise<void> {
    try {
      console.log(`🔄 Refreshing token: ${tokenId}`);
      
      // Mark as refreshing
      await CachedTokenDataService.markTokenRefreshing(tokenId, true);
      
      // Get fresh data from APIs
      const freshData = await this.blockNetDataService.getComprehensiveTokenData(tokenId);
      
      if (!freshData || !freshData.combined) {
        throw new Error('No data received from API');
      }

      const tokenData = freshData.combined;
      const coinGeckoData = freshData.coinGecko;
      const dexScreenerData = freshData.dexScreener;

      // Get manual token info for static data
      const manualTokens = await getManualTokens();
      const manualToken = manualTokens.find(t => t.coinGeckoId === tokenId);

      // 🆕 ONLY CACHE PRICE/REAL-TIME DATA
      const cachedData = {
        tokenId: manualToken?.id || tokenId,
        coinGeckoId: tokenId,
        // 🆕 ONLY PRICE/REAL-TIME DATA - NO STATIC DATA
        price: tokenData.price || 0,
        priceChange24h: tokenData.priceChange24h || 0,
        marketCap: tokenData.marketCap || 0,
        volume24h: tokenData.volume24h || 0,
        securityScore: tokenData.securityScore || 0,
        holderCount: 0, // Not available in combined data
        dexPairs: dexScreenerData?.pairs || [],
        priceHistory: [], // We'll implement this later
        apiData: {
          coinGecko: coinGeckoData,
          dexScreener: dexScreenerData,
          lastFetch: new Date().toISOString()
        }
      };

      // Save to cache
      await CachedTokenDataService.saveCachedTokenData(cachedData);
      
      console.log(`✅ Refreshed price data for token: ${tokenId}`);
      
      // Mark as not refreshing
      await CachedTokenDataService.markTokenRefreshing(tokenId, false);
      
    } catch (error) {
      console.error(`❌ Error refreshing token ${tokenId}:`, error);
      
      // Mark as not refreshing and set error
      await CachedTokenDataService.markTokenRefreshing(tokenId, false);
      await CachedTokenDataService.setRefreshError(tokenId, error instanceof Error ? error.message : 'Unknown error');
      
      throw error;
    }
  }

  // Refresh all active tokens
  private static async refreshAllTokens(): Promise<void> {
    try {
      console.log('🔄 Refreshing all tokens...');
      
      const manualTokens = await getManualTokens();
      
      if (manualTokens.length === 0) {
        console.log('⚠️ No manual tokens to refresh');
        return;
      }

      console.log(`🎯 Refreshing ${manualTokens.length} tokens...`);

      // Refresh tokens in batches to avoid rate limits
      const batchSize = 3;
      for (let i = 0; i < manualTokens.length; i += batchSize) {
        const batch = manualTokens.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(token => 
          this.refreshSingleToken(token.coinGeckoId).catch(error => {
            console.error(`❌ Failed to refresh ${token.name}:`, error);
            return null; // Don't fail the entire batch
          })
        );
        
        await Promise.all(batchPromises);
        
        // Wait between batches to respect rate limits
        if (i + batchSize < manualTokens.length) {
          console.log(`⏳ Waiting 5 seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      console.log('✅ Completed refreshing all tokens');

    } catch (error) {
      console.error('❌ Error refreshing all tokens:', error);
      throw error;
    }
  }

  // Initialize the service with cache setup
  static async initialize(wsService?: WebSocketService): Promise<void> {
    try {
      console.log('🔄 Initializing background refresh service...');
      
      // Initialize cache for all manual tokens
      await CachedTokenDataService.initializeCacheForManualTokens();
      
      // Create initial refresh job
      await CachedTokenDataService.createBackgroundJob('refresh_all_tokens');
      
      // Start the service
      this.start(wsService);
      
      console.log('✅ Background refresh service initialized');
      
    } catch (error) {
      console.error('❌ Error initializing background refresh service:', error);
      throw error;
    }
  }

  // Get service status
  static getStatus(): { isRunning: boolean; stats: any } {
    return {
      isRunning: this.isRunning,
      stats: {
        startTime: this.intervalId ? new Date() : null,
        intervalMs: 30000
      }
    };
  }
}
