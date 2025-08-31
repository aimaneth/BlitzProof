import axios from 'axios'
import { ethers } from 'ethers'

interface SecurityVulnerability {
  id: string
  type: 'reentrancy' | 'overflow' | 'access_control' | 'logic_error' | 'gas_optimization' | 'front_running' | 'price_manipulation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: string
  recommendation: string
  detectedAt: Date
  status: 'active' | 'fixed' | 'investigating'
  cweId?: string
  references?: string[]
}

interface SecurityScore {
  overall: number
  categories: {
    accessControl: number
    arithmetic: number
    reentrancy: number
    gasOptimization: number
    logic: number
    external: number
  }
  lastUpdated: Date
  confidence: number
}

interface TokenSecurityData {
  tokenAddress: string
  network: string
  contractAddress?: string
  securityScore: SecurityScore
  vulnerabilities: SecurityVulnerability[]
  auditStatus: 'audited' | 'unaudited' | 'partially_audited'
  auditReports?: {
    auditor: string
    date: Date
    score: number
    findings: number
    critical: number
    high: number
    medium: number
    low: number
    url?: string
  }[]
  holderAnalysis: {
    totalHolders: number
    top10Percentage: number
    top50Percentage: number
    concentrationRisk: 'low' | 'medium' | 'high' | 'critical'
  }
  liquidityAnalysis: {
    totalLiquidity: number
    liquidityDistribution: {
      dex: string
      liquidity: number
      percentage: number
    }[]
    liquidityRisk: 'low' | 'medium' | 'high' | 'critical'
  }
  transactionAnalysis: {
    totalTransactions: number
    averageTransactionSize: number
    suspiciousTransactions: number
    riskScore: number
  }
  lastUpdated: Date
}

class SecurityAnalysisService {
  private etherscanApiKey: string
  private provider: ethers.JsonRpcProvider

  constructor() {
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || ''
    this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id')
  }

  async analyzeTokenSecurity(tokenAddress: string, network: string = 'ethereum'): Promise<TokenSecurityData> {
    try {
      console.log(`🔍 Analyzing security for token: ${tokenAddress} on ${network}`)

      // Get contract source code and ABI
      const contractInfo = await this.getContractInfo(tokenAddress)
      
      // Analyze vulnerabilities
      const vulnerabilities = await this.analyzeVulnerabilities(tokenAddress, contractInfo)
      
      // Calculate security score
      const securityScore = this.calculateSecurityScore(vulnerabilities, contractInfo)
      
      // Analyze holder distribution
      const holderAnalysis = await this.analyzeHolderDistribution(tokenAddress)
      
      // Analyze liquidity
      const liquidityAnalysis = await this.analyzeLiquidity(tokenAddress)
      
      // Analyze transactions
      const transactionAnalysis = await this.analyzeTransactions(tokenAddress)
      
      // Get audit information
      const auditInfo = await this.getAuditStatus(tokenAddress)

      return {
        tokenAddress,
        network,
        contractAddress: contractInfo.address,
        securityScore,
        vulnerabilities,
        auditStatus: auditInfo.status,
        auditReports: auditInfo.reports,
        holderAnalysis,
        liquidityAnalysis,
        transactionAnalysis,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Security analysis failed:', error)
      throw new Error(`Failed to analyze token security: ${error}`)
    }
  }

  private async getContractInfo(address: string) {
    try {
      const response = await axios.get(`https://api.etherscan.io/api`, {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address: address,
          apikey: this.etherscanApiKey
        }
      })

      const data = response.data as any
      if (data.status === '1' && data.result[0]) {
        const contract = data.result[0]
        return {
          address: contract.ContractAddress,
          name: contract.ContractName,
          sourceCode: contract.SourceCode,
          abi: contract.ABI,
          compilerVersion: contract.CompilerVersion,
          optimizationUsed: contract.OptimizationUsed,
          runs: contract.Runs,
          constructorArguments: contract.ConstructorArguments,
          evmVersion: contract.EVMVersion,
          library: contract.Library,
          licenseType: contract.LicenseType,
          proxy: contract.Proxy,
          implementation: contract.Implementation,
          swarmSource: contract.SwarmSource
        }
      }
      
      return {
        address,
        sourceCode: '',
        abi: '',
        proxy: '0'
      }
    } catch (error) {
      console.error('Failed to get contract info:', error)
      return {
        address,
        sourceCode: '',
        abi: '',
        proxy: '0'
      }
    }
  }

  private async analyzeVulnerabilities(address: string, contractInfo: any): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = []
    
