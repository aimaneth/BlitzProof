'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { X, Upload, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleToken } from '@/lib/api'
import { apiService } from '@/lib/api'

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

interface EditTokenModalProps {
  token: SimpleToken | null
  onClose: () => void
  onSave: (updates: Partial<SimpleToken>) => Promise<void>
  onLogoRefresh?: () => void
}

export default function EditTokenModal({ 
  token, 
  onClose, 
  onSave,
  onLogoRefresh
}: EditTokenModalProps) {
  const [editingToken, setEditingToken] = useState<SimpleToken | null>(token)
  const [originalToken, setOriginalToken] = useState<SimpleToken | null>(token)
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null)

  // Reset form when token changes
  useEffect(() => {
    if (token) {
      // Ensure token has at least one contract address input and audit links
      const tokenWithDefaults = {
        ...token,
        contracts: token.contracts && token.contracts.length > 0 
          ? token.contracts 
          : [{ network: 'Ethereum', contractAddress: '', isActive: true }],
        auditLinks: token.auditLinks && token.auditLinks.length > 0
          ? token.auditLinks
          : [{ auditName: 'Certik', auditUrl: '', auditType: 'Security', isActive: true }],
        tags: token.tags && token.tags.length > 0 
          ? token.tags 
          : []
      }

      setEditingToken(tokenWithDefaults)
      setOriginalToken(tokenWithDefaults) // Store original data with same structure for comparison
      setEditLogoPreview(null)
      setEditLogoFile(null)
      setMessage('')
    }
  }, [token])

  // 🆕 CHECK IF DATA HAS CHANGED
  const hasChanges = () => {
    if (!editingToken || !originalToken) return false
    
    // Check if social media links have changed
    const socialsChanged = JSON.stringify(editingToken.socials) !== JSON.stringify(originalToken.socials)
    
    // Check if contracts have changed
    const contractsChanged = JSON.stringify(editingToken.contracts) !== JSON.stringify(originalToken.contracts)
    
    // Check if explorers have changed
    const explorersChanged = JSON.stringify(editingToken.explorers) !== JSON.stringify(originalToken.explorers)
    
    // Check if wallets have changed
    const walletsChanged = JSON.stringify(editingToken.wallets) !== JSON.stringify(originalToken.wallets)
    
    // Check if audit links have changed
    const auditLinksChanged = JSON.stringify(editingToken.auditLinks) !== JSON.stringify(originalToken.auditLinks)
    
    // Check if source code has changed
    const sourceCodeChanged = JSON.stringify(editingToken.sourceCode) !== JSON.stringify(originalToken.sourceCode)
    
    // Check if tags have changed
    const tagsChanged = JSON.stringify(editingToken.tags) !== JSON.stringify(originalToken.tags)
    
    return (
      editingToken.name !== originalToken.name ||
      editingToken.symbol !== originalToken.symbol ||
      editingToken.contractAddress !== originalToken.contractAddress ||
      editingToken.network !== originalToken.network ||
      editingToken.category !== originalToken.category ||
      editingToken.priority !== originalToken.priority ||
      editingToken.riskLevel !== originalToken.riskLevel ||
      editingToken.monitoringStrategy !== originalToken.monitoringStrategy ||
      editingToken.description !== originalToken.description ||
      editingToken.website !== originalToken.website ||
      editingToken.rank !== originalToken.rank ||
      editingToken.holderCount !== originalToken.holderCount ||
      editingToken.contractScore !== originalToken.contractScore ||
      editingToken.auditsCount !== originalToken.auditsCount ||
      socialsChanged ||
      contractsChanged ||
      explorersChanged ||
      walletsChanged ||
      auditLinksChanged ||
      sourceCodeChanged ||
      tagsChanged ||
      editLogoFile !== null // Logo file change
    )
  }

     // 🆕 CHECK IF SPECIFIC SECTIONS HAVE CHANGED (for use in JSX)
   const socialsChangedForJSX = editingToken && originalToken ? JSON.stringify(editingToken.socials) !== JSON.stringify(originalToken.socials) : false
   const sourceCodeChangedForJSX = editingToken && originalToken ? JSON.stringify(editingToken.sourceCode) !== JSON.stringify(originalToken.sourceCode) : false
   const auditLinksChangedForJSX = editingToken && originalToken ? JSON.stringify(editingToken.auditLinks) !== JSON.stringify(originalToken.auditLinks) : false

  // 🆕 CHECK IF SPECIFIC FIELD HAS CHANGED
  const hasFieldChanged = (fieldName: keyof SimpleToken) => {
    if (!editingToken || !originalToken) return false
    return editingToken[fieldName] !== originalToken[fieldName]
  }

  const handleEditLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!editingToken?.name.trim()) {
      errors.push('Token Name is required')
    } else if (editingToken.name.trim().length < 2) {
      errors.push('Token Name must be at least 2 characters')
    }

    if (!editingToken?.symbol.trim()) {
      errors.push('Token Symbol is required')
    } else if (editingToken.symbol.trim().length < 1) {
      errors.push('Token Symbol must be at least 1 character')
    } else if (editingToken.symbol.trim().length > 10) {
      errors.push('Token Symbol must be 10 characters or less')
    }

    // URL validation for website fields
    if (editingToken?.website?.trim() && !isValidUrl(editingToken.website.trim())) {
      errors.push('Website URL is invalid (must start with http:// or https://)')
    }
    
    // URL validation for whitepaper (from socials array)
    const whitepaperSocial = editingToken?.socials?.find(s => s.platform === 'whitepaper')
    if (whitepaperSocial?.url.trim() && !isValidUrl(whitepaperSocial.url.trim())) {
      errors.push('Whitepaper URL is invalid (must start with http:// or https://)')
    }

    // Social media URL validation
    const invalidSocials = editingToken?.socials
      ?.filter(social => social.url.trim() && !isValidUrl(social.url.trim()))
      .map(social => `${social.platform} URL`) || []
    
    if (invalidSocials.length > 0) {
      errors.push(`Invalid social media URLs: ${invalidSocials.join(', ')}`)
    }
    
    // Explorer URL validation
    const invalidExplorers = editingToken?.explorers
      ?.filter(explorer => explorer.explorerUrl.trim() && !isValidUrl(explorer.explorerUrl.trim()))
      .map(explorer => `${explorer.explorerName} URL`) || []
    
    if (invalidExplorers.length > 0) {
      errors.push(`Invalid explorer URLs: ${invalidExplorers.join(', ')}`)
    }
    
    // Wallet URL validation
    const invalidWallets = editingToken?.wallets
      ?.filter(wallet => wallet.walletUrl.trim() && !isValidUrl(wallet.walletUrl.trim()))
      .map(wallet => `${wallet.walletName} URL`) || []
    
    if (invalidWallets.length > 0) {
      errors.push(`Invalid wallet URLs: ${invalidWallets.join(', ')}`)
    }
    
    // Contract address validation
    const invalidContracts = editingToken?.contracts
      ?.filter(contract => contract.contractAddress.trim() && !isValidContractAddress(contract.contractAddress.trim()))
      .map(contract => `${contract.network} contract`) || []
    
    if (invalidContracts.length > 0) {
      errors.push(`Invalid contract addresses: ${invalidContracts.join(', ')}`)
    }
    
    // Number field validation
    if (editingToken?.rank !== undefined && (editingToken.rank < 0 || editingToken.rank > 999999)) {
      errors.push('Rank must be between 0 and 999,999')
    }
    
    if (editingToken?.holderCount !== undefined && (editingToken.holderCount < 0 || editingToken.holderCount > 999999999)) {
      errors.push('Holder count must be between 0 and 999,999,999')
    }
    
    if (editingToken?.contractScore !== undefined && (editingToken.contractScore < 0 || editingToken.contractScore > 100)) {
      errors.push('Contract score must be between 0 and 100')
    }
    
    if (editingToken?.auditsCount !== undefined && (editingToken.auditsCount < 0 || editingToken.auditsCount > 100)) {
      errors.push('Audits count must be between 0 and 100')
    }
    
    return errors
  }

  const updateToken = async () => {
    if (!editingToken) {
      setMessage('❌ No token selected for editing')
      return
    }

    // Clear previous messages
    setMessage('')
    
    // Validate form
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setMessage(`❌ Validation errors: ${validationErrors.join(', ')}`)
      return
    }

    setIsUpdating(true)
    setMessage('🔄 Updating token...')
    
    try {
      // Handle logo upload first if there's a new logo
      if (editLogoFile) {
        try {
          const formData = new FormData()
          formData.append('logo', editLogoFile)
          formData.append('tokenId', editingToken.uniqueId)
          formData.append('symbol', editingToken.symbol || '')
          formData.append('name', editingToken.name || '')
          
          const logoResult = await apiService.uploadTokenLogo(formData)
          // Logo upload completed
        } catch (logoError) {
          // Logo upload failed, continue with token update
        }
      }
      
      // Call the onSave function with the updates
      const updates: Partial<SimpleToken> = {
        name: editingToken.name.trim() || '',
        symbol: editingToken.symbol.trim() || '',
        contractAddress: editingToken.contractAddress?.trim() || '',
        network: editingToken.network || '',
        category: editingToken.category || '',
        priority: editingToken.priority || 50,
        riskLevel: editingToken.riskLevel || '',
        monitoringStrategy: editingToken.monitoringStrategy || '',
        description: editingToken.description?.trim() || '',
        // New comprehensive fields
        // website field removed - now handled through socials array
        rank: editingToken.rank || undefined,
        holderCount: editingToken.holderCount || undefined,
        contractScore: editingToken.contractScore || undefined,
        auditsCount: editingToken.auditsCount || undefined,
        // Social media links
        socials: editingToken.socials?.filter(social => social.url.trim()) || undefined,
        // Contract addresses
        contracts: editingToken.contracts?.filter(contract => contract.contractAddress.trim()) || undefined,
        // Explorer links
        explorers: editingToken.explorers?.filter(explorer => explorer.explorerUrl.trim()) || undefined,
        // Wallet links
        wallets: editingToken.wallets?.filter(wallet => wallet.isActive) || undefined,
        // Source code links
        sourceCode: editingToken.sourceCode?.filter(source => source.sourceUrl.trim()) || undefined,
        // Audit links
        auditLinks: editingToken.auditLinks?.filter(audit => audit.auditUrl.trim()) || undefined,
        // Tags
        tags: editingToken.tags?.filter(tag => tag.trim()) || undefined,
      }
      
      // Update the token first
      await onSave(updates)
      
      // Then refresh the logo if a new logo was uploaded
      if (editLogoFile && onLogoRefresh) {
        await onLogoRefresh()
      }
      
      setMessage('✅ Token updated successfully')
      
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Failed to update token:', error)
      
      // Enhanced error handling with specific error messages
      let errorMessage = '❌ Failed to update token'
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = '❌ Network error: Cannot connect to backend server'
        } else if (error.message.includes('duplicate')) {
          errorMessage = '❌ Token ID already exists. Please use a different Token ID'
        } else if (error.message.includes('validation')) {
          errorMessage = '❌ Validation error: Please check your input data'
        } else if (error.message.includes('database')) {
          errorMessage = '❌ Database error: Please try again later'
        } else if (error.message.includes('not found')) {
          errorMessage = '❌ Token not found. It may have been deleted.'
        } else {
          errorMessage = `❌ Error: ${error.message}`
        }
      } else if (typeof error === 'string') {
        errorMessage = `❌ ${error}`
      }
      
      setMessage(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!editingToken) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111213] border border-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Token: {editingToken.name}</h2>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {message && (
          <div className={`p-3 rounded-md mb-4 text-sm ${
            message.includes('✅') ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-red-600/20 text-red-400 border border-red-500/30'
          }`}>
            {message}
          </div>
        )}

        {/* 🆕 CHANGES SUMMARY */}
        {hasChanges() && (
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-md p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 text-sm font-medium">Changes Detected:</span>
            </div>
            <div className="text-xs text-blue-300 space-y-1">
              {hasFieldChanged('name') && <div>• Name: {originalToken?.name} → {editingToken?.name}</div>}
              {hasFieldChanged('symbol') && <div>• Symbol: {originalToken?.symbol} → {editingToken?.symbol}</div>}
                             {hasFieldChanged('contractAddress') && <div>• Contract Address: {originalToken?.contractAddress || 'empty'} → {editingToken?.contractAddress || 'empty'}</div>}
              {hasFieldChanged('network') && <div>• Network: {originalToken?.network || 'empty'} → {editingToken?.network || 'empty'}</div>}
              {hasFieldChanged('category') && <div>• Category: {originalToken?.category || 'empty'} → {editingToken?.category || 'empty'}</div>}
              {hasFieldChanged('priority') && <div>• Priority: {originalToken?.priority} → {editingToken?.priority}</div>}
              {hasFieldChanged('riskLevel') && <div>• Risk Level: {originalToken?.riskLevel || 'empty'} → {editingToken?.riskLevel || 'empty'}</div>}
              {hasFieldChanged('monitoringStrategy') && <div>• Monitoring: {originalToken?.monitoringStrategy || 'empty'} → {editingToken?.monitoringStrategy || 'empty'}</div>}
                             {hasFieldChanged('description') && <div>• Description: {originalToken?.description || 'empty'} → {editingToken?.description || 'empty'}</div>}
               {socialsChangedForJSX && <div>• Social links updated</div>}
               {sourceCodeChangedForJSX && <div>• Source code links updated</div>}
               {auditLinksChangedForJSX && <div>• Audit links updated</div>}
               {editLogoFile && <div>• Logo: New file selected</div>}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Name
                {hasFieldChanged('name') && <span className="text-blue-400 ml-1">*</span>}
              </label>
              <Input
                value={editingToken.name || ''}
                onChange={(e) => setEditingToken({...editingToken, name: e.target.value})}
                className={`bg-black/20 border-gray-700 text-white ${
                  hasFieldChanged('name') ? 'border-blue-500' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Symbol
                {hasFieldChanged('symbol') && <span className="text-blue-400 ml-1">*</span>}
              </label>
              <Input
                value={editingToken.symbol || ''}
                onChange={(e) => setEditingToken({...editingToken, symbol: e.target.value})}
                className={`bg-black/20 border-gray-700 text-white ${
                  hasFieldChanged('symbol') ? 'border-blue-500' : ''
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CoinGecko ID (for price data)
              </label>
              <Input
                value={editingToken.coinGeckoId || ''}
                onChange={(e) => setEditingToken({...editingToken, coinGeckoId: e.target.value})}
                placeholder="e.g., blox-myrc, bitcoin"
                className="bg-black/20 border-gray-700 text-white"
              />
            </div>
            {/* Contract Addresses */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contract Addresses
              </label>
                             <div className="space-y-3">
                 {(editingToken.contracts && editingToken.contracts.length > 0 ? editingToken.contracts : [{ network: 'Ethereum', contractAddress: '', isActive: true }]).map((contract, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        value={contract.contractAddress}
                        onChange={(e) => {
                          const newContracts = [...(editingToken.contracts || [])]
                          newContracts[index].contractAddress = e.target.value
                          setEditingToken({...editingToken, contracts: newContracts})
                        }}
                        placeholder="0x..."
                        className="bg-black/20 border-gray-700 text-white"
                      />
                    </div>
                    <div className="w-32">
                      <Select 
                        value={contract.network} 
                        onValueChange={(value) => {
                          const newContracts = [...(editingToken.contracts || [])]
                          newContracts[index].network = value
                          setEditingToken({...editingToken, contracts: newContracts})
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
                      {(editingToken.contracts && editingToken.contracts.length > 1) && (
                        <button
                          type="button"
                          onClick={() => {
                            const newContracts = editingToken.contracts!.filter((_, i) => i !== index)
                            setEditingToken({...editingToken, contracts: newContracts})
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
                    const newContracts = [...(editingToken.contracts || []), { 
                      network: 'Ethereum', 
                      contractAddress: ''
                    }]
                    setEditingToken({...editingToken, contracts: newContracts})
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  + Add Another Contract Address
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Categories
              </label>
              
              {/* Category Dropdowns */}
              <div className="space-y-3">
                {(() => {
                  // Create category dropdowns based on current tags
                  const tags = editingToken?.tags || []
                  const categoryDropdowns = tags.map((_, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Select 
                          value={editingToken.tags?.[index] || ''} 
                          onValueChange={(value) => {
                            const newTags = [...(editingToken.tags || [])]
                            newTags[index] = value
                            setEditingToken({...editingToken, tags: newTags})
                          }}
                        >
                          <SelectTrigger className="bg-black/20 border-gray-700 text-white">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111213] border-gray-700 max-h-60">
                            <SelectItem value="TRENDING">Trending</SelectItem>
                            <SelectItem value="ESTABLISHED">Established</SelectItem>
                            <SelectItem value="NEW_LAUNCH">New Launch</SelectItem>
                            <SelectItem value="PRE_LAUNCH">Pre Launch</SelectItem>
                            <SelectItem value="MEME">Meme</SelectItem>
                            <SelectItem value="DEFI">DeFi</SelectItem>
                            <SelectItem value="GAMING">Gaming</SelectItem>
                            <SelectItem value="NFT">NFT</SelectItem>
                            <SelectItem value="STABLECOIN">Stablecoin</SelectItem>
                            <SelectItem value="LENDING">Lending</SelectItem>
                            <SelectItem value="DEX">DEX</SelectItem>
                            <SelectItem value="CEX">CEX</SelectItem>
                            <SelectItem value="YIELD_FARMING">Yield Farming</SelectItem>
                            <SelectItem value="STAKING">Staking</SelectItem>
                            <SelectItem value="LIQUIDITY">Liquidity</SelectItem>
                            <SelectItem value="DERIVATIVES">Derivatives</SelectItem>
                            <SelectItem value="INSURANCE">Insurance</SelectItem>
                            <SelectItem value="METAVERSE">Metaverse</SelectItem>
                            <SelectItem value="PLAY_TO_EARN">Play to Earn</SelectItem>
                            <SelectItem value="VIRTUAL_REALITY">Virtual Reality</SelectItem>
                            <SelectItem value="GAMING_GUILDS">Gaming Guilds</SelectItem>
                            <SelectItem value="LAYER_1">Layer 1</SelectItem>
                            <SelectItem value="LAYER_2">Layer 2</SelectItem>
                            <SelectItem value="SIDECHAIN">Sidechain</SelectItem>
                            <SelectItem value="BRIDGE">Bridge</SelectItem>
                            <SelectItem value="ORACLE">Oracle</SelectItem>
                            <SelectItem value="STORAGE">Storage</SelectItem>
                            <SelectItem value="COMPUTING">Computing</SelectItem>
                            <SelectItem value="SOCIAL_FI">SocialFi</SelectItem>
                            <SelectItem value="CREATOR_ECONOMY">Creator Economy</SelectItem>
                            <SelectItem value="CONTENT_CREATION">Content Creation</SelectItem>
                            <SelectItem value="COMMUNITY_DRIVEN">Community Driven</SelectItem>
                            <SelectItem value="PRIVACY">Privacy</SelectItem>
                            <SelectItem value="ZERO_KNOWLEDGE">Zero Knowledge</SelectItem>
                            <SelectItem value="MULTISIG">Multisig</SelectItem>
                            <SelectItem value="IDENTITY">Identity</SelectItem>
                            <SelectItem value="ARTIFICIAL_INTELLIGENCE">Artificial Intelligence</SelectItem>
                            <SelectItem value="MACHINE_LEARNING">Machine Learning</SelectItem>
                            <SelectItem value="DATA_ANALYTICS">Data Analytics</SelectItem>
                            <SelectItem value="PREDICTION_MARKETS">Prediction Markets</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))

                  return (
                    <>
                      {categoryDropdowns}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags = [...(editingToken.tags || []), '']
                          setEditingToken({...editingToken, tags: newTags})
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
              {editingToken?.tags && editingToken.tags.length > 0 && editingToken.tags.some(tag => tag) && (
                <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Current Categories ({editingToken.tags.filter(tag => tag).length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {editingToken.tags.filter(tag => tag).map((tag, index) => (
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
                            const newTags = editingToken.tags?.filter(t => t !== tag) || []
                            setEditingToken({...editingToken, tags: newTags})
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
            
            {/* Network/Chain Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Network/Chain
              </label>
              <Select 
                value={editingToken?.network || ''} 
                onValueChange={(value) => setEditingToken({...editingToken!, network: value})}
              >
                <SelectTrigger className="bg-black/20 border-gray-700 text-white">
                  <SelectValue placeholder="Select primary network" />
                </SelectTrigger>
                <SelectContent className="bg-[#111213] border-gray-700 max-h-60">
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
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <Input
                type="number"
                value={editingToken.priority || 50}
                onChange={(e) => setEditingToken({...editingToken, priority: Number(e.target.value)})}
                min="1"
                max="100"
                className="bg-black/20 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Level
              </label>
              <Select value={editingToken.riskLevel || ''} onValueChange={(value) => setEditingToken({...editingToken, riskLevel: value})}>
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
              <Select value={editingToken.monitoringStrategy || ''} onValueChange={(value) => setEditingToken({...editingToken, monitoringStrategy: value})}>
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={editingToken.description || ''}
              onChange={(e) => setEditingToken({...editingToken, description: e.target.value})}
              placeholder="Token description..."
              rows={3}
              className="w-full bg-black/20 border border-gray-700 rounded-md px-3 py-2 text-white placeholder:text-gray-500 resize-none"
            />
          </div>

          {/* New Comprehensive Fields */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rank
              </label>
              <Input
                type="number"
                value={editingToken.rank || ''}
                onChange={(e) => setEditingToken({...editingToken, rank: Number(e.target.value)})}
                placeholder="Market rank"
                className="bg-black/20 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Holder Count
              </label>
              <Input
                type="number"
                value={editingToken.holderCount || ''}
                onChange={(e) => setEditingToken({...editingToken, holderCount: Number(e.target.value)})}
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
                value={editingToken.contractScore || ''}
                onChange={(e) => setEditingToken({...editingToken, contractScore: Number(e.target.value)})}
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
                value={editingToken.auditsCount || ''}
                onChange={(e) => setEditingToken({...editingToken, auditsCount: Number(e.target.value)})}
                min="0"
                placeholder="Number of audits"
                className="bg-black/20 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Social Media Links */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Social Media Links
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {[
                 {platform: 'twitter', label: 'Twitter'},
                 {platform: 'telegram', label: 'Telegram'},
                 {platform: 'discord', label: 'Discord'},
                 {platform: 'reddit', label: 'Reddit'},
                 {platform: 'linkedin', label: 'LinkedIn'}
               ].map((social) => (
                <div key={social.platform} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={editingToken.socials?.find(s => s.platform === social.platform)?.url || ''}
                      onChange={(e) => {
                        const newSocials = [...(editingToken.socials || [])]
                        const existingIndex = newSocials.findIndex(s => s.platform === social.platform)
                        if (existingIndex >= 0) {
                          newSocials[existingIndex].url = e.target.value
                        } else {
                          newSocials.push({
                            platform: social.platform,
                            url: e.target.value,
                            isVerified: false
                          })
                        }
                        setEditingToken({...editingToken, socials: newSocials})
                      }}
                      placeholder={`${social.label} URL`}
                      className="bg-black/20 border-gray-700 text-white"
                    />
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Source Code Links */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Source Code Links
            </label>
            <div className="space-y-3">
              {(editingToken.sourceCode && editingToken.sourceCode.length > 0 ? editingToken.sourceCode : []).map((source, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        value={source.sourceName}
                        onChange={(e) => {
                          const newSourceCode = [...(editingToken.sourceCode || [])]
                          newSourceCode[index].sourceName = e.target.value
                          setEditingToken({...editingToken, sourceCode: newSourceCode})
                        }}
                        placeholder="Display Name (e.g., GitHub)"
                        className="bg-black/20 border-gray-700 text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🔍 Removing source code at index:', index)
                          console.log('🔍 Current sourceCode:', editingToken.sourceCode)
                          const newSourceCode = editingToken.sourceCode!.filter((_, i) => i !== index)
                          console.log('🔍 New sourceCode after removal:', newSourceCode)
                          setEditingToken({...editingToken, sourceCode: newSourceCode})
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        value={source.sourceUrl}
                        onChange={(e) => {
                          const newSourceCode = [...(editingToken.sourceCode || [])]
                          newSourceCode[index].sourceUrl = e.target.value
                          setEditingToken({...editingToken, sourceCode: newSourceCode})
                        }}
                        placeholder="URL (e.g., https://github.com/user/repo)"
                        className="bg-black/20 border-gray-700 text-white"
                      />
                    </div>
                    <div className="w-32">
                      <Select 
                        value={source.sourceType} 
                        onValueChange={(value) => {
                          const newSourceCode = [...(editingToken.sourceCode || [])]
                          newSourceCode[index].sourceType = value
                          setEditingToken({...editingToken, sourceCode: newSourceCode})
                        }}
                      >
                        <SelectTrigger className="bg-black/20 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111213] border-gray-700">
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="gitlab">GitLab</SelectItem>
                          <SelectItem value="etherscan">Etherscan</SelectItem>
                          <SelectItem value="bscscan">BscScan</SelectItem>
                          <SelectItem value="polygonscan">PolygonScan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              {editingToken.sourceCode && editingToken.sourceCode.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const newSourceCode = [...(editingToken.sourceCode || []), { 
                      sourceType: 'gitlab', 
                      sourceName: 'GitLab', 
                      sourceUrl: '', 
                      network: 'Ethereum'
                    }]
                    setEditingToken({...editingToken, sourceCode: newSourceCode})
                  }}
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                >
                  + Add Another Source Code
                </button>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm mb-2">No source code data available</p>
                  <button
                    type="button"
                    onClick={() => {
                      const newSourceCode = [{ 
                        sourceType: 'github', 
                        sourceName: 'GitHub', 
                        sourceUrl: '', 
                        network: 'Ethereum', 
                        isVerified: false, 
                        isActive: true 
                      }]
                      setEditingToken({...editingToken, sourceCode: newSourceCode})
                    }}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    + Add First Source Code
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Website Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website Links
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  value={editingToken.website || ''}
                  onChange={(e) => setEditingToken({...editingToken, website: e.target.value.replace(/\/$/, '')})}
                  placeholder="Website URL"
                  className="bg-black/20 border-gray-700 text-white"
                />
              </div>
              <div>
                <Input
                  value={editingToken.socials?.find(s => s.platform === 'whitepaper')?.url || ''}
                  onChange={(e) => {
                    const newSocials = [...(editingToken.socials || [])]
                    const existingIndex = newSocials.findIndex(s => s.platform === 'whitepaper')
                    if (existingIndex >= 0) {
                      newSocials[existingIndex].url = e.target.value
                    } else {
                      newSocials.push({
                        platform: 'whitepaper',
                        url: e.target.value
                      })
                    }
                    setEditingToken({...editingToken, socials: newSocials})
                  }}
                  placeholder="Whitepaper URL"
                  className="bg-black/20 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Audit Links */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Audit Links
            </label>
            <div className="space-y-3">
              {(() => {
                const auditLinksToRender = editingToken.auditLinks || [{ auditName: 'Certik', auditUrl: '', auditType: 'Security', isActive: true }]
                console.log('🔍 Rendering audit links:', auditLinksToRender)
                return auditLinksToRender.map((audit, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          value={audit.auditName}
                          onChange={(e) => {
                            const currentAuditLinks = editingToken.auditLinks || [{ auditName: 'Certik', auditUrl: '', auditType: 'Security', isActive: true }]
                            const newAuditLinks = [...currentAuditLinks]
                            newAuditLinks[index].auditName = e.target.value
                            setEditingToken({...editingToken, auditLinks: newAuditLinks})
                          }}
                          placeholder="Display Name (e.g., Certik)"
                          className="bg-black/20 border-gray-700 text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {(editingToken.auditLinks && editingToken.auditLinks.length > 1) && (
                          <button
                            type="button"
                            onClick={() => {
                              const newAuditLinks = editingToken.auditLinks!.filter((_, i) => i !== index)
                              setEditingToken({...editingToken, auditLinks: newAuditLinks})
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
                          const currentAuditLinks = editingToken.auditLinks || [{ auditName: 'Certik', auditUrl: '', auditType: 'Security', isActive: true }]
                          const newAuditLinks = [...currentAuditLinks]
                          newAuditLinks[index].auditUrl = e.target.value
                          setEditingToken({...editingToken, auditLinks: newAuditLinks})
                        }}
                        placeholder="URL (e.g., https://certik.com/projects/token)"
                        className="bg-black/20 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                ))
              })()}
                             <button
                 type="button"
                 onClick={() => {
                   const currentAuditLinks = editingToken.auditLinks || [{ auditName: 'Certik', auditUrl: '', auditType: 'Security', isActive: true }]
                   const newAuditLinks = [...currentAuditLinks, { 
                     auditName: 'Hacken', 
                     auditUrl: '', 
                     auditType: 'Security', 
                     isActive: true 
                   }]
                   setEditingToken({...editingToken, auditLinks: newAuditLinks})
                 }}
                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
              >
                + Add Another Audit
              </button>
            </div>
          </div>

          {/* Explorer Links */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Explorer Links
            </label>
            <div className="space-y-3">
              {(editingToken.explorers && editingToken.explorers.length > 0 ? editingToken.explorers : [{ explorerName: 'Etherscan', explorerUrl: '', network: 'Ethereum', isActive: true }]).map((explorer, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        value={explorer.explorerName}
                        onChange={(e) => {
                          const newExplorers = [...(editingToken.explorers || [])]
                          newExplorers[index].explorerName = e.target.value
                          setEditingToken({...editingToken, explorers: newExplorers})
                        }}
                        placeholder="Display Name (e.g., Etherscan)"
                        className="bg-black/20 border-gray-700 text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">

                                                                    {(editingToken.explorers && editingToken.explorers.length > 1) && (
                            <button
                              type="button"
                              onClick={() => {
                                const newExplorers = editingToken.explorers!.filter((_, i) => i !== index)
                                setEditingToken({...editingToken, explorers: newExplorers})
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
                      value={explorer.explorerUrl}
                      onChange={(e) => {
                        const newExplorers = [...(editingToken.explorers || [])]
                        newExplorers[index].explorerUrl = e.target.value
                        setEditingToken({...editingToken, explorers: newExplorers})
                      }}
                      placeholder="URL (e.g., https://etherscan.io/token/0x...)"
                      className="bg-black/20 border-gray-700 text-white"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newExplorers = [...(editingToken.explorers || []), { 
                    explorerName: 'BscScan', 
                    explorerUrl: '', 
                    network: 'BSC', 
                    isActive: true 
                  }]
                  setEditingToken({...editingToken, explorers: newExplorers})
                }}
                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
              >
                + Add Another Explorer
              </button>
            </div>
          </div>

          {/* Wallet Links */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Support
            </label>
            <div className="space-y-3">
              {(editingToken.wallets && editingToken.wallets.length > 0 ? editingToken.wallets : []).map((wallet, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        value={wallet.walletName}
                        onChange={(e) => {
                          const newWallets = [...(editingToken.wallets || [])]
                          newWallets[index].walletName = e.target.value
                          setEditingToken({...editingToken, wallets: newWallets})
                        }}
                        placeholder="Display Name (e.g., MetaMask)"
                        className="bg-black/20 border-gray-700 text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">

                                                                    {(editingToken.wallets && editingToken.wallets.length > 1) && (
                            <button
                              type="button"
                              onClick={() => {
                                console.log('🔍 Removing wallet at index:', index)
                                console.log('🔍 Current wallets:', editingToken.wallets)
                                const newWallets = editingToken.wallets!.filter((_, i) => i !== index)
                                console.log('🔍 New wallets after removal:', newWallets)
                                setEditingToken({...editingToken, wallets: newWallets})
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
                      value={wallet.walletUrl}
                      onChange={(e) => {
                        const newWallets = [...(editingToken.wallets || [])]
                        newWallets[index].walletUrl = e.target.value
                        setEditingToken({...editingToken, wallets: newWallets})
                      }}
                      placeholder="URL (e.g., https://metamask.io)"
                      className="bg-black/20 border-gray-700 text-white"
                    />
                  </div>
                </div>
              ))}
              {editingToken.wallets && editingToken.wallets.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const newWallets = [...(editingToken.wallets || []), { 
                      walletName: 'Trust Wallet', 
                      walletUrl: 'https://trustwallet.com', 
                      walletType: 'mobile', 
                      isActive: true 
                    }]
                    setEditingToken({...editingToken, wallets: newWallets})
                  }}
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                >
                  + Add Another Wallet
                </button>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No wallet data available</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingToken({...editingToken, wallets: [{ 
                        walletName: 'MetaMask', 
                        walletUrl: 'https://metamask.io', 
                        walletType: 'browser', 
                        isActive: true 
                      }]})
                    }}
                    className="text-blue-400 hover:text-blue-300 text-xs mt-2"
                  >
                    + Add First Wallet
                  </button>
                </div>
              )}
            </div>
          </div>



          {/* Token Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Logo
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-gray-600 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleEditLogoFileSelect}
                className="hidden"
                id="edit-token-logo-upload"
              />
              <label htmlFor="edit-token-logo-upload" className="cursor-pointer">
                {editLogoPreview ? (
                  <div className="space-y-2">
                    <img
                      src={editLogoPreview}
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
              onClick={updateToken}
              disabled={isUpdating || !hasChanges()}
              className={`${
                hasChanges() 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : hasChanges() ? (
                'Update Token'
              ) : (
                'No Changes'
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
