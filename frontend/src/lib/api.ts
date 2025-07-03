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
  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 3): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    const config: RequestInit = {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    // Remove Content-Type for FormData requests
    if (options.body instanceof FormData) {
      const headers = config.headers as Record<string, string>
      delete headers['Content-Type']
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
    const response = await fetch(url, config)
        
        // Handle CORS preflight
        if (response.status === 0) {
          throw new Error('CORS error - check server configuration')
        }
    
    if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText || `HTTP ${response.status}` }
          }
          throw new Error(errorData.error || `HTTP ${response.status}`)
    }

        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          return response.json()
        } else {
          return response.text() as T
        }
      } catch (error) {
        if (attempt === retries) {
          console.error(`API request failed after ${retries} attempts:`, error)
          throw error
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }

    throw new Error('Request failed after all retries')
  }

  // Authentication
  async registerUser(walletAddress: string): Promise<{ user: User; token: string }> {
    try {
      const result = await this.request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress }),
    })
      
      // Store token if successful
      if (result.token && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', result.token)
      }
      
      return result
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  async getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/profile')
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

  async exportScan(scanId: string, format: 'pdf' | 'csv' | 'json', options?: { includeDetails?: boolean; includeRemediation?: boolean }): Promise<Blob> {
    const params = new URLSearchParams({
      format,
      ...(options?.includeDetails && { includeDetails: 'true' }),
      ...(options?.includeRemediation && { includeRemediation: 'true' }),
    })

    const url = `${API_BASE_URL}/api/scan/${scanId}/export?${params}`
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    return response.blob()
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

  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck()
      return true
    } catch {
      return false
    }
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
    files.forEach((file, index) => {
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