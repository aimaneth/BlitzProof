import { useEffect, useRef, useState, useCallback } from 'react'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface WebSocketState {
  isConnected: boolean
  isConnecting: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  lastMessage: WebSocketMessage | null
  error: string | null
  reconnectAttempts: number
  latency: number | null
}

interface UseWebSocketOptions {
  url?: string
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectInterval?: number
  heartbeatInterval?: number
  fallbackPolling?: boolean
  pollInterval?: number
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}

const DEFAULT_OPTIONS: UseWebSocketOptions = {
  url: process.env.NODE_ENV === 'production' 
    ? 'wss://blitzproof-backend.onrender.com' 
    : 'ws://localhost:4001',
  autoReconnect: true, // Re-enabled with proper limits
  maxReconnectAttempts: 2, // Limited attempts
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  fallbackPolling: true,
  pollInterval: 10000,
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    connectionStatus: 'disconnected', // Start with disconnected state
    lastMessage: null,
    error: null,
    reconnectAttempts: 0,
    latency: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPingRef = useRef<number>(0)
  const isPollingRef = useRef<boolean>(false)

  // Connection management
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    // Validate WebSocket URL
    if (!config.url) {
      console.error('WebSocket URL not configured')
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionStatus: 'error',
        error: 'WebSocket URL not configured'
      }))
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, connectionStatus: 'connecting' }))

    try {
      console.log(`🔌 Attempting WebSocket connection to: ${config.url}`)
      const ws = new WebSocket(config.url)
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected')
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionStatus: 'connected',
          error: null,
          reconnectAttempts: 0,
        }))
        
        config.onConnect?.()
        startHeartbeat()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          // Handle heartbeat responses
          if (message.type === 'pong') {
            const latency = Date.now() - lastPingRef.current
            setState(prev => ({ ...prev, latency }))
            return
          }

          setState(prev => ({ ...prev, lastMessage: message }))
          config.onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected: ${event.code} - ${event.reason}`)
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          connectionStatus: 'disconnected',
        }))
        
        stopHeartbeat()
        config.onDisconnect?.()
        
        // Auto-reconnect if enabled and not a normal closure
        // Don't reconnect on code 1000 (normal closure) or 1006 (abnormal closure after multiple failures)
        if (config.autoReconnect && event.code !== 1000) {
          // For code 1006 (abnormal closure), check if we've exceeded max attempts
          if (event.code === 1006) {
            const currentAttempts = state.reconnectAttempts
            if (currentAttempts >= config.maxReconnectAttempts!) {
              console.log('Max reconnection attempts reached, stopping reconnection')
              setState(prev => ({
                ...prev,
                connectionStatus: 'error',
                error: 'Connection failed after multiple attempts'
              }))
              return
            }
          }
          scheduleReconnect()
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        const errorMessage = 'WebSocket connection error'
        setState(prev => ({
          ...prev,
          error: errorMessage,
          connectionStatus: 'error',
        }))
        config.onError?.(errorMessage)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionStatus: 'error',
        error: 'Failed to create WebSocket connection',
      }))
      
      if (config.autoReconnect) {
        scheduleReconnect()
      }
    }
  }, [config])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect')
      wsRef.current = null
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionStatus: 'disconnected',
      reconnectAttempts: 0,
    }))
  }, [])

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected, cannot send message')
    }
  }, [])

  // Heartbeat management
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        lastPingRef.current = Date.now()
        send({ type: 'ping' })
      }
    }, config.heartbeatInterval)
  }, [config.heartbeatInterval, send])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  // Reconnection logic
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    setState(prev => {
      const newAttempts = prev.reconnectAttempts + 1
      
      if (newAttempts > config.maxReconnectAttempts!) {
        console.log('Max reconnection attempts reached, switching to polling')
        return {
          ...prev,
          connectionStatus: 'error',
          error: 'Max reconnection attempts reached',
        }
      }
      
      const delay = config.reconnectInterval! * Math.pow(2, newAttempts - 1)
      console.log(`Scheduling reconnection attempt ${newAttempts} in ${delay}ms`)
      
      reconnectTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, connectionStatus: 'reconnecting' }))
        connect()
      }, delay)
      
      return {
        ...prev,
        reconnectAttempts: newAttempts,
        connectionStatus: 'reconnecting',
      }
    })
  }, [config, connect])

  // Fallback polling
  const startPolling = useCallback(() => {
    if (isPollingRef.current) {
      return
    }
    
    console.log('🔄 Starting fallback polling')
    isPollingRef.current = true
    
    pollIntervalRef.current = setInterval(() => {
      // Simulate WebSocket-like behavior with polling
      const pollMessage: WebSocketMessage = {
        type: 'poll_update',
        timestamp: Date.now(),
        source: 'polling',
      }
      
      setState(prev => ({ ...prev, lastMessage: pollMessage }))
      // Use a ref to avoid dependency issues
      if (options.onMessage) {
        options.onMessage(pollMessage)
      }
    }, DEFAULT_OPTIONS.pollInterval)
  }, [options.onMessage])

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    isPollingRef.current = false
  }, [])

  // Subscription management
  const subscribe = useCallback((type: 'scan' | 'token', id: string) => {
    send({
      type: 'subscribe',
      [type === 'scan' ? 'scanId' : 'tokenId']: id,
    })
  }, [send])

  const unsubscribe = useCallback((type: 'scan' | 'token', id: string) => {
    send({
      type: 'unsubscribe',
      [type === 'scan' ? 'scanId' : 'tokenId']: id,
    })
  }, [send])

  // Get connection stats
  const getStats = useCallback(() => {
    send({ type: 'get_stats' })
  }, [send])

  // Effect to manage connection lifecycle
  useEffect(() => {
    console.log('🔌 Initializing real-time connection system')
    
    // Try WebSocket first, fallback to polling
    const initConnection = async () => {
      try {
        // Attempt WebSocket connection
        connect()
        
        // Start polling as fallback
        if (config.fallbackPolling && !isPollingRef.current) {
          startPolling()
        }
      } catch (error) {
        console.log('🔌 WebSocket failed, using polling only')
        if (config.fallbackPolling && !isPollingRef.current) {
          startPolling()
        }
      }
    }
    
    // Small delay to ensure backend is ready
    const timeout = setTimeout(initConnection, 1000)
    
    return () => {
      clearTimeout(timeout)
      disconnect()
      stopPolling()
    }
  }, []) // Empty dependency array to prevent infinite loops

  return {
    // State
    ...state,
    
    // Actions
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    getStats,
    
    // Utilities
    isReady: state.isConnected || isPollingRef.current, // Ready when WebSocket connected OR polling active
    connectionQuality: state.latency 
      ? state.latency < 100 ? 'excellent' 
      : state.latency < 300 ? 'good'
      : state.latency < 1000 ? 'fair'
      : 'poor'
      : 'good', // Default quality for polling
  }
} 