    try {
      // Basic vulnerability checks based on contract characteristics
      if (contractInfo.sourceCode) {
        // Check for common vulnerabilities in source code
        const sourceCode = contractInfo.sourceCode.toLowerCase()
        
        // Reentrancy vulnerability check
        if (sourceCode.includes('call.value') || sourceCode.includes('transfer')) {
          if (!sourceCode.includes('reentrancyguard') && !sourceCode.includes('checks-effects-interactions')) {
            vulnerabilities.push({
              id: `reentrancy-${address}`,
              type: 'reentrancy',
              severity: 'high',
              description: 'Potential reentrancy vulnerability detected. Contract may be vulnerable to reentrancy attacks.',
              impact: 'Attackers could drain funds or manipulate contract state',
              recommendation: 'Implement reentrancy guard or follow checks-effects-interactions pattern',
              detectedAt: new Date(),
              status: 'active',
              cweId: 'CWE-841',
              references: ['https://swcregistry.io/docs/SWC-107']
            })
          }
        }

        // Access control vulnerability check
        if (sourceCode.includes('onlyowner') || sourceCode.includes('onlyadmin')) {
          if (!sourceCode.includes('renounceownership') && !sourceCode.includes('transferownership')) {
            vulnerabilities.push({
              id: `access-control-${address}`,
              type: 'access_control',
              severity: 'medium',
              description: 'Access control functions detected but no ownership transfer mechanism found',
              impact: 'Contract may have permanently locked ownership',
              recommendation: 'Implement proper ownership transfer mechanism',
              detectedAt: new Date(),
              status: 'active',
              cweId: 'CWE-285'
            })
          }
        }

        // Integer overflow check (for older Solidity versions)
        if (contractInfo.compilerVersion && contractInfo.compilerVersion.includes('0.8')) {
          // Solidity 0.8+ has built-in overflow protection
        } else if (sourceCode.includes('uint') || sourceCode.includes('int')) {
          if (!sourceCode.includes('safemath') && !sourceCode.includes('openzeppelin')) {
            vulnerabilities.push({
              id: `overflow-${address}`,
              type: 'overflow',
              severity: 'medium',
              description: 'Potential integer overflow vulnerability. Contract uses older Solidity version without built-in overflow protection',
              impact: 'Arithmetic operations may overflow and cause unexpected behavior',
              recommendation: 'Upgrade to Solidity 0.8+ or use SafeMath library',
              detectedAt: new Date(),
              status: 'active',
              cweId: 'CWE-190'
            })
          }
        }
      }

      // Check for proxy contracts
      if (contractInfo.proxy === '1') {
        vulnerabilities.push({
          id: `proxy-${address}`,
          type: 'logic_error',
          severity: 'low',
          description: 'Contract is a proxy contract. Ensure proper implementation and upgrade mechanisms',
          impact: 'Proxy contracts have additional attack vectors',
          recommendation: 'Verify proxy implementation and upgrade mechanisms',
          detectedAt: new Date(),
          status: 'active'
        })
      }

      // Check for unverified contracts
      if (!contractInfo.sourceCode || contractInfo.sourceCode === '') {
        vulnerabilities.push({
          id: `unverified-${address}`,
          type: 'access_control',
          severity: 'high',
          description: 'Contract source code is not verified on Etherscan',
          impact: 'Cannot audit contract security without source code',
          recommendation: 'Request contract verification or avoid interaction',
          detectedAt: new Date(),
          status: 'active'
        })
      }

    } catch (error) {
      console.error('Vulnerability analysis failed:', error)
    }

