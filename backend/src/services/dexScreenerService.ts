import axios from 'axios';

// 🆕 DEXSCREENER SERVICE
// Handles real-time DEX data from DexScreener API

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    h1: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  pairCreatedAt: number;
}

export interface DexScreenerToken {
  chainId: string;
  address: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  fdv: number;
  pairs: DexScreenerPair[];
  lastUpdated: Date;
}

export class DexScreenerService {
  private baseUrl = 'https://api.dexscreener.com/latest';

  constructor() {
    // DexScreener API is free and doesn't require API key
    // Rate limits: 60 requests/minute for token profiles, 300 requests/minute for pairs
  }

  // 🔍 Search for token pairs by token address
  async searchTokenPairs(tokenAddress: string, network?: string): Promise<DexScreenerPair[]> {
    try {
      const url = network 
        ? `${this.baseUrl}/dex/search?q=${tokenAddress}&chain=${network}`
        : `${this.baseUrl}/dex/search?q=${tokenAddress}`;

      const response = await axios.get(url, {
        timeout: 10000
      });

      if (response.data && (response.data as any).pairs) {
        return (response.data as any).pairs as DexScreenerPair[];
      }

      return [];
    } catch (error) {
      console.error(`❌ DexScreener search error for ${tokenAddress}:`, error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  // 📊 Get token data by address
  async getTokenData(tokenAddress: string, network?: string): Promise<DexScreenerToken | null> {
    try {
      const pairs = await this.searchTokenPairs(tokenAddress, network);
      
      if (pairs.length === 0) {
        return null;
      }

      // Get the most liquid pair (highest USD liquidity)
      const primaryPair = pairs.reduce((prev, current) => 
        (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev
      );

      const token: DexScreenerToken = {
        chainId: primaryPair.chainId,
        address: tokenAddress,
        name: primaryPair.baseToken.name,
        symbol: primaryPair.baseToken.symbol,
        price: parseFloat(primaryPair.priceUsd) || 0,
        priceChange24h: primaryPair.priceChange?.h24 || 0,
        volume24h: primaryPair.volume?.h24 || 0,
        liquidity: primaryPair.liquidity?.usd || 0,
        fdv: primaryPair.fdv || 0,
        pairs: pairs,
        lastUpdated: new Date()
      };

      return token;
    } catch (error) {
      console.error(`❌ DexScreener token data error for ${tokenAddress}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  // 🔍 Get trending pairs
  async getTrendingPairs(limit: number = 20): Promise<DexScreenerPair[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/dex/trending`, {
        timeout: 10000
      });

      if (response.data && (response.data as any).pairs) {
        return ((response.data as any).pairs as DexScreenerPair[]).slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error('❌ DexScreener trending pairs error:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  // 📈 Get pair data by pair address
  async getPairData(pairAddress: string): Promise<DexScreenerPair | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/dex/pairs/${pairAddress}`, {
        timeout: 10000
      });

      if (response.data && (response.data as any).pair) {
        return (response.data as any).pair as DexScreenerPair;
      }

      return null;
    } catch (error) {
      console.error(`❌ DexScreener pair data error for ${pairAddress}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  // 🌐 Get pairs by network
  async getPairsByNetwork(network: string, limit: number = 50): Promise<DexScreenerPair[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/dex/pairs/${network}`, {
        timeout: 10000
      });

      if (response.data && (response.data as any).pairs) {
        return ((response.data as any).pairs as DexScreenerPair[]).slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error(`❌ DexScreener network pairs error for ${network}:`, error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  // 🏪 Get pairs by DEX
  async getPairsByDex(dexId: string, limit: number = 50): Promise<DexScreenerPair[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/dex/pairs/${dexId}`, {
        timeout: 10000
      });

      if (response.data && (response.data as any).pairs) {
        return ((response.data as any).pairs as DexScreenerPair[]).slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error(`❌ DexScreener DEX pairs error for ${dexId}:`, error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  // 🚨 Analyze liquidity and volume for security
  analyzeLiquiditySecurity(pairs: DexScreenerPair[]): {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    issues: string[];
    recommendations: string[];
  } {
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (pairs.length === 0) {
      riskLevel = 'CRITICAL';
      issues.push('No trading pairs found');
      recommendations.push('Token may not be tradeable');
      return { riskLevel, issues, recommendations };
    }

    // Check total liquidity
    const totalLiquidity = pairs.reduce((sum, pair) => sum + (pair.liquidity?.usd || 0), 0);
    
    if (totalLiquidity < 10000) {
      riskLevel = 'CRITICAL';
      issues.push('Very low liquidity (< $10K)');
      recommendations.push('Extreme caution - high risk of manipulation');
    } else if (totalLiquidity < 100000) {
      riskLevel = 'HIGH';
      issues.push('Low liquidity (< $100K)');
      recommendations.push('High risk - significant price impact on trades');
    } else if (totalLiquidity < 1000000) {
      riskLevel = 'MEDIUM';
      issues.push('Moderate liquidity (< $1M)');
      recommendations.push('Moderate risk - monitor for unusual activity');
    }

    // Check volume to liquidity ratio
    const totalVolume24h = pairs.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0);
    const volumeToLiquidityRatio = totalVolume24h / totalLiquidity;

    if (volumeToLiquidityRatio > 10) {
      issues.push('High volume to liquidity ratio');
      recommendations.push('Potential wash trading or manipulation');
    }

    // Check for multiple DEXes (good for security)
    const uniqueDexes = new Set(pairs.map(pair => pair.dexId));
    if (uniqueDexes.size < 2) {
      issues.push('Limited to single DEX');
      recommendations.push('Consider tokens with multi-DEX presence');
    }

    return { riskLevel, issues, recommendations };
  }

  // 📊 Get comprehensive token analysis
  async getTokenAnalysis(tokenAddress: string, network?: string): Promise<{
    token: DexScreenerToken | null;
    security: any;
    pairs: DexScreenerPair[];
    summary: {
      totalLiquidity: number;
      totalVolume24h: number;
      averagePriceChange24h: number;
      numberOfPairs: number;
      numberOfDexes: number;
    };
  }> {
    try {
      const pairs = await this.searchTokenPairs(tokenAddress, network);
      const token = await this.getTokenData(tokenAddress, network);
      const security = this.analyzeLiquiditySecurity(pairs);

      const summary = {
        totalLiquidity: pairs.reduce((sum, pair) => sum + (pair.liquidity?.usd || 0), 0),
        totalVolume24h: pairs.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0),
        averagePriceChange24h: pairs.reduce((sum, pair) => sum + (pair.priceChange?.h24 || 0), 0) / pairs.length,
        numberOfPairs: pairs.length,
        numberOfDexes: new Set(pairs.map(pair => pair.dexId)).size
      };

      return {
        token,
        security,
        pairs,
        summary
      };
    } catch (error) {
      console.error(`❌ DexScreener analysis error for ${tokenAddress}:`, error instanceof Error ? error.message : 'Unknown error');
      return {
        token: null,
        security: { riskLevel: 'CRITICAL', issues: ['Analysis failed'], recommendations: ['Unable to analyze'] },
        pairs: [],
        summary: {
          totalLiquidity: 0,
          totalVolume24h: 0,
          averagePriceChange24h: 0,
          numberOfPairs: 0,
          numberOfDexes: 0
        }
      };
    }
  }
}

export default DexScreenerService;
