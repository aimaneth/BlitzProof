'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
// import { io, Socket } from 'socket.io-client' // Disabled for now
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'alert'
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: any
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'price' | 'security' | 'volume' | 'social' | 'technical' | 'market'
  tokenId?: string
  actionUrl?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAllNotifications: () => void
  subscribeToToken: (tokenId: string) => void
  unsubscribeFromToken: (tokenId: string) => void
  subscribeToCategory: (category: Notification['category']) => void
  unsubscribeFromCategory: (category: Notification['category']) => void
  requestNotificationPermission: () => Promise<boolean>
  sendTestNotification: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [socket, setSocket] = useState<any | null>(null) // Changed from Socket to any
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeSocket = () => {
      try {
        setConnectionStatus('connecting')
        
        // For now, disable WebSocket connection to avoid errors
        // TODO: Implement WebSocket server in backend when needed
        console.log('🔌 WebSocket disabled - real-time notifications not available')
        setConnectionStatus('disconnected')
        setIsConnected(false)
        
        // No cleanup needed when WebSocket is disabled
        return () => {
          // WebSocket is disabled, no cleanup needed
        }
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error)
        setConnectionStatus('error')
      }
    }

    initializeSocket()
  }, [])

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted')
        return true
      } else {
        console.log('❌ Notification permission denied')
        return false
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [])

  // Handle new notification
  const handleNewNotification = useCallback((data: any) => {
    const notification: Notification = {
      id: data.id || `notification-${Date.now()}-${Math.random()}`,
      type: data.type || 'info',
      title: data.title || 'New Notification',
      message: data.message || '',
      timestamp: new Date(data.timestamp || Date.now()),
      read: false,
      data: data.data,
      priority: data.priority || 'medium',
      category: data.category || 'market',
      tokenId: data.tokenId,
      actionUrl: data.actionUrl,
    }

    setNotifications(prev => [notification, ...prev.slice(0, 99)]) // Keep last 100 notifications

    // Show toast notification
    const toastOptions = {
      duration: notification.priority === 'critical' ? 8000 : 4000,
      action: notification.actionUrl ? {
        label: 'View',
        onClick: () => window.open(notification.actionUrl, '_blank')
      } : undefined,
    }

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, { description: notification.message, ...toastOptions })
        break
      case 'warning':
        toast.warning(notification.title, { description: notification.message, ...toastOptions })
        break
      case 'error':
        toast.error(notification.title, { description: notification.message, ...toastOptions })
        break
      case 'alert':
        toast.error(notification.title, { description: notification.message, ...toastOptions })
        break
      default:
        toast.info(notification.title, { description: notification.message, ...toastOptions })
    }

    // Show browser notification if permission granted
    if (notificationPermission === 'granted' && notification.priority !== 'low') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
      })
    }
  }, [notificationPermission])

  // Handle price alerts
  const handlePriceAlert = useCallback((data: any) => {
    const notification: Notification = {
      id: `price-${Date.now()}`,
      type: data.direction === 'up' ? 'success' : 'warning',
      title: `Price Alert: ${data.tokenSymbol}`,
      message: `${data.tokenSymbol} price ${data.direction === 'up' ? 'increased' : 'decreased'} by ${data.percentage}% to $${data.price}`,
      timestamp: new Date(),
      read: false,
      data: data,
      priority: data.percentage > 10 ? 'high' : 'medium',
      category: 'price',
      tokenId: data.tokenId,
      actionUrl: `/blocknet/${data.tokenId}`,
    }

    handleNewNotification(notification)
  }, [handleNewNotification])

  // Handle security alerts
  const handleSecurityAlert = useCallback((data: any) => {
    const notification: Notification = {
      id: `security-${Date.now()}`,
      type: 'error',
      title: `Security Alert: ${data.tokenSymbol}`,
      message: data.message || 'Security issue detected',
      timestamp: new Date(),
      read: false,
      data: data,
      priority: 'critical',
      category: 'security',
      tokenId: data.tokenId,
      actionUrl: `/blocknet/${data.tokenId}`,
    }

    handleNewNotification(notification)
  }, [handleNewNotification])

  // Handle volume alerts
  const handleVolumeAlert = useCallback((data: any) => {
    const notification: Notification = {
      id: `volume-${Date.now()}`,
      type: 'info',
      title: `Volume Alert: ${data.tokenSymbol}`,
      message: `24h volume ${data.direction === 'up' ? 'increased' : 'decreased'} by ${data.percentage}%`,
      timestamp: new Date(),
      read: false,
      data: data,
      priority: 'medium',
      category: 'volume',
      tokenId: data.tokenId,
      actionUrl: `/blocknet/${data.tokenId}`,
    }

    handleNewNotification(notification)
  }, [handleNewNotification])

  // Handle market alerts
  const handleMarketAlert = useCallback((data: any) => {
    const notification: Notification = {
      id: `market-${Date.now()}`,
      type: data.type || 'info',
      title: data.title || 'Market Alert',
      message: data.message || 'Market update',
      timestamp: new Date(),
      read: false,
      data: data,
      priority: data.priority || 'medium',
      category: 'market',
    }

    handleNewNotification(notification)
  }, [handleNewNotification])

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  // Clear single notification
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Subscribe to token notifications
  const subscribeToToken = useCallback((tokenId: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe_token', { tokenId })
      console.log(`🔔 Subscribed to notifications for token: ${tokenId}`)
    }
  }, [socket, isConnected])

  // Unsubscribe from token notifications
  const unsubscribeFromToken = useCallback((tokenId: string) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe_token', { tokenId })
      console.log(`🔕 Unsubscribed from notifications for token: ${tokenId}`)
    }
  }, [socket, isConnected])

  // Subscribe to category notifications
  const subscribeToCategory = useCallback((category: Notification['category']) => {
    if (socket && isConnected) {
      socket.emit('subscribe_category', { category })
      console.log(`🔔 Subscribed to ${category} notifications`)
    }
  }, [socket, isConnected])

  // Unsubscribe from category notifications
  const unsubscribeFromCategory = useCallback((category: Notification['category']) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe_category', { category })
      console.log(`🔕 Unsubscribed from ${category} notifications`)
    }
  }, [socket, isConnected])

  // Send test notification
  const sendTestNotification = useCallback(() => {
    const testNotification: Notification = {
      id: `test-${Date.now()}`,
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification from BlitzProof',
      timestamp: new Date(),
      read: false,
      priority: 'medium',
      category: 'market',
    }

    handleNewNotification(testNotification)
  }, [handleNewNotification])

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    subscribeToToken,
    unsubscribeFromToken,
    subscribeToCategory,
    unsubscribeFromCategory,
    requestNotificationPermission,
    sendTestNotification,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
