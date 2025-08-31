const axios = require('axios');

async function activateBloxToken() {
  try {
    console.log('🔍 Activating blox token...');
    
    // First, get the token
    const listResponse = await axios.get('http://localhost:4000/api/blocknet/manual-tokens');
    const bloxToken = listResponse.data.tokens?.find(t => t.coinGeckoId === 'blox-myrc');
    
    if (!bloxToken) {
      console.log('❌ blox-myrc token not found');
      return;
    }
    
    console.log('✅ Found blox token:', {
      id: bloxToken.id,
      name: bloxToken.name,
      isActive: bloxToken.isActive
    });
    
    if (bloxToken.isActive) {
      console.log('✅ Token is already active!');
      return;
    }
    
    // Toggle the token to active
    console.log('🔄 Activating token...');
    const toggleResponse = await axios.patch(`http://localhost:4000/api/blocknet/manual-tokens/${bloxToken.id}/toggle`);
    
    console.log('✅ Toggle response:', toggleResponse.data);
    
    // Verify it's now active
    const verifyResponse = await axios.get('http://localhost:4000/api/blocknet/manual-tokens');
    const updatedToken = verifyResponse.data.tokens?.find(t => t.id === bloxToken.id);
    
    if (updatedToken && updatedToken.isActive) {
      console.log('🎉 Token is now active!');
      console.log('✅ Updated token:', {
        id: updatedToken.id,
        name: updatedToken.name,
        isActive: updatedToken.isActive
      });
    } else {
      console.log('❌ Token activation failed');
    }
    
  } catch (error) {
    console.error('❌ Failed to activate token:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

activateBloxToken();
