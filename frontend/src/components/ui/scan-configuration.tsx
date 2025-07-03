"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Settings, 
  Shield, 
  Brain, 
  Clock, 
  Zap, 
  Target,
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle
} from "lucide-react"
import { motion } from "framer-motion"

interface ScanConfigurationProps {
  onSave: (config: any) => void
  onLoad: (config: any) => void
  defaultConfig?: any
}

export function ScanConfiguration({ onSave, onLoad, defaultConfig }: ScanConfigurationProps) {
  const [config, setConfig] = useState(defaultConfig || {
    name: "Custom Scan",
    description: "Advanced security scan configuration",
    tools: {
      slither: { enabled: true, detectors: "all", exclude: [], filterPaths: [] },
      mythril: { enabled: true, executionTimeout: 600, maxDepth: 10, solverTimeout: 10000 },
      oyente: { enabled: false, timeout: 300, depth: 10, gas: 6000000 },
      securify: { enabled: false, timeout: 600, maxDepth: 15 }
    },
    aiAnalysis: {
      enabled: true,
      confidenceThreshold: 0.3,
      deepAnalysis: true,
      patternMatching: true,
      historicalData: true
    },
    severityThreshold: "low",
    timeoutSeconds: 300,
    customRules: {},
    isDefault: false
  })

  const [savedConfigs, setSavedConfigs] = useState([
    {
      id: 1,
      name: "Quick Security Check",
      description: "Fast security analysis for basic vulnerabilities",
      category: "basic",
      tools: { slither: true, mythril: true, oyente: false, securify: false },
      aiAnalysis: { enabled: true, confidenceThreshold: 0.5 },
      isPublic: true,
      usageCount: 1250
    },
    {
      id: 2,
      name: "Comprehensive Audit",
      description: "Full security audit with all tools and AI analysis",
      category: "comprehensive",
      tools: { slither: true, mythril: true, oyente: true, securify: true },
      aiAnalysis: { enabled: true, confidenceThreshold: 0.3, deepAnalysis: true },
      isPublic: true,
      usageCount: 890
    },
    {
      id: 3,
      name: "DeFi Protocol Scan",
      description: "Specialized scan for DeFi protocols and financial contracts",
      category: "defi",
      tools: { slither: true, mythril: true, oyente: false, securify: false },
      aiAnalysis: { enabled: true, defiPatterns: true, financialRiskAnalysis: true },
      isPublic: true,
      usageCount: 567
    }
  ])

  const [activeTab, setActiveTab] = useState<'tools' | 'ai' | 'advanced' | 'templates'>('tools')
  const [copiedConfig, setCopiedConfig] = useState<number | null>(null)

  const tabs = [
    { id: 'tools', label: 'Security Tools', icon: Shield },
    { id: 'ai', label: 'AI Analysis', icon: Brain },
    { id: 'advanced', label: 'Advanced', icon: Settings },
    { id: 'templates', label: 'Templates', icon: Copy }
  ]

  const updateConfig = (path: string, value: any) => {
    setConfig((prev: any) => {
      const newConfig = { ...prev }
      const keys = path.split('.')
      let current = newConfig
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newConfig
    })
  }

  const handleSave = () => {
    onSave(config)
  }

  const handleLoadTemplate = (template: any) => {
    setConfig({
      ...config,
      ...template,
      name: `${template.name} (Copy)`,
      isDefault: false
    })
    onLoad(template)
  }

  const copyTemplate = (templateId: number) => {
    setCopiedConfig(templateId)
    setTimeout(() => setCopiedConfig(null), 2000)
  }

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'slither': return '🐍'
      case 'mythril': return '🗡️'
      case 'oyente': return '🔍'
      case 'securify': return '🛡️'
      default: return '⚙️'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Scan Configuration</h2>
            <p className="text-muted-foreground">Customize your security scan settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setConfig(defaultConfig || {})}>
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Configuration Form */}
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
          {activeTab === 'tools' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(config.tools).map(([toolName, toolConfig]: [string, any]) => (
                  <motion.div
                    key={toolName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-card/30 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getToolIcon(toolName)}</span>
                        <div>
                          <h3 className="font-semibold text-foreground capitalize">{toolName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {toolName === 'slither' && 'Static analysis for Solidity'
                            || toolName === 'mythril' && 'Symbolic execution analysis'
                            || toolName === 'oyente' && 'Symbolic execution tool'
                            || toolName === 'securify' && 'Security verification tool'}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={toolConfig.enabled}
                        onCheckedChange={(checked) => 
                          updateConfig(`tools.${toolName}.enabled`, checked)
                        }
                      />
                    </div>

                    {toolConfig.enabled && (
                      <div className="space-y-3">
                        {toolName === 'slither' && (
                          <>
                            <div>
                              <Label className="text-sm text-muted-foreground">Detectors</Label>
                              <Input
                                value={toolConfig.detectors}
                                onChange={(e) => updateConfig(`tools.${toolName}.detectors`, e.target.value)}
                                placeholder="all"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Exclude Patterns</Label>
                              <Input
                                value={toolConfig.exclude.join(', ')}
                                onChange={(e) => updateConfig(`tools.${toolName}.exclude`, e.target.value.split(', '))}
                                placeholder="pattern1, pattern2"
                                className="mt-1"
                              />
                            </div>
                          </>
                        )}

                        {toolName === 'mythril' && (
                          <>
                            <div>
                              <Label className="text-sm text-muted-foreground">Execution Timeout (seconds)</Label>
                              <Input
                                type="number"
                                value={toolConfig.executionTimeout}
                                onChange={(e) => updateConfig(`tools.${toolName}.executionTimeout`, parseInt(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Max Depth</Label>
                              <Input
                                type="number"
                                value={toolConfig.maxDepth}
                                onChange={(e) => updateConfig(`tools.${toolName}.maxDepth`, parseInt(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                          </>
                        )}

                        {(toolName === 'oyente' || toolName === 'securify') && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Timeout (seconds)</Label>
                            <Input
                              type="number"
                              value={toolConfig.timeout}
                              onChange={(e) => updateConfig(`tools.${toolName}.timeout`, parseInt(e.target.value))}
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Analysis Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Enable AI Analysis</Label>
                      <Switch
                        checked={config.aiAnalysis.enabled}
                        onCheckedChange={(checked) => updateConfig('aiAnalysis.enabled', checked)}
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Confidence Threshold</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={config.aiAnalysis.confidenceThreshold}
                          onChange={(e) => updateConfig('aiAnalysis.confidenceThreshold', parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-12">
                          {Math.round(config.aiAnalysis.confidenceThreshold * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Deep Analysis</Label>
                      <Switch
                        checked={config.aiAnalysis.deepAnalysis}
                        onCheckedChange={(checked) => updateConfig('aiAnalysis.deepAnalysis', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Pattern Matching</Label>
                      <Switch
                        checked={config.aiAnalysis.patternMatching}
                        onCheckedChange={(checked) => updateConfig('aiAnalysis.patternMatching', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Historical Data</Label>
                      <Switch
                        checked={config.aiAnalysis.historicalData}
                        onCheckedChange={(checked) => updateConfig('aiAnalysis.historicalData', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      AI Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-blue-400" />
                        <span className="font-medium text-blue-400">Smart Remediation</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        AI-generated code fixes and security improvements
                      </p>
                    </div>

                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-green-400" />
                        <span className="font-medium text-green-400">Pattern Detection</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Advanced vulnerability pattern recognition
                      </p>
                    </div>

                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-purple-400" />
                        <span className="font-medium text-purple-400">Historical Analysis</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Learn from previous scan results and patterns
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      General Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Configuration Name</Label>
                      <Input
                        value={config.name}
                        onChange={(e) => updateConfig('name', e.target.value)}
                        placeholder="My Custom Scan"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Description</Label>
                      <Input
                        value={config.description}
                        onChange={(e) => updateConfig('description', e.target.value)}
                        placeholder="Description of this scan configuration"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Severity Threshold</Label>
                      <select
                        value={config.severityThreshold}
                        onChange={(e) => updateConfig('severityThreshold', e.target.value)}
                        className="w-full mt-1 bg-muted border border-border rounded px-3 py-2 text-sm"
                      >
                        <option value="low">Low and above</option>
                        <option value="medium">Medium and above</option>
                        <option value="high">High and above</option>
                        <option value="critical">Critical only</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Timeout (seconds)</Label>
                      <Input
                        type="number"
                        value={config.timeoutSeconds}
                        onChange={(e) => updateConfig('timeoutSeconds', parseInt(e.target.value))}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Set as Default</Label>
                      <Switch
                        checked={config.isDefault}
                        onCheckedChange={(checked) => updateConfig('isDefault', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                        <span className="font-medium text-orange-400">Scan Coverage</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {Object.values(config.tools).filter((tool: any) => tool.enabled).length} of 4 tools enabled
                      </p>
                    </div>

                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="h-4 w-4 text-green-400" />
                        <span className="font-medium text-green-400">AI Analysis</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.aiAnalysis.enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="font-medium text-blue-400">Estimated Time</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ~{Math.round(config.timeoutSeconds / 60)} minutes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedConfigs.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-card/30 rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {template.category}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Tools:</span>
                        <div className="flex gap-1">
                          {Object.entries(template.tools).map(([tool, enabled]) => (
                            <Badge 
                              key={tool} 
                              variant={enabled ? "default" : "outline"} 
                              className="text-xs"
                            >
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">AI Analysis:</span>
                        <Badge variant={template.aiAnalysis.enabled ? "default" : "outline"} className="text-xs">
                          {template.aiAnalysis.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Usage:</span>
                        <span className="text-sm font-medium">{template.usageCount} times</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleLoadTemplate(template)}
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyTemplate(template.id)}
                      >
                        {copiedConfig === template.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 