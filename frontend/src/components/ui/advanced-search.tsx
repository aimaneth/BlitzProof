'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Filter, X, TrendingUp, TrendingDown, Shield, Activity, Zap, Globe, Users, Target, Clock, Star, Filter as FilterIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNotifications } from '@/contexts/NotificationContext'

interface SearchResult {
  id: string
  type: 'token' | 'address' | 'project' | 'network' | 'category'
  name: string
  symbol?: string
  address?: string
  network?: string
  category?: string
  price?: number
  change24h?: number
  marketCap?: number
  volume24h?: number
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  score?: number
  description?: string
  tags?: string[]
}

interface SearchFilters {
  category: string[]
  network: string[]
  riskLevel: string[]
  priceRange: [number, number]
  marketCapRange: [number, number]
  volumeRange: [number, number]
  change24hRange: [number, number]
  sortBy: 'name' | 'price' | 'marketCap' | 'volume24h' | 'change24h' | 'score' | 'riskLevel'
  sortOrder: 'asc' | 'desc'
}

export default function AdvancedSearch() {
  const { subscribeToCategory } = useNotifications()
  const [query, setQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<SearchFilters>({
    category: [],
    network: [],
    riskLevel: [],
    priceRange: [0, 100000],
    marketCapRange: [0, 1000000000000],
    volumeRange: [0, 10000000000],
    change24hRange: [-100, 100],
    sortBy: 'marketCap',
    sortOrder: 'desc'
  })
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sample search data
  const sampleData: SearchResult[] = [
    {
      id: 'bitcoin',
      type: 'token',
      name: 'Bitcoin',
      symbol: 'BTC',
      address: '0x0000000000000000000000000000000000000000',
      network: 'Bitcoin',
      category: 'Cryptocurrency',
      price: 43250.25,
      change24h: 2.5,
      marketCap: 850000000000,
      volume24h: 25000000000,
      riskLevel: 'low',
      score: 95,
      description: 'The first and most well-known cryptocurrency',
      tags: ['store-of-value', 'payment', 'decentralized']
    },
    {
      id: 'ethereum',
      type: 'token',
      name: 'Ethereum',
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000',
      network: 'Ethereum',
      category: 'Smart Contract Platform',
      price: 2650.75,
      change24h: -1.2,
      marketCap: 320000000000,
      volume24h: 15000000000,
      riskLevel: 'medium',
      score: 88,
      description: 'Decentralized platform for smart contracts',
      tags: ['smart-contracts', 'defi', 'nft']
    },
    {
      id: 'chainlink',
      type: 'token',
      name: 'Chainlink',
      symbol: 'LINK',
      address: '0x514910771af9ca656af840dff83e8264ecf986ca',
      network: 'Ethereum',
      category: 'Oracle',
      price: 15.25,
      change24h: 5.8,
      marketCap: 8500000000,
      volume24h: 850000000,
      riskLevel: 'medium',
      score: 82,
      description: 'Decentralized oracle network',
      tags: ['oracle', 'data', 'defi']
    },
    {
      id: 'uniswap',
      type: 'project',
      name: 'Uniswap',
      symbol: 'UNI',
      address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      network: 'Ethereum',
      category: 'DEX',
      price: 8.45,
      change24h: 3.2,
      marketCap: 4500000000,
      volume24h: 1200000000,
      riskLevel: 'low',
      score: 91,
      description: 'Decentralized exchange protocol',
      tags: ['dex', 'amm', 'defi']
    },
    {
      id: 'polygon',
      type: 'network',
      name: 'Polygon',
      symbol: 'MATIC',
      address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
      network: 'Polygon',
      category: 'Layer 2',
      price: 0.85,
      change24h: -2.1,
      marketCap: 8500000000,
      volume24h: 450000000,
      riskLevel: 'medium',
      score: 85,
      description: 'Layer 2 scaling solution for Ethereum',
      tags: ['layer2', 'scaling', 'ethereum']
    }
  ]

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle search input
  const handleSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery)
    
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // Filter sample data based on query
    const filtered = sampleData.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    setSuggestions(filtered.slice(0, 5))
    setIsLoading(false)
  }, [])

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...sampleData]

    // Apply category filter
    if (selectedFilters.category.length > 0) {
      filtered = filtered.filter(item => 
        selectedFilters.category.includes(item.category || '')
      )
    }

    // Apply network filter
    if (selectedFilters.network.length > 0) {
      filtered = filtered.filter(item => 
        selectedFilters.network.includes(item.network || '')
      )
    }

    // Apply risk level filter
    if (selectedFilters.riskLevel.length > 0) {
      filtered = filtered.filter(item => 
        selectedFilters.riskLevel.includes(item.riskLevel || '')
      )
    }

    // Apply price range filter
    filtered = filtered.filter(item => 
      item.price && item.price >= selectedFilters.priceRange[0] && 
      item.price <= selectedFilters.priceRange[1]
    )

    // Apply market cap range filter
    filtered = filtered.filter(item => 
      item.marketCap && item.marketCap >= selectedFilters.marketCapRange[0] && 
      item.marketCap <= selectedFilters.marketCapRange[1]
    )

    // Apply volume range filter
    filtered = filtered.filter(item => 
      item.volume24h && item.volume24h >= selectedFilters.volumeRange[0] && 
      item.volume24h <= selectedFilters.volumeRange[1]
    )

    // Apply 24h change range filter
    filtered = filtered.filter(item => 
      item.change24h && item.change24h >= selectedFilters.change24hRange[0] && 
      item.change24h <= selectedFilters.change24hRange[1]
    )

    // Sort results
    filtered.sort((a, b) => {
      const aValue = a[selectedFilters.sortBy] || 0
      const bValue = b[selectedFilters.sortBy] || 0
      
      if (selectedFilters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setSearchResults(filtered)
  }, [selectedFilters])

  // Update active filters display
  useEffect(() => {
    const active: string[] = []
    
    if (selectedFilters.category.length > 0) {
      active.push(`${selectedFilters.category.length} Categories`)
    }
    if (selectedFilters.network.length > 0) {
      active.push(`${selectedFilters.network.length} Networks`)
    }
    if (selectedFilters.riskLevel.length > 0) {
      active.push(`${selectedFilters.riskLevel.length} Risk Levels`)
    }
    
    setActiveFilters(active)
  }, [selectedFilters])

  // Handle filter change
  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFilters({
      category: [],
      network: [],
      riskLevel: [],
      priceRange: [0, 100000],
      marketCapRange: [0, 1000000000000],
      volumeRange: [0, 10000000000],
      change24hRange: [-100, 100],
      sortBy: 'marketCap',
      sortOrder: 'desc'
    })
    setSearchResults([])
  }

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    setQuery(result.name)
    setIsSearchOpen(false)
    
    // Navigate to result
    if (result.type === 'token') {
      window.open(`/blocknet/${result.id}`, '_blank')
    }
    
    // Subscribe to notifications for this category
    if (result.category) {
      subscribeToCategory(result.category.toLowerCase() as any)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'high': return 'text-orange-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'token': return <TrendingUp className="h-4 w-4" />
      case 'project': return <Target className="h-4 w-4" />
      case 'network': return <Globe className="h-4 w-4" />
      case 'address': return <Users className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          placeholder="Search projects, tokens, addresses..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsSearchOpen(true)}
          className="pl-10 pr-20 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400 w-80"
        />
        
        {/* Filter Button */}
        <Button
          size="sm"
          variant="ghost"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <FilterIcon className="h-4 w-4" />
          {activeFilters.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
              {activeFilters.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Search Results Dropdown */}
      {isSearchOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-[#111213] border-gray-800 shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            <h3 className="text-white font-semibold text-sm">Search Results</h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              onClick={() => setIsSearchOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 text-sm mt-2">Searching...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-4 text-center">
                <Search className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No results found</p>
                <p className="text-gray-500 text-xs mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {suggestions.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => handleResultSelect(result)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(result.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium text-sm">
                            {result.name}
                          </h4>
                          {result.symbol && (
                            <Badge className="bg-blue-600/20 text-blue-400 text-xs">
                              {result.symbol}
                            </Badge>
                          )}
                          {result.riskLevel && (
                            <Badge className={`text-xs ${getRiskColor(result.riskLevel)}`}>
                              {result.riskLevel.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-400 text-xs mt-1">
                          {result.category} • {result.network}
                        </p>

                        {result.price && (
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-white">{formatNumber(result.price)}</span>
                            {result.change24h && (
                              <span className={result.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {result.change24h >= 0 ? '+' : ''}{result.change24h.toFixed(2)}%
                              </span>
                            )}
                            {result.marketCap && (
                              <span className="text-gray-400">{formatNumber(result.marketCap)}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      {result.score && (
                        <div className="flex-shrink-0">
                          <Badge className="bg-green-600/20 text-green-400 text-xs">
                            {result.score}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Advanced Filters */}
      {isFilterOpen && (
        <Card className="absolute top-full left-0 mt-2 bg-[#111213] border-gray-800 shadow-xl z-50 w-96">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Advanced Filters</h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                onClick={() => setIsFilterOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="text-gray-300 text-sm font-medium mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {['Cryptocurrency', 'Smart Contract Platform', 'Oracle', 'DEX', 'Layer 2', 'DeFi', 'NFT'].map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={selectedFilters.category.includes(cat) ? 'default' : 'outline'}
                    className="text-xs"
                    onClick={() => {
                      const newCategories = selectedFilters.category.includes(cat)
                        ? selectedFilters.category.filter(c => c !== cat)
                        : [...selectedFilters.category, cat]
                      handleFilterChange('category', newCategories)
                    }}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Network Filter */}
            <div className="mb-4">
              <label className="text-gray-300 text-sm font-medium mb-2 block">Network</label>
              <div className="flex flex-wrap gap-2">
                {['Bitcoin', 'Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Optimism'].map((net) => (
                  <Button
                    key={net}
                    size="sm"
                    variant={selectedFilters.network.includes(net) ? 'default' : 'outline'}
                    className="text-xs"
                    onClick={() => {
                      const newNetworks = selectedFilters.network.includes(net)
                        ? selectedFilters.network.filter(n => n !== net)
                        : [...selectedFilters.network, net]
                      handleFilterChange('network', newNetworks)
                    }}
                  >
                    {net}
                  </Button>
                ))}
              </div>
            </div>

            {/* Risk Level Filter */}
            <div className="mb-4">
              <label className="text-gray-300 text-sm font-medium mb-2 block">Risk Level</label>
              <div className="flex flex-wrap gap-2">
                {['low', 'medium', 'high', 'critical'].map((risk) => (
                  <Button
                    key={risk}
                    size="sm"
                    variant={selectedFilters.riskLevel.includes(risk) ? 'default' : 'outline'}
                    className={`text-xs ${getRiskColor(risk)}`}
                    onClick={() => {
                      const newRisks = selectedFilters.riskLevel.includes(risk)
                        ? selectedFilters.riskLevel.filter(r => r !== risk)
                        : [...selectedFilters.riskLevel, risk]
                      handleFilterChange('riskLevel', newRisks)
                    }}
                  >
                    {risk.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="mb-4">
              <label className="text-gray-300 text-sm font-medium mb-2 block">Sort By</label>
              <div className="flex gap-2">
                <Select
                  value={selectedFilters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="marketCap">Market Cap</SelectItem>
                    <SelectItem value="volume24h">Volume</SelectItem>
                    <SelectItem value="change24h">24h Change</SelectItem>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="risk">Risk</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFilterChange('sortOrder', selectedFilters.sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {selectedFilters.sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  applyFilters()
                  setIsFilterOpen(false)
                }}
              >
                Apply Filters
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
