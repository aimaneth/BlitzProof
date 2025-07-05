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

interface ClientConnection {
  id: string
  ws: WebSocket
  userId?: number
  subscriptions: Set<string> // scan IDs this client is subscribed to
}

class WebSocketService extends EventEmitter {
  private wss: WebSocketServer
  private clients = new Map<string, ClientConnection>()
  private scanSubscriptions = new Map<string, Set<string>>() // scanId -> Set of clientIds

  constructor(server: Server) {
    super()
    this.wss = new WebSocketServer({ server })
    this.setupWebSocketServer()
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const clientId = this.generateClientId()
      const client: ClientConnection = {
        id: clientId,
        ws,
        subscriptions: new Set()
      }

      this.clients.set(clientId, client)
      console.log(`🔌 WebSocket client connected: ${clientId}`)

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        clientId,
        message: 'Connected to BlitzProof real-time updates'
      })

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleMessage(clientId, message)
        } catch (error) {
          console.error('WebSocket message error:', error)
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Invalid message format'
          })
        }
      })

      ws.on('close', () => {
        this.handleClientDisconnect(clientId)
      })

      ws.on('error', (error: any) => {
        console.error(`WebSocket error for client ${clientId}:`, error)
        this.handleClientDisconnect(clientId)
      })
    })

    console.log('🔌 WebSocket server initialized')
  }

  private handleMessage(clientId: string, message: any) {
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(clientId, message.scanId)
        break
      case 'unsubscribe':
        this.handleUnsubscribe(clientId, message.scanId)
        break
      case 'authenticate':
        this.handleAuthentication(clientId, message.token)
        break
      default:
        console.warn(`Unknown message type: ${message.type}`)
    }
  }

  private handleSubscribe(clientId: string, scanId: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    client.subscriptions.add(scanId)
    
    // Add to scan subscriptions
    if (!this.scanSubscriptions.has(scanId)) {
      this.scanSubscriptions.set(scanId, new Set())
    }
    this.scanSubscriptions.get(scanId)!.add(clientId)

    console.log(`📡 Client ${clientId} subscribed to scan ${scanId}`)
    
    this.sendToClient(clientId, {
      type: 'subscription',
      scanId,
      status: 'subscribed'
    })
  }

  private handleUnsubscribe(clientId: string, scanId: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    client.subscriptions.delete(scanId)
    
    const scanSubs = this.scanSubscriptions.get(scanId)
    if (scanSubs) {
      scanSubs.delete(clientId)
      if (scanSubs.size === 0) {
        this.scanSubscriptions.delete(scanId)
      }
    }

    console.log(`📡 Client ${clientId} unsubscribed from scan ${scanId}`)
    
    this.sendToClient(clientId, {
      type: 'subscription',
      scanId,
      status: 'unsubscribed'
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
          status: 'success'
        })
      }
    } catch (error) {
      console.error('Authentication error:', error)
      this.sendToClient(clientId, {
        type: 'authentication',
        status: 'failed',
        message: 'Invalid token'
      })
    }
  }

  private handleClientDisconnect(clientId: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    // Remove from all scan subscriptions
    for (const scanId of client.subscriptions) {
      const scanSubs = this.scanSubscriptions.get(scanId)
      if (scanSubs) {
        scanSubs.delete(clientId)
        if (scanSubs.size === 0) {
          this.scanSubscriptions.delete(scanId)
        }
      }
    }

    this.clients.delete(clientId)
    console.log(`🔌 WebSocket client disconnected: ${clientId}`)
  }

  // Public methods for broadcasting scan updates
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
      error: progress.error
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
      results
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
      error
    }

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message)
    }

    console.log(`📡 Broadcasted scan error for ${scanId} to ${subscribers.size} clients`)
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

  public getActiveScans(): string[] {
    return Array.from(this.scanSubscriptions.keys())
  }
}

export default WebSocketService 