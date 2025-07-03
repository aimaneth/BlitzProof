const axios = require('axios');

async function testScan() {
  try {
    console.log('🧪 Testing scan functionality...');
    
    // Test 1: Upload a simple contract
    console.log('1. Testing contract upload...');
    const formData = new FormData();
    formData.append('contract', Buffer.from(`
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestContract {
    uint256 public value;
    
    function setValue(uint256 _value) public {
        value = _value;
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
}`), { filename: 'test.sol' });
    formData.append('network', 'ethereum');
    
    const uploadResponse = await axios.post('http://localhost:4000/api/scan/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('✅ Upload successful:', uploadResponse.data);
    const scanId = uploadResponse.data.scanId;
    
    // Test 2: Check scan status
    console.log('2. Testing scan status...');
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const statusResponse = await axios.get(`http://localhost:4000/api/scan/${scanId}/status`);
        console.log(`✅ Status check ${attempts + 1}:`, statusResponse.data.status);
        
        if (statusResponse.data.status === 'completed' || statusResponse.data.status === 'error') {
          console.log('🎉 Scan completed!');
          console.log('Results:', JSON.stringify(statusResponse.data, null, 2));
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;
      } catch (error) {
        console.error(`❌ Status check ${attempts + 1} failed:`, error.response?.data || error.message);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('⚠️ Scan did not complete within expected time');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testScan(); 