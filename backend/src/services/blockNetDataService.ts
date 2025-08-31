import axios from 'axios';
import { ethers } from 'ethers';
import { 
  getTokenConfig, 
  generateTokenAddress, 
  addManualToken, 
  removeManualToken, 
  getManualTokens, 
  toggleTokenStatus,
  getActiveTokensForAPI,
  getTokensByPriority,
  searchTokens,
  getTokensByNetwork,
  getTokensByContractType
} from '../config/tokenConfig';
import DexScreenerService, { DexScreenerToken, DexScreenerPair } from './dexScreenerService';

// Interfaces for API responses
interface EtherscanTokenInfo {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  tokenSupply: string;
}

interface EtherscanTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  timeStamp: string;
  blockNumber: string;
  isError: string;
  txreceipt_status: string;
}

interface CoinGeckoTrending {
  coins: Array<{
    item: {
      id: string;
      name: string;
      symbol: string;
      market_cap_rank: number;
      price_btc: number;
      score: number;
      market_cap: number;
      volume_24h: number;
    };
  }>;
}

interface TokenMetrics {
  address: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  holderCount: number;
  securityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lastUpdated: Date;
  network?: string;
  contractType?: string;
  description?: string;
}

interface SecurityAlert {
  id: string;
  tokenAddress: string;
  alertType: 'LARGE_TRANSFER' | 'SUSPICIOUS_ACTIVITY' | 'LIQUIDITY_REMOVAL' | 'PRICE_MANIPULATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  metadata: any;
  timestamp: Date;
  isRead: boolean;
}

export class BlockNetDataService {
  private etherscanApiKey: string;
  private coingeckoApiKey: string;
  private provider: ethers.JsonRpcProvider;
  private dexScreenerService: DexScreenerService;

  constructor() {
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY || '';
    
    // Initialize Ethereum provider
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Initialize DexScreener service
    this.dexScreenerService = new DexScreenerService();
  }

