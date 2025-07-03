import axios from 'axios'

interface ExplorerConfig {
  name: string
  baseUrl: string
  apiKey: string
}

const explorerConfigs: Record<string, ExplorerConfig> = {
  ethereum: {
    name: 'Etherscan',
    baseUrl: 'https://api.etherscan.io/api',
    apiKey: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken',
  },
  polygon: {
    name: 'Polygonscan',
    baseUrl: 'https://api.polygonscan.com/api',
    apiKey: process.env.POLYGONSCAN_API_KEY || 'YourApiKeyToken',
  },
  bsc: {
    name: 'BscScan',
    baseUrl: 'https://api.bscscan.com/api',
    apiKey: process.env.BSCSCAN_API_KEY || 'YourApiKeyToken',
  },
  arbitrum: {
    name: 'Arbiscan',
    baseUrl: 'https://api.arbiscan.io/api',
    apiKey: process.env.ARBISCAN_API_KEY || 'YourApiKeyToken',
  },
  optimism: {
    name: 'Optimistic Etherscan',
    baseUrl: 'https://api-optimistic.etherscan.io/api',
    apiKey: process.env.OPTIMISM_API_KEY || 'YourApiKeyToken',
  },
}

interface ExplorerResponse {
  status: string
  message: string
  result: any
}

export interface ContractSource {
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

class ExplorerService {
  async getContractSource(address: string, network: string): Promise<ContractSource | null> {
    const config = explorerConfigs[network]
    if (!config) {
      throw new Error(`Unsupported network: ${network}`)
    }
    try {
      const response = await axios.get<ExplorerResponse>(config.baseUrl, {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address,
          apikey: config.apiKey,
        },
        timeout: 10000,
      })
      if (response.data.status === '1' && response.data.result && response.data.result.length > 0) {
        const contract = response.data.result[0]
        if (contract.SourceCode && contract.SourceCode !== '') {
          return contract
        }
      }
      return null
    } catch (error) {
      console.error(`[ExplorerService] Error fetching contract source:`, error)
      return null
    }
  }

  formatSourceCode(sourceCode: string): string {
    let cleaned = sourceCode
    if (sourceCode.startsWith('{') && sourceCode.includes('"sources"')) {
      try {
        const parsed = JSON.parse(sourceCode)
        if (parsed.sources) {
          const sources = Object.values(parsed.sources) as any[]
          if (sources.length > 0) {
            cleaned = sources[0].content || sourceCode
          }
        }
      } catch (e) {
        // fallback
      }
    }
    return cleaned
  }
}

export default new ExplorerService() 