"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  Shield,
  AlertTriangle,
  Loader2
} from 'lucide-react'

interface ScanProgress {
  scanId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  currentStep: string
  estimatedTime?: number
  vulnerabilitiesFound: number
  toolsCompleted: string[]
  currentTool?: string
  error?: string
}

interface RealTimeProgressProps {
  scanId: string
  isVisible: boolean
  onComplete?: (results: any) => void
  onError?: (error: string) => void
}

export function RealTimeProgress({ scanId, isVisible, onComplete, onError }: RealTimeProgressProps) {
  const [progress, setProgress] = useState<ScanProgress | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // WebSocket connection with reconnection logic
  useEffect(() => {
    if (!isVisible || !scanId) return

    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5

    const connect = () => {
      // Determine WebSocket URL based on environment
      let wsUrl: string
      if (process.env.NODE_ENV === 'production') {
        // In production, connect to the backend URL (Render)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'blitzproof-backend.onrender.com'
        // Remove https:// prefix if present
        const cleanBackendUrl = backendUrl.replace(/^https?:\/\//, '')
        wsUrl = `${protocol}//${cleanBackendUrl}`
      } else {
        // In development, use localhost
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = process.env.NEXT_PUBLIC_API_URL || 'localhost:4000'
        // Remove https:// prefix if present
        const cleanHost = host.replace(/^https?:\/\//, '')
        wsUrl = `${protocol}//${cleanHost}`
      }

      console.log('🔌 Attempting WebSocket connection to:', wsUrl)
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('🔌 WebSocket connected for real-time progress')
        setIsConnected(true)
        reconnectAttempts = 0
        
        // Subscribe to scan updates
        if (ws) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            scanId
          }))
        }
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'scan_progress') {
            setProgress({
              scanId: message.scanId,
              status: message.status,
              progress: message.progress || 0,
              currentStep: message.currentStep || '',
              estimatedTime: message.estimatedTime,
              vulnerabilitiesFound: message.vulnerabilitiesFound || 0,
              toolsCompleted: message.toolsCompleted || [],
              currentTool: message.currentTool,
              error: message.error
            })
          } else if (message.type === 'scan_complete') {
            console.log('🔌 Scan completed, closing WebSocket connection')
            onComplete?.(message.results)
            // Close the connection gracefully since scan is done
            if (ws) {
              ws.close(1000, 'Scan completed')
            }
          } else if (message.type === 'scan_error') {
            console.log('🔌 Scan failed, closing WebSocket connection')
            onError?.(message.error)
            // Close the connection gracefully since scan failed
            if (ws) {
              ws.close(1000, 'Scan failed')
            }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        
        // Don't reconnect if scan is completed or failed
        if (progress?.status === 'completed' || progress?.status === 'failed') {
          console.log('🔌 Scan completed/failed, not reconnecting')
          return
        }
        
        // Attempt reconnection if not a normal closure and scan is still running
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000) // Exponential backoff
          console.log(`🔌 Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (ws) {
        ws.close(1000, 'Component unmounting')
      }
    }
  }, [scanId, isVisible, onComplete, onError])

  if (!isVisible || !progress) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'running': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'failed': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'running': return <Activity className="h-4 w-4 animate-pulse" />
      case 'failed': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 right-4 z-50 w-96"
      >
        <Card className="bg-card/95 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold text-white">Real-time Scan</h3>
              </div>
              <Badge className={getStatusColor(progress.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(progress.status)}
                  <span className="text-xs">{progress.status}</span>
                </div>
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{progress.currentStep}</span>
                <span>{progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <div>
                  <div className="text-xs text-gray-400">Vulnerabilities</div>
                  <div className="text-sm font-medium text-white">{progress.vulnerabilitiesFound}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <div>
                  <div className="text-xs text-gray-400">Tools Completed</div>
                  <div className="text-sm font-medium text-white">{progress.toolsCompleted.length}</div>
                </div>
              </div>
            </div>

            {/* Current Tool */}
            {progress.currentTool && (
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <span className="text-sm text-gray-300">Running: {progress.currentTool}</span>
              </div>
            )}

            {/* Estimated Time */}
            {progress.estimatedTime && (
              <div className="text-xs text-gray-400">
                Estimated time remaining: {formatTime(progress.estimatedTime)}
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-400">
                {isConnected ? 'Real-time updates connected' : 'Real-time updates disabled'}
              </span>
            </div>
            
            {/* Fallback Message */}
            {!isConnected && (
              <div className="text-xs text-gray-400 mt-1">
                Progress updates will still work via polling
              </div>
            )}

            {/* Error Display */}
            {progress.error && (
              <div className="mt-2 p-2 bg-red-400/10 border border-red-400/20 rounded text-xs text-red-400">
                Error: {progress.error}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
} 