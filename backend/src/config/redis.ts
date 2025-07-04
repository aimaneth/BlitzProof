import { createClient } from 'redis'
import dotenv from 'dotenv'

dotenv.config()

// Debug: Log the Redis URL being used
console.log('🔍 Redis URL from environment:', process.env.REDIS_URL ? 'Set' : 'Not set')
if (process.env.REDIS_URL) {
  console.log('🔍 Redis URL (masked):', process.env.REDIS_URL.replace(/\/\/.*@/, '//***:***@'))
}

const client = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.log('❌ Redis max retries reached, giving up')
        return false
      }
      const delay = Math.min(retries * 50, 500)
      console.log(`🔄 Redis reconnecting in ${delay}ms (attempt ${retries})`)
      return delay
    },
    connectTimeout: 10000
  }
})

client.on('error', (err) => {
  console.error('Redis Client Error', err)
})

client.on('connect', () => {
  console.log('✅ Redis Client Connected')
})

client.on('ready', () => {
  console.log('✅ Redis Client Ready')
})

client.on('reconnecting', () => {
  console.log('🔄 Redis Client Reconnecting...')
})

client.on('end', () => {
  console.log('🔌 Redis Client Connection Ended')
})

export default client 