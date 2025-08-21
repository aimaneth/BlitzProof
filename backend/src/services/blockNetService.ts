import { ethers } from 'ethers'
import pool from '../config/database'
import { etherscanService } from './etherscanService'

export interface TokenMonitor {
  id: string
  tokenAddress: string
  tokenName: string
  tokenSymbol: string
  network: string
  contractType: 'ERC20' | 'ERC721' | 'Custom'
  monitoringEnabled: boolean
  alertThresholds: {
    largeTransfer: number // in USD
    suspiciousActivity: number
    liquidityChange: number
    holderMovement: number
  }
  createdAt: string
  updatedAt: string
}

export interface SecurityAlert {
  id: string
  tokenAddress: string
  alertType: 'LARGE_TRANSFER' | 'SUSPICIOUS_ACTIVITY' | 'LIQUIDITY_MANIPULATION' | 'FLASH_LOAN' | 'RUG_PULL_INDICATOR' | 'HOLDER_MOVEMENT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  transactionHash?: string
  fromAddress?: string
  toAddress?: string
  amount?: string
  usdValue?: number
  timestamp: string
  isRead: boolean
  metadata: any
}

export interface TokenMetrics {
  tokenAddress: string
  totalSupply: string
  circulatingSupply: string
  marketCap: number
  price: number
  priceChange24h: number
  volume24h: number
  liquidityUSD: number
  holderCount: number
  transactionCount24h: number
  largeTransactions24h: number
  securityScore: number // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  lastUpdated: string
}

export interface TransactionAnalysis {
  hash: string
  tokenAddress: string
  from: string
  to: string
  value: string
  usdValue: number
  gasUsed: number
  gasPrice: string
  timestamp: string
  blockNumber: number
  isLargeTransfer: boolean
  isSuspicious: boolean
  riskFactors: string[]
  analysis: {
    riskScore: number
    description: string
    recommendations: string[]
  }
}

class BlockNetService {
  private monitors: Map<string, TokenMonitor> = new Map()
  private alertQueue: SecurityAlert[] = []

