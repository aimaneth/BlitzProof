"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import { Header } from "@/components/layout/header"
import { useWallet } from "@/hooks/use-wallet"
import { apiService, ScanHistory } from "@/lib/api"
import { 
  Shield, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  User,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Target,
  Activity,
  Zap,
  Eye,
  Download,
  Share2,
  Filter,
  Upload
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getSeverityBgColor } from "@/lib/utils"

interface DashboardStats {
  totalScans: number
  completedScans: number
  averageScore: number
  totalVulnerabilities: number
  highVulnerabilities: number
  mediumVulnerabilities: number
  lowVulnerabilities: number
  trendingVulnerabilities: { name: string; count: number }[]
  recentActivity: (ScanHistory & {
    vulnerabilities?: {
      high: number
      medium: number
      low: number
      total: number
    }
    securityScore?: number
  })[]
}

export default function DashboardPage() {
  const { isConnected, isAuthenticated, address, shortAddress } = useWallet()
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d'>('30d')

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500/10 border-green-500/20'
    if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/20'
    return 'bg-red-500/10 border-red-500/20'
  }

  useEffect(() => {
    if (isConnected && isAuthenticated) {
      fetchScanHistory()
    } else if (!isConnected) {
      setLoading(false)
    }
  }, [isConnected, isAuthenticated, timeFilter])

  const fetchScanHistory = async () => {
    try {
      setLoading(true)
      const response = await apiService.getUserScans()
      setScanHistory(response.scans)
      
      const total = response.scans.length
      const completed = response.scans.filter((scan: ScanHistory) => scan.status === 'completed').length
      const failed = response.scans.filter((scan: ScanHistory) => scan.status === 'failed').length
      
      const scores = response.scans
        .filter((scan: ScanHistory) => scan.status === 'completed' && scan.scan_results && typeof scan.scan_results === 'object' && 'score' in scan.scan_results)
        .map((scan: ScanHistory) => (scan.scan_results as { score: number }).score)
      const averageScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0
      
      const vulnerabilities = response.scans
        .filter((scan: ScanHistory) => scan.status === 'completed' && scan.scan_results && typeof scan.scan_results === 'object' && 'summary' in scan.scan_results)
        .map((scan: ScanHistory) => (scan.scan_results as { summary: { high: number; medium: number; low: number; total: number } }).summary)
      
      const totalVulnerabilities = vulnerabilities.reduce((sum: number, vuln: { total: number }) => sum + vuln.total, 0)
      const highVulnerabilities = vulnerabilities.reduce((sum: number, vuln: { high: number }) => sum + vuln.high, 0)
      const mediumVulnerabilities = vulnerabilities.reduce((sum: number, vuln: { medium: number }) => sum + vuln.medium, 0)
      const lowVulnerabilities = vulnerabilities.reduce((sum: number, vuln: { low: number }) => sum + vuln.low, 0)
      
      // Calculate trending vulnerabilities from real scan data
      const allVulnerabilities = response.scans
        .filter((scan: ScanHistory) => scan.status === 'completed' && scan.scan_results && typeof scan.scan_results === 'object' && 'vulnerabilities' in scan.scan_results)
        .flatMap((scan: ScanHistory) => (scan.scan_results as { vulnerabilities: any[] }).vulnerabilities || [])
      
      // Count vulnerability occurrences
      const vulnerabilityCounts: { [key: string]: number } = {}
      allVulnerabilities.forEach((vuln: any) => {
        const title = vuln.title || 'Unknown Vulnerability'
        vulnerabilityCounts[title] = (vulnerabilityCounts[title] || 0) + 1
      })
      
      // Get top 5 most common vulnerabilities with counts
      const trendingVulnerabilities = Object.entries(vulnerabilityCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([title, count]) => ({ name: title, count }))
      
      // Fallback to common vulnerabilities if no data
      if (trendingVulnerabilities.length === 0) {
        trendingVulnerabilities.push(
          { name: 'Reentrancy Vulnerability', count: 0 },
          { name: 'Unchecked External Call', count: 0 },
          { name: 'Integer Overflow', count: 0 },
          { name: 'Missing Access Control', count: 0 },
          { name: 'Timestamp Dependence', count: 0 }
        )
      }
      
      const recentActivity = response.scans.slice(-5).reverse().map((scan: ScanHistory) => ({
        ...scan,
        vulnerabilities: (scan.scan_results as any)?.summary || { high: 0, medium: 0, low: 0, total: 0 },
        securityScore: (scan.scan_results as any)?.score || 0
      }))
      
      setStats({
        totalScans: total,
        completedScans: completed,
        averageScore: Math.round(averageScore),
        totalVulnerabilities,
        highVulnerabilities,
        mediumVulnerabilities,
        lowVulnerabilities,
        trendingVulnerabilities,
        recentActivity
      })
    } catch (error) {
      console.error('Error fetching scan history:', error)
      
      // Set default stats when no data is available
      setStats({
        totalScans: 0,
        completedScans: 0,
        averageScore: 0,
        totalVulnerabilities: 0,
        highVulnerabilities: 0,
        mediumVulnerabilities: 0,
        lowVulnerabilities: 0,
        trendingVulnerabilities: [
          { name: 'Reentrancy Vulnerability', count: 0 },
          { name: 'Unchecked External Call', count: 0 },
          { name: 'Integer Overflow', count: 0 },
          { name: 'Missing Access Control', count: 0 },
          { name: 'Timestamp Dependence', count: 0 }
        ],
        recentActivity: []
      })
      
      // Only show error toast if it's not a network error (backend not running)
      if (error instanceof Error && !error.message.includes('Failed to fetch')) {
        toast.error('Failed to load scan history')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'scanning': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'failed': return 'text-red-500'
      case 'scanning': return 'text-blue-500'
      default: return 'text-yellow-500'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Wallet connection and authentication checks
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-8">
              <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Connect Your Wallet
              </h2>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                Connect your wallet to access your security dashboard and view your smart contract analysis history.
              </p>
              <div className="flex justify-center">
                <ConnectWallet />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while authenticating
  if (isConnected && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Authenticating...
              </h2>
              <p className="text-muted-foreground text-sm">
                Setting up your account with wallet {shortAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Enhanced Header with Sleek Background */}
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
          
          {/* Animated Background Patterns */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          
          {/* Content */}
          <div className="relative z-10 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Shield className="h-12 w-12 text-primary relative z-10" />
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold gradient-text-subtle">
                      Security Dashboard
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-primary to-blue-500 rounded-full mt-2"></div>
                  </div>
                </div>
                
                <p className="text-xl text-muted-foreground mb-6 max-w-2xl">
                  Monitor your smart contract security analysis and track improvements over time
                </p>
                
                <div className="flex items-center gap-8 text-sm">
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-green-500/20 rounded-full">
                      <BarChart3 className="h-4 w-4 text-green-400" />
                    </div>
                    <span className="text-white/80 font-medium">Analytics</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-blue-500/20 rounded-full">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="text-white/80 font-medium">Trends</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-purple-500/20 rounded-full">
                      <Activity className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-white/80 font-medium">Real-time</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg">
                  <Link href="/scanner">
                    <Upload className="h-4 w-4 mr-2" />
                    Scan Now
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 backdrop-blur-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 backdrop-blur-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground">Time period:</span>
          {(['7d', '30d', '90d'] as const).map((period) => (
            <Button
              key={period}
              variant={timeFilter === period ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeFilter(period)}
            >
              {period}
            </Button>
          ))}
        </div>

        {stats && (
          <>
            {/* Empty State */}
            {stats.totalScans === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="max-w-md mx-auto">
                  <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No Scans Yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Start by scanning your first smart contract to see your security analytics here.
                  </p>
                  <Button asChild>
                    <Link href="/scanner">
                      <Upload className="h-4 w-4 mr-2" />
                      Start Scanning
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Dashboard Content - Only show if there are scans */}
            {stats.totalScans > 0 && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-card/50 backdrop-blur-sm rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Scans
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.totalScans}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats.completedScans} completed
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-card/50 backdrop-blur-sm rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Average Security Score
                        </CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                          {stats.averageScore}/100
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stats.averageScore >= 90 ? 'Excellent' : 
                           stats.averageScore >= 70 ? 'Good' : 'Needs improvement'}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="bg-card/50 backdrop-blur-sm rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Vulnerabilities
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.totalVulnerabilities}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats.highVulnerabilities} high priority
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="bg-card/50 backdrop-blur-sm rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Success Rate
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                          {Math.round((stats.completedScans / stats.totalScans) * 100)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stats.totalScans - stats.completedScans} failed
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Vulnerability Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2"
                  >
                    <Card className="bg-card/50 backdrop-blur-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Vulnerability Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full" />
                              <span className="text-sm font-medium">High Severity</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{stats.highVulnerabilities}</span>
                              <span className="text-xs text-muted-foreground">
                                ({Math.round((stats.highVulnerabilities / stats.totalVulnerabilities) * 100)}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(stats.highVulnerabilities / stats.totalVulnerabilities) * 100}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                              <span className="text-sm font-medium">Medium Severity</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{stats.mediumVulnerabilities}</span>
                              <span className="text-xs text-muted-foreground">
                                ({Math.round((stats.mediumVulnerabilities / stats.totalVulnerabilities) * 100)}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(stats.mediumVulnerabilities / stats.totalVulnerabilities) * 100}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full" />
                              <span className="text-sm font-medium">Low Severity</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{stats.lowVulnerabilities}</span>
                              <span className="text-xs text-muted-foreground">
                                ({Math.round((stats.lowVulnerabilities / stats.totalVulnerabilities) * 100)}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(stats.lowVulnerabilities / stats.totalVulnerabilities) * 100}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Card className="bg-card/50 backdrop-blur-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Trending Vulnerabilities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {stats.trendingVulnerabilities.map((vuln, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full" />
                                <span className="text-sm text-foreground">{vuln.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                {vuln.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Scan Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats.recentActivity.map((scan) => (
                          <div key={scan.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                {scan.status === 'completed' ? (
                                  <CheckCircle className="h-5 w-5 text-green-400" />
                                ) : scan.status === 'failed' ? (
                                  <AlertTriangle className="h-5 w-5 text-red-400" />
                                ) : (
                                  <Clock className="h-5 w-5 text-yellow-400" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">{scan.contract_name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(scan.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                                         <div className={`text-sm font-bold ${getScoreColor(scan.securityScore || 0)}`}>
                                 {scan.securityScore || 0}/100
                               </div>
                               <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                 <span>{scan.vulnerabilities?.total || 0} issues</span>
                               </div>
                             </div>
                             <div className="flex items-center gap-1">
                               {scan.vulnerabilities?.high && scan.vulnerabilities.high > 0 && (
                                 <Badge className={getSeverityBgColor('high')}>
                                   {scan.vulnerabilities.high}H
                                 </Badge>
                               )}
                               {scan.vulnerabilities?.medium && scan.vulnerabilities.medium > 0 && (
                                 <Badge className={getSeverityBgColor('medium')}>
                                   {scan.vulnerabilities.medium}M
                                 </Badge>
                               )}
                               {scan.vulnerabilities?.low && scan.vulnerabilities.low > 0 && (
                                 <Badge className={getSeverityBgColor('low')}>
                                   {scan.vulnerabilities.low}L
                                 </Badge>
                               )}
                             </div>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
} 