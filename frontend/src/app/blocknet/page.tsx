"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  X
} from 'lucide-react'
import { apiService } from '@/lib/api'

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

interface TokenMetrics {
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
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  lastUpdated: string
}

interface DashboardData {
  totalMonitored: number
  totalAlerts: number
  criticalAlerts: number
  highRiskTokens: number
  recentActivity: SecurityAlert[]
}

// Mock data for demonstration
const mockTokens = [
  {
    id: '1',
    tokenAddress: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8',
    tokenName: 'Ethereum',
    tokenSymbol: 'ETH',
    network: 'ethereum',
    contractType: 'Native',
    monitoringEnabled: true,
    price: 3247.85,
    priceChange24h: 2.34,
    marketCap: 389741000000,
    volume24h: 15420000000,
    securityScore: 95.2,
    riskLevel: 'LOW' as const,
    holderCount: 125000000,
    transactionCount24h: 1250000,
    largeTransactions24h: 45,
    liquidityUSD: 12500000000,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    tokenAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    tokenName: 'Uniswap',
    tokenSymbol: 'UNI',
    network: 'ethereum',
    contractType: 'ERC20',
    monitoringEnabled: true,
    price: 12.45,
    priceChange24h: -1.23,
    marketCap: 7480000000,
    volume24h: 125000000,
    securityScore: 87.6,
    riskLevel: 'LOW' as const,
    holderCount: 285000,
    transactionCount24h: 45000,
    largeTransactions24h: 12,
    liquidityUSD: 850000000,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    tokenAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    tokenName: 'Chainlink',
    tokenSymbol: 'LINK',
    network: 'ethereum',
    contractType: 'ERC20',
    monitoringEnabled: true,
    price: 18.92,
    priceChange24h: 5.67,
    marketCap: 11100000000,
    volume24h: 890000000,
    securityScore: 92.1,
    riskLevel: 'LOW' as const,
    holderCount: 425000,
    transactionCount24h: 67000,
    largeTransactions24h: 23,
    liquidityUSD: 1200000000,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '4',
    tokenAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    tokenName: 'Aave',
    tokenSymbol: 'AAVE',
    network: 'ethereum',
    contractType: 'ERC20',
    monitoringEnabled: true,
    price: 245.67,
    priceChange24h: -3.45,
    marketCap: 3640000000,
    volume24h: 156000000,
    securityScore: 89.3,
    riskLevel: 'MEDIUM' as const,
    holderCount: 125000,
    transactionCount24h: 23000,
    largeTransactions24h: 8,
    liquidityUSD: 450000000,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '5',
    tokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    tokenName: 'Wrapped Bitcoin',
    tokenSymbol: 'WBTC',
    network: 'ethereum',
    contractType: 'ERC20',
    monitoringEnabled: true,
    price: 65420.50,
    priceChange24h: 1.89,
    marketCap: 9850000000,
    volume24h: 234000000,
    securityScore: 94.7,
    riskLevel: 'LOW' as const,
    holderCount: 85000,
    transactionCount24h: 12000,
    largeTransactions24h: 34,
    liquidityUSD: 890000000,
    lastUpdated: new Date().toISOString()
  }
]