  // Initialize monitoring for a token
  async addTokenMonitor(tokenData: Omit<TokenMonitor, 'id' | 'createdAt' | 'updatedAt'>): Promise<TokenMonitor> {
    const id = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const monitor: TokenMonitor = {
      ...tokenData,
      id,
      createdAt: now,
      updatedAt: now
    }

    // Store in database
    await pool.query(`
      INSERT INTO token_monitors (
        id, token_address, token_name, token_symbol, network, contract_type,
        monitoring_enabled, alert_thresholds, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      monitor.id,
      monitor.tokenAddress,
      monitor.tokenName,
      monitor.tokenSymbol,
      monitor.network,
      monitor.contractType,
      monitor.monitoringEnabled,
      JSON.stringify(monitor.alertThresholds),
      monitor.createdAt,
      monitor.updatedAt
    ])

    this.monitors.set(monitor.id, monitor)
    return monitor
  }

  // Get all monitored tokens
  async getMonitoredTokens(): Promise<TokenMonitor[]> {
    const result = await pool.query(`
      SELECT * FROM token_monitors 
      WHERE monitoring_enabled = true 
      ORDER BY created_at DESC
    `)
    
    return result.rows.map(row => ({
      ...row,
      alertThresholds: JSON.parse(row.alert_thresholds)
    }))
  }

  // Analyze token transactions for security threats
  async analyzeTokenTransactions(tokenAddress: string, network: string = 'ethereum'): Promise<TransactionAnalysis[]> {
    try {
      // Get recent transactions from Etherscan
      const transactions = await etherscanService.getTokenTransactions(tokenAddress, network)
      
      const analyses: TransactionAnalysis[] = []
      
      for (const tx of transactions) {
        const analysis = await this.analyzeTransaction(tx, tokenAddress)
        analyses.push(analysis)
      }
      
      return analyses
    } catch (error) {
      console.error('Error analyzing token transactions:', error)
      return []
    }
  }

  // Analyze individual transaction for security risks
  private async analyzeTransaction(tx: any, tokenAddress: string): Promise<TransactionAnalysis> {
    const usdValue = await this.getUSDValue(tx.value, tokenAddress)
    const isLargeTransfer = usdValue > 100000 // $100K threshold
    const isSuspicious = this.detectSuspiciousPatterns(tx)
    const riskFactors = this.identifyRiskFactors(tx, usdValue)
    
    const riskScore = this.calculateRiskScore(tx, usdValue, riskFactors)
    
    return {
      hash: tx.hash,
      tokenAddress,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      usdValue,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      blockNumber: parseInt(tx.blockNumber),
      isLargeTransfer,
      isSuspicious,
      riskFactors,
      analysis: {
        riskScore,
        description: this.generateRiskDescription(riskScore, riskFactors),
        recommendations: this.generateRecommendations(riskScore, riskFactors)
      }
    }
  }

  // Detect suspicious transaction patterns
  private detectSuspiciousPatterns(tx: any): boolean {
    // Check for common suspicious patterns
    const patterns = [
      tx.gasUsed > 500000, // High gas usage
      tx.value === '0', // Zero value transfer
      tx.from === tx.to, // Self-transfer
      tx.gasPrice > ethers.utils.parseUnits('100', 'gwei') // Extremely high gas price
    ]
    
    return patterns.some(pattern => pattern)
  }

  // Identify specific risk factors
  private identifyRiskFactors(tx: any, usdValue: number): string[] {
    const factors: string[] = []
    
    if (usdValue > 1000000) factors.push('LARGE_TRANSFER')
    if (tx.gasUsed > 500000) factors.push('HIGH_GAS_USAGE')
    if (tx.value === '0') factors.push('ZERO_VALUE_TRANSFER')
    if (tx.from === tx.to) factors.push('SELF_TRANSFER')
    if (tx.gasPrice > ethers.utils.parseUnits('100', 'gwei')) factors.push('EXCESSIVE_GAS_PRICE')
    
    return factors
  }

  // Calculate risk score (0-100)
  private calculateRiskScore(tx: any, usdValue: number, riskFactors: string[]): number {
    let score = 0
    
    // Base score from risk factors
    score += riskFactors.length * 15
    
    // Value-based scoring
    if (usdValue > 1000000) score += 25
    else if (usdValue > 100000) score += 15
    else if (usdValue > 10000) score += 5
    
    // Gas usage scoring
    if (tx.gasUsed > 500000) score += 20
    else if (tx.gasUsed > 200000) score += 10
    
    return Math.min(score, 100)
  }

  // Generate risk description
  private generateRiskDescription(riskScore: number, riskFactors: string[]): string {
    if (riskScore >= 80) return 'Critical risk transaction with multiple suspicious indicators'
    if (riskScore >= 60) return 'High risk transaction requiring immediate attention'
    if (riskScore >= 40) return 'Medium risk transaction with some concerning factors'
    if (riskScore >= 20) return 'Low risk transaction with minor concerns'
    return 'Normal transaction with no significant risks'
  }

  // Generate security recommendations
  private generateRecommendations(riskScore: number, riskFactors: string[]): string[] {
    const recommendations: string[] = []
    
    if (riskFactors.includes('LARGE_TRANSFER')) {
      recommendations.push('Verify transaction legitimacy with token holder')
      recommendations.push('Monitor for follow-up transactions')
    }
    
    if (riskFactors.includes('HIGH_GAS_USAGE')) {
      recommendations.push('Investigate contract interaction complexity')
      recommendations.push('Check for potential flash loan attacks')
    }
    
    if (riskScore >= 60) {
      recommendations.push('Consider implementing additional security measures')
      recommendations.push('Review token contract for vulnerabilities')
    }
    
    return recommendations
  }

  // Get USD value of token amount
  private async getUSDValue(tokenAmount: string, tokenAddress: string): Promise<number> {
    // This would integrate with price feeds (CoinGecko, etc.)
    // For now, return a mock value
    return parseFloat(tokenAmount) * 0.001 // Mock price
  }

  // Create security alert
  async createSecurityAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'isRead'>): Promise<SecurityAlert> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()
    
    const alert: SecurityAlert = {
      ...alertData,
      id,
      timestamp,
      isRead: false
    }

    // Store in database
    await pool.query(`
      INSERT INTO security_alerts (
        id, token_address, alert_type, severity, title, description,
        transaction_hash, from_address, to_address, amount, usd_value,
        timestamp, is_read, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      alert.id,
      alert.tokenAddress,
      alert.alertType,
      alert.severity,
      alert.title,
      alert.description,
      alert.transactionHash,
      alert.fromAddress,
      alert.toAddress,
      alert.amount,
      alert.usdValue,
      alert.timestamp,
      alert.isRead,
      JSON.stringify(alert.metadata)
    ])

    this.alertQueue.push(alert)
    return alert
  }

