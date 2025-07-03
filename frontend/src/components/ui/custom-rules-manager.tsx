"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Input } from "./input"
import { Label } from "./label"
import { Badge } from "./badge"
import { Switch } from "./switch"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertTriangle, 
  Info,
  Save,
  X,
  TestTube,
  Code,
  Filter,
  Search,
  Download,
  Upload,
  Settings,
  Zap,
  Target,
  Brain,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/lib/api"

interface CustomRule {
  id?: string
  name: string
  description: string
  pattern: string
  regex?: string
  severity: 'high' | 'medium' | 'low'
  category: string
  enabled: boolean
  isPublic: boolean
  tags: string[]
  examples: string[]
  remediation: string
  confidence: number
  createdAt?: Date
  updatedAt?: Date
}

interface CustomRulesManagerProps {
  onRuleSelect?: (rule: CustomRule) => void
  onRulesChange?: (rules: CustomRule[]) => void
  selectedRules?: string[]
}

export function CustomRulesManager({ onRuleSelect, onRulesChange, selectedRules = [] }: CustomRulesManagerProps) {
  const [rules, setRules] = useState<CustomRule[]>([])
  const [filteredRules, setFilteredRules] = useState<CustomRule[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [viewingRule, setViewingRule] = useState<CustomRule | null>(null)

  // Form state for creating/editing rules
  const [formData, setFormData] = useState<CustomRule>({
    name: "",
    description: "",
    pattern: "",
    regex: "",
    severity: "medium",
    category: "",
    enabled: true,
    isPublic: false,
    tags: [],
    examples: [],
    remediation: "",
    confidence: 0.8
  })

  // Load rules on component mount
  useEffect(() => {
    loadRules()
  }, [])

  // Filter rules based on search and filters
  useEffect(() => {
    let filtered = rules

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(rule => 
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter(rule => rule.severity === severityFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(rule => rule.category === categoryFilter)
    }

    // Public filter
    if (showPublicOnly) {
      filtered = filtered.filter(rule => rule.isPublic)
    }

    setFilteredRules(filtered)
  }, [rules, searchTerm, severityFilter, categoryFilter, showPublicOnly])

  const loadRules = async () => {
    setIsLoading(true)
    try {
      const response = await apiService.getCustomRules()
      setRules(response.rules || [])
    } catch (error) {
      console.error('Failed to load custom rules:', error)
      
      // Check if it's a connection error (backend not running)
      if (error instanceof Error && error.message.includes('Cannot GET')) {
        toast.error('Backend server not available. Please start the backend server.')
        // Set some default rules for development
        setRules([
          {
            id: 'demo-001',
            name: 'Demo Rule - Unsafe Delegatecall',
            description: 'Detects unsafe delegatecall usage without proper access controls',
            pattern: 'delegatecall',
            regex: '\\bdelegatecall\\s*\\(',
            severity: 'high' as const,
            category: 'unsafe-delegatecall',
            enabled: true,
            isPublic: false, // Private by default for security
            tags: ['delegatecall', 'proxy', 'security'],
            examples: [
              'target.delegatecall(data)',
              'address(this).delegatecall(abi.encodeWithSignature("function()"))'
            ],
            remediation: 'Ensure delegatecall is only used with trusted contracts and proper access controls',
            confidence: 0.9
          },
          {
            id: 'demo-002',
            name: 'Demo Rule - Unchecked Return Values',
            description: 'Detects external calls without return value checks',
            pattern: 'external call without check',
            regex: '\\b(call|send|transfer)\\s*\\([^)]*\\)(?!\\s*;\\s*require)',
            severity: 'medium' as const,
            category: 'unchecked-return',
            enabled: true,
            isPublic: false, // Private by default for security
            tags: ['external-call', 'return-value', 'error-handling'],
            examples: [
              'recipient.transfer(amount)',
              'target.call{value: amount}(data)'
            ],
            remediation: 'Always check return values from external calls and handle failures appropriately',
            confidence: 0.8
          }
        ])
      } else {
        toast.error('Failed to load custom rules')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRule = async () => {
    if (!formData.name || !formData.pattern) {
      toast.error('Name and pattern are required')
      return
    }

    try {
      const newRule = await apiService.createCustomRule(formData)
      setRules(prev => [...prev, newRule])
      setShowCreateForm(false)
      resetForm()
      toast.success('Custom rule created successfully')
      onRulesChange?.(rules)
    } catch (error) {
      console.error('Failed to create rule:', error)
      if (error instanceof Error && error.message.includes('Cannot POST')) {
        toast.error('Backend server not available. Please start the backend server.')
      } else {
        toast.error('Failed to create custom rule')
      }
    }
  }

  const handleUpdateRule = async () => {
    if (!editingRule?.id) return

    try {
      const updatedRule = await apiService.updateCustomRule(editingRule.id, formData)
      setRules(prev => prev.map(rule => rule.id === editingRule.id ? updatedRule : rule))
      setEditingRule(null)
      resetForm()
      toast.success('Custom rule updated successfully')
      onRulesChange?.(rules)
    } catch (error) {
      console.error('Failed to update rule:', error)
      if (error instanceof Error && error.message.includes('Cannot PUT')) {
        toast.error('Backend server not available. Please start the backend server.')
      } else {
        toast.error('Failed to update custom rule')
      }
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    const ruleName = rule?.name || 'this rule'
    
    if (!confirm(`Are you sure you want to delete "${ruleName}"? This action cannot be undone.`)) return

    try {
      await apiService.deleteCustomRule(ruleId)
      setRules(prev => prev.filter(rule => rule.id !== ruleId))
      toast.success(`Rule "${ruleName}" deleted successfully`)
      onRulesChange?.(rules)
    } catch (error) {
      console.error('Failed to delete rule:', error)
      if (error instanceof Error && error.message.includes('Cannot DELETE')) {
        toast.error('Backend server not available. Please start the backend server.')
      } else {
        toast.error('Failed to delete custom rule')
      }
    }
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    const rule = rules.find(r => r.id === ruleId)
    const ruleName = rule?.name || 'rule'
    
    try {
      const updatedRule = await apiService.updateCustomRule(ruleId, { enabled })
      setRules(prev => prev.map(rule => rule.id === ruleId ? updatedRule : rule))
      onRulesChange?.(rules)
      toast.success(`Rule "${ruleName}" ${enabled ? 'enabled' : 'disabled'} successfully`)
    } catch (error) {
      console.error('Failed to toggle rule:', error)
      if (error instanceof Error && error.message.includes('Cannot PUT')) {
        toast.error('Backend server not available. Please start the backend server.')
      } else {
        toast.error('Failed to update rule status')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      pattern: "",
      regex: "",
      severity: "medium",
      category: "",
      enabled: true,
      isPublic: false, // Private by default for security
      tags: [],
      examples: [],
      remediation: "",
      confidence: 0.8
    })
  }

  const openEditForm = (rule: CustomRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description,
      pattern: rule.pattern,
      regex: rule.regex || "",
      severity: rule.severity,
      category: rule.category,
      enabled: rule.enabled,
      isPublic: rule.isPublic,
      tags: [...rule.tags],
      examples: [...rule.examples],
      remediation: rule.remediation,
      confidence: rule.confidence
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'medium': return <Shield className="h-4 w-4" />
      case 'low': return <Info className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const categories = Array.from(new Set(rules.map(rule => rule.category))).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Custom Rules</h2>
            <p className="text-muted-foreground">Create and manage custom security rules</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground">Severity</Label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full mt-1 bg-muted border border-border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Category</Label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full mt-1 bg-muted border border-border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showPublicOnly}
                  onCheckedChange={setShowPublicOnly}
                />
                <Label className="text-sm">Public Rules Only</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Loading rules...</span>
            </div>
          </div>
        ) : filteredRules.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No rules found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || severityFilter !== "all" || categoryFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Create your first custom security rule"}
              </p>
              {!searchTerm && severityFilter === "all" && categoryFilter === "all" && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Rule
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredRules.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-card/50 hover:bg-card/70 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${getSeverityColor(rule.severity)}`}>
                          {getSeverityIcon(rule.severity)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{rule.name}</h3>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.enabled ? "default" : "outline"}>
                            {rule.enabled ? "Active" : "Inactive"}
                          </Badge>
                          {rule.isPublic && (
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Pattern:</span>
                          <code className="ml-2 bg-muted px-2 py-1 rounded text-xs font-mono">
                            {rule.pattern}
                          </code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <span className="ml-2 font-medium">{rule.category}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="ml-2 font-medium">{Math.round(rule.confidence * 100)}%</span>
                        </div>
                      </div>

                      {rule.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rule.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingRule(rule)}
                        title="View rule details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(rule)}
                        title="Edit rule"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRule(rule.id!, !rule.enabled)}
                        title={rule.enabled ? "Disable rule" : "Enable rule"}
                        className={rule.enabled ? "text-green-400 hover:text-green-300" : "text-gray-400 hover:text-gray-300"}
                      >
                        {rule.enabled ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id!)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {(showCreateForm || editingRule) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowCreateForm(false)
              setEditingRule(null)
              resetForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  {editingRule ? 'Edit Rule' : 'Create New Rule'}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingRule(null)
                    resetForm()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Rule Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Unsafe Delegatecall Detection"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Category</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., delegatecall, reentrancy"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this rule detects..."
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Pattern *</Label>
                    <Input
                      value={formData.pattern}
                      onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
                      placeholder="e.g., delegatecall"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Regex (Optional)</Label>
                    <Input
                      value={formData.regex}
                      onChange={(e) => setFormData(prev => ({ ...prev, regex: e.target.value }))}
                      placeholder="e.g., \\bdelegatecall\\s*\\("
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Severity</Label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                      className="w-full mt-1 bg-muted border border-border rounded px-3 py-2 text-sm"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Confidence</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.confidence}
                        onChange={(e) => setFormData(prev => ({ ...prev, confidence: parseFloat(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">
                        {Math.round(formData.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.isPublic}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                      />
                      <Label className="text-sm">Public Rule</Label>
                    </div>
                  </div>
                </div>

                {formData.isPublic && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-orange-400 mb-1">Security Warning</p>
                        <p className="text-orange-300/80">
                          Public rules are visible to all users. This may expose your security detection patterns. 
                          Consider keeping sensitive rules private.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    }))}
                    placeholder="security, delegatecall, proxy"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Examples (comma-separated)</Label>
                  <Input
                    value={formData.examples.join(', ')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      examples: e.target.value.split(',').map(example => example.trim()).filter(Boolean)
                    }))}
                    placeholder="target.delegatecall(data), address(this).delegatecall(...)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Remediation</Label>
                  <Input
                    value={formData.remediation}
                    onChange={(e) => setFormData(prev => ({ ...prev, remediation: e.target.value }))}
                    placeholder="How to fix this vulnerability..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingRule(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingRule ? handleUpdateRule : handleCreateRule}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Rule Details Modal */}
      <AnimatePresence>
        {viewingRule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setViewingRule(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Rule Details</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingRule(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{viewingRule.name}</h3>
                  <p className="text-muted-foreground">{viewingRule.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Category</Label>
                    <p className="font-medium">{viewingRule.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Severity</Label>
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getSeverityColor(viewingRule.severity)}`}>
                        {getSeverityIcon(viewingRule.severity)}
                      </div>
                      <span className="capitalize font-medium">{viewingRule.severity}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Pattern</Label>
                  <code className="block bg-muted px-3 py-2 rounded text-sm font-mono mt-1">
                    {viewingRule.pattern}
                  </code>
                </div>

                {viewingRule.regex && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Regex Pattern</Label>
                    <code className="block bg-muted px-3 py-2 rounded text-sm font-mono mt-1">
                      {viewingRule.regex}
                    </code>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Confidence</Label>
                    <p className="font-medium">{Math.round(viewingRule.confidence * 100)}%</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={viewingRule.enabled ? "default" : "outline"}>
                        {viewingRule.enabled ? "Active" : "Inactive"}
                      </Badge>
                      {viewingRule.isPublic && (
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {viewingRule.tags.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {viewingRule.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {viewingRule.examples.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Examples</Label>
                    <div className="space-y-2 mt-1">
                      {viewingRule.examples.map((example, index) => (
                        <code key={index} className="block bg-muted px-3 py-2 rounded text-sm font-mono">
                          {example}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {viewingRule.remediation && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Remediation</Label>
                    <p className="mt-1">{viewingRule.remediation}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setViewingRule(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewingRule(null)
                    openEditForm(viewingRule)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Rule
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
