'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Zap, Shield } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
  id: string
  type: 'price' | 'volume' | 'security' | 'social' | 'technical' | 'market'
  title: string
  description: string
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  tokenId?: string
  tokenSymbol?: string
  data?: any
}

export default function ActivityFeed() {
  const { isConnected, connectionStatus } = useNotifications()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [filter, setFilter] = useState<'all' | 'price' | 'volume' | 'security' | 'social' | 'technical' | 'market'>('all')
  const [isExpanded, setIsExpanded] = useState(false)

  // Generate sample activities for demonstration
  useEffect(() => {
    const generateSampleActivities = () => {
      const sampleActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'price',
          title: 'Bitcoin Price Alert',
          description: 'BTC surged 5.2% in the last hour, now trading at $43,250',
          timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          priority: 'high',
          tokenId: 'bitcoin',
          tokenSymbol: 'BTC',
          data: { price: 43250, change: 5.2, direction: 'up' }
        },
        {
          id: '2',
          type: 'security',
          title: 'Security Scan Complete',
          description: 'Ethereum smart contract audit completed - No critical vulnerabilities found',
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          priority: 'medium',
          tokenId: 'ethereum',
          tokenSymbol: 'ETH',
          data: { vulnerabilities: 0, riskLevel: 'low' }
        },
        {
          id: '3',
          type: 'volume',
          title: 'High Volume Alert',
          description: 'Unusual trading volume detected for Chainlink - 150% above average',
          timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
          priority: 'medium',
          tokenId: 'chainlink',
          tokenSymbol: 'LINK',
          data: { volume: 150, average: 100 }
        },
        {
          id: '4',
          type: 'market',
          title: 'Market Trend Update',
          description: 'DeFi tokens showing strong momentum - TVL up 12% in 24h',
          timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
          priority: 'low',
          data: { tvlChange: 12, sector: 'DeFi' }
        },
        {
          id: '5',
          type: 'technical',
          title: 'Network Update',
          description: 'Polygon network upgrade completed successfully',
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          priority: 'medium',
          tokenId: 'matic-network',
          tokenSymbol: 'MATIC',
          data: { upgrade: 'success', version: '2.0' }
        },
        {
          id: '6',
          type: 'social',
          title: 'Social Sentiment Spike',
          description: 'Positive sentiment detected for Solana - Social mentions up 200%',
          timestamp: new Date(Date.now() - 18 * 60 * 1000), // 18 minutes ago
          priority: 'low',
          tokenId: 'solana',
          tokenSymbol: 'SOL',
          data: { sentiment: 'positive', mentions: 200 }
        }
      ]

      setActivities(sampleActivities)
    }

    generateSampleActivities()

    // Simulate real-time updates
    const interval = setInterval(() => {
      setActivities(prev => {
        const newActivity: ActivityItem = {
          id: `live-${Date.now()}`,
          type: ['price', 'volume', 'security', 'market'][Math.floor(Math.random() * 4)] as any,
          title: 'Live Market Update',
          description: 'Real-time market activity detected',
          timestamp: new Date(),
          priority: 'medium',
          tokenId: 'bitcoin',
          tokenSymbol: 'BTC',
          data: { live: true }
        }

        return [newActivity, ...prev.slice(0, 9)] // Keep max 10 activities
      })
    }, 30000) // Add new activity every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'price':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'volume':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'security':
        return <Shield className="h-4 w-4 text-red-500" />
      case 'social':
        return <Zap className="h-4 w-4 text-yellow-500" />
      case 'technical':
        return <AlertTriangle className="h-4 w-4 text-purple-500" />
      case 'market':
        return <TrendingUp className="h-4 w-4 text-indigo-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'price':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'volume':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'security':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'social':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'technical':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'market':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.type === filter
  )

  const displayedActivities = isExpanded ? filteredActivities : filteredActivities.slice(0, 5)

  return (
    <Card className="bg-[#111213] border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          <h3 className="text-white font-semibold">Activity Feed</h3>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          className="text-gray-400 hover:text-white"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto">
        {[
          { key: 'all', label: 'All' },
          { key: 'price', label: 'Price' },
          { key: 'volume', label: 'Volume' },
          { key: 'security', label: 'Security' },
          { key: 'market', label: 'Market' },
          { key: 'technical', label: 'Technical' },
          { key: 'social', label: 'Social' }
        ].map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={filter === tab.key ? 'default' : 'outline'}
            className="text-xs whitespace-nowrap"
            onClick={() => setFilter(tab.key as any)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No activities yet</p>
            <p className="text-gray-500 text-xs mt-1">Activities will appear here in real-time</p>
          </div>
        ) : (
          displayedActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
              onClick={() => {
                if (activity.tokenId) {
                  window.open(`/blocknet/${activity.tokenId}`, '_blank')
                }
              }}
            >
              {/* Activity Icon */}
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-white font-medium text-sm leading-tight">
                    {activity.title}
                  </h4>
                  <div className="flex items-center gap-1">
                    {/* Priority Indicator */}
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(activity.priority)}`} />
                    
                    {/* Time */}
                    <span className="text-gray-500 text-xs">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                  {activity.description}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-xs ${getTypeColor(activity.type)}`}>
                    {activity.type}
                  </Badge>
                  {activity.tokenSymbol && (
                    <Badge className="bg-blue-600/20 text-blue-400 text-xs">
                      {activity.tokenSymbol}
                    </Badge>
                  )}
                  {activity.data?.live && (
                    <Badge className="bg-green-600/20 text-green-400 text-xs animate-pulse">
                      LIVE
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show More Button */}
      {!isExpanded && filteredActivities.length > 5 && (
        <div className="mt-4 text-center">
          <Button
            size="sm"
            variant="outline"
            className="text-gray-400 hover:text-white"
            onClick={() => setIsExpanded(true)}
          >
            Show {filteredActivities.length - 5} more activities
          </Button>
        </div>
      )}

      {/* Connection Status */}
      {connectionStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Connection lost. Activity feed may be delayed.</span>
          </div>
        </div>
      )}
    </Card>
  )
}
