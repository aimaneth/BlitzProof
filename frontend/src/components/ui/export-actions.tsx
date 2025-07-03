'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { 
  Share2, 
  FileText, 
  Check
} from "lucide-react"
import { apiService } from '@/lib/api'
import { toast } from 'sonner'

interface ExportActionsProps {
  scanId: string
  className?: string
}

export function ExportActions({ scanId, className = '' }: ExportActionsProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleExport = async (format: 'pdf' | 'json') => {
    try {
      setIsExporting(format)
      
      const blob = await apiService.exportScanResults(scanId, format)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
              link.download = `blitzproof-scan-${scanId}.${format}`
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

  const handleShare = async () => {
    try {
      const { shareableLink } = await apiService.generateShareableLink(scanId)
      
      if (navigator.share) {
        await navigator.share({
          title: 'BlitzProof Security Scan',
          text: 'Check out this smart contract security analysis',
          url: shareableLink
        })
      } else {
        await navigator.clipboard.writeText(shareableLink)
        setCopied(true)
        toast.success('Shareable link copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error('Share error:', error)
      toast.error('Failed to generate shareable link')
    }
  }

  const exportOptions = [
    {
      format: 'pdf' as const,
      label: 'PDF Report',
      icon: FileText,
      description: 'Professional security report'
    },
    {
      format: 'json' as const,
      label: 'JSON Data',
      icon: FileText,
      description: 'Raw data format'
    }
  ]

  return (
    <div className={`bg-card/30 border border-white/10 rounded-xl p-4 shadow-lg ${className}`}>
      {/* Row 1: Title and Share */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Export & Share</h3>
        <Button
          onClick={handleShare}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-card/50 border-white/20 hover:bg-card/70"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Share'}
        </Button>
      </div>

      {/* Row 2: Export Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {exportOptions.map(({ format, label, icon: Icon, description }) => (
          <Button
            key={format}
            onClick={() => handleExport(format)}
            disabled={isExporting === format}
            variant="outline"
            className="flex flex-col items-center gap-2 p-3 h-auto bg-card/50 border-white/20 hover:bg-card/70 transition-colors"
          >
            {isExporting === format ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon className="w-5 h-5 text-blue-400" />
            )}
            <div className="text-center">
              <div className="font-medium text-white text-sm">{label}</div>
              <div className="text-xs text-gray-400">{description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
} 