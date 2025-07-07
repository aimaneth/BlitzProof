"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import { useWallet } from "@/hooks/use-wallet"
import { useHydrated } from "@/hooks/use-hydrated"
import { apiService, ScanResult } from "@/lib/api"
import { Layout } from "@/components/layout/layout"
import { ExportActions } from "@/components/ui/export-actions"
import { EnhancedExportActions } from "@/components/ui/enhanced-export-actions"
import { VulnerabilityFilters } from "@/components/ui/vulnerability-filters"
import { 
  Upload, 
  Search, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FileText,
  Network,
  Settings,
  Play,
  User,
  Loader2,
  Clock,
  Bug,
  Zap,
  TrendingUp,
  Target,
  Activity,
  Brain,
  HelpCircle,
  BookOpen,
  Layers,
  ChevronDown,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { AdvancedAIDashboard } from '@/components/ui/advanced-ai-dashboard'
import { ScanConfiguration } from '@/components/ui/scan-configuration'
import { CustomRulesManager } from '@/components/ui/custom-rules-manager'
import { BatchScanManager } from '@/components/ui/batch-scan-manager'
import { TutorialOverlay, useTutorial } from '@/components/ui/tutorial-overlay'
import { RealTimeProgress } from '@/components/ui/real-time-progress'
import { getSeverityColor, getSeverityBorderColor, sortVulnerabilitiesBySeverity } from "@/lib/utils"
import Image from 'next/image'

const networks = [
  { id: "ethereum", name: "Ethereum", icon: "/networks/ethereum.png" },
  { id: "polygon", name: "Polygon", icon: "/networks/polygon.png" },
  { id: "bsc", name: "BSC", icon: "/networks/bsc.png" },
  { id: "arbitrum", name: "Arbitrum", icon: "/networks/arbitrum.png" },
  { id: "optimism", name: "Optimism", icon: "/networks/optimism.png" },
  { id: "avalanche", name: "Avalanche", icon: "/networks/avalanche.png" },
  { id: "fantom", name: "Fantom", icon: "/networks/fantom.png" },
  { id: "base", name: "Base", icon: "/networks/base.png" },
  { id: "linea", name: "Linea", icon: "/networks/linea.png" },
  { id: "zksync", name: "zkSync", icon: "/networks/zksync.png" },
  { id: "scroll", name: "Scroll", icon: "/networks/scroll.png" },
  { id: "mantle", name: "Mantle", icon: "/networks/mantle.png" },
  { id: "celo", name: "Celo", icon: "/networks/celo.png" },
  { id: "gnosis", name: "Gnosis", icon: "/networks/gnosis.png" },
  { id: "moonbeam", name: "Moonbeam", icon: "/networks/moonbeam.png" },
  { id: "harmony", name: "Harmony", icon: "/networks/harmony.png" },
  { id: "cronos", name: "Cronos", icon: "/networks/cronos.png" },
  { id: "klaytn", name: "Klaytn", icon: "/networks/klaytn.png" },
  { id: "metis", name: "Metis", icon: "/networks/metis.png" },
  { id: "boba", name: "Boba", icon: "/networks/boba.png" }
]

const explorerInfo: Record<string, { name: string; url: string }> = {
  ethereum: { name: 'Etherscan', url: 'https://etherscan.io/address/' },
  polygon: { name: 'Polygonscan', url: 'https://polygonscan.com/address/' },
  bsc: { name: 'BscScan', url: 'https://bscscan.com/address/' },
  arbitrum: { name: 'Arbiscan', url: 'https://arbiscan.io/address/' },
  optimism: { name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io/address/' },
  avalanche: { name: 'Snowtrace', url: 'https://snowtrace.io/address/' },
  fantom: { name: 'FtmScan', url: 'https://ftmscan.com/address/' },
  base: { name: 'Basescan', url: 'https://basescan.org/address/' },
  linea: { name: 'Lineascan', url: 'https://lineascan.build/address/' },
  zksync: { name: 'zkScan', url: 'https://era.zksync.network/address/' },
  scroll: { name: 'Scrollscan', url: 'https://scrollscan.com/address/' },
  mantle: { name: 'Mantlescan', url: 'https://mantlescan.xyz/address/' },
  celo: { name: 'Celoscan', url: 'https://celoscan.io/address/' },
  gnosis: { name: 'Gnosisscan', url: 'https://gnosisscan.io/address/' },
  moonbeam: { name: 'Moonscan', url: 'https://moonbeam.moonscan.io/address/' },
  harmony: { name: 'Harmony Explorer', url: 'https://explorer.harmony.one/address/' },
  cronos: { name: 'Cronoscan', url: 'https://cronoscan.com/address/' },
  klaytn: { name: 'Klaytnscope', url: 'https://scope.klaytn.com/address/' },
  metis: { name: 'Metis Explorer', url: 'https://andromeda-explorer.metis.io/address/' },
  boba: { name: 'Boba Explorer', url: 'https://bobascan.com/address/' }
}

const exampleContractsByNetwork: Record<string, { name: string; address: string; description: string }[]> = {
  ethereum: [
    { name: 'USDT Token', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', description: 'Tether USD stablecoin' },
    { name: 'Uniswap V2 Router', address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', description: 'Uniswap V2 Router' },
    { name: 'Aave Lending Pool', address: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DdC7A9', description: 'Aave v2 LendingPool' },
  ],
  polygon: [
    { name: 'USDC Token', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', description: 'USD Coin on Polygon' },
    { name: 'Quickswap Router', address: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', description: 'Quickswap Router' },
  ],
  bsc: [
    { name: 'PancakeSwap Router', address: '0x10ED43C718714eb63d5aA57B78B54704E256024E', description: 'PancakeSwap V2 Router' },
    { name: 'BUSD Token', address: '0xe9e7cea3dedca5984780bafc599bd69add087d56', description: 'Binance USD' },
  ],
  arbitrum: [
    { name: 'GMX Router', address: '0xB87a436B93fFE9D75c5cFA7bAcFff96430b09868', description: 'GMX Router' },
  ],
  optimism: [
    { name: 'Synthetix Proxy', address: '0xC011A72400E58ecD99Ee497CF89E3775d4bd732F', description: 'Synthetix Proxy' },
  ],
  avalanche: [
    { name: 'WAVAX Token', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', description: 'Wrapped AVAX' },
    { name: 'TraderJoe Router', address: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4', description: 'TraderJoe Router' },
  ],
  fantom: [
    { name: 'WFTM Token', address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', description: 'Wrapped FTM' },
    { name: 'SpookySwap Router', address: '0xF491e7B69E4244ad4002BC14e878a34207E38c29', description: 'SpookySwap Router' },
  ],
  base: [
    { name: 'WETH Token', address: '0x4200000000000000000000000000000000000006', description: 'Wrapped ETH' },
    { name: 'Uniswap V3 Router', address: '0x2626664c2603336E57B271c5C0b26F421741e481', description: 'Uniswap V3 Router' },
  ],
  linea: [
    { name: 'WETH Token', address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f', description: 'Wrapped ETH' },
    { name: 'Lynex Router', address: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', description: 'Lynex Router' },
  ],
  zksync: [
    { name: 'WETH Token', address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91', description: 'Wrapped ETH' },
    { name: 'SyncSwap Router', address: '0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295', description: 'SyncSwap Router' },
  ],
  scroll: [
    { name: 'WETH Token', address: '0x5300000000000000000000000000000000000004', description: 'Wrapped ETH' },
    { name: 'iZUMi Router', address: '0x2fCDe0A2604E5F3F1B29B8B440f64cFcF7f55B14', description: 'iZUMi Router' },
  ],
  mantle: [
    { name: 'WETH Token', address: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000', description: 'Wrapped ETH' },
    { name: 'Fusion Router', address: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', description: 'Fusion Router' },
  ],
  celo: [
    { name: 'CELO Token', address: '0x471EcE3750Da237f93B8E339c536989b8978a438', description: 'CELO Native Token' },
    { name: 'Ubeswap Router', address: '0xE3D8bd6Aed4F5bc0a19d56c2e8B847C2e395f0C6', description: 'Ubeswap Router' },
  ],
  gnosis: [
    { name: 'WXDAI Token', address: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb', description: 'Wrapped XDAI' },
    { name: 'Honeyswap Router', address: '0x1C232F01118CB8B424793ae03F870aa7D0ac1f1c', description: 'Honeyswap Router' },
  ],
  moonbeam: [
    { name: 'WGLMR Token', address: '0xAcc15dC74880C9944775448304B263D191c6077F', description: 'Wrapped GLMR' },
    { name: 'StellaSwap Router', address: '0x70085a09D30D6f8C4ecF6eE10120d1847383BB57', description: 'StellaSwap Router' },
  ],
  harmony: [
    { name: 'WONE Token', address: '0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a', description: 'Wrapped ONE' },
    { name: 'ViperSwap Router', address: '0xf012702a5f0e54015362cBCA26a26fc90AA832a3', description: 'ViperSwap Router' },
  ],
  cronos: [
    { name: 'WCRO Token', address: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23', description: 'Wrapped CRO' },
    { name: 'CronaSwap Router', address: '0xcd7d16fB918511BF7269eC4f2d2bE2C9464c0A7B', description: 'CronaSwap Router' },
  ],
  klaytn: [
    { name: 'WKLAY Token', address: '0x19eac9d62ffef9e6c8c8c8c8c8c8c8c8c8c8c8c', description: 'Wrapped KLAY' },
    { name: 'KlaySwap Router', address: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', description: 'KlaySwap Router' },
  ],
  metis: [
    { name: 'WETH Token', address: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000', description: 'Wrapped ETH' },
    { name: 'Tethys Router', address: '0x81b9FA50D5f46b5C5B0C8E4B5C5B0C8E4B5C5B0C8', description: 'Tethys Router' },
  ],
  boba: [
    { name: 'WETH Token', address: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000', description: 'Wrapped ETH' },
    { name: 'OolongSwap Router', address: '0x17C83E2B96Acfb5190d63F5E46d93c107eC0b514', description: 'OolongSwap Router' },
  ]
}

export default function ScannerPage() {
  // All hooks at the top!
  const { isConnected, shortAddress } = useWallet()
  const { isTutorialOpen, openTutorial, closeTutorial } = useTutorial()
  const isHydrated = useHydrated()
  const [selectedNetwork, setSelectedNetwork] = useState("ethereum")
  const [isScanning, setIsScanning] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [contractAddress, setContractAddress] = useState<string>("")
  const [inputMethod, setInputMethod] = useState<"file" | "address">("file")
  const [currentScanId, setCurrentScanId] = useState<string | null>(null)
  const [scanResults, setScanResults] = useState<ScanResult | null>(null)
  const [currentProgress, setCurrentProgress] = useState<{ status: string; progress: number; step?: string } | null>(null)
  const [scanStartTime, setScanStartTime] = useState<Date | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<number>(0)
  const [isValidatingAddress, setIsValidatingAddress] = useState(false)
  const [fetchedContract, setFetchedContract] = useState<{ name: string; address: string; explorer: string } | null>(null)
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState<any[]>([])
  const [showAdvancedAI, setShowAdvancedAI] = useState(false)
  const [showScanConfig, setShowScanConfig] = useState(false)
  const [scanConfig, setScanConfig] = useState<any>(null)
  // New enhanced features state
  const [activeTab, setActiveTab] = useState<'scanner' | 'custom-rules' | 'batch-scan'>('scanner')
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)

  // Close network dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.network-dropdown')) {
        setShowNetworkDropdown(false)
      }
    }

    if (showNetworkDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNetworkDropdown])

  // Auto-switch input method for tutorial steps
  useEffect(() => {
    const checkTutorialStep = () => {
      if (isTutorialOpen) {
        const currentTutorialStep = localStorage.getItem('blitzproof-tutorial-current-step') || '0'
        const stepNumber = parseInt(currentTutorialStep)
        // Step 4 is Contract Address Analysis (0-indexed, so step 3)
        if (stepNumber === 3) {
          setInputMethod("address")
        }
      }
    }
    // Check immediately
    checkTutorialStep()
    // Listen for storage changes (when tutorial step changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'blitzproof-tutorial-current-step') {
        checkTutorialStep()
      }
    }
    // Listen for custom events (for same-tab communication)
    const handleTutorialStepChange = () => {
      checkTutorialStep()
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('tutorial-step-change', handleTutorialStepChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('tutorial-step-change', handleTutorialStepChange)
    }
  }, [isTutorialOpen])

  // Validate Ethereum address
  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  // Handle contract address input
  const handleAddressChange = (address: string) => {
    setContractAddress(address)
    if (address && !isValidEthereumAddress(address)) {
      toast.error('Please enter a valid Ethereum address (0x... format)')
    }
  }

  // Handle input method change
  const handleInputMethodChange = (method: "file" | "address") => {
    setInputMethod(method)
    setUploadedFile(null)
    setContractAddress("")
    setScanResults(null)
    setCurrentScanId(null)
    setCurrentProgress(null)
    setScanStartTime(null)
    setEstimatedTime(0)
  }

  // Validate and fetch contract
  const validateAndFetchContract = async () => {
    if (!contractAddress || !isValidEthereumAddress(contractAddress)) {
      toast.error('Please enter a valid Ethereum address')
      return false
    }
    setIsValidatingAddress(true)
    setFetchedContract(null)
    try {
      const result = await apiService.scanContractAddress(contractAddress, selectedNetwork)
      setFetchedContract({
        name: result.contractName || 'Unknown Contract',
        address: contractAddress,
        explorer: `${explorerInfo[selectedNetwork].url}${contractAddress}`
      })
      toast.success(`✅ Contract loaded successfully!`)
      return true
    } catch (error) {
      console.error('Contract fetch error:', error)
      if (error instanceof Error) {
        if (error.message.includes('not verified')) {
          toast.error('Contract not verified on explorer. Only verified contracts can be analyzed.')
        } else if (error.message.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please try again later.')
        } else {
          toast.error(error.message || 'Failed to fetch contract source code')
        }
      } else {
        toast.error('Failed to fetch contract source code. Please check your connection.')
      }
      return false
    } finally {
      setIsValidatingAddress(false)
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.sol')) {
        toast.error('Please upload a Solidity (.sol) file')
        return
      }
      
      // File size validation (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      
      setUploadedFile(file)
      setContractAddress("")
      setInputMethod("file")
      setScanResults(null)
      setCurrentScanId(null)
      setCurrentProgress(null)
      setScanStartTime(null)
      setEstimatedTime(0)
      toast.success(`File "${file.name}" loaded successfully`)
    }
  }

  // Handle scan submission
  const handleScan = async () => {
    // Check if wallet is connected
    if (!isConnected) {
      toast.error('Please connect your wallet to start scanning')
      return
    }

    if (inputMethod === "file" && !uploadedFile) {
      toast.error('Please select a file first')
      return
    }

    if (inputMethod === "address" && !contractAddress) {
      toast.error('Please enter a contract address')
      return
    }

    try {
      setIsScanning(true)
      
      let result
      if (inputMethod === "file") {
        result = await apiService.uploadAndScan(uploadedFile!, selectedNetwork)
      } else {
        // For address-based scanning, we'll need to implement this in the API
        // For now, we'll use the same endpoint with a different payload
        result = await apiService.scanContractAddress(contractAddress, selectedNetwork)
      }
      
      setCurrentScanId(result.scanId)
      setCurrentProgress({ status: 'pending', progress: 0 })
      setScanStartTime(new Date())
      setEstimatedTime(45) // Estimated 45 seconds
      toast.success('🚀 Security scan initiated!')
      // Don't set isScanning to false here - keep it true until scan completes
    } catch (error) {
      console.error('Scan error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start scan')
      setIsScanning(false) // Only set to false on error
    }
  }

  // Simple polling - NO TOAST SPAM
  useEffect(() => {
    if (!currentScanId) return

    const poll = async () => {
      try {
        const status = await apiService.getScanStatus(currentScanId)
        

        
        setCurrentProgress({
          status: status.status,
          progress: status.progress || 0
        })
        
        if (status.status === 'completed') {
          console.log('🔍 Frontend Debug: Scan completed, received data:', {
            vulnerabilities: status.vulnerabilities?.length || 0,
            aiAnalysis: status.aiAnalysis?.length || 0,
            summary: status.summary,
            score: status.score
          })
          setScanResults(status)
          setCurrentProgress(null)
          setIsScanning(false) // Set scanning to false when completed
          const duration = scanStartTime ? Math.round((new Date().getTime() - scanStartTime.getTime()) / 1000) : 0
          toast.success(`✅ Scan completed in ${duration}s! Found ${status.vulnerabilities?.length || 0} issues.`)
          return true // Stop polling
        } else if (status.status === 'failed') {
          setCurrentProgress(null)
          setIsScanning(false) // Set scanning to false when failed
          toast.error('❌ Scan failed - Please try again')
          return true // Stop polling
        }
        
        return false // Continue polling
      } catch (error) {
        console.error('Poll error:', error)
        return false
      }
    }

    // Initial poll - check immediately
    poll().then((shouldStop) => {
      if (shouldStop) return
      
      // Continue polling every 3 seconds
      const interval = setInterval(async () => {
        const shouldStop = await poll()
        if (shouldStop) {
          clearInterval(interval)
        }
      }, 3000)
      
      // Cleanup
      return () => clearInterval(interval)
    })

  }, [currentScanId, scanStartTime])





  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return <XCircle className="h-4 w-4" />
      case "medium": return <AlertTriangle className="h-4 w-4" />
      case "low": return <CheckCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  // All hooks (useState, useEffect, useCallback, etc.) are now above this line
  if (!isHydrated) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Loading Scanner...
            </h2>
            <p className="text-muted-foreground">
              Initializing security scanner...
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 lg:px-8">
        {/* Enhanced Header with Sleek Background */}
        <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-xl sm:rounded-2xl">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
          
          {/* Animated Background Patterns */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-0 left-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          
          {/* Content */}
          <div className="relative z-10 p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="relative scanner-header-float">
                    <Image src="/icons/scanner.png" alt="Scanner Icon" width={48} height={48} className="h-8 w-8 sm:h-12 sm:w-12 relative z-10" />
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg scanner-header-glow"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text-subtle">
                      Smart Contract Scanner
                    </h1>
                    <div className="h-1 w-16 sm:w-24 bg-gradient-to-r from-primary to-blue-500 rounded-full mt-1 sm:mt-2 scanner-header-glow"></div>
                  </div>
                </div>
                
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-4 sm:mb-6 max-w-2xl">
                  Advanced security analysis powered by Slither and AI-driven vulnerability detection
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
                  <div className="flex items-center gap-2 bg-white/5 px-3 sm:px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-red-500/20 rounded-full">
                      <Bug className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
                    </div>
                    <span className="text-white/80 font-medium text-xs sm:text-sm">Vulnerability Detection</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 sm:px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-yellow-500/20 rounded-full">
                      <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                    </div>
                    <span className="text-white/80 font-medium text-xs sm:text-sm">Real-time Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 sm:px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="p-1 bg-blue-500/20 rounded-full">
                      <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                    </div>
                    <span className="text-white/80 font-medium text-xs sm:text-sm">Multi-chain Support</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Wallet Status Indicator */}
                {isHydrated && (
                  <div className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg border backdrop-blur-sm ${
                    isConnected 
                      ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                      : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                      {isConnected ? 'Wallet Connected' : 'Wallet Required'}
                    </span>
                    <span className="text-xs sm:hidden">
                      {isConnected ? 'Connected' : 'Required'}
                    </span>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openTutorial}
                  className="flex items-center gap-1 sm:gap-2 bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 backdrop-blur-sm"
                >
                  <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Help</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Features Tab Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-white/5 rounded-lg sm:rounded-xl border border-white/10 backdrop-blur-sm overflow-x-auto">
            <Button
              variant={activeTab === 'scanner' ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === 'scanner' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Scanner</span>
            </Button>
            <Button
              variant={activeTab === 'custom-rules' ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab('custom-rules')}
              className={`flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === 'custom-rules' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Custom Rules</span>
            </Button>
            <Button
              variant={activeTab === 'batch-scan' ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab('batch-scan')}
              className={`flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === 'batch-scan' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Batch Scan</span>
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'scanner' && (
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {/* Left Column - Upload & Settings */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* User Status */}
              {isHydrated && (
                isConnected ? (
                  <Card className="bg-card/30 border border-white/10 shadow-lg rounded-xl sm:rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                        Connected User
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm text-muted-foreground break-all">{shortAddress}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your scan history will be saved to your account.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-yellow-500/10 border border-yellow-500/20 shadow-lg rounded-xl sm:rounded-2xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-yellow-500 text-sm sm:text-base">
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                        Wallet Required
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Connect your wallet to access the security scanner and save your scan history.
                        </p>
                        <div className="flex justify-center">
                          <ConnectWallet />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}

              {/* Network Selection */}
              <Card className="bg-card/30 border border-white/10 shadow-lg rounded-xl sm:rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Network className="h-4 w-4 sm:h-5 sm:w-5" />
                    Target Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Current Selected Network Display */}
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Image 
                          src={networks.find(n => n.id === selectedNetwork)?.icon || '/networks/ethereum.png'}
                          alt={`${networks.find(n => n.id === selectedNetwork)?.name || 'Network'} logo`}
                          width={24}
                          height={24}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover filter-grayscale brightness-50"
                        />
                        <div>
                          <p className="font-medium text-foreground text-sm sm:text-base">
                            {networks.find(n => n.id === selectedNetwork)?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {explorerInfo[selectedNetwork]?.name} Explorer
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </div>

                    {/* Network Selection Dropdown */}
                    <div className="relative network-dropdown">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                        className="w-full justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Network className="h-4 w-4" />
                          <span className="text-xs sm:text-sm">Change Network</span>
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showNetworkDropdown ? 'rotate-180' : ''}`} />
                      </Button>
                      
                      {showNetworkDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          <div className="p-2">
                            {networks.map((network) => (
                              <button
                                key={network.id}
                                onClick={() => {
                                  setSelectedNetwork(network.id)
                                  setShowNetworkDropdown(false)
                                }}
                                className={`w-full flex items-center gap-2 sm:gap-3 p-2 rounded-md text-left transition-colors ${
                                  selectedNetwork === network.id 
                                    ? 'bg-primary/20 text-primary' 
                                    : 'hover:bg-card/50 text-foreground'
                                }`}
                              >
                                <Image 
                                  src={network.icon || '/networks/ethereum.png'}
                                  alt={`${network.name || 'Network'} logo`}
                                  width={20}
                                  height={20}
                                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover filter-grayscale brightness-50"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-xs sm:text-sm truncate">{network.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {explorerInfo[network.id]?.name}
                                  </p>
                                </div>
                                {selectedNetwork === network.id && (
                                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Unified Contract Input & Security Analysis */}
              <Card className="bg-card/30 border border-white/10 shadow-lg rounded-xl sm:rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Security Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 sm:space-y-6">
                    {/* Input Method Toggle */}
                    <div className="flex items-center gap-1 sm:gap-2 p-1 bg-card rounded-lg input-method-toggle">
                      <Button
                        variant={inputMethod === "file" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleInputMethodChange("file")}
                        className="flex-1"
                      >
                        <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">File Upload</span>
                      </Button>
                      <Button
                        variant={inputMethod === "address" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleInputMethodChange("address")}
                        className="flex-1"
                      >
                        <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Contract Address</span>
                      </Button>
                    </div>

                    {/* File Upload Section */}
                    {inputMethod === "file" && (
                      <div className="space-y-4">
                        <div 
                          className="border-2 border-dashed border-primary/30 rounded-lg p-4 sm:p-6 text-center hover:border-primary/50 transition-colors relative group file-upload-area"
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                            const files = e.dataTransfer.files
                            if (files.length > 0) {
                              const file = files[0]
                              if (file.name.endsWith('.sol')) {
                                handleFileUpload({ target: { files: [file] } } as any)
                              }
                            }
                          }}
                        >
                          <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-primary mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                          <p className="text-sm sm:text-base font-medium text-foreground mb-1">
                            Upload Solidity Contract
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                            Supports .sol files up to 10MB
                          </p>
                          <p className="text-xs text-primary/70 mb-3 sm:mb-4">
                            Drag & drop your .sol file here, or click to browse
                          </p>
                          <input
                            type="file"
                            accept=".sol"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          {/* Hidden file input for quick upload button */}
                          <input
                            type="file"
                            accept=".sol"
                            onChange={(e) => {
                              handleFileUpload(e)
                              // Automatically switch to file input method when file is selected
                              setInputMethod("file")
                              // Show success message for quick upload
                              if (e.target.files?.[0]) {
                                toast.success(`File "${e.target.files[0].name}" uploaded successfully!`)
                              }
                            }}
                            className="hidden"
                            id="quick-upload-input"
                          />
                          <label htmlFor="file-upload">
                            <Button variant="outline" size="sm" asChild className="cursor-pointer hover:bg-primary/10">
                              <span className="flex items-center gap-1 sm:gap-2">
                                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm">Choose File</span>
                              </span>
                            </Button>
                          </label>
                        </div>
                        
                        {uploadedFile && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-2 sm:p-3 bg-primary/10 border border-primary/20 rounded-lg"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground text-sm sm:text-base truncate">{uploadedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(uploadedFile.size / 1024).toFixed(1)} KB • Ready for analysis
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                              <span className="text-xs text-green-600 font-medium">Loaded</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Contract Address Section */}
                    {inputMethod === "address" && (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 sm:p-6 text-center">
                          <Target className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-primary mb-2 sm:mb-3" />
                          <p className="text-sm sm:text-base font-medium text-foreground mb-1">
                            Enter Contract Address
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                            Paste a deployed contract address to analyze
                          </p>
                          <div className="w-full space-y-3">
                            <input
                              type="text"
                              placeholder="0x..."
                              value={contractAddress}
                              onChange={(e) => handleAddressChange(e.target.value)}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 contract-address-input text-sm sm:text-base"
                            />
                            <Button
                              onClick={validateAndFetchContract}
                              disabled={!contractAddress || isValidatingAddress}
                              className="w-full"
                              size="sm"
                            >
                              {isValidatingAddress ? (
                                <>
                                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                                  <span className="text-xs sm:text-sm">Validating...</span>
                                </>
                              ) : (
                                <>
                                  <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  <span className="text-xs sm:text-sm">Fetch Contract</span>
                                </>
                              )}
                            </Button>
                            
                            {/* Example Contracts */}
                            <div className="mt-3 sm:mt-4">
                              <p className="text-xs text-muted-foreground mb-2">Try these verified contracts:</p>
                              <div className="space-y-2">
                                {(exampleContractsByNetwork[selectedNetwork] || []).map((contract) => (
                                  <button
                                    key={contract.address}
                                    onClick={() => handleAddressChange(contract.address)}
                                    className="w-full text-left p-2 text-xs bg-card/50 rounded border border-border hover:bg-card transition-colors"
                                  >
                                    <div className="font-medium text-foreground text-xs">{contract.name}</div>
                                    <div className="text-muted-foreground text-xs">{contract.address.slice(0, 8)}...{contract.address.slice(-6)}</div>
                                    <div className="text-muted-foreground italic text-xs">{contract.description}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {fetchedContract && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-2 sm:p-3 bg-primary/10 border border-primary/20 rounded-lg"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground text-sm sm:text-base truncate">{fetchedContract.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {fetchedContract.address.slice(0, 8)}...{fetchedContract.address.slice(-6)} • Ready for analysis
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                              <span className="text-xs text-green-600 font-medium">Loaded</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Scan Button */}
                    {isHydrated && (
                      !isConnected ? (
                        <div className="space-y-3">
                          <div className="p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg sm:rounded-xl text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <User className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                              <span className="text-xs sm:text-sm font-medium text-yellow-500">Wallet Required</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              Connect your wallet to access the security scanner
                            </p>
                            <div className="flex justify-center">
                              <ConnectWallet />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={handleScan}
                          disabled={!uploadedFile && !fetchedContract || isScanning}
                          className="w-full start-scan-button"
                          size="sm"
                        >
                          {isScanning ? (
                            <>
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                              <span className="text-xs sm:text-sm">Scanning...</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="text-xs sm:text-sm">Start Security Scan</span>
                            </>
                          )}
                        </Button>
                      )
                    )}

                    {/* Advanced Options */}
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowScanConfig(true)}
                        className="scan-config-button flex-1"
                      >
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Scan Config</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdvancedAI(true)}
                        disabled={!scanResults}
                        className="flex-1"
                      >
                        <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">AI Analysis</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Results & Dashboard */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Progress Indicator */}
              {isScanning && currentProgress && (
                <Card className="bg-card/30 border border-white/10 shadow-lg rounded-xl sm:rounded-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground">Scan Progress</h3>
                        <span className="text-xs sm:text-sm text-muted-foreground">{currentProgress.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${currentProgress.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">{currentProgress.status}</span>
                        {currentProgress.step && (
                          <span className="text-primary">{currentProgress.step}</span>
                        )}
                      </div>
                      {estimatedTime > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Estimated time remaining: {Math.ceil(estimatedTime / 60)} minutes
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Scan Results */}
              {scanResults ? (
                <Card className="bg-card/30 border border-white/10 shadow-lg rounded-xl sm:rounded-2xl results-area">
                  <CardContent className="p-4 sm:p-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 sm:space-y-6"
                    >
                      {/* Export Actions */}
                      {scanResults && currentScanId && (
                        <div className="mb-3 sm:mb-4">
                          <EnhancedExportActions scanId={currentScanId} />
                        </div>
                      )}
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-center p-3 sm:p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg sm:rounded-xl"
                        >
                          <XCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 text-red-500" />
                          <div className="text-xl sm:text-3xl font-bold text-red-500 mb-1">{scanResults.summary.high}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Critical</div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-center p-3 sm:p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-lg sm:rounded-xl"
                        >
                          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 text-yellow-500" />
                          <div className="text-xl sm:text-3xl font-bold text-yellow-500 mb-1">{scanResults.summary.medium}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Medium</div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-center p-3 sm:p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg sm:rounded-xl"
                        >
                          <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 text-blue-500" />
                          <div className="text-xl sm:text-3xl font-bold text-blue-500 mb-1">{scanResults.summary.low}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Low</div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-center p-3 sm:p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg sm:rounded-xl"
                        >
                          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 text-primary" />
                          <div className="text-xl sm:text-3xl font-bold text-primary mb-1">{scanResults.score}%</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">Score</div>
                        </motion.div>
                      </div>

                      {/* Analysis Summary */}
                      <div className="p-4 sm:p-6 bg-card/50 rounded-lg sm:rounded-xl border border-border/50">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-semibold text-foreground">Analysis Summary</h3>
                          <span className="text-xs text-muted-foreground">
                            {scanResults.vulnerabilities.length} total findings
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-foreground">Security Rating</p>
                              <p className="text-xs text-muted-foreground">
                                {scanResults.score >= 80 ? 'Excellent' : scanResults.score >= 60 ? 'Good' : scanResults.score >= 40 ? 'Fair' : 'Poor'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-foreground">Scan Duration</p>
                              <p className="text-xs text-muted-foreground">
                                {scanStartTime ? Math.round((new Date().getTime() - scanStartTime.getTime()) / 1000) : 0}s
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Vulnerability Filters */}
                      <VulnerabilityFilters
                        vulnerabilities={scanResults.vulnerabilities}
                        onFilteredVulnerabilities={setFilteredVulnerabilities}
                        className="mb-4 sm:mb-6"
                      />

                      {/* Vulnerability List */}
                      <div className="space-y-2 sm:space-y-3">
                        {sortVulnerabilitiesBySeverity(filteredVulnerabilities.length > 0 ? filteredVulnerabilities : scanResults.vulnerabilities).map((result) => (
                          <motion.div
                            key={result.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`relative p-3 sm:p-4 pl-4 sm:pl-6 bg-card/30 rounded-lg sm:rounded-xl shadow-lg border-l-4 ${getSeverityBorderColor(result.severity)} mb-2 group transition-all duration-200`}
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className={`mt-1 ${getSeverityColor(result.severity)}`}>
                                {getSeverityIcon(result.severity)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground text-sm sm:text-base">
                                    {result.title}
                                  </h4>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getSeverityColor(result.severity)} bg-white/10 flex items-center gap-1 w-fit`}>
                                    {getSeverityIcon(result.severity)} {result.severity.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                                  {result.description}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                                  <span>Line {result.line}</span>
                                  <span>File: {result.file}</span>
                                </div>
                                <div className="mt-2 p-2 bg-card rounded text-xs">
                                  <strong>Recommendation:</strong> {result.recommendation}
                                </div>
                                
                                {/* AI Analysis Section */}
                                {scanResults.aiAnalysis && scanResults.aiAnalysis.find(ai => ai.vulnerabilityId === result.id) && (
                                  <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Brain className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs font-semibold text-blue-500">AI Analysis</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => {
                                          // Toggle AI analysis visibility
                                          const aiSection = document.getElementById(`ai-analysis-${result.id}`)
                                          if (aiSection) {
                                            aiSection.classList.toggle('hidden')
                                          }
                                        }}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    
                                                                         <div id={`ai-analysis-${result.id}`} className="space-y-2 text-xs">
                                       {(() => {
                                         const aiData = scanResults.aiAnalysis.find(ai => ai.vulnerabilityId === result.id)
                                         if (!aiData) return null
                                         
                                         return (
                                           <div className="space-y-2 text-xs">
                                             {/* Enhanced Description */}
                                             {aiData.enhancedDescription && (
                                               <div>
                                                 <span className="font-medium text-foreground">Enhanced Analysis:</span>
                                                 <p className="text-muted-foreground mt-1">{aiData.enhancedDescription}</p>
                                               </div>
                                             )}
                                             
                                             {/* Confidence Score */}
                                             {aiData.confidence && (
                                               <div className="flex items-center justify-between">
                                                 <span className="font-medium text-foreground">AI Confidence:</span>
                                                 <span className={`font-bold ${
                                                   aiData.confidence >= 0.8 ? 'text-green-500' :
                                                   aiData.confidence >= 0.6 ? 'text-yellow-500' : 'text-red-500'
                                                 }`}>
                                                   {Math.round(aiData.confidence * 100)}%
                                                 </span>
                                               </div>
                                             )}
                                             
                                             {/* Risk Score */}
                                             {aiData.riskScore && (
                                               <div className="flex items-center justify-between">
                                                 <span className="font-medium text-foreground">Risk Score:</span>
                                                 <span className={`font-bold ${
                                                   aiData.riskScore >= 80 ? 'text-red-500' :
                                                   aiData.riskScore >= 60 ? 'text-orange-500' :
                                                   aiData.riskScore >= 40 ? 'text-yellow-500' : 'text-green-500'
                                                 }`}>
                                                   {aiData.riskScore}/100
                                                 </span>
                                               </div>
                                             )}
                                             
                                             {/* Exploitability Score */}
                                             {aiData.exploitabilityScore && (
                                               <div className="flex items-center justify-between">
                                                 <span className="font-medium text-foreground">Exploitability:</span>
                                                 <span className="font-bold text-foreground">{aiData.exploitabilityScore}/100</span>
                                               </div>
                                             )}
                                             
                                             {/* Impact Score */}
                                             {aiData.impactScore && (
                                               <div className="flex items-center justify-between">
                                                 <span className="font-medium text-foreground">Impact Score:</span>
                                                 <span className="font-bold text-foreground">{aiData.impactScore}/100</span>
                                               </div>
                                             )}
                                             
                                             {/* False Positive Risk */}
                                             {aiData.falsePositiveRisk && (
                                               <div className="flex items-center justify-between">
                                                 <span className="font-medium text-foreground">False Positive Risk:</span>
                                                 <span className="font-bold text-foreground">{Math.round(aiData.falsePositiveRisk)}%</span>
                                               </div>
                                             )}
                                             
                                             {/* Smart Remediation */}
                                             {aiData.smartRemediation && (
                                               <div className="mt-2">
                                                 <span className="font-medium text-foreground">AI Remediation:</span>
                                                 <p className="text-muted-foreground mt-1">{aiData.smartRemediation}</p>
                                               </div>
                                             )}
                                             
                                             {/* CWE IDs */}
                                             {aiData.cweIds && aiData.cweIds.length > 0 && (
                                               <div className="mt-2">
                                                 <span className="font-medium text-foreground">CWE IDs:</span>
                                                 <div className="flex flex-wrap gap-1 mt-1">
                                                   {aiData.cweIds.map((cwe: string, index: number) => (
                                                     <span key={index} className="px-2 py-1 bg-orange-500/20 text-orange-500 rounded text-xs">
                                                       {cwe}
                                                     </span>
                                                   ))}
                                                 </div>
                                               </div>
                                             )}
                                             
                                             {/* Tags */}
                                             {aiData.tags && aiData.tags.length > 0 && (
                                               <div className="mt-2">
                                                 <span className="font-medium text-foreground">Tags:</span>
                                                 <div className="flex flex-wrap gap-1 mt-1">
                                                   {aiData.tags.slice(0, 3).map((tag: string, index: number) => (
                                                     <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs">
                                                       {tag}
                                                     </span>
                                                   ))}
                                                   {aiData.tags.length > 3 && (
                                                     <span className="px-2 py-1 bg-gray-500/20 text-gray-500 rounded text-xs">
                                                       +{aiData.tags.length - 3}
                                                     </span>
                                                   )}
                                                 </div>
                                               </div>
                                             )}
                                           </div>
                                         )
                                       })()}
                                     </div>
                                   </div>
                                 )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              ) : (
                /* Dashboard Content when no scan results */
                <div className="space-y-4 sm:space-y-6">
                  {/* Welcome & Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="bg-gradient-to-br from-primary/10 to-blue-500/5 border border-primary/20 shadow-lg">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-2 bg-primary/20 rounded-lg">
                            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Total Scans</p>
                            <p className="text-xl sm:text-2xl font-bold text-foreground">1,247</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 shadow-lg">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Secure Contracts</p>
                            <p className="text-xl sm:text-2xl font-bold text-foreground">892</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 shadow-lg sm:col-span-2 lg:col-span-1">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-2 bg-orange-500/20 rounded-lg">
                            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Vulnerabilities Found</p>
                            <p className="text-xl sm:text-2xl font-bold text-foreground">355</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card className="bg-card/30 border border-white/10 shadow-lg results-area">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <Button 
                          variant="outline" 
                          className="h-12 sm:h-16 flex flex-col items-center justify-center gap-1 sm:gap-2 hover:bg-primary/10"
                          onClick={() => {
                            // Trigger file input directly
                            const fileInput = document.getElementById('quick-upload-input') as HTMLInputElement
                            if (fileInput) {
                              fileInput.click()
                            }
                          }}
                        >
                          <Upload className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                          <span className="text-xs sm:text-sm font-medium">Upload Contract</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-12 sm:h-16 flex flex-col items-center justify-center gap-1 sm:gap-2 hover:bg-primary/10"
                          onClick={() => setInputMethod("address")}
                        >
                          <Target className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                          <span className="text-xs sm:text-sm font-medium">Scan Address</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-12 sm:h-16 flex flex-col items-center justify-center gap-1 sm:gap-2 hover:bg-primary/10"
                          onClick={() => setActiveTab('custom-rules')}
                        >
                          <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                          <span className="text-xs sm:text-sm font-medium">Custom Rules</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-12 sm:h-16 flex flex-col items-center justify-center gap-1 sm:gap-2 hover:bg-primary/10"
                          onClick={() => setActiveTab('batch-scan')}
                        >
                          <Layers className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                          <span className="text-xs sm:text-sm font-medium">Batch Scan</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="bg-card/30 border border-white/10 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-card/50 rounded-lg">
                          <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-full">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">USDT Token Analysis</p>
                            <p className="text-xs text-muted-foreground">Completed 2 minutes ago</p>
                          </div>
                          <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs">Secure</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-card/50 rounded-lg">
                          <div className="p-1.5 sm:p-2 bg-yellow-500/20 rounded-full">
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">DeFi Protocol Scan</p>
                            <p className="text-xs text-muted-foreground">Completed 15 minutes ago</p>
                          </div>
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-xs">3 Issues</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-card/50 rounded-lg">
                          <div className="p-1.5 sm:p-2 bg-red-500/20 rounded-full">
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">NFT Contract Analysis</p>
                            <p className="text-xs text-muted-foreground">Completed 1 hour ago</p>
                          </div>
                          <Badge variant="outline" className="text-red-500 border-red-500/30 text-xs">Critical</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security Tips */}
                  <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        Security Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="p-1 bg-blue-500/20 rounded-full mt-0.5">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Always verify contract addresses before scanning to ensure you&apos;re analyzing the correct contract.
                          </p>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="p-1 bg-blue-500/20 rounded-full mt-0.5">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Use custom rules to detect project-specific vulnerabilities and patterns.
                          </p>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="p-1 bg-blue-500/20 rounded-full mt-0.5">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Review high and medium severity findings first, as they pose the greatest security risks.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Rules Tab */}
        {activeTab === 'custom-rules' && (
          <CustomRulesManager
            onRulesUpdate={(rules) => {
              console.log('Custom rules updated:', rules.length)
            }}
          />
        )}

        {/* Batch Scan Tab */}
        {activeTab === 'batch-scan' && (
          <BatchScanManager
            onJobComplete={(job) => {
              toast.success(`Batch scan completed! Processed ${job.processedFiles} files.`)
            }}
            onJobUpdate={(job) => {
              console.log('Batch scan progress:', job.progress)
            }}
          />
        )}
      </div>

      {/* Advanced AI Dashboard Modal */}
      {showAdvancedAI && scanResults && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-card border border-border rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-foreground">Advanced AI Analysis</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedAI(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <AdvancedAIDashboard
                vulnerabilities={scanResults.vulnerabilities}
                aiAnalysis={scanResults.aiAnalysis || []}
                onRefresh={() => {
                  // Refresh AI analysis
                  setShowAdvancedAI(false)
                  setTimeout(() => setShowAdvancedAI(true), 100)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Scan Configuration Modal */}
      {showScanConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-foreground">Scan Configuration</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScanConfig(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <ScanConfiguration
                onSave={(config) => {
                  setScanConfig(config)
                  setShowScanConfig(false)
                  toast.success('Scan configuration saved successfully!')
                }}
                onLoad={(config) => {
                  setScanConfig(config)
                  setShowScanConfig(false)
                  toast.success('Scan configuration loaded successfully!')
                }}
                defaultConfig={scanConfig}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Real-time Progress */}
      <RealTimeProgress
        scanId={currentScanId || ''}
        isVisible={isScanning && !!currentScanId}
        onComplete={(results) => {
          setScanResults(results)
          setIsScanning(false)
          setCurrentScanId(null)
          toast.success('✅ Scan completed! Found vulnerabilities and generated AI analysis.')
        }}
        onError={(error) => {
          setIsScanning(false)
          setCurrentScanId(null)
          toast.error(`❌ Scan failed: ${error}`)
        }}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay isOpen={isTutorialOpen} onClose={closeTutorial} />
    </Layout>
  )
} 