export default function BlockNetPage() {
  const [activeSection, setActiveSection] = useState<'discovery' | 'terminal' | 'pulse' | 'quest'>('discovery')
  const [activeSubSection, setActiveSubSection] = useState<'trending' | 'new-launch' | 'pre-launch' | 'team-verified' | 'exchange'>('trending')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [monitoredTokens, setMonitoredTokens] = useState<any[]>(mockTokens)
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
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

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await apiService.getBlockNetDashboard()
        // Add metadata to recentActivity items to match SecurityAlert interface
        if (data && data.recentActivity) {
          const processedData: DashboardData = {
            ...data,
            recentActivity: data.recentActivity.map(alert => ({
              ...alert,
              metadata: {}
            }))
          }
          setDashboardData(processedData)
        } else {
          setDashboardData(data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      }
    }

    fetchDashboardData()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* BlockNet Header */}
      <header className="bg-black/40 border-b border-white/10 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-white">BlockNet</h1>
                <p className="text-xs text-slate-400">Security Intelligence</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Products</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Research</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">About</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            </nav>

            {/* Auth Section */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-white hover:text-primary transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:block">{user?.name}</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-white/10 rounded-lg shadow-lg backdrop-blur-xl">
                      <div className="py-2">
                        <div className="px-4 py-2 text-sm text-slate-400 border-b border-white/10">
                          {user?.email}
                        </div>
                        <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors">
                          Dashboard
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors">
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
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-black/40 border-r border-white/10 flex flex-col min-h-screen">
          {/* Search */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search projects, tokens..."
                className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-400 text-sm"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 space-y-6">
            {/* Discovery Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Discovery</h3>
              <div className="space-y-1">
                {[
                  { id: 'discovery', label: 'Discovery', icon: Globe, active: activeSection === 'discovery' },
                  { id: 'terminal', label: 'Terminal', icon: BarChart3, active: activeSection === 'terminal' },
                  { id: 'pulse', label: 'Pulse', icon: Activity, active: activeSection === 'pulse' },
                  { id: 'quest', label: 'Quest', icon: Target, active: activeSection === 'quest' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      item.active
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboards Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Leaderboards</h3>
              <div className="space-y-1">
                {[
                  { id: 'trending', label: 'Trending', icon: TrendingUpIcon, active: activeSubSection === 'trending' },
                  { id: 'new-launch', label: 'New Launch', icon: Rocket, active: activeSubSection === 'new-launch' },
                  { id: 'pre-launch', label: 'Pre Launch', icon: Clock, active: activeSubSection === 'pre-launch' },
                  { id: 'team-verified', label: 'Team Verified', icon: CheckCircle2, active: activeSubSection === 'team-verified' },
                  { id: 'exchange', label: 'Exchange', icon: Award, active: activeSubSection === 'exchange' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSubSection(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      item.active
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tools Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tools</h3>
              <div className="space-y-1">
                {[
                  { label: 'Token Scan', icon: Search },
                  { label: 'Fundraising', icon: DollarSign },
                  { label: 'Calendar', icon: Calendar }
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Resources</h3>
              <div className="space-y-1">
                {[
                  { label: 'Top Security Score', icon: Trophy },
                  { label: 'Security Reports', icon: FileText }
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-slate-500 space-y-1">
              <p>© 2024 BlockNet</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-500">BTC $65,420</span>
                <span className="text-blue-500">ETH $3,247</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-black/20 border-b border-white/10 px-6 py-4">
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
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
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
          <div className="flex-1 p-6">
            {viewMode === 'list' ? (
              /* List View - Compact Table */
              <div className="bg-black/20 rounded-lg border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black/30 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Security Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Market Cap
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Volume 24h
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Holders
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Risk Level
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedTokens.map((token) => {
                        const grade = getSecurityGrade(token.securityScore)
                        return (
                          <tr key={token.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                                  <span className="text-primary font-semibold text-sm">
                                    {token.tokenSymbol.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{token.tokenName}</span>
                                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs">
                                      {token.network}
                                    </Badge>
                                  </div>
                                  <p className="text-slate-400 text-xs">{token.tokenSymbol}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${grade.color}`}>
                                  {token.securityScore.toFixed(1)}
                                </span>
                                <Badge className={`text-xs ${grade.color.replace('text-', 'bg-').replace('500', '500/20')} border-current/30`}>
                                  {grade.grade}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-4 py-3">
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
                            <td className="px-4 py-3">
                              <span className="text-white">{formatNumber(token.marketCap)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-white">{formatNumber(token.volume24h)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-white">{token.holderCount.toLocaleString()}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={getRiskLevelColor(token.riskLevel)}>
                                {token.riskLevel}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </div>
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
                {sortedTokens.map((token) => {
                  const grade = getSecurityGrade(token.securityScore)
                  return (
                    <Card key={token.id} className="bg-black/20 border-white/10 hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {token.tokenSymbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">{token.tokenName}</h3>
                              <p className="text-slate-400 text-sm">{token.tokenSymbol}</p>
                            </div>
                          </div>
                          <Badge className="bg-slate-700/50 text-slate-300 border-slate-600">
                            {token.network}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-sm">Security Score</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${grade.color}`}>
                                {token.securityScore.toFixed(1)}
                              </span>
                              <Badge className={`text-xs ${grade.color.replace('text-', 'bg-').replace('500', '500/20')} border-current/30`}>
                                {grade.grade}
                              </Badge>
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
            )}
          </div>
        </div>

        {/* Right Sidebar - Activity Feed */}
        <div className="w-80 bg-black/20 border-l border-white/10 p-4 space-y-6">
          <h3 className="text-lg font-semibold text-white">Activity Feed</h3>
          
          {/* Recently Audited */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Recently Audited</h4>
            <div className="space-y-2">
              {[
                { name: 'Uniswap V4', date: '2 hours ago', score: '95.2' },
                { name: 'Aave V3', date: '4 hours ago', score: '92.1' },
                { name: 'Compound V3', date: '6 hours ago', score: '89.7' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                  <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{item.name}</p>
                    <p className="text-slate-400 text-xs">{item.date}</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                    {item.score}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Security Alerts */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Security Alerts</h4>
            <div className="space-y-2">
              {[
                { severity: 'CRITICAL', message: 'Large transfer detected', time: '5 min ago' },
                { severity: 'HIGH', message: 'Suspicious activity', time: '12 min ago' },
                { severity: 'MEDIUM', message: 'Unusual gas usage', time: '25 min ago' }
              ].map((alert, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                    alert.severity === 'CRITICAL' ? 'bg-red-500/20' :
                    alert.severity === 'HIGH' ? 'bg-orange-500/20' : 'bg-yellow-500/20'
                  }`}>
                    <AlertTriangle className={`h-3 w-3 ${
                      alert.severity === 'CRITICAL' ? 'text-red-500' :
                      alert.severity === 'HIGH' ? 'text-orange-500' : 'text-yellow-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{alert.message}</p>
                    <p className="text-slate-400 text-xs">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Movers */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Top Movers</h4>
            <div className="space-y-2">
              {[
                { name: 'SOL', change: '+12.5%', price: '$184.29' },
                { name: 'AVAX', change: '+8.3%', price: '$42.15' },
                { name: 'DOT', change: '-3.2%', price: '$7.89' }
              ].map((mover, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-white text-sm">{mover.name}</span>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      mover.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {mover.change}
                    </p>
                    <p className="text-slate-400 text-xs">{mover.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/90 border border-white/10 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Email</label>
                <Input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  className="bg-slate-800/50 border-white/10 text-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Password</label>
                <Input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="bg-slate-800/50 border-white/10 text-white"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Confirm Password</label>
                  <Input
                    type="password"
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                    className="bg-slate-800/50 border-white/10 text-white"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-primary hover:text-primary/80 text-sm transition-colors"
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
