// Test script to verify frontend-backend connection
const fetch = require('node-fetch');

async function testConnection() {
  console.log('🔍 Testing Backend Connection...\n');
  
  try {
    // Test backend health
    console.log('1. Testing backend health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Backend Health:', healthData);
    
    // Test main endpoint
    console.log('\n2. Testing main backend endpoint...');
    const mainResponse = await fetch('http://localhost:5000/');
    const mainData = await mainResponse.json();
    console.log('✅ Main Endpoint:', mainData);
    
    // Test contact endpoint with sample data
    console.log('\n3. Testing contact endpoint...');
    const contactResponse = await fetch('http://localhost:5000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        message: 'This is a test message'
      })
    });
    
    const contactData = await contactResponse.json();
    console.log('✅ Contact Endpoint Response:', contactData);
    
    console.log('\n🎉 All tests passed! Backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure backend is running: npm run dev (in backend folder)');
    console.log('2. Check if port 5000 is available');
    console.log('3. Verify no firewall is blocking the connection');
  }
}

testConnection();
