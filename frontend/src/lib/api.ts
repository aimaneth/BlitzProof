const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'

export interface User {
  id: number
  wallet_address: string
  username?: string
  email?: string
  created_at: string
}

export interface UserProfile {
  user: User
  stats: {
    scan_count: number
    total_vulnerabilities: number
    average_score: number
  }
  api_keys: ApiKey[]
}

export interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used?: string
  permissions: string[]
}

export interface UserStats {
  scan_count: number
  completed_scans: number
  total_vulnerabilities: number
  high_vulnerabilities: number
  medium_vulnerabilities: number
  low_vulnerabilities: number
  average_score: number
}

export interface ScanResult {
  scanId: string
  status: 'pending' | 'scanning' | 'completed' | 'failed'
  progress: number
  vulnerabilities: Vulnerability[]
  aiAnalysis?: any[]
  summary: {
    high: number
    medium: number
    low: number
    total: number
  }
  score: number
}

export interface Vulnerability {
  id: number
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  line: number
  file: string
  recommendation: string
  remediation?: {
    description: string
    steps: string[]
    bestPractices: string[]
    references: string[]
  } | null
}

export interface ScanHistory {
  id: number
  contract_name: string
  network: string
  status: string
  created_at: string
  scan_results: unknown
}

export interface CustomRule {
  id?: string
  name: string
  description: string
  pattern: string
  regex?: string
  severity: 'high' | 'medium' | 'low'
  category: string
  enabled: boolean
  isPublic: boolean
  tags: string[]
  examples: string[]
  remediation: string
  confidence: number
  createdAt?: Date
  updatedAt?: Date
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    // Don't set Content-Type for FormData - let the browser set it automatically
    const isFormData = options.body instanceof FormData
    const defaultHeaders: Record<string, string> = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers as Record<string, string>),
    }
    
    // Only add Content-Type for non-FormData requests
    if (!isFormData) {
      defaultHeaders['Content-Type'] = 'application/json'
    }
    
    const config: RequestInit = {
      method: 'GET',
      headers: defaultHeaders,
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      // Handle network errors more gracefully
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`❌ Network error: Cannot connect to backend at ${API_BASE_URL}`)
        throw new Error(`Backend server is not running or not accessible. Please ensure the backend is running on ${API_BASE_URL}`)
      }
      throw error
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      return response.ok
    } catch {
      return false
    }
  }

  async registerUser(address: string): Promise<{ token: string }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: address })
    })

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getProfile(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Profile fetch failed: ${response.statusText}`)
    }

    return response.json()
  }

  async scanContract(contractAddress: string, network: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/scan`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ contractAddress, network })
    })

    if (!response.ok) {
      throw new Error(`Scan failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getScanHistory(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/scan/history`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`History fetch failed: ${response.statusText}`)
    }

    return response.json()
  }

  async exportScanResults(scanId: string, format: 'pdf' | 'json'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/export/${scanId}?format=${format}`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    return response.blob()
  }

  // Profile Management
  async getUserProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/profile')
  }

  async updateProfile(data: { username?: string; email?: string; preferences?: any }): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getUserStats(): Promise<{
    totalScans: number
    completedScans: number
    failedScans: number
    totalVulnerabilities: number
    highVulnerabilities: number
    mediumVulnerabilities: number
    lowVulnerabilities: number
    successRate: string
  }> {
    return this.request<{
      totalScans: number
      completedScans: number
      failedScans: number
      totalVulnerabilities: number
      highVulnerabilities: number
      mediumVulnerabilities: number
      lowVulnerabilities: number
      successRate: string
    }>('/api/scan/stats/user')
  }

  async createApiKey(name: string, permissions?: string[]): Promise<{ message: string; api_key: ApiKey }> {
    return this.request<{ message: string; api_key: ApiKey }>('/api/profile/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, permissions }),
    })
  }

  async deleteApiKey(keyId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/profile/api-keys/${keyId}`, {
      method: 'DELETE',
    })
  }

  // File Upload and Scanning
  async uploadAndScan(file: File, network: string): Promise<{ scanId: string; message: string; status: string }> {
    const formData = new FormData()
    formData.append('contract', file)
    formData.append('network', network)

    return this.request<{ scanId: string; message: string; status: string }>('/api/scan/upload', {
      method: 'POST',
      body: formData,
    })
  }

  async scanContractAddress(address: string, network: string): Promise<{ 
    scanId: string; 
    message: string; 
    status: string;
    contractName?: string;
    compilerVersion?: string;
    explorer?: string;
  }> {
    return this.request<{ 
      scanId: string; 
      message: string; 
      status: string;
      contractName?: string;
      compilerVersion?: string;
      explorer?: string;
    }>('/api/scan/address', {
      method: 'POST',
      body: JSON.stringify({ address, network }),
    })
  }

  async getScanStatus(scanId: string): Promise<ScanResult> {
    return this.request<ScanResult>(`/api/scan/status/${scanId}`)
  }

  async getUserScans(): Promise<{ scans: ScanHistory[] }> {
    return this.request<{ scans: ScanHistory[] }>('/api/scan/history')
  }

  async getScanDetails(scanId: string): Promise<{ scan: unknown; vulnerabilities: Vulnerability[] }> {
    return this.request<{ scan: unknown; vulnerabilities: Vulnerability[] }>(`/api/scan/${scanId}`)
  }

  async getScanResult(scanId: string): Promise<ScanResult> {
    return this.request<ScanResult>(`/api/scan/${scanId}/result`)
  }

  async generateShareableLink(scanId: string): Promise<{ shareableLink: string; scanId: string; message: string }> {
    return this.request<{ shareableLink: string; scanId: string; message: string }>(`/api/scan/${scanId}/share`, {
      method: 'POST',
    })
  }

  // Health and Connection
  async healthCheck(): Promise<{ status: string; uptime: number; timestamp: string }> {
    return this.request<{ status: string; uptime: number; timestamp: string }>('/health')
  }

  // Custom Rules Management
  async getCustomRules(): Promise<{ rules: CustomRule[] }> {
    return this.request<{ rules: CustomRule[] }>('/api/custom-rules')
  }

  async createCustomRule(rule: Omit<CustomRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomRule> {
    return this.request<CustomRule>('/api/custom-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    })
  }

  async updateCustomRule(ruleId: string, updates: Partial<CustomRule>): Promise<CustomRule> {
    return this.request<CustomRule>(`/api/custom-rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteCustomRule(ruleId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/custom-rules/${ruleId}`, {
      method: 'DELETE',
    })
  }

  async getCustomRule(ruleId: string): Promise<CustomRule> {
    return this.request<CustomRule>(`/api/custom-rules/${ruleId}`)
  }

  // Batch Scanning
  async startBatchScan(files: File[], config?: any): Promise<{ jobId: string; message: string }> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append(`contracts`, file)
    })
    if (config) {
      formData.append('config', JSON.stringify(config))
    }

    return this.request<{ jobId: string; message: string }>('/api/batch-scan/start', {
      method: 'POST',
      body: formData,
    })
  }

  async getBatchScanStatus(jobId: string): Promise<{ 
    status: string; 
    progress: number; 
    totalFiles: number; 
    processedFiles: number; 
    results: any[] 
  }> {
    return this.request<{ 
      status: string; 
      progress: number; 
      totalFiles: number; 
      processedFiles: number; 
      results: any[] 
    }>(`/api/batch-scan/${jobId}/status`)
  }

  async getBatchScanResults(jobId: string): Promise<{ results: any[]; summary: any }> {
    return this.request<{ results: any[]; summary: any }>(`/api/batch-scan/${jobId}/results`)
  }

  // Enhanced Export
  async getExportTemplates(): Promise<{ templates: any[] }> {
    return this.request<{ templates: any[] }>('/api/export/templates')
  }

  // Remediation
  async generateRemediationPlan(vulnerability: any): Promise<{ data: any }> {
    return this.request<{ data: any }>('/api/remediation/plan', {
      method: 'POST',
      body: JSON.stringify({ vulnerability }),
    })
  }

  async generateAutomatedFix(vulnerability: any): Promise<{ data: any }> {
    return this.request<{ data: any }>('/api/remediation/fix', {
      method: 'POST',
      body: JSON.stringify({ vulnerability }),
    })
  }

  async getBestPractices(category?: string): Promise<{ data: any[] }> {
    const params = category ? `?category=${category}` : ''
    return this.request<{ data: any[] }>(`/api/remediation/best-practices${params}`)
  }

  async getSecurityRecommendations(vulnerabilities: any[]): Promise<{ data: any }> {
    return this.request<{ data: any }>('/api/remediation/recommendations', {
      method: 'POST',
      body: JSON.stringify({ vulnerabilities }),
    })
  }

  async generateBatchRemediation(vulnerabilities: any[]): Promise<{ data: any }> {
    return this.request<{ data: any }>('/api/remediation/batch', {
      method: 'POST',
      body: JSON.stringify({ vulnerabilities }),
    })
  }

  async getRemediationStats(): Promise<{ data: any }> {
    return this.request<{ data: any }>('/api/remediation/stats')
  }

  // New methods for real statistics
  async getGlobalStats(): Promise<{
    totalScans: string
    totalVulnerabilities: string
    detectionAccuracy: string
    completedScans: number
    failedScans: number
    highVulnerabilities: number
    mediumVulnerabilities: number
    lowVulnerabilities: number
  }> {
    return this.request<{
      totalScans: string
      totalVulnerabilities: string
      detectionAccuracy: string
      completedScans: number
      failedScans: number
      highVulnerabilities: number
      mediumVulnerabilities: number
      lowVulnerabilities: number
    }>('/api/scan/stats/global')
  }

  async getRecentActivity(limit?: number): Promise<{
    recentActivity: Array<{
      id: number
      contractName: string
      contractAddress?: string
      network: string
      status: string
      createdAt: string
      updatedAt: string
      vulnerabilityCount: number
      highCount: number
      mediumCount: number
      lowCount: number
    }>
  }> {
    const params = limit ? `?limit=${limit}` : ''
    return this.request<{
      recentActivity: Array<{
        id: number
        contractName: string
        contractAddress?: string
        network: string
        status: string
        createdAt: string
        updatedAt: string
        vulnerabilityCount: number
        highCount: number
        mediumCount: number
        lowCount: number
      }>
    }>(`/api/scan/recent-activity${params}`)
  }

  // BlockNet API Methods
  async getBlockNetDashboard(): Promise<{
    totalMonitored: number
    totalAlerts: number
    criticalAlerts: number
    highRiskTokens: number
    recentActivity: Array<{
      id: string
      tokenAddress: string
      alertType: string
      severity: string
      title: string
      description: string
      timestamp: string
      isRead: boolean
    }>
  }> {
    return this.request<{
      totalMonitored: number
      totalAlerts: number
      criticalAlerts: number
      highRiskTokens: number
      recentActivity: Array<{
        id: string
        tokenAddress: string
        alertType: string
        severity: string
        title: string
        description: string
        timestamp: string
        isRead: boolean
      }>
    }>('/api/blocknet/dashboard')
  }

  async getMonitoredTokens(): Promise<{
    tokens: Array<{
      id: string
      tokenAddress: string
      tokenName: string
      tokenSymbol: string
      network: string
      contractType: string
      monitoringEnabled: boolean
      alertThresholds: any
      createdAt: string
      updatedAt: string
    }>
  }> {
    return this.request<{
      tokens: Array<{
        id: string
        tokenAddress: string
        tokenName: string
        tokenSymbol: string
        network: string
        contractType: string
        monitoringEnabled: boolean
        alertThresholds: any
        createdAt: string
        updatedAt: string
      }>
    }>('/api/blocknet/monitors')
  }

  async addTokenMonitor(monitorData: {
    tokenAddress: string
    tokenName: string
    tokenSymbol: string
    network: string
    contractType: string
  }): Promise<{ success: boolean; monitor: any }> {
    return this.request<{ success: boolean; monitor: any }>('/api/blocknet/monitors', {
      method: 'POST',
      body: JSON.stringify(monitorData)
    })
  }

  async getSecurityAlerts(tokenAddress?: string, limit?: number): Promise<{
    alerts: Array<{
      id: string
      tokenAddress: string
      alertType: string
      severity: string
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
    }>
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }> {
    const params = new URLSearchParams()
    if (tokenAddress) params.append('tokenAddress', tokenAddress)
    if (limit) params.append('limit', limit.toString())
    
    const queryString = params.toString()
    return this.request<{
      alerts: Array<{
        id: string
        tokenAddress: string
        alertType: string
        severity: string
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
      }>
      total: number
      critical: number
      high: number
      medium: number
      low: number
    }>(`/api/blocknet/alerts${queryString ? `?${queryString}` : ''}`)
  }

  async markAlertAsRead(alertId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/blocknet/alerts/${alertId}/read`, {
      method: 'PUT'
    })
  }

  async getTokenRanking(limit?: number, sortBy?: string): Promise<{
    ranking: Array<{
      rank: number
      id: string
      tokenAddress: string
      tokenName: string
      tokenSymbol: string
      network: string
      contractType: string
      monitoringEnabled: boolean
      metrics: {
        securityScore: number
        riskLevel: string
        transactionCount24h: number
        largeTransactions24h: number
      }
    }>
    total: number
  }> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (sortBy) params.append('sortBy', sortBy)
    
    const queryString = params.toString()
    return this.request<{
      ranking: Array<{
        rank: number
        id: string
        tokenAddress: string
        tokenName: string
        tokenSymbol: string
        network: string
        contractType: string
        monitoringEnabled: boolean
        metrics: {
          securityScore: number
          riskLevel: string
          transactionCount24h: number
          largeTransactions24h: number
        }
      }>
      total: number
    }>(`/api/blocknet/ranking${queryString ? `?${queryString}` : ''}`)
  }

  async getTokenMetrics(tokenAddress: string): Promise<{
    metrics: {
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
      securityScore: number
      riskLevel: string
      lastUpdated: string
    }
  }> {
    return this.request<{
      metrics: {
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
        securityScore: number
        riskLevel: string
        lastUpdated: string
      }
    }>(`/api/blocknet/tokens/${tokenAddress}/metrics`)
  }

  // 🔍 NEW: Real data API methods
  async getTrendingTokens(limit?: number): Promise<{
    tokens: Array<{
      address: string
      symbol: string
      name: string
      price: number
      marketCap: number
      volume24h: number
      priceChange24h: number
      holderCount: number
      securityScore: number
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      lastUpdated: Date
    }>
    total: number
    timestamp: string
  }> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    
    const queryString = params.toString()
    return this.request<{
      tokens: Array<{
        address: string
        symbol: string
        name: string
        price: number
        marketCap: number
        volume24h: number
        priceChange24h: number
        holderCount: number
        securityScore: number
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
        lastUpdated: Date
      }>
      total: number
      timestamp: string
    }>(`/api/blocknet/trending${queryString ? `?${queryString}` : ''}`)
  }

  async analyzeContract(contractAddress: string): Promise<{
    analysis: {
      contractAddress: string
      sourceCode: string
      abi: string
      contractName: string
      compilerVersion: string
      optimizationUsed: string
      runs: string
      constructorArguments: string
      evmVersion: string
      library: string
      licenseType: string
      proxy: string
      implementation: string
      swarmSource: string
      transactionCount: number
      lastTransaction: any
      securityAnalysis: {
        riskScore: number
        vulnerabilities: string[]
        suspiciousPatterns: string[]
        recommendations: string[]
      }
    }
    timestamp: string
  }> {
    return this.request<{
      analysis: {
        contractAddress: string
        sourceCode: string
        abi: string
        contractName: string
        compilerVersion: string
        optimizationUsed: string
        runs: string
        constructorArguments: string
        evmVersion: string
        library: string
        licenseType: string
        proxy: string
        implementation: string
        swarmSource: string
        transactionCount: number
        lastTransaction: any
        securityAnalysis: {
          riskScore: number
          vulnerabilities: string[]
          suspiciousPatterns: string[]
          recommendations: string[]
        }
      }
      timestamp: string
    }>(`/api/blocknet/contracts/${contractAddress}/analyze`)
  }

  // Database-first API methods
  async getCachedDashboard(): Promise<{
    data: {
      tokens: Array<{
        id: string; // 🆕 ADDED: Database ID
        coinGeckoId: string; // 🆕 ADDED: CoinGecko ID
        address: string;
        symbol: string;
        name: string;
        price: number;
        marketCap: number;
        volume24h: number;
        priceChange24h: number;
        holderCount: number;
        securityScore: number;
        lastUpdate: Date;
        isRefreshing?: boolean;
        refreshError?: string;
        // Manual token fields
        description?: string;
        network?: string;
        category?: string;
        priority?: number;
        riskLevel?: string;
        monitoringStrategy?: string;
      }>;
      stats: {
        totalTokens: number;
        refreshingTokens: number;
        tokensWithErrors: number;
        lastUpdate: string;
      };
    };
    fromCache: boolean;
    message?: string;
  }> {
    return this.request<{
      data: {
        tokens: Array<{
          id: string;
          coinGeckoId: string;
          address: string;
          symbol: string;
          name: string;
          price: number;
          marketCap: number;
          volume24h: number;
          priceChange24h: number;
          holderCount: number;
          securityScore: number;
          lastUpdate: Date;
          isRefreshing?: boolean;
          refreshError?: string;
        }>;
        stats: {
          totalTokens: number;
          refreshingTokens: number;
          tokensWithErrors: number;
          lastUpdate: string;
        };
      };
      fromCache: boolean;
      message?: string;
    }>(`/api/cached/dashboard`);
  }

  async getCachedTokenData(tokenId: string): Promise<{
    data: {
      tokenId: string;
      name: string;
      symbol: string;
      price: number;
      priceChange24h: number;
      marketCap: number;
      volume24h: number;
      securityScore: number;
      holderCount: number;
      network?: string;
      address?: string;
      contractType?: string;
      dexPairs: any[];
      priceHistory: any[];
      lastApiUpdate: Date;
      isRefreshing: boolean;
      refreshError?: string;
    };
    fromCache: boolean;
    isRefreshing: boolean;
    lastUpdate?: Date;
  }> {
    return this.request<{
      data: {
        tokenId: string;
        name: string;
        symbol: string;
        price: number;
        priceChange24h: number;
        marketCap: number;
        volume24h: number;
        securityScore: number;
        holderCount: number;
        network?: string;
        address?: string;
        contractType?: string;
        dexPairs: any[];
        priceHistory: any[];
        lastApiUpdate: Date;
        isRefreshing: boolean;
        refreshError?: string;
      };
      fromCache: boolean;
      isRefreshing: boolean;
      lastUpdate?: Date;
    }>(`/api/cached/token/${tokenId}`);
  }

  async forceRefreshToken(tokenId: string): Promise<{
    success: boolean;
    message: string;
    jobId: number;
    estimatedTime: string;
  }> {
    return this.request<{
      success: boolean;
      message: string;
      jobId: number;
      estimatedTime: string;
    }>(`/api/cached/refresh/${tokenId}`, {
      method: 'POST'
    });
  }

  async getRefreshStatus(): Promise<{
    data: {
      pendingJobs: number;
      activeRefreshes: number;
      tokensRefreshing: Array<{
        tokenId: string;
        name: string;
        symbol: string;
        lastUpdate: Date;
      }>;
    };
  }> {
    return this.request<{
      data: {
        pendingJobs: number;
        activeRefreshes: number;
        tokensRefreshing: Array<{
          tokenId: string;
          name: string;
          symbol: string;
          lastUpdate: Date;
        }>;
      };
    }>(`/api/cached/refresh/status`);
  }

  async getTokenMetricsSummary(): Promise<{
    summary: {
      totalTokens: number
      averageSecurityScore: number
      riskDistribution: {
        LOW: number
        MEDIUM: number
        HIGH: number
        CRITICAL: number
      }
      totalMarketCap: number
      totalVolume24h: number
    }
    timestamp: string
  }> {
    return this.request<{
      summary: {
        totalTokens: number
        averageSecurityScore: number
        riskDistribution: {
          LOW: number
          MEDIUM: number
          HIGH: number
          CRITICAL: number
        }
        totalMarketCap: number
        totalVolume24h: number
      }
      timestamp: string
    }>('/api/blocknet/metrics/summary')
  }

  async generateSecurityAlerts(contractAddress: string): Promise<{
    alerts: Array<{
      id: string
      tokenAddress: string
      alertType: 'LARGE_TRANSFER' | 'SUSPICIOUS_ACTIVITY' | 'LIQUIDITY_REMOVAL' | 'PRICE_MANIPULATION'
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      title: string
      description: string
      metadata: any
      timestamp: Date
      isRead: boolean
    }>
    total: number
    critical: number
    high: number
    medium: number
    low: number
    timestamp: string
  }> {
    return this.request<{
      alerts: Array<{
        id: string
        tokenAddress: string
        alertType: 'LARGE_TRANSFER' | 'SUSPICIOUS_ACTIVITY' | 'LIQUIDITY_REMOVAL' | 'PRICE_MANIPULATION'
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
        title: string
        description: string
        metadata: any
        timestamp: Date
        isRead: boolean
      }>
      total: number
      critical: number
      high: number
      medium: number
      low: number
      timestamp: string
    }>(`/api/blocknet/contracts/${contractAddress}/alerts`)
  }

  async monitorTransactions(contractAddress: string, limit?: number): Promise<{
    transactions: Array<{
      hash: string
      from: string
      to: string
      value: string
      gas: string
      gasPrice: string
      timeStamp: string
      blockNumber: string
      isError: string
      txreceipt_status: string
    }>
    total: number
    timestamp: string
  }> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    
    const queryString = params.toString()
    return this.request<{
      transactions: Array<{
        hash: string
        from: string
        to: string
        value: string
        gas: string
        gasPrice: string
        timeStamp: string
        blockNumber: string
        isError: string
        txreceipt_status: string
      }>
      total: number
      timestamp: string
    }>(`/api/blocknet/contracts/${contractAddress}/transactions${queryString ? `?${queryString}` : ''}`)
  }

  // Contact form submission
  async submitContactForm(formData: {
    project: string
    name: string
    email: string
    job: string
    contact: string
    services: string[]
    notes: string
  }): Promise<{
    success: boolean
    message: string
    contactId: number
  }> {
    return this.request<{
      success: boolean
      message: string
      contactId: number
    }>('/api/contact/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
  }

  // 🎯 Manual Token Management API Methods
  async getManualTokens(): Promise<{
    tokens: Array<{
      id: string;
      coinGeckoId: string;
      name: string;
      symbol: string;
      address?: string;
      network?: string;
      contractType?: string;
      description?: string;
      addedAt: string;
      isActive: boolean;
    }>;
    total: number;
  }> {
    return this.request<{
      tokens: Array<{
        id: string;
        coinGeckoId: string;
        name: string;
        symbol: string;
        address?: string;
        network?: string;
        contractType?: string;
        description?: string;
        addedAt: string;
        isActive: boolean;
      }>;
      total: number;
    }>('/api/blocknet/manual-tokens');
  }

  async addManualToken(tokenId: string, customName?: string, customSymbol?: string, coinGeckoId?: string): Promise<{
    success: boolean;
    message: string;
    token: {
      id: string;
      coinGeckoId: string;
      name: string;
      symbol: string;
      address?: string;
      network?: string;
      contractType?: string;
      description?: string;
      addedAt: string;
      isActive: boolean;
    };
  }> {
    return this.request<{
      success: boolean;
      message: string;
      token: {
        id: string;
        coinGeckoId: string;
        name: string;
        symbol: string;
        address?: string;
        network?: string;
        contractType?: string;
        description?: string;
        addedAt: string;
        isActive: boolean;
      };
    }>('/api/blocknet/manual-tokens', {
      method: 'POST',
      body: JSON.stringify({ tokenId, coinGeckoId, customName, customSymbol })
    });
  }

  async updateManualToken(
    tokenId: string,
    coinGeckoId: string,
    customName?: string,
    customSymbol?: string,
    address?: string,
    network?: string,
    category?: string,
    priority?: number,
    riskLevel?: string,
    monitoringStrategy?: string,
    description?: string
  ): Promise<{
    success: boolean;
    message: string;
    token: {
      id: string;
      coinGeckoId: string;
      name: string;
      symbol: string;
      address?: string;
      network?: string;
      contractType?: string;
      description?: string;
      addedAt: string;
      isActive: boolean;
    };
  }> {
    const requestBody = {
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
    };
    
    console.log('🔍 API Service: Sending update request:', {
      url: `/api/blocknet/manual-tokens/${tokenId}`,
      method: 'PUT',
      body: requestBody
    });
    
    return this.request<{
      success: boolean;
      message: string;
      token: {
        id: string;
        coinGeckoId: string;
        name: string;
        symbol: string;
        address?: string;
        network?: string;
        contractType?: string;
        description?: string;
        addedAt: string;
        isActive: boolean;
      };
    }>(`/api/blocknet/manual-tokens/${tokenId}`, {
      method: 'PUT',
      body: JSON.stringify(requestBody)
    });
  }

  async removeManualToken(tokenId: string): Promise<{
    success: boolean;
    message: string;
    tokenId: string;
  }> {
    return this.request<{
      success: boolean;
      message: string;
      tokenId: string;
    }>(`/api/blocknet/manual-tokens/${tokenId}`, {
      method: 'DELETE'
    });
  }

  async toggleManualToken(tokenId: string): Promise<{
    success: boolean;
    message: string;
    tokenId: string;
    isActive: boolean;
  }> {
    return this.request<{
      success: boolean;
      message: string;
      tokenId: string;
      isActive: boolean;
    }>(`/api/blocknet/manual-tokens/${tokenId}/toggle`, {
      method: 'PATCH'
    });
  }

  // Token Logo Management
  async getLogoTokens(): Promise<{
    success: boolean;
    tokens: Array<{
      id: string;
      tokenId: string;
      symbol: string;
      name: string;
      logoUrl: string;
      uploadedAt: string;
    }>;
  }> {
    return this.request<{
      success: boolean;
      tokens: Array<{
        id: string;
        tokenId: string;
        symbol: string;
        name: string;
        logoUrl: string;
        uploadedAt: string;
      }>;
    }>('/api/blocknet/token-logos');
  }

  async uploadTokenLogo(formData: FormData): Promise<{
    success: boolean;
    message: string;
    tokenId: string;
    logoUrl: string;
  }> {
    // Extract tokenId from formData
    const tokenId = formData.get('tokenId') as string;
    if (!tokenId) {
      throw new Error('Token ID is required for logo upload');
    }
    
    return this.request<{
      success: boolean;
      message: string;
      tokenId: string;
      logoUrl: string;
    }>(`/api/blocknet/token-logos/upload/${tokenId}`, {
      method: 'POST',
      body: formData // Don't set Content-Type header for FormData
    });
  }

  async removeTokenLogo(tokenId: string): Promise<{
    success: boolean;
    message: string;
    tokenId: string;
  }> {
    return this.request<{
      success: boolean;
      message: string;
      tokenId: string;
    }>(`/api/blocknet/token-logos/${tokenId}`, {
      method: 'DELETE'
    });
  }
}

// 🆕 SIMPLE TOKEN API FUNCTIONS
export interface SimpleToken {
  id: number;
  uniqueId: string;
  coinGeckoId: string;
  name: string;
  symbol: string;
  description?: string;
  network: string;
  contractAddress?: string;
  category: string;
  priority: number;
  riskLevel: string;
  monitoringStrategy: string;
  isActive: boolean;
  // New fields from comprehensive structure
  website?: string;
  rank?: number;
  holderCount?: number;
  contractScore?: number;
  auditsCount?: number;
  // Related data (will be populated separately)
  socials?: TokenSocial[];
  contracts?: TokenContract[];
  audits?: TokenAudit[];
  auditLinks?: TokenAuditLink[];
  securityScore?: TokenSecurityScore;
  tags?: string[];
  explorers?: TokenExplorer[];
  wallets?: TokenWallet[];
  sourceCode?: TokenSourceCode[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenSocial {
  id?: number; // Optional for creation, required for existing records
  platform: string; // twitter, telegram, discord, reddit, linkedin, website, whitepaper, github, gitlab, etherscan, certik, hacken, slowmist, quantstamp
  url: string;
  isVerified?: boolean;
}

export interface TokenContract {
  id?: number; // Optional for creation, required for existing records
  network: string;
  contractAddress: string;
}

export interface TokenAudit {
  id: number;
  auditorName: string;
  auditDate: string;
  auditType: string;
  score: number;
  reportUrl?: string;
  status: string;
  findingsSummary?: string;
}

export interface TokenAuditLink {
  id?: number; // Optional for creation, required for existing records
  auditName: string;
  auditUrl: string;
  auditType: string;
}

export interface TokenSecurityScore {
  id: number;
  overallScore: number;
  rating: string;
  codeSecurityScore: number;
  marketScore: number;
  governanceScore: number;
  fundamentalScore: number;
  communityScore: number;
  operationalScore: number;
  verifiedCount: number;
  informationalCount: number;
  warningsCount: number;
  criticalCount: number;
}

export interface TokenTag {
  id: number;
  name: string;
  category: string;
  description?: string;
}

export interface TokenExplorer {
  id?: number; // Optional for creation, required for existing records
  explorerName: string;
  explorerUrl: string;
  network: string;
}

export interface TokenWallet {
  id?: number; // Optional for creation, required for existing records
  walletName: string;
  walletUrl: string;
  walletType: string;
  isActive?: boolean;
}

export interface TokenSourceCode {
  id?: number; // Optional for creation, required for existing records
  sourceType: string; // github, gitlab, etherscan, bscscan, etc.
  sourceName: string;
  sourceUrl: string;
  network?: string;
  isVerified?: boolean;
  isActive?: boolean;
}



export interface TokenWithPrice extends SimpleToken {
  price?: number;
  priceChange24h?: number;
  marketCap?: number;
  volume24h?: number;
  lastPriceUpdate?: Date;
}

// Get all tokens
export const getAllTokens = async (): Promise<{ success: boolean; tokens: SimpleToken[]; total: number }> => {
  try {
    console.log('🔍 API_BASE_URL:', API_BASE_URL);
    console.log('🔍 Full URL:', `${API_BASE_URL}/api/simple-tokens`);
    const response = await fetch(`${API_BASE_URL}/api/simple-tokens`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    throw error;
  }
};

// Get all tokens with price data
export const getAllTokensWithPrice = async (): Promise<{ success: boolean; tokens: TokenWithPrice[]; total: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/simple-tokens/with-price`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching tokens with price:', error);
    throw error;
  }
};

