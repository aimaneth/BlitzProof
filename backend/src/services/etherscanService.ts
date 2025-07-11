import axios from 'axios'

interface ExplorerConfig {
  name: string
  baseUrl: string
  apiKey?: string
  apiKeyParam: string
}

interface ContractInfo {
  SourceCode: string
  ABI: string
  ContractName: string
  CompilerVersion: string
  OptimizationUsed: string
  Runs: string
  ConstructorArguments: string
  EVMVersion: string
  Library: string
  LicenseType: string
  Proxy: string
  Implementation: string
  SwarmSource: string
}

interface ContractResponse {
  status: string
  message: string
  result: ContractInfo[]
}

class EtherscanService {
  private explorers: Record<string, ExplorerConfig> = {
    ethereum: {
      name: 'Etherscan',
      baseUrl: 'https://api.etherscan.io/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.ETHERSCAN_API_KEY
    },
    polygon: {
      name: 'Polygonscan',
      baseUrl: 'https://api.polygonscan.com/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.POLYGONSCAN_API_KEY
    },
    bsc: {
      name: 'BscScan',
      baseUrl: 'https://api.bscscan.com/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.BSCSCAN_API_KEY
    },
    arbitrum: {
      name: 'Arbiscan',
      baseUrl: 'https://api.arbiscan.io/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.ARBISCAN_API_KEY
    },
    optimism: {
      name: 'Optimistic Etherscan',
      baseUrl: 'https://api-optimistic.etherscan.io/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.OPTIMISM_API_KEY
    },
    avalanche: {
      name: 'Snowtrace',
      baseUrl: 'https://api.snowtrace.io/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.SNOWTRACE_API_KEY
    },
    fantom: {
      name: 'FtmScan',
      baseUrl: 'https://api.ftmscan.com/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.FTMSCAN_API_KEY
    },
    base: {
      name: 'Basescan',
      baseUrl: 'https://api.basescan.org/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.BASESCAN_API_KEY
    },
    linea: {
      name: 'Lineascan',
      baseUrl: 'https://api.lineascan.build/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.LINEASCAN_API_KEY
    },
    zksync: {
      name: 'zkScan',
      baseUrl: 'https://api-era.zksync.network/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.ZKSCAN_API_KEY
    },
    scroll: {
      name: 'Scrollscan',
      baseUrl: 'https://api.scrollscan.com/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.SCROLLSCAN_API_KEY
    },
    mantle: {
      name: 'Mantlescan',
      baseUrl: 'https://api.mantlescan.xyz/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.MANTLESCAN_API_KEY
    },
    celo: {
      name: 'Celoscan',
      baseUrl: 'https://api.celoscan.io/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.CELOSCAN_API_KEY
    },
    gnosis: {
      name: 'Gnosisscan',
      baseUrl: 'https://api.gnosisscan.io/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.GNOSISSCAN_API_KEY
    },
    moonbeam: {
      name: 'Moonscan',
      baseUrl: 'https://api-moonbeam.moonscan.io/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.MOONSCAN_API_KEY
    },
    harmony: {
      name: 'Harmony Explorer',
      baseUrl: 'https://api.explorer.harmony.one/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.HARMONY_API_KEY
    },
    cronos: {
      name: 'Cronoscan',
      baseUrl: 'https://api.cronoscan.com/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.CRONOSCAN_API_KEY
    },
    klaytn: {
      name: 'Klaytnscope',
      baseUrl: 'https://api-cypress.klaytnscope.com/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.KLAYTNSCOPE_API_KEY
    },
    metis: {
      name: 'Metis Explorer',
      baseUrl: 'https://api.andromeda-explorer.metis.io/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.METIS_API_KEY
    },
    boba: {
      name: 'Boba Explorer',
      baseUrl: 'https://api.bobascan.com/api',
      apiKeyParam: 'apikey',
      apiKey: process.env.BOBASCAN_API_KEY
    }
  }

  private async makeRequest(network: string, params: Record<string, any>): Promise<any> {
    const explorer = this.explorers[network]
    if (!explorer) {
      throw new Error(`Unsupported network: ${network}`)
    }

    const requestParams = {
      ...params,
      [explorer.apiKeyParam]: explorer.apiKey || 'YourApiKeyToken' // Fallback for testing
    }

    try {
      const response = await axios.get(explorer.baseUrl, {
        params: requestParams,
        timeout: 10000
      })

      return response.data
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error(`Rate limit exceeded for ${explorer.name}. Please try again later.`)
      }
      if (error.response?.status === 403) {
        throw new Error(`API key invalid or missing for ${explorer.name}`)
      }
      throw new Error(`Failed to fetch from ${explorer.name}: ${error.message || 'Unknown error'}`)
    }
  }

  async getContractSource(network: string, address: string): Promise<{
    name: string
    sourceCode: string
    compilerVersion: string
    isVerified: boolean
    network: string
    explorer: string
  }> {
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error('Invalid contract address format')
    }

    // Get contract source code
    const response: ContractResponse = await this.makeRequest(network, {
      module: 'contract',
      action: 'getsourcecode',
      address: address
    })

    if (response.status !== '1') {
      if (response.message === 'NOTOK' && response.result?.[0]?.SourceCode === '') {
        throw new Error(`Contract ${address} is not verified on ${this.explorers[network].name}`)
      }
      throw new Error(`API Error: ${response.message}`)
    }

    const contract = response.result[0]
    
    if (!contract.SourceCode || contract.SourceCode === '') {
      throw new Error(`Contract ${address} is not verified on ${this.explorers[network].name}`)
    }

    return {
      name: contract.ContractName || 'Unknown Contract',
      sourceCode: contract.SourceCode,
      compilerVersion: contract.CompilerVersion || 'Unknown',
      isVerified: true,
      network,
      explorer: this.explorers[network].name
    }
  }

  async validateAddress(network: string, address: string): Promise<{
    isValid: boolean
    isContract: boolean
    isVerified: boolean
    name?: string
  }> {
    try {
      const contract = await this.getContractSource(network, address)
      return {
        isValid: true,
        isContract: true,
        isVerified: true,
        name: contract.name
      }
    } catch (error) {
      // Check if it's a valid address but not a verified contract
      if (error instanceof Error && error.message.includes('not verified')) {
        return {
          isValid: true,
          isContract: true,
          isVerified: false
        }
      }
      
      // Check if it's a valid address (could be EOA or unverified contract)
      if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return {
          isValid: true,
          isContract: false, // We can't determine this without additional API calls
          isVerified: false
        }
      }
      
      return {
        isValid: false,
        isContract: false,
        isVerified: false
      }
    }
  }

  getExplorerUrl(network: string, address: string): string {
    const explorer = this.explorers[network]
    if (!explorer) {
      throw new Error(`Unsupported network: ${network}`)
    }

    const baseUrl = explorer.baseUrl.replace('/api', '')
    return `${baseUrl}/address/${address}`
  }

  getSupportedNetworks(): string[] {
    return Object.keys(this.explorers)
  }

  getNetworkInfo(network: string): ExplorerConfig | null {
    return this.explorers[network] || null
  }
}

export const etherscanService = new EtherscanService()
export default etherscanService 