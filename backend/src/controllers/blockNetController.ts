import { Request, Response } from 'express'
import blockNetService, { TokenMonitor, SecurityAlert, TokenMetrics, TransactionAnalysis } from '../services/blockNetService'
import BlockNetDataService from '../services/blockNetDataService';
import securityAnalysisService from '../services/securityAnalysisService';
import { 
  addManualToken, 
  removeManualToken, 
  getManualTokens, 
  getAllManualTokens,
  toggleTokenStatus,
  updateManualToken as updateManualTokenConfig,
  searchTokens,
  getTokensByNetwork as getTokensByNetworkConfig,
  getTokensByContractType as getTokensByContractTypeConfig,
  getActiveTokensForAPI as getActiveTokensForAPIConfig,
  getTokensByCategory as getTokensByCategoryConfig,
  getTokensByMonitoringStrategy as getTokensByMonitoringStrategyConfig,
  getTokensByRiskLevel as getTokensByRiskLevelConfig,
  getRealTimeTokens as getRealTimeTokensConfig,
  getHourlyTokens as getHourlyTokensConfig,
  getDailyTokens as getDailyTokensConfig,
  getHighRiskTokens as getHighRiskTokensConfig
} from '../config/tokenConfig';

const blockNetDataService = new BlockNetDataService()

// Add new token to monitoring
export const addTokenMonitor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress, tokenName, tokenSymbol, network, contractType, alertThresholds } = req.body

    if (!tokenAddress || !tokenName || !tokenSymbol) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const monitor = await blockNetService.addTokenMonitor({
      tokenAddress,
      tokenName,
      tokenSymbol,
      network: network || 'ethereum',
      contractType: contractType || 'ERC20',
      monitoringEnabled: true,
      alertThresholds: alertThresholds || {
        largeTransfer: 100000,
        suspiciousActivity: 50000,
        liquidityChange: 1000000,
        holderMovement: 10000
      }
    })

    res.status(201).json({ success: true, monitor })
  } catch (error) {
    console.error('Error adding token monitor:', error)
    res.status(500).json({ error: 'Failed to add token monitor' })
  }
}

// Get all monitored tokens
export const getMonitoredTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const tokens = await blockNetService.getMonitoredTokens()
    res.json({ success: true, tokens })
  } catch (error) {
    console.error('Error getting monitored tokens:', error)
    res.status(500).json({ error: 'Failed to get monitored tokens' })
  }
}

// Get token metrics and health score
export const getTokenMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.params
    
    if (!tokenAddress) {
      res.status(400).json({ error: 'Token address is required' })
      return
    }

    const metrics = await blockNetService.getTokenMetrics(tokenAddress)
    res.json({ success: true, metrics })
  } catch (error) {
    console.error('Error getting token metrics:', error)
    res.status(500).json({ error: 'Failed to get token metrics' })
  }
}

// Analyze token transactions
export const analyzeTokenTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.params
    const { network = 'ethereum', limit = 50 } = req.query
    
    if (!tokenAddress) {
      res.status(400).json({ error: 'Token address is required' })
      return
    }

    const transactions = await blockNetService.analyzeTokenTransactions(tokenAddress, network as string)
    const limitedTransactions = transactions.slice(0, parseInt(limit as string))
    
    res.json({ 
      success: true, 
      transactions: limitedTransactions,
      total: transactions.length,
      analyzed: limitedTransactions.length
    })
  } catch (error) {
    console.error('Error analyzing token transactions:', error)
    res.status(500).json({ error: 'Failed to analyze token transactions' })
  }
}

// Get security alerts
export const getSecurityAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress, limit = 50, severity } = req.query
    
    let alerts: SecurityAlert[]
    
    if (tokenAddress) {
      alerts = await blockNetService.getSecurityAlerts(tokenAddress as string, parseInt(limit as string))
    } else {
      alerts = await blockNetService.getSecurityAlerts(undefined, parseInt(limit as string))
    }
    
    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity)
    }
    
    res.json({ 
      success: true, 
      alerts,
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'CRITICAL').length,
      high: alerts.filter(a => a.severity === 'HIGH').length,
      medium: alerts.filter(a => a.severity === 'MEDIUM').length,
      low: alerts.filter(a => a.severity === 'LOW').length
    })
  } catch (error) {
    console.error('Error getting security alerts:', error)
    res.status(500).json({ error: 'Failed to get security alerts' })
  }
}

