const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function runMigration() {
  try {
    console.log('🚀 Starting explorer, wallet, and source code migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src', 'database', 'migrations', '008_add_explorer_wallet_source_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute the migration
    await pool.query(migrationSQL)
    
    console.log('✅ Migration completed successfully!')
    console.log('📊 New tables created:')
    console.log('   - token_explorers (blockchain explorer links)')
    console.log('   - token_wallets (wallet support links)')
    console.log('   - token_source_code (source code and documentation links)')
    
    // Check the results
    const explorerCount = await pool.query('SELECT COUNT(*) FROM token_explorers')
    const walletCount = await pool.query('SELECT COUNT(*) FROM token_wallets')
    const sourceCodeCount = await pool.query('SELECT COUNT(*) FROM token_source_code')
    
    console.log('📈 Migration results:')
    console.log(`   - ${explorerCount.rows[0].count} explorer links added`)
    console.log(`   - ${walletCount.rows[0].count} wallet links added`)
    console.log(`   - ${sourceCodeCount.rows[0].count} source code links added`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
