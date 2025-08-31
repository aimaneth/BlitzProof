'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Calendar, ArrowUpDown, ExternalLink } from 'lucide-react'

interface TradingViewChartProps {
  tokenId: string
  currentPrice: number
  priceChange24h: number
  className?: string
}

// TradingView widget configuration
const TRADINGVIEW_WIDGET_CONFIG = {
  width: '100%',
  height: 500,
  symbol: 'BINANCE:BTCUSDT',
  interval: 'D',
  timezone: 'Etc/UTC',
  theme: 'dark',
  style: '1',
  locale: 'en',
  toolbar_bg: '#f1f3f6',
  enable_publishing: false,
  allow_symbol_change: true,
  container_id: 'tradingview_widget',
  studies: []
}

// Token to TradingView symbol mapping
const getTradingViewSymbol = (tokenId: string): string => {
  const mappings: { [key: string]: string } = {
    'btc': 'BINANCE:BTCUSDT',
    'bitcoin': 'BINANCE:BTCUSDT',
    'eth': 'BINANCE:ETHUSDT',
    'ethereum': 'BINANCE:ETHUSDT',
    'link': 'BINANCE:LINKUSDT',
    'chainlink': 'BINANCE:LINKUSDT',
    'xrp': 'BINANCE:XRPUSDT',
    'ripple': 'BINANCE:XRPUSDT',
    'ada': 'BINANCE:ADAUSDT',
    'cardano': 'BINANCE:ADAUSDT',
    'dot': 'BINANCE:DOTUSDT',
    'polkadot': 'BINANCE:DOTUSDT',
    'sol': 'BINANCE:SOLUSDT',
    'solana': 'BINANCE:SOLUSDT',
    'avax': 'BINANCE:AVAXUSDT',
    'avalanche': 'BINANCE:AVAXUSDT',
    'matic': 'BINANCE:MATICUSDT',
    'polygon': 'BINANCE:MATICUSDT',
    'arbitrum': 'BINANCE:ARBUSDT',
    'optimism': 'BINANCE:OPUSDT',
    'bsc': 'BINANCE:BNBUSDT',
    'base': 'BINANCE:BASEUSDT',
    'blox-myrc': 'BINANCE:MYRCUSDT',
    'myrc': 'BINANCE:MYRCUSDT',
    'blox': 'BINANCE:BLXUSDT'
  }
  
  return mappings[tokenId.toLowerCase()] || 'BINANCE:BTCUSDT'
}

const timeframes = [
  { label: '1H', value: '60', seconds: 3600 },
  { label: '4H', value: '240', seconds: 14400 },
  { label: '1D', value: 'D', seconds: 86400 },
  { label: '1W', value: 'W', seconds: 604800 },
  { label: '1M', value: 'M', seconds: 2592000 }
]

