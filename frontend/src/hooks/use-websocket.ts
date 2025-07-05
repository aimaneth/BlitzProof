import { useEffect, useRef, useState, useCallback } from 'react'

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

interface WebSocketMessage {
  type: 'connection' | 'subscription' | 'scan_progress' | 'scan_complete' | 'scan_error' | 'error'
  scanId?: string
  status?: string
  progress?: number
  currentStep?: string
  estimatedTime?: number
  vulnerabilitiesFound?: number
  toolsCompleted?: string[]
  currentTool?: string
  error?: string
  results?: any
  message?: string
}

interface UseWebSocketOptions {
  onScanProgress?: (progress: ScanProgress) => void
  onScanComplete?: (scanId: string, results: any) => void
  onScanError?: (scanId: string, error: string) => void
  onConnectionChange?: (connected: boolean) => void
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

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

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('🔌 WebSocket connected')
        setIsConnected(true)
        options.onConnectionChange?.(true)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        options.onConnectionChange?.(false)
        
        // Don't reconnect if this was a normal closure (scan completed/failed)
        if (event.code === 1000) {
          console.log('🔌 Normal closure, not reconnecting')
          return
        }
        
        // Attempt to reconnect if not a normal closure
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [options])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect')
      wsRef.current = null
    }
    
    setIsConnected(false)
    setClientId(null)
    options.onConnectionChange?.(false)
  }, [options])

  const subscribeToScan = useCallback((scanId: string) => {
    if (!isConnected || !wsRef.current) {
      console.warn('WebSocket not connected, cannot subscribe to scan')
      return
    }

    const message = {
      type: 'subscribe',
      scanId
    }

    wsRef.current.send(JSON.stringify(message))
    console.log(`📡 Subscribed to scan: ${scanId}`)
  }, [isConnected])

  const unsubscribeFromScan = useCallback((scanId: string) => {
    if (!isConnected || !wsRef.current) {
      return
    }

    const message = {
      type: 'unsubscribe',
      scanId
    }

    wsRef.current.send(JSON.stringify(message))
    console.log(`📡 Unsubscribed from scan: ${scanId}`)
  }, [isConnected])

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection':
        setClientId(message.scanId || null)
        console.log('🔌 WebSocket connection established')
        break

      case 'subscription':
        console.log(`📡 Subscription ${message.status}: ${message.scanId}`)
        break

      case 'scan_progress':
        if (message.scanId && options.onScanProgress) {
          const progress: ScanProgress = {
            scanId: message.scanId,
            status: message.status as any,
            progress: message.progress || 0,
            currentStep: message.currentStep || '',
            estimatedTime: message.estimatedTime,
            vulnerabilitiesFound: message.vulnerabilitiesFound || 0,
            toolsCompleted: message.toolsCompleted || [],
            currentTool: message.currentTool,
            error: message.error
          }
          options.onScanProgress(progress)
        }
        break

      case 'scan_complete':
        if (message.scanId && message.results && options.onScanComplete) {
          console.log('🔌 Scan completed, closing WebSocket connection')
          options.onScanComplete(message.scanId, message.results)
          // Close the connection gracefully since scan is done
          if (wsRef.current) {
            wsRef.current.close(1000, 'Scan completed')
          }
        }
        break

      case 'scan_error':
        if (message.scanId && message.error && options.onScanError) {
          console.log('🔌 Scan failed, closing WebSocket connection')
          options.onScanError(message.scanId, message.error)
          // Close the connection gracefully since scan failed
          if (wsRef.current) {
            wsRef.current.close(1000, 'Scan failed')
          }
        }
        break

      case 'error':
        console.error('WebSocket error message:', message.message)
        break

      default:
        console.warn('Unknown WebSocket message type:', message.type)
    }
  }, [options])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    clientId,
    subscribeToScan,
    unsubscribeFromScan,
    connect,
    disconnect
  }
} 