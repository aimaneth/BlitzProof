'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info,
  Target,
  Star,
  ExternalLink,
  Copy,
  FileText,
  Users,
  Globe,
  Activity,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Twitter,
  MessageCircle,
  Github
} from 'lucide-react'
import { useState } from 'react'

interface SecuritySidebarProps {
  token: {
    name: string
    symbol: string
    price: number
    priceChange24h: number
    marketCap: number
    volume24h: number
    rank: number
    contractAddress: string
    website: string
    audits: string
    tags: string[]
    network?: string
    contracts?: Array<{
      network: string
      contractAddress: string
    }>
    explorers?: Array<{
      explorerName: string
      explorerUrl: string
      network: string
    }>
    wallets?: Array<{
      walletName: string
      walletUrl: string
      walletType: string
    }>
    sourceCode?: Array<{
      sourceType: string
      sourceName: string
      sourceUrl: string
      network?: string
    }>
    auditLinks?: Array<{
      auditName: string
      auditUrl: string
      auditType: string
    }>
    socials: {
      twitter?: string
      telegram?: string
      discord?: string
      github?: string
      linkedin?: string
      medium?: string
      website?: string
      whitepaper?: string
      gitlab?: string
      etherscan?: string
    } | Array<{
      platform: string
      url: string
    }>
    description: string
    verification: {
      certikAudit: boolean
      teamVerification: boolean
      bugBounty: boolean
      verifiedContract: boolean
    }
  }
  securityScore: {
    overallScore: number
    rating: string
    isPartialRating: boolean
    categories: {
      codeSecurity: number
      market: number
      governance: number
      fundamental: number
      community: number
      operational: number
    }
    summary: {
      verified: number
      informational: number
      warnings: number
      critical: number
    }
  }
  userRating: {
    score: number
    totalRatings: number
    recentRatings: Array<{
      user: string
      platform: string
      rating: number
    }>
  }
  pulseFeed: Array<{
    timestamp: string
    event: string
  }>
}

