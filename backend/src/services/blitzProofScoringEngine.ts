import { BlitzProofDataCollectionService } from './blitzProofDataCollectionService'

interface CategoryScores {
  codeSecurity: number
  market: number
  governance: number
  fundamental: number
  community: number
  operational: number
}

interface ScoringWeights {
  codeSecurity: number
  market: number
  governance: number
  fundamental: number
  community: number
  operational: number
}

interface VulnerabilitySummary {
  verified: number
  informational: number
  warnings: number
  critical: number
}

export class BlitzProofScoringEngine {
  private dataCollectionService: BlitzProofDataCollectionService

  // Scoring weights for each category
  private readonly weights: ScoringWeights = {
    codeSecurity: 0.30, // 30% - Most important
    market: 0.20,       // 20%
    governance: 0.15,   // 15%
    fundamental: 0.15,  // 15%
    community: 0.10,    // 10%
    operational: 0.10   // 10%
  }

  constructor(dataCollectionService: BlitzProofDataCollectionService) {
    this.dataCollectionService = dataCollectionService
  }

  // 🎯 Main scoring method
  async calculateBlitzProofScore(tokenId: string, contractAddress?: string): Promise<{
    overallScore: number
    rating: string
    categories: CategoryScores
    summary: VulnerabilitySummary
  }> {
    try {
      console.log(`🔍 Calculating BlitzProof score for ${tokenId}`)

      // Collect all data
      const [
        marketData,
        securityData,
        governanceData,
        fundamentalData,
        communityData,
        operationalData
      ] = await Promise.all([
        this.dataCollectionService.fetchMarketData(tokenId),
        this.dataCollectionService.fetchSecurityData(contractAddress || tokenId),
        this.dataCollectionService.fetchGovernanceData(tokenId),
        this.dataCollectionService.fetchFundamentalData(tokenId),
        this.dataCollectionService.fetchCommunityData(tokenId),
        this.dataCollectionService.fetchOperationalData(tokenId)
      ])

      // Calculate individual category scores
      const categories: CategoryScores = {
        codeSecurity: this.calculateCodeSecurityScore(securityData),
        market: this.calculateMarketScore(marketData),
        governance: this.calculateGovernanceScore(governanceData),
        fundamental: this.calculateFundamentalScore(fundamentalData),
        community: this.calculateCommunityScore(communityData),
        operational: this.calculateOperationalScore(operationalData)
      }

      // Calculate overall score
      const overallScore = this.calculateOverallScore(categories)

      // Determine rating
      const rating = this.determineRating(overallScore)

      // Calculate vulnerability summary
      const summary = this.calculateVulnerabilitySummary(securityData.vulnerabilities)

      return {
        overallScore,
        rating,
        categories,
        summary
      }
    } catch (error) {
      console.error('Error calculating BlitzProof score:', error)
      throw error
    }
  }

  // 🛡️ Code Security Scoring (30% weight)
  private calculateCodeSecurityScore(securityData: any): number {
    let score = 0

    // Audit status (40% of security score)
    const auditScore = this.calculateAuditScore(securityData.auditStatus, securityData.auditScore)
    score += auditScore * 0.4

    // Vulnerability analysis (35% of security score)
    const vulnerabilityScore = this.calculateVulnerabilityScore(securityData.vulnerabilities)
    score += vulnerabilityScore * 0.35

    // Code quality (15% of security score)
    score += securityData.codeQuality * 0.15

    // Gas optimization (10% of security score)
    score += securityData.gasOptimization * 0.10

    return Math.round(score)
  }

  private calculateAuditScore(auditStatus: string, auditScore: number): number {
    switch (auditStatus) {
      case 'audited':
        return Math.max(80, auditScore) // Minimum 80 for audited contracts
      case 'partially_audited':
        return Math.max(60, auditScore) // Minimum 60 for partially audited
      case 'unaudited':
        return Math.min(40, auditScore) // Maximum 40 for unaudited
      default:
        return 0
    }
  }

  private calculateVulnerabilityScore(vulnerabilities: any[]): number {
    if (vulnerabilities.length === 0) return 100

    let score = 100
    const severityWeights = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3
    }

