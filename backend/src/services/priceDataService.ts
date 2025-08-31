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

  constructor() {
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY || '';
  }

  // 🔍 GET COINGECKO PRICE DATA
  async getCoinGeckoPrice(tokenId: string): Promise<CoinGeckoPriceData | null> {
    try {
      console.log(`🔄 Fetching CoinGecko price for: ${tokenId}`);
      
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

      return {
        price: data.usd || 0,
        priceChange24h: data.usd_24h_change || 0,
        marketCap: data.usd_market_cap || 0,
        volume24h: data.usd_24h_vol || 0,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error(`❌ CoinGecko API error for ${tokenId}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  // 🔍 GET DEXSCREENER PRICE DATA
  async getDexScreenerPrice(tokenId: string): Promise<DexScreenerPriceData | null> {
    try {
      console.log(`🔄 Fetching DexScreener price for: ${tokenId}`);
      
      // First, get token pairs
      const pairsResponse = await axios.get(
        `${this.dexScreenerBaseUrl}/dex/search`,
        {
          params: { q: tokenId },
          timeout: 10000
        }
      );

      const pairs = (pairsResponse.data as any).pairs || [];
      if (pairs.length === 0) {
        console.warn(`⚠️ No DexScreener pairs found for: ${tokenId}`);
        return null;
      }

      // Get the most liquid pair (highest USD liquidity)
      const primaryPair = pairs.reduce((prev: any, current: any) => 
        (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev
      );

      const totalLiquidity = pairs.reduce((sum: number, pair: any) => sum + (pair.liquidity?.usd || 0), 0);
      const totalVolume24h = pairs.reduce((sum: number, pair: any) => sum + (pair.volume?.h24 || 0), 0);

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
        marketCap: coingeckoData.marketCap || 0,
        volume24h: Math.max(coingeckoData.volume24h, dexScreenerData.volume24h),
        pairsCount: dexScreenerData.pairsCount || 0,
        totalLiquidity: dexScreenerData.totalLiquidity || 0,
        source: 'combined',
        lastUpdated: new Date(),
        reliability: 95 // High reliability when both sources agree
      };

      console.log(`✅ Combined price data for ${tokenId}: $${combinedData.price}`);
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
      // Only DexScreener data available
      const priceData: PriceData = {
        price: dexScreenerData.price,
        priceChange24h: dexScreenerData.priceChange24h,
        marketCap: 0, // Not available from DexScreener
        volume24h: dexScreenerData.volume24h,
        pairsCount: dexScreenerData.pairsCount,
        totalLiquidity: dexScreenerData.totalLiquidity,
        source: 'dexscreener',
        lastUpdated: new Date(),
        reliability: 75
      };

      console.log(`✅ DexScreener price data for ${tokenId}: $${priceData.price}`);
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
      return {
        price: parseFloat(row.current_price) || 0,
        priceChange24h: parseFloat(row.price_change_24h) || 0,
        marketCap: parseFloat(row.market_cap) || 0,
        volume24h: parseFloat(row.volume_24h) || 0,
        pairsCount: row.pairs_count || 0,
        totalLiquidity: parseFloat(row.total_liquidity) || 0,
        source: row.price_source || 'none',
        lastUpdated: row.last_price_update || new Date(),
        reliability: row.price_reliability || 0
      };

    } catch (error) {
      console.error(`❌ Database read error for ${tokenId}:`, error);
      return null;
    }
  }

  // 🔄 REFRESH TOKEN PRICE (MAIN METHOD)
  async refreshTokenPrice(tokenId: string): Promise<PriceData> {
    console.log(`🔄 Refreshing price data for: ${tokenId}`);
    
    // Get fresh data from APIs
    const freshData = await this.getCombinedPrice(tokenId);
    
    // Update database
    await this.updateTokenPrice(tokenId, freshData);
    
    return freshData;
  }


}

export default PriceDataService;