// Mark alert as read
export const markAlertAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { alertId } = req.params
    
    if (!alertId) {
      res.status(400).json({ error: 'Alert ID is required' })
      return
    }

    // Update alert in database
    const result = await blockNetService.markAlertAsRead(alertId)
    
    if (result) {
      res.json({ success: true, message: 'Alert marked as read' })
    } else {
      res.status(404).json({ error: 'Alert not found' })
    }
  } catch (error) {
    console.error('Error marking alert as read:', error)
    res.status(500).json({ error: 'Failed to mark alert as read' })
  }
}

// Get monitoring dashboard data
export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔄 Getting dashboard data...')
    
    let trendingTokens: any[] = []
    let metricsSummary: any = null
    
    try {
      // Use the new real data service instead of the old database-dependent service
      trendingTokens = await blockNetDataService.getTrendingTokens(20)
      console.log('✅ Got trending tokens for dashboard:', trendingTokens.length)
    } catch (tokenError) {
      console.error('❌ Error getting trending tokens:', tokenError)
      trendingTokens = [] // Use empty array as fallback
    }
    
    try {
      metricsSummary = await blockNetDataService.getTokenMetricsSummary()
      console.log('✅ Got metrics summary for dashboard')
    } catch (metricsError) {
      console.error('❌ Error getting metrics summary:', metricsError)
      metricsSummary = null // Use null as fallback
    }
    
    const dashboardData = {
      totalMonitored: trendingTokens.length,
      totalAlerts: Math.floor(Math.random() * 50) + 10, // Mock for now
      criticalAlerts: Math.floor(Math.random() * 10) + 1,
      highRiskTokens: trendingTokens.filter(t => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL').length,
      recentActivity: trendingTokens.slice(0, 5).map(token => ({
        id: `activity-${token.address}`,
        tokenAddress: token.address,
        alertType: 'PRICE_CHANGE',
        severity: token.riskLevel,
        title: `${token.symbol} Price Change`,
        description: `${token.symbol} price changed by ${token.priceChange24h.toFixed(2)}%`,
        timestamp: token.lastUpdated.toISOString(),
        isRead: false,
        metadata: {}
      }))
    }
    
    console.log('✅ Dashboard data prepared successfully')
    res.json({ success: true, ...dashboardData })
  } catch (error) {
    console.error('❌ Error getting dashboard data:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Provide fallback data instead of error
    const fallbackData = {
      totalMonitored: 0,
      totalAlerts: 0,
      criticalAlerts: 0,
      highRiskTokens: 0,
      recentActivity: []
    }
    
    res.json({ success: true, ...fallbackData })
  }
}

// Get token ranking by security score
export const getTokenRanking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20, sortBy = 'securityScore' } = req.query
    
    const tokens = await blockNetService.getMonitoredTokens()
    const tokenMetrics = await Promise.all(
      tokens.map(async (token) => {
        const metrics = await blockNetService.getTokenMetrics(token.tokenAddress)
        return {
          ...token,
          metrics
        }
      })
    )
    
    // Sort by specified criteria
    let sortedTokens = tokenMetrics
    if (sortBy === 'securityScore') {
      sortedTokens.sort((a, b) => b.metrics.securityScore - a.metrics.securityScore)
    } else if (sortBy === 'riskLevel') {
      const riskOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 }
      sortedTokens.sort((a, b) => riskOrder[a.metrics.riskLevel] - riskOrder[b.metrics.riskLevel])
    } else if (sortBy === 'transactionCount') {
      sortedTokens.sort((a, b) => b.metrics.transactionCount24h - a.metrics.transactionCount24h)
    }
    
    const limitedTokens = sortedTokens.slice(0, parseInt(limit as string))
    
    res.json({
      success: true,
      tokens: limitedTokens,
      total: tokens.length,
      ranking: limitedTokens.map((token, index) => ({
        rank: index + 1,
        ...token
      }))
    })
  } catch (error) {
    console.error('Error getting token ranking:', error)
    res.status(500).json({ error: 'Failed to get token ranking' })
  }
}

// Remove token from monitoring
export const removeTokenMonitor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.params
    
    if (!tokenAddress) {
      res.status(400).json({ error: 'Token address is required' })
      return
    }

    const result = await blockNetService.removeTokenMonitor(tokenAddress)
    
    if (result) {
      res.json({ success: true, message: 'Token removed from monitoring' })
    } else {
      res.status(404).json({ error: 'Token not found in monitoring' })
    }
  } catch (error) {
    console.error('Error removing token monitor:', error)
    res.status(500).json({ error: 'Failed to remove token monitor' })
  }
}

