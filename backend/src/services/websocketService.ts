import { WebSocket, WebSocketServer } from 'ws'
import { Server } from 'http'
import { EventEmitter } from 'events'

interface ScanProgress {
  scanId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  currentStep: string
  estimatedTime?: number
  vulnerabilitiesFound: number
  toolsCompleted: string[]
  currentTool?: string
  error?: string
}

interface TokenDataUpdate {
  tokenId: string
  price: number
  priceChange24h: number
  marketCap: number
  volume24h: number
  securityScore: number
  lastUpdate: string
  isRefreshing: boolean
}

interface ClientConnection {
  id: string
  ws: WebSocket
  userId?: number
  subscriptions: Set<string> // scan IDs or token IDs this client is subscribed to
  lastPing: number
  isAlive: boolean
  reconnectAttempts: number
  maxReconnectAttempts: number
}

class WebSocketService extends EventEmitter {
  private wss: WebSocketServer
  private clients = new Map<string, ClientConnection>()
  private scanSubscriptions = new Map<string, Set<string>>() // scanId -> Set of clientIds
  private tokenSubscriptions = new Map<string, Set<string>>() // tokenId -> Set of clientIds
  private pingInterval!: NodeJS.Timeout
  private healthCheckInterval!: NodeJS.Timeout
  private isShuttingDown = false

