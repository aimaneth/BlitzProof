const http = require('http');

console.log('🔍 Checking server status...\n');

// Check backend server
const checkBackend = () => {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:4000/health', (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Backend server is running on port 4000');
                resolve(true);
            } else {
                console.log('❌ Backend server responded with status:', res.statusCode);
                resolve(false);
            }
        });
        
        req.on('error', () => {
            console.log('❌ Backend server is not running on port 4000');
            resolve(false);
        });
        
        req.setTimeout(3000, () => {
            console.log('❌ Backend server timeout');
            resolve(false);
        });
    });
};

// Check frontend server
const checkFrontend = () => {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000', (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Frontend server is running on port 3000');
                resolve(true);
            } else {
                console.log('❌ Frontend server responded with status:', res.statusCode);
                resolve(false);
            }
        });
        
        req.on('error', () => {
            console.log('❌ Frontend server is not running on port 3000');
            resolve(false);
        });
        
        req.setTimeout(3000, () => {
            console.log('❌ Frontend server timeout');
            resolve(false);
        });
    });
};

// Run checks
async function checkServers() {
    const backendRunning = await checkBackend();
    const frontendRunning = await checkFrontend();
    
    console.log('\n📊 Server Status Summary:');
    console.log(`Backend:  ${backendRunning ? '✅ Running' : '❌ Not Running'}`);
    console.log(`Frontend: ${frontendRunning ? '✅ Running' : '❌ Not Running'}`);
    
    if (backendRunning && frontendRunning) {
        console.log('\n🎉 All servers are running! Ready to test AI Analysis features.');
        console.log('🌐 Frontend URL: http://localhost:3000');
        console.log('🔧 Backend URL: http://localhost:4000');
    } else {
        console.log('\n⚠️  Some servers are not running. Please start them:');
        console.log('Backend:  cd backend && npm start');
        console.log('Frontend: cd frontend && npm run dev');
    }
}

checkServers(); 