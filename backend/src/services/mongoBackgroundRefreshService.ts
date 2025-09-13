import { mongoPriceDataService } from './mongoPriceDataService'
import { mongoTokenService } from './mongoTokenService'
import WebSocketService from './websocketService'

export class MongoBackgroundRefreshService {
  private static isRunning = false
  private static intervalId: NodeJS.Timeout | null = null
  private static wsService: WebSocketService | null = null

  // Start the background refresh service
  static start(wsService?: WebSocketService): void {
    if (this.isRunning) {
      console.log('⚠️ MongoDB background refresh service is already running')
      return
    }

    console.log('🚀 Starting MongoDB background refresh service...')
    this.isRunning = true
    this.wsService = wsService || null

    // Start the refresh loop
    this.startRefreshLoop()
  }

  // Stop the background refresh service
  static stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ MongoDB background refresh service is not running')
      return
    }

    console.log('🛑 Stopping MongoDB background refresh service...')
    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.wsService = null
  }

  // Start the refresh loop
  private static startRefreshLoop(): void {
    // Initial refresh
    this.performRefresh()

    // Set up interval for regular refreshes (every 5 minutes)
    this.intervalId = setInterval(() => {
      this.performRefresh()
    }, 5 * 60 * 1000) // 5 minutes

    console.log('✅ MongoDB background refresh loop started (5-minute intervals)')
  }

  // Perform the actual refresh
  private static async performRefresh(): Promise<void> {
    try {
      console.log('🔄 Starting MongoDB background refresh...')
      
      // Get all tokens from MongoDB
      const tokens = await mongoTokenService.getTokensWithPrice()
      
      if (!tokens || tokens.length === 0) {
        console.log('⚠️ No tokens found in MongoDB, initializing default tokens...')
        await mongoTokenService.initializeDefaultTokens()
        return
      }

      console.log(`📊 Found ${tokens.length} tokens to refresh`)

      // Refresh prices for each token
      const refreshPromises = tokens.map(async (token) => {
        try {
          const tokenId = token.coin_gecko_id || token.unique_id
          if (!tokenId) return

          console.log(`🔄 Refreshing price for ${tokenId}...`)
          await mongoPriceDataService.refreshTokenPrice(tokenId)
          console.log(`✅ Refreshed price for ${tokenId}`)
        } catch (error) {
          console.error(`❌ Failed to refresh price for ${token.name}:`, error)
        }
      })

      // Wait for all refreshes to complete
      await Promise.allSettled(refreshPromises)

      console.log('✅ MongoDB background refresh completed')

      // Send WebSocket update if available
      if (this.wsService) {
        this.wsService.broadcastToAll({
          type: 'price_refresh_complete',
          timestamp: new Date().toISOString(),
          message: 'All token prices have been refreshed',
          tokenCount: tokens.length
        })
      }

    } catch (error) {
      console.error('❌ MongoDB background refresh failed:', error)
      
      // Send error notification via WebSocket if available
      if (this.wsService) {
        this.wsService.broadcastToAll({
          type: 'price_refresh_error',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  // Manual refresh trigger
  static async triggerRefresh(): Promise<void> {
    console.log('🔄 Manual refresh triggered...')
    await this.performRefresh()
  }

  // Get service status
  static getStatus(): { isRunning: boolean; lastRefresh?: Date } {
    return {
      isRunning: this.isRunning
    }
  }

  // Initialize the service (called from main server)
  static async initialize(wsService?: WebSocketService): Promise<void> {
    try {
      console.log('🔄 Initializing MongoDB background refresh service...')
      
      // Initialize default tokens if needed
      await mongoTokenService.initializeDefaultTokens()
      
      // Start the service
      this.start(wsService)
      
      console.log('✅ MongoDB background refresh service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize MongoDB background refresh service:', error)
      throw error
    }
  }
}
