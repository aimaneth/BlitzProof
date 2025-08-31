"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Eye, 
  Plus, 
  Search, 
  Filter,
  BarChart3,
  Zap,
  Target,
  Users,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle,
  XCircle,
  Info,
  Star,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Settings,
  Bell,
  Globe,
  Lock,
  Unlock,
  Award,
  Flame,
  Rocket,
  Crown,
  Medal,
  Trophy,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Filter as FilterIcon,
  Grid,
  List,
  MoreHorizontal,
  Download,
  Share2,
  Bookmark,
  BookmarkPlus,
  Calendar,
  FileText,
  User,
  LogIn,
  LogOut,
  Menu,
  X,
  Grid3X3,
  ArrowUpDown
} from 'lucide-react'
import { apiService, getAllTokens, getAllTokensWithPrice } from '@/lib/api'
import NotificationBell from '@/components/ui/notification-bell'
import ActivityFeed from '@/components/ui/activity-feed'
import AdvancedSearch from '@/components/ui/advanced-search'
import MobileNav from '@/components/ui/mobile-nav'
import MobileTokenCard from '@/components/ui/mobile-token-card'
import SemicircleProgress from '@/components/ui/semicircle-progress'
import BlockNetSidebar from '@/components/ui/blocknet-sidebar'

import { useWebSocket } from '@/hooks/use-websocket'
import ConnectionStatus from '@/components/ui/connection-status'

interface TokenMonitor {
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
}

interface SecurityAlert {
  id: string
  tokenAddress: string
  alertType: string
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

interface DexPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    h1: { buys: number; sells: number }
    h24: { buys: number; sells: number }
  }
  volume: {
    h24: number
    h6: number
    h1: number
  }
  priceChange: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  liquidity: {
    usd: number
    base: number
    quote: number
  }
  fdv: number
  pairCreatedAt: number
}

interface TokenMetrics {
  id?: string // Database ID
  coinGeckoId?: string // CoinGecko ID for API calls
  tokenAddress: string
  name: string
  symbol: string
  network: string
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
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  lastUpdated: string
  dexPairs?: DexPair[]
}

interface DashboardData {
  totalMonitored: number
  totalAlerts: number
  criticalAlerts: number
  highRiskTokens: number
  recentActivity: SecurityAlert[]
}



// Helper function to clear cache (for refresh button)
const clearTokensCache = () => {
  try {
    localStorage.removeItem('blocknet_tokens_data')
    console.log('🗑️ Token cache cleared')
  } catch (error) {
    console.error('❌ Error clearing token cache:', error)
  }
}

// Mock data for demonstration (using proper token configurations)
const mockTokens: any[] = [];

// Skeleton loading component for tokens (Card format)
const TokenSkeleton = () => (
  <Card className="bg-black/20 border-white/10 animate-pulse">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
          <div>
            <div className="h-4 bg-gray-700 rounded w-20 mb-1"></div>
            <div className="h-3 bg-gray-800 rounded w-12"></div>
          </div>
        </div>
        <div className="h-5 bg-gray-700 rounded w-16"></div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-700 rounded w-20"></div>
          <div className="h-4 bg-gray-700 rounded w-16"></div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-700 rounded w-12"></div>
          <div className="text-right">
            <div className="h-4 bg-gray-700 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-12"></div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-700 rounded w-20"></div>
          <div className="h-4 bg-gray-700 rounded w-16"></div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-700 rounded w-16"></div>
          <div className="h-5 bg-gray-700 rounded w-16"></div>
        </div>
      </div>
      

    </CardContent>
  </Card>
);

// Skeleton loading for table rows
const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
        <div>
          <div className="h-4 bg-gray-700 rounded w-20 mb-1"></div>
          <div className="h-3 bg-gray-800 rounded w-12"></div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-700 rounded w-16"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-700 rounded w-20"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-700 rounded w-16"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-700 rounded w-12"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-700 rounded w-16"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-6 bg-gray-700 rounded w-16"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-700 rounded w-20"></div>
    </td>
  </tr>
);

