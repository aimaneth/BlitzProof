import { createClient } from 'redis'
import dotenv from 'dotenv'

dotenv.config()

// Debug: Log the Redis URL being used
console.log('🔍 Redis URL from environment:', process.env.REDIS_URL ? 'Set' : 'Not set')
if (process.env.REDIS_URL) {
  console.log('🔍 Redis URL (masked):', process.env.REDIS_URL.replace(/\/\/.*@/, '//***:***@'))
}

const client = createClient({
  url: process.env.REDIS_URL
})

client.on('error', (err) => {
  console.error('Redis Client Error', err)
})

client.on('connect', () => {
  console.log('Redis Client Connected')
})

export default client 