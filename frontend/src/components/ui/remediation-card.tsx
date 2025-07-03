'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { 
  ChevronDown, 
  ChevronUp, 
  Code, 
  BookOpen, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  FileText
} from 'lucide-react'
import { getSeverityBgColor, getSeverityBorderColor, getSeverityColor } from '@/lib/utils'

interface RemediationData {
  description: string
  steps: string[]
  bestPractices: string[]
  references: string[]
}

interface RemediationCardProps {
  title: string
  severity: 'high' | 'medium' | 'low'
  description: string
  line?: number
  remediation?: RemediationData | null
}



const severityIcons = {
  high: AlertTriangle,
  medium: Shield,
  low: CheckCircle
}

export function RemediationCard({ 
  title, 
  severity, 
  description, 
  line, 
  remediation 
}: RemediationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'steps' | 'practices' | 'code' | 'references'>('steps')
  
  const SeverityIcon = severityIcons[severity]

  const tabs = [
    { id: 'steps', label: 'Fix Steps', icon: FileText },
    { id: 'practices', label: 'Best Practices', icon: Shield },
    { id: 'code', label: 'Code Examples', icon: Code },
    { id: 'references', label: 'References', icon: BookOpen }
  ] as const

  return (
    <Card className={`!border-l-4 !border-t-0 !border-r-0 !border-b-0 ${getSeverityBorderColor(severity)} bg-card/50 backdrop-blur-sm`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <SeverityIcon className={`h-5 w-5 ${getSeverityColor(severity)}`} />
              <CardTitle className="text-lg font-semibold text-foreground">
                {title}
              </CardTitle>
              <Badge className={getSeverityBgColor(severity)}>
                {severity.toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {description}
            </p>
            {line && (
              <p className="text-xs text-muted-foreground mt-1">
                Line {line}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && remediation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <CardContent className="pt-0">
              {/* Tab Navigation */}
              <div className="flex gap-1 mb-4 p-1 bg-muted/20 rounded-lg">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2 text-xs"
                    >
                      <TabIcon className="h-3 w-3" />
                      {tab.label}
                    </Button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {activeTab === 'steps' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Step-by-Step Fix Guide</h4>
                    <div className="space-y-2">
                      {remediation.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                          <p className="text-sm text-foreground">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'practices' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Security Best Practices</h4>
                    <div className="space-y-2">
                      {remediation.bestPractices.map((practice, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-foreground">{practice}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Code Examples</h4>
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <pre className="text-sm text-gray-300 overflow-x-auto">
                        <code>{`// Example code will be displayed here
// This would show vulnerable vs secure patterns`}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {activeTab === 'references' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Additional Resources</h4>
                    <div className="space-y-2">
                      {remediation.references.map((reference, index) => (
                        <a
                          key={index}
                          href={reference}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-muted/20 hover:bg-muted/40 rounded-lg transition-colors group"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                            {reference.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
} 