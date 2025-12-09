/**
 * Test WooCommerce REST API Authentication
 * 
 * Usage: node scripts/test-woocommerce-api.js
 */

// Load environment variables from .env.local
// Note: In Node.js, we can use dotenv if installed, or read file directly
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not installed, try to read .env.local manually
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  }
}

const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;
const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost/wordpress';

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.error('❌ Error: WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET must be set in .env.local');
  process.exit(1);
}

// Create Basic Auth header
const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
const authHeader = `Basic ${credentials}`;

console.log('🧪 Testing WooCommerce REST API Authentication\n');
console.log('WordPress URL:', WORDPRESS_URL);
console.log('Consumer Key:', CONSUMER_KEY.substring(0, 20) + '...');
console.log('Auth Header:', authHeader.substring(0, 20) + '...\n');

// Test endpoints
const endpoints = [
  '/wp-json/wc/v3/products?per_page=1',
  '/wp-json/wc/v3/products/categories?per_page=1',
  '/wp-json/wc/v3/system_status',
];

async function testEndpoint(endpoint) {
  const url = `${WORDPRESS_URL}${endpoint}`;
  
  try {
    console.log(`📡 Testing: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`✅ Success (${response.status}): ${responseText.substring(0, 100)}...\n`);
      return true;
    } else {
      console.log(`❌ Error (${response.status}): ${responseText}\n`);
      
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.code === 'woocommerce_rest_cannot_view') {
          console.log('💡 Hint: API key permissions issue. Check:');
          console.log('   1. API key must have Read/Write permissions');
          console.log('   2. User of API key must be Administrator or Shop Manager');
          console.log('   3. WooCommerce REST API must be enabled\n');
        }
      } catch {
        // Not JSON
      }
      
      return false;
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('WooCommerce REST API Authentication Test');
  console.log('='.repeat(60) + '\n');

  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint, success: result });
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay between requests
  }

  console.log('='.repeat(60));
  console.log('Test Results Summary');
  console.log('='.repeat(60));
  
  results.forEach(({ endpoint, success }) => {
    console.log(`${success ? '✅' : '❌'} ${endpoint}`);
  });

  const allPassed = results.every(r => r.success);
  
  if (allPassed) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