export default function BlockNetPage() {
  const [activeSection, setActiveSection] = useState<string>('overview')
  const [activeSubSection, setActiveSubSection] = useState<'trending' | 'new-launch' | 'pre-launch' | 'team-verified' | 'exchange'>('trending')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [monitoredTokens, setMonitoredTokens] = useState<any[]>(mockTokens)
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [usingCachedData, setUsingCachedData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tokenLogos, setTokenLogos] = useState<{[key: string]: string}>({})
  
  // Real-time updates
  const [realTimeUpdates, setRealTimeUpdates] = useState<{[key: string]: any}>({})
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)

  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [showAddMonitor, setShowAddMonitor] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<string>('securityScore')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // WebSocket for real-time updates
  const { isConnected, connectionStatus, subscribe, unsubscribe, lastMessage } = useWebSocket({
    onMessage: useCallback((message: any) => {
      console.log('📡 Received WebSocket message:', message)
      
      if (message.type === 'token_update') {
        setRealTimeUpdates(prev => ({
          ...prev,
          [message.tokenId]: message.data
        }))
        setLastUpdateTime(new Date())
      } else if (message.type === 'token_refresh_start') {
        console.log(`🔄 Token refresh started: ${message.tokenId}`)
      } else if (message.type === 'token_refresh_complete') {
        console.log(`✅ Token refresh completed: ${message.tokenId}`)
      } else if (message.type === 'health_check') {
        console.log('💓 WebSocket health check received')
      }
    }, [])
  })

  // Subscribe to token updates when tokens are loaded
  useEffect(() => {
    if (isConnected && monitoredTokens.length > 0) {
      monitoredTokens.forEach(token => {
        subscribe('token', token.id || token.tokenId)
      })
      
      return () => {
        monitoredTokens.forEach(token => {
          unsubscribe('token', token.id || token.tokenId)
        })
      }
    }
  }, [isConnected, monitoredTokens, subscribe, unsubscribe])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await apiService.getBlockNetDashboard()
        setConnectionError(null) // Clear any previous errors
        // Add metadata to recentActivity items to match SecurityAlert interface
        if (data && data.recentActivity) {
          const processedData: DashboardData = {
            ...data,
            recentActivity: data.recentActivity.map(alert => ({
              id: alert.id,
              tokenAddress: alert.tokenAddress,
              alertType: alert.alertType,
              severity: alert.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
              title: alert.title,
              description: alert.description,
              timestamp: alert.timestamp,
              isRead: alert.isRead,
              metadata: {}
            }))
          }
          setDashboardData(processedData)
        } else {
          // Handle case where data exists but no recentActivity
          const processedData: DashboardData = {
            ...data,
            recentActivity: []
          }
          setDashboardData(processedData)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setDashboardData(null)
        
        // Set connection error for better user feedback
        if (error instanceof Error && error.message.includes('Backend server is not running')) {
          setConnectionError('Backend server is not running. Some features may be limited.')
        }
      }
    }

    fetchDashboardData()
  }, [])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch tokens using new simple token system with price data
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true)
        console.log('🔄 Fetching tokens with price data from simple token API...')
        
        const response = await getAllTokensWithPrice()
        console.log('📊 Simple Token API Response with Price:', response)
        
        if (response && response.success && response.tokens) {
          // Convert TokenWithPrice to TokenMetrics format for compatibility
          const convertedTokens = response.tokens.map((token: any) => ({
            id: token.id,
            uniqueId: token.uniqueId, // Add uniqueId for logo lookup
            coinGeckoId: token.coinGeckoId,
            tokenAddress: token.contractAddress,
            name: token.name,
            symbol: token.symbol,
            network: token.network,
            totalSupply: '0',
            circulatingSupply: '0',
            marketCap: token.marketCap || 0,
            price: token.price || 0,
            priceChange24h: token.priceChange24h || 0,
            volume24h: token.volume24h || 0,
            liquidityUSD: 0,
            holderCount: token.holderCount || 0,
            transactionCount24h: 0,
            largeTransactions24h: 0,
            securityScore: 85, // Default security score
            riskLevel: token.riskLevel,
            lastUpdated: token.lastPriceUpdate || token.updatedAt,
            dexPairs: []
          }))
          
          console.log('✅ Fetched tokens:', convertedTokens.length)
          console.log('💰 Sample token data:', convertedTokens[0])
          
          setMonitoredTokens(convertedTokens)
          setUsingCachedData(false)
          
          // Load ONLY uploaded logos from database
          const logoPromises = convertedTokens.map(async (token) => {
            try {
              console.log(`🔍 Loading uploaded logo for ${token.name} (${token.uniqueId})`)
              // Only fetch uploaded logos from database, no external sources
              const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
              const response = await fetch(`${apiBaseUrl}/api/blocknet/token-logos/${token.uniqueId}`)
              
              if (response.ok) {
                const data = await response.json()
                if (data.success && data.logoUrl) {
                  const logoUrl = `${apiBaseUrl}${data.logoUrl}`
                  console.log(`✅ Uploaded logo loaded for ${token.name}: ${logoUrl}`)
                  return { tokenId: token.uniqueId, logoUrl }
                }
              }
              
              // No uploaded logo found, use default
              console.log(`⚠️ No uploaded logo found for ${token.name}, using default`)
              return { tokenId: token.uniqueId, logoUrl: '/token-logo/base.png' }
            } catch (error) {
              console.warn(`⚠️ Failed to load uploaded logo for ${token.uniqueId}:`, error)
              return { tokenId: token.uniqueId, logoUrl: '/token-logo/base.png' }
            }
          })
          
          const logoResults = await Promise.all(logoPromises)
          const logoMap = logoResults.reduce((acc, { tokenId, logoUrl }) => {
            acc[tokenId] = logoUrl
            return acc
          }, {} as {[key: string]: string})
          
          setTokenLogos(logoMap)
          console.log('✅ Loaded logos for', Object.keys(logoMap).length, 'tokens')
        } else {
          console.log('⚠️ No tokens in response')
          setMonitoredTokens([])
          setUsingCachedData(false)
        }
      } catch (error) {
        console.error('❌ Failed to fetch tokens:', error)
        setMonitoredTokens([])
        setUsingCachedData(false)
      } finally {
        setLoading(false)
      }
    }

    fetchTokens()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-500 border-red-500/30'
      case 'HIGH': return 'bg-orange-500/20 text-orange-500 border-orange-500/30'
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
      case 'LOW': return 'bg-green-500/20 text-green-500 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30'
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-500'
      case 'HIGH': return 'bg-orange-500/20 text-orange-500'
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-500'
      case 'LOW': return 'bg-green-500/20 text-green-500'
      default: return 'bg-gray-500/20 text-gray-500'
    }
  }

  const getSecurityGrade = (score: number) => {
    if (score >= 90) return { grade: 'AAA', color: 'text-green-500' }
    if (score >= 80) return { grade: 'AA', color: 'text-green-400' }
    if (score >= 70) return { grade: 'A', color: 'text-blue-500' }
    if (score >= 60) return { grade: 'BBB', color: 'text-yellow-500' }
    if (score >= 50) return { grade: 'BB', color: 'text-orange-500' }
    if (score >= 40) return { grade: 'B', color: 'text-red-400' }
    return { grade: 'CCC', color: 'text-red-500' }
  }

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString()}`
    return `$${price.toFixed(2)}`
  }

  const sortedTokens = [...monitoredTokens].sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]
    
    if (sortBy === 'securityScore') {
      aValue = a.securityScore
      bValue = b.securityScore
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (authMode === 'signup' && authForm.password !== authForm.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    try {
      // Mock authentication - replace with real API call
      if (authMode === 'signin') {
        // Simulate sign in
        const mockUser = {
          id: '1',
          email: authForm.email,
          name: 'John Doe',
          avatar: null
        }
        setUser(mockUser)
        setIsAuthenticated(true)
        setShowAuthModal(false)
        setAuthForm({ email: '', password: '', confirmPassword: '' })
      } else {
        // Simulate sign up
        const mockUser = {
          id: '1',
          email: authForm.email,
          name: 'John Doe',
          avatar: null
        }
        setUser(mockUser)
        setIsAuthenticated(true)
        setShowAuthModal(false)
        setAuthForm({ email: '', password: '', confirmPassword: '' })
      }
    } catch (error) {
      console.error('Authentication error:', error)
    }
  }

  const handleSignOut = () => {
    setUser(null)
    setIsAuthenticated(false)
    setShowUserMenu(false)
  }

  const handleSignIn = () => {
    setShowAuthModal(true)
    setAuthMode('signin')
  }

  const handleTokenClick = (token: TokenMetrics) => {
    // Use uniqueId from the simple token system
    const tokenId = token.coinGeckoId || token.symbol.toLowerCase()
    console.log('🔗 Navigating to token details:', {
      coinGeckoId: token.coinGeckoId,
      symbol: token.symbol,
      using: tokenId
    })
    
    window.location.href = `/blocknet/${tokenId}`
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#0D0E0E] via-[#0F1011] to-[#0D0E0E] flex overflow-hidden">
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isAuthenticated={isAuthenticated}
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        />
      )}

      {/* Left Sidebar - Full Height (Desktop Only) */}
      <div className="hidden md:flex">
        <BlockNetSidebar
          activeSection={activeSection}
          activeSubSection={activeSubSection}
          onSectionChange={setActiveSection}
          onSubSectionChange={(subSection) => setActiveSubSection(subSection as any)}
        />
      </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col md:ml-0">
          {/* Banner and Header - Full Width */}
          <div className="w-full">
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

            {/* Connection Error Banner */}
            {connectionError && (
              <div className="bg-red-500/20 border-b border-red-500/30 px-6 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-300 text-sm font-medium">
                      ⚠️ {connectionError}
                    </span>
                  </div>
                  <button 
                    onClick={() => setConnectionError(null)}
                    className="text-red-300 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}



            {/* Header */}
            <div className="bg-[#0F1011] border-b border-gray-800">
              <div className="flex items-center justify-between h-16 px-6">
                {/* Search Bar */}
                <div className="hidden md:flex items-center">
                  <AdvancedSearch />
                </div>

                {/* Auth Section */}
                <div className="flex items-center gap-4">
                  <ConnectionStatus className="text-xs" />
                  <NotificationBell />
                  {isAuthenticated ? (
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="hidden sm:block">{user?.name}</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-90' : ''}`} />
                      </button>
                      
                      {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-black border border-gray-700 rounded-lg shadow-lg">
                          <div className="py-2">
                            <div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
                              {user?.email}
                            </div>
                                                    <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors">
                          Dashboard
                        </button>
                        <button 
                          onClick={() => window.open('/blocknet/admin', '_blank')}
                          className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors"
                        >
                          Admin Panel
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors">
                          Settings
                        </button>
                            <button 
                              onClick={handleSignOut}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowAuthModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="flex flex-1 h-full">
            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full">
              {/* Top Bar */}
              <div className="bg-[#0F1011] border-b border-gray-800 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-white capitalize">
                  {activeSection} - {activeSubSection.replace('-', ' ')}
                </h2>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {sortedTokens.length} Projects
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => {
                    clearTokensCache()
                    window.location.reload()
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <div className="flex items-center border border-white/20 rounded-lg">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="text-white"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="text-white"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

                      {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Header with controls - always visible */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Token Monitoring</h1>
                  <p className="text-slate-400 mt-1">Real-time security analysis and market data</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-black/20 border border-white/10 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Sort Controls */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-40 bg-black/20 border-white/10 text-white hover:bg-white/10"
                    >
                      Sort: {sortBy === 'securityScore' ? 'Security Score' : 
                             sortBy === 'price' ? 'Price' : 
                             sortBy === 'marketCap' ? 'Market Cap' : 'Volume 24h'}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {sortOrder === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Token Data Area - Loading state only here */}
              {loading ? (
                /* Loading State */
                viewMode === 'list' ? (
                  /* Table Loading Skeleton */
                  <div className="bg-[#111213] rounded-lg border border-gray-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-900 border-b border-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Project
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Security Score
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Market Cap
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Volume 24h
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Holders
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Risk Level
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <TableRowSkeleton key={i} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Grid Loading Skeleton */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <TokenSkeleton key={i} />
                    ))}
                  </div>
                )
              ) : (
              viewMode === 'list' ? (
                /* List View - Compact Table */
                <div className="bg-[#111213] rounded-lg border border-gray-800 overflow-visible shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900 border-b border-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Project
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Security Score
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Market Cap
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Volume 24h
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Holders
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            DEX Pairs
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Details
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Risk Level
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {sortedTokens.map((token, index) => {
                          const grade = getSecurityGrade(token.securityScore)
                          return (
                            <tr 
                              key={token.address || `${token.symbol}-${index}`} 
                              className="hover:bg-white/5 transition-colors cursor-pointer"
                              onClick={() => handleTokenClick(token)}
                            >
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full overflow-hidden">
                                    <img 
                                      src={tokenLogos[token.uniqueId] || '/token-logo/base.png'} 
                                      alt={`${token.name} logo`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to text if image fails to load
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-800 rounded-full flex items-center justify-center"><span class="text-primary font-semibold text-sm">${token.symbol.charAt(0)}</span></div>`
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-white font-medium">{token.name}</span>
                                    </div>
                                    <p className="text-slate-400 text-xs">{token.symbol}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center">
                                  <SemicircleProgress 
                                    score={token.securityScore} 
                                    size={32} 
                                    strokeWidth={3}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div>
                                  <span className="text-white font-medium">{formatPrice(token.price)}</span>
                                  <div className={`flex items-center gap-1 text-xs ${
                                    token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                                  }`}>
                                    {token.priceChange24h >= 0 ? (
                                      <TrendingUpIcon className="h-3 w-3" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3" />
                                    )}
                                    {Math.abs(token.priceChange24h).toFixed(2)}%
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span className="text-white">{formatNumber(token.marketCap)}</span>
                              </td>
                              <td className="px-3 py-2">
                                <span className="text-white">{formatNumber(token.volume24h)}</span>
                              </td>
                              <td className="px-3 py-2">
                                <span className="text-white">{token.holderCount.toLocaleString()}</span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-white text-sm font-medium">
                                      {token.dexPairs ? token.dexPairs.length : 0} pairs
                                    </span>
                                    {token.dexPairs && token.dexPairs.length > 0 && (
                                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                        {token.dexPairs[0].dexId}
                                      </Badge>
                                    )}
                                  </div>
                                  {token.dexPairs && token.dexPairs.length > 0 && (
                                    <div className="text-xs text-gray-400">
                                      ${formatNumber(token.dexPairs[0].liquidity?.usd || 0)} liquidity
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Rank:</span>
                                    <span className="text-white text-sm">#{token.rank || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Contract:</span>
                                    <span className="text-white text-sm">{token.contractScore || 'N/A'}/100</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Audits:</span>
                                    <span className="text-white text-sm">{token.auditsCount || 0}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <Badge className={getRiskLevelColor(token.riskLevel)}>
                                  {token.riskLevel}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedTokens.map((token, index) => {
                    const grade = getSecurityGrade(token.securityScore)
                    
                    // Use mobile card on mobile devices
                    if (isMobile) {
                      return (
                        <MobileTokenCard
                          key={token.address || `${token.symbol}-${index}`}
                          token={{
                            id: token.address || token.symbol.toLowerCase(),
                            name: token.name,
                            symbol: token.symbol,
                            price: token.price,
                            priceChange24h: token.priceChange24h,
                            marketCap: token.marketCap,
                            volume24h: token.volume24h,
                            network: token.network,
                            category: token.category || 'Cryptocurrency',
                            riskLevel: token.riskLevel,
                            score: token.securityScore,
                            dexPairs: token.dexPairs
                          }}
                          onClick={() => handleTokenClick(token)}
                        />
                      )
                    }
                    
                    return (
                      <Card key={token.address || `${token.symbol}-${index}`} className="bg-black/20 border-white/10 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img 
                                  src={tokenLogos[token.uniqueId] || '/token-logo/base.png'} 
                                  alt={`${token.name} logo`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to text if image fails to load
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-800 rounded-full flex items-center justify-center"><span class="text-primary font-semibold">${token.symbol.charAt(0)}</span></div>`
                                  }}
                                />
                              </div>
                              <div>
                                <h3 className="text-white font-semibold">{token.name}</h3>
                                <p className="text-slate-400 text-sm">{token.symbol}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-sm">Security Score</span>
                              <div className="flex items-center gap-2">
                                <SemicircleProgress 
                                  score={token.securityScore} 
                                  size={32} 
                                  strokeWidth={3}
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-sm">Price</span>
                              <div className="text-right">
                                <span className="text-white font-medium">{formatPrice(token.price)}</span>
                                <div className={`flex items-center gap-1 text-xs ${
                                  token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  {token.priceChange24h >= 0 ? (
                                    <TrendingUpIcon className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {Math.abs(token.priceChange24h).toFixed(2)}%
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-sm">Market Cap</span>
                              <span className="text-white">{formatNumber(token.marketCap)}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-sm">Risk Level</span>
                              <Badge className={getRiskLevelColor(token.riskLevel)}>
                                {token.riskLevel}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                            <Button size="sm" variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                              <BookmarkPlus className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )
            )}
            </div>
            </div>

            {/* Right Sidebar - Activity Feed */}
            <div className="w-80 bg-[#111213] border-l border-gray-800 flex flex-col h-full overflow-y-auto">
              <div className="p-4">
                <ActivityFeed />
              </div>
            </div>
        </div>
      </div>



      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111213] border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Email</label>
                <Input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Password</label>
                <Input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Confirm Password</label>
                  <Input
                    type="password"
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                {authMode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
