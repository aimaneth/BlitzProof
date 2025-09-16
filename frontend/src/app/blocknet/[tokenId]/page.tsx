'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BlockNetSidebar from '@/components/ui/blocknet-sidebar'
import { 
  ArrowLeft, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  X,
  Search,
  DollarSign,
  Database,
  Info,
  Shield,
  Target,
  Users,
  Globe,
  Activity,
  Settings,
  BarChart3,
  CheckCircle,
  Zap
} from 'lucide-react'
import { getTokenWithPrice, getTokenByUniqueId, refreshTokenPrice, updateToken, getTokenFundamentalData, SimpleToken } from '@/lib/api'
import { Input } from '@/components/ui/input'
import SecuritySidebar from '@/components/ui/security-sidebar'
import TradingViewChart from '@/components/ui/tradingview-chart'

interface TokenDetails {
  id: string;
  name: string;
  symbol: string;
  network: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holderCount: number;
  riskLevel: string;
  description: string;
  website: string;
  whitepaper: string;
  contractAddress: string;
  totalSupply?: string;
  circulatingSupply?: string;
  maxSupply?: string;
  totalLiquidity?: number;
  pairsCount?: number;
  rank?: number;
  auditsCount?: number;
  tags?: string[];
  contracts?: any[];
  explorers?: any[];
  wallets?: any[];
  auditLinks?: any[];
  sourceCode?: any[];
  securityScore?: {
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
  };
  socials?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    github?: string;
    reddit?: string;
    whitepaper?: string;
  };
}