export default function SecuritySidebar({ 
  token, 
  securityScore, 
  userRating, 
  pulseFeed 
}: SecuritySidebarProps) {
  const [isContractsExpanded, setIsContractsExpanded] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const getNetworkIcon = (network: string) => {
    const networkLower = network.toLowerCase()
    
    // Map network names to their logo files
    const networkLogos: { [key: string]: string } = {
      'ethereum': '/networks/ethereum.png',
      'bsc': '/networks/bsc.png',
      'polygon': '/networks/polygon.png',
      'arbitrum': '/networks/arbitrum.png',
      'optimism': '/networks/optimism.png',
      'avalanche': '/networks/avalanche.png',
      'fantom': '/networks/fantom.png',
      'cronos': '/networks/cronos.png',
      'harmony': '/networks/harmony.png',
      'base': '/networks/base.png',
      'linea': '/networks/linea.png',
      'scroll': '/networks/scroll.png',
      'zksync': '/networks/zksync.png',
      'mantle': '/networks/mantle.png',
      'moonbeam': '/networks/moonbeam.png',
      'gnosis': '/networks/gnosis.png',
      'celo': '/networks/celo.png',
      'klaytn': '/networks/klaytn.png',
      'metis': '/networks/metis.png',
      'boba': '/networks/boba.png'
    }
    
    return networkLogos[networkLower] || '/networks/ethereum.png'
  }

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return <Twitter className="h-3 w-3" />
      case 'telegram':
        return <MessageCircle className="h-3 w-3" />
      case 'discord':
        return <MessageCircle className="h-3 w-3" />
      case 'github':
        return <Github className="h-3 w-3" />
      case 'gitlab':
        return <Github className="h-3 w-3" /> // Using GitHub icon for GitLab (similar)
      case 'etherscan':
        return <FileText className="h-3 w-3" />
      case 'linkedin':
        return <Users className="h-3 w-3" />
      case 'medium':
        return <FileText className="h-3 w-3" />
      case 'reddit':
        return <MessageCircle className="h-3 w-3" />
      case 'whitepaper':
        return <FileText className="h-3 w-3" />
      default:
        return <ExternalLink className="h-3 w-3" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 80) return 'text-blue-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'AA': return 'bg-green-600/20 text-green-400 border-green-500/30'
      case 'A': return 'bg-green-600/20 text-green-400 border-green-500/30'
      case 'B': return 'bg-blue-600/20 text-blue-400 border-blue-500/30'
      case 'C': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
      case 'D': return 'bg-orange-600/20 text-orange-400 border-orange-500/30'
      case 'F': return 'bg-red-600/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-600/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 5
    }).format(price)
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`
    return `$${marketCap.toFixed(2)}`
  }

  const formatTag = (tag: string) => {
    // Handle special cases for better formatting
    const specialCases: { [key: string]: string } = {
      'DEFI': 'DeFi',
      'DEX': 'DEX',
      'CEX': 'CEX',
      'NFT': 'NFT',
      'STABLECOIN': 'Stablecoin',
      'AI': 'AI',
      'LAYER_1': 'Layer 1',
      'LAYER_2': 'Layer 2',
      'SOCIAL_FI': 'SocialFi',
      'PLAY_TO_EARN': 'Play to Earn',
      'VIRTUAL_REALITY': 'Virtual Reality',
      'GAMING_GUILDS': 'Gaming Guilds',
      'ZERO_KNOWLEDGE': 'Zero Knowledge',
      'ARTIFICIAL_INTELLIGENCE': 'Artificial Intelligence',
      'MACHINE_LEARNING': 'Machine Learning',
      'DATA_ANALYTICS': 'Data Analytics',
      'PREDICTION_MARKETS': 'Prediction Markets',
      'YIELD_FARMING': 'Yield Farming',
      'CREATOR_ECONOMY': 'Creator Economy',
      'CONTENT_CREATION': 'Content Creation',
      'COMMUNITY_DRIVEN': 'Community Driven'
    }
    
    // Check if we have a special case
    if (specialCases[tag]) {
      return specialCases[tag]
    }
    
    // Default formatting for underscore-separated words
    return tag
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className="w-full lg:w-80 bg-gradient-to-b from-[#0F1011] to-[#0A0B0C] border-l border-gray-800 flex flex-col h-full overflow-y-auto">
      <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
        


        {/* Security Score */}
        <div className="space-y-3 -mx-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-white font-semibold text-sm lg:text-base">Security Score</h3>
            </div>
            {securityScore.isPartialRating && (
              <Badge className="bg-gray-600/20 text-gray-400 border-gray-500/30 text-xs flex items-center gap-1">
                <Info className="h-3 w-3" />
                Partial Rating
              </Badge>
            )}
          </div>
          
          {/* Score and Chart - Centered Layout */}
          <div className="text-center space-y-3">
            {/* Score Display - Above Chart */}
            <div className="space-y-1">
              <div className={`text-2xl lg:text-3xl font-bold ${getScoreColor(securityScore.overallScore)}`}>
                {securityScore.overallScore.toFixed(2)}
              </div>
              <Badge className={`${getRatingColor(securityScore.rating)} text-xs px-2 py-0.5`}>
                {securityScore.rating}
              </Badge>
            </div>
            
            {/* Hexagonal Radar Chart - Clean and Proper */}
            <div className="flex justify-center">
              <div className="relative w-56 h-52 lg:w-60 lg:h-56">
                <svg className="w-56 h-52 lg:w-60 lg:h-56" viewBox="0 0 120 140" preserveAspectRatio="xMidYMid meet">
                  {/* Multiple grid hexagons for proper depth */}
                  <polygon
                    points="60,15 100,40 100,80 60,105 20,80 20,40"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="0.5"
                    opacity="0.2"
                  />
                  <polygon
                    points="60,20 95,42 95,78 60,100 25,78 25,42"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                  <polygon
                    points="60,25 90,45 90,75 60,95 30,75 30,45"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                  
                  {/* Data polygon - properly shaped hexagon */}
                  <polygon
                    points="60,30 85,48 85,72 60,90 35,72 35,48"
                    fill="rgba(34, 197, 94, 0.15)"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                  
                  {/* Category labels - positioned at hexagonal vertices */}
                  <text x="60" y="8" textAnchor="middle" className="text-xs fill-gray-400" style={{ fontSize: '7px' }}>Code Security</text>
                  <text x="115" y="40" textAnchor="middle" className="text-xs fill-gray-400" style={{ fontSize: '7px' }}>Market</text>
                  <text x="115" y="85" textAnchor="middle" className="text-xs fill-gray-400" style={{ fontSize: '7px' }}>Operational</text>
                  <text x="60" y="112" textAnchor="middle" className="text-xs fill-gray-400" style={{ fontSize: '7px' }}>Governance</text>
                  <text x="12" y="85" textAnchor="middle" className="text-xs fill-gray-400" style={{ fontSize: '7px' }}>Fundamental</text>
                  <text x="5" y="40" textAnchor="middle" className="text-xs fill-gray-400" style={{ fontSize: '7px' }}>Community</text>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Category Scores - Minimal */}
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(securityScore.categories).map(([category, score]) => (
              <div key={category} className="flex justify-between items-center p-1">
                <span className="text-gray-300 text-xs capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={`text-xs font-medium ${getScoreColor(score)}`}>
                  {score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          
          {/* Issue Badges - Minimal */}
          <div className="flex gap-1 flex-wrap">
            <div className="flex items-center gap-1 bg-green-600/20 rounded px-1 py-0.5">
              <Shield className="h-2 w-2 text-green-400" />
              <span className="text-green-400 text-xs">{securityScore.summary.verified}</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-600/20 rounded px-1 py-0.5">
              <Info className="h-2 w-2 text-blue-400" />
              <span className="text-blue-400 text-xs">{securityScore.summary.informational}</span>
            </div>
            <div className="flex items-center gap-1 bg-yellow-600/20 rounded px-1 py-0.5">
              <AlertTriangle className="h-2 w-2 text-yellow-400" />
              <span className="text-yellow-400 text-xs">{securityScore.summary.warnings}</span>
            </div>
            <div className="flex items-center gap-1 bg-red-600/20 rounded px-1 py-0.5">
              <XCircle className="h-2 w-2 text-red-400" />
              <span className="text-red-400 text-xs">{securityScore.summary.critical}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800/50 -mx-4 lg:-mx-6"></div>

        {/* Token Info - Compact */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm lg:text-base">{token.name} Info</h3>
          
          <div className="space-y-2">
            
            {/* Website Links */}
            {(() => {
              // Handle both old string format and new array format
              let websiteUrl = ''
              if (typeof token.socials === 'object' && !Array.isArray(token.socials)) {
                websiteUrl = token.socials.website || token.website || ''
              } else if (Array.isArray(token.socials)) {
                const websiteSocial = token.socials.find(s => s.platform === 'website')
                websiteUrl = websiteSocial?.url || token.website || ''
              } else {
                websiteUrl = token.website || ''
              }
              
              // Only show if there's actual data, not empty or example URLs
              if (!websiteUrl || websiteUrl === 'https://example.com' || websiteUrl.trim() === '') return null
              
              return (
                <div className="space-y-1">
                  <span className="text-gray-400 text-xs">Website</span>
                  <div className="flex gap-1 flex-wrap">
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded transition-all duration-200 flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      <span className="text-xs font-medium">{websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')}</span>
                    </a>
                  </div>
                </div>
              )
            })()}
            
            {/* Only show contract section if contracts exist with valid addresses */}
            {token.contracts && token.contracts.length > 0 && token.contracts.some(contract => 
              contract.contractAddress && 
              contract.contractAddress.trim() !== '' && 
              contract.contractAddress !== '0x0000000000000000000000000000000000000000'
            ) && (
              <div className="space-y-1">
                {(() => {
                  // Filter out invalid/empty contract addresses
                  const validContracts = token.contracts!.filter(contract => 
                    contract.contractAddress && 
                    contract.contractAddress.trim() !== '' && 
                    contract.contractAddress !== '0x0000000000000000000000000000000000000000'
                  )
                  
                  return (
                    <>
                      <span className="text-gray-400 text-xs">Contract{validContracts.length > 1 ? 's' : ''}</span>
                      
                      {/* Single contract or dropdown trigger */}
                      {validContracts.length === 1 ? (
                        <div className="flex gap-1 flex-wrap">
                          <div className="inline-flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded transition-all duration-200">
                            <img src={getNetworkIcon(validContracts[0].network)} alt={validContracts[0].network} className="w-4 h-4 rounded-full" />
                            <span className="font-mono text-xs">
                              {validContracts[0].contractAddress.slice(0, 6)}...{validContracts[0].contractAddress.slice(-6)}
                            </span>
                            <Copy 
                              className="h-3 w-3 text-blue-400 hover:text-blue-300 cursor-pointer flex-shrink-0 transition-all duration-200 hover:scale-110" 
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(validContracts[0].contractAddress);
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Main contract display */}
                          <div className="flex gap-1 flex-wrap">
                            <div className="inline-flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded transition-all duration-200">
                              <img src={getNetworkIcon(validContracts[0].network)} alt={validContracts[0].network} className="w-4 h-4 rounded-full" />
                              <span className="font-mono text-xs">
                                {validContracts[0].contractAddress.slice(0, 6)}...{validContracts[0].contractAddress.slice(-6)}
                              </span>
                              <Copy 
                                className="h-3 w-3 text-blue-400 hover:text-blue-300 cursor-pointer flex-shrink-0 transition-all duration-200 hover:scale-110" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(validContracts[0].contractAddress);
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* Dropdown trigger */}
                          <button
                            onClick={() => setIsContractsExpanded(!isContractsExpanded)}
                            className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors duration-200"
                          >
                            <span>Show {validContracts.length - 1} more contract{validContracts.length > 2 ? 's' : ''}</span>
                            {isContractsExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                          
                          {/* Dropdown content */}
                          {isContractsExpanded && (
                            <div className="space-y-2 pl-2 border-l border-gray-700">
                              {validContracts.slice(1).map((contract, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex gap-1 flex-wrap">
                                    <div className="inline-flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded transition-all duration-200">
                                      <img src={getNetworkIcon(contract.network)} alt={contract.network} className="w-4 h-4 rounded-full" />
                                      <span className="font-mono text-xs">
                                        {contract.contractAddress.slice(0, 6)}...{contract.contractAddress.slice(-6)}
                                      </span>
                                      <Copy 
                                        className="h-3 w-3 text-blue-400 hover:text-blue-300 cursor-pointer flex-shrink-0 transition-all duration-200 hover:scale-110" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyToClipboard(contract.contractAddress);
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}

            {/* Explorers */}
            {token.explorers && token.explorers.length > 0 && (
              <div className="space-y-1">
                <span className="text-gray-400 text-xs">Explorers</span>
                <div className="flex gap-1 flex-wrap">
                  {token.explorers.map((explorer, index) => (
                    <a
                      key={index}
                      href={explorer.explorerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-block bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded transition-all duration-200"
                    >
                      {explorer.explorerName}
                    </a>
                  ))}
                </div>
              </div>
            )}

          {/* Social Links - Community */}
          {(() => {
            const communityPlatforms = ['twitter', 'telegram', 'discord', 'reddit', 'linkedin', 'medium', 'whitepaper']
            let validSocials: Array<[string, string]> = []
            
            // Handle both old object format and new array format
            if (Array.isArray(token.socials)) {
              validSocials = token.socials
                .filter(social => 
                  communityPlatforms.includes(social.platform) && 
                  social.url && 
                  social.url.trim() && 
                  social.url !== 'https://example.com'
                )
                .map(social => [social.platform, social.url])
            } else if (typeof token.socials === 'object' && token.socials) {
              validSocials = Object.entries(token.socials).filter(([platform, url]) => 
                communityPlatforms.includes(platform) && url && url !== 'https://example.com'
              )
            }
            
            // Only show if there's actual data, not empty or example URLs
            if (validSocials.length === 0) return null
            
            return (
              <div className="space-y-1">
                <span className="text-gray-400 text-xs">Community</span>
                <div className="flex gap-1 flex-wrap">
                  {validSocials.map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded transition-all duration-200 flex items-center gap-1"
                    >
                      {getSocialIcon(platform)}
                      <span className="text-xs font-medium capitalize">{platform}</span>
                    </a>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Wallet Support */}
          {token.wallets && token.wallets.length > 0 && (
            <div className="space-y-1">
              <span className="text-gray-400 text-xs">Wallets</span>
              <div className="flex gap-1 flex-wrap">
                {token.wallets.map((wallet, index) => (
                  <a
                    key={index}
                    href={wallet.walletUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded transition-all duration-200"
                  >
                    {wallet.walletName}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Source Code Links - Only show actual database entries */}
          {token.sourceCode && token.sourceCode.length > 0 && (() => {
            const validSourceCode = token.sourceCode.filter(source => 
              source.sourceUrl && source.sourceUrl.trim()
            )
            
            if (validSourceCode.length === 0) return null
            
            return (
              <div className="space-y-1">
                <span className="text-gray-400 text-xs">Source Code</span>
                <div className="flex gap-1 flex-wrap">
                  {validSourceCode.map((source, index) => (
                    <a
                      key={index}
                      href={source.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded transition-all duration-200 flex items-center gap-1"
                    >
                      {getSocialIcon(source.sourceType)}
                      <span className="text-xs font-medium">{source.sourceName}</span>
                    </a>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Audit Links */}
          {(() => {
            const validAuditLinks = token.auditLinks?.filter(audit => 
              audit.auditUrl && audit.auditUrl.trim()
            ) || []
            
            // Only show if there's actual data
            if (validAuditLinks.length === 0) return null
            
            return (
              <div className="space-y-1">
                <span className="text-gray-400 text-xs">Audit Reports</span>
                <div className="flex gap-1 flex-wrap">
                  {validAuditLinks.map((audit, index) => (
                    <a
                      key={index}
                      href={audit.auditUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded transition-all duration-200 flex items-center gap-1"
                    >
                      <Shield className="h-3 w-3" />
                      <span className="text-xs font-medium">{audit.auditName}</span>
                    </a>
                  ))}
                </div>
              </div>
            )
          })()}
          
          {/* Chains/Networks */}
          {token.network && (
            <div className="space-y-1">
              <span className="text-gray-400 text-xs">Chains</span>
              <div className="flex gap-1 flex-wrap">
                <div className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded">
                  <img 
                    src={getNetworkIcon(token.network)} 
                    alt={token.network} 
                    className="h-3 w-3 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/networks/ethereum.png'
                    }}
                  />
                  <span className="text-xs font-medium">{token.network}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Additional Networks from Contracts */}
          {(() => {
            const additionalNetworks = token.contracts?.map(contract => contract.network).filter(network => network !== token.network) || []
            const uniqueNetworks = [...new Set(additionalNetworks)]
            
            if (uniqueNetworks.length === 0) return null
            
            return (
              <div className="space-y-1">
                <span className="text-gray-400 text-xs">Additional Networks</span>
                <div className="flex gap-1 flex-wrap">
                  {uniqueNetworks.map((network) => (
                    <div key={network} className="inline-flex items-center gap-1 bg-gray-600/20 text-gray-400 text-xs px-2 py-1 rounded">
                      <img 
                        src={getNetworkIcon(network)} 
                        alt={network} 
                        className="h-3 w-3 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/networks/ethereum.png'
                        }}
                      />
                      <span className="text-xs font-medium">{network}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
          
          {/* Category */}
          {token.tags && token.tags.length > 0 && token.tags.some(tag => tag && tag.trim()) && (
            <div className="space-y-1">
              <span className="text-gray-400 text-xs">Category</span>
              <div className="flex gap-1 flex-wrap">
                {token.tags.filter(tag => {
                  // Remove network names from category display since we have separate Chains section
                  const networkNames = ['ETHEREUM', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVALANCHE', 'FANTOM', 'CRONOS', 'BASE', 'LINEA', 'ZKSYNC', 'SCROLL', 'MANTLE', 'CELO', 'SOLANA', 'CARDANO', 'POLKADOT', 'COSMOS', 'NEAR', 'ALGORAND'];
                  return !networkNames.includes(tag.toUpperCase());
                }).map((tag) => (
                  <Badge key={tag} className="bg-purple-600/20 text-purple-400 text-xs hover:bg-purple-600/30 transition-colors duration-200">
                    {formatTag(tag)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Description - Collapsible */}
          <div className="space-y-1">
            <span className="text-gray-400 text-xs">What is {token.name} about?</span>
            <div className="space-y-2">
              <div className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">
                {(() => {
                  if (!token.description) return '';
                  
                  // Lower the character limit to ensure button shows more often
                  const charLimit = 200;
                  
                  if (token.description.length <= charLimit) {
                    return (
                      <span>
                        {token.description}
                      </span>
                    );
                  }
                  
                  if (isDescriptionExpanded) {
                    return (
                      <span>
                        {token.description}
                        {' '}
                        <button
                          onClick={() => setIsDescriptionExpanded(false)}
                          className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 inline-flex items-center gap-1"
                        >
                          Show Less
                          <ChevronDown className="h-3 w-3 transition-transform duration-200 rotate-180" />
                        </button>
                      </span>
                    );
                  }
                  
                  // Find the last sentence end before the limit
                  const truncated = token.description.substring(0, charLimit);
                  let lastPeriod = truncated.lastIndexOf('.');
                  
                  // If no period found, fall back to word boundary
                  if (lastPeriod === -1) {
                    const lastSpace = truncated.lastIndexOf(' ');
                    lastPeriod = lastSpace;
                  }
                  
                  const truncatedText = token.description.substring(0, lastPeriod + 1);
                  
                  return (
                    <span>
                      {truncatedText}
                      {' '}
                      <button
                        onClick={() => setIsDescriptionExpanded(true)}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 inline-flex items-center gap-1"
                      >
                        More
                        <ChevronDown className="h-3 w-3 transition-transform duration-200" />
                      </button>
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
          
          {/* Verification Icons - Compact */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors duration-200 border border-gray-700/50">
              <FileText className="h-4 w-4 text-gray-400 mx-auto mb-1" />
              <span className="text-gray-400 text-xs">Audit</span>
            </div>
            <div className="text-center p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors duration-200 border border-gray-700/50">
              <Users className="h-4 w-4 text-gray-400 mx-auto mb-1" />
              <span className="text-gray-400 text-xs">Team</span>
            </div>
            <div className="text-center p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors duration-200 border border-gray-700/50">
              <div className="relative">
                <AlertTriangle className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <CheckCircle className="h-2 w-2 text-green-400 absolute -top-1 -right-1" />
              </div>
              <span className="text-gray-400 text-xs">Bounty</span>
            </div>
            <div className="text-center p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors duration-200 border border-gray-700/50">
              <FileText className="h-4 w-4 text-gray-400 mx-auto mb-1" />
              <span className="text-gray-400 text-xs">Verified</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800/50 -mx-4 lg:-mx-6"></div>

        {/* Pulse Feed */}
        <div className="space-y-4 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50">
          <h3 className="text-white font-semibold text-sm lg:text-base">Pulse Feed</h3>
          <div className="space-y-2 lg:space-y-3">
            {pulseFeed.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-start gap-2 lg:gap-3 p-2 rounded-lg hover:bg-gray-800/30 transition-colors duration-200">
                <span className="text-gray-500 text-xs whitespace-nowrap flex-shrink-0">{item.timestamp}</span>
                <span className="text-gray-300 text-xs lg:text-sm flex-1">{item.event}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-xs lg:text-sm py-2 px-3 rounded-lg transition-all duration-200 hover:scale-105">
              View More
            </button>
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs lg:text-sm py-2 px-3 rounded-lg transition-all duration-200 hover:scale-105">
              Explore Pulse
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800/50 -mx-4 lg:-mx-6"></div>

        {/* User Rating */}
        <div className="space-y-4 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm lg:text-base">{userRating.score}</h3>
            <button className="text-blue-400 text-xs lg:text-sm hover:underline transition-colors duration-200 hover:text-blue-300">Rate Now</button>
          </div>
          
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 lg:h-4 lg:w-4 transition-all duration-200 hover:scale-110 ${
                  star <= userRating.score ? 'text-pink-400 fill-current' : 'text-gray-400'
                }`}
              />
            ))}
            <span className="text-gray-400 text-xs lg:text-sm">{userRating.totalRatings} Ratings</span>
          </div>
          
          <div className="space-y-2">
            {userRating.recentRatings.map((rating, index) => (
              <div key={index} className="flex items-center justify-between text-xs lg:text-sm p-2 rounded-lg hover:bg-gray-800/30 transition-colors duration-200">
                <span className="text-gray-400 truncate">{rating.user} rated</span>
                <span className="text-gray-300 truncate ml-2">{rating.platform}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
