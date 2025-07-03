"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Brain, 
  Zap, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Code, 
  Copy,
  Eye,
  EyeOff,
  TrendingUp,
  Clock,
  Shield
} from "lucide-react"
import { motion } from "framer-motion"
import { getSeverityBadgeVariant } from "@/lib/utils"

interface AIAnalysisProps {
  vulnerability: {
    id: number
    title: string
    severity: 'high' | 'medium' | 'low'
    description: string
    line: number
    file: string
    recommendation: string
    aiConfidence?: number
    aiRiskScore?: number
    enhancedDescription?: string
    smartRemediation?: string
  }
}

export function AIAnalysisCard({ vulnerability }: AIAnalysisProps) {
  const [showRemediation, setShowRemediation] = useState(false)
  const [showCode, setShowCode] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You can add a toast notification here
  }



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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI-Powered Analysis</CardTitle>
            </div>
            <Badge variant={getSeverityBadgeVariant(vulnerability.severity)}>
              {vulnerability.severity.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* AI Confidence Score */}
          {vulnerability.aiConfidence && (
            <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getConfidenceColor(vulnerability.aiConfidence)}`}>
                  {Math.round(vulnerability.aiConfidence * 100)}%
                </span>
                <div className="w-16 h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${vulnerability.aiConfidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Risk Score */}
          {vulnerability.aiRiskScore && (
            <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Risk Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getRiskLevel(vulnerability.aiRiskScore).color}`}>
                  {vulnerability.aiRiskScore}/100
                </span>
                <Badge variant="outline" className={getRiskLevel(vulnerability.aiRiskScore).color}>
                  {getRiskLevel(vulnerability.aiRiskScore).level}
                </Badge>
              </div>
            </div>
          )}

          {/* Enhanced Description */}
          {vulnerability.enhancedDescription && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI-Enhanced Analysis</span>
              </div>
              <div className="p-3 bg-background/30 rounded-lg">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {vulnerability.enhancedDescription}
                </p>
              </div>
            </div>
          )}

          {/* Smart Remediation */}
          {vulnerability.smartRemediation && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI-Powered Remediation</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRemediation(!showRemediation)}
                >
                  {showRemediation ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {showRemediation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="p-3 bg-background/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">Recommended Fix</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(vulnerability.smartRemediation || '')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {vulnerability.smartRemediation.split('\n').map((line, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Code Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Vulnerable Code</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Line {vulnerability.line}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCode(!showCode)}
                >
                  {showCode ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {showCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-3 bg-background/30 rounded-lg">
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                    <code>{vulnerability.recommendation}</code>
                  </pre>
                </div>
              </motion.div>
            )}
          </div>

          {/* AI Model Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>AI Analysis Time: ~2.3s</span>
            </div>
                            <span>Model: BlitzProof-AI-v1.0</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 