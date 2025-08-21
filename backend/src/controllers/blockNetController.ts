import { Request, Response } from 'express'
import blockNetService, { TokenMonitor, SecurityAlert, TokenMetrics, TransactionAnalysis } from '../services/blockNetService'

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
    const dashboardData = await blockNetService.getDashboardData()
    res.json({ success: true, ...dashboardData })
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    res.status(500).json({ error: 'Failed to get dashboard data' })
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
