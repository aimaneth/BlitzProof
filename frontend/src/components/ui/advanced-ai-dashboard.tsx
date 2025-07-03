"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Brain, 
  Target, 
  Code, 
  Eye,
  TrendingUp,
  Clock,
  Activity,
  BarChart3
} from "lucide-react"
import { motion } from "framer-motion"
import { getSeverityColor, getSeverityBadgeVariant } from "@/lib/utils"

interface AIAnalysisData {
  confidence: number
  severity: 'high' | 'medium' | 'low'
  description: string
  remediation: string
  riskScore: number
  aiModel: string
  analysisTime: number
  enhancedDescription?: string
  smartRemediation?: string
  codeFixes?: string[]
  falsePositiveRisk?: number
  exploitabilityScore?: number
  impactScore?: number
  references?: string[]
  cweIds?: string[]
  tags?: string[]
}

interface AdvancedAIDashboardProps {
  vulnerabilities: any[]
  aiAnalysis: AIAnalysisData[]
  onRefresh?: () => void
}

export function AdvancedAIDashboard({ 
  vulnerabilities, 
  aiAnalysis, 
  onRefresh 
}: AdvancedAIDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'remediation'>('overview')

  const tabs = [
    { id: 'overview', label: 'AI Overview', icon: Brain },
    { id: 'analysis', label: 'Deep Analysis', icon: Activity },
    { id: 'remediation', label: 'Smart Fixes', icon: Code }
  ]

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Critical', color: 'text-red-400' }
    if (score >= 60) return { level: 'High', color: 'text-orange-400' }
    if (score >= 40) return { level: 'Medium', color: 'text-yellow-400' }
    return { level: 'Low', color: 'text-green-400' }
  }

  const stats = {
    totalVulnerabilities: vulnerabilities.length,
    aiAnalyzed: aiAnalysis.length,
    avgConfidence: aiAnalysis.reduce((sum, a) => sum + a.confidence, 0) / aiAnalysis.length || 0,
    avgRiskScore: aiAnalysis.reduce((sum, a) => sum + a.riskScore, 0) / aiAnalysis.length || 0,
    avgAnalysisTime: aiAnalysis.reduce((sum, a) => sum + a.analysisTime, 0) / aiAnalysis.length || 0,
    highConfidence: aiAnalysis.filter(a => a.confidence >= 0.8).length,
    criticalRisks: aiAnalysis.filter(a => a.riskScore >= 80).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Advanced AI Analysis</h2>
            <p className="text-muted-foreground">Powered by BlitzProof-AI-v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Analyzed</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.aiAnalyzed}</p>
                </div>
                <Brain className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Confidence</p>
                  <p className="text-2xl font-bold text-green-400">{Math.round(stats.avgConfidence * 100)}%</p>
                </div>
                <Target className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Risk Score</p>
                  <p className="text-2xl font-bold text-orange-400">{Math.round(stats.avgRiskScore)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Analysis Time</p>
                  <p className="text-2xl font-bold text-purple-400">{Math.round(stats.avgAnalysisTime)}ms</p>
                </div>
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-lg">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex items-center gap-2"
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      AI Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">High Confidence Findings</span>
                      <Badge variant="outline" className="text-green-400">
                        {stats.highConfidence}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Critical Risk Issues</span>
                      <Badge variant="outline" className="text-red-400">
                        {stats.criticalRisks}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Analysis Coverage</span>
                      <Badge variant="outline">
                        {Math.round((stats.aiAnalyzed / stats.totalVulnerabilities) * 100)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Risk Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {['Critical', 'High', 'Medium', 'Low'].map((level) => {
                      const count = aiAnalysis.filter(a => {
                        const riskLevel = getRiskLevel(a.riskScore).level
                        return riskLevel === level
                      }).length
                      return (
                        <div key={level} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{level}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  level === 'Critical' ? 'bg-red-500' :
                                  level === 'High' ? 'bg-orange-500' :
                                  level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${(count / aiAnalysis.length) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-4">
              {aiAnalysis.slice(0, 10).map((analysis, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-card/30 rounded-lg border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${getSeverityColor(analysis.severity)}`} />
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {vulnerabilities.find(v => v.id === index + 1)?.title || 'AI Analysis'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {analysis.enhancedDescription || analysis.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeVariant(analysis.severity)}>
                        {analysis.severity.toUpperCase()}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getConfidenceColor(analysis.confidence)}`}>
                          {Math.round(analysis.confidence * 100)}%
                        </span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              analysis.confidence >= 0.8 ? 'bg-green-500' :
                              analysis.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${analysis.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Risk Score:</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getRiskLevel(analysis.riskScore).color}`}>
                          {analysis.riskScore}/100
                        </span>
                        <Badge variant="outline" className={getRiskLevel(analysis.riskScore).color}>
                          {getRiskLevel(analysis.riskScore).level}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Exploitability:</span>
                      <span className="font-semibold text-foreground">
                        {analysis.exploitabilityScore || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Analysis Time:</span>
                      <span className="font-semibold text-foreground">
                        {analysis.analysisTime}ms
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'remediation' && (
            <div className="space-y-4">
              {aiAnalysis.slice(0, 5).map((analysis, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-muted/20 rounded-lg border border-border/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {vulnerabilities.find(v => v.id === index + 1)?.title || 'Vulnerability'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {analysis.smartRemediation || analysis.remediation}
                      </p>
                    </div>
                    <Badge variant={getSeverityBadgeVariant(analysis.severity)}>
                      {analysis.severity.toUpperCase()}
                    </Badge>
                  </div>

                  {analysis.codeFixes && analysis.codeFixes.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-foreground">Code Fixes:</h5>
                      <div className="space-y-1">
                        {analysis.codeFixes.slice(0, 3).map((fix, fixIndex) => (
                          <div key={fixIndex} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span className="text-muted-foreground">{fix}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.tags && analysis.tags.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-foreground mb-2">Tags:</h5>
                      <div className="flex flex-wrap gap-1">
                        {analysis.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {analysis.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{analysis.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 