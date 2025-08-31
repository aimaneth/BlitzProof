"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import BlockNetSidebar from '@/components/ui/blocknet-sidebar'
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  BarChart3,
  Shield,
  Database,
  Activity,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Zap,
  Target,
  Globe,
  Lock,
  Bug,
  FileText,
  Star,
  Edit3,
  Save,
  X,
  ArrowUpDown,
  Filter,
  Download,
  Upload,
  Play,
  Pause,
  AlertCircle,
  Server,
  Network,
  HardDrive,
  Cpu
} from 'lucide-react'
import EditTokenModal from '@/components/ui/edit-token-modal'
import { apiService, getAllTokens, addToken, updateToken, deleteToken } from '@/lib/api'

// Validation helper functions
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

const isValidContractAddress = (address: string): boolean => {
  // Basic Ethereum address validation (0x + 40 hex characters)
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

interface ManualToken {
  id: number;
  uniqueId: string;
  coinGeckoId: string;
  name: string;
  symbol: string;
  description?: string;
  network: string;
  contractAddress?: string;
  category: string;
  priority: number;
  riskLevel: string;
  monitoringStrategy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TokenData {
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  securityScore: number;
  lastUpdated: string;
}

interface SystemStats {
  totalTokens: number;
  activeTokens: number;
  totalAlerts: number;
  criticalAlerts: number;
  apiCallsToday: number;
  lastDataFetch: string;
  systemStatus: 'healthy' | 'warning' | 'error';
}

export default function BlitzProofAdminPage() {
  const router = useRouter()
  const [manualTokens, setManualTokens] = useState<ManualToken[]>([])
  const [tokenData, setTokenData] = useState<{ [key: string]: TokenData }>({})
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('tokens')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('priority')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Add Token Form
  const [newTokenId, setNewTokenId] = useState('')
  const [coinGeckoId, setCoinGeckoId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customSymbol, setCustomSymbol] = useState('')
  const [tokenContracts, setTokenContracts] = useState<Array<{network: string, contractAddress: string}>>([
    { network: 'Ethereum', contractAddress: '' }
  ])
  const [tokenNetwork, setTokenNetwork] = useState('Ethereum')
  const [tokenPriority, setTokenPriority] = useState(50)
  const [tokenRiskLevel, setTokenRiskLevel] = useState('MEDIUM')
  const [tokenMonitoringStrategy, setTokenMonitoringStrategy] = useState('REAL_TIME')
  const [tokenDescription, setTokenDescription] = useState('')
  const [tokenTags, setTokenTags] = useState<string[]>([''])
  
  // New fields for comprehensive structure
  const [tokenRank, setTokenRank] = useState<number>(0)
  const [tokenHolderCount, setTokenHolderCount] = useState<number>(0)
  const [tokenContractScore, setTokenContractScore] = useState<number>(0)
  const [tokenAuditsCount, setTokenAuditsCount] = useState<number>(0)
  
  // Social media links (Community)
  const [tokenSocials, setTokenSocials] = useState<{platform: string, url: string}[]>([
    {platform: 'twitter', url: ''},
    {platform: 'telegram', url: ''},
    {platform: 'discord', url: ''},
    {platform: 'reddit', url: ''},
    {platform: 'linkedin', url: ''}
  ])

  // Website fields
  const [tokenWebsite, setTokenWebsite] = useState('')
  const [tokenWhitepaper, setTokenWhitepaper] = useState('')

  // Source code links (separate section)
  const [tokenSourceCode, setTokenSourceCode] = useState<{platform: string, url: string}[]>([
    {platform: 'github', url: ''},
    {platform: 'gitlab', url: ''},
    {platform: 'etherscan', url: ''}
  ])

  // Audit links (name with logo)
  const [tokenAudits, setTokenAudits] = useState<{auditName: string, auditUrl: string, auditType: string}[]>([
    {auditName: 'Certik', auditUrl: '', auditType: 'Security'}
  ])

  // Explorer links
  const [tokenExplorers, setTokenExplorers] = useState<{explorerName: string, explorerUrl: string, network: string}[]>([
    {explorerName: 'Etherscan', explorerUrl: '', network: 'Ethereum'}
  ])

  // Wallet links
  const [tokenWallets, setTokenWallets] = useState<{walletName: string, walletUrl: string, walletType: string}[]>([
    {walletName: 'MetaMask', walletUrl: 'https://metamask.io', walletType: 'browser'}
  ])



  // Collapse states for new sections
  const [isExplorersExpanded, setIsExplorersExpanded] = useState(true)
  const [isWalletsExpanded, setIsWalletsExpanded] = useState(true)
  const [isSourceCodeExpanded, setIsSourceCodeExpanded] = useState(true)
  
  // DEX Pairs Management
  const [dexPairs, setDexPairs] = useState<string[]>([''])
  const [primaryPair, setPrimaryPair] = useState('')
  const [enableDexScreener, setEnableDexScreener] = useState(true)
  const [autoDiscoverPairs, setAutoDiscoverPairs] = useState(true)
  const [discoveringPairs, setDiscoveringPairs] = useState(false)
  const [discoveredPairs, setDiscoveredPairs] = useState<any[]>([])
  
  const [addingToken, setAddingToken] = useState(false)
  const [message, setMessage] = useState('')

  // Token Logo Management
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [tokenLogos, setTokenLogos] = useState<{ [key: string]: string }>({})

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [tokensPerPage] = useState(20)
  // Form collapse state
  const [isAddFormCollapsed, setIsAddFormCollapsed] = useState(true)

  // Edit Token State
  const [editingToken, setEditingToken] = useState<ManualToken | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null)

  // Fetch data
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchManualTokens(),
        fetchSystemStats(),
        fetchTokenData(),
        fetchTokenLogos()
      ])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setMessage('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort tokens
  const filteredAndSortedTokens = manualTokens
    .filter(token => {
      const matchesSearch = !searchTerm || 
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.coinGeckoId.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = filterCategory === 'all' || token.category === filterCategory
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && token.isActive) ||
        (filterStatus === 'inactive' && !token.isActive)
      
      return matchesSearch && matchesCategory && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'priority':
          comparison = a.priority - b.priority
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol)
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        default:
          comparison = a.priority - b.priority
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedTokens.length / tokensPerPage)
  const startIndex = (currentPage - 1) * tokensPerPage
  const endIndex = startIndex + tokensPerPage
  const currentTokens = filteredAndSortedTokens.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory, filterStatus, sortBy, sortOrder])

  const fetchManualTokens = async () => {
    try {
      const response = await getAllTokens()
      setManualTokens(response.tokens)
      // Fetch logos after tokens are loaded
      await fetchTokenLogos(response.tokens)
    } catch (error) {
      console.error('Failed to fetch manual tokens:', error)
    }
  }

  const fetchTokenData = async () => {
    try {
      setDataLoading(true)
      const tokens = manualTokens.filter(t => t.isActive)
      const data: { [key: string]: TokenData } = {}
      
      for (const token of tokens) {
        try {
          const response = await fetch(`/api/blocknet/comprehensive/${token.coinGeckoId}`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              data[token.coinGeckoId] = {
                price: result.data.combined.price || 0,
                priceChange24h: result.data.combined.priceChange24h || 0,
                marketCap: result.data.combined.marketCap || 0,
                volume24h: result.data.combined.volume24h || 0,
                securityScore: result.data.combined.securityScore || 0,
                lastUpdated: new Date().toISOString()
              }
            }
          }
        } catch (error) {
          console.error(`Failed to fetch data for ${token.coinGeckoId}:`, error)
        }
      }
      
      setTokenData(data)
    } catch (error) {
      console.error('Failed to fetch token data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const fetchSystemStats = async () => {
    try {
      // Mock system stats for now
      setSystemStats({
        totalTokens: manualTokens.length,
        activeTokens: manualTokens.filter(t => t.isActive).length,
        totalAlerts: 0,
        criticalAlerts: 0,
        apiCallsToday: 0,
        lastDataFetch: new Date().toISOString(),
        systemStatus: 'healthy' as const
      })
    } catch (error) {
      console.error('Failed to fetch system stats:', error)
    }
  }

  const fetchTokenLogos = async (tokens = manualTokens) => {
    try {
      console.log('🔄 Refreshing token logos...')
      // Load ONLY uploaded logos from database
      const logoPromises = tokens.map(async (token) => {
        try {
          console.log(`🔍 Loading uploaded logo for ${token.name} (${token.uniqueId})`)
          // Only fetch uploaded logos from database, no external sources
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
          const response = await fetch(`${apiBaseUrl}/api/blocknet/token-logos/${token.uniqueId}`)
          
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.logoUrl) {
              const logoUrl = `${apiBaseUrl}${data.logoUrl}`
              console.log(`✅ Uploaded logo loaded for ${token.name}: ${logoUrl}`)
              return { [token.uniqueId]: logoUrl }
            }
          }
          
          // No uploaded logo found, use empty string
          console.log(`⚠️ No uploaded logo found for ${token.name}`)
          return { [token.uniqueId]: '' }
        } catch (error) {
          console.warn(`⚠️ Failed to load uploaded logo for ${token.uniqueId}:`, error)
          return { [token.uniqueId]: '' }
        }
      })

      const logoResults = await Promise.all(logoPromises)
      const logoMap: { [key: string]: string } = {}
      
      logoResults.forEach(result => {
        Object.assign(logoMap, result)
      })
      
      setTokenLogos(logoMap)
      console.log('✅ Token logos refreshed')
      console.log('📋 Logo map:', logoMap)
    } catch (error) {
      console.error('Failed to fetch token logos:', error)
    }
  }



  const handleAddToken = async () => {
    // Clear previous messages
    setMessage('')
    
    // Comprehensive validation with detailed error messages
    const errors: string[] = []
    
    // Required field validation
    if (!newTokenId.trim()) {
      errors.push('Token ID is required')
    } else if (newTokenId.trim().length < 3) {
      errors.push('Token ID must be at least 3 characters')
    } else if (!/^[a-zA-Z0-9-_]+$/.test(newTokenId.trim())) {
      errors.push('Token ID can only contain letters, numbers, hyphens, and underscores')
    }
    
    if (!customName.trim()) {
      errors.push('Token Name is required')
    } else if (customName.trim().length < 2) {
      errors.push('Token Name must be at least 2 characters')
    }
    
    if (!customSymbol.trim()) {
      errors.push('Token Symbol is required')
    } else if (customSymbol.trim().length < 1) {
      errors.push('Token Symbol must be at least 1 character')
    } else if (customSymbol.trim().length > 10) {
      errors.push('Token Symbol must be 10 characters or less')
    }
    
    // URL validation for website fields
    const invalidWebsite = tokenWebsite.trim() && !isValidUrl(tokenWebsite.trim()) ? 'Website URL' : null
    const invalidWhitepaper = tokenWhitepaper.trim() && !isValidUrl(tokenWhitepaper.trim()) ? 'Whitepaper URL' : null
    
    if (invalidWebsite) {
      errors.push(`Invalid website URL: ${invalidWebsite}`)
    }
    
    if (invalidWhitepaper) {
      errors.push(`Invalid whitepaper URL: ${invalidWhitepaper}`)
    }
    
    // Social media URL validation
    const invalidSocials = tokenSocials
      .filter(social => social.url.trim() && !isValidUrl(social.url.trim()))
      .map(social => `${social.platform} URL`)
    
    if (invalidSocials.length > 0) {
      errors.push(`Invalid URLs: ${invalidSocials.join(', ')}`)
    }
    
    // Source code URL validation
    const invalidSourceCode = tokenSourceCode
      .filter(source => source.url.trim() && !isValidUrl(source.url.trim()))
      .map(source => `${source.platform} URL`)
    
    if (invalidSourceCode.length > 0) {
      errors.push(`Invalid source code URLs: ${invalidSourceCode.join(', ')}`)
    }
    
    // Explorer URL validation
    const invalidExplorers = tokenExplorers
      .filter(explorer => explorer.explorerUrl.trim() && !isValidUrl(explorer.explorerUrl.trim()))
      .map(explorer => `${explorer.explorerName} URL`)
    
    if (invalidExplorers.length > 0) {
      errors.push(`Invalid explorer URLs: ${invalidExplorers.join(', ')}`)
    }
    
    // Wallet URL validation
    const invalidWallets = tokenWallets
      .filter(wallet => wallet.walletUrl.trim() && !isValidUrl(wallet.walletUrl.trim()))
      .map(wallet => `${wallet.walletName} URL`)
    
    if (invalidWallets.length > 0) {
      errors.push(`Invalid wallet URLs: ${invalidWallets.join(', ')}`)
    }
    
    // Contract address validation
    const invalidContracts = tokenContracts
      .filter(contract => contract.contractAddress.trim() && !isValidContractAddress(contract.contractAddress.trim()))
      .map(contract => `${contract.network} contract`)
    
    if (invalidContracts.length > 0) {
      errors.push(`Invalid contract addresses: ${invalidContracts.join(', ')}`)
    }
    
    // Number field validation
    if (tokenRank !== undefined && (tokenRank < 0 || tokenRank > 999999)) {
      errors.push('Rank must be between 0 and 999,999')
    }
    
    if (tokenHolderCount !== undefined && (tokenHolderCount < 0 || tokenHolderCount > 999999999)) {
      errors.push('Holder count must be between 0 and 999,999,999')
    }
    
    if (tokenContractScore !== undefined && (tokenContractScore < 0 || tokenContractScore > 100)) {
      errors.push('Contract score must be between 0 and 100')
    }
    
    if (tokenAuditsCount !== undefined && (tokenAuditsCount < 0 || tokenAuditsCount > 100)) {
      errors.push('Audits count must be between 0 and 100')
    }
    
    // Display all validation errors
    if (errors.length > 0) {
      setMessage(`❌ Validation Errors:\n${errors.map(error => `• ${error}`).join('\n')}`)
      return
    }

    try {
      setAddingToken(true)
      setMessage('')
      
      // Add the token using new simple token API
      const tokenResponse = await addToken({
        uniqueId: newTokenId.trim(),
        coinGeckoId: coinGeckoId.trim() || newTokenId.trim(),
        name: customName.trim() || 'Unnamed Token',
        symbol: customSymbol.trim() || 'UNKNOWN',
        description: tokenDescription.trim() || undefined,
              contracts: tokenContracts.filter(contract => contract.contractAddress.trim()),
        category: tokenTags.filter(tag => tag).length > 0 ? tokenTags.filter(tag => tag)[0] : 'TRENDING',
        network: tokenNetwork,
        priority: tokenPriority,
        riskLevel: tokenRiskLevel,
        monitoringStrategy: tokenMonitoringStrategy,
        // New comprehensive fields
        website: tokenWebsite.trim().replace(/\/$/, '') || undefined,
        rank: tokenRank || undefined,
        holderCount: tokenHolderCount || undefined,
        contractScore: tokenContractScore || undefined,
        auditsCount: tokenAuditsCount || undefined,
        socials: [
          ...tokenSocials.filter(social => social.url.trim()).map(social => ({
            platform: social.platform,
            url: social.url.trim()
          })),
          ...(tokenWhitepaper.trim() ? [{
            platform: 'whitepaper',
            url: tokenWhitepaper.trim()
          }] : [])
        ],
        explorers: tokenExplorers.filter(explorer => explorer.explorerUrl.trim()).map(explorer => ({
          explorerName: explorer.explorerName,
          explorerUrl: explorer.explorerUrl.trim(),
          network: explorer.network
        })),
        wallets: tokenWallets.filter(wallet => wallet.walletUrl.trim()).map(wallet => ({
          walletName: wallet.walletName,
          walletUrl: wallet.walletUrl,
          walletType: wallet.walletType
        })),
        auditLinks: tokenAudits.filter(audit => audit.auditUrl.trim()).map(audit => ({
          auditName: audit.auditName,
          auditUrl: audit.auditUrl.trim(),
          auditType: audit.auditType
        })),
        sourceCode: tokenSourceCode.filter(source => source.url.trim()).map(source => ({
          sourceType: source.platform,
          sourceName: source.platform.charAt(0).toUpperCase() + source.platform.slice(1),
          sourceUrl: source.url.trim(),
          network: 'Ethereum'
        })),
        tags: tokenTags,

      })
      
      console.log('🔍 Token response:', tokenResponse)
      
      // Handle logo upload if there's a logo file
      if (selectedLogoFile) {
        try {
          const formData = new FormData()
          formData.append('logo', selectedLogoFile)
          formData.append('tokenId', newTokenId.trim())
          formData.append('symbol', customSymbol.trim() || newTokenId.trim().toUpperCase())
          formData.append('name', customName.trim() || newTokenId.trim())
          
          const logoResult = await apiService.uploadTokenLogo(formData)
          if (logoResult.success) {
            console.log('✅ Logo uploaded successfully')
          } else {
            console.warn('⚠️ Logo upload failed:', logoResult.message)
          }
        } catch (logoError) {
          console.error('❌ Logo upload error:', logoError)
        }
      }
      
      if (tokenResponse.success) {
        setMessage(`✅ Token "${tokenResponse.token.name}" added successfully!`)
      } else {
        // Enhanced error message display
        let errorMessage = tokenResponse.message || 'Failed to add token'
        
        // Handle detailed validation errors from backend
        if (tokenResponse.details && Array.isArray(tokenResponse.details)) {
          errorMessage = `❌ Validation Errors:\n${tokenResponse.details.map((detail: string) => `• ${detail}`).join('\n')}`
        } else if (tokenResponse.error) {
          errorMessage = `❌ ${tokenResponse.error}`
        }
        
        setMessage(errorMessage)
      }
      
      resetForm()
      fetchAllData()
    } catch (error) {
      console.error('Failed to add token:', error)
      
      // Enhanced error handling with specific error messages
      let errorMessage = '❌ Failed to add token'
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = '❌ Network error: Cannot connect to backend server'
        } else if (error.message.includes('duplicate')) {
          errorMessage = '❌ Token ID already exists. Please use a different Token ID'
        } else if (error.message.includes('validation')) {
          errorMessage = '❌ Validation error: Please check your input data'
        } else if (error.message.includes('database')) {
          errorMessage = '❌ Database error: Please try again later'
        } else {
          errorMessage = `❌ Error: ${error.message}`
        }
      } else if (typeof error === 'string') {
        errorMessage = `❌ ${error}`
      }
      
      setMessage(errorMessage)
    } finally {
      setAddingToken(false)
    }
  }

  const removeToken = async (uniqueId: string) => {
    if (!confirm('Are you sure you want to remove this token?')) return

    try {
      const response = await deleteToken(uniqueId)
      if (response.success) {
        setMessage('✅ Token removed successfully')
        fetchManualTokens()
      } else {
        setMessage(`❌ Failed to remove token: ${response.message}`)
      }
    } catch (error) {
      console.error('Error removing token:', error)
      setMessage('❌ Failed to remove token')
    }
  }

  const toggleToken = async (uniqueId: string) => {
    try {
      const token = manualTokens.find(t => t.uniqueId === uniqueId)
      if (!token) return

      // Update the token's isActive status
      const response = await updateToken(uniqueId, {
        isActive: !token.isActive
      })
      
      if (response.success) {
        setMessage(`✅ Token ${token.isActive ? 'deactivated' : 'activated'} successfully`)
        fetchManualTokens()
      } else {
        setMessage(`❌ Failed to toggle token: ${response.message}`)
      }
    } catch (error) {
      console.error('Error toggling token:', error)
      setMessage('❌ Failed to toggle token')
    }
  }

  const toggleTokenStatus = async (uniqueId: string) => {
    try {
      const token = manualTokens.find(t => t.uniqueId === uniqueId)
      if (!token) return

      const response = await updateToken(uniqueId, {
        isActive: !token.isActive
      })
      
      if (response.success) {
        setMessage('✅ Token status updated successfully')
        fetchManualTokens()
      } else {
        setMessage(`❌ Failed to update token status: ${response.message}`)
      }
    } catch (error) {
      console.error('Error updating token status:', error)
      setMessage('❌ Failed to update token status')
    }
  }

  const handleUpdateToken = async () => {
    if (!editingToken) {
      setMessage('No token selected for editing')
      return
    }

    try {
      setAddingToken(true)
      setMessage('')
      
      // Update the token using new simple token API
      const tokenResponse = await updateToken(editingToken.uniqueId, {
        name: editingToken.name.trim() || '',
        symbol: editingToken.symbol.trim() || '',
        description: editingToken.description?.trim() || '',
        network: editingToken.network || '',
        contractAddress: editingToken.contractAddress?.trim() || '',
        category: editingToken.category || '',
        priority: editingToken.priority || 50,
        riskLevel: editingToken.riskLevel || '',
        monitoringStrategy: editingToken.monitoringStrategy || ''
      })
      
      setMessage(`✅ ${tokenResponse.message}`)
      
      setIsEditing(false)
      setEditingToken(null)
      setEditLogoFile(null)
      setEditLogoPreview(null)
      fetchAllData()
    } catch (error) {
      console.error('Failed to update token:', error)
      setMessage('❌ Failed to update token')
    } finally {
      setAddingToken(false)
    }
  }

  const handleLogoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedLogoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEditLogoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setEditLogoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setNewTokenId('')
    setCoinGeckoId('')
    setCustomName('')
    setCustomSymbol('')
    setTokenContracts([{ network: 'Ethereum', contractAddress: '' }])
    setTokenTags([''])
    setTokenPriority(50)
    setTokenRiskLevel('MEDIUM')
    setTokenMonitoringStrategy('REAL_TIME')
    setTokenDescription('')
    
    // Reset comprehensive fields
    setTokenRank(0)
    setTokenHolderCount(0)
    setTokenContractScore(0)
    setTokenAuditsCount(0)
    
    // Reset social media links (Community)
    setTokenSocials([
      {platform: 'twitter', url: ''},
      {platform: 'telegram', url: ''},
      {platform: 'discord', url: ''},
      {platform: 'reddit', url: ''},
      {platform: 'linkedin', url: ''}
    ])

    // Reset website fields
    setTokenWebsite('')
    setTokenWhitepaper('')

    // Reset audit links
    setTokenAudits([
      {auditName: 'Certik', auditUrl: '', auditType: 'Security'}
    ])

    // Reset source code links
    setTokenSourceCode([
      {platform: 'github', url: ''},
      {platform: 'gitlab', url: ''},
      {platform: 'etherscan', url: ''}
    ])
    
    // Reset explorer links
    setTokenExplorers([
      {explorerName: 'Etherscan', explorerUrl: '', network: 'Ethereum'}
    ])
    
    // Reset wallet links
    setTokenWallets([
      {walletName: 'MetaMask', walletUrl: 'https://metamask.io', walletType: 'browser'}
    ])
    


    // Reset collapse states
    setIsExplorersExpanded(true)
    setIsWalletsExpanded(true)
    setIsSourceCodeExpanded(true)
    
    // Reset logo upload
    setSelectedLogoFile(null)
    setLogoPreview(null)
    
    // Reset edit logo state
    setEditLogoFile(null)
    setEditLogoPreview(null)
    
    // Reset DEX pairs
    setDexPairs([''])
    setPrimaryPair('')
    setEnableDexScreener(true)
    setAutoDiscoverPairs(true)
    setDiscoveredPairs([])
  }

  // DEX Pairs Management Functions
  const addDexPair = () => {
    setDexPairs([...dexPairs, ''])
  }

  const removeDexPair = (index: number) => {
    if (dexPairs.length > 1) {
      const newPairs = dexPairs.filter((_, i) => i !== index)
      setDexPairs(newPairs)
      
      // Update primary pair if it was removed
      if (primaryPair === dexPairs[index]) {
        setPrimaryPair(newPairs[0] || '')
      }
    }
  }

  // Helper functions for new sections
  const addExplorer = () => {
    setTokenExplorers([...tokenExplorers, {explorerName: 'BscScan', explorerUrl: '', network: 'BSC'}])
  }

  const removeExplorer = (index: number) => {
    if (tokenExplorers.length > 1) {
      setTokenExplorers(tokenExplorers.filter((_, i) => i !== index))
    }
  }

  const addWallet = () => {
    setTokenWallets([...tokenWallets, {walletName: 'Trust Wallet', walletUrl: 'https://trustwallet.com', walletType: 'mobile'}])
  }

  const removeWallet = (index: number) => {
    if (tokenWallets.length > 1) {
      setTokenWallets(tokenWallets.filter((_, i) => i !== index))
    }
  }



  const updateDexPair = (index: number, value: string) => {
    const newPairs = [...dexPairs]
    newPairs[index] = value
    setDexPairs(newPairs)
    
    // Update primary pair if it was the one being edited
    if (primaryPair === dexPairs[index]) {
      setPrimaryPair(value)
    }
  }

  const discoverPairs = async () => {
    const firstContract = tokenContracts[0]
    if (!firstContract?.contractAddress.trim()) {
      setMessage('Please enter a token address to discover pairs')
      return
    }

    try {
      setDiscoveringPairs(true)
      setMessage('')
      
      const response = await fetch(`/api/blocknet/dex-pairs/${firstContract.contractAddress}?network=${firstContract.network}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.pairs) {
          setDiscoveredPairs(result.pairs)
          setMessage(`✅ Discovered ${result.pairs.length} DEX pairs`)
          
          // Auto-populate pairs if enabled
          if (autoDiscoverPairs && result.pairs.length > 0) {
            const pairAddresses = result.pairs.map((pair: any) => pair.pairAddress).slice(0, 5)
            setDexPairs(pairAddresses)
            setPrimaryPair(pairAddresses[0] || '')
          }
        } else {
          setMessage('❌ No pairs found for this token')
        }
      } else {
        setMessage('❌ Failed to discover pairs')
      }
    } catch (error) {
      console.error('Failed to discover pairs:', error)
      setMessage('❌ Error discovering pairs')
    } finally {
      setDiscoveringPairs(false)
    }
  }


  const filteredTokens = manualTokens
    .filter((token: ManualToken) => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           token.coinGeckoId.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || token.category === filterCategory
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && token.isActive) ||
                           (filterStatus === 'inactive' && !token.isActive)
      return matchesSearch && matchesCategory && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'priority':
          comparison = (b.priority || 0) - (a.priority || 0)
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol)
          break
        case 'createdAt':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          break
        default:
          comparison = 0
      }
      return sortOrder === 'asc' ? -comparison : comparison
    })

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price)
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'HIGH': return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      case 'CRITICAL': return 'text-red-400 bg-red-500/20 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#0D0E0E] via-[#0F1011] to-[#0D0E0E] flex overflow-hidden">
      {/* Left Sidebar - Full Height (Desktop Only) */}
      <div className="hidden md:flex">
        <BlockNetSidebar
          activeSection="admin"
          activeSubSection="tokens"
          onSectionChange={() => {}}
          onSubSectionChange={() => {}}
        />
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Header */}
        <div className="bg-[#0F1011] border-b border-gray-800">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">BlitzProof Admin Dashboard</h1>
              <Badge className="ml-3 bg-blue-600/20 text-blue-400 border-blue-500/30">
                Admin
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                System Status: <span className="text-green-400">Healthy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Token Management & System Monitoring</h2>
              <p className="text-slate-400">Comprehensive administration tools for BlockNet token ecosystem</p>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.includes('✅') ? 'bg-green-500/20 border border-green-500/30' : 
                message.includes('❌') ? 'bg-red-500/20 border border-red-500/30' : 
                'bg-blue-500/20 border border-blue-500/30'
              }`}>
                <p className="text-white">{message}</p>
              </div>
            )}

            {/* System Stats */}
            {systemStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-[#111213] border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Tokens</p>
                        <p className="text-2xl font-bold text-white">{systemStats.totalTokens}</p>
                      </div>
                      <Database className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#111213] border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Active Tokens</p>
                        <p className="text-2xl font-bold text-white">{systemStats.activeTokens}</p>
                      </div>
                      <Activity className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#111213] border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Critical Alerts</p>
                        <p className="text-2xl font-bold text-white">{systemStats.criticalAlerts}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#111213] border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">API Calls Today</p>
                        <p className="text-2xl font-bold text-white">{systemStats.apiCallsToday.toLocaleString()}</p>
                      </div>
                      <Server className="h-8 w-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex space-x-1 mb-6 bg-[#111213] rounded-lg p-1">
              {[
                { id: 'tokens', label: 'Token Management', icon: Database },
                { id: 'pairs', label: 'DEX Pairs', icon: Network },
                { id: 'data', label: 'Real-time Data', icon: BarChart3 },
                { id: 'security', label: 'Security Analysis', icon: Shield },
                { id: 'system', label: 'System Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content based on active tab */}
            {activeTab === 'tokens' && (
              <div className="space-y-6">
                {/* Add New Token Form */}
                <Card className="bg-[#111213] border-gray-800">
                  <CardHeader>
                    <CardTitle 
                      className="text-white flex items-center justify-between cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => setIsAddFormCollapsed(!isAddFormCollapsed)}
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add New Token
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {isAddFormCollapsed ? 'Click to expand' : 'Click to collapse'}
                        </span>
                        <div className={`transform transition-transform duration-200 ${isAddFormCollapsed ? 'rotate-0' : 'rotate-180'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  {!isAddFormCollapsed && (
                    <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Token ID
                        </label>
                        <Input
                          value={newTokenId}
                          onChange={(e) => setNewTokenId(e.target.value)}
                          placeholder="e.g., blox-myrc, bitcoin"
                          className="bg-black/20 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          CoinGecko ID (for price data)
                        </label>
                        <Input
                          value={coinGeckoId}
                          onChange={(e) => setCoinGeckoId(e.target.value)}
                          placeholder="e.g., blox-myrc, bitcoin"
                          className="bg-black/20 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Token Name *
                        </label>
                        <Input
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="Token name"
                          className="bg-black/20 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Token Symbol *
                        </label>
                        <Input
                          value={customSymbol}
                          onChange={(e) => setCustomSymbol(e.target.value)}
                          placeholder="Token symbol"
                          className="bg-black/20 border-gray-700 text-white"
                        />
                      </div>
                      {/* Contract Addresses */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Contract Addresses
                        </label>
                        <div className="space-y-3">
                          {tokenContracts.map((contract, index) => (
                            <div key={index} className="flex gap-2 items-start">
                              <div className="flex-1">
                                <Input
                                  value={contract.contractAddress}
                                  onChange={(e) => {
                                    const newContracts = [...tokenContracts]
                                    newContracts[index].contractAddress = e.target.value
                                    setTokenContracts(newContracts)
                                  }}
                                  placeholder="0x..."
                                  className="bg-black/20 border-gray-700 text-white"
                                />
                              </div>
                              <div className="w-32">
                                <Select 
                                  value={contract.network} 
                                  onValueChange={(value) => {
                                    const newContracts = [...tokenContracts]
                                    newContracts[index].network = value
                                    setTokenContracts(newContracts)
                                  }}
                                >
                                  <SelectTrigger className="bg-black/20 border-gray-700 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#111213] border-gray-700">
                                    <SelectItem value="Ethereum">Ethereum</SelectItem>
                                    <SelectItem value="BSC">BSC</SelectItem>
                                    <SelectItem value="Polygon">Polygon</SelectItem>
                                    <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                                    <SelectItem value="Optimism">Optimism</SelectItem>
                                    <SelectItem value="Base">Base</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center gap-2">


                                {tokenContracts.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newContracts = tokenContracts.filter((_, i) => i !== index)
                                      setTokenContracts(newContracts)
                                    }}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setTokenContracts([...tokenContracts, { 
                                network: 'Ethereum', 
                                contractAddress: ''
                              }])
                            }}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            + Add Another Contract Address
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Categories
                        </label>
                        <div className="space-y-2">
                          {(() => {
                            const categoryDropdowns = tokenTags.map((tag, index) => (
                              <div key={index} className="flex gap-2 items-start">
                                <div className="flex-1">
                                  <Select 
                                    value={tag} 
                                    onValueChange={(value) => {
                                      const newTags = [...tokenTags]
                                      newTags[index] = value
                                      setTokenTags(newTags)
                                    }}
                                  >
                                    <SelectTrigger className="bg-black/20 border-gray-700 text-white">
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#111213] border-gray-700 max-h-60">
                                      {/* Launch Status Categories */}
                                      <SelectItem value="TRENDING">Trending</SelectItem>
                                      <SelectItem value="ESTABLISHED">Established</SelectItem>
                                      <SelectItem value="NEW_LAUNCH">New Launch</SelectItem>
                                      <SelectItem value="PRE_LAUNCH">Pre Launch</SelectItem>
                                      
                                      {/* Token Type Categories */}
                                      <SelectItem value="MEME">Meme</SelectItem>
                                      <SelectItem value="DEFI">DeFi</SelectItem>
                                      <SelectItem value="GAMING">Gaming</SelectItem>
                                      <SelectItem value="NFT">NFT</SelectItem>
                                      <SelectItem value="STABLECOIN">Stablecoin</SelectItem>
                                      
                                      {/* DeFi & Finance */}
                                      <SelectItem value="LENDING">Lending</SelectItem>
                                      <SelectItem value="DEX">DEX</SelectItem>
                                      <SelectItem value="CEX">CEX</SelectItem>
                                      <SelectItem value="YIELD_FARMING">Yield Farming</SelectItem>
                                      <SelectItem value="STAKING">Staking</SelectItem>
                                      <SelectItem value="LIQUIDITY">Liquidity</SelectItem>
                                      <SelectItem value="DERIVATIVES">Derivatives</SelectItem>
                                      <SelectItem value="INSURANCE">Insurance</SelectItem>
                                      
                                      {/* Gaming & Metaverse */}
                                      <SelectItem value="METAVERSE">Metaverse</SelectItem>
                                      <SelectItem value="PLAY_TO_EARN">Play to Earn</SelectItem>
                                      <SelectItem value="VIRTUAL_REALITY">Virtual Reality</SelectItem>
                                      <SelectItem value="GAMING_GUILDS">Gaming Guilds</SelectItem>
                                      
                                      {/* Infrastructure */}
                                      <SelectItem value="LAYER_1">Layer 1</SelectItem>
                                      <SelectItem value="LAYER_2">Layer 2</SelectItem>
                                      <SelectItem value="SIDECHAIN">Sidechain</SelectItem>
                                      <SelectItem value="BRIDGE">Bridge</SelectItem>
                                      <SelectItem value="ORACLE">Oracle</SelectItem>
                                      <SelectItem value="STORAGE">Storage</SelectItem>
                                      <SelectItem value="COMPUTING">Computing</SelectItem>
                                      
                                      {/* Social & Community */}
                                      <SelectItem value="SOCIAL_FI">SocialFi</SelectItem>
                                      <SelectItem value="CREATOR_ECONOMY">Creator Economy</SelectItem>
                                      <SelectItem value="CONTENT_CREATION">Content Creation</SelectItem>
                                      <SelectItem value="COMMUNITY_DRIVEN">Community Driven</SelectItem>
                                      
                                      {/* Privacy & Security */}
                                      <SelectItem value="PRIVACY">Privacy</SelectItem>
                                      <SelectItem value="ZERO_KNOWLEDGE">Zero Knowledge</SelectItem>
                                      <SelectItem value="MULTISIG">Multisig</SelectItem>
                                      <SelectItem value="IDENTITY">Identity</SelectItem>
                                      
                                      {/* AI & Data */}
                                      <SelectItem value="ARTIFICIAL_INTELLIGENCE">Artificial Intelligence</SelectItem>
                                      <SelectItem value="MACHINE_LEARNING">Machine Learning</SelectItem>
                                      <SelectItem value="DATA_ANALYTICS">Data Analytics</SelectItem>
                                      <SelectItem value="PREDICTION_MARKETS">Prediction Markets</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                  {tokenTags.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newTags = tokenTags.filter((_, i) => i !== index)
                                        setTokenTags(newTags)
                                      }}
                                      className="text-red-400 hover:text-red-300 text-xs"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))

                            return (
                              <>
                                {categoryDropdowns}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTokenTags([...tokenTags, ''])
                                  }}
                                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                >
                                  + Add Category
                                </button>
                              </>
                            )
                          })()}
                        </div>

                        {/* Current Categories Display */}
                        {tokenTags.length > 0 && tokenTags.some(tag => tag) && (
                          <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                            <h4 className="text-xs font-medium text-gray-400 mb-2">Selected Categories ({tokenTags.filter(tag => tag).length})</h4>
                            <div className="flex flex-wrap gap-1">
                              {tokenTags.filter(tag => tag).map((tag, index) => (
                                <span key={`${tag}-${index}`} className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded hover:bg-blue-600/30 transition-colors">
                                  {tag === 'NEW_LAUNCH' ? 'New Launch' :
                                   tag === 'PRE_LAUNCH' ? 'Pre Launch' :
                                   tag === 'DEFI' ? 'DeFi' :
                                   tag === 'STABLECOIN' ? 'Stablecoin' :
                                   tag === 'YIELD_FARMING' ? 'Yield Farming' :
                                   tag === 'PLAY_TO_EARN' ? 'Play to Earn' :
                                   tag === 'VIRTUAL_REALITY' ? 'Virtual Reality' :
                                   tag === 'GAMING_GUILDS' ? 'Gaming Guilds' :
                                   tag === 'LAYER_1' ? 'Layer 1' :
                                   tag === 'LAYER_2' ? 'Layer 2' :
                                   tag === 'SOCIAL_FI' ? 'SocialFi' :
                                   tag === 'CREATOR_ECONOMY' ? 'Creator Economy' :
                                   tag === 'CONTENT_CREATION' ? 'Content Creation' :
                                   tag === 'COMMUNITY_DRIVEN' ? 'Community Driven' :
                                   tag === 'ZERO_KNOWLEDGE' ? 'Zero Knowledge' :
                                   tag === 'ARTIFICIAL_INTELLIGENCE' ? 'Artificial Intelligence' :
                                   tag === 'MACHINE_LEARNING' ? 'Machine Learning' :
                                   tag === 'DATA_ANALYTICS' ? 'Data Analytics' :
                                   tag === 'PREDICTION_MARKETS' ? 'Prediction Markets' :
                                   tag}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTags = tokenTags.filter(t => t !== tag)
                                      setTokenTags(newTags)
                                    }}
                                    className="ml-1 text-blue-300 hover:text-blue-100 hover:bg-blue-500/30 rounded-full w-3 h-3 flex items-center justify-center text-[10px] leading-none"
                                    title="Remove category"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Primary Network Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Primary Network
                        </label>
                        <Select value={tokenNetwork} onValueChange={setTokenNetwork}>
                          <SelectTrigger className="bg-black/20 border-gray-700 text-white">
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111213] border-gray-700">
                            <SelectItem value="Ethereum">Ethereum</SelectItem>
                            <SelectItem value="BSC">Binance Smart Chain</SelectItem>
                            <SelectItem value="Polygon">Polygon</SelectItem>
                            <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                            <SelectItem value="Optimism">Optimism</SelectItem>
                            <SelectItem value="Avalanche">Avalanche</SelectItem>
                            <SelectItem value="Fantom">Fantom</SelectItem>
                            <SelectItem value="Cronos">Cronos</SelectItem>
                            <SelectItem value="Base">Base</SelectItem>
                            <SelectItem value="Linea">Linea</SelectItem>
                            <SelectItem value="zkSync">zkSync Era</SelectItem>
                            <SelectItem value="Scroll">Scroll</SelectItem>
                            <SelectItem value="Mantle">Mantle</SelectItem>
                            <SelectItem value="Celo">Celo</SelectItem>
                            <SelectItem value="Solana">Solana</SelectItem>
                            <SelectItem value="Cardano">Cardano</SelectItem>
                            <SelectItem value="Polkadot">Polkadot</SelectItem>
                            <SelectItem value="Cosmos">Cosmos</SelectItem>
                            <SelectItem value="Near">Near Protocol</SelectItem>
                            <SelectItem value="Algorand">Algorand</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Priority
                        </label>
                        <Input
                          type="number"
                          value={tokenPriority}
                          onChange={(e) => setTokenPriority(Number(e.target.value))}
                          min="1"
                          max="100"
                          className="bg-black/20 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Risk Level
                        </label>
                        <Select value={tokenRiskLevel} onValueChange={setTokenRiskLevel}>
                          <SelectTrigger className="bg-black/20 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111213] border-gray-700">
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Monitoring Strategy
                        </label>
                        <Select value={tokenMonitoringStrategy} onValueChange={setTokenMonitoringStrategy}>
                          <SelectTrigger className="bg-black/20 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111213] border-gray-700">
                            <SelectItem value="REAL_TIME">Real-time</SelectItem>
                            <SelectItem value="HOURLY">Hourly</SelectItem>
                            <SelectItem value="DAILY">Daily</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={tokenDescription}
                        onChange={(e) => setTokenDescription(e.target.value)}
                        placeholder="Token description..."
                        rows={3}
                        className="w-full bg-black/20 border border-gray-700 rounded-md px-3 py-2 text-white placeholder:text-gray-500 resize-none"
                      />
                    </div>

                    {/* New Comprehensive Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Rank
                        </label>
                        <Input
                          type="number"
                          value={tokenRank}
                          onChange={(e) => setTokenRank(Number(e.target.value))}
                          placeholder="Market rank"
                          className="bg-black/20 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Holder Count
                        </label>
                        <Input
                          type="number"
                          value={tokenHolderCount}
                          onChange={(e) => setTokenHolderCount(Number(e.target.value))}
                          placeholder="Number of holders"
                          className="bg-black/20 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Contract Score
                        </label>
                        <Input
                          type="number"
                          value={tokenContractScore}
                          onChange={(e) => setTokenContractScore(Number(e.target.value))}
                          min="0"
                          max="100"
                          placeholder="0-100"
                          className="bg-black/20 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Audits Count
                        </label>
                        <Input
                          type="number"
                          value={tokenAuditsCount}
                          onChange={(e) => setTokenAuditsCount(Number(e.target.value))}
                          min="0"
                          placeholder="Number of audits"
                          className="bg-black/20 border-gray-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Website Fields */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Website Links
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Input
                            value={tokenWebsite}
                            onChange={(e) => setTokenWebsite(e.target.value)}
                            placeholder="Website URL"
                            className="bg-black/20 border-gray-700 text-white"
                          />
                        </div>
                        <div>
                          <Input
                            value={tokenWhitepaper}
                            onChange={(e) => setTokenWhitepaper(e.target.value)}
                            placeholder="Whitepaper URL"
                            className="bg-black/20 border-gray-700 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Audit Links */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Audit Links
                      </label>
                      <div className="space-y-3">
                        {tokenAudits.map((audit, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex gap-2 items-start">
                              <div className="flex-1">
                                <Input
                                  value={audit.auditName}
                                  onChange={(e) => {
                                    const newAudits = [...tokenAudits]
                                    newAudits[index].auditName = e.target.value
                                    setTokenAudits(newAudits)
                                  }}
                                  placeholder="Display Name (e.g., Certik)"
                                  className="bg-black/20 border-gray-700 text-white"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                {tokenAudits.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTokenAudits(tokenAudits.filter((_, i) => i !== index))
                                    }}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <Input
                                value={audit.auditUrl}
                                onChange={(e) => {
                                  const newAudits = [...tokenAudits]
                                  newAudits[index].auditUrl = e.target.value
                                  setTokenAudits(newAudits)
                                }}
                                placeholder="URL (e.g., https://certik.com/projects/token)"
                                className="bg-black/20 border-gray-700 text-white"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setTokenAudits([...tokenAudits, {auditName: 'Hacken', auditUrl: '', auditType: 'Security'}])
                          }}
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                        >
                          + Add Another Audit
                        </button>
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Social Media Links
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tokenSocials.map((social, index) => (
                          <div key={social.platform} className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                value={social.url}
                                onChange={(e) => {
                                  const newSocials = [...tokenSocials]
                                  newSocials[index].url = e.target.value
                                  setTokenSocials(newSocials)
                                }}
                                placeholder={`${social.platform} URL`}
                                className="bg-black/20 border-gray-700 text-white"
                              />
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Source Code Links */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Source Code Links
                      </label>
                      <div className="space-y-3">
                        {tokenSourceCode.map((source, index) => (
                          <div key={source.platform} className="space-y-2">
                            <div className="flex gap-2 items-start">
                              <div className="flex-1">
                                <Input
                                  value={source.url}
                                  onChange={(e) => {
                                    const newSourceCode = [...tokenSourceCode]
                                    newSourceCode[index].url = e.target.value
                                    setTokenSourceCode(newSourceCode)
                                  }}
                                  placeholder={`${source.platform.replace('_', ' ')} URL`}
                                  className="bg-black/20 border-gray-700 text-white"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                {tokenSourceCode.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTokenSourceCode(tokenSourceCode.filter((_, i) => i !== index))
                                    }}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setTokenSourceCode([...tokenSourceCode, {platform: 'gitlab', url: ''}])
                          }}
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                        >
                          + Add Another Source Code
                        </button>
                      </div>
                    </div>

                    {/* Explorer Links */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Explorer Links
                      </label>
                      <div className="space-y-3">
                        {tokenExplorers.map((explorer, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex gap-2 items-start">
                              <div className="flex-1">
                                                              <Input
                                value={explorer.explorerName}
                                onChange={(e) => {
                                  const newExplorers = [...tokenExplorers]
                                  newExplorers[index].explorerName = e.target.value
                                  setTokenExplorers(newExplorers)
                                }}
                                placeholder="Display Name (e.g., Etherscan)"
                                className="bg-black/20 border-gray-700 text-white"
                              />
                              </div>
                              <div className="flex items-center gap-2">
                                {tokenExplorers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeExplorer(index)}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <Input
                                value={explorer.explorerUrl}
                                onChange={(e) => {
                                  const newExplorers = [...tokenExplorers]
                                  newExplorers[index].explorerUrl = e.target.value
                                  setTokenExplorers(newExplorers)
                                }}
                                placeholder="URL (e.g., https://etherscan.io/token/0x...)"
                                className="bg-black/20 border-gray-700 text-white"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addExplorer}
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add Another Explorer
                        </button>
                      </div>
                    </div>

                    {/* Wallet Links */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Wallet Support
                      </label>
                      <div className="space-y-3">
                        {tokenWallets.map((wallet, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex gap-2 items-start">
                              <div className="flex-1">
                                                              <Input
                                value={wallet.walletName}
                                onChange={(e) => {
                                  const newWallets = [...tokenWallets]
                                  newWallets[index].walletName = e.target.value
                                  setTokenWallets(newWallets)
                                }}
                                placeholder="Display Name (e.g., MetaMask)"
                                className="bg-black/20 border-gray-700 text-white"
                              />
                              </div>
                              <div className="flex items-center gap-2">
                                {tokenWallets.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeWallet(index)}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <Input
                                value={wallet.walletUrl}
                                onChange={(e) => {
                                  const newWallets = [...tokenWallets]
                                  newWallets[index].walletUrl = e.target.value
                                  setTokenWallets(newWallets)
                                }}
                                placeholder="URL (e.g., https://metamask.io)"
                                className="bg-black/20 border-gray-700 text-white"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addWallet}
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add Another Wallet
                        </button>
                      </div>
                    </div>



                    {/* Token Logo Upload */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Token Logo (Optional)
                      </label>
                      <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-gray-600 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileSelect}
                          className="hidden"
                          id="token-logo-upload"
                        />
                        <label htmlFor="token-logo-upload" className="cursor-pointer">
                          {logoPreview ? (
                            <div className="space-y-2">
                              <img 
                                src={logoPreview} 
                                alt="Logo preview" 
                                className="w-16 h-16 mx-auto rounded-lg object-cover"
                              />
                              <p className="text-sm text-gray-400">Click to change logo</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 mx-auto text-gray-400" />
                              <p className="text-sm text-gray-400">Click to upload token logo</p>
                              <p className="text-xs text-gray-500">PNG, JPG, SVG (max 2MB)</p>
                              <p className="text-xs text-blue-400 mt-1">Recommended: 256x256px PNG</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={handleAddToken}
                        disabled={addingToken || !newTokenId}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {addingToken ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Token
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={resetForm}
                        variant="outline"
                        className="border-gray-600 text-white hover:bg-gray-800"
                      >
                        Clear Form
                      </Button>
                    </div>
                  </CardContent>
                  )}
                </Card>

                {/* Token List */}
                <Card className="bg-[#111213] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Managed Tokens ({filteredAndSortedTokens.length}/{manualTokens.length})
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Search tokens..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-64 bg-black/20 border-gray-700 text-white"
                        />
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                          <SelectTrigger className="w-32 bg-black/20 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111213] border-gray-700">
                            <SelectItem value="all">All Categories</SelectItem>
                            
                            {/* Launch Status Categories */}
                            <SelectItem value="TRENDING">Trending</SelectItem>
                            <SelectItem value="ESTABLISHED">Established</SelectItem>
                            <SelectItem value="NEW_LAUNCH">New Launch</SelectItem>
                            <SelectItem value="PRE_LAUNCH">Pre Launch</SelectItem>
                            
                            {/* Token Type Categories */}
                            <SelectItem value="MEME">Meme</SelectItem>
                            <SelectItem value="DEFI">DeFi</SelectItem>
                            <SelectItem value="GAMING">Gaming</SelectItem>
                            <SelectItem value="NFT">NFT</SelectItem>
                            
                            {/* DeFi & Finance */}
                            <SelectItem value="LENDING">Lending</SelectItem>
                            <SelectItem value="DEX">DEX</SelectItem>
                            <SelectItem value="CEX">CEX</SelectItem>
                            <SelectItem value="YIELD_FARMING">Yield Farming</SelectItem>
                            <SelectItem value="STAKING">Staking</SelectItem>
                            <SelectItem value="LIQUIDITY">Liquidity</SelectItem>
                            <SelectItem value="DERIVATIVES">Derivatives</SelectItem>
                            <SelectItem value="INSURANCE">Insurance</SelectItem>
                            
                            {/* Gaming & Metaverse */}
                            <SelectItem value="METAVERSE">Metaverse</SelectItem>
                            <SelectItem value="PLAY_TO_EARN">Play to Earn</SelectItem>
                            <SelectItem value="VIRTUAL_REALITY">Virtual Reality</SelectItem>
                            <SelectItem value="GAMING_GUILDS">Gaming Guilds</SelectItem>
                            
                            {/* Infrastructure */}
                            <SelectItem value="LAYER_1">Layer 1</SelectItem>
                            <SelectItem value="LAYER_2">Layer 2</SelectItem>
                            <SelectItem value="SIDECHAIN">Sidechain</SelectItem>
                            <SelectItem value="BRIDGE">Bridge</SelectItem>
                            <SelectItem value="ORACLE">Oracle</SelectItem>
                            <SelectItem value="STORAGE">Storage</SelectItem>
                            <SelectItem value="COMPUTING">Computing</SelectItem>
                            
                            {/* Social & Community */}
                            <SelectItem value="SOCIAL_FI">SocialFi</SelectItem>
                            <SelectItem value="CREATOR_ECONOMY">Creator Economy</SelectItem>
                            <SelectItem value="CONTENT_CREATION">Content Creation</SelectItem>
                            <SelectItem value="COMMUNITY_DRIVEN">Community Driven</SelectItem>
                            
                            {/* Privacy & Security */}
                            <SelectItem value="PRIVACY">Privacy</SelectItem>
                            <SelectItem value="ZERO_KNOWLEDGE">Zero Knowledge</SelectItem>
                            <SelectItem value="MULTISIG">Multisig</SelectItem>
                            <SelectItem value="IDENTITY">Identity</SelectItem>
                            
                            {/* AI & Data */}
                            <SelectItem value="ARTIFICIAL_INTELLIGENCE">Artificial Intelligence</SelectItem>
                            <SelectItem value="MACHINE_LEARNING">Machine Learning</SelectItem>
                            <SelectItem value="DATA_ANALYTICS">Data Analytics</SelectItem>
                            <SelectItem value="PREDICTION_MARKETS">Prediction Markets</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-32 bg-black/20 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111213] border-gray-700">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentTokens.map((token) => (
                        <div
                          key={token.uniqueId}
                          className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-800 cursor-pointer hover:bg-black/30 transition-colors"
                          onClick={() => router.push(`/blocknet/${token.uniqueId}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                              {tokenLogos[token.uniqueId] ? (
                  <img 
                    src={tokenLogos[token.uniqueId]} 
                                  alt={`${token.name} logo`}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    // Fallback to default if image fails to load
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    target.nextElementSibling?.classList.remove('hidden')
                                    console.log(`❌ Logo failed to load for ${token.name}: ${tokenLogos[token.uniqueId]}`)
                                  }}
                                  onLoad={() => {
                                    console.log(`✅ Logo loaded for ${token.name}: ${tokenLogos[token.uniqueId]}`)
                                  }}
                                />
                              ) : (
                                <div onClick={() => {
                                  console.log(`❌ No logo for ${token.name} (${token.uniqueId})`)
                                  console.log('Available logos:', Object.keys(tokenLogos))
                                  console.log('Token uniqueId:', token.uniqueId)
                                }}>
                                  {/* Fallback content */}
                                </div>
                              )}
                              <div className={`w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center ${tokenLogos[token.uniqueId] ? 'hidden' : ''}`}>
                                <span className="text-blue-400 font-bold text-xs">
                                  {token.symbol.slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="text-white font-medium text-sm">{token.name}</h3>
                                <p className="text-gray-400 text-xs">{token.symbol}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge className={`text-xs ${
                                token.isActive ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-red-600/20 text-red-400 border-red-500/30'
                              }`}>
                                {token.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 text-xs">
                                {token.category}
                              </Badge>
                              <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs">
                                P:{token.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              onClick={() => {
                                setEditingToken(token)
                                setIsEditing(true)
                                // Set existing logo preview if available
                                if (tokenLogos[token.uniqueId]) {
                                  setEditLogoPreview(tokenLogos[token.uniqueId])
                                } else {
                                  setEditLogoPreview(null)
                                }
                                setEditLogoFile(null)
                              }}
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-white hover:bg-gray-800"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => toggleToken(token.uniqueId)}
                              size="sm"
                              variant="outline"
                              className={`${
                                token.isActive 
                                  ? 'border-red-600 text-red-400 hover:bg-red-600/20' 
                                  : 'border-green-600 text-green-400 hover:bg-green-600/20'
                              }`}
                            >
                              {token.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              onClick={() => removeToken(token.uniqueId)}
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                        <div className="text-sm text-gray-400">
                          Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedTokens.length)} of {filteredAndSortedTokens.length} tokens
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            Previous
                          </Button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum
                              if (totalPages <= 5) {
                                pageNum = i + 1
                              } else if (currentPage <= 3) {
                                pageNum = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                              } else {
                                pageNum = currentPage - 2 + i
                              }
                              
                              return (
                                <Button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  size="sm"
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  className={currentPage === pageNum 
                                    ? "bg-blue-600 text-white" 
                                    : "border-gray-600 text-white hover:bg-gray-800"
                                  }
                                >
                                  {pageNum}
                                </Button>
                              )
                            })}
                          </div>
                          
                          <Button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Edit Token Modal */}
            {isEditing && editingToken && (
              <EditTokenModal
                token={editingToken}
                onClose={() => setIsEditing(false)}
                onSave={async (updates) => {
                  try {
                    const response = await updateToken(editingToken.uniqueId, updates)
                    if (response.success) {
                      setMessage('✅ Token updated successfully')
                      await fetchAllData()
                      setIsEditing(false)
                      return Promise.resolve() // Return resolved promise
                    } else {
                      setMessage(`❌ Failed to update token: ${response.message}`)
                      return Promise.reject(new Error(response.message))
                    }
                  } catch (error) {
                    console.error('Error updating token:', error)
                    setMessage('❌ Failed to update token')
                    return Promise.reject(error)
                  }
                }}
                onLogoRefresh={async () => {
                  // Force refresh logos after logo upload
                  await fetchTokenLogos(manualTokens)
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
