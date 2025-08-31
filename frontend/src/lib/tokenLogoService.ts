// Token Logo Service - Multi-provider with fallbacks
export interface TokenLogoProvider {
  name: string;
  getLogoUrl: (tokenId: string, symbol?: string, address?: string) => string;
  priority: number;
}

export class TokenLogoService {
  private logoCache: Map<string, string> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private pendingRequests: Map<string, Promise<string>> = new Map();

  private providers: TokenLogoProvider[] = [
    // 2. CoinGecko (Second Priority - Backend Proxy)
    {
      name: 'CoinGecko',
      getLogoUrl: (tokenId: string) => {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        return `${apiBaseUrl}/api/blocknet/token-logos/proxy/coingecko/${tokenId}`;
      },
      priority: 2
    },
    // 3. Trust Wallet (Third Priority - Backend Proxy)
    {
      name: 'TrustWallet',
      getLogoUrl: (tokenId: string, symbol?: string, address?: string) => {
        // Only use TrustWallet if we have a valid contract address
        if (address && address.startsWith('0x') && address.length === 42) {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          return `${apiBaseUrl}/api/blocknet/token-logos/proxy/trustwallet/${tokenId}?address=${address}`;
        }
        // Skip TrustWallet for non-contract tokens (like Bitcoin, Cardano)
        return '';
      },
      priority: 3
    },
    // 4. Token Icons (Fourth Priority - Backend Proxy)
    {
      name: 'TokenIcons',
      getLogoUrl: (tokenId: string, symbol?: string) => {
        if (symbol) {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          return `${apiBaseUrl}/api/blocknet/token-logos/proxy/tokenicons/${tokenId}?symbol=${symbol}`;
        }
        return '/token-logo/base.png';
      },
      priority: 4
    }
  ];

  // CoinGecko image ID mappings for popular tokens
  private coinGeckoImageIds: { [key: string]: string } = {
    'bitcoin': '1',
    'btc': '1',
    'ethereum': '279',
    'eth': '279',
    'tether': '325',
    'usdt': '325',
    'binancecoin': '825',
    'bnb': '825',
    'solana': '4128',
    'sol': '4128',
    'usd-coin': '3408',
    'usdc': '3408',
    'staked-ether': '11840',
    'cardano': '975',
    'ada': '975',
    'avalanche-2': '5805',
    'avax': '5805',
    'dogecoin': '5',
    'doge': '5',
    'polkadot': '6636',
    'dot': '6636',
    'polygon': '3890',
    'matic': '3890',
    'chainlink': '197',
    'link': '197',
    'tron': '1958',
    'trx': '1958',
    'bitcoin-cash': '1831',
    'bch': '1831',
    'near': '6535',
    'litecoin': '2',
    'ltc': '2',
    'uniswap': '12504',
    'uni': '12504',
    'cosmos': '3794',
    'atom': '3794',
    'ethereum-classic': '1321',
    'etc': '1321',
    'stellar': '100',
    'xlm': '100',
    'monero': '502',
    'xmr': '502',
    'algorand': '4030',
    'algo': '4030',
    'vechain': '1160',
    'vet': '1160',
    'filecoin': '2280',
    'fil': '2280',
    'internet-computer': '8916',
    'icp': '8916',
    'theta-token': '2416',
    'theta': '2416',
    'xrp': '44',
    'fantom': '3513',
    'ftm': '3513',
    'decentraland': '1966',
    'mana': '1966',
    'the-sandbox': '6210',
    'sand': '6210',
    'axie-infinity': '6783',
    'axs': '6783',
    'aave': '7278',
    'eos': '1765',
    'tezos': '2011',
    'xtz': '2011',
    'klaytn': '4256',
    'klay': '4256',
    'flow': '4558',
    'helium': '5665',
    'hnt': '5665',
    'iota': '1720',
    'miota': '1720',
    'neo': '1376',
    'kusama': '5034',
    'ksm': '5034',
    'harmony': '3945',
    'one': '3945',
    'waves': '1274',
    'dash': '131',
    'zilliqa': '2469',
    'zil': '2469',
    'chiliz': '4066',
    'chz': '4066',
    'enjin-coin': '2130',
    'enj': '2130',
    'quant-network': '3155',
    'qnt': '3155',
    'pancakeswap-token': '7192',
    'cake': '7192',
    'compound-governance-token': '5692',
    'comp': '5692',
    'synthetix-network-token': '2586',
    'snx': '2586',
    'maker': '1518',
    'mkr': '1518',
    'dai': '4943',
    'havven': '2586',
    'yearn-finance': '5864',
    'yfi': '5864',
    'curve-dao-token': '6538',
    'crv': '6538',
    'sushi': '6758',
    '1inch': '8104',
    'wrapped-bitcoin': '1',
    'wbtc': '1',
    'weth': '279',
    'blox-myrc': 'custom' // Custom token
  };



  private getCoinGeckoImageId(tokenId: string): string {
    if (!tokenId || typeof tokenId !== 'string') {
      return '1'; // Default to Bitcoin if not found
    }
    return this.coinGeckoImageIds[tokenId.toLowerCase()] || '1'; // Default to Bitcoin if not found
  }



