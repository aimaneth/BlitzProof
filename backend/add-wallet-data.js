const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addWalletData() {
  console.log('🔍 Adding default wallet data for blox-myrc...\n');
  
  try {
    const client = await pool.connect();
    
    // Get the token ID for blox-myrc
    const tokenQuery = 'SELECT id FROM tokens WHERE unique_id = $1';
    const tokenResult = await client.query(tokenQuery, ['blox-myrc']);
    
    if (tokenResult.rows.length === 0) {
      console.log('❌ Token blox-myrc not found');
      return;
    }
    
    const tokenId = tokenResult.rows[0].id;
    console.log(`✅ Found token ID: ${tokenId}`);
    
    // Insert default wallet data
    const wallets = [
      {
        wallet_name: 'MetaMask',
        wallet_url: 'https://metamask.io',
        wallet_type: 'browser'
      },
      {
        wallet_name: 'Trust Wallet',
        wallet_url: 'https://trustwallet.com',
        wallet_type: 'mobile'
      },
      {
        wallet_name: 'WalletConnect',
        wallet_url: 'https://walletconnect.com',
        wallet_type: 'mobile'
      }
    ];
    
    for (const wallet of wallets) {
      const insertQuery = `
        INSERT INTO token_wallets (token_id, wallet_name, wallet_url, wallet_type, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (token_id, wallet_name) DO NOTHING
      `;
      
      await client.query(insertQuery, [
        tokenId,
        wallet.wallet_name,
        wallet.wallet_url,
        wallet.wallet_type
      ]);
      
      console.log(`✅ Added wallet: ${wallet.wallet_name}`);
    }
    
    // Verify the data was added
    const verifyQuery = `
      SELECT wallet_name, wallet_url, wallet_type, is_active
      FROM token_wallets
      WHERE token_id = $1
      ORDER BY created_at ASC
    `;
    
    const verifyResult = await client.query(verifyQuery, [tokenId]);
    console.log('\n✅ Wallet data added:');
    console.log(JSON.stringify(verifyResult.rows, null, 2));
    
    client.release();
  } catch (error) {
    console.error('❌ Failed to add wallet data:', error.message);
  } finally {
    await pool.end();
  }
}

addWalletData();
