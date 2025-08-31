// 🎯 TOKEN CONFIGURATION SYSTEM
// This file contains all token configurations organized by monitoring strategy

export interface TokenConfig {
  id: string;
  name: string;
  symbol: string;
  address?: string;
  network?: string;
  contractType?: string;
  description?: string;
  isActive?: boolean;
  priority?: number;
  category: 'ESTABLISHED' | 'TRENDING' | 'NEW_LAUNCH' | 'PRE_LAUNCH' | 'DEFI' | 'MEME' | 'GAMING' | 'AI';
  monitoringStrategy: 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alertThresholds: {
    priceChange: number; // % change to trigger alert
    volumeSpike: number; // % volume increase
    largeTransfer: number; // USD amount
    holderMovement: number; // % holder change
  };
  // 🆕 DEXSCREENER INTEGRATION (No API key required - free service)
  dexScreener?: {
    enabled: boolean;
    pairs: string[]; // Array of pair addresses to monitor
    primaryPair?: string; // Main trading pair address
    networks: string[]; // Networks to monitor (ethereum, bsc, polygon, etc.)
    minLiquidity?: number; // Minimum liquidity in USD to consider
  };
  // 🆕 DATA SOURCE CONFIGURATION
  dataSources: {
    coinGecko: boolean;
    dexScreener: boolean;
    etherscan: boolean;
  };
}

export interface ManualToken {
  id: string;
  coinGeckoId: string;
  name: string;
  symbol: string;
  address?: string;
  network?: string;
  contractType?: string;
  description?: string;
  addedAt: Date;
  isActive: boolean;
  priority?: number;
  category: 'ESTABLISHED' | 'TRENDING' | 'NEW_LAUNCH' | 'PRE_LAUNCH' | 'DEFI' | 'MEME' | 'GAMING' | 'AI';
  monitoringStrategy: 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alertThresholds: {
    priceChange: number;
    volumeSpike: number;
    largeTransfer: number;
    holderMovement: number;
  };
}

// 📋 COMPREHENSIVE TOKEN CONFIGURATION BY CATEGORY

