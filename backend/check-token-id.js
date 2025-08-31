const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/blitzproof'
});

async function checkTokenId() {
  try {
    console.log('🔍 Checking token ID for blox-myrc...');
    
    const result = await pool.query('SELECT token_id, coin_gecko_id, name, description FROM manual_tokens WHERE coin_gecko_id = $1', ['blox-myrc']);
    
    if (result.rows.length > 0) {
      console.log('✅ Found token:', result.rows[0]);
      console.log(`Token ID: "${result.rows[0].token_id}"`);
      console.log(`CoinGecko ID: "${result.rows[0].coin_gecko_id}"`);
      console.log(`Name: "${result.rows[0].name}"`);
      console.log(`Description: "${result.rows[0].description}"`);
    } else {
      console.log('❌ Token not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTokenId();