    // 🔍 Get Monitored Tokens (Manual Tokens Only)
  async getMonitoredTokens(): Promise<TokenMetrics[]> {
    try {
      // Get only manually added tokens
      const activeManualTokens = await getManualTokens();
      console.log(`🎯 Fetching data for ${activeManualTokens.length} manual tokens`);

      if (activeManualTokens.length === 0) {
        console.log('⚠️ No manual tokens configured. Add tokens using the admin panel.');
        return [];
      }

      const monitoredTokens: TokenMetrics[] = [];

      // Fetch real data for each manual token
      for (let i = 0; i < activeManualTokens.length; i++) {
        const manualToken = activeManualTokens[i];
        
        try {
          // Add delay between requests to respect rate limits
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
          }

          // Get ALL data in a single API call to avoid rate limits
          const priceResponse = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${manualToken.coinGeckoId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
            {
              headers: this.coingeckoApiKey ? { 'X-CG-API-KEY': this.coingeckoApiKey } : {},
              timeout: 30000
            }
          );

          const priceData = (priceResponse.data as any)[manualToken.coinGeckoId];
          
          if (priceData && priceData.usd) {
            // Create token with real data from single API call
            const token: TokenMetrics = {
              address: manualToken.address || generateTokenAddress(manualToken.coinGeckoId),
              symbol: manualToken.symbol,
              name: manualToken.name,
              price: priceData.usd,
              marketCap: priceData.usd_market_cap || 0,
              volume24h: priceData.usd_24h_vol || 0,
              priceChange24h: priceData.usd_24h_change || 0,
              holderCount: 0, // Will be fetched from blockchain data when available
              securityScore: this.calculateSecurityScore({
                price: priceData.usd,
                marketCap: priceData.usd_market_cap,
                volume24h: priceData.usd_24h_vol
              }),
              riskLevel: this.calculateRiskLevel({
                price: priceData.usd,
                marketCap: priceData.usd_market_cap,
                volume24h: priceData.usd_24h_vol
              }),
              lastUpdated: new Date(),
              network: manualToken.network,
              contractType: manualToken.contractType,
              description: manualToken.description
            };

                         monitoredTokens.push(token);
             
             // Format market cap with appropriate unit
             let marketCapFormatted: string;
             if (token.marketCap >= 1000000000000) {
               marketCapFormatted = `$${(token.marketCap / 1000000000000).toFixed(2)}T`;
             } else if (token.marketCap >= 1000000000) {
               marketCapFormatted = `$${(token.marketCap / 1000000000).toFixed(2)}B`;
             } else if (token.marketCap >= 1000000) {
               marketCapFormatted = `$${(token.marketCap / 1000000).toFixed(2)}M`;
             } else {
               marketCapFormatted = `$${token.marketCap.toLocaleString()}`;
             }
             
             console.log(`✅ Fetched REAL data for ${token.symbol}: $${token.price} (Market Cap: ${marketCapFormatted})`);
          }
        } catch (error) {
          console.error(`❌ API error for ${manualToken.coinGeckoId}:`, error instanceof Error ? error.message : 'Unknown error');
          // Continue with next token instead of failing completely
        }
      }

      console.log(`🎯 Successfully fetched ${monitoredTokens.length} REAL tokens from manual list`);
      
      return monitoredTokens;
    } catch (error) {
      console.error('Error fetching monitored tokens:', error);
      throw error; // Don't fallback to mock - let the error propagate
    }
  }

  // 🔍 Token Discovery & Trending (Legacy - for backward compatibility)
  async getTrendingTokens(limit: number = 20): Promise<TokenMetrics[]> {
    // Use monitored tokens instead of trending - REAL DATA ONLY
    return this.getMonitoredTokens();
  }

  // 📊 Token Details & Analysis
  async getTokenDetails(tokenId: string): Promise<any> {
    try {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Map common token names to CoinGecko IDs
      const coinGeckoIdMapping: { [key: string]: string } = {
        'btc': 'bitcoin',
        'bitcoin': 'bitcoin',
        'eth': 'ethereum',
        'ethereum': 'ethereum',
        'link': 'chainlink',
        'chainlink': 'chainlink',
        'xrp': 'ripple',
        'ripple': 'ripple',
        'ada': 'cardano',
        'cardano': 'cardano',
        'dot': 'polkadot',
        'polkadot': 'polkadot',
        'sol': 'solana',
        'solana': 'solana',
        'avax': 'avalanche-2',
        'avalanche': 'avalanche-2',
        'matic': 'matic-network',
        'polygon': 'matic-network',
      };
      
      // Use the mapped CoinGecko ID or the original tokenId
      const coinGeckoId = coinGeckoIdMapping[tokenId.toLowerCase()] || tokenId;
      
      console.log(`📊 Fetching token details for ${tokenId} using CoinGecko ID: ${coinGeckoId}`);
      
      // Get detailed token information from CoinGecko - only price data to avoid rate limiting
      const priceResponse = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`, {
        headers: this.coingeckoApiKey ? { 'X-CG-API-KEY': this.coingeckoApiKey } : {},
        timeout: 15000
      });

      const priceData = (priceResponse.data as any)[coinGeckoId];

      return {
        address: '', // Skip detailed market data to avoid rate limiting
        price: priceData?.usd || 0,
        priceChange24h: priceData?.usd_24h_change || 0,
        marketCap: priceData?.usd_market_cap || 0,
        volume24h: priceData?.usd_24h_vol || 0,
        holderCount: 0,
        // Add more detailed analysis here
      };
    } catch (error) {
      console.error(`❌ CoinGecko API error for ${tokenId}:`, error instanceof Error ? error.message : 'Unknown error');
      
      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        console.log(`⚠️ Rate limit hit for ${tokenId}, using fallback data`);
      }
      
      // Return fallback data instead of null
      return {
        address: '',
        price: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        holderCount: 0
      };
    }
  }

  // 🔍 Contract Analysis via Etherscan
  async analyzeContract(contractAddress: string): Promise<any> {
    try {
      // Get contract source code and ABI
      const contractResponse = await axios.get(
        `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${this.etherscanApiKey}`
      );

      const responseData = contractResponse.data as any;
      if (responseData.status === '1' && responseData.result[0]) {
        const contract = responseData.result[0];
        
        // Get recent transactions
        const txResponse = await axios.get(
          `https://api.etherscan.io/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${this.etherscanApiKey}`
        );

        const transactions = (txResponse.data as any).result || [];
        
        return {
          contractAddress,
          sourceCode: contract.SourceCode,
          abi: contract.ABI,
          contractName: contract.ContractName,
          compilerVersion: contract.CompilerVersion,
          optimizationUsed: contract.OptimizationUsed,
          runs: contract.Runs,
          constructorArguments: contract.ConstructorArguments,
          evmVersion: contract.EVMVersion,
          library: contract.Library,
          licenseType: contract.LicenseType,
          proxy: contract.Proxy,
          implementation: contract.Implementation,
          swarmSource: contract.SwarmSource,
          transactionCount: transactions.length,
          lastTransaction: transactions[0] || null,
          securityAnalysis: this.analyzeContractSecurity(contract, transactions)
        };
      }

      return null;
    } catch (error) {
      console.error('Error analyzing contract:', error);
      return null;
    }
  }

  // 🚨 Security Analysis
  private analyzeContractSecurity(contract: any, transactions: EtherscanTransaction[]): any {
    const analysis = {
      riskScore: 0,
      vulnerabilities: [] as string[],
      suspiciousPatterns: [] as string[],
      recommendations: [] as string[]
    };

    // Check for common security issues
    if (contract.SourceCode) {
      const sourceCode = contract.SourceCode.toLowerCase();
      
      // Check for dangerous functions
      if (sourceCode.includes('selfdestruct') || sourceCode.includes('suicide')) {
        analysis.vulnerabilities.push('Self-destruct function detected');
        analysis.riskScore += 30;
      }

      if (sourceCode.includes('delegatecall')) {
        analysis.vulnerabilities.push('Delegatecall detected - potential proxy risk');
        analysis.riskScore += 20;
      }

      if (sourceCode.includes('assembly')) {
        analysis.vulnerabilities.push('Assembly code detected - requires careful review');
        analysis.riskScore += 15;
      }
    }

    // Analyze transaction patterns
    if (transactions.length > 0) {
      const largeTransfers = transactions.filter(tx => 
        parseFloat(tx.value) > 1000000000000000000 // > 1 ETH
      );

      if (largeTransfers.length > 0) {
        analysis.suspiciousPatterns.push(`${largeTransfers.length} large transfers detected`);
        analysis.riskScore += 10;
      }

      // Check for suspicious activity patterns
      const uniqueFromAddresses = new Set(transactions.map(tx => tx.from));
      const uniqueToAddresses = new Set(transactions.map(tx => tx.to));

      if (uniqueFromAddresses.size < transactions.length * 0.1) {
        analysis.suspiciousPatterns.push('Concentrated transaction sources');
        analysis.riskScore += 15;
      }
    }

    // Generate recommendations
    if (analysis.riskScore > 50) {
      analysis.recommendations.push('High risk token - exercise extreme caution');
    } else if (analysis.riskScore > 30) {
      analysis.recommendations.push('Medium risk token - conduct thorough due diligence');
    } else {
      analysis.recommendations.push('Low risk token - standard precautions recommended');
    }

    return analysis;
  }

  // 📈 Real-time Transaction Monitoring
  async monitorTransactions(contractAddress: string, limit: number = 50): Promise<EtherscanTransaction[]> {
    try {
      const response = await axios.get(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${this.etherscanApiKey}`
      );

      const responseData = response.data as any;
      if (responseData.status === '1') {
        return responseData.result.slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error('Error monitoring transactions:', error);
      return [];
    }
  }

  // 🎯 Security Scoring Algorithm
  private calculateSecurityScore(tokenDetails: any): number {
    let score = 100; // Start with perfect score

    // Deduct points based on various factors
    if (!tokenDetails?.address) score -= 20;
    if (tokenDetails?.marketCap < 1000000) score -= 15; // Low market cap
    if (tokenDetails?.volume24h < 100000) score -= 10; // Low volume
    if (tokenDetails?.holderCount < 100) score -= 20; // Few holders

    // Ensure score doesn't go below 0
    return Math.max(0, score);
  }

  // ⚠️ Risk Level Calculation
  private calculateRiskLevel(tokenDetails: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const score = this.calculateSecurityScore(tokenDetails);

    if (score >= 80) return 'LOW';
    if (score >= 60) return 'MEDIUM';
    if (score >= 40) return 'HIGH';
    return 'CRITICAL';
  }

  // 🚫 NO MORE MOCK DATA - REAL DATA ONLY
  // This method has been removed to ensure we only use real data

  // 🚨 Generate Security Alerts
  async generateSecurityAlerts(contractAddress: string): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    try {
      const transactions = await this.monitorTransactions(contractAddress, 100);
      
      // Check for large transfers
      const largeTransfers = transactions.filter(tx => 
        parseFloat(tx.value) > 10000000000000000000 // > 10 ETH
      );

      if (largeTransfers.length > 0) {
        alerts.push({
          id: `large-transfer-${Date.now()}`,
          tokenAddress: contractAddress,
          alertType: 'LARGE_TRANSFER',
          severity: 'HIGH',
          title: 'Large Transfer Detected',
          description: `${largeTransfers.length} large transfers detected in the last 100 transactions`,
          metadata: { transfers: largeTransfers },
          timestamp: new Date(),
          isRead: false
        });
      }

      // Check for suspicious patterns
      const uniqueFromAddresses = new Set(transactions.map(tx => tx.from));
      const uniqueToAddresses = new Set(transactions.map(tx => tx.to));

      if (uniqueFromAddresses.size < transactions.length * 0.05) {
        alerts.push({
          id: `suspicious-activity-${Date.now()}`,
          tokenAddress: contractAddress,
          alertType: 'SUSPICIOUS_ACTIVITY',
          severity: 'CRITICAL',
          title: 'Suspicious Activity Detected',
          description: 'Highly concentrated transaction sources detected',
          metadata: { uniqueFromAddresses: uniqueFromAddresses.size, totalTransactions: transactions.length },
          timestamp: new Date(),
          isRead: false
        });
      }

    } catch (error) {
      console.error('Error generating security alerts:', error);
    }

    return alerts;
  }

  // 📊 Get Token Metrics Summary
  async getTokenMetricsSummary(): Promise<any> {
    try {
      const trendingTokens = await this.getTrendingTokens(50);
      
      const summary = {
        totalTokens: trendingTokens.length,
        averageSecurityScore: trendingTokens.reduce((sum, token) => sum + token.securityScore, 0) / trendingTokens.length,
        riskDistribution: {
          LOW: trendingTokens.filter(t => t.riskLevel === 'LOW').length,
          MEDIUM: trendingTokens.filter(t => t.riskLevel === 'MEDIUM').length,
          HIGH: trendingTokens.filter(t => t.riskLevel === 'HIGH').length,
          CRITICAL: trendingTokens.filter(t => t.riskLevel === 'CRITICAL').length
        },
        totalMarketCap: trendingTokens.reduce((sum, token) => sum + token.marketCap, 0),
        totalVolume24h: trendingTokens.reduce((sum, token) => sum + token.volume24h, 0)
      };

      return summary;
    } catch (error) {
      console.error('Error getting token metrics summary:', error);
      return {
        totalTokens: 0,
        averageSecurityScore: 0,
        riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
        totalMarketCap: 0,
        totalVolume24h: 0
      };
    }
  }

  // 🆕 DEXSCREENER INTEGRATION METHODS

  // 🔍 Get comprehensive token data from both CoinGecko and DexScreener
  async getComprehensiveTokenData(tokenIdentifier: string, network?: string): Promise<{
    coinGecko: any;
    dexScreener: DexScreenerToken | null;
    combined: {
      price: number;
      priceChange24h: number;
      volume24h: number;
      marketCap: number;
      liquidity: number;
      fdv: number;
      securityScore: number;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      dataSources: string[];
    };
  }> {
    try {
      // Check if tokenIdentifier is a contract address (starts with 0x) or a token ID
      const isContractAddress = tokenIdentifier.startsWith('0x');
      
      let coinGeckoData = null;
      let dexScreenerData = null;
      
      if (isContractAddress) {
        // It's a contract address - use DexScreener for DEX data
        console.log(`🔍 Token identifier is a contract address: ${tokenIdentifier}`);
        dexScreenerData = await this.dexScreenerService.getTokenData(tokenIdentifier, network);
        
        // Try to get CoinGecko data using the token symbol from DexScreener
        if (dexScreenerData?.symbol) {
          try {
            coinGeckoData = await this.getTokenDetails(dexScreenerData.symbol.toLowerCase());
          } catch (error) {
            console.log(`⚠️ Could not get CoinGecko data for symbol: ${dexScreenerData.symbol}`);
          }
        }
      } else {
        // It's a token ID (like "ethereum", "bitcoin") - use CoinGecko
        console.log(`🔍 Token identifier is a token ID: ${tokenIdentifier}`);
        coinGeckoData = await this.getTokenDetails(tokenIdentifier);
        
        // Try to get DexScreener data if we have a known contract address mapping
        const contractAddressMapping: { [key: string]: string } = {
          'ethereum': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
          'bitcoin': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
          'chainlink': '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
          'ripple': '0x1d2F0da169ceB9fC7B3144628dB156f3F6c60dBE', // XRP
          'cardano': '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', // ADA
          'polkadot': '0x3506424F91fD33084466F402d5D97f05F8e3b4AF', // DOT
          'solana': '0xD31a59c85aE9D8edEFeC411D448f90841571b89c', // SOL
          'avalanche': '0x85f138bfEE4ef8e540890CFb48F620571d67Eda3', // AVAX
          'polygon': '0x7D1AfA7B718fb893dB30A3aBc0Cfc608aCafEBB0', // MATIC
        };

        // Map common token names to CoinGecko IDs
        const coinGeckoIdMapping: { [key: string]: string } = {
          'btc': 'bitcoin',
          'bitcoin': 'bitcoin',
          'eth': 'ethereum',
          'ethereum': 'ethereum',
          'link': 'chainlink',
          'chainlink': 'chainlink',
          'xrp': 'ripple',
          'ripple': 'ripple',
          'ada': 'cardano',
          'cardano': 'cardano',
          'dot': 'polkadot',
          'polkadot': 'polkadot',
          'sol': 'solana',
          'solana': 'solana',
          'avax': 'avalanche-2',
          'avalanche': 'avalanche-2',
          'matic': 'matic-network',
          'polygon': 'matic-network',
        };
        
        const contractAddress = contractAddressMapping[tokenIdentifier.toLowerCase()];
        if (contractAddress) {
          try {
            dexScreenerData = await this.dexScreenerService.getTokenData(contractAddress, network);
          } catch (error) {
            console.log(`⚠️ Could not get DexScreener data for contract: ${contractAddress}`);
          }
        }
      }
      
      // Combine data sources
      const combined = {
        price: dexScreenerData?.price || coinGeckoData?.price || 0,
        priceChange24h: dexScreenerData?.priceChange24h || coinGeckoData?.priceChange24h || 0,
        volume24h: dexScreenerData?.volume24h || coinGeckoData?.volume24h || 0,
        marketCap: coinGeckoData?.marketCap || 0,
        liquidity: dexScreenerData?.liquidity || 0,
        fdv: dexScreenerData?.fdv || 0,
        securityScore: this.calculateComprehensiveSecurityScore(coinGeckoData, dexScreenerData),
        riskLevel: this.calculateComprehensiveRiskLevel(coinGeckoData, dexScreenerData),
        dataSources: [] as string[]
      };

      // Track data sources
      if (coinGeckoData?.price) combined.dataSources.push('CoinGecko' as string);
      if (dexScreenerData?.price) combined.dataSources.push('DexScreener' as string);

      return {
        coinGecko: coinGeckoData,
        dexScreener: dexScreenerData,
        combined
      };
    } catch (error) {
      console.error(`❌ Comprehensive token data error for ${tokenIdentifier}:`, error instanceof Error ? error.message : 'Unknown error');
      return {
        coinGecko: null,
        dexScreener: null,
        combined: {
          price: 0,
          priceChange24h: 0,
          volume24h: 0,
          marketCap: 0,
          liquidity: 0,
          fdv: 0,
          securityScore: 0,
          riskLevel: 'CRITICAL',
          dataSources: []
        }
      };
    }
  }

  // 🚨 Get DexScreener security analysis
  async getDexScreenerSecurityAnalysis(tokenAddress: string, network?: string): Promise<{
    security: any;
    pairs: DexScreenerPair[];
    summary: any;
  }> {
    try {
      const analysis = await this.dexScreenerService.getTokenAnalysis(tokenAddress, network);
      return {
        security: analysis.security,
        pairs: analysis.pairs,
        summary: analysis.summary
      };
    } catch (error) {
      console.error(`❌ DexScreener security analysis error for ${tokenAddress}:`, error instanceof Error ? error.message : 'Unknown error');
      return {
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

  // 📊 Get trending DEX pairs
  async getTrendingDexPairs(limit: number = 20): Promise<DexScreenerPair[]> {
    try {
      return await this.dexScreenerService.getTrendingPairs(limit);
    } catch (error) {
      console.error('❌ Trending DEX pairs error:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  // 📈 Get price history for charts
  async getPriceHistory(tokenId: string, days: number = 30): Promise<{ timestamp: number; price: number }[]> {
    try {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Map common token names to CoinGecko IDs
      const coinGeckoIdMapping: { [key: string]: string } = {
        'btc': 'bitcoin',
        'bitcoin': 'bitcoin',
        'eth': 'ethereum',
        'ethereum': 'ethereum',
        'link': 'chainlink',
        'chainlink': 'chainlink',
        'xrp': 'ripple',
        'ripple': 'ripple',
        'ada': 'cardano',
        'cardano': 'cardano',
        'dot': 'polkadot',
        'polkadot': 'polkadot',
        'sol': 'solana',
        'solana': 'solana',
        'avax': 'avalanche-2',
        'avalanche': 'avalanche-2',
        'matic': 'matic-network',
        'polygon': 'matic-network',
      };
      
      // Use the mapped CoinGecko ID or the original tokenId
      const coinGeckoId = coinGeckoIdMapping[tokenId.toLowerCase()] || tokenId;
      
      console.log(`📈 Fetching price history for ${tokenId} using CoinGecko ID: ${coinGeckoId}`);
      
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=${days}`, {
        headers: this.coingeckoApiKey ? { 'X-CG-API-KEY': this.coingeckoApiKey } : {},
        timeout: 15000
      });

      if (response.data && (response.data as any).prices) {
        return (response.data as any).prices.map(([timestamp, price]: [number, number]) => ({
          timestamp,
          price
        }));
      }

      return [];
    } catch (error) {
      console.error(`❌ Price history error for ${tokenId}:`, error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  // 🔍 Search DEX pairs by token
  async searchDexPairs(tokenAddress: string, network?: string): Promise<DexScreenerPair[]> {
    try {
      return await this.dexScreenerService.searchTokenPairs(tokenAddress, network);
    } catch (error) {
      console.error(`❌ DEX pairs search error for ${tokenAddress}:`, error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  // 🆕 Enhanced security scoring with DexScreener data
  private calculateComprehensiveSecurityScore(coinGeckoData: any, dexScreenerData: DexScreenerToken | null): number {
    let score = 100;

    // CoinGecko factors
    if (coinGeckoData?.marketCap < 1000000) score -= 15;
    if (coinGeckoData?.volume24h < 100000) score -= 10;

    // DexScreener factors
    if (dexScreenerData) {
      if (dexScreenerData.liquidity < 10000) score -= 25;
      else if (dexScreenerData.liquidity < 100000) score -= 15;
      else if (dexScreenerData.liquidity < 1000000) score -= 5;

      if (dexScreenerData.pairs.length === 0) score -= 20;
      else if (dexScreenerData.pairs.length < 2) score -= 10;

      // Check for multiple DEXes
      const uniqueDexes = new Set(dexScreenerData.pairs.map(pair => pair.dexId));
      if (uniqueDexes.size < 2) score -= 10;
    } else {
      score -= 20; // No DEX data available
    }

    return Math.max(0, score);
  }

  // 🆕 Enhanced risk level calculation with DexScreener data
  private calculateComprehensiveRiskLevel(coinGeckoData: any, dexScreenerData: DexScreenerToken | null): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const score = this.calculateComprehensiveSecurityScore(coinGeckoData, dexScreenerData);

    if (score >= 80) return 'LOW';
    if (score >= 60) return 'MEDIUM';
    if (score >= 40) return 'HIGH';
    return 'CRITICAL';
  }
}

export default BlockNetDataService;