  // Get security alerts
  async getSecurityAlerts(tokenAddress?: string, limit: number = 50): Promise<SecurityAlert[]> {
    let query = `
      SELECT * FROM security_alerts 
      ORDER BY timestamp DESC 
      LIMIT $1
    `
    let params = [limit]
    
    if (tokenAddress) {
      query = `
        SELECT * FROM security_alerts 
        WHERE token_address = $1
        ORDER BY timestamp DESC 
        LIMIT $2
      `
      params = [tokenAddress, limit]
    }
    
    const result = await pool.query(query, params)
    
    return result.rows.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata || '{}')
    }))
  }

  // Get token metrics and health score
  async getTokenMetrics(tokenAddress: string): Promise<TokenMetrics> {
    try {
      // Get token data from Etherscan
      const tokenData = await etherscanService.getTokenInfo(tokenAddress)
      const transactions = await this.analyzeTokenTransactions(tokenAddress)
      
      // Calculate metrics
      const largeTransactions24h = transactions.filter(tx => tx.isLargeTransfer).length
      const securityScore = this.calculateSecurityScore(transactions)
      const riskLevel = this.determineRiskLevel(securityScore)
      
      return {
        tokenAddress,
        totalSupply: tokenData.totalSupply || '0',
        circulatingSupply: tokenData.circulatingSupply || '0',
        marketCap: 0, // Would integrate with price feeds
        price: 0, // Would integrate with price feeds
        priceChange24h: 0,
        volume24h: 0,
        liquidityUSD: 0,
        holderCount: parseInt(tokenData.holderCount) || 0,
        transactionCount24h: transactions.length,
        largeTransactions24h,
        securityScore,
        riskLevel,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error getting token metrics:', error)
      return this.getDefaultTokenMetrics(tokenAddress)
    }
  }

  // Calculate overall security score
  private calculateSecurityScore(transactions: TransactionAnalysis[]): number {
    if (transactions.length === 0) return 100
    
    const totalRisk = transactions.reduce((sum, tx) => sum + tx.analysis.riskScore, 0)
    const averageRisk = totalRisk / transactions.length
    
    return Math.max(0, 100 - averageRisk)
  }

  // Determine risk level based on security score
  private determineRiskLevel(securityScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (securityScore >= 80) return 'LOW'
    if (securityScore >= 60) return 'MEDIUM'
    if (securityScore >= 40) return 'HIGH'
    return 'CRITICAL'
  }

  // Default metrics for error cases
  private getDefaultTokenMetrics(tokenAddress: string): TokenMetrics {
    return {
      tokenAddress,
      totalSupply: '0',
      circulatingSupply: '0',
      marketCap: 0,
      price: 0,
      priceChange24h: 0,
      volume24h: 0,
      liquidityUSD: 0,
      holderCount: 0,
      transactionCount24h: 0,
      largeTransactions24h: 0,
      securityScore: 0,
      riskLevel: 'CRITICAL',
      lastUpdated: new Date().toISOString()
    }
  }

  // Get monitoring dashboard data
  async getDashboardData(): Promise<{
    totalMonitored: number
    totalAlerts: number
    criticalAlerts: number
    highRiskTokens: number
    recentActivity: SecurityAlert[]
  }> {
    const [monitors, alerts] = await Promise.all([
      this.getMonitoredTokens(),
      this.getSecurityAlerts(undefined, 10)
    ])
    
    const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL').length
    const highRiskTokens = monitors.length // Would calculate based on metrics
    
    return {
      totalMonitored: monitors.length,
      totalAlerts: alerts.length,
      criticalAlerts,
      highRiskTokens,
      recentActivity: alerts
    }
  }
}

export default new BlockNetService()
