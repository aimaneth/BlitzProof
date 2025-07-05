"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Switch } from './switch'
import { Label } from './label'
import { 
  FileText, 
  Download, 
  Share2, 
  Check,
  Settings,
  Eye,
  Brain,
  BarChart3,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'

interface ExportTemplate {
  name: string
  description: string
  sections: string[]
  includeCharts: boolean
  includeAIInsights: boolean
  includeRemediation: boolean
}

interface EnhancedExportActionsProps {
  scanId: string
  className?: string
}

export function EnhancedExportActions({ scanId, className = '' }: EnhancedExportActionsProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('technical')
  const [includeAIInsights, setIncludeAIInsights] = useState(true)
  const [includeCustomRules, setIncludeCustomRules] = useState(true)
  const [includeCharts, setIncludeCharts] = useState(true)
  const [templates, setTemplates] = useState<ExportTemplate[]>([])

  const loadTemplates = async () => {
    try {
      const response = await apiService.getExportTemplates()
      setTemplates(response.templates || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
      // Set default templates if API fails
      setTemplates([
        {
          name: 'Executive Summary',
          description: 'High-level overview for stakeholders',
          sections: ['summary', 'risk-score', 'critical-findings'],
          includeCharts: true,
          includeAIInsights: true,
          includeRemediation: false
        },
        {
          name: 'Technical Report',
          description: 'Detailed technical analysis for developers',
          sections: ['summary', 'vulnerabilities', 'ai-analysis', 'remediation'],
          includeCharts: true,
          includeAIInsights: true,
          includeRemediation: true
        },
        {
          name: 'Comprehensive Audit',
          description: 'Complete audit report with all details',
          sections: ['summary', 'vulnerabilities', 'ai-analysis', 'custom-rules', 'remediation', 'charts'],
          includeCharts: true,
          includeAIInsights: true,
          includeRemediation: true
        }
      ])
    }
  }

  const handleExport = async (format: 'pdf' | 'html' | 'csv') => {
    try {
      setIsExporting(format)
      
      const params = new URLSearchParams({
        template: selectedTemplate,
        includeAIInsights: includeAIInsights.toString(),
        includeCustomRules: includeCustomRules.toString(),
        includeCharts: includeCharts.toString()
      })

      const response = await fetch(`/api/export/enhanced/${scanId}/${format}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `blitzproof-audit-${scanId}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`${format.toUpperCase()} report downloaded successfully`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(`Failed to export ${format.toUpperCase()} report`)
    } finally {
      setIsExporting(null)
    }
  }

  const getTemplateIcon = (templateName: string) => {
    switch (templateName.toLowerCase()) {
      case 'executive':
        return <Eye className="h-4 w-4" />
      case 'technical':
        return <Settings className="h-4 w-4" />
      case 'comprehensive':
        return <Shield className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const selectedTemplateData = templates.find(t => t.name.toLowerCase().includes(selectedTemplate)) || templates[0]

  return (
    <div className={`bg-card/30 border border-white/10 rounded-xl p-4 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Enhanced Export</h3>
          <p className="text-sm text-gray-400">Professional reports with AI insights</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 bg-card/50 border-white/20 hover:bg-card/70"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Advanced
        </Button>
      </div>

      {/* Template Selection */}
      <div className="mb-4">
        <Label className="text-sm text-gray-300 mb-2 block">Report Template</Label>
        <div className="grid grid-cols-1 gap-2">
          {templates.map((template) => (
            <div
              key={template.name}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTemplateData?.name === template.name
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/20 bg-card/50 hover:bg-card/70'
              }`}
              onClick={() => setSelectedTemplate(template.name.toLowerCase().split(' ')[0])}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-500/20 rounded-full">
                  {getTemplateIcon(template.name)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{template.name}</div>
                  <div className="text-xs text-gray-400">{template.description}</div>
                </div>
                {selectedTemplateData?.name === template.name && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <Label className="text-sm">AI Insights</Label>
              </div>
              <Switch
                checked={includeAIInsights}
                onCheckedChange={setIncludeAIInsights}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <Label className="text-sm">Custom Rules</Label>
              </div>
              <Switch
                checked={includeCustomRules}
                onCheckedChange={setIncludeCustomRules}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-400" />
                <Label className="text-sm">Charts & Analytics</Label>
              </div>
              <Switch
                checked={includeCharts}
                onCheckedChange={setIncludeCharts}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          onClick={() => handleExport('pdf')}
          disabled={isExporting === 'pdf'}
          variant="outline"
          className="flex flex-col items-center gap-2 p-3 h-auto bg-card/50 border-white/20 hover:bg-card/70 transition-colors"
        >
          {isExporting === 'pdf' ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileText className="w-5 h-5 text-blue-400" />
          )}
          <div className="text-center">
            <div className="font-medium text-white text-sm">PDF Report</div>
            <div className="text-xs text-gray-400">Professional</div>
          </div>
        </Button>

        <Button
          onClick={() => handleExport('html')}
          disabled={isExporting === 'html'}
          variant="outline"
          className="flex flex-col items-center gap-2 p-3 h-auto bg-card/50 border-white/20 hover:bg-card/70 transition-colors"
        >
          {isExporting === 'html' ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Zap className="w-5 h-5 text-green-400" />
          )}
          <div className="text-center">
            <div className="font-medium text-white text-sm">HTML Report</div>
            <div className="text-xs text-gray-400">Interactive</div>
          </div>
        </Button>

        <Button
          onClick={() => handleExport('csv')}
          disabled={isExporting === 'csv'}
          variant="outline"
          className="flex flex-col items-center gap-2 p-3 h-auto bg-card/50 border-white/20 hover:bg-card/70 transition-colors"
        >
          {isExporting === 'csv' ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5 text-orange-400" />
          )}
          <div className="text-center">
            <div className="font-medium text-white text-sm">CSV Data</div>
            <div className="text-xs text-gray-400">Spreadsheet</div>
          </div>
        </Button>
      </div>

      {/* Template Info */}
      {selectedTemplateData && (
        <div className="mt-4 p-3 bg-card/30 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            {getTemplateIcon(selectedTemplateData.name)}
            <span className="text-sm font-medium text-white">{selectedTemplateData.name}</span>
          </div>
          <p className="text-xs text-gray-400 mb-2">{selectedTemplateData.description}</p>
          <div className="flex flex-wrap gap-1">
            {selectedTemplateData.sections.map((section) => (
              <Badge key={section} variant="outline" className="text-xs">
                {section}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 