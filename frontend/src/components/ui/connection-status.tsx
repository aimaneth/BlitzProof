import React from 'react'
import { useWebSocket } from '@/hooks/use-websocket'

interface ConnectionStatusProps {
  className?: string
  showDetails?: boolean
}

export function ConnectionStatus({ className = '', showDetails = false }: ConnectionStatusProps) {
  const {
    isConnected,
    connectionStatus,
    latency,
    connectionQuality,
    reconnectAttempts,
    error,
    connect,
    disconnect,
  } = useWebSocket()

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500' // Green for WebSocket
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-500'
      case 'error':
      default:
        return 'text-blue-500' // Blue for polling
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="w-2 h-2 rounded-full bg-green-500" /> // Green for WebSocket
        )
      case 'connecting':
      case 'reconnecting':
        return (
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        )
      case 'error':
      default:
        return (
          <div className="w-2 h-2 rounded-full bg-blue-500" /> // Blue for polling
        )
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live'
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return `Reconnecting... (${reconnectAttempts})`
      case 'error':
        return 'Polling' // Show polling when WebSocket fails
      default:
        return 'Polling' // Show polling when disconnected
    }
  }

  const getQualityText = () => {
    if (!isConnected || !latency) return null
    
    switch (connectionQuality) {
      case 'excellent':
        return `${latency}ms`
      case 'good':
        return `${latency}ms`
      case 'fair':
        return `${latency}ms`
      case 'poor':
        return `${latency}ms`
      default:
        return null
    }
  }

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 text-xs ${className}`}>
        {getStatusIcon()}
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {getQualityText() && (
          <span className="text-gray-500">
            {getQualityText()}
          </span>
        )}
        {connectionStatus === 'error' && (
          <button
            onClick={() => {
              disconnect()
              setTimeout(() => connect(), 1000)
            }}
            className="text-blue-400 hover:text-blue-300 text-xs underline"
            title="Click to reconnect WebSocket"
          >
            Reconnect
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2 text-xs">
        {getStatusIcon()}
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {getQualityText() && (
          <span className="text-gray-500">
            {getQualityText()}
          </span>
        )}
      </div>
      
      {showDetails && (
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="capitalize">{connectionStatus}</span>
          </div>
          {latency && (
            <div className="flex justify-between">
              <span>Latency:</span>
              <span>{latency}ms</span>
            </div>
          )}
          {reconnectAttempts > 0 && (
            <div className="flex justify-between">
              <span>Reconnect attempts:</span>
              <span>{reconnectAttempts}</span>
            </div>
          )}
          {error && (
            <div className="text-red-500 text-xs">
              Error: {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ConnectionStatus
