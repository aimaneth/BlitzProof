import { Request, Response, NextFunction } from 'express'
import { performance } from 'perf_hooks'

// Simple in-memory metrics (in production, use a proper metrics library like prom-client)
interface Metrics {
  requestCount: { [key: string]: number }
  responseTime: { [key: string]: number[] }
  errorCount: { [key: string]: number }
  activeConnections: number
  totalRequests: number
  startTime: number
}

const metrics: Metrics = {
  requestCount: {},
  responseTime: {},
  errorCount: {},
  activeConnections: 0,
  totalRequests: 0,
  startTime: Date.now()
}

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = performance.now()
  const route = req.route?.path || req.path
  const method = req.method

  // Increment active connections
  metrics.activeConnections++
  metrics.totalRequests++

  // Track request count by route
  const routeKey = `${method} ${route}`
  metrics.requestCount[routeKey] = (metrics.requestCount[routeKey] || 0) + 1

  // Track response time
  res.on('finish', () => {
    const duration = performance.now() - start
    if (!metrics.responseTime[routeKey]) {
      metrics.responseTime[routeKey] = []
    }
    metrics.responseTime[routeKey].push(duration)

    // Keep only last 100 measurements
    if (metrics.responseTime[routeKey].length > 100) {
      metrics.responseTime[routeKey] = metrics.responseTime[routeKey].slice(-100)
    }

    // Track errors
    if (res.statusCode >= 400) {
      metrics.errorCount[routeKey] = (metrics.errorCount[routeKey] || 0) + 1
    }

    // Decrement active connections
    metrics.activeConnections--
  })

  next()
}

export const getMetrics = () => {
  const uptime = Date.now() - metrics.startTime
  const avgResponseTimes: { [key: string]: number } = {}

  // Calculate average response times
  Object.keys(metrics.responseTime).forEach(route => {
    const times = metrics.responseTime[route]
    if (times.length > 0) {
      avgResponseTimes[route] = times.reduce((a, b) => a + b, 0) / times.length
    }
  })

  return {
    uptime,
    totalRequests: metrics.totalRequests,
    activeConnections: metrics.activeConnections,
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    averageResponseTimes: avgResponseTimes,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  }
}

export const metricsEndpoint = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json')
  res.json(getMetrics())
} 