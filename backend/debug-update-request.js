const axios = require('axios');

async function debugUpdateRequest() {
  try {
    console.log('🔍 Debugging update request...');
    
    // Step 1: Get current token
    const listResponse = await axios.get('http://localhost:4000/api/blocknet/manual-tokens');
    const bloxToken = listResponse.data.tokens?.find(t => t.coinGeckoId === 'blox-myrc');
    
    if (!bloxToken) {
      console.log('❌ blox-myrc token not found');
      return;
    }
    
    console.log('✅ Current token:', {
      id: bloxToken.id,
      name: bloxToken.name,
      symbol: bloxToken.symbol,
      description: bloxToken.description
    });
    
    // Step 2: Simulate what the frontend is sending
    const updateData = {
      coinGeckoId: 'blox-myrc',
      customName: 'Blox Token (DEBUG TEST)',
      customSymbol: 'MYRC',
      address: '',
      network: '',
      category: '',
      priority: 50,
      riskLevel: '',
      monitoringStrategy: '',
      description: 'Debug test description'
    };
    
    console.log('📝 Sending update data:', updateData);
    console.log('🔍 Checking undefined values:');
    console.log('customName !== undefined:', updateData.customName !== undefined);
    console.log('customSymbol !== undefined:', updateData.customSymbol !== undefined);
    console.log('address !== undefined:', updateData.address !== undefined);
    console.log('network !== undefined:', updateData.network !== undefined);
    console.log('category !== undefined:', updateData.category !== undefined);
    console.log('priority !== undefined:', updateData.priority !== undefined);
    console.log('riskLevel !== undefined:', updateData.riskLevel !== undefined);
    console.log('monitoringStrategy !== undefined:', updateData.monitoringStrategy !== undefined);
    console.log('description !== undefined:', updateData.description !== undefined);
    
    // Step 3: Send the update
    const updateResponse = await axios.put(`http://localhost:4000/api/blocknet/manual-tokens/${bloxToken.id}`, updateData);
    
    console.log('✅ Update response:', updateResponse.data);
    
    // Step 4: Check if it actually updated
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const verifyResponse = await axios.get('http://localhost:4000/api/blocknet/manual-tokens');
    const updatedToken = verifyResponse.data.tokens?.find(t => t.id === bloxToken.id);
    
    if (updatedToken) {
      console.log('✅ After update:', {
        name: updatedToken.name,
        symbol: updatedToken.symbol,
        description: updatedToken.description
      });
      
      const nameChanged = updatedToken.name === 'Blox Token (DEBUG TEST)';
      const descriptionChanged = updatedToken.description === 'Debug test description';
      
      console.log('✅ Changes:', {
        nameChanged,
        descriptionChanged,
        allChanged: nameChanged && descriptionChanged
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

debugUpdateRequest();