export default function TokenDetailsPage() {
  const params = useParams()
  const tokenId = params.tokenId as string
  
  const [token, setToken] = useState<TokenDetails | null>(null)
  const [fundamentalData, setFundamentalData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSidebarSection, setActiveSidebarSection] = useState('overview')
  const [activeSubSection, setActiveSubSection] = useState('')
  const [activeSection, setActiveSection] = useState('price-section')
  const [logoUrl, setLogoUrl] = useState<string>('/token-logo/base.png')
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null)
  const [isRefreshingPrice, setIsRefreshingPrice] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Fetch token data
  const fetchTokenData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get comprehensive token data (includes all related data like socials, contracts, etc.)
      const tokenResponse = await getTokenByUniqueId(tokenId)
      
      if (!tokenResponse.success || !tokenResponse.token) {
        throw new Error('Token not found')
      }
      
      const simpleToken = tokenResponse.token

      // Get price data separately
      const priceResponse = await getTokenWithPrice(tokenId)
      const priceData = priceResponse.success ? priceResponse.token : null

      const tokenDetails: TokenDetails = {
        id: simpleToken.uniqueId,
        name: simpleToken.name,
        symbol: simpleToken.symbol,
        network: simpleToken.network,
        price: priceData?.price || 0,
        priceChange24h: priceData?.priceChange24h || 0,
        marketCap: priceData?.marketCap || 0,
        volume24h: priceData?.volume24h || 0,
            holderCount: simpleToken.holderCount || 0,
        riskLevel: simpleToken.riskLevel,
        description: simpleToken.description || `${simpleToken.name} is a cryptocurrency token.`,
        website: simpleToken.website || '',
        whitepaper: simpleToken.socials?.find(s => s.platform === 'whitepaper')?.url || '',
        contractAddress: simpleToken.contractAddress || '0x0000000000000000000000000000000000000000',
        totalSupply: '0', // Not available in SimpleToken interface
        circulatingSupply: '0', // Not available in SimpleToken interface
        maxSupply: '0', // Not available in SimpleToken interface
        totalLiquidity: 0, // Not available in SimpleToken interface
        pairsCount: 0, // Not available in SimpleToken interface
        rank: simpleToken.rank || 253,
        auditsCount: simpleToken.auditsCount || 0,
        tags: simpleToken.tags || [],
        contracts: simpleToken.contracts || [],
        explorers: simpleToken.explorers || [],
        wallets: simpleToken.wallets || [],
        auditLinks: simpleToken.auditLinks || [],
        sourceCode: simpleToken.sourceCode || [],
        securityScore: simpleToken.securityScore || undefined,
        socials: {
          website: simpleToken.website || '',
          twitter: simpleToken.socials?.find(s => s.platform === 'twitter')?.url || '',
          telegram: simpleToken.socials?.find(s => s.platform === 'telegram')?.url || '',
          discord: simpleToken.socials?.find(s => s.platform === 'discord')?.url || '',
          github: simpleToken.socials?.find(s => s.platform === 'github')?.url || '',
          reddit: simpleToken.socials?.find(s => s.platform === 'reddit')?.url || '',
          whitepaper: simpleToken.socials?.find(s => s.platform === 'whitepaper')?.url || ''
        }
      }

        setToken(tokenDetails)

      // Load fundamental data
      try {
        console.log(`📊 Loading fundamental data for ${simpleToken.name} (${simpleToken.uniqueId})`)
        const fundamentalResponse = await getTokenFundamentalData(simpleToken.uniqueId)
        if (fundamentalResponse.success) {
          setFundamentalData(fundamentalResponse.data)
          console.log(`✅ Fundamental data loaded for ${simpleToken.name}`)
            } else {
          console.log(`⚠️ No fundamental data for ${simpleToken.name}`)
        }
      } catch (fundamentalError) {
        console.warn(`Failed to load fundamental data for ${simpleToken.name}:`, fundamentalError)
      }

      // Load logo from database
      try {
        console.log(`🔍 Loading uploaded logo for ${simpleToken.name} (${simpleToken.uniqueId})`)
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'
        const logoResponse = await fetch(`${apiBaseUrl}/api/blocknet/token-logos/${simpleToken.uniqueId}`)
        if (logoResponse.ok) {
          // Check if response is an image (not JSON)
          const contentType = logoResponse.headers.get('content-type')
          if (contentType && contentType.startsWith('image/')) {
            // Create object URL for the image blob
            const logoBlob = await logoResponse.blob()
            const logoUrl = URL.createObjectURL(logoBlob)
            setLogoUrl(logoUrl)
            console.log(`✅ Logo loaded for ${simpleToken.name}: ${logoUrl}`)
          } else {
            // Try to parse as JSON for metadata response
            const logoData = await logoResponse.json()
            if (logoData.success && logoData.logoUrl) {
              // Fetch the actual image using the logoUrl from the response
              const imageResponse = await fetch(`${apiBaseUrl}${logoData.logoUrl}`)
              if (imageResponse.ok) {
                const logoBlob = await imageResponse.blob()
                const logoUrl = URL.createObjectURL(logoBlob)
                setLogoUrl(logoUrl)
              } else {
                setLogoUrl('/token-logo/base.png')
                console.log(`❌ Failed to fetch image for ${simpleToken.name} (${simpleToken.uniqueId})`)
              }
            } else {
              setLogoUrl('/token-logo/base.png')
              console.log(`❌ No logo for ${simpleToken.name} (${simpleToken.uniqueId})`)
            }
          }
        } else {
          setLogoUrl('/token-logo/base.png')
          console.log(`❌ No logo for ${simpleToken.name} (${simpleToken.uniqueId})`)
        }
      } catch (logoError) {
        setLogoUrl('/token-logo/base.png')
        console.warn(`Failed to load logo for ${simpleToken.name}:`, logoError)
      }
    } catch (error) {
      console.error('Error fetching token data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load token data')
    } finally {
      setLoading(false)
    }
  }

  // Load token data on mount
  useEffect(() => {
    if (tokenId) {
      fetchTokenData()
    }
  }, [tokenId])

  // Handle scroll to update active section
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    
    const handleScroll = () => {
      const sections = [
        'price-section',
        'security-section', 
        'fundamental-section',
        'community-section',
        'governance-section',
        'market-section',
        'monitor-section'
      ]
      
      if (!scrollContainer) return
      
      const scrollPosition = scrollContainer.scrollTop + 200 // Add offset for header and tabs
      
      // Find which section is currently in view
      let currentSection = 'price-section'
      
      for (let i = 0; i < sections.length; i++) {
        const section = document.getElementById(sections[i])
        if (section) {
          const sectionTop = section.offsetTop
          const sectionBottom = sectionTop + section.offsetHeight
          
          // Check if scroll position is within this section
          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            currentSection = sections[i]
            break
          }
        }
      }
      
      // If we're at the bottom, set to last section
      if (scrollPosition >= scrollContainer.scrollHeight - scrollContainer.clientHeight - 100) {
        currentSection = sections[sections.length - 1]
      }
      
      console.log('Scroll position:', scrollPosition, 'Active section:', currentSection)
      setActiveSection(currentSection)
    }

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      // Initial check after a short delay to ensure DOM is ready
      setTimeout(handleScroll, 100)
      return () => scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [token]) // Add token as dependency to re-run when token loads

  // Format price
  const formatPrice = (price: number) => {
    if (price === 0) return '$0.00'
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  // Format market cap
  const formatMarketCap = (marketCap: number) => {
    if (marketCap === 0) return '$0'
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`
    return `$${marketCap.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#0D0E0E] via-[#0F1011] to-[#0D0E0E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading token data...</p>
        </div>
      </div>
    )
  }

  if (error || !token) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#0D0E0E] via-[#0F1011] to-[#0D0E0E] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Token Not Found</h1>
          <p className="text-gray-400 mb-4">
            {error || `Could not load data for ${tokenId}`}
          </p>
          <Button 
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#0D0E0E] via-[#0F1011] to-[#0D0E0E] flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="hidden md:flex">
        <BlockNetSidebar
          activeSection={activeSidebarSection}
          activeSubSection={activeSubSection}
          onSectionChange={setActiveSidebarSection}
          onSubSectionChange={setActiveSubSection}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
         {/* Announcement Banner */}
         <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border-b border-blue-500/30 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">
                🚀 New Feature: Real-time threat detection now available for all monitored tokens
              </span>
              <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-xs">
                Live
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-gray-400 hover:text-white text-sm transition-colors">
                Learn More
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

         {/* Header */}
         <div className="bg-[#0F1011] border-b border-gray-800 flex-shrink-0">
           <div className="flex items-center justify-between h-16 px-6">
             <div className="flex items-center">
              <span className="text-white text-sm font-medium">Token Details</span>
             </div>
             <div className="flex items-center gap-4">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <Input
                   placeholder="Search projects, tokens, addresses..."
                   className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400 w-80"
                 />
               </div>
               <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                 Log In
               </Button>
             </div>
           </div>
         </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Content */}
           <div className="flex-1 flex flex-col overflow-hidden">
             {/* Token Header */}
             <div className="bg-[#0F1011] border-b border-gray-800 p-4 flex-shrink-0">
               <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                 <div className="flex items-center gap-3 lg:gap-4">
                   <Button
                     onClick={() => window.history.back()}
                     variant="outline"
                     size="sm"
                     className="border-gray-700 text-white hover:bg-gray-800 flex-shrink-0"
                   >
                     <ArrowLeft className="h-4 w-4" />
                   </Button>
                  
                   <div className="flex items-center gap-3 lg:gap-6 min-w-0">
                    {/* Logo */}
                     <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden flex-shrink-0">
                       <img
                         src={logoUrl}
                         alt={`${token.name} logo`}
                         className="w-full h-full object-cover"
                         onError={(e) => {
                           const target = e.target as HTMLImageElement
                           target.style.display = 'none'
                           if (target.parentElement) {
                             target.parentElement.innerHTML = `<div class="w-full h-full bg-blue-600/20 rounded-full flex items-center justify-center"><span class="text-blue-400 font-semibold text-sm lg:text-lg">${token.symbol.charAt(0)}</span></div>`
                           }
                         }}
                       />
                     </div>
                     
                    {/* Token Info */}
                     <div className="min-w-0 flex-1">
                       <h1 className="text-lg lg:text-2xl font-bold text-white truncate">{token.name}</h1>
                       <p className="text-gray-400 text-sm lg:text-base">{token.symbol}</p>
                     </div>
                     
                     <Star className="h-5 w-5 text-gray-400 hover:text-yellow-400 cursor-pointer hidden sm:block" />
                     
                    {/* Price */}
                     <div className="flex items-center gap-2 flex-shrink-0">
                       <div className="flex items-center gap-1">
                        <span className="text-base lg:text-lg font-semibold text-white">
                           {formatPrice(token.price)}
                         </span>
                       </div>
                       <Badge 
                         variant={token.priceChange24h >= 0 ? 'default' : 'destructive'}
                        className="flex items-center gap-1 text-xs"
                       >
                         {token.priceChange24h >= 0 ? (
                           <TrendingUp className="w-3 h-3" />
                         ) : (
                           <TrendingDown className="w-3 h-3" />
                         )}
                         {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                       </Badge>
                     </div>
                   </div>
                 </div>
                 
                {/* Market Data */}
                 <div className="flex items-center gap-3 lg:gap-4 lg:ml-4">
                   <div className="text-center">
                     <p className="text-xs text-gray-400">Market Cap</p>
                     <p className="text-xs lg:text-sm font-semibold text-white">{formatMarketCap(token.marketCap)}</p>
                   </div>
                   <div className="text-center">
                     <p className="text-xs text-gray-400">Volume 24h</p>
                     <p className="text-xs lg:text-sm font-semibold text-white">{formatMarketCap(token.volume24h)}</p>
                   </div>
                         </div>
                       </div>
                       </div>

            {/* Navigation Tabs */}
            <div className="bg-[#111213] border-b border-gray-800 px-6 flex-shrink-0">
              <div className="flex space-x-8">
                                                   {[
                    { label: 'Price', id: 'price-section' },
                    { label: 'Code Security', id: 'security-section' },
                    { label: 'Fundamental', id: 'fundamental-section' },
                    { label: 'Community', id: 'community-section' },
                    { label: 'Governance', id: 'governance-section' },
                    { label: 'Market', id: 'market-section' },
                    { label: 'Monitor', id: 'monitor-section' }
                  ].map((section) => (
                   <button
                     key={section.id}
                                           onClick={() => {
                        const element = document.getElementById(section.id)
                        const scrollContainer = scrollContainerRef.current
                        if (element && scrollContainer) {
                          const scrollTop = element.offsetTop - 200 // Offset for header and tabs
                          scrollContainer.scrollTo({ top: scrollTop, behavior: 'smooth' })
                          // Immediately set active section
                          setActiveSection(section.id)
                        }
                      }}
                     className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                       activeSection === section.id
                         ? 'border-white text-white'
                         : 'border-transparent text-gray-400 hover:text-white'
                     }`}
                   >
                     {section.label}
                   </button>
                 ))}
               </div>
             </div>

            {/* Main Content Area - All Sections */}
             <div ref={scrollContainerRef} className="flex-1 overflow-auto">
              {/* Price Section */}
              <section id="price-section" className="p-6 border-b border-gray-800">
                <div className="space-y-8">
                  {/* TradingView Chart */}
                  <TradingViewChart
                    tokenId={tokenId}
                    currentPrice={token.price}
                    priceChange24h={token.priceChange24h}
                    className="bg-[#111213] border-gray-800 h-[500px]"
                  />
                </div>
              </section>

                             {/* Security Section */}
               <section id="security-section" className="p-6 border-b border-gray-800">
                                   <h2 className="text-2xl font-bold text-white mb-6">
                    Code Security
                  </h2>
                 <div className="space-y-6">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Security Score Chart */}
                  <Card className="bg-[#111213] border-gray-800">
                       <CardHeader>
                         <CardTitle className="text-white">Security Score</CardTitle>
                    </CardHeader>
                                               <CardContent>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-green-400 mb-2">{token.securityScore?.overallScore || 0}</div>
                            <div className="text-gray-400 mb-4">Overall Score</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-green-400 font-semibold">Code Security</div>
                                <div className="text-gray-400">{token.securityScore?.codeSecurityScore || 0}/100</div>
                            </div>
                              <div className="text-center">
                                <div className="text-yellow-400 font-semibold">Market Risk</div>
                                <div className="text-gray-400">{token.securityScore?.marketScore || 0}/100</div>
                            </div>
                        </div>
                            </div>
                      </CardContent>
                    </Card>

                     {/* Risk Assessment */}
                     <Card className="bg-[#111213] border-gray-800">
                       <CardHeader>
                         <CardTitle className="text-white">Risk Assessment</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-4">
                           <div className="flex justify-between items-center">
                             <span className="text-gray-400">Code Security</span>
                             <Badge className="bg-green-600/20 text-green-400 border-green-500/30">High</Badge>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-gray-400">Market Risk</span>
                             <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">Medium</Badge>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-gray-400">Liquidity Risk</span>
                             <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Low</Badge>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-gray-400">Contract Risk</span>
                             <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Low</Badge>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   </div>

                   {/* Security Details */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Shield className="h-4 w-4 text-blue-400" />
                           Audit Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Certik Audit</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Passed</Badge>
                          </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Hacken Audit</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Passed</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Bug Bounty</span>
                           <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">Active</Badge>
                            </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <CheckCircle className="h-4 w-4 text-green-400" />
                           Verification
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Contract Verified</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Yes</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Team Verified</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Yes</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">KYC Status</span>
                           <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
                            </div>
                      </CardContent>
                    </Card>

                  <Card className="bg-[#111213] border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Activity className="h-4 w-4 text-red-400" />
                           Vulnerabilities
                      </CardTitle>
                    </CardHeader>
                                               <CardContent className="pt-0 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Critical</span>
                            <span className="text-white font-medium">{token.securityScore?.criticalCount || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">High</span>
                            <span className="text-white font-medium">{token.securityScore?.warningsCount || 0}</span>
                        </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Medium</span>
                            <span className="text-white font-medium">{token.securityScore?.informationalCount || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Low</span>
                            <span className="text-white font-medium">{token.securityScore?.verifiedCount || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                   </div>
                </div>
              </section>

              {/* Fundamental Section */}
              <section id="fundamental-section" className="p-6 border-b border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-6">Fundamental Health</h2>
                
                {/* Health Score Overview */}
                <div className="mb-6">
                  <Card className="bg-[#111213] border-gray-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">Overall Health Score</h3>
                          <p className="text-gray-400 text-sm">Based on supply, liquidity, utility & development metrics</p>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-green-400 mb-1">
                            {fundamentalData?.healthScore?.overall ? 
                              fundamentalData.healthScore.overall : 
                              'N/A'
                            }
                          </div>
                          <div className="text-sm text-gray-400">/ 100</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Supply */}
                  <Card className="bg-[#111213] border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Database className="h-4 w-4 text-blue-400" />
                        <span className="text-white font-medium text-sm">Supply</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Market Cap</span>
                          <span className="text-white">
                            {fundamentalData?.performance?.marketCap ? 
                              `$${(fundamentalData.performance.marketCap / 1e6).toFixed(1)}M` : 
                              'N/A'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Circulating</span>
                          <span className="text-white">
                            {fundamentalData?.supplyMetrics?.circulatingRatio ? 
                              `${fundamentalData.supplyMetrics.circulatingRatio.toFixed(1)}%` : 
                              'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Liquidity */}
                  <Card className="bg-[#111213] border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="h-4 w-4 text-green-400" />
                        <span className="text-white font-medium text-sm">Liquidity</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Total</span>
                          <span className="text-white">
                            {fundamentalData?.liquidity?.totalLiquidityUSD ? 
                              `$${(fundamentalData.liquidity.totalLiquidityUSD / 1e6).toFixed(1)}M` : 
                              'N/A'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Health</span>
                          <Badge className={
                            fundamentalData?.liquidity?.liquidityHealth === 'HIGH' ? "bg-green-600/20 text-green-400 border-green-500/30 text-xs" :
                            fundamentalData?.liquidity?.liquidityHealth === 'MEDIUM' ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30 text-xs" :
                            fundamentalData?.liquidity?.liquidityHealth === 'LOW' ? "bg-red-600/20 text-red-400 border-red-500/30 text-xs" :
                            "bg-gray-600/20 text-gray-400 border-gray-500/30 text-xs"
                          }>
                            {fundamentalData?.liquidity?.liquidityHealth || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utility */}
                  <Card className="bg-[#111213] border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-purple-400" />
                        <span className="text-white font-medium text-sm">Utility</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Staking</span>
                          <Badge className={fundamentalData?.utility?.stakingEnabled ? 
                            "bg-green-600/20 text-green-400 border-green-500/30 text-xs" : 
                            "bg-red-600/20 text-red-400 border-red-500/30 text-xs"
                          }>
                            {fundamentalData?.utility?.stakingEnabled ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">DeFi</span>
                          <Badge className={fundamentalData?.utility?.defiIntegration ? 
                            "bg-green-600/20 text-green-400 border-green-500/30 text-xs" : 
                            "bg-blue-600/20 text-blue-400 border-blue-500/30 text-xs"
                          }>
                            {fundamentalData?.utility?.defiIntegration ? 'Active' : 'Partial'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk */}
                  <Card className="bg-[#111213] border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-orange-400" />
                        <span className="text-white font-medium text-sm">Risk</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Concentration</span>
                          <Badge className={
                            fundamentalData?.riskFactors?.concentrationRisk === 'LOW' ? "bg-green-600/20 text-green-400 border-green-500/30 text-xs" :
                            fundamentalData?.riskFactors?.concentrationRisk === 'MEDIUM' ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30 text-xs" :
                            fundamentalData?.riskFactors?.concentrationRisk === 'HIGH' ? "bg-red-600/20 text-red-400 border-red-500/30 text-xs" :
                            "bg-gray-600/20 text-gray-400 border-gray-500/30 text-xs"
                          }>
                            {fundamentalData?.riskFactors?.concentrationRisk || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Technical</span>
                          <Badge className={
                            fundamentalData?.riskFactors?.technicalRisk === 'LOW' ? "bg-green-600/20 text-green-400 border-green-500/30 text-xs" :
                            fundamentalData?.riskFactors?.technicalRisk === 'MEDIUM' ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30 text-xs" :
                            fundamentalData?.riskFactors?.technicalRisk === 'HIGH' ? "bg-red-600/20 text-red-400 border-red-500/30 text-xs" :
                            "bg-gray-600/20 text-gray-400 border-gray-500/30 text-xs"
                          }>
                            {fundamentalData?.riskFactors?.technicalRisk || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tokenomics & Performance */}
                  <Card className="bg-[#111213] border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg">Tokenomics & Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Volume 24h</div>
                          <div className="text-white font-medium">
                            {fundamentalData?.liquidity?.volume24h ? 
                              `$${(fundamentalData.liquidity.volume24h / 1e6).toFixed(1)}M` : 
                              'N/A'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Staking APY</div>
                          <div className="text-white font-medium">
                            {fundamentalData?.tokenomics?.stakingAPY ? 
                              `${fundamentalData.tokenomics.stakingAPY.toFixed(1)}%` : 
                              'N/A'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Audit Count</div>
                          <div className="text-white font-medium">
                            {fundamentalData?.development?.auditCount || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Liquidity Pairs</div>
                          <div className="text-white font-medium">
                            {fundamentalData?.liquidity?.liquidityPairs || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Distribution & Development */}
                  <Card className="bg-[#111213] border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg">Distribution & Development</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Top 10 Holders</div>
                          <div className="text-white font-medium">
                            {fundamentalData?.distribution?.top10Holders ? 
                              `${fundamentalData.distribution.top10Holders.toFixed(1)}%` : 
                              'N/A'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Team Size</div>
                          <div className="text-white font-medium">
                            {fundamentalData?.development?.teamSize || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Partnerships</div>
                          <div className="text-white font-medium">
                            {fundamentalData?.development?.partnershipCount || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Roadmap Progress</div>
                          <div className="text-white font-medium">
                            {fundamentalData?.development?.roadmapProgress ? 
                              `${fundamentalData.development.roadmapProgress}%` : 
                              'N/A'
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Community Section */}
              <section id="community-section" className="p-6 border-b border-gray-800">
                                   <h2 className="text-2xl font-bold text-white mb-6">
                      Community Analysis
                </h2>
                 <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Globe className="h-4 w-4 text-blue-400" />
                           Social Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                         {token?.socials?.website && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-400">Website</span>
                             <a href={token.socials.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium">Visit</a>
                           </div>
                         )}
                         {token?.socials?.twitter && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-400">Twitter</span>
                             <a href={token.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium">Follow</a>
                           </div>
                         )}
                         {token?.socials?.telegram && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-400">Telegram</span>
                             <a href={token.socials.telegram} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium">Join</a>
                           </div>
                         )}
                         {token?.socials?.discord && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-400">Discord</span>
                             <a href={token.socials.discord} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium">Join</a>
                           </div>
                         )}
                         {token?.socials?.reddit && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-400">Reddit</span>
                             <a href={token.socials.reddit} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium">Visit</a>
                           </div>
                         )}
                         {token?.socials?.github && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-400">GitHub</span>
                             <a href={token.socials.github} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium">View</a>
                           </div>
                         )}
                         {token?.whitepaper && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-400">Whitepaper</span>
                             <a href={token.whitepaper} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium">Read</a>
                           </div>
                         )}
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Activity className="h-4 w-4 text-green-400" />
                           Development
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Active Devs</span>
                           <span className="text-white font-medium">8</span>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Commits (30d)</span>
                           <span className="text-white font-medium">156</span>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Releases</span>
                           <span className="text-white font-medium">3</span>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">GitHub Stars</span>
                           <span className="text-white font-medium">1.2K</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Users className="h-4 w-4 text-purple-400" />
                           Engagement
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Daily Active</span>
                           <span className="text-white font-medium">2.8K</span>
                          </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Weekly Active</span>
                           <span className="text-white font-medium">12.5K</span>
                          </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Monthly Active</span>
                           <span className="text-white font-medium">45.2K</span>
                          </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Growth Rate</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">+15%</Badge>
                    </div>
                  </CardContent>
                </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <BarChart3 className="h-4 w-4 text-yellow-400" />
                           Sentiment
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Positive</span>
                           <span className="text-white font-medium">68%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Neutral</span>
                           <span className="text-white font-medium">25%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Negative</span>
                           <span className="text-white font-medium">7%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Mentions (24h)</span>
                           <span className="text-white font-medium">1.2K</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Info className="h-4 w-4 text-blue-400" />
                           Token Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                         {token?.description && (
                           <div>
                             <span className="text-gray-400 text-sm block mb-2">Description</span>
                             <p className="text-white text-sm leading-relaxed">{token.description}</p>
                           </div>
                         )}
                         {token?.contractAddress && token.contractAddress !== '0x0000000000000000000000000000000000000000' && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-400">Contract Address</span>
                             <span className="text-white font-mono text-xs">{token.contractAddress}</span>
                           </div>
                         )}
                         {token?.network && (
                           <div className="flex justify-between text-sm">
                             <span className="text-gray-400">Network</span>
                             <span className="text-white font-medium capitalize">{token.network}</span>
                           </div>
                         )}
                      </CardContent>
                    </Card>
                  </div>

                   {/* Additional Community Data */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-[#111213] border-gray-800">
                       <CardHeader>
                         <CardTitle className="text-white">Community Events</CardTitle>
                      </CardHeader>
                       <CardContent>
                         <div className="space-y-3">
                           <div className="flex justify-between">
                             <span className="text-gray-400">AMA Sessions</span>
                             <span className="text-white">Monthly</span>
                          </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Contests</span>
                             <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Active</Badge>
                          </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Meetups</span>
                             <span className="text-white">Quarterly</span>
                          </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Hackathons</span>
                             <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">Planned</Badge>
                          </div>
                          </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111213] border-gray-800">
                       <CardHeader>
                         <CardTitle className="text-white">Influencer Reach</CardTitle>
                  </CardHeader>
                       <CardContent>
                         <div className="space-y-3">
                           <div className="flex justify-between">
                             <span className="text-gray-400">YouTube Mentions</span>
                             <span className="text-white">45 videos</span>
                          </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Podcast Features</span>
                             <span className="text-white">12 episodes</span>
                          </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Blog Articles</span>
                             <span className="text-white">89 posts</span>
                          </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">News Coverage</span>
                             <span className="text-white">23 articles</span>
                      </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>

              {/* Governance Section */}
              <section id="governance-section" className="p-6 border-b border-gray-800">
                                   <h2 className="text-2xl font-bold text-white mb-6">
                    Governance
                </h2>
                 <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Settings className="h-4 w-4 text-purple-400" />
                           Proposal System
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Total Proposals</span>
                           <span className="text-white font-medium">24</span>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Active Proposals</span>
                           <span className="text-white font-medium">2</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Voting Period</span>
                           <span className="text-white font-medium">7 days</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Quorum</span>
                           <span className="text-white font-medium">5%</span>
                         </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-green-400" />
                           Voting Power
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Total Voters</span>
                           <span className="text-white font-medium">1,247</span>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Avg Participation</span>
                           <span className="text-white font-medium">67%</span>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Min Stake</span>
                           <span className="text-white font-medium">1,000</span>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Lock Period</span>
                           <span className="text-white font-medium">7 days</span>
                         </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Database className="h-4 w-4 text-blue-400" />
                           Token Distribution
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">DAO Treasury</span>
                           <span className="text-white font-medium">20%</span>
                          </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Community Rewards</span>
                           <span className="text-white font-medium">15%</span>
                          </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Development Fund</span>
                           <span className="text-white font-medium">10%</span>
                          </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Staking Rewards</span>
                           <span className="text-white font-medium">25%</span>
               </div>
                  </CardContent>
                </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <CheckCircle className="h-4 w-4 text-green-400" />
                           Governance Status
                    </CardTitle>
                  </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">DAO Status</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Active</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Multi-sig</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Enabled</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Timelock</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">48h</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Emergency Pause</span>
                           <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">Available</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                   {/* Additional Governance Data */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-[#111213] border-gray-800">
                       <CardHeader>
                         <CardTitle className="text-white">Recent Proposals</CardTitle>
                    </CardHeader>
                       <CardContent>
                        <div className="space-y-3">
                           <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                             <CheckCircle className="h-4 w-4 text-green-400" />
                             <div className="flex-1">
                               <div className="text-white text-sm font-medium">Increase Staking Rewards</div>
                               <div className="text-gray-400 text-xs">Passed with 78% votes</div>
                          </div>
                             <span className="text-gray-500 text-xs">2 days ago</span>
                          </div>
                           <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                             <Activity className="h-4 w-4 text-blue-400" />
                             <div className="flex-1">
                               <div className="text-white text-sm font-medium">Partnership with DeFi Protocol</div>
                               <div className="text-gray-400 text-xs">Active - 3 days left</div>
                            </div>
                             <span className="text-gray-500 text-xs">4 days ago</span>
                            </div>
                           <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                             <X className="h-4 w-4 text-red-400" />
                             <div className="flex-1">
                               <div className="text-white text-sm font-medium">Token Burn Proposal</div>
                               <div className="text-gray-400 text-xs">Rejected with 65% votes</div>
                          </div>
                             <span className="text-gray-500 text-xs">1 week ago</span>
                        </div>
                          </div>
                       </CardContent>
                     </Card>

                     <Card className="bg-[#111213] border-gray-800">
                       <CardHeader>
                         <CardTitle className="text-white">Governance Metrics</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-3">
                           <div className="flex justify-between">
                             <span className="text-gray-400">Proposal Success Rate</span>
                             <span className="text-white">79%</span>
                          </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Avg Voting Power</span>
                             <span className="text-white">45.2K tokens</span>
                            </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Top Voter Power</span>
                             <span className="text-white">2.1M tokens</span>
                            </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Governance Score</span>
                             <Badge className="bg-green-600/20 text-green-400 border-green-500/30">High</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                   </div>
                </div>
              </section>

              {/* Market Section */}
              <section id="market-section" className="p-6 border-b border-gray-800">
                                   <h2 className="text-2xl font-bold text-white mb-6">
                  Market Analysis
                </h2>
                 <div className="space-y-6">
                   <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-400" />
                           Trading Pairs
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">USDC Pair</span>
                           <span className="text-white font-medium">$2.45M</span>
                          </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">ETH Pair</span>
                           <span className="text-white font-medium">$1.23M</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">BTC Pair</span>
                           <span className="text-white font-medium">$890K</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Total Pairs</span>
                           <span className="text-white font-medium">12</span>
                         </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <BarChart3 className="h-4 w-4 text-blue-400" />
                           Market Sentiment
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Fear & Greed</span>
                           <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">Neutral</Badge>
                          </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Social Sentiment</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Positive</Badge>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">News Sentiment</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Bullish</Badge>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Technical Score</span>
                           <span className="text-white font-medium">72/100</span>
                         </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Activity className="h-4 w-4 text-purple-400" />
                           Volume Analysis
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">24h Volume</span>
                           <span className="text-white font-medium">$4.2M</span>
                          </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">7d Avg Volume</span>
                           <span className="text-white font-medium">$3.8M</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Volume Change</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">+12%</Badge>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Volume/MCap</span>
                           <span className="text-white font-medium">12.4%</span>
                         </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <TrendingUp className="h-4 w-4 text-orange-400" />
                           Price Action
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">24h Change</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">+5.2%</Badge>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">7d Change</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">+18.7%</Badge>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">30d Change</span>
                           <Badge className="bg-red-600/20 text-red-400 border-red-500/30">-8.3%</Badge>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">ATH Distance</span>
                           <span className="text-white font-medium">-49.4%</span>
                         </div>
                      </CardContent>
                    </Card>
                      </div>

                   {/* Additional Market Data */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-[#111213] border-gray-800">
                       <CardHeader>
                         <CardTitle className="text-white">Exchange Listings</CardTitle>
                    </CardHeader>
                       <CardContent>
                         <div className="space-y-3">
                           <div className="flex justify-between">
                             <span className="text-gray-400">Centralized Exchanges</span>
                             <span className="text-white">8 exchanges</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">DEX Listings</span>
                             <span className="text-white">15 protocols</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Top Exchange</span>
                             <span className="text-white">Binance</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Listing Score</span>
                             <Badge className="bg-green-600/20 text-green-400 border-green-500/30">High</Badge>
                           </div>
                    </div>
                  </CardContent>
                </Card>

                     <Card className="bg-[#111213] border-gray-800">
                       <CardHeader>
                         <CardTitle className="text-white">Market Indicators</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-3">
                           <div className="flex justify-between">
                             <span className="text-gray-400">RSI (14)</span>
                             <span className="text-white">58.2</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">MACD</span>
                             <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Bullish</Badge>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Bollinger Bands</span>
                             <span className="text-white">Upper Band</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Support Level</span>
                             <span className="text-white">$0.042</span>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   </div>
                 </div>
               </section>

                             {/* Monitor Section */}
               <section id="monitor-section" className="p-6">
                                   <h2 className="text-2xl font-bold text-white mb-6">
                    Real-time Monitoring
                  </h2>
                 <div className="space-y-6">
                   <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Activity className="h-4 w-4 text-red-400" />
                           System Status
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">API Status</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Online</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Database</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Healthy</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Cache</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Optimal</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Uptime</span>
                           <span className="text-white font-medium">99.9%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#111213] border-gray-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Shield className="h-4 w-4 text-blue-400" />
                           Security Monitoring
                        </CardTitle>
                      </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Contract Scan</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Clean</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Vulnerability Check</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Passed</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Malicious Activity</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">None</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Risk Score</span>
                           <span className="text-white font-medium">Low (2/10)</span>
                        </div>
                      </CardContent>
                    </Card>

                  <Card className="bg-[#111213] border-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                           Price Monitoring
                      </CardTitle>
                    </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Price Alert</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Active</Badge>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Volume Spike</span>
                           <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">Detected</Badge>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Price Range</span>
                           <span className="text-white font-medium">$0.042-0.048</span>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Last Update</span>
                           <span className="text-white font-medium">30s ago</span>
                      </div>
                    </CardContent>
                  </Card>

                     <Card className="bg-[#111213] border-gray-800">
                       <CardHeader className="pb-3">
                         <CardTitle className="text-white flex items-center gap-2 text-sm">
                           <Users className="h-4 w-4 text-purple-400" />
                           Social Monitoring
                    </CardTitle>
                  </CardHeader>
                       <CardContent className="pt-0 space-y-2">
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Mention Tracking</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Active</Badge>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Sentiment Alert</span>
                           <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Positive</Badge>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Trending Status</span>
                           <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">Rising</Badge>
                        </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-gray-400">Social Score</span>
                           <span className="text-white font-medium">8.2/10</span>
                      </div>
                       </CardContent>
                     </Card>
                   </div>

                   {/* Additional Monitoring Data */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <Card className="bg-[#111213] border-gray-800">
                       <CardHeader>
                         <CardTitle className="text-white">Active Alerts</CardTitle>
                       </CardHeader>
                       <CardContent>
                      <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                             <div className="flex-1">
                               <div className="text-white text-sm font-medium">Security scan completed</div>
                               <div className="text-gray-400 text-xs">No issues found - All systems secure</div>
                             </div>
                             <span className="text-gray-500 text-xs">2 min ago</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                            <Info className="h-4 w-4 text-blue-400" />
                             <div className="flex-1">
                               <div className="text-white text-sm font-medium">Price monitoring active</div>
                               <div className="text-gray-400 text-xs">Price within normal range - No alerts</div>
                             </div>
                             <span className="text-gray-500 text-xs">5 min ago</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                             <TrendingUp className="h-4 w-4 text-green-400" />
                             <div className="flex-1">
                               <div className="text-white text-sm font-medium">Volume spike detected</div>
                               <div className="text-gray-400 text-xs">24h volume increased by 15%</div>
                          </div>
                             <span className="text-gray-500 text-xs">8 min ago</span>
                        </div>
                           <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                             <Users className="h-4 w-4 text-purple-400" />
                             <div className="flex-1">
                               <div className="text-white text-sm font-medium">Social sentiment positive</div>
                               <div className="text-gray-400 text-xs">Community engagement up 23%</div>
                             </div>
                             <span className="text-gray-500 text-xs">12 min ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                     <Card className="bg-[#111213] border-gray-800">
                       <CardHeader>
                         <CardTitle className="text-white">Performance Metrics</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-3">
                           <div className="flex justify-between">
                             <span className="text-gray-400">Response Time</span>
                             <span className="text-white">45ms</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Data Accuracy</span>
                             <span className="text-white">99.7%</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Alert Precision</span>
                             <span className="text-white">94.2%</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-400">Monitoring Score</span>
                             <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Excellent</Badge>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   </div>
                 </div>
               </section>
            </div>
          </div>

          {/* Security Right Sidebar */}
          <SecuritySidebar
            token={{
               name: token?.name || '',
               symbol: token?.symbol || '',
               price: token?.price || 0,
               priceChange24h: token?.priceChange24h || 0,
               marketCap: token?.marketCap || 0,
               volume24h: token?.volume24h || 0,
               rank: token?.rank || 0,
               contractAddress: token?.contractAddress || '',
               website: token?.website || '',
               audits: token?.auditsCount?.toString() || '0',
               tags: token?.tags || [],
               network: token?.network || '',
               contracts: token?.contractAddress && token.contractAddress !== '0x0000000000000000000000000000000000000000' ? [{
                 network: token.network || 'ethereum',
                 contractAddress: token.contractAddress
               }] : [],
               explorers: token?.explorers || [],
               wallets: token?.wallets || [],
               auditLinks: token?.auditLinks ? token.auditLinks.map((link: string) => ({
                 auditName: 'Audit Report',
                 auditUrl: link,
                 auditType: 'security'
               })) : [],
               sourceCode: token?.socials?.github ? [{
                 sourceName: 'GitHub',
                 sourceUrl: token.socials.github,
                 sourceType: 'github'
               }] : [],
               socials: token?.socials || {},
               description: token?.description || '',
              verification: {
                 certikAudit: false,
                 teamVerification: false,
                 bugBounty: false,
                 verifiedContract: false
              }
            }}
            securityScore={{
               overallScore: token?.securityScore?.overallScore || 0,
               rating: token?.securityScore?.rating || 'Unknown',
               isPartialRating: !token?.securityScore,
               categories: {
                 codeSecurity: token?.securityScore?.codeSecurityScore || 0,
                 market: token?.securityScore?.marketScore || 0,
                 governance: token?.securityScore?.governanceScore || 0,
                 fundamental: token?.securityScore?.fundamentalScore || 0,
                 community: token?.securityScore?.communityScore || 0,
                 operational: token?.securityScore?.operationalScore || 0
               },
               summary: {
                 verified: token?.securityScore?.verifiedCount || 0,
                 informational: token?.securityScore?.informationalCount || 0,
                 warnings: token?.securityScore?.warningsCount || 0,
                 critical: token?.securityScore?.criticalCount || 0
               }
            }}
            userRating={{
               score: 0,
               totalRatings: 0,
               recentRatings: []
             }}
             pulseFeed={[]}
          />
        </div>
      </div>
    </div>
  )
}