    vulnerabilities.forEach(vuln => {
      const severity = vuln.severity as 'critical' | 'high' | 'medium' | 'low'
      const weight = severityWeights[severity] || 0
      score -= weight * (vuln.confidence / 100)
    })

    return Math.max(0, score)
  }

  // 🏪 Market Scoring (20% weight)
  private calculateMarketScore(marketData: any): number {
    let score = 0

    // Liquidity score (35% of market score)
    const liquidityScore = this.calculateLiquidityScore(marketData.liquidity, marketData.marketCap)
    score += liquidityScore * 0.35

    // Volume stability (25% of market score)
    const volumeScore = this.calculateVolumeScore(marketData.volume24h, marketData.marketCap)
    score += volumeScore * 0.25

    // Price stability (20% of market score)
    const priceStabilityScore = this.calculatePriceStabilityScore(marketData.priceVolatility)
    score += priceStabilityScore * 0.20

    // Market cap rank (20% of market score)
    const marketCapScore = this.calculateMarketCapScore(marketData.marketCapRank)
    score += marketCapScore * 0.20

    return Math.round(score)
  }

  private calculateLiquidityScore(liquidity: number, marketCap: number): number {
    if (marketCap === 0) return 0
    const liquidityRatio = liquidity / marketCap
    return Math.min(100, liquidityRatio * 1000) // Scale appropriately
  }

  private calculateVolumeScore(volume24h: number, marketCap: number): number {
    if (marketCap === 0) return 0
    const volumeRatio = volume24h / marketCap
    return Math.min(100, volumeRatio * 100)
  }

  private calculatePriceStabilityScore(volatility: number): number {
    // Lower volatility = higher score
    return Math.max(0, 100 - (volatility * 100))
  }

  private calculateMarketCapScore(rank: number): number {
    if (rank <= 10) return 100
    if (rank <= 50) return 90
    if (rank <= 100) return 80
    if (rank <= 500) return 60
    if (rank <= 1000) return 40
    return 20
  }

  // 🏛️ Governance Scoring (15% weight)
  private calculateGovernanceScore(governanceData: any): number {
    let score = 0

    // Voting participation (30% of governance score)
    score += governanceData.votingParticipation * 0.30

    // Power distribution (25% of governance score)
    score += governanceData.powerDistribution * 0.25

    // Multi-sig and timelock (25% of governance score)
    const securityMeasuresScore = this.calculateSecurityMeasuresScore(governanceData)
    score += securityMeasuresScore * 0.25

    // Treasury value (20% of governance score)
    const treasuryScore = this.calculateTreasuryScore(governanceData.treasuryValue)
    score += treasuryScore * 0.20

    return Math.round(score)
  }

  private calculateSecurityMeasuresScore(governanceData: any): number {
    let score = 0
    if (governanceData.hasMultiSig) score += 50
    if (governanceData.hasTimelock) score += 50
    return score
  }

  private calculateTreasuryScore(treasuryValue: number): number {
    if (treasuryValue > 10000000) return 100 // $10M+
    if (treasuryValue > 1000000) return 80   // $1M+
    if (treasuryValue > 100000) return 60    // $100K+
    if (treasuryValue > 10000) return 40     // $10K+
    return 20
  }

  // 📊 Fundamental Scoring (15% weight)
  private calculateFundamentalScore(fundamentalData: any): number {
    let score = 0

    // Tokenomics health (30% of fundamental score)
    score += fundamentalData.tokenomicsHealth * 0.30

    // Team credibility (25% of fundamental score)
    score += fundamentalData.teamCredibility * 0.25

    // Partnership strength (20% of fundamental score)
    const partnershipScore = this.calculatePartnershipScore(fundamentalData.partnershipCount)
    score += partnershipScore * 0.20

    // Utility and adoption (15% of fundamental score)
    score += fundamentalData.utilityScore * 0.15

    // Roadmap progress (10% of fundamental score)
    score += fundamentalData.roadmapProgress * 0.10

    return Math.round(score)
  }

  private calculatePartnershipScore(partnershipCount: number): number {
    if (partnershipCount >= 10) return 100
    if (partnershipCount >= 5) return 80
    if (partnershipCount >= 3) return 60
    if (partnershipCount >= 1) return 40
    return 20
  }

  // 👥 Community Scoring (10% weight)
  private calculateCommunityScore(communityData: any): number {
    let score = 0

    // Social engagement (30% of community score)
    score += communityData.socialEngagement * 0.30

    // Community size (25% of community score)
    const communitySizeScore = this.calculateCommunitySizeScore(communityData)
    score += communitySizeScore * 0.25

    // Developer activity (25% of community score)
    const developerScore = this.calculateDeveloperScore(communityData.githubContributors)
    score += developerScore * 0.25

    // Documentation quality (20% of community score)
    score += communityData.documentationQuality * 0.20

    return Math.round(score)
  }

  private calculateCommunitySizeScore(communityData: any): number {
    const totalMembers = 
      communityData.twitterFollowers + 
      communityData.telegramMembers + 
      communityData.discordMembers

    if (totalMembers > 1000000) return 100 // 1M+
    if (totalMembers > 100000) return 80   // 100K+
    if (totalMembers > 10000) return 60    // 10K+
    if (totalMembers > 1000) return 40     // 1K+
    return 20
  }

  private calculateDeveloperScore(contributors: number): number {
    if (contributors >= 50) return 100
    if (contributors >= 20) return 80
    if (contributors >= 10) return 60
    if (contributors >= 5) return 40
    if (contributors >= 1) return 20
    return 0
  }

  // ⚙️ Operational Scoring (10% weight)
  private calculateOperationalScore(operationalData: any): number {
    let score = 0

    // Uptime (30% of operational score)
    score += operationalData.uptime * 0.30

    // Transaction speed (25% of operational score)
    const transactionScore = this.calculateTransactionScore(operationalData.transactionSpeed)
    score += transactionScore * 0.25

    // Network security (25% of operational score)
    score += operationalData.networkSecurity * 0.25

    // Infrastructure capabilities (20% of operational score)
    const infrastructureScore = this.calculateInfrastructureScore(operationalData)
    score += infrastructureScore * 0.20

    return Math.round(score)
  }

  private calculateTransactionScore(avgTime: number): number {
    if (avgTime <= 5) return 100   // < 5 seconds
    if (avgTime <= 15) return 80   // < 15 seconds
    if (avgTime <= 30) return 60   // < 30 seconds
    if (avgTime <= 60) return 40   // < 1 minute
    return 20
  }

  private calculateInfrastructureScore(operationalData: any): number {
    let score = 0
    score += operationalData.upgradeCapability
    if (operationalData.emergencyProcedures) score += 20
    return Math.min(100, score)
  }

  // 🎯 Overall Score Calculation
  private calculateOverallScore(categories: CategoryScores): number {
    return Math.round(
      categories.codeSecurity * this.weights.codeSecurity +
      categories.market * this.weights.market +
      categories.governance * this.weights.governance +
      categories.fundamental * this.weights.fundamental +
      categories.community * this.weights.community +
      categories.operational * this.weights.operational
    )
  }

  // 📊 Rating Determination
  private determineRating(score: number): string {
    if (score >= 90) return 'AAA'
    if (score >= 80) return 'AA'
    if (score >= 70) return 'A'
    if (score >= 60) return 'BBB'
    if (score >= 50) return 'BB'
    if (score >= 40) return 'B'
    if (score >= 30) return 'CCC'
    if (score >= 20) return 'CC'
    if (score >= 10) return 'C'
    return 'D'
  }

  // 📋 Vulnerability Summary
  private calculateVulnerabilitySummary(vulnerabilities: any[]): VulnerabilitySummary {
    const summary = {
      verified: 0,
      informational: 0,
      warnings: 0,
      critical: 0
    }

    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          summary.critical++
          break
        case 'high':
          summary.warnings++
          break
        case 'medium':
          summary.informational++
          break
        case 'low':
          summary.verified++
          break
      }
    })

    return summary
  }

  // 🔄 Score Update Method
  async updateScore(tokenId: string, contractAddress?: string): Promise<any> {
    const scoreData = await this.calculateBlitzProofScore(tokenId, contractAddress)
    
    // Here you would save to database
    // await this.saveScoreToDatabase(tokenId, scoreData)
    
    return scoreData
  }
}
