'use client'

import { useState, useRef, useEffect } from 'react'
import { TrendingUp, TrendingDown, Shield, Activity, Star, MoreHorizontal, ExternalLink, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SemicircleProgress from '@/components/ui/semicircle-progress'
import { tokenLogoService } from '@/lib/tokenLogoService'

interface MobileTokenCardProps {
  token: {
    id: string
    name: string
    symbol: string
    price: number
    priceChange24h: number
    marketCap: number
    volume24h: number
    network: string
    category: string
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    score?: number
    logo?: string
    dexPairs?: any[]
  }
  onClick: () => void
  onFavorite?: () => void
  isFavorite?: boolean
}

export default function MobileTokenCard({ token, onClick, onFavorite, isFavorite = false }: MobileTokenCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Handle swipe gestures
  useEffect(() => {
    let startX = 0
    let startY = 0
    let isSwiping = false

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      isSwiping = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) {
        const deltaX = Math.abs(e.touches[0].clientX - startX)
        const deltaY = Math.abs(e.touches[0].clientY - startY)
        
        if (deltaX > deltaY && deltaX > 10) {
          isSwiping = true
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isSwiping) {
        const deltaX = e.changedTouches[0].clientX - startX
        
        if (deltaX > 50) {
          // Swipe right - expand card
          setIsExpanded(true)
        } else if (deltaX < -50) {
          // Swipe left - show actions
          setShowActions(true)
        }
      }
      
      isSwiping = false
    }

    const card = cardRef.current
    if (card) {
      card.addEventListener('touchstart', handleTouchStart, { passive: true })
      card.addEventListener('touchmove', handleTouchMove, { passive: true })
      card.addEventListener('touchend', handleTouchEnd, { passive: true })

      return () => {
        card.removeEventListener('touchstart', handleTouchStart)
        card.removeEventListener('touchmove', handleTouchMove)
        card.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500 bg-green-500/20 border-green-500/30'
      case 'medium': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30'
      case 'high': return 'text-orange-500 bg-orange-500/20 border-orange-500/30'
      case 'critical': return 'text-red-500 bg-red-500/20 border-red-500/30'
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="h-4 w-4" />
      case 'medium': return <Clock className="h-4 w-4" />
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  const getTokenLogo = (tokenId: string, symbol?: string, address?: string) => {
    return tokenLogoService.getTokenLogoUrlSync(tokenId, symbol, address)
  }

  return (
    <div className="relative">
      {/* Main Card */}
      <Card 
        ref={cardRef}
        className={`bg-[#111213] border-gray-800 transition-all duration-300 ${
          isExpanded ? 'scale-105 shadow-xl' : 'hover:shadow-lg'
        } ${showActions ? 'translate-x-[-80px]' : ''}`}
        onClick={() => {
          if (!showActions) {
            onClick()
          }
        }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Token Logo */}
              <div className="relative">
                <img
                  src={getTokenLogo(token.id, token.symbol)}
                  alt={token.name}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>

              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold text-sm truncate">
                    {token.name}
                  </h3>
                  <Badge className="bg-blue-600/20 text-blue-400 text-xs">
                    {token.symbol}
                  </Badge>
                </div>
                <p className="text-gray-400 text-xs">{token.category}</p>
              </div>
            </div>

            {/* Price Info */}
            <div className="text-right">
              <p className="text-white font-semibold text-sm">
                {formatNumber(token.price)}
              </p>
              <div className={`flex items-center gap-1 text-xs ${
                token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {token.priceChange24h >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-gray-400 text-xs">Market Cap</p>
              <p className="text-white text-sm font-medium">{formatNumber(token.marketCap)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Volume 24h</p>
              <p className="text-white text-sm font-medium">{formatNumber(token.volume24h)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Risk Level</p>
              <div className="flex items-center justify-center gap-1">
                {getRiskIcon(token.riskLevel)}
                <Badge className={`text-xs ${getRiskColor(token.riskLevel)}`}>
                  {token.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="border-t border-gray-800 pt-3 mt-3">
              {/* DEX Pairs */}
              {token.dexPairs && token.dexPairs.length > 0 && (
                <div className="mb-3">
                  <p className="text-gray-400 text-xs mb-2">DEX Pairs</p>
                  <div className="flex flex-wrap gap-2">
                    {token.dexPairs.slice(0, 3).map((pair: any, index: number) => (
                      <Badge key={index} className="bg-gray-700 text-gray-300 text-xs">
                        {pair.dexId}
                      </Badge>
                    ))}
                    {token.dexPairs.length > 3 && (
                      <Badge className="bg-gray-700 text-gray-300 text-xs">
                        +{token.dexPairs.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Score */}
              {token.score && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Security Score</span>
                  <div className="flex items-center gap-2">
                    <SemicircleProgress 
                      score={token.score} 
                      size={28} 
                      strokeWidth={2}
                    />
                    <span className="text-white text-xs font-medium">
                      {token.score}/100
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-400 hover:text-yellow-400"
                onClick={(e) => {
                  e.stopPropagation()
                  onFavorite?.()
                }}
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`/blocknet/${token.id}`, '_blank')
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Swipe Actions */}
      {showActions && (
        <div className="absolute right-0 top-0 h-full flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            className="h-12 w-12 p-0 bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              window.open(`/blocknet/${token.id}`, '_blank')
              setShowActions(false)
            }}
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
          
          <Button
            size="sm"
            variant="default"
            className="h-12 w-12 p-0 bg-green-600 hover:bg-green-700"
            onClick={() => {
              onFavorite?.()
              setShowActions(false)
            }}
          >
            <Star className={`h-5 w-5 ${isFavorite ? 'fill-white' : ''}`} />
          </Button>
          
          <Button
            size="sm"
            variant="default"
            className="h-12 w-12 p-0 bg-red-600 hover:bg-red-700"
            onClick={() => setShowActions(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Swipe Hint */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 transition-opacity duration-300 hover:opacity-100">
        <div className="bg-black/50 rounded-lg px-3 py-1">
          <p className="text-white text-xs">Swipe for actions</p>
        </div>
      </div>
    </div>
  )
}