export default function TradingViewChart({ tokenId, currentPrice, priceChange24h, className = '' }: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('D')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartSymbol, setChartSymbol] = useState('BINANCE:BTCUSDT')
  const [showIndicators, setShowIndicators] = useState(false)

  // Initialize TradingView widget
  useEffect(() => {
    const symbol = getTradingViewSymbol(tokenId)
    setChartSymbol(symbol)
    
    // Load TradingView widget script
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (window.TradingView && chartContainerRef.current) {
        try {
          // Clean up previous widget
          if (widgetRef.current) {
            widgetRef.current.remove()
          }

          // Create new widget with minimal configuration
          widgetRef.current = new window.TradingView.widget({
            width: '100%',
            height: 500,
            symbol: symbol,
            interval: selectedTimeframe,
            timezone: 'Etc/UTC',
            theme: 'dark',
            style: '1',
            locale: 'en',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: chartContainerRef.current.id,
            studies: [],
            // Hide symbol search, OHLC, volume, and pair info
            disabled_features: [
              'header_symbol_search',
              'header_compare',
              'volume_force_overlay',
              'create_volume_indicator_by_default',
              'show_logo_on_all_charts',
              'caption_buttons_text_if_possible'
            ],
            // Force enable left toolbar
            enabled_features: [
              'side_toolbar_in_fullscreen_mode'
            ]
          })

          setLoading(false)
        } catch (error) {
          console.error('❌ Error creating TradingView widget:', error)
          setError('Failed to load TradingView chart')
          setLoading(false)
        }
      }
    }
    script.onerror = () => {
      setError('Failed to load TradingView script')
      setLoading(false)
    }

    document.head.appendChild(script)

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove()
        } catch (e) {
          console.log('Widget already disposed')
        }
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [tokenId, selectedTimeframe])

  // Update widget when timeframe or symbol changes
  useEffect(() => {
    if (widgetRef.current && chartSymbol) {
      try {
        // TradingView widget doesn't support setSymbol, so we need to recreate it
        // Remove the old widget
        widgetRef.current.remove()
        
        // Create new widget with updated symbol and timeframe
        widgetRef.current = new window.TradingView.widget({
          width: '100%',
          height: 500,
          symbol: chartSymbol,
          interval: selectedTimeframe,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: chartContainerRef.current?.id || 'tradingview_widget',
          studies: [],
          // Hide symbol search, OHLC, volume, and pair info
          disabled_features: [
            'header_symbol_search',
            'header_compare',
            'volume_force_overlay',
            'create_volume_indicator_by_default',
            'show_logo_on_all_charts',
            'caption_buttons_text_if_possible'
          ],
          // Force enable left toolbar
          enabled_features: [
            'side_toolbar_in_fullscreen_mode'
          ]
        })
      } catch (error) {
        console.error('❌ Error updating TradingView widget:', error)
      }
    }
  }, [selectedTimeframe, chartSymbol])

  // Toggle indicators
  const toggleIndicators = () => {
    if (widgetRef.current) {
      try {
        if (showIndicators) {
          // Remove indicators
          widgetRef.current.removeAllShapes()
        } else {
          // Add indicators
          widgetRef.current.createStudy('RSI', false, false, [14])
          widgetRef.current.createStudy('MACD', false, false, [12, 26, 9])
        }
        setShowIndicators(!showIndicators)
      } catch (error) {
        console.error('❌ Error toggling indicators:', error)
      }
    }
  }

  const formatPrice = (price: number): string => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else {
      return `$${price.toFixed(6)}`
    }
  }

  const formatPriceChange = (change: number): string => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

         return (
     <Card className={`${className}`}>
       {/* Chart Container */}

             {/* Chart Container */}
       <div className="relative">
         {loading && (
           <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
             <div className="text-white">Loading TradingView chart...</div>
           </div>
         )}
         
         {error && (
           <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
             <div className="text-center text-white">
               <div className="text-red-400 mb-2">❌ {error}</div>
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={() => window.open(`https://www.tradingview.com/symbols/${chartSymbol}`, '_blank')}
               >
                 <ExternalLink className="w-4 h-4 mr-2" />
                 Open in TradingView
               </Button>
             </div>
           </div>
         )}

         

         <div 
           id="tradingview_widget"
           ref={chartContainerRef}
           className="w-full h-[500px] rounded-lg overflow-hidden"
           style={{
             // Ensure left toolbar is visible
             position: 'relative',
             zIndex: 1
           }}
         />
         <style jsx>{`
           #tradingview_widget {
             --tv-toolbar-display: block !important;
             --tv-sidebar-display: block !important;
           }
           #tradingview_widget .chart-page .chart-container {
             margin-left: 40px !important;
           }
           #tradingview_widget .chart-page .chart-container-header {
             margin-left: 40px !important;
           }
         `}</style>
       </div>

      
    </Card>
  )
}

// Add TradingView types to window
declare global {
  interface Window {
    TradingView: {
      widget: new (config: any) => any
    }
  }
}
