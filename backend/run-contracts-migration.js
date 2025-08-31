const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres1@localhost:5432/blitzproof'
});

async function runMigration() {
  try {
    console.log('🚀 Starting token contracts migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src/database/migrations/004_add_token_contracts_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration...');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Token contracts migration completed successfully!');
    
    // Verify the table was created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'token_contracts'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ token_contracts table created successfully');
      
      // Check how many contracts were migrated
      const contractCount = await pool.query('SELECT COUNT(*) FROM token_contracts');
      console.log(`📊 Migrated ${contractCount.rows[0].count} contract addresses`);
    } else {
      console.log('❌ token_contracts table was not created');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
