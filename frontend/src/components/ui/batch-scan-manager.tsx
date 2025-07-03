"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Input } from "./input"
import { Label } from "./label"
import { Badge } from "./badge"
import { Switch } from "./switch"
import { 
  Upload, 
  FileText, 
  Play, 
  Square, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Settings,
  Zap,
  Activity,
  FolderOpen,
  RefreshCw,
  BarChart3
} from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/lib/api"

interface BatchScanJob {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  totalFiles: number
  processedFiles: number
  failedFiles: number
  startTime: Date
  endTime?: Date
  results: BatchScanResult[]
  config: BatchScanConfig
}

interface BatchScanResult {
  fileName: string
  status: 'success' | 'failed'
  vulnerabilities: any[]
  aiAnalysis: any[]
  customRules: any[]
  scanTime: number
  error?: string
  summary: any
  riskScore: number
}

interface BatchScanConfig {
  maxConcurrentScans: number
  timeout: number
  tools: string[]
  aiAnalysis: boolean
  customRules: boolean
  severityThreshold: string
  outputFormat: 'json' | 'csv' | 'html'
  includeDetails: boolean
  parallelProcessing: boolean
}

interface BatchScanManagerProps {
  onJobComplete?: (job: BatchScanJob) => void
  onJobUpdate?: (job: BatchScanJob) => void
}

export function BatchScanManager({ onJobComplete, onJobUpdate }: BatchScanManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [activeJobs, setActiveJobs] = useState<BatchScanJob[]>([])
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<BatchScanConfig>({
    maxConcurrentScans: 5,
    timeout: 300,
    tools: ['slither', 'mythril', 'manticore', 'echidna'],
    aiAnalysis: true,
    customRules: true,
    severityThreshold: 'low',
    outputFormat: 'json',
    includeDetails: true,
    parallelProcessing: true
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => 
      file.name.endsWith('.sol') || 
      file.type === 'text/plain' ||
      file.name.endsWith('.txt')
    )
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were skipped. Only .sol and .txt files are supported.')
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
  }, [])

  const handleFileDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    const validFiles = files.filter(file => 
      file.name.endsWith('.sol') || 
      file.type === 'text/plain' ||
      file.name.endsWith('.txt')
    )
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were skipped. Only .sol and .txt files are supported.')
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => {
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const startBatchScan = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to scan')
      return
    }

    setIsUploading(true)
    try {
      const response = await apiService.startBatchScan(selectedFiles, config)
      
      const newJob: BatchScanJob = {
        jobId: response.jobId,
        status: 'pending',
        progress: 0,
        totalFiles: selectedFiles.length,
        processedFiles: 0,
        failedFiles: 0,
        startTime: new Date(),
        results: [],
        config
      }

      setActiveJobs(prev => [...prev, newJob])
      setSelectedFiles([])
      clearFiles()
      
      // Start polling for updates
      pollJobStatus(response.jobId)
      
      toast.success(`Batch scan started! Job ID: ${response.jobId}`)
    } catch (error) {
      console.error('Failed to start batch scan:', error)
      if (error instanceof Error && error.message.includes('Cannot POST')) {
        toast.error('Backend server not available. Please start the backend server.')
      } else {
        toast.error('Failed to start batch scan')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await apiService.getBatchScanStatus(jobId)
        
        setActiveJobs(prev => prev.map(job => {
          if (job.jobId === jobId) {
            const updatedJob = {
              ...job,
              status: status.status as any,
              progress: status.progress,
              processedFiles: status.processedFiles,
              results: status.results
            }
            
            onJobUpdate?.(updatedJob)
            
            if (status.status === 'completed' || status.status === 'failed') {
              clearInterval(pollInterval)
              onJobComplete?.(updatedJob)
            }
            
            return updatedJob
          }
          return job
        }))
      } catch (error) {
        console.error('Failed to poll job status:', error)
        clearInterval(pollInterval)
      }
    }, 2000) // Poll every 2 seconds
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'processing': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'failed': return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'cancelled': return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'processing': return <Activity className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      case 'cancelled': return <Square className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalFileSize = selectedFiles.reduce((total, file) => total + file.size, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Batch Scanner</h2>
            <p className="text-muted-foreground">Scan multiple contracts simultaneously</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
          <Button
            onClick={startBatchScan}
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Batch Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Configuration Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Batch Scan Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Max Concurrent Scans</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={config.maxConcurrentScans}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        maxConcurrentScans: parseInt(e.target.value) 
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Timeout (seconds)</Label>
                    <Input
                      type="number"
                      min="60"
                      max="1800"
                      value={config.timeout}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        timeout: parseInt(e.target.value) 
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Severity Threshold</Label>
                    <select
                      value={config.severityThreshold}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        severityThreshold: e.target.value 
                      }))}
                      className="w-full mt-1 bg-muted border border-border rounded px-3 py-2 text-sm"
                    >
                      <option value="low">Low and above</option>
                      <option value="medium">Medium and above</option>
                      <option value="high">High and above</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">AI Analysis</Label>
                      <Switch
                        checked={config.aiAnalysis}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          aiAnalysis: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Custom Rules</Label>
                      <Switch
                        checked={config.customRules}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          customRules: checked 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Parallel Processing</Label>
                      <Switch
                        checked={config.parallelProcessing}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          parallelProcessing: checked 
                        }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Output Format</Label>
                      <select
                        value={config.outputFormat}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          outputFormat: e.target.value as any 
                        }))}
                        className="w-full mt-1 bg-muted border border-border rounded px-3 py-2 text-sm"
                      >
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                        <option value="html">HTML</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Include Details</Label>
                      <Switch
                        checked={config.includeDetails}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          includeDetails: checked 
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Upload Area */}
      <Card className="bg-card/50">
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Drop contract files here or click to browse
            </h3>
            <p className="text-muted-foreground mb-4">
              Supports .sol and .txt files. Maximum 20 files per batch.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".sol,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card className="bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Selected Files ({selectedFiles.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Total size: {formatFileSize(totalFileSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFiles}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Active Batch Jobs ({activeJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <motion.div
                  key={job.jobId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Job {job.jobId.slice(-8)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {job.totalFiles} files • Started {job.startTime.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={job.status === 'completed' ? 'default' : 'outline'}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{job.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {job.processedFiles} / {job.totalFiles} files processed
                      </span>
                      {job.failedFiles > 0 && (
                        <span className="text-red-400">
                          {job.failedFiles} failed
                        </span>
                      )}
                    </div>
                  </div>

                  {job.status === 'completed' && job.results.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="font-medium text-sm">Results Summary</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Success:</span>
                          <span className="ml-2 font-medium text-green-400">
                            {job.results.filter(r => r.status === 'success').length}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Failed:</span>
                          <span className="ml-2 font-medium text-red-400">
                            {job.results.filter(r => r.status === 'failed').length}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Score:</span>
                          <span className="ml-2 font-medium">
                            {Math.round(
                              job.results
                                .filter(r => r.status === 'success')
                                .reduce((sum, r) => sum + r.riskScore, 0) / 
                                Math.max(job.results.filter(r => r.status === 'success').length, 1)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