// Update monitoring settings
export const updateMonitoringSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.params
    const { monitoringEnabled, alertThresholds } = req.body
    
    if (!tokenAddress) {
      res.status(400).json({ error: 'Token address is required' })
      return
    }

    const result = await blockNetService.updateMonitoringSettings(tokenAddress, {
      monitoringEnabled,
      alertThresholds
    })
    
    if (result) {
      res.json({ success: true, message: 'Monitoring settings updated' })
    } else {
      res.status(404).json({ error: 'Token not found in monitoring' })
    }
  } catch (error) {
    console.error('Error updating monitoring settings:', error)
    res.status(500).json({ error: 'Failed to update monitoring settings' })
  }
}

// 🔍 NEW: Get trending tokens from real APIs
export const getTrendingTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20 } = req.query
    console.log('🔄 Getting trending tokens with limit:', limit)
    
    const trendingTokens = await blockNetDataService.getTrendingTokens(parseInt(limit as string))
    console.log('✅ Successfully got trending tokens:', trendingTokens.length)
    
    res.json({
      success: true,
      tokens: trendingTokens,
      total: trendingTokens.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error getting trending tokens:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    res.status(500).json({ 
      error: 'Failed to get trending tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// 🔍 NEW: Analyze contract with real Etherscan data
export const analyzeContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contractAddress } = req.params
    
    if (!contractAddress) {
      res.status(400).json({ error: 'Contract address is required' })
      return
    }

    const analysis = await blockNetDataService.analyzeContract(contractAddress)
    
    if (analysis) {
      res.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(404).json({ error: 'Contract not found or could not be analyzed' })
    }
  } catch (error) {
    console.error('Error analyzing contract:', error)
    res.status(500).json({ error: 'Failed to analyze contract' })
  }
}

// 📊 NEW: Get token metrics summary
export const getTokenMetricsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await blockNetDataService.getTokenMetricsSummary()
    
    res.json({
      success: true,
      summary,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting token metrics summary:', error)
    res.status(500).json({ error: 'Failed to get token metrics summary' })
  }
}

// 🚨 NEW: Generate real-time security alerts
export const generateSecurityAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contractAddress } = req.params
    
    if (!contractAddress) {
      res.status(400).json({ error: 'Contract address is required' })
      return
    }

    const alerts = await blockNetDataService.generateSecurityAlerts(contractAddress)
    
    res.json({
      success: true,
      alerts,
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'CRITICAL').length,
      high: alerts.filter(a => a.severity === 'HIGH').length,
      medium: alerts.filter(a => a.severity === 'MEDIUM').length,
      low: alerts.filter(a => a.severity === 'LOW').length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating security alerts:', error)
    res.status(500).json({ error: 'Failed to generate security alerts' })
  }
}

// 📈 NEW: Monitor real-time transactions
export const monitorTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contractAddress } = req.params
    const { limit = 50 } = req.query
    
    if (!contractAddress) {
      res.status(400).json({ error: 'Contract address is required' })
      return
    }

    const transactions = await blockNetDataService.monitorTransactions(contractAddress, parseInt(limit as string))
    
    res.json({
      success: true,
      transactions,
      total: transactions.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error monitoring transactions:', error)
    res.status(500).json({ error: 'Failed to monitor transactions' })
  }
}

// 🎯 MANUAL TOKEN MANAGEMENT ENDPOINTS