  /**
   * Check if logo is cached and not expired
   */
  private isCached(tokenId: string): boolean {
    const expiry = this.cacheExpiry.get(tokenId);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Get cached logo URL
   */
  private getCachedLogo(tokenId: string): string | null {
    if (this.isCached(tokenId)) {
      return this.logoCache.get(tokenId) || null;
    }
    return null;
  }

  /**
   * Cache logo URL
   */
  private cacheLogo(tokenId: string, logoUrl: string): void {
    this.logoCache.set(tokenId, logoUrl);
    this.cacheExpiry.set(tokenId, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Get token logo URL with fallback strategy
   */
  async getTokenLogoUrl(tokenId: string, symbol?: string, address?: string): Promise<string> {
    // Check if tokenId is valid
    if (!tokenId || typeof tokenId !== 'string') {
      return '/token-logo/base.png';
    }

    // Handle cache buster parameter
    const cleanTokenId = tokenId.split('?')[0];

    // Check cache first
    const cachedLogo = this.getCachedLogo(cleanTokenId);
    if (cachedLogo) {
      console.log(`🎯 Using cached logo for ${cleanTokenId}: ${cachedLogo}`);
      return cachedLogo;
    }

    // Check if there's already a pending request for this token
    const pendingRequest = this.pendingRequests.get(cleanTokenId);
    if (pendingRequest) {
      console.log(`⏳ Waiting for pending logo request for ${cleanTokenId}`);
      return pendingRequest;
    }

    console.log(`🚀 Starting new logo request (ASYNC) for ${cleanTokenId}`)
    console.log(`📍 Call stack:`, new Error().stack?.split('\n').slice(1, 4).join('\n'));

    // Create the logo fetching promise
    const logoPromise = this.fetchLogoWithFallback(cleanTokenId, symbol, address);
    
    // Store the promise in pending requests
    this.pendingRequests.set(cleanTokenId, logoPromise);
    
    try {
      const result = await logoPromise;
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cleanTokenId);
    }
  }

  /**
   * Internal method to fetch logo with fallback strategy
   */
  private async fetchLogoWithFallback(cleanTokenId: string, symbol?: string, address?: string): Promise<string> {
    // 🆕 FIRST: Check for uploaded logos (highest priority)
    try {
      const uploadedLogoUrl = await this.getUploadedLogoUrl(cleanTokenId);
      if (uploadedLogoUrl) {
        console.log(`🎯 Using uploaded logo for ${cleanTokenId}: ${uploadedLogoUrl}`);
        this.cacheLogo(cleanTokenId, uploadedLogoUrl);
        return uploadedLogoUrl;
      }
    } catch (error) {
      console.warn(`Failed to check uploaded logo for ${cleanTokenId}:`, error);
    }

    // SECOND: For known tokens, try external sources
    const coinGeckoId = this.coinGeckoImageIds[cleanTokenId.toLowerCase()];
    if (coinGeckoId && coinGeckoId !== 'custom') {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const logoUrl = `${apiBaseUrl}/api/blocknet/token-logos/proxy/coingecko/${cleanTokenId}`;
      console.log(`🔄 Using CoinGecko proxy for ${cleanTokenId}`);
      this.cacheLogo(cleanTokenId, logoUrl);
      return logoUrl;
    }

    // THIRD: Try Trust Wallet for ERC20 tokens with contract addresses
    if (address && address.startsWith('0x') && address.length === 42) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const logoUrl = `${apiBaseUrl}/api/blocknet/token-logos/proxy/trustwallet/${cleanTokenId}?address=${address}`;
      console.log(`🔄 Using TrustWallet proxy for ${cleanTokenId}`);
      this.cacheLogo(cleanTokenId, logoUrl);
      return logoUrl;
    }

    // FOURTH: Try TokenIcons for tokens with symbols
    if (symbol) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const logoUrl = `${apiBaseUrl}/api/blocknet/token-logos/proxy/tokenicons/${cleanTokenId}?symbol=${symbol}`;
      console.log(`🔄 Using TokenIcons proxy for ${cleanTokenId}`);
      this.cacheLogo(cleanTokenId, logoUrl);
      return logoUrl;
    }
    
    // Final fallback
    const fallbackLogo = '/token-logo/base.png';
    console.log(`🔄 Using fallback logo for ${cleanTokenId}`);
    this.cacheLogo(cleanTokenId, fallbackLogo);
    return fallbackLogo;
  }

  /**
   * Check if an image URL exists
   */
  private async checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Clear logo cache
   */
  clearCache(): void {
    this.logoCache.clear();
    this.cacheExpiry.clear();
    this.pendingRequests.clear();
    console.log('🧹 Logo cache cleared');
  }

  /**
   * Clear specific logo from cache
   */
  clearLogoFromCache(tokenId: string): void {
    this.logoCache.delete(tokenId);
    this.cacheExpiry.delete(tokenId);
    this.pendingRequests.delete(tokenId);
    console.log(`🧹 Cleared logo cache for ${tokenId}`);
  }