  constructor(server: Server) {
    super()
    console.log('🔌 Initializing WebSocket server...')
    this.wss = new WebSocketServer({ 
      server,
      clientTracking: true,
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024
      }
    })
    console.log('🔌 WebSocket server created successfully')
    this.setupWebSocketServer()
    this.startHealthChecks()
  }

  private setupWebSocketServer() {
    console.log('🔌 Setting up WebSocket server event handlers...')
    
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const clientId = this.generateClientId()
      const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      console.log(`🔌 WebSocket connection attempt from: ${clientIp} (${req.headers.origin || 'unknown'})`)
      
      const client: ClientConnection = {
        id: clientId,
        ws,
        subscriptions: new Set(),
        lastPing: Date.now(),
        isAlive: true,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5
      }

      this.clients.set(clientId, client)
      console.log(`🔌 WebSocket client connected: ${clientId} (Total: ${this.clients.size})`)

      // Send welcome message with connection info
      this.sendToClient(clientId, {
        type: 'connection',
        clientId,
        timestamp: Date.now(),
        message: 'Connected to BlitzProof real-time updates',
        features: ['token_updates', 'scan_progress', 'health_monitoring'],
        heartbeat: 30000 // 30 seconds
      })

      // Set up ping/pong for connection health
      ws.on('pong', () => {
        const client = this.clients.get(clientId)
        if (client) {
          client.isAlive = true
          client.lastPing = Date.now()
        }
      })

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleMessage(clientId, message)
        } catch (error) {
          console.error('WebSocket message error:', error)
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Invalid message format',
            timestamp: Date.now()
          })
        }
      })

      ws.on('close', (code: number, reason: Buffer) => {
        console.log(`🔌 WebSocket client disconnected: ${clientId} (Code: ${code}, Reason: ${reason.toString()})`)
        this.handleClientDisconnect(clientId)
      })

      ws.on('error', (error: any) => {
        console.error(`WebSocket error for client ${clientId}:`, error)
        this.handleClientDisconnect(clientId)
      })
    })

    this.wss.on('error', (error: any) => {
      console.error('WebSocket server error:', error)
    })

    console.log('🔌 WebSocket server initialized')
  }

  private startHealthChecks() {
    // Ping all clients every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.isShuttingDown) return
      
      const now = Date.now()
      for (const [clientId, client] of this.clients) {
        if (now - client.lastPing > 60000) { // 60 seconds timeout
          console.log(`🔌 Client ${clientId} timed out, disconnecting`)
          client.ws.terminate()
          this.handleClientDisconnect(clientId)
        } else if (client.ws.readyState === WebSocket.OPEN) {
          try {
            client.ws.ping()
          } catch (error) {
            console.error(`Failed to ping client ${clientId}:`, error)
            this.handleClientDisconnect(clientId)
          }
        }
      }
    }, 30000)

    // Health check every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      if (this.isShuttingDown) return
      
      const stats = this.getStats()
      console.log(`🔌 WebSocket Health Check: ${stats.connectedClients} clients, ${stats.activeScans} active scans, ${stats.activeTokens} active tokens`)
      
      // Broadcast health status to all clients
      this.broadcastToAll({
        type: 'health_check',
        timestamp: Date.now(),
        stats
      })
    }, 300000) // 5 minutes
  }

  private handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId)
    if (!client) return

    // Update last activity
    client.lastPing = Date.now()

    switch (message.type) {
      case 'subscribe':
        if (message.scanId) {
          this.handleSubscribe(clientId, message.scanId, 'scan')
        } else if (message.tokenId) {
          this.handleSubscribe(clientId, message.tokenId, 'token')
        }
        break
      case 'unsubscribe':
        if (message.scanId) {
          this.handleUnsubscribe(clientId, message.scanId, 'scan')
        } else if (message.tokenId) {
          this.handleUnsubscribe(clientId, message.tokenId, 'token')
        }
        break
      case 'authenticate':
        this.handleAuthentication(clientId, message.token)
        break
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          timestamp: Date.now()
        })
        break
      case 'get_stats':
        this.sendToClient(clientId, {
          type: 'stats',
          timestamp: Date.now(),
          stats: this.getStats()
        })
        break
      default:
        console.warn(`Unknown message type: ${message.type}`)
        this.sendToClient(clientId, {
          type: 'error',
          message: `Unknown message type: ${message.type}`,
          timestamp: Date.now()
        })
    }
  }

  private handleSubscribe(clientId: string, id: string, type: 'scan' | 'token') {
    const client = this.clients.get(clientId)
    if (!client) return

    client.subscriptions.add(id)
    
    if (type === 'scan') {
      // Add to scan subscriptions
      if (!this.scanSubscriptions.has(id)) {
        this.scanSubscriptions.set(id, new Set())
      }
      this.scanSubscriptions.get(id)!.add(clientId)
      console.log(`📡 Client ${clientId} subscribed to scan ${id}`)
    } else {
      // Add to token subscriptions
      if (!this.tokenSubscriptions.has(id)) {
        this.tokenSubscriptions.set(id, new Set())
      }
      this.tokenSubscriptions.get(id)!.add(clientId)
      console.log(`📡 Client ${clientId} subscribed to token ${id}`)
    }
    
    this.sendToClient(clientId, {
      type: 'subscription',
      id,
      subscriptionType: type,
      status: 'subscribed',
      timestamp: Date.now()
    })
  }

  private handleUnsubscribe(clientId: string, id: string, type: 'scan' | 'token') {
    const client = this.clients.get(clientId)
    if (!client) return

    client.subscriptions.delete(id)
    
    if (type === 'scan') {
      const scanSubs = this.scanSubscriptions.get(id)
      if (scanSubs) {
        scanSubs.delete(clientId)
        if (scanSubs.size === 0) {
          this.scanSubscriptions.delete(id)
        }
      }
      console.log(`📡 Client ${clientId} unsubscribed from scan ${id}`)
    } else {
      const tokenSubs = this.tokenSubscriptions.get(id)
      if (tokenSubs) {
        tokenSubs.delete(clientId)
        if (tokenSubs.size === 0) {
          this.tokenSubscriptions.delete(id)
        }
      }
      console.log(`📡 Client ${clientId} unsubscribed from token ${id}`)
    }
    
    this.sendToClient(clientId, {
      type: 'subscription',
      id,
      subscriptionType: type,
      status: 'unsubscribed',
      timestamp: Date.now()
    })
  }

  private async handleAuthentication(clientId: string, token: string) {
    try {
      // TODO: Implement proper JWT verification
      // For now, we'll accept any token and extract user info
      const client = this.clients.get(clientId)
      if (client) {
        client.userId = 1 // Mock user ID for now
        console.log(`🔐 Client ${clientId} authenticated`)
        
        this.sendToClient(clientId, {
          type: 'authentication',
          status: 'success',
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.error('Authentication error:', error)
      this.sendToClient(clientId, {
        type: 'authentication',
        status: 'failed',
        message: 'Invalid token',
        timestamp: Date.now()
      })
    }
  }

  private handleClientDisconnect(clientId: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    // Remove from all subscriptions
    for (const id of client.subscriptions) {
      // Check scan subscriptions
      const scanSubs = this.scanSubscriptions.get(id)
      if (scanSubs) {
        scanSubs.delete(clientId)
        if (scanSubs.size === 0) {
          this.scanSubscriptions.delete(id)
        }
      }
      
      // Check token subscriptions
      const tokenSubs = this.tokenSubscriptions.get(id)
      if (tokenSubs) {
        tokenSubs.delete(clientId)
        if (tokenSubs.size === 0) {
          this.tokenSubscriptions.delete(id)
        }
      }
    }

    this.clients.delete(clientId)
    console.log(`🔌 WebSocket client disconnected: ${clientId} (Remaining: ${this.clients.size})`)
  }

  // Public methods for broadcasting updates
  public broadcastScanProgress(scanId: string, progress: ScanProgress) {
    const subscribers = this.scanSubscriptions.get(scanId)
    if (!subscribers) return

    const message = {
      type: 'scan_progress',
      scanId,
      status: progress.status,
      progress: progress.progress,
      currentStep: progress.currentStep,
      estimatedTime: progress.estimatedTime,
      vulnerabilitiesFound: progress.vulnerabilitiesFound,
      toolsCompleted: progress.toolsCompleted,
      currentTool: progress.currentTool,
      error: progress.error,
      timestamp: Date.now()
    }

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message)
    }

    console.log(`📡 Broadcasted scan progress for ${scanId} to ${subscribers.size} clients`)
  }

  public broadcastScanComplete(scanId: string, results: any) {
    const subscribers = this.scanSubscriptions.get(scanId)
    if (!subscribers) return

    const message = {
      type: 'scan_complete',
      scanId,
      results,
      timestamp: Date.now()
    }

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message)
    }

    console.log(`📡 Broadcasted scan completion for ${scanId} to ${subscribers.size} clients`)
  }

  public broadcastScanError(scanId: string, error: string) {
    const subscribers = this.scanSubscriptions.get(scanId)
    if (!subscribers) return

    const message = {
      type: 'scan_error',
      scanId,
      error,
      timestamp: Date.now()
    }

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message)
    }

    console.log(`📡 Broadcasted scan error for ${scanId} to ${subscribers.size} clients`)
  }

  // New methods for token data updates
  public broadcastTokenUpdate(tokenId: string, data: TokenDataUpdate) {
    const subscribers = this.tokenSubscriptions.get(tokenId)
    if (!subscribers) return

    const message = {
      type: 'token_update',
      tokenId,
      data,
      timestamp: Date.now()
    }

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message)
    }

    console.log(`📡 Broadcasted token update for ${tokenId} to ${subscribers.size} clients`)
  }

  public broadcastTokenRefreshStart(tokenId: string) {
    const subscribers = this.tokenSubscriptions.get(tokenId)
    if (!subscribers) return

    const message = {
      type: 'token_refresh_start',
      tokenId,
      timestamp: Date.now()
    }

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message)
    }

    console.log(`📡 Broadcasted token refresh start for ${tokenId} to ${subscribers.size} clients`)
  }

  public broadcastTokenRefreshComplete(tokenId: string, success: boolean, error?: string) {
    const subscribers = this.tokenSubscriptions.get(tokenId)
    if (!subscribers) return

    const message = {
      type: 'token_refresh_complete',
      tokenId,
      success,
      error,
      timestamp: Date.now()
    }

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message)
    }

    console.log(`📡 Broadcasted token refresh complete for ${tokenId} to ${subscribers.size} clients`)
  }

  public broadcastToAll(message: any) {
    for (const [clientId, client] of this.clients) {
      this.sendToClient(clientId, message)
    }
  }

  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId)
    if (!client || client.ws.readyState !== WebSocket.OPEN) return

    try {
      client.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error)
      this.handleClientDisconnect(clientId)
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Utility methods
  public getConnectedClients(): number {
    return this.clients.size
  }

  public getScanSubscribers(scanId: string): number {
    return this.scanSubscriptions.get(scanId)?.size || 0
  }

  public getTokenSubscribers(tokenId: string): number {
    return this.tokenSubscriptions.get(tokenId)?.size || 0
  }

  public getActiveScans(): string[] {
    return Array.from(this.scanSubscriptions.keys())
  }

  public getActiveTokens(): string[] {
    return Array.from(this.tokenSubscriptions.keys())
  }

  public getStats() {
    return {
      connectedClients: this.clients.size,
      activeScans: this.scanSubscriptions.size,
      activeTokens: this.tokenSubscriptions.size,
      totalScanSubscriptions: Array.from(this.scanSubscriptions.values()).reduce((sum, set) => sum + set.size, 0),
      totalTokenSubscriptions: Array.from(this.tokenSubscriptions.values()).reduce((sum, set) => sum + set.size, 0),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    }
  }

  public shutdown() {
    console.log('🔌 Shutting down WebSocket server...')
    this.isShuttingDown = true
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    // Close all client connections
    for (const [clientId, client] of this.clients) {
      try {
        client.ws.close(1000, 'Server shutdown')
      } catch (error) {
        console.error(`Error closing client ${clientId}:`, error)
      }
    }

    this.wss.close(() => {
      console.log('🔌 WebSocket server shutdown complete')
    })
  }
}

export default WebSocketService 