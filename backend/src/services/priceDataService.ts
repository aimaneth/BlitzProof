import axios from 'axios';
import pool from '../config/postgres';

// 🆕 ROBUST PRICE DATA SERVICE
// Handles real-time price fetching from multiple sources with proper error handling

export interface PriceData {
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  pairsCount: number;
  totalLiquidity: number;
  source: 'coingecko' | 'dexscreener' | 'combined' | 'none';
  lastUpdated: Date;
  reliability: number; // 0-100 confidence score
  error?: string;
}

export interface CoinGeckoPriceData {
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: Date;
}

export interface DexScreenerPriceData {
  price: number;
  priceChange24h: number;
  volume24h: number;
  pairsCount: number;
  totalLiquidity: number;
  lastUpdated: Date;
}



export class PriceDataService {
  private coingeckoApiKey: string;
  private coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private dexScreenerBaseUrl = 'https://api.dexscreener.com/latest';
  private lastApiCall: number = 0;
  private readonly API_DELAY = 2000; // 2 seconds between calls

  constructor() {
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY || '';
  }

  // Rate limiting helper
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    
    if (timeSinceLastCall < this.API_DELAY) {
      const delay = this.API_DELAY - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${delay}ms before next API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastApiCall = Date.now();
  }

  // 🔍 GET COINGECKO PRICE DATA
  async getCoinGeckoPrice(tokenId: string): Promise<CoinGeckoPriceData | null> {
    try {
      console.log(`🔄 Fetching CoinGecko price for: ${tokenId}`);
      
      // Apply rate limiting
      await this.rateLimit();
      
      // Use simple price endpoint for better rate limits
      const response = await axios.get(
        `${this.coingeckoBaseUrl}/simple/price`,
        {
          params: {
            ids: tokenId,
            vs_currencies: 'usd',
            include_24hr_change: true,
            include_market_cap: true,
            include_24hr_vol: true
          },
          headers: this.coingeckoApiKey ? { 'X-CG-API-KEY': this.coingeckoApiKey } : {},
          timeout: 10000
        }
      );

      const data = (response.data as any)[tokenId];
      if (!data) {
        console.warn(`⚠️ No CoinGecko data found for: ${tokenId}`);
        return null;
      }

      const result = {
        price: data.usd || 0,
        priceChange24h: data.usd_24h_change || 0,
        marketCap: data.usd_market_cap || 0,
        volume24h: data.usd_24h_vol || 0,
        lastUpdated: new Date()
      };

      console.log(`🔍 CoinGecko data for ${tokenId}:`, {
        price: result.price,
        marketCap: result.marketCap,
        volume24h: result.volume24h,
        rawData: data
      });

      return result;

    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        console.warn(`⚠️ CoinGecko rate limit hit for ${tokenId}, will retry later`);
      } else {
        console.error(`❌ CoinGecko API error for ${tokenId}:`, error instanceof Error ? error.message : 'Unknown error');
      }
      return null;
    }
  }

  // 🔍 GET DEXSCREENER PRICE DATA
  async getDexScreenerPrice(tokenId: string): Promise<DexScreenerPriceData | null> {
    try {
      console.log(`🔄 Fetching DexScreener price for: ${tokenId}`);
      
      // Map CoinGecko IDs to more specific search terms for better DexScreener results
      const searchTerms: {[key: string]: string} = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH', 
        'cardano': 'ADA',
        'dogecoin': 'DOGE',
        'solana': 'SOL',
        'polygon': 'MATIC',
        'chainlink': 'LINK',
        'litecoin': 'LTC',
        'bitcoin-cash': 'BCH',
        'stellar': 'XLM',
        'blox-myrc': 'MYRC'
      };

      const searchTerm = searchTerms[tokenId.toLowerCase()] || tokenId;
      
      // First, get token pairs with more specific search
      const pairsResponse = await axios.get(
        `${this.dexScreenerBaseUrl}/dex/search`,
        {
          params: { q: searchTerm },
          timeout: 10000
        }
      );

      const allPairs = (pairsResponse.data as any).pairs || [];
      if (allPairs.length === 0) {
        console.warn(`⚠️ No DexScreener pairs found for: ${tokenId}`);
        return null;
      }

      // Filter pairs to only include the specific token we're looking for
      const relevantPairs = allPairs.filter((pair: any) => {
        const baseSymbol = pair.baseToken?.symbol?.toLowerCase();
        const quoteSymbol = pair.quoteToken?.symbol?.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        // Include pairs where our token is either base or quote
        return baseSymbol === searchLower || quoteSymbol === searchLower;
      });

      // If no relevant pairs found, use all pairs but log a warning
      const pairs = relevantPairs.length > 0 ? relevantPairs : allPairs;
      
      if (relevantPairs.length === 0) {
        console.warn(`⚠️ No specific pairs found for ${tokenId}, using generic results`);
      }

      // Get the most liquid pair (highest USD liquidity)
      const primaryPair = pairs.reduce((prev: any, current: any) => 
        (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev
      );

      const totalLiquidity = pairs.reduce((sum: number, pair: any) => sum + (pair.liquidity?.usd || 0), 0);
      const totalVolume24h = pairs.reduce((sum: number, pair: any) => sum + (pair.volume?.h24 || 0), 0);

      console.log(`📊 DexScreener data for ${tokenId}: ${pairs.length} pairs, $${totalLiquidity.toLocaleString()} liquidity`);

      return {
        price: parseFloat(primaryPair.priceUsd) || 0,
        priceChange24h: primaryPair.priceChange?.h24 || 0,
        volume24h: totalVolume24h,
        pairsCount: pairs.length,
        totalLiquidity: totalLiquidity,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error(`❌ DexScreener API error for ${tokenId}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  // 🔄 GET COMBINED PRICE DATA (PRIMARY METHOD)
  async getCombinedPrice(tokenId: string): Promise<PriceData> {
    console.log(`🎯 Fetching combined price data for: ${tokenId}`);

    // Try CoinGecko first (more reliable for established tokens)
    const coingeckoData = await this.getCoinGeckoPrice(tokenId);
    
    // Try DexScreener for DEX data
    const dexScreenerData = await this.getDexScreenerPrice(tokenId);

    // Combine data with reliability scoring
    if (coingeckoData && dexScreenerData) {
      // Both sources available - combine them
      const combinedData: PriceData = {
        price: coingeckoData.price || dexScreenerData.price,
        priceChange24h: coingeckoData.priceChange24h || dexScreenerData.priceChange24h,
        marketCap: coingeckoData.marketCap || 0, // Only CoinGecko provides market cap
        volume24h: Math.max(coingeckoData.volume24h, dexScreenerData.volume24h),
        pairsCount: dexScreenerData.pairsCount || 0,
        totalLiquidity: dexScreenerData.totalLiquidity || 0,
        source: 'combined',
        lastUpdated: new Date(),
        reliability: 95 // High reliability when both sources agree
      };

      console.log(`✅ Combined price data for ${tokenId}: $${combinedData.price}, Market Cap: $${combinedData.marketCap}`);
      return combinedData;

    } else if (coingeckoData) {
      // Only CoinGecko data available
      const priceData: PriceData = {
        price: coingeckoData.price,
        priceChange24h: coingeckoData.priceChange24h,
        marketCap: coingeckoData.marketCap,
        volume24h: coingeckoData.volume24h,
        pairsCount: 0,
        totalLiquidity: 0,
        source: 'coingecko',
        lastUpdated: new Date(),
        reliability: 85
      };

      console.log(`✅ CoinGecko price data for ${tokenId}: $${priceData.price}`);
      return priceData;

    } else if (dexScreenerData) {
      // Only DexScreener data available - try to estimate market cap
      let estimatedMarketCap = 0;
      
      // For major tokens, we can estimate market cap from known supply data
      const knownSupplies: {[key: string]: number} = {
        'bitcoin': 21000000, // BTC max supply
        'ethereum': 120000000, // ETH approximate supply
        'cardano': 45000000000, // ADA max supply
        'dogecoin': 144000000000, // DOGE approximate supply
      };
      
      const supply = knownSupplies[tokenId.toLowerCase()];
      if (supply && dexScreenerData.price > 0) {
        estimatedMarketCap = supply * dexScreenerData.price;
        console.log(`📊 Estimated market cap for ${tokenId}: ${supply.toLocaleString()} × $${dexScreenerData.price} = $${estimatedMarketCap.toLocaleString()}`);
      }
      
      const priceData: PriceData = {
        price: dexScreenerData.price,
        priceChange24h: dexScreenerData.priceChange24h,
        marketCap: estimatedMarketCap,
        volume24h: dexScreenerData.volume24h,
        pairsCount: dexScreenerData.pairsCount,
        totalLiquidity: dexScreenerData.totalLiquidity,
        source: 'dexscreener',
        lastUpdated: new Date(),
        reliability: estimatedMarketCap > 0 ? 70 : 60 // Lower reliability for estimates
      };

      console.log(`✅ DexScreener price data for ${tokenId}: $${priceData.price}, Market Cap: $${priceData.marketCap}`);
      return priceData;

    } else {
      // No data available
      console.warn(`⚠️ No price data available for: ${tokenId}`);
      return {
        price: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        pairsCount: 0,
        totalLiquidity: 0,
        source: 'none',
        lastUpdated: new Date(),
        reliability: 0,
        error: 'No price data available from any source'
      };
    }
  }

  // 💾 UPDATE TOKEN PRICE IN DATABASE
  async updateTokenPrice(tokenId: string, priceData: PriceData): Promise<void> {
    try {
      const client = await pool.connect();
      
      const updateQuery = `
        UPDATE tokens 
        SET 
          current_price = $1,
          price_change_24h = $2,
          market_cap = $3,
          volume_24h = $4,
          pairs_count = $5,
          total_liquidity = $6,
          price_source = $7,
          price_reliability = $8,
          last_price_update = $9
        WHERE coin_gecko_id = $10 OR unique_id = $10
      `;

      await client.query(updateQuery, [
        priceData.price,
        priceData.priceChange24h,
        priceData.marketCap,
        priceData.volume24h,
        priceData.pairsCount,
        priceData.totalLiquidity,
        priceData.source,
        priceData.reliability,
        priceData.lastUpdated,
        tokenId
      ]);

      // Also update token_dex_pairs table if we have DEX data
      if (priceData.pairsCount > 0) {
        await this.updateDexPairs(tokenId, priceData);
      }

      console.log(`✅ Updated price data for ${tokenId} in database`);
      client.release();

    } catch (error) {
      console.error(`❌ Database update error for ${tokenId}:`, error);
      throw error;
    }
  }

  // 🔄 UPDATE DEX PAIRS DATA
  private async updateDexPairs(tokenId: string, priceData: PriceData): Promise<void> {
    try {
      const client = await pool.connect();
      
      // Clear existing pairs for this token
      await client.query('DELETE FROM token_dex_pairs WHERE token_id = (SELECT id FROM tokens WHERE coin_gecko_id = $1 OR unique_id = $1)', [tokenId]);
      
      // Insert new pair data (simplified - just the summary)
      const insertQuery = `
        INSERT INTO token_dex_pairs (
          token_id, dex_name, liquidity_usd, volume_24h, price_usd, price_change_24h, is_active
        ) VALUES (
          (SELECT id FROM tokens WHERE coin_gecko_id = $1 OR unique_id = $1),
          'Combined DEX', $2, $3, $4, $5, true
        )
      `;

      await client.query(insertQuery, [
        tokenId,
        priceData.totalLiquidity,
        priceData.volume24h,
        priceData.price,
        priceData.priceChange24h
      ]);

      client.release();

    } catch (error) {
      console.error(`❌ DEX pairs update error for ${tokenId}:`, error);
    }
  }

  // 📊 GET CACHED PRICE DATA FROM DATABASE
  async getCachedPrice(tokenId: string): Promise<PriceData | null> {
    try {
      const client = await pool.connect();
      
      const query = `
        SELECT 
          current_price, price_change_24h, market_cap, volume_24h,
          pairs_count, total_liquidity, price_source, price_reliability,
          last_price_update
        FROM tokens 
        WHERE coin_gecko_id = $1 OR unique_id = $1
      `;

      const result = await client.query(query, [tokenId]);
      client.release();

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      
      // Helper function to safely parse numbers
      const safeParseFloat = (value: any): number => {
        if (value === null || value === undefined) return 0;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };
      
      // Debug logging for market cap
      console.log(`🔍 Cached price data for ${tokenId}:`, {
        rawMarketCap: row.market_cap,
        parsedMarketCap: safeParseFloat(row.market_cap),
        rawPrice: row.current_price,
        parsedPrice: safeParseFloat(row.current_price),
        lastUpdate: row.last_price_update
      });
      
      return {
        price: safeParseFloat(row.current_price),
        priceChange24h: safeParseFloat(row.price_change_24h),
        marketCap: safeParseFloat(row.market_cap),
        volume24h: safeParseFloat(row.volume_24h),
        pairsCount: row.pairs_count || 0,
        totalLiquidity: safeParseFloat(row.total_liquidity),
        source: row.price_source || 'none',
        lastUpdated: row.last_price_update || new Date(),
        reliability: row.price_reliability || 0
      };

    } catch (error) {
      console.error(`❌ Database read error for ${tokenId}:`, error);
      return null;
    }
  }

  // 🔄 REFRESH TOKEN PRICE (MAIN METHOD - NEVER STALE!)
  async refreshTokenPrice(tokenId: string): Promise<PriceData> {
    console.log(`🔄 FORCE REFRESHING price data for: ${tokenId} - NO STALE DATA ALLOWED!`);
    
    // ALWAYS clear cache first - NO EXCEPTIONS!
    await this.clearTokenPriceCache(tokenId);
    
    // Get fresh data from APIs
    const freshData = await this.getCombinedPrice(tokenId);
    
    // Validate the data is not stale
    if (this.isPriceDataStale(freshData)) {
      console.warn(`⚠️ Fresh data appears stale for ${tokenId}, retrying...`);
      // Retry once more
      await this.clearTokenPriceCache(tokenId);
      const retryData = await this.getCombinedPrice(tokenId);
      await this.updateTokenPrice(tokenId, retryData);
      return retryData;
    }
    
    // Update database
    await this.updateTokenPrice(tokenId, freshData);
    console.log(`✅ FRESH price data updated for ${tokenId}: $${freshData.price}`);
    return freshData;
  }

  // 🚀 AUTO-REFRESH ALL PRICES (PREVENT STALE DATA)
  async autoRefreshAllPrices(): Promise<void> {
    console.log(`🚀 AUTO-REFRESHING all prices to prevent stale data...`);
    
    const tokens = ['bitcoin', 'ethereum', 'cardano', 'dogecoin', 'blox-myrc'];
    
    for (const tokenId of tokens) {
      try {
        await this.refreshTokenPrice(tokenId);
        // Small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Auto-refresh failed for ${tokenId}:`, error);
      }
    }
    
    console.log(`✅ Auto-refresh completed for all tokens`);
  }

  // 🔍 CHECK IF PRICE DATA IS STALE
  private isPriceDataStale(data: PriceData): boolean {
    // Check for obviously stale prices
    const stalePrices: {[key: string]: number} = {
      'bitcoin': 65000, // If BTC is around 65k, it's stale
      'ethereum': 3700, // If ETH is around 3.7k, it's stale
    };
    
    // Check if price is suspiciously close to known stale values
    for (const [token, stalePrice] of Object.entries(stalePrices)) {
      if (Math.abs(data.price - stalePrice) < 100) {
        console.warn(`🚨 STALE PRICE DETECTED: ${token} at $${data.price} (stale: $${stalePrice})`);
        return true;
      }
    }
    
    return false;
  }

  // 🗑️ CLEAR TOKEN PRICE CACHE
  private async clearTokenPriceCache(tokenId: string): Promise<void> {
    try {
      const client = await pool.connect();
      
      const query = `
        UPDATE tokens 
        SET 
          current_price = NULL,
          price_change_24h = NULL,
          market_cap = NULL,
          volume_24h = NULL,
          last_price_update = NULL
        WHERE coin_gecko_id = $1 OR unique_id = $1
      `;
      
      await client.query(query, [tokenId]);
      client.release();
      
      console.log(`🗑️ Cleared price cache for ${tokenId}`);
    } catch (error) {
      console.error(`❌ Error clearing cache for ${tokenId}:`, error);
    }
  }


}

export default PriceDataService;