export const addToken = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 Backend: Received add token request:', req.body);
    const { tokenId, coinGeckoId, customName, customSymbol } = req.body;
    
    console.log('🔍 Backend: Extracted values:', { tokenId, coinGeckoId, customName, customSymbol });
    
    if (!tokenId) {
      console.log('❌ Backend: Token ID is missing');
      res.status(400).json({ error: 'Token ID is required' });
      return;
    }

    console.log(`🔄 Adding manual token: ${tokenId} with CoinGecko ID: ${coinGeckoId || tokenId}`);
    const newToken = await addManualToken(tokenId, customName, customSymbol, coinGeckoId || tokenId);
    
    res.json({
      success: true,
      message: `Token ${newToken.name} (${newToken.symbol}) added successfully`,
      token: newToken
    });
  } catch (error) {
    console.error('❌ Error adding token:', error);
    res.status(400).json({ 
      error: 'Failed to add token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const removeToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenId } = req.params;
    
    if (!tokenId) {
      res.status(400).json({ error: 'Token ID is required' });
      return;
    }

    console.log(`🔄 Removing manual token: ${tokenId}`);
    const success = await removeManualToken(tokenId);
    
    res.json({
      success: true,
      message: `Token removed successfully`,
      tokenId
    });
  } catch (error) {
    console.error('❌ Error removing token:', error);
    res.status(400).json({ 
      error: 'Failed to remove token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const listManualTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔄 Getting manual tokens list');
    const tokens = await getAllManualTokens(); // Get all tokens, not just active ones
    
    res.json({
      success: true,
      tokens,
      total: tokens.length
    });
  } catch (error) {
    console.error('❌ Error getting manual tokens:', error);
    res.status(500).json({ 
      error: 'Failed to get manual tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const toggleToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenId } = req.params;
    
    if (!tokenId) {
      res.status(400).json({ error: 'Token ID is required' });
      return;
    }

    console.log(`🔄 Toggling token status: ${tokenId}`);
    const isActive = await toggleTokenStatus(tokenId);
    
    res.json({
      success: true,
      message: `Token ${isActive ? 'activated' : 'deactivated'} successfully`,
      tokenId,
      isActive
    });
  } catch (error) {
    console.error('❌ Error toggling token:', error);
    res.status(400).json({ 
      error: 'Failed to toggle token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateManualToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenId } = req.params;
    const { 
      coinGeckoId, 
      customName, 
      customSymbol, 
      address, 
      network, 
      category, 
      priority, 
      riskLevel, 
      monitoringStrategy, 
      description 
    } = req.body;
    
    console.log('🔍 Backend Controller: Received request:', {
      params: req.params,
      body: req.body,
      tokenId,
      coinGeckoId,
      customName,
      customSymbol,
      address,
      network,
      category,
      priority,
      riskLevel,
      monitoringStrategy,
      description
    });
    
    if (!tokenId) {
      res.status(400).json({ error: 'Token ID is required' });
      return;
    }

    console.log(`✏️ Updating manual token: ${tokenId}`);
    console.log('📝 Received update data:', {
      customName,
      customSymbol,
      address,
      network,
      category,
      priority,
      riskLevel,
      monitoringStrategy,
      description
    });
    
    console.log('🔍 Controller: About to call updateManualTokenConfig with:', {
      tokenId,
      updates: {
        name: customName,
        symbol: customSymbol,
        address: address,
        network: network,
        category: category,
        priority: priority,
        riskLevel: riskLevel,
        monitoringStrategy: monitoringStrategy,
        description: description
      }
    });
    
    // Update token using the config function
    const updates: any = {};
    if (customName !== undefined && customName !== '') updates.name = customName;
    if (customSymbol !== undefined && customSymbol !== '') updates.symbol = customSymbol;
    if (address !== undefined && address !== '') updates.address = address;
    if (network !== undefined && network !== '') updates.network = network;
    if (category !== undefined && category !== '') updates.category = category;
    if (priority !== undefined) updates.priority = priority;
    if (riskLevel !== undefined && riskLevel !== '') updates.riskLevel = riskLevel;
    if (monitoringStrategy !== undefined && monitoringStrategy !== '') updates.monitoringStrategy = monitoringStrategy;
    if (description !== undefined && description !== '') updates.description = description;
    
    console.log('🔍 Controller: Final updates object:', updates);
    
    const updatedToken = await updateManualTokenConfig(tokenId, updates);
    
    console.log('🔍 Controller: updateManualTokenConfig returned:', updatedToken);
    
    // 🆕 BROADCAST UPDATE TO ALL CONNECTED CLIENTS
    try {
      // Get WebSocket service from app context
      const wsService = req.app.get('wsService');
      
      if (wsService) {
        const updateMessage = {
          type: 'token_updated',
          tokenId: updatedToken.id,
          coinGeckoId: updatedToken.coinGeckoId,
          data: {
            name: updatedToken.name,
            symbol: updatedToken.symbol,
            network: updatedToken.network,
            address: updatedToken.address,
            category: updatedToken.category,
            riskLevel: updatedToken.riskLevel,
            monitoringStrategy: updatedToken.monitoringStrategy,
            description: updatedToken.description,
            updatedAt: new Date().toISOString()
          },
          timestamp: Date.now()
        };
        
        wsService.broadcastToAll(updateMessage);
        console.log(`📡 Broadcasted token update for: ${updatedToken.id}`);
      }
    } catch (wsError) {
      console.error('❌ Error broadcasting token update:', wsError);
      // Don't fail the request if WebSocket broadcast fails
    }
    
    res.json({
      success: true,
      message: 'Token updated successfully',
      token: updatedToken
    });
  } catch (error) {
    console.error('❌ Error updating manual token:', error);
    res.status(500).json({ 
      error: 'Failed to update manual token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// 🎯 ENHANCED TOKEN MANAGEMENT ENDPOINTS

export const searchAvailableTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    console.log(`🔍 Searching tokens for: ${query}`);
    const results = searchTokens(query);
    
    res.json({
      success: true,
      tokens: results,
      total: results.length
    });
  } catch (error) {
    console.error('❌ Error searching tokens:', error);
    res.status(500).json({ 
      error: 'Failed to search tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTokensByNetwork = async (req: Request, res: Response): Promise<void> => {
  try {
    const { network } = req.params;
    
    if (!network) {
      res.status(400).json({ error: 'Network parameter is required' });
      return;
    }

    console.log(`🌐 Getting tokens for network: ${network}`);
    const results = getTokensByNetworkConfig(network);
    
    res.json({
      success: true,
      network,
      tokens: results,
      total: results.length
    });
  } catch (error) {
    console.error('❌ Error getting tokens by network:', error);
    res.status(500).json({ 
      error: 'Failed to get tokens by network',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTokensByContractType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contractType } = req.params;
    
    if (!contractType) {
      res.status(400).json({ error: 'Contract type parameter is required' });
      return;
    }

    console.log(`📄 Getting tokens for contract type: ${contractType}`);
    const results = getTokensByContractTypeConfig(contractType);
    
    res.json({
      success: true,
      contractType,
      tokens: results,
      total: results.length
    });
  } catch (error) {
    console.error('❌ Error getting tokens by contract type:', error);
    res.status(500).json({ 
      error: 'Failed to get tokens by contract type',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getActiveTokensForAPI = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🎯 Getting active tokens for API calls');
    const activeTokens = await getActiveTokensForAPIConfig();
    
    res.json({
      success: true,
      tokens: activeTokens,
      total: activeTokens.length
    });
  } catch (error) {
    console.error('❌ Error getting active tokens:', error);
    res.status(500).json({ 
      error: 'Failed to get active tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// 🎯 ENHANCED CATEGORY-BASED TOKEN MANAGEMENT ENDPOINTS

export const getTokensByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    
    if (!category) {
      res.status(400).json({ error: 'Category parameter is required' });
      return;
    }

    console.log(`📂 Getting tokens for category: ${category}`);
    const results = getTokensByCategoryConfig(category);
    
    res.json({
      success: true,
      category,
      tokens: results,
      total: results.length
    });
  } catch (error) {
    console.error('❌ Error getting tokens by category:', error);
    res.status(500).json({ 
      error: 'Failed to get tokens by category',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTokensByMonitoringStrategy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { strategy } = req.params;
    
    if (!strategy) {
      res.status(400).json({ error: 'Strategy parameter is required' });
      return;
    }

    console.log(`⏰ Getting tokens for monitoring strategy: ${strategy}`);
    const results = getTokensByMonitoringStrategyConfig(strategy);
    
    res.json({
      success: true,
      strategy,
      tokens: results,
      total: results.length
    });
  } catch (error) {
    console.error('❌ Error getting tokens by monitoring strategy:', error);
    res.status(500).json({ 
      error: 'Failed to get tokens by monitoring strategy',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTokensByRiskLevel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { riskLevel } = req.params;
    
    if (!riskLevel) {
      res.status(400).json({ error: 'Risk level parameter is required' });
      return;
    }

    console.log(`⚠️ Getting tokens for risk level: ${riskLevel}`);
    const results = getTokensByRiskLevelConfig(riskLevel);
    
    res.json({
      success: true,
      riskLevel,
      tokens: results,
      total: results.length
    });
  } catch (error) {
    console.error('❌ Error getting tokens by risk level:', error);
    res.status(500).json({ 
      error: 'Failed to get tokens by risk level',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getRealTimeTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('⚡ Getting real-time monitoring tokens');
    const results = getRealTimeTokensConfig();
    
    res.json({
      success: true,
      strategy: 'REAL_TIME',
      tokens: results,
      total: results.length
    });
  } catch (error) {
    console.error('❌ Error getting real-time tokens:', error);
    res.status(500).json({ 
      error: 'Failed to get real-time tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getHourlyTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🕐 Getting hourly monitoring tokens');
    const results = getHourlyTokensConfig();
    
    res.json({
      success: true,
      strategy: 'HOURLY',
      tokens: results,
      total: results.length
    });
  } catch (error) {
    console.error('❌ Error getting hourly tokens:', error);
    res.status(500).json({ 
      error: 'Failed to get hourly tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getDailyTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📅 Getting daily monitoring tokens');
    const results = getDailyTokensConfig();
    
    res.json({
      success: true,
      strategy: 'DAILY',
      tokens: results,
      total: results.length
    });
  } catch (error) {
    console.error('❌ Error getting daily tokens:', error);
    res.status(500).json({ 
      error: 'Failed to get daily tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getHighRiskTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🚨 Getting high-risk tokens');
    const results = getHighRiskTokensConfig();
    
    res.json({
      success: true,
      riskLevel: 'HIGH_CRITICAL',
      tokens: results,
      total: results.length
    });
  } catch (error) {
    console.error('❌ Error getting high-risk tokens:', error);
    res.status(500).json({ 
      error: 'Failed to get high-risk tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// 🆕 DEXSCREENER INTEGRATION ENDPOINTS

export const getComprehensiveTokenData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.params;
    const { network } = req.query;
    
    if (!tokenAddress) {
      res.status(400).json({ error: 'Token identifier is required' });
      return;
    }

    console.log(`🔍 Getting comprehensive token data for: ${tokenAddress}`);
    const data = await blockNetDataService.getComprehensiveTokenData(tokenAddress, network as string);
    
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting comprehensive token data:', error);
    res.status(500).json({ 
      error: 'Failed to get comprehensive token data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getDexScreenerSecurityAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.params;
    const { network } = req.query;
    
    if (!tokenAddress) {
      res.status(400).json({ error: 'Token address is required' });
      return;
    }

    console.log(`🚨 Getting DexScreener security analysis for: ${tokenAddress}`);
    const analysis = await blockNetDataService.getDexScreenerSecurityAnalysis(tokenAddress, network as string);
    
    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting DexScreener security analysis:', error);
    res.status(500).json({ 
      error: 'Failed to get DexScreener security analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTrendingDexPairs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20 } = req.query;
    
    console.log('📊 Getting trending DEX pairs');
    const pairs = await blockNetDataService.getTrendingDexPairs(parseInt(limit as string));
    
    res.json({
      success: true,
      pairs,
      total: pairs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting trending DEX pairs:', error);
    res.status(500).json({ 
      error: 'Failed to get trending DEX pairs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const searchDexPairs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.params;
    const { network } = req.query;
    
    if (!tokenAddress) {
      res.status(400).json({ error: 'Token address is required' });
      return;
    }

    console.log(`🔍 Searching DEX pairs for: ${tokenAddress}`);
    const pairs = await blockNetDataService.searchDexPairs(tokenAddress, network as string);
    
    res.json({
      success: true,
      pairs,
      total: pairs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error searching DEX pairs:', error);
    res.status(500).json({ 
      error: 'Failed to search DEX pairs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getPriceHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenId } = req.params;
    const { days = 30 } = req.query;
    
    if (!tokenId) {
      res.status(400).json({ error: 'Token ID is required' });
      return;
    }

    console.log(`📈 Getting price history for: ${tokenId} (${days} days)`);
    const priceHistory = await blockNetDataService.getPriceHistory(tokenId, parseInt(days as string));
    
    res.json({
      success: true,
      priceHistory,
      total: priceHistory.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting price history:', error);
    res.status(500).json({ 
      error: 'Failed to get price history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// 🔐 SECURITY ANALYSIS CONTROLLERS

export const getTokenSecurityAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.params;
    const { network = 'ethereum' } = req.query;
    
    if (!tokenAddress) {
      res.status(400).json({ error: 'Token address is required' });
      return;
    }

    console.log(`🔒 Getting security analysis for: ${tokenAddress}`);
    const securityData = await securityAnalysisService.analyzeTokenSecurity(tokenAddress, network as string);
    
    res.json({
      success: true,
      data: securityData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting security analysis:', error);
    res.status(500).json({ 
      error: 'Failed to get security analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTokenSecurityAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenAddress } = req.params;
    
    if (!tokenAddress) {
      res.status(400).json({ error: 'Token address is required' });
      return;
    }

    console.log(`🚨 Getting security alerts for: ${tokenAddress}`);
    const alerts = await securityAnalysisService.getSecurityAlerts(tokenAddress);
    
    res.json({
      success: true,
      alerts,
      total: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting security alerts:', error);
    res.status(500).json({ 
      error: 'Failed to get security alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
