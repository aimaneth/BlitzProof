const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkWalletData() {
  console.log('🔍 Checking wallet data in database...\n');
  
  try {
    const client = await pool.connect();
    
    // Check token_wallets table for blox-myrc
    console.log('📋 Checking token_wallets table...');
    const walletQuery = `
      SELECT 
        tw.id,
        tw.token_id,
        tw.wallet_name,
        tw.wallet_url,
        tw.wallet_type,
        tw.is_active,
        t.unique_id,
        t.name as token_name
      FROM token_wallets tw
      JOIN tokens t ON tw.token_id = t.id
      WHERE t.unique_id = 'blox-myrc'
      ORDER BY tw.created_at ASC
    `;
    
    const walletResult = await client.query(walletQuery);
    console.log('✅ Wallet data in database:');
    console.log(JSON.stringify(walletResult.rows, null, 2));
    console.log(`Total wallet entries: ${walletResult.rows.length}`);
    
    // Check if the migration was run
    console.log('\n📋 Checking if migration was run...');
    const migrationQuery = `
      SELECT COUNT(*) as wallet_count 
      FROM token_wallets 
      WHERE is_active = true
    `;
    
    const migrationResult = await client.query(migrationQuery);
    console.log(`Total active wallets in database: ${migrationResult.rows[0].wallet_count}`);
    
    // Check the main token data
    console.log('\n📋 Checking main token data...');
    const tokenQuery = `
      SELECT 
        id,
        unique_id,
        name,
        symbol,
        created_at,
        updated_at
      FROM tokens
      WHERE unique_id = 'blox-myrc'
    `;
    
    const tokenResult = await client.query(tokenQuery);
    console.log('✅ Token data in database:');
    console.log(JSON.stringify(tokenResult.rows, null, 2));
    
    client.release();
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkWalletData();
