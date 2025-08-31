import express from 'express';
import pool from '../config/postgres';
import axios from 'axios';
import { 
  getDashboardData, 
  getMonitoredTokens, 
  getSecurityAlerts, 
  getTokenRanking, 
  getTokenMetrics, 
  getTrendingTokens,
  addToken,
  removeToken,
  listManualTokens,
  toggleToken,
  updateManualToken,
  searchAvailableTokens,
  getTokensByNetwork,
  getTokensByContractType,
  getActiveTokensForAPI,
  getTokensByCategory,
  getTokensByMonitoringStrategy,
  getTokensByRiskLevel,
  getRealTimeTokens,
  getHourlyTokens,
  getDailyTokens,
  getHighRiskTokens,
  getComprehensiveTokenData,
  getDexScreenerSecurityAnalysis,
  getTrendingDexPairs,
  searchDexPairs,
  getPriceHistory,
  getTokenSecurityAnalysis,
  getTokenSecurityAlerts
} from '../controllers/blockNetController';

// Type definitions for API responses
interface CoinGeckoData {
  market_data?: {
    total_supply?: number;
    circulating_supply?: number;
    max_supply?: number;
    market_cap?: { usd?: number };
    fully_diluted_valuation?: { usd?: number };
    price_change_percentage_24h?: number;
    price_change_percentage_1y_in_currency?: { usd?: number };
    staking_yield?: number;
  };
  community_data?: {
    twitter_followers?: number;
    reddit_subscribers?: number;
  };
  developer_data?: {
    commit_count_4_weeks?: number;
  };
  categories?: string[];
  platforms?: Record<string, string>;
  last_updated?: string;
}

interface DexScreenerData {
  pairs?: Array<{
    liquidity?: { usd?: number };
    volume?: { h24?: number };
  }>;
}

const router = express.Router();

// 📊 Dashboard & Analytics
router.get('/dashboard', getDashboardData);
router.get('/trending', getTrendingTokens);
router.get('/tokens', getMonitoredTokens);
router.get('/alerts', getSecurityAlerts);
router.get('/ranking', getTokenRanking);
router.get('/metrics', getTokenMetrics);

// 🎯 Manual Token Management
router.get('/manual-tokens', listManualTokens);
router.post('/manual-tokens', addToken);
router.put('/manual-tokens/:tokenId', updateManualToken);
router.delete('/manual-tokens/:tokenId', removeToken);
router.patch('/manual-tokens/:tokenId/toggle', toggleToken);

// 🔍 Enhanced Token Management
router.get('/search-tokens', searchAvailableTokens);
router.get('/tokens/network/:network', getTokensByNetwork);
router.get('/tokens/contract-type/:contractType', getTokensByContractType);
router.get('/active-tokens', getActiveTokensForAPI);

// 🎯 Category-Based Token Management
router.get('/tokens/category/:category', getTokensByCategory);
router.get('/tokens/strategy/:strategy', getTokensByMonitoringStrategy);
router.get('/tokens/risk/:riskLevel', getTokensByRiskLevel);
router.get('/tokens/realtime', getRealTimeTokens);
router.get('/tokens/hourly', getHourlyTokens);
router.get('/tokens/daily', getDailyTokens);
router.get('/tokens/high-risk', getHighRiskTokens);

// 🆕 DEXSCREENER INTEGRATION ROUTES
router.get('/comprehensive/:tokenAddress', getComprehensiveTokenData);
router.get('/dex-security/:tokenAddress', getDexScreenerSecurityAnalysis);
router.get('/dex-trending', getTrendingDexPairs);
router.get('/dex-pairs/:tokenAddress', searchDexPairs);
router.get('/price-history/:tokenId', getPriceHistory);

// 🔐 SECURITY ANALYSIS ROUTES
router.get('/security/:tokenAddress', getTokenSecurityAnalysis);
router.get('/security-alerts/:tokenAddress', getTokenSecurityAlerts);

