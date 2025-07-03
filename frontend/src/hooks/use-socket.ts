'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface ScanProgress {
  scanId: string
  status: 'pending' | 'scanning' | 'completed' | 'failed'
  progress: number
  vulnerabilities?: unknown[]
  summary?: {
    high: number
    medium: number
    low: number
    total: number
  }
  score?: number
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [scanProgress, setScanProgress] = useState<Record<string, ScanProgress>>({})

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason)
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('🔴 WebSocket connection error:', error)
      setIsConnected(false)
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to WebSocket server after', attemptNumber, 'attempts')
      setIsConnected(true)
    })

    newSocket.on('reconnect_error', (error) => {
      console.error('🔴 WebSocket reconnection error:', error)
    })

    newSocket.on('scan-progress', (data: ScanProgress) => {
      setScanProgress(prev => ({
        ...prev,
        [data.scanId]: data
      }))
    })

    newSocket.on('scan-complete', (data: ScanProgress) => {
      setScanProgress(prev => ({
        ...prev,
        [data.scanId]: data
      }))
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const joinScan = (scanId: string) => {
    if (socket) {
      socket.emit('join-scan', scanId)
      console.log(`Joined scan room: ${scanId}`)
    }
  }

  const leaveScan = (scanId: string) => {
    if (socket) {
      socket.emit('leave-scan', scanId)
      console.log(`Left scan room: ${scanId}`)
    }
  }

  return {
    socket,
    isConnected,
    scanProgress,
    joinScan,
    leaveScan,
  }
} 