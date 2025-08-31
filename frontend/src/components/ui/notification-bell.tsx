'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, X, Settings, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isConnected,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    requestNotificationPermission,
    sendTestNotification,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-500" />
      case 'connecting':
        return <Wifi className="h-3 w-3 text-yellow-500 animate-pulse" />
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return <WifiOff className="h-3 w-3 text-gray-500" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return 'Connection Error'
      default:
        return 'Disconnected'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '🟢'
      case 'warning':
        return '🟡'
      case 'error':
      case 'alert':
        return '🔴'
      default:
        return '🔵'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2 hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-gray-300" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <Badge 
            className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs font-bold ${
              unreadCount > 99 ? 'min-w-[20px]' : ''
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}

        {/* Connection Status Indicator */}
        <div className="absolute -bottom-1 -right-1">
          {getConnectionStatusIcon()}
        </div>
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 max-h-[600px] overflow-hidden bg-[#111213] border-gray-800 shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold">Notifications</h3>
              <div className="flex items-center gap-1 text-xs">
                {getConnectionStatusIcon()}
                <span className="text-gray-400">{getConnectionStatusText()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={sendTestNotification}
              >
                Test
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Connection Status Banner */}
          {connectionStatus === 'error' && (
            <div className="bg-red-500/20 border-b border-red-500/30 p-3">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Connection failed. Notifications may be delayed.</span>
              </div>
            </div>
          )}

          {/* Notification Permission Banner */}
          {!('Notification' in window) && (
            <div className="bg-yellow-500/20 border-b border-yellow-500/30 p-3">
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Browser notifications not supported</span>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
                <p className="text-gray-500 text-xs mt-1">We'll notify you of important updates</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-500/10' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id)
                      if (notification.actionUrl) {
                        window.open(notification.actionUrl, '_blank')
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Notification Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-white font-medium text-sm leading-tight">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1">
                            {/* Priority Indicator */}
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                            
                            {/* Time */}
                            <span className="text-gray-500 text-xs">
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                          {notification.message}
                        </p>

                        {/* Category Badge */}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-gray-700 text-gray-300 text-xs">
                            {notification.category}
                          </Badge>
                          {notification.tokenId && (
                            <Badge className="bg-blue-600/20 text-blue-400 text-xs">
                              {notification.tokenId}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearNotification(notification.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-gray-900/50">
              <div className="text-gray-400 text-xs">
                {unreadCount} unread of {notifications.length} total
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white text-xs"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-red-400 text-xs"
                  onClick={clearAllNotifications}
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
