/**
 * Backend Warm-Up Script
 * Run this 5-10 minutes before your demo to ensure backend is ready
 * 
 * Usage: node warm-up-backend.js
 */

const https = require('https');
const http = require('http');

# Get backend URL from environment or use default
const BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'https://tripsync-ai-backend.onrender.com';

console.log('🔥 TRIPseva Backend Warm-Up Script');
console.log('=' .repeat(50));
console.log(`Target: ${BACKEND_URL}`);
console.log('=' .repeat(50));

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: options.timeout || 60000,
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test health endpoint
 */
async function testHealth() {
  console.log('\n1️⃣  Testing health endpoint...');
  try {
    const start = Date.now();
    const response = await makeRequest(`${BACKEND_URL}/health`);
    const duration = Date.now() - start;
    
    if (response.status === 200) {
      console.log(`   ✅ Health check passed (${duration}ms)`);
      return true;
    } else {
      console.log(`   ⚠️  Health check returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Test root endpoint
 */
async function testRoot() {
  console.log('\n2️⃣  Testing root endpoint...');
  try {
    const start = Date.now();
    const response = await makeRequest(`${BACKEND_URL}/`);
    const duration = Date.now() - start;
    
    if (response.status === 200) {
      console.log(`   ✅ Root endpoint accessible (${duration}ms)`);
      return true;
    } else {
      console.log(`   ⚠️  Root endpoint returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Root endpoint failed: ${error.message}`);
    return false;
  }
}

/**
 * Test AI itinerary generation (this loads the AI model)
 */
async function testAIService() {
  console.log('\n3️⃣  Testing AI itinerary service...');
  console.log('   ⏳ This may take 30-60 seconds on cold start...');
  
  try {
    const start = Date.now();
    const response = await makeRequest(`${BACKEND_URL}/api/generate-itinerary`, {
      method: 'POST',
      body: {
        location: 'Paris, France',
        date_from: '2026-06-01T00:00:00Z',
        date_to: '2026-06-03T00:00:00Z',
        interests: ['culture', 'food', 'history'],
        group_size: { min: 2, max: 4 },
        dietary_restrictions: [],
        allergies: null,
        cuisine_preferences: ['French'],
        meal_budget: 'moderate',
        activity_level: 'moderate',
        accommodation_preference: 'hotel',
      },
      timeout: 90000, // 90 seconds for AI generation
    });
    
    const duration = Date.now() - start;
    
    if (response.status === 200) {
      console.log(`   ✅ AI service ready (${duration}ms)`);
      console.log(`   📊 Response size: ${response.data.length} bytes`);
      
      // Check if response contains itinerary
      try {
        const data = JSON.parse(response.data);
        if (data.success && data.itinerary) {
          console.log(`   ✅ Itinerary generated successfully`);
        } else {
          console.log(`   ⚠️  Response format unexpected`);
        }
      } catch (e) {
        console.log(`   ⚠️  Could not parse response`);
      }
      
      return true;
    } else {
      console.log(`   ⚠️  AI service returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ AI service failed: ${error.message}`);
    
    if (error.message.includes('timeout')) {
      console.log(`   💡 Tip: Backend might be cold. Try running this script again.`);
    }
    
    return false;
  }
}

/**
 * Main warm-up sequence
 */
async function warmUp() {
  const startTime = Date.now();
  
  console.log('\n🚀 Starting warm-up sequence...\n');
  
  // Test 1: Health check
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n⚠️  Backend might be offline or spinning up.');
    console.log('💡 Wait 60 seconds and try again.');
    process.exit(1);
  }
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Root endpoint
  const rootOk = await testRoot();
  if (!rootOk) {
    console.log('\n⚠️  Backend API might have issues.');
  }
  
  // Small delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: AI service (most important)
  const aiOk = await testAIService();
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  
  if (healthOk && aiOk) {
    console.log('🎉 Backend is WARM and READY for demo!');
    console.log(`⏱️  Total warm-up time: ${totalTime}s`);
    console.log('\n✅ All systems operational:');
    console.log('   • Health endpoint: ✅');
    console.log('   • API endpoints: ✅');
    console.log('   • AI service: ✅');
    console.log('\n💡 Your backend should respond quickly now.');
    console.log('💡 Run this script again 5 minutes before your demo.');
  } else {
    console.log('⚠️  Warm-up completed with warnings');
    console.log(`⏱️  Total time: ${totalTime}s`);
    console.log('\n⚠️  Some services may not be ready:');
    console.log(`   • Health endpoint: ${healthOk ? '✅' : '❌'}`);
    console.log(`   • AI service: ${aiOk ? '✅' : '❌'}`);
    console.log('\n💡 Try running the script again in 60 seconds.');
  }
  
  console.log('='.repeat(50) + '\n');
}

// Run the warm-up
warmUp().catch((error) => {
  console.error('\n❌ Warm-up script failed:', error.message);
  process.exit(1);
});
