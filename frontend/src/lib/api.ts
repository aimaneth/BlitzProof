const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

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
    
    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`)
    }

    return response.json()
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

  async getUserStats(): Promise<UserStats> {
    return this.request<UserStats>('/api/profile/stats')
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
}

export const apiService = new ApiService() 