    return vulnerabilities
  }

  private calculateSecurityScore(vulnerabilities: SecurityVulnerability[], contractInfo: any): SecurityScore {
    let baseScore = 100
    
    // Deduct points for vulnerabilities
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          baseScore -= 30
          break
        case 'high':
          baseScore -= 20
          break
        case 'medium':
          baseScore -= 10
          break
        case 'low':
          baseScore -= 5
          break
      }
    })

    // Bonus points for good practices
    if (contractInfo.sourceCode && contractInfo.sourceCode.includes('openzeppelin')) {
      baseScore += 10
    }
    
    if (contractInfo.compilerVersion && contractInfo.compilerVersion.includes('0.8')) {
      baseScore += 5
    }

    // Ensure score is within bounds
    baseScore = Math.max(0, Math.min(100, baseScore))

    return {
      overall: Math.round(baseScore),
      categories: {
        accessControl: this.calculateCategoryScore(vulnerabilities, 'access_control'),
        arithmetic: this.calculateCategoryScore(vulnerabilities, 'overflow'),
        reentrancy: this.calculateCategoryScore(vulnerabilities, 'reentrancy'),
        gasOptimization: this.calculateCategoryScore(vulnerabilities, 'gas_optimization'),
        logic: this.calculateCategoryScore(vulnerabilities, 'logic_error'),
        external: this.calculateCategoryScore(vulnerabilities, 'front_running')
      },
      lastUpdated: new Date(),
      confidence: this.calculateConfidence(vulnerabilities, contractInfo)
    }
  }

  private calculateCategoryScore(vulnerabilities: SecurityVulnerability[], category: string): number {
    const categoryVulns = vulnerabilities.filter(v => v.type === category)
    let score = 100
    
    categoryVulns.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          score -= 40
          break
        case 'high':
          score -= 25
          break
        case 'medium':
          score -= 15
          break
        case 'low':
          score -= 8
          break
      }
    })

    return Math.max(0, Math.min(100, score))
  }

  private calculateConfidence(vulnerabilities: SecurityVulnerability[], contractInfo: any): number {
    let confidence = 50 // Base confidence

    // Increase confidence if source code is available
    if (contractInfo.sourceCode && contractInfo.sourceCode.length > 0) {
      confidence += 30
    }

    // Increase confidence if contract is verified
    if (contractInfo.ContractName) {
      confidence += 10
    }

    // Decrease confidence for proxy contracts
    if (contractInfo.proxy === '1') {
      confidence -= 10
    }

    // Increase confidence with more analysis
    if (vulnerabilities.length > 0) {
      confidence += 10
    }

    return Math.max(0, Math.min(100, confidence))
  }

  private async analyzeHolderDistribution(address: string) {
    try {
      // This would require additional API calls to get holder data
      // For now, return placeholder data
      return {
        totalHolders: 0,
        top10Percentage: 0,
        top50Percentage: 0,
        concentrationRisk: 'low' as const
      }
    } catch (error) {
      console.error('Holder analysis failed:', error)
      return {
        totalHolders: 0,
        top10Percentage: 0,
        top50Percentage: 0,
        concentrationRisk: 'low' as const
      }
    }
  }

  private async analyzeLiquidity(address: string) {
    try {
      // This would integrate with DEX APIs to get liquidity data
      return {
        totalLiquidity: 0,
        liquidityDistribution: [],
        liquidityRisk: 'low' as const
      }
    } catch (error) {
      console.error('Liquidity analysis failed:', error)
      return {
        totalLiquidity: 0,
        liquidityDistribution: [],
        liquidityRisk: 'low' as const
      }
    }
  }

  private async analyzeTransactions(address: string) {
    try {
      // This would analyze recent transactions for suspicious patterns
      return {
        totalTransactions: 0,
        averageTransactionSize: 0,
        suspiciousTransactions: 0,
        riskScore: 0
      }
    } catch (error) {
      console.error('Transaction analysis failed:', error)
      return {
        totalTransactions: 0,
        averageTransactionSize: 0,
        suspiciousTransactions: 0,
        riskScore: 0
      }
    }
  }

  private async getAuditStatus(address: string) {
    try {
      // This would check various audit databases
      return {
        status: 'unaudited' as const,
        reports: []
      }
    } catch (error) {
      console.error('Audit status check failed:', error)
      return {
        status: 'unaudited' as const,
        reports: []
      }
    }
  }

  async getSecurityAlerts(tokenAddress: string): Promise<any[]> {
    try {
      const securityData = await this.analyzeTokenSecurity(tokenAddress)
      const alerts = []

      // Generate alerts based on security analysis
      securityData.vulnerabilities.forEach(vuln => {
        if (vuln.severity === 'critical' || vuln.severity === 'high') {
          alerts.push({
            id: `security-${vuln.id}`,
            type: 'security_alert',
            severity: vuln.severity,
            title: `Security Vulnerability: ${vuln.type}`,
            description: vuln.description,
            tokenAddress,
            timestamp: new Date(),
            data: vuln
          })
        }
      })

      // Alert for low security score
      if (securityData.securityScore.overall < 50) {
        alerts.push({
          id: `score-${tokenAddress}`,
          type: 'security_alert',
          severity: 'high',
          title: 'Low Security Score',
          description: `Token has a low security score of ${securityData.securityScore.overall}/100`,
          tokenAddress,
          timestamp: new Date(),
          data: { score: securityData.securityScore.overall }
        })
      }

      return alerts
    } catch (error) {
      console.error('Failed to get security alerts:', error)
      return []
    }
  }
}

export default new SecurityAnalysisService()
