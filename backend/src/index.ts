import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'
import redisClient from './config/redis'
import WebSocketService from './services/websocketService'
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
import remediationRoutes from './routes/remediation'
import contactRoutes from './routes/contact'
import blockNetRoutes from './routes/blockNet'

dotenv.config()

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...')
  process.exit(0)
})

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
  'https://blitzproof.vercel.app',
  'https://www.blitzproof.xyz',
  'https://blitzproof.xyz',
  'https://blitzproof-backend.onrender.com',
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
    if (process.env.NODE_ENV === 'production' && (
      origin.includes('blitzproof.vercel.app') ||
      origin.includes('blitzproof.xyz') ||
      origin.includes('vercel.app') ||
      origin.includes('blitzproof-backend.onrender.com') ||
      origin.includes('onrender.com')
    )) {
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

// WebSocket service for real-time updates
let wsService: WebSocketService

// Middleware
app.use(cors(corsOptions))
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(securityHeaders)
app.use(metricsMiddleware)
app.use(morgan('dev'))

// Remove global JSON parser to prevent conflicts with multipart requests
// JSON parsing will be applied per-route where needed

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

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({
        status: 'warning',
        database: 'not_configured',
        message: 'DATABASE_URL not set'
      })
    }

    const pool = require('./config/database').default
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version')
    
    // Check if key tables exist
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'api_keys', 'scans')
    `)
    
    const existingTables = tablesCheck.rows.map((row: any) => row.table_name)
    
    res.json({
      status: 'ok',
      database: 'connected',
      current_time: result.rows[0].current_time,
      db_version: result.rows[0].db_version,
      tables: {
        users: existingTables.includes('users'),
        api_keys: existingTables.includes('api_keys'),
        scans: existingTables.includes('scans'),
        all_tables: existingTables
      }
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end()
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
app.use('/api/remediation', remediationRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/blocknet', blockNetRoutes)

// Initialize WebSocket service after server creation
wsService = new WebSocketService(server)

// Make WebSocket service available to other modules
app.set('wsService', wsService)

// Add a WebSocket endpoint for testing
app.get('/ws', (req, res) => {
  res.json({ 
    message: 'WebSocket endpoint available',
    status: 'WebSocket server is running'
  })
})

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting BlitzProof backend...')
    
    // Set a timeout for startup
    const startupTimeout = setTimeout(() => {
      console.error('❌ Startup timeout reached')
      process.exit(1)
    }, 30000) // 30 seconds timeout

    // Connect to Redis (optional)
    let redisConnected = false
    try {
      if (process.env.REDIS_URL) {
        await redisClient.connect()
        console.log('✅ Redis connected')
        redisConnected = true
      } else {
        console.log('ℹ️ REDIS_URL not set, skipping Redis connection')
      }
    } catch (redisError) {
      const errorMessage = redisError instanceof Error ? redisError.message : 'Unknown error'
      console.warn('⚠️ Redis connection failed, running without Redis:', errorMessage)
      console.log('ℹ️ Some features may be limited without Redis')
    }

    // Initialize database (optional)
    let dbConnected = false
    try {
      if (process.env.DATABASE_URL) {
        await initializeDatabase()
        console.log('✅ Database initialized')
        dbConnected = true
      } else {
        console.log('ℹ️ DATABASE_URL not set, running without database')
      }
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error'
      console.warn('⚠️ Database initialization failed, running without database:', errorMessage)
      console.log('ℹ️ Some features may be limited without database')
    }

    // Clear startup timeout
    clearTimeout(startupTimeout)

    const PORT = process.env.PORT || 4000
    server.listen(PORT, () => {
      console.log(`🚀 Backend API running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🌐 CORS enabled for origins:`, allowedOrigins)
      console.log(`🔴 Redis status: ${redisConnected ? 'Connected' : 'Not available'}`)
      console.log(`🗄️ Database status: ${dbConnected ? 'Connected' : 'Not available'}`)
    })

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error)
      process.exit(1)
    })

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app 