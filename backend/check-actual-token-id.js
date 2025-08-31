const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/blitzproof'
});

async function checkActualTokenId() {
  try {
    console.log('🔍 Checking actual token_id for blox-myrc...');
    
    // Check by coin_gecko_id
    const result = await pool.query('SELECT * FROM manual_tokens WHERE coin_gecko_id = $1', ['blox-myrc']);
    
    if (result.rows.length > 0) {
      const token = result.rows[0];
      console.log('✅ Found token by coin_gecko_id:');
      console.log(`  token_id: "${token.token_id}" (type: ${typeof token.token_id})`);
      console.log(`  coin_gecko_id: "${token.coin_gecko_id}"`);
      console.log(`  name: "${token.name}"`);
      console.log(`  description: "${token.description}"`);
      
      // Now check if we can find it by token_id = '3'
      const checkById = await pool.query('SELECT * FROM manual_tokens WHERE token_id = $1', ['3']);
      console.log(`\n🔍 Can find token with token_id = '3'? ${checkById.rows.length > 0 ? 'YES' : 'NO'}`);
      
      if (checkById.rows.length > 0) {
        console.log('✅ Token found with token_id = "3":', checkById.rows[0]);
      } else {
        console.log('❌ No token found with token_id = "3"');
        console.log('🔍 This explains why the update is failing!');
      }
      
    } else {
      console.log('❌ Token not found by coin_gecko_id');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkActualTokenId();
