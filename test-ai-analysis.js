const fs = require('fs');
const path = require('path');

// Test script to verify AI Analysis functionality
console.log('🧪 Testing AI Analysis Features...\n');

// Test 1: Check if test contract exists
const testContractPath = path.join(__dirname, 'backend/test-contracts/VulnerableToken.sol');
if (fs.existsSync(testContractPath)) {
    console.log('✅ Test contract found:', testContractPath);
    const contractContent = fs.readFileSync(testContractPath, 'utf8');
    console.log('📄 Contract size:', contractContent.length, 'characters');
    console.log('🔍 Vulnerabilities expected: reentrancy, unchecked external calls, access control\n');
} else {
    console.log('❌ Test contract not found');
    process.exit(1);
}

// Test 2: Check backend configuration
const backendConfigPath = path.join(__dirname, 'backend/src/config/database.ts');
if (fs.existsSync(backendConfigPath)) {
    console.log('✅ Backend configuration found');
} else {
    console.log('❌ Backend configuration not found');
}

// Test 3: Check AI Analysis service
const aiServicePath = path.join(__dirname, 'backend/src/services/aiAnalysisService.ts');
if (fs.existsSync(aiServicePath)) {
    console.log('✅ AI Analysis service found');
    const aiServiceContent = fs.readFileSync(aiServicePath, 'utf8');
    if (aiServiceContent.includes('Gemini')) {
        console.log('✅ Gemini API integration found');
    }
    if (aiServiceContent.includes('analyzeVulnerabilities')) {
        console.log('✅ AI analysis method found');
    }
} else {
    console.log('❌ AI Analysis service not found');
}

// Test 4: Check frontend components
const frontendComponents = [
    'frontend/src/components/ui/advanced-ai-dashboard.tsx',
    'frontend/src/components/ui/ai-analysis-card.tsx'
];

console.log('\n🔍 Checking frontend components:');
frontendComponents.forEach(componentPath => {
    const fullPath = path.join(__dirname, componentPath);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${componentPath}`);
    } else {
        console.log(`❌ ${componentPath}`);
    }
});

// Test 5: Check scan service fixes
const scanServicePath = path.join(__dirname, 'backend/src/services/scanService.ts');
if (fs.existsSync(scanServicePath)) {
    console.log('\n🔍 Checking scan service fixes:');
    const scanServiceContent = fs.readFileSync(scanServicePath, 'utf8');
    
    if (scanServiceContent.includes('calculateSecurityScore')) {
        console.log('✅ Security score calculation found');
    }
    if (scanServiceContent.includes('AI confidence bonus')) {
        console.log('✅ AI confidence bonus calculation found');
    }
    if (!scanServiceContent.includes('INSERT INTO ai_analysis_results')) {
        console.log('✅ Database storage removed (foreign key constraint fix)');
    }
}

console.log('\n🎯 Testing Instructions:');
console.log('1. Start the backend server: cd backend && npm start');
console.log('2. Start the frontend: cd frontend && npm run dev');
console.log('3. Upload the test contract: backend/test-contracts/VulnerableToken.sol');
console.log('4. Verify scan button shows loading state during scan');
console.log('5. Check AI Analysis dashboard shows real data');
console.log('6. Verify security score is not NaN');

console.log('\n📊 Expected Results:');
console.log('- Scan button: Should show "Scanning..." with spinner for ~30-60 seconds');
console.log('- AI Analysis: Should show 4+ AI analysis results with confidence scores');
console.log('- Security Score: Should show a numerical value (not NaN)');
console.log('- Advanced AI Dashboard: Should display real AI insights and recommendations');

console.log('\n🚀 Ready to test! Upload the VulnerableToken.sol contract and verify the results.'); 