  /**
   * Get logo URL synchronously (for immediate use)
   */
  getTokenLogoUrlSync(tokenId: string, symbol?: string, address?: string): string {
    // Check if tokenId is valid
    if (!tokenId || typeof tokenId !== 'string') {
      return '/token-logo/base.png';
    }

    // Handle cache buster parameter
    const cleanTokenId = tokenId.split('?')[0];

    // Check cache first
    const cachedLogo = this.getCachedLogo(cleanTokenId);
    if (cachedLogo) {
      console.log(`🎯 Using cached logo (sync) for ${cleanTokenId}: ${cachedLogo}`);
      return cachedLogo;
    }

    console.log(`🚀 Starting new logo request (SYNC) for ${cleanTokenId}`)
    console.log(`📍 Call stack:`, new Error().stack?.split('\n').slice(1, 4).join('\n'));

    // 🆕 FIRST: Check for uploaded logos (highest priority) - sync version
    const uploadedLogoUrl = this.getUploadedLogoUrlSync(cleanTokenId);
    if (uploadedLogoUrl) {
      console.log(`🎯 Using uploaded logo (sync) for ${cleanTokenId}: ${uploadedLogoUrl}`);
      this.cacheLogo(cleanTokenId, uploadedLogoUrl);
      return uploadedLogoUrl;
    }

    // SECOND: For known tokens, try external sources
    const coinGeckoId = this.coinGeckoImageIds[cleanTokenId.toLowerCase()];
    if (coinGeckoId && coinGeckoId !== 'custom') {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const logoUrl = `${apiBaseUrl}/api/blocknet/token-logos/proxy/coingecko/${cleanTokenId}`;
      console.log(`🔄 Using CoinGecko proxy (sync) for ${cleanTokenId}`);
      this.cacheLogo(cleanTokenId, logoUrl);
      return logoUrl;
    }

    // THIRD: Try Trust Wallet for ERC20 tokens with contract addresses
    if (address && address.startsWith('0x') && address.length === 42) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const logoUrl = `${apiBaseUrl}/api/blocknet/token-logos/proxy/trustwallet/${cleanTokenId}?address=${address}`;
      console.log(`🔄 Using TrustWallet proxy (sync) for ${cleanTokenId}`);
      this.cacheLogo(cleanTokenId, logoUrl);
      return logoUrl;
    }

    // FOURTH: Try TokenIcons for tokens with symbols
    if (symbol) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const logoUrl = `${apiBaseUrl}/api/blocknet/token-logos/proxy/tokenicons/${cleanTokenId}?symbol=${symbol}`;
      console.log(`🔄 Using TokenIcons proxy (sync) for ${cleanTokenId}`);
      this.cacheLogo(cleanTokenId, logoUrl);
      return logoUrl;
    }
    
    // Final fallback
    const fallbackLogo = '/token-logo/base.png';
    console.log(`🔄 Using fallback logo (sync) for ${cleanTokenId}`);
    this.cacheLogo(cleanTokenId, fallbackLogo);
    return fallbackLogo;
  }

  /**
   * Get uploaded logo URL (from admin dashboard) - Async version
   */
  private async getUploadedLogoUrl(tokenId: string): Promise<string | null> {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      // Remove cache buster to allow proper caching
      const url = `${apiBaseUrl}/api/blocknet/token-logos/${tokenId}`;
      console.log(`🔍 Making logo request for ${tokenId}: ${url}`);
      console.log(`🔍 Request URL (before fetch): ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        cache: 'default',
        headers: {
          'Cache-Control': 'max-age=300' // 5 minutes cache
        }
      });
      console.log(`🔍 Response URL (after fetch): ${response.url}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.logoUrl) {
          // Construct the full URL properly
          const fullUrl = `${apiBaseUrl}${data.logoUrl}`;
          console.log(`🔍 Logo URL constructed for ${tokenId}: ${fullUrl}`);
          return fullUrl;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch uploaded logo for ${tokenId}:`, error);
    }
    
    return null;
  }

  /**
   * Get uploaded logo URL (from admin dashboard) - Sync version for providers
   */
  private getUploadedLogoUrlSync(tokenId: string): string | null {
    // For sync version, we'll return a constructed URL that the async method will validate
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const constructedUrl = `${apiBaseUrl}/api/blocknet/token-logos/uploads/token-logos/${tokenId}.png`;
    
    // Check if we have this in cache already
    const cachedLogo = this.getCachedLogo(tokenId);
    if (cachedLogo && cachedLogo.includes('/uploads/token-logos/')) {
      return cachedLogo;
    }
    
    // Return null for sync version to force async check
    return null;
  }



  /**
   * Get all available providers
   */
  getProviders(): TokenLogoProvider[] {
    return this.providers;
  }

  /**
   * Force refresh logo for a specific token (useful after upload)
   */
  async refreshTokenLogo(tokenId: string, symbol?: string, address?: string): Promise<string> {
    // Clear cache for this token to force fresh fetch
    this.clearLogoFromCache(tokenId);
    return this.getTokenLogoUrl(tokenId, symbol, address);
  }
}

// Export singleton instance
export const tokenLogoService = new TokenLogoService();

