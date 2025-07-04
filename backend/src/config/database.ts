import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Debug: Log database configuration
console.log('🔍 Database URL from environment:', process.env.DATABASE_URL ? 'Set' : 'Not set')
if (process.env.DATABASE_URL) {
  console.log('🔍 Database URL (masked):', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'))
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false
  }
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export default pool 