// 🏛️ ESTABLISHED TOKENS (High Priority, Real-time monitoring)
export const ESTABLISHED_TOKENS: { [key: string]: TokenConfig } = {
  'bitcoin': {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin',
    contractType: 'Native',
    description: 'The first and most well-known cryptocurrency',
    isActive: true,
    priority: 100,
    category: 'ESTABLISHED',
    monitoringStrategy: 'REAL_TIME',
    riskLevel: 'LOW',
    alertThresholds: {
      priceChange: 5, // 5% price change
      volumeSpike: 200, // 200% volume increase
      largeTransfer: 1000000, // $1M transfers
      holderMovement: 2 // 2% holder change
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['ethereum'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  },
  'ethereum': {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum',
    contractType: 'Native',
    description: 'Smart contract platform and cryptocurrency',
    isActive: true,
    priority: 95,
    category: 'ESTABLISHED',
    monitoringStrategy: 'REAL_TIME',
    riskLevel: 'LOW',
    alertThresholds: {
      priceChange: 5,
      volumeSpike: 200,
      largeTransfer: 1000000,
      holderMovement: 2
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['ethereum'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  },
  'binancecoin': {
    id: 'binancecoin',
    name: 'BNB',
    symbol: 'BNB',
    network: 'BNB Smart Chain',
    contractType: 'Native',
    description: 'Binance Coin - exchange token',
    isActive: true,
    priority: 90,
    category: 'ESTABLISHED',
    monitoringStrategy: 'REAL_TIME',
    riskLevel: 'LOW',
    alertThresholds: {
      priceChange: 5,
      volumeSpike: 200,
      largeTransfer: 500000,
      holderMovement: 2
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['bsc'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  }
};

// 📈 TRENDING TOKENS (Medium Priority, Hourly monitoring)
export const TRENDING_TOKENS: { [key: string]: TokenConfig } = {
  'solana': {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    network: 'Solana',
    contractType: 'Native',
    description: 'High-performance blockchain platform',
    isActive: true,
    priority: 85,
    category: 'TRENDING',
    monitoringStrategy: 'HOURLY',
    riskLevel: 'MEDIUM',
    alertThresholds: {
      priceChange: 10,
      volumeSpike: 300,
      largeTransfer: 500000,
      holderMovement: 5
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['solana'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  },
  'cardano': {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    network: 'Cardano',
    contractType: 'Native',
    description: 'Proof-of-stake blockchain platform',
    isActive: true,
    priority: 80,
    category: 'TRENDING',
    monitoringStrategy: 'HOURLY',
    riskLevel: 'MEDIUM',
    alertThresholds: {
      priceChange: 10,
      volumeSpike: 300,
      largeTransfer: 500000,
      holderMovement: 5
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['cardano'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  },
  'ripple': {
    id: 'ripple',
    name: 'Ripple',
    symbol: 'XRP',
    network: 'Ripple',
    contractType: 'Native',
    description: 'Digital payment protocol',
    isActive: true,
    priority: 75,
    category: 'TRENDING',
    monitoringStrategy: 'HOURLY',
    riskLevel: 'MEDIUM',
    alertThresholds: {
      priceChange: 10,
      volumeSpike: 300,
      largeTransfer: 500000,
      holderMovement: 5
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['ripple'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  }
};

// 🚀 NEW LAUNCH TOKENS (High Priority, Real-time monitoring)
export const NEW_LAUNCH_TOKENS: { [key: string]: TokenConfig } = {
  'dogecoin': {
    id: 'dogecoin',
    name: 'Dogecoin',
    symbol: 'DOGE',
    network: 'Dogecoin',
    contractType: 'Native',
    description: 'Meme-based cryptocurrency',
    isActive: true,
    priority: 70,
    category: 'NEW_LAUNCH',
    monitoringStrategy: 'REAL_TIME',
    riskLevel: 'HIGH',
    alertThresholds: {
      priceChange: 20,
      volumeSpike: 500,
      largeTransfer: 100000,
      holderMovement: 10
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['dogecoin'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  },
  'shiba-inu': {
    id: 'shiba-inu',
    name: 'Shiba Inu',
    symbol: 'SHIB',
    network: 'Ethereum',
    contractType: 'ERC20',
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    description: 'Dogecoin killer meme token',
    isActive: true,
    priority: 65,
    category: 'NEW_LAUNCH',
    monitoringStrategy: 'REAL_TIME',
    riskLevel: 'HIGH',
    alertThresholds: {
      priceChange: 20,
      volumeSpike: 500,
      largeTransfer: 100000,
      holderMovement: 10
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['ethereum'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  }
};

// 🔮 PRE-LAUNCH TOKENS (Medium Priority, Daily monitoring)
export const PRE_LAUNCH_TOKENS: { [key: string]: TokenConfig } = {
  'polkadot': {
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    network: 'Polkadot',
    contractType: 'Native',
    description: 'Multi-chain blockchain platform',
    isActive: true,
    priority: 60,
    category: 'PRE_LAUNCH',
    monitoringStrategy: 'DAILY',
    riskLevel: 'MEDIUM',
    alertThresholds: {
      priceChange: 15,
      volumeSpike: 400,
      largeTransfer: 200000,
      holderMovement: 8
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['polkadot'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  }
};

// 🏦 DEFI TOKENS (Medium Priority, Hourly monitoring)
export const DEFI_TOKENS: { [key: string]: TokenConfig } = {
  'chainlink': {
    id: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    network: 'Ethereum',
    contractType: 'ERC20',
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    description: 'Decentralized oracle network',
    isActive: true,
    priority: 55,
    category: 'DEFI',
    monitoringStrategy: 'HOURLY',
    riskLevel: 'MEDIUM',
    alertThresholds: {
      priceChange: 12,
      volumeSpike: 350,
      largeTransfer: 300000,
      holderMovement: 6
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['ethereum'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  },
  'uniswap': {
    id: 'uniswap',
    name: 'Uniswap',
    symbol: 'UNI',
    network: 'Ethereum',
    contractType: 'ERC20',
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    description: 'Decentralized exchange protocol',
    isActive: true,
    priority: 50,
    category: 'DEFI',
    monitoringStrategy: 'HOURLY',
    riskLevel: 'MEDIUM',
    alertThresholds: {
      priceChange: 12,
      volumeSpike: 350,
      largeTransfer: 300000,
      holderMovement: 6
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['ethereum'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  },
  'aave': {
    id: 'aave',
    name: 'Aave',
    symbol: 'AAVE',
    network: 'Ethereum',
    contractType: 'ERC20',
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    description: 'Decentralized lending protocol',
    isActive: true,
    priority: 45,
    category: 'DEFI',
    monitoringStrategy: 'HOURLY',
    riskLevel: 'MEDIUM',
    alertThresholds: {
      priceChange: 12,
      volumeSpike: 350,
      largeTransfer: 300000,
      holderMovement: 6
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['ethereum'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  }
};

// 🎮 GAMING TOKENS (Lower Priority, Daily monitoring)
export const GAMING_TOKENS: { [key: string]: TokenConfig } = {
  'axie-infinity': {
    id: 'axie-infinity',
    name: 'Axie Infinity',
    symbol: 'AXS',
    network: 'Ethereum',
    contractType: 'ERC20',
    address: '0xBB0E17EF65F82AB018D8EDD776E8DD940327B28B',
    description: 'Play-to-earn gaming platform',
    isActive: true,
    priority: 40,
    category: 'GAMING',
    monitoringStrategy: 'DAILY',
    riskLevel: 'HIGH',
    alertThresholds: {
      priceChange: 25,
      volumeSpike: 600,
      largeTransfer: 150000,
      holderMovement: 15
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['ethereum'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  }
};

// 🤖 AI TOKENS (Medium Priority, Hourly monitoring)
export const AI_TOKENS: { [key: string]: TokenConfig } = {
  'ocean-protocol': {
    id: 'ocean-protocol',
    name: 'Ocean Protocol',
    symbol: 'OCEAN',
    network: 'Ethereum',
    contractType: 'ERC20',
    address: '0x967da4048cD07aB37855c090aAF366e4ce1b9F48',
    description: 'AI data marketplace',
    isActive: true,
    priority: 35,
    category: 'AI',
    monitoringStrategy: 'HOURLY',
    riskLevel: 'MEDIUM',
    alertThresholds: {
      priceChange: 15,
      volumeSpike: 400,
      largeTransfer: 200000,
      holderMovement: 8
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x0000000000000000000000000000000000000000'], // Placeholder, replace with actual pairs
      networks: ['ethereum'],
      minLiquidity: 1000000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  }
};

// 🎯 COMBINE ALL TOKEN CONFIGS
export const TOKEN_CONFIGS: { [key: string]: TokenConfig } = {
  ...ESTABLISHED_TOKENS,
  ...TRENDING_TOKENS,
  ...NEW_LAUNCH_TOKENS,
  ...PRE_LAUNCH_TOKENS,
  ...DEFI_TOKENS,
  ...GAMING_TOKENS,
  ...AI_TOKENS,
  // 🆕 MANUAL TOKENS
  'blox-myrc': {
    id: 'blox-myrc',
    name: 'Blox',
    symbol: 'MYRC',
    address: '0x3ed03e95dd894235090b3d4a49e0c3239edce59e',
    network: 'Ethereum',
    contractType: 'ERC20',
    description: 'Blox token on Ethereum network',
    isActive: true,
    priority: 80,
    category: 'TRENDING',
    monitoringStrategy: 'REAL_TIME',
    riskLevel: 'MEDIUM',
    alertThresholds: {
      priceChange: 10,
      volumeSpike: 300,
      largeTransfer: 100000,
      holderMovement: 5
    },
    dexScreener: {
      enabled: true,
      pairs: ['0x3ed03e95dd894235090b3d4a49e0c3239edce59e'], // Will be populated with actual pairs
      networks: ['ethereum'],
      minLiquidity: 10000
    },
    dataSources: {
      coinGecko: true,
      dexScreener: true,
      etherscan: true
    }
  }
};

// 🎯 DEFAULT ACTIVE TOKENS BY CATEGORY
export const DEFAULT_ACTIVE_TOKENS = {
  ESTABLISHED: ['bitcoin', 'ethereum', 'binancecoin'],
  TRENDING: ['solana', 'cardano', 'ripple'],
  NEW_LAUNCH: ['dogecoin'],
  PRE_LAUNCH: ['polkadot'],
  DEFI: ['chainlink', 'uniswap'],
  GAMING: ['axie-infinity'],
  AI: ['ocean-protocol']
};

// 📋 MANUAL TOKENS STORAGE - Now using database
// The manual tokens are now stored in the database via ManualTokenService
// This array is kept for backward compatibility but will be empty
let manualTokens: ManualToken[] = [];

// 🔧 HELPER FUNCTIONS
export const getTokenConfig = (tokenId: string): TokenConfig => {
  return TOKEN_CONFIGS[tokenId] || {
    id: tokenId,
    name: tokenId.charAt(0).toUpperCase() + tokenId.slice(1),
    symbol: tokenId.toUpperCase(),
    network: 'Unknown',
    contractType: 'Unknown',
    description: 'Token information not available',
    isActive: false,
    priority: 0,
    category: 'TRENDING',
    monitoringStrategy: 'DAILY',
    riskLevel: 'MEDIUM',
    alertThresholds: {
      priceChange: 10,
      volumeSpike: 300,
      largeTransfer: 100000,
      holderMovement: 5
    },
    dexScreener: {
      enabled: false,
      pairs: [],
      networks: [],
      minLiquidity: 0
    },
    dataSources: {
      coinGecko: false,
      dexScreener: false,
      etherscan: false
    }
  };
};

export const generateTokenAddress = (tokenId: string): string => {
  const config = getTokenConfig(tokenId);
  if (config.address) {
    return config.address;
  }
  // Generate a placeholder address for native tokens
  return `0x${tokenId}${'0'.repeat(40 - tokenId.length)}`;
};

// 🎯 MANUAL TOKEN MANAGEMENT FUNCTIONS
export const addManualToken = async (tokenId: string, customName?: string, customSymbol?: string, coinGeckoId?: string): Promise<ManualToken> => {
  // Import the service dynamically to avoid circular dependencies
  const { ManualTokenService } = await import('../services/manualTokenService');
  
  // Check if token already exists by our token ID
  const existingToken = await ManualTokenService.getTokenById(tokenId);
  if (existingToken) {
    throw new Error(`Token with ID '${tokenId}' already exists`);
  }

  // Get token config or create default
  const tokenConfig = getTokenConfig(tokenId);
  
  const newTokenData = {
    tokenId, // Use our own token ID
    coinGeckoId: coinGeckoId || tokenId, // Use provided CoinGecko ID or fallback to token ID
    name: customName || tokenConfig.name,
    symbol: customSymbol || tokenConfig.symbol,
    address: tokenConfig.address,
    network: tokenConfig.network,
    contractType: tokenConfig.contractType,
    description: tokenConfig.description,
    isActive: true,
    priority: tokenConfig.priority || 0,
    category: tokenConfig.category,
    monitoringStrategy: tokenConfig.monitoringStrategy,
    riskLevel: tokenConfig.riskLevel,
    alertThresholds: tokenConfig.alertThresholds
  };

  const newToken = await ManualTokenService.addToken(newTokenData);
  console.log(`✅ Added manual token: ${newToken.name} (${newToken.symbol}) - ${tokenId} [${newToken.category}]`);
  
  return newToken;
};

export const removeManualToken = async (tokenId: string): Promise<boolean> => {
  // Import the service dynamically to avoid circular dependencies
  const { ManualTokenService } = await import('../services/manualTokenService');
  
  const removedToken = await ManualTokenService.getTokenById(tokenId);
  if (!removedToken) {
    throw new Error(`Token with ID '${tokenId}' not found`);
  }

  await ManualTokenService.removeToken(tokenId);
  console.log(`❌ Removed manual token: ${removedToken.name} (${removedToken.symbol}) - ${tokenId}`);
  
  return true;
};

export const getManualTokens = async (): Promise<ManualToken[]> => {
  // Import the service dynamically to avoid circular dependencies
  const { ManualTokenService } = await import('../services/manualTokenService');
  return await ManualTokenService.getActiveTokens();
};

export const getAllManualTokens = async (): Promise<ManualToken[]> => {
  // Import the service dynamically to avoid circular dependencies
  const { ManualTokenService } = await import('../services/manualTokenService');
  return await ManualTokenService.getAllTokens();
};

export const toggleTokenStatus = async (tokenId: string): Promise<boolean> => {
  // Import the service dynamically to avoid circular dependencies
  const { ManualTokenService } = await import('../services/manualTokenService');
  
  const token = await ManualTokenService.getTokenById(tokenId);
  if (!token) {
    throw new Error(`Token with ID '${tokenId}' not found`);
  }

  const newStatus = await ManualTokenService.toggleTokenStatus(tokenId);
  console.log(`${newStatus ? '✅' : '❌'} ${newStatus ? 'Activated' : 'Deactivated'} token: ${token.name} (${token.symbol})`);
  
  return newStatus;
};

export const updateTokenPriority = async (coinGeckoId: string, priority: number): Promise<boolean> => {
  // Import the service dynamically to avoid circular dependencies
  const { ManualTokenService } = await import('../services/manualTokenService');
  
  const token = await ManualTokenService.getTokenByCoinGeckoId(coinGeckoId);
  if (!token) {
    throw new Error(`Token with CoinGecko ID '${coinGeckoId}' not found`);
  }

  await ManualTokenService.updateToken(token.id, { priority });
  console.log(`🔄 Updated priority for ${token.name} (${token.symbol}) to ${priority}`);
  
  return true;
};

export const updateManualToken = async (
  tokenId: string,
  updates: {
    name?: string;
    symbol?: string;
    address?: string;
    network?: string;
    category?: string;
    priority?: number;
    riskLevel?: string;
    monitoringStrategy?: string;
    description?: string;
  }
): Promise<ManualToken> => {
  // Import the service dynamically to avoid circular dependencies
  const { ManualTokenService } = await import('../services/manualTokenService');
  
  const token = await ManualTokenService.getTokenById(tokenId);
  if (!token) {
    throw new Error(`Token with ID '${tokenId}' not found`);
  }

  // Update token properties with proper type casting
  const typedUpdates: Partial<ManualToken> = {
    ...updates,
    category: updates.category as any,
    riskLevel: updates.riskLevel as any,
    monitoringStrategy: updates.monitoringStrategy as any
  };
  
  const updatedToken = await ManualTokenService.updateToken(tokenId, typedUpdates);
  
  console.log(`✏️ Updated manual token: ${updatedToken.name} (${updatedToken.symbol}) - ${updatedToken.coinGeckoId}`);
  
  return updatedToken;
};

// 🎯 GET ACTIVE TOKENS FOR API CALLS
export const getActiveTokensForAPI = async (): Promise<string[]> => {
  const activeManualTokens = await getManualTokens();
  return activeManualTokens.map(token => token.coinGeckoId);
};

// 🎯 GET TOKENS BY PRIORITY
export const getTokensByPriority = async (limit?: number): Promise<ManualToken[]> => {
  const activeTokens = await getManualTokens();
  if (limit) {
    return activeTokens.slice(0, limit);
  }
  return activeTokens;
};

// 🎯 SEARCH TOKENS
export const searchTokens = (query: string): TokenConfig[] => {
  const searchTerm = query.toLowerCase();
  return Object.values(TOKEN_CONFIGS).filter(token => 
    token.name.toLowerCase().includes(searchTerm) ||
    token.symbol.toLowerCase().includes(searchTerm) ||
    token.id.toLowerCase().includes(searchTerm)
  );
};

// 🎯 GET TOKENS BY NETWORK
export const getTokensByNetwork = (network: string): TokenConfig[] => {
  return Object.values(TOKEN_CONFIGS).filter(token => 
    token.network?.toLowerCase() === network.toLowerCase()
  );
};

// 🎯 GET TOKENS BY CONTRACT TYPE
export const getTokensByContractType = (contractType: string): TokenConfig[] => {
  return Object.values(TOKEN_CONFIGS).filter(token => 
    token.contractType?.toLowerCase() === contractType.toLowerCase()
  );
};

// 🎯 NEW: GET TOKENS BY CATEGORY
export const getTokensByCategory = (category: string): TokenConfig[] => {
  return Object.values(TOKEN_CONFIGS).filter(token => 
    token.category.toLowerCase() === category.toLowerCase()
  );
};

// 🎯 NEW: GET TOKENS BY MONITORING STRATEGY
export const getTokensByMonitoringStrategy = (strategy: string): TokenConfig[] => {
  return Object.values(TOKEN_CONFIGS).filter(token => 
    token.monitoringStrategy.toLowerCase() === strategy.toLowerCase()
  );
};

// 🎯 NEW: GET TOKENS BY RISK LEVEL
export const getTokensByRiskLevel = (riskLevel: string): TokenConfig[] => {
  return Object.values(TOKEN_CONFIGS).filter(token => 
    token.riskLevel.toLowerCase() === riskLevel.toLowerCase()
  );
};

// 🎯 NEW: GET REAL-TIME MONITORING TOKENS
export const getRealTimeTokens = (): TokenConfig[] => {
  return Object.values(TOKEN_CONFIGS).filter(token => 
    token.monitoringStrategy === 'REAL_TIME'
  );
};

// 🎯 NEW: GET HOURLY MONITORING TOKENS
export const getHourlyTokens = (): TokenConfig[] => {
  return Object.values(TOKEN_CONFIGS).filter(token => 
    token.monitoringStrategy === 'HOURLY'
  );
};

// 🎯 NEW: GET DAILY MONITORING TOKENS
export const getDailyTokens = (): TokenConfig[] => {
  return Object.values(TOKEN_CONFIGS).filter(token => 
    token.monitoringStrategy === 'DAILY'
  );
};

// 🎯 NEW: GET HIGH RISK TOKENS
export const getHighRiskTokens = (): TokenConfig[] => {
  return Object.values(TOKEN_CONFIGS).filter(token => 
    token.riskLevel === 'HIGH' || token.riskLevel === 'CRITICAL'
  );
};