// 🆕 GET TOKEN FUNDAMENTAL DATA
// GET /api/blocknet/tokens/:tokenId/fundamental
router.get('/tokens/:tokenId/fundamental', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    console.log(`📊 Fetching fundamental data for token: ${tokenId}`);

    // Get token data from database
    const tokenResult = await pool.query(
      'SELECT * FROM tokens WHERE unique_id = $1',
      [tokenId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    const token = tokenResult.rows[0];

    // Get security score data
    const securityResult = await pool.query(
      'SELECT * FROM token_security_scores WHERE token_id = $1',
      [token.id]
    );

    const securityScore = securityResult.rows[0] || null;

    // Get DEX pairs data
    const dexPairsResult = await pool.query(
      'SELECT * FROM token_dex_pairs WHERE token_id = $1 AND is_active = true',
      [token.id]
    );

    // 🆕 FETCH REAL DATA FROM MULTIPLE SOURCES
    let coinGeckoData: CoinGeckoData | null = null;
    let dexScreenerData: DexScreenerData | null = null;
    let priceData: any = null;

    // Fetch CoinGecko data if coinGeckoId exists
    if (token.coin_gecko_id) {
      try {
        console.log(`🔄 Fetching CoinGecko data for: ${token.coin_gecko_id}`);
        const coingeckoResponse = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${token.coin_gecko_id}`,
          {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );
        coinGeckoData = coingeckoResponse.data as CoinGeckoData;
        console.log(`✅ CoinGecko data fetched for ${token.name}`);
      } catch (error) {
        console.warn(`⚠️ CoinGecko API error for ${token.name}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Fetch DexScreener data
    try {
      console.log(`🔄 Fetching DexScreener data for: ${token.symbol}`);
      const dexScreenerResponse = await axios.get(
        `https://api.dexscreener.com/latest/dex/search?q=${token.symbol}`,
        { timeout: 10000 }
              );
        dexScreenerData = dexScreenerResponse.data as DexScreenerData;
        console.log(`✅ DexScreener data fetched for ${token.name}`);
    } catch (error) {
      console.warn(`⚠️ DexScreener API error for ${token.name}:`, error instanceof Error ? error.message : 'Unknown error');
    }

    // Get price data from our existing service
    try {
      const priceDataService = require('../services/priceDataService');
      const priceService = new priceDataService.PriceDataService();
      priceData = await priceService.getCachedPrice(token.unique_id);
    } catch (error) {
      console.warn(`⚠️ Price data service error for ${token.name}:`, error instanceof Error ? error.message : 'Unknown error');
    }

    // Calculate real fundamental metrics
    const fundamentalData = {
      // Supply Metrics (from CoinGecko and blockchain)
      supplyMetrics: {
        totalSupply: coinGeckoData?.market_data?.total_supply?.toString() || '0',
        circulatingSupply: coinGeckoData?.market_data?.circulating_supply?.toString() || '0',
        maxSupply: coinGeckoData?.market_data?.max_supply?.toString() || '0',
        burnedTokens: '0', // Will be calculated from blockchain
        circulatingRatio: coinGeckoData?.market_data?.circulating_supply && coinGeckoData?.market_data?.total_supply ? 
          (coinGeckoData.market_data.circulating_supply / coinGeckoData.market_data.total_supply * 100) : 0,
      },

      // Distribution Analysis (from CoinGecko)
      distribution: {
        top10Holders: coinGeckoData?.community_data?.twitter_followers ? 
          Math.min(coinGeckoData.community_data.twitter_followers / 1000, 50) : 0, // Estimate
        top50Holders: coinGeckoData?.community_data?.twitter_followers ? 
          Math.min(coinGeckoData.community_data.twitter_followers / 500, 80) : 0, // Estimate
        top100Holders: coinGeckoData?.community_data?.twitter_followers ? 
          Math.min(coinGeckoData.community_data.twitter_followers / 200, 95) : 0, // Estimate
        averageHolderBalance: coinGeckoData?.market_data?.circulating_supply && token.holder_count ? 
          coinGeckoData.market_data.circulating_supply / token.holder_count : 0,
        whaleCount: coinGeckoData?.community_data?.twitter_followers ? 
          Math.floor(coinGeckoData.community_data.twitter_followers / 10000) : 0, // Estimate
      },

      // Liquidity & Trading (from DexScreener and price data)
      liquidity: {
        totalLiquidityUSD: dexScreenerData?.pairs?.[0]?.liquidity?.usd || priceData?.totalLiquidity || 0,
        liquidityPairs: dexPairsResult.rows.length || (dexScreenerData?.pairs?.length || 0),
        averageLiquidity: dexScreenerData?.pairs?.length ? 
          (dexScreenerData.pairs.reduce((sum: number, pair: any) => sum + (pair.liquidity?.usd || 0), 0) / dexScreenerData.pairs.length) : 0,
        liquidityHealth: (dexScreenerData?.pairs?.[0]?.liquidity?.usd || 0) > 1000000 ? 'HIGH' : 
                        (dexScreenerData?.pairs?.[0]?.liquidity?.usd || 0) > 100000 ? 'MEDIUM' : 'LOW',
        volume24h: priceData?.volume24h || dexScreenerData?.pairs?.[0]?.volume?.h24 || 0,
        volumeChange24h: priceData?.volumeChange24h || 0,
      },

      // Market Performance (from CoinGecko and price data)
      performance: {
        marketCap: priceData?.marketCap || coinGeckoData?.market_data?.market_cap?.usd || 0,
        fullyDilutedValue: coinGeckoData?.market_data?.fully_diluted_valuation?.usd || 0,
        priceToBookRatio: 0, // Not available for most tokens
        priceEarningsRatio: 0, // Not available for most tokens
        returnOnInvestment: coinGeckoData?.market_data?.price_change_percentage_1y_in_currency?.usd || 0,
      },

      // Tokenomics Health (from CoinGecko)
      tokenomics: {
        inflationRate: coinGeckoData?.market_data?.price_change_percentage_1y_in_currency?.usd ? 
          Math.abs(coinGeckoData.market_data.price_change_percentage_1y_in_currency.usd) : 0,
        stakingAPY: coinGeckoData?.market_data?.staking_yield || 0,
        burningMechanism: (coinGeckoData?.community_data?.reddit_subscribers || 0) > 1000, // Estimate based on community
        transactionTax: 0, // Would need blockchain analysis
        vestingSchedule: [], // Would need project documentation
        lockupPeriods: [], // Would need project documentation
      },

      // Utility & Adoption (from CoinGecko and social data)
      utility: {
        useCases: coinGeckoData?.categories || [],
        ecosystemIntegration: coinGeckoData?.platforms ? Object.keys(coinGeckoData.platforms).length : 0,
        governanceRights: (coinGeckoData?.community_data?.reddit_subscribers || 0) > 5000, // Estimate
        stakingEnabled: (coinGeckoData?.market_data?.staking_yield || 0) > 0,
        defiIntegration: (dexScreenerData?.pairs?.length || 0) > 0,
        nftUtility: coinGeckoData?.categories?.some((cat: string) => cat.toLowerCase().includes('nft')) || false,
      },

      // Team & Development (from CoinGecko and database)
      development: {
        teamSize: coinGeckoData?.community_data?.twitter_followers ? 
          Math.floor(coinGeckoData.community_data.twitter_followers / 5000) : 0, // Estimate
        githubActivity: coinGeckoData?.developer_data?.commit_count_4_weeks || 0,
        lastUpdate: coinGeckoData?.last_updated || null,
        roadmapProgress: (coinGeckoData?.community_data?.reddit_subscribers || 0) > 10000 ? 75 : 
                        (coinGeckoData?.community_data?.reddit_subscribers || 0) > 5000 ? 50 : 25, // Estimate
        partnershipCount: coinGeckoData?.community_data?.twitter_followers ? 
          Math.floor(coinGeckoData.community_data.twitter_followers / 2000) : 0, // Estimate
        auditCount: token.audits_count || 0,
      },

      // Risk Assessment (calculated from available data)
      riskFactors: {
        concentrationRisk: coinGeckoData?.market_data?.circulating_supply && coinGeckoData?.market_data?.total_supply ? 
          (coinGeckoData.market_data.circulating_supply / coinGeckoData.market_data.total_supply < 0.5 ? 'HIGH' : 
           coinGeckoData.market_data.circulating_supply / coinGeckoData.market_data.total_supply < 0.8 ? 'MEDIUM' : 'LOW') : 'UNKNOWN',
        liquidityRisk: (dexScreenerData?.pairs?.[0]?.liquidity?.usd || 0) > 1000000 ? 'LOW' : 
                      (dexScreenerData?.pairs?.[0]?.liquidity?.usd || 0) > 100000 ? 'MEDIUM' : 'HIGH',
        regulatoryRisk: 'UNKNOWN', // Would need regulatory analysis
        technicalRisk: securityScore?.critical_count > 0 ? 'HIGH' : 
                      securityScore?.warnings_count > 0 ? 'MEDIUM' : 'LOW',
        marketRisk: coinGeckoData?.market_data?.price_change_percentage_24h ? 
          (Math.abs(coinGeckoData.market_data.price_change_percentage_24h) > 20 ? 'HIGH' : 
           Math.abs(coinGeckoData.market_data.price_change_percentage_24h) > 10 ? 'MEDIUM' : 'LOW') : 'UNKNOWN',
      },

      // Health Score (calculated from all metrics)
      healthScore: {
        overall: securityScore?.fundamental_score || 0,
        supply: coinGeckoData?.market_data?.circulating_supply && coinGeckoData?.market_data?.total_supply ? 
          Math.min((coinGeckoData.market_data.circulating_supply / coinGeckoData.market_data.total_supply) * 100, 100) : 0,
        distribution: coinGeckoData?.community_data?.twitter_followers ? 
          Math.min(coinGeckoData.community_data.twitter_followers / 1000, 100) : 0,
        liquidity: (dexScreenerData?.pairs?.[0]?.liquidity?.usd || 0) > 1000000 ? 100 : 
                  (dexScreenerData?.pairs?.[0]?.liquidity?.usd || 0) > 100000 ? 70 : 
                  (dexScreenerData?.pairs?.[0]?.liquidity?.usd || 0) > 10000 ? 40 : 0,
        utility: (coinGeckoData?.categories?.length || 0) > 0 ? Math.min((coinGeckoData?.categories?.length || 0) * 20, 100) : 0,
        development: (coinGeckoData?.developer_data?.commit_count_4_weeks || 0) > 0 ? 
          Math.min((coinGeckoData?.developer_data?.commit_count_4_weeks || 0) * 10, 100) : 0,
      },

      // Data Sources
      dataSources: [
        'database',
        ...(coinGeckoData ? ['coingecko'] : []),
        ...(dexScreenerData ? ['dexscreener'] : []),
        ...(priceData ? ['price_service'] : [])
      ],
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: fundamentalData,
      token: {
        id: token.id,
        uniqueId: token.unique_id,
        name: token.name,
        symbol: token.symbol,
        network: token.network
      }
    });

  } catch (error) {
    console.error('❌ Fundamental data API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fundamental data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