// Get token by unique ID
export const getTokenByUniqueId = async (uniqueId: string): Promise<{ success: boolean; token: SimpleToken }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/simple-tokens/${uniqueId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token:', error);
    throw error;
  }
};

// Get token with price data
export const getTokenWithPrice = async (uniqueId: string): Promise<{ success: boolean; token: TokenWithPrice }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/simple-tokens/${uniqueId}/price`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token with price:', error);
    throw error;
  }
};

// Get real-time price data
export const getPriceData = async (tokenId: string, refresh: boolean = false): Promise<{ success: boolean; data: any; message: string; source?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/price-data/${tokenId}?refresh=${refresh}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching price data:', error);
    throw error;
  }
};

// Refresh token price
export const refreshTokenPrice = async (tokenId: string): Promise<{ success: boolean; data: any; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/price-data/${tokenId}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error refreshing price:', error);
    throw error;
  }
};



// Add new token
export const addToken = async (tokenData: {
  uniqueId: string;
  coinGeckoId: string;
  name: string;
  symbol: string;
  description?: string;
  network?: string;
  contractAddress?: string;
  category?: string;
  priority?: number;
  riskLevel?: string;
  monitoringStrategy?: string;
  website?: string;
  rank?: number;
  holderCount?: number;
  contractScore?: number;
  auditsCount?: number;
  socials?: TokenSocial[];
  contracts?: TokenContract[];
  explorers?: TokenExplorer[];
  wallets?: TokenWallet[];
  auditLinks?: TokenAuditLink[];
  sourceCode?: TokenSourceCode[];
  tags?: string[];
}): Promise<{ success: boolean; message: string; token: SimpleToken; error?: string; details?: string[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/simple-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding token:', error);
    throw error;
  }
};

// Update token
export const updateToken = async (uniqueId: string, updates: Partial<SimpleToken>): Promise<{ success: boolean; message: string; token: SimpleToken; error?: string; details?: string[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/simple-tokens/${uniqueId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating token:', error);
    throw error;
  }
};

// Delete token
export const deleteToken = async (uniqueId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/simple-tokens/${uniqueId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting token:', error);
    throw error;
  }
};

// 🆕 GET TOKEN FUNDAMENTAL DATA
export const getTokenFundamentalData = async (tokenId: string): Promise<{
  success: boolean;
  data: {
    supplyMetrics: {
      totalSupply: string;
      circulatingSupply: string;
      maxSupply: string;
      burnedTokens: string;
      circulatingRatio: number;
    };
    distribution: {
      top10Holders: number;
      top50Holders: number;
      top100Holders: number;
      averageHolderBalance: number;
      whaleCount: number;
    };
    liquidity: {
      totalLiquidityUSD: number;
      liquidityPairs: number;
      averageLiquidity: number;
      liquidityHealth: string;
      volume24h: number;
      volumeChange24h: number;
    };
    performance: {
      marketCap: number;
      fullyDilutedValue: number;
      priceToBookRatio: number;
      priceEarningsRatio: number;
      returnOnInvestment: number;
    };
    tokenomics: {
      inflationRate: number;
      stakingAPY: number;
      burningMechanism: boolean;
      transactionTax: number;
      vestingSchedule: any[];
      lockupPeriods: any[];
    };
    utility: {
      useCases: string[];
      ecosystemIntegration: number;
      governanceRights: boolean;
      stakingEnabled: boolean;
      defiIntegration: boolean;
      nftUtility: boolean;
    };
    development: {
      teamSize: number;
      githubActivity: number;
      lastUpdate: string | null;
      roadmapProgress: number;
      partnershipCount: number;
      auditCount: number;
    };
    riskFactors: {
      concentrationRisk: string;
      liquidityRisk: string;
      regulatoryRisk: string;
      technicalRisk: string;
      marketRisk: string;
    };
    healthScore: {
      overall: number;
      supply: number;
      distribution: number;
      liquidity: number;
      utility: number;
      development: number;
    };
    dataSources: string[];
    lastUpdated: string;
  };
  token: {
    id: number;
    uniqueId: string;
    name: string;
    symbol: string;
    network: string;
  };
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/blocknet/tokens/${tokenId}/fundamental`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching fundamental data:', error);
    throw error;
  }
};

export const apiService = new ApiService() 