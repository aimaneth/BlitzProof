import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import redisClient from './config/redis'
import { initializeDatabase } from './config/init-db'
import { securityHeaders } from './middleware/auth'
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics'

// Routes
import authRoutes from './routes/auth'
import scanRoutes from './routes/scan'
import exportRoutes from './routes/export'
import profileRoutes from './routes/profile'
import customRulesRoutes from './routes/customRules'
import batchScanRoutes from './routes/batchScan'

dotenv.config()

const app = express()
const server = createServer(app)

// CORS Configuration - Allow all localhost ports for development
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  process.env.FRONTEND_URL
].filter(Boolean)

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    
    // For development, allow any localhost origin
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true)
    }
    
    // Allow specific production domains if needed
    if (process.env.NODE_ENV === 'production' && origin.includes('yourdomain.com')) {
      return callback(null, true)
    }
    
    console.log('CORS blocked origin:', origin)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}

// Socket.io with CORS and proper WebSocket configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.filter(Boolean) as string[],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
})

// Middleware
app.use(cors(corsOptions))
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(securityHeaders)
app.use(metricsMiddleware)
app.use(morgan('dev'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Preflight handling
app.options('*', cors(corsOptions))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cors: {
      allowedOrigins,
      currentOrigin: req.headers.origin
    }
  })
})

// Metrics endpoint
app.get('/metrics', metricsEndpoint)

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/scan', scanRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/custom-rules', customRulesRoutes)
app.use('/api/batch-scan', batchScanRoutes)

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join-scan', (scanId: string) => {
    socket.join(`scan-${scanId}`)
    console.log(`Client ${socket.id} joined scan ${scanId}`)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Make io available to other modules
app.set('io', io)

// Initialize database and start server
async function startServer() {
  try {
    // Connect to Redis (optional)
    let redisConnected = false
    try {
      await redisClient.connect()
      console.log('✅ Redis connected')
      redisConnected = true
    } catch (redisError) {
      const errorMessage = redisError instanceof Error ? redisError.message : 'Unknown error'
      console.warn('⚠️ Redis connection failed, running without Redis:', errorMessage)
      console.log('ℹ️ Some features may be limited without Redis')
    }

    // Initialize database
    await initializeDatabase()
    console.log('✅ Database initialized')

    const PORT = process.env.PORT || 4000
    server.listen(PORT, () => {
      console.log(`🚀 Backend API running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🌐 CORS enabled for origins:`, allowedOrigins)
      console.log(`🔴 Redis status: ${redisConnected ? 'Connected' : 'Not available'}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app 