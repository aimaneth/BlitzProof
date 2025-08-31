require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function runMigration() {
  console.log('🚀 Starting whitepaper migration...')
  
  try {
    const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', '009_add_whitepaper_to_socials.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📝 Executing migration...')
    await pool.query(migrationSQL)
    
    console.log('✅ Whitepaper migration completed successfully!')
    console.log('📋 Changes made:')
    console.log('   - Added "whitepaper" to allowed social platforms')
    console.log('   - Updated CHECK constraint in token_socials table')
    console.log('   - Added documentation comment')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
