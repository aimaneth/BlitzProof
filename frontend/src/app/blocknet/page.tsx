"use client"

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/layout'
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
  Info
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

export default function BlockNetPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'monitors' | 'alerts' | 'ranking'>('dashboard')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [monitoredTokens, setMonitoredTokens] = useState<TokenMonitor[]>([])
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [tokenRanking, setTokenRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [showAddMonitor, setShowAddMonitor] = useState(false)
  const [newMonitor, setNewMonitor] = useState({
    tokenAddress: '',
    tokenName: '',
    tokenSymbol: '',
    network: 'ethereum',
    contractType: 'ERC20'
  })

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await apiService.getBlockNetDashboard()
        setDashboardData(data)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      }
    }

    fetchDashboardData()
  }, [])

  // Fetch monitored tokens
  useEffect(() => {
    const fetchMonitoredTokens = async () => {
      try {
        const data = await apiService.getMonitoredTokens()
        setMonitoredTokens(data.tokens || [])
      } catch (error) {
        console.error('Failed to fetch monitored tokens:', error)
      }
    }

    fetchMonitoredTokens()
  }, [])

  // Fetch security alerts
  useEffect(() => {
    const fetchSecurityAlerts = async () => {
      try {
        const data = await apiService.getSecurityAlerts()
        setSecurityAlerts(data.alerts || [])
      } catch (error) {
        console.error('Failed to fetch security alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSecurityAlerts()
  }, [])

  // Fetch token ranking
  useEffect(() => {
    const fetchTokenRanking = async () => {
      try {
        const data = await apiService.getTokenRanking()
        setTokenRanking(data.ranking || [])
      } catch (error) {
        console.error('Failed to fetch token ranking:', error)
      }
    }

    fetchTokenRanking()
  }, [])

  const handleAddMonitor = async () => {
    try {
      await apiService.addTokenMonitor(newMonitor)
      setShowAddMonitor(false)
      setNewMonitor({
        tokenAddress: '',
        tokenName: '',
        tokenSymbol: '',
        network: 'ethereum',
        contractType: 'ERC20'
      })
      // Refresh monitored tokens
      const data = await apiService.getMonitoredTokens()
      setMonitoredTokens(data.tokens || [])
    } catch (error) {
      console.error('Failed to add token monitor:', error)
    }
  }

  const handleMarkAlertAsRead = async (alertId: string) => {
    try {
      await apiService.markAlertAsRead(alertId)
      // Refresh alerts
      const data = await apiService.getSecurityAlerts()
      setSecurityAlerts(data.alerts || [])
    } catch (error) {
      console.error('Failed to mark alert as read:', error)
    }
  }

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

  const filteredAlerts = securityAlerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.tokenAddress.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity
    return matchesSearch && matchesSeverity
  })

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  BlockNet
                </h1>
                <p className="text-slate-400 mt-1">Protocol Monitoring & Security Intelligence</p>
              </div>
              <Button 
                onClick={() => setShowAddMonitor(true)}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Token Monitor
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-white/10 bg-black/10">
          <div className="container mx-auto px-4">
            <div className="flex space-x-8">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'monitors', label: 'Token Monitors', icon: Target },
                { id: 'alerts', label: 'Security Alerts', icon: AlertTriangle },
                { id: 'ranking', label: 'Token Ranking', icon: TrendingUp }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-400">Monitored Tokens</p>
                        <p className="text-2xl font-bold text-white">{dashboardData?.totalMonitored || 0}</p>
                      </div>
                      <Target className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-400">Total Alerts</p>
                        <p className="text-2xl font-bold text-white">{dashboardData?.totalAlerts || 0}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-400">Critical Alerts</p>
                        <p className="text-2xl font-bold text-white">{dashboardData?.criticalAlerts || 0}</p>
                      </div>
                      <Zap className="h-8 w-8 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-400">High Risk Tokens</p>
                        <p className="text-2xl font-bold text-white">{dashboardData?.highRiskTokens || 0}</p>
                      </div>
                      <Shield className="h-8 w-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-card/30 border border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Activity className="h-5 w-5 text-primary" />
                    Recent Security Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.recentActivity?.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-center gap-4 p-4 bg-card/50 rounded-lg">
                        <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{alert.title}</p>
                          <p className="text-slate-400 text-sm">{alert.description}</p>
                          <p className="text-slate-500 text-xs mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'monitors' && (
            <div className="space-y-6">
              <Card className="bg-card/30 border border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Target className="h-5 w-5 text-primary" />
                    Monitored Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {monitoredTokens.map((token) => (
                      <Card key={token.id} className="bg-card/50 border border-white/10 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-white font-semibold">{token.tokenName}</h3>
                              <p className="text-slate-400 text-sm">{token.tokenSymbol}</p>
                            </div>
                            <Badge className="bg-primary/20 text-primary border-primary/30">
                              {token.network}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p className="text-slate-400">
                              <span className="text-slate-300">Address:</span> {token.tokenAddress.slice(0, 8)}...{token.tokenAddress.slice(-6)}
                            </p>
                            <p className="text-slate-400">
                              <span className="text-slate-300">Type:</span> {token.contractType}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300">Status:</span>
                              {token.monitoringEnabled ? (
                                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-6">
              {/* Filters */}
              <Card className="bg-card/30 border border-white/10">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search alerts..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-card/50 border-white/10 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value)}
                      className="px-3 py-2 bg-card/50 border border-white/10 rounded-md text-white"
                    >
                      <option value="all">All Severities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Alerts List */}
              <Card className="bg-card/30 border border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Security Alerts ({filteredAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredAlerts.map((alert) => (
                      <Card key={alert.id} className="bg-card/50 border border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-white font-semibold">{alert.title}</h3>
                                  <Badge className={getSeverityColor(alert.severity)}>
                                    {alert.severity}
                                  </Badge>
                                  {!alert.isRead && (
                                    <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-slate-400 text-sm mb-2">{alert.description}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span>Token: {alert.tokenAddress.slice(0, 8)}...{alert.tokenAddress.slice(-6)}</span>
                                  <span>{new Date(alert.timestamp).toLocaleString()}</span>
                                  {alert.usdValue && (
                                    <span>Value: ${alert.usdValue.toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!alert.isRead && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAlertAsRead(alert.id)}
                                  className="border-white/20 text-white hover:bg-white/10"
                                >
                                  Mark Read
                                </Button>
                              )}
                              {alert.transactionHash && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/20 text-white hover:bg-white/10"
                                >
                                  <ArrowUpRight className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className="space-y-6">
              <Card className="bg-card/30 border border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Token Security Ranking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tokenRanking.map((token, index) => (
                      <Card key={token.id} className="bg-card/50 border border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="text-white font-semibold">{token.tokenName}</h3>
                                <p className="text-slate-400 text-sm">{token.tokenSymbol}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-white font-semibold">{token.metrics?.securityScore || 0}/100</p>
                                <p className="text-slate-400 text-sm">Security Score</p>
                              </div>
                              <Badge className={getRiskLevelColor(token.metrics?.riskLevel)}>
                                {token.metrics?.riskLevel || 'UNKNOWN'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Add Monitor Modal */}
        {showAddMonitor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="bg-card/95 border border-white/10 w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-white">Add Token Monitor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Token Address</label>
                  <Input
                    placeholder="0x..."
                    value={newMonitor.tokenAddress}
                    onChange={(e) => setNewMonitor({...newMonitor, tokenAddress: e.target.value})}
                    className="bg-card/50 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Token Name</label>
                  <Input
                    placeholder="Token Name"
                    value={newMonitor.tokenName}
                    onChange={(e) => setNewMonitor({...newMonitor, tokenName: e.target.value})}
                    className="bg-card/50 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Token Symbol</label>
                  <Input
                    placeholder="SYMBOL"
                    value={newMonitor.tokenSymbol}
                    onChange={(e) => setNewMonitor({...newMonitor, tokenSymbol: e.target.value})}
                    className="bg-card/50 border-white/10 text-white"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-slate-300 mb-1 block">Network</label>
                    <select
                      value={newMonitor.network}
                      onChange={(e) => setNewMonitor({...newMonitor, network: e.target.value})}
                      className="w-full px-3 py-2 bg-card/50 border border-white/10 rounded-md text-white"
                    >
                      <option value="ethereum">Ethereum</option>
                      <option value="polygon">Polygon</option>
                      <option value="bsc">BSC</option>
                      <option value="arbitrum">Arbitrum</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-slate-300 mb-1 block">Contract Type</label>
                    <select
                      value={newMonitor.contractType}
                      onChange={(e) => setNewMonitor({...newMonitor, contractType: e.target.value})}
                      className="w-full px-3 py-2 bg-card/50 border border-white/10 rounded-md text-white"
                    >
                      <option value="ERC20">ERC20</option>
                      <option value="ERC721">ERC721</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleAddMonitor}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  >
                    Add Monitor
                  </Button>
                  <Button
                    onClick={() => setShowAddMonitor(false)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
