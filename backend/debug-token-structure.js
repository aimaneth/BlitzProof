const axios = require('axios');

async function debugTokenStructure() {
  try {
    console.log('🔍 Debugging token structure...');
    
    // Get all manual tokens
    const response = await axios.get('http://localhost:4000/api/blocknet/manual-tokens');
    console.log('✅ API Response Status:', response.status);
    console.log('📋 Total tokens:', response.data.tokens?.length || 0);
    
    // Log each token's structure
    response.data.tokens?.forEach((token, index) => {
      console.log(`\n📋 Token ${index + 1}:`);
      console.log('  ID:', token.id);
      console.log('  CoinGecko ID:', token.coinGeckoId);
      console.log('  Name:', token.name);
      console.log('  Symbol:', token.symbol);
      console.log('  Description:', token.description);
      console.log('  Address:', token.address);
      console.log('  Network:', token.network);
      console.log('  Category:', token.category);
      console.log('  Priority:', token.priority);
      console.log('  Risk Level:', token.riskLevel);
      console.log('  Monitoring Strategy:', token.monitoringStrategy);
      console.log('  Is Active:', token.isActive);
      console.log('  Added At:', token.addedAt);
    });
    
    // Find blox-myrc specifically
    const bloxToken = response.data.tokens?.find(t => t.coinGeckoId === 'blox-myrc' || t.id === 'blox-myrc');
    if (bloxToken) {
      console.log('\n🎯 Found blox-myrc token:');
      console.log('  ID:', bloxToken.id);
      console.log('  CoinGecko ID:', bloxToken.coinGeckoId);
      console.log('  Name:', bloxToken.name);
      console.log('  Symbol:', bloxToken.symbol);
      console.log('  Description:', bloxToken.description);
    } else {
      console.log('\n❌ blox-myrc token NOT found');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

debugTokenStructure();
