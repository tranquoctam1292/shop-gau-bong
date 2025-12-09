/**
 * Test WordPress Core REST API và WooCommerce REST API
 * 
 * Usage: node scripts/test-wordpress-api.js
 */

// Load environment variables
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

const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;
const WP_USERNAME = process.env.WORDPRESS_USERNAME;
const WP_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;
const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost/wordpress';

console.log('🧪 Testing WordPress & WooCommerce REST API\n');
console.log('WordPress URL:', WORDPRESS_URL);
console.log('Consumer Key:', CONSUMER_KEY ? CONSUMER_KEY.substring(0, 20) + '...' : 'NOT SET');
console.log('Consumer Secret:', CONSUMER_SECRET ? 'SET' : 'NOT SET');
console.log('WP Username:', WP_USERNAME || 'NOT SET');
console.log('WP App Password:', WP_APP_PASSWORD ? 'SET' : 'NOT SET');
console.log('\n');

// Create auth headers
function getAuthHeaders() {
  const headers = [];
  
  // Method 1: WooCommerce REST API key
  if (CONSUMER_KEY && CONSUMER_SECRET) {
    const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    headers.push({
      name: 'WooCommerce REST API Key',
      value: `Basic ${credentials}`,
    });
  }
  
  // Method 2: WordPress Application Password
  if (WP_USERNAME && WP_APP_PASSWORD) {
    const cleanPassword = WP_APP_PASSWORD.replace(/\s+/g, '');
    const credentials = Buffer.from(`${WP_USERNAME}:${cleanPassword}`).toString('base64');
    headers.push({
      name: 'WordPress Application Password',
      value: `Basic ${credentials}`,
    });
  }
  
  return headers;
}

const authHeaders = getAuthHeaders();

if (authHeaders.length === 0) {
  console.error('❌ No authentication credentials found!');
  console.error('Please set either:');
  console.error('  - WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET');
  console.error('  - WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD');
  process.exit(1);
}

// Test endpoints
const endpoints = [
  // WordPress Core REST API
  { url: '/wp-json/wp/v2/posts?per_page=1', name: 'WordPress Posts API' },
  { url: '/wp-json/wp/v2/users/me', name: 'WordPress Current User API' },
  
  // WooCommerce REST API
  { url: '/wp-json/wc/v3/products?per_page=1', name: 'WooCommerce Products API' },
  { url: '/wp-json/wc/v3/products/categories?per_page=1', name: 'WooCommerce Categories API' },
  { url: '/wp-json/wc/v3/system_status', name: 'WooCommerce System Status API' },
];

async function testEndpoint(endpoint, authHeader, authName) {
  const url = `${WORDPRESS_URL}${endpoint.url}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`✅ ${endpoint.name} (${authName}): Success (${response.status})`);
      try {
        const json = JSON.parse(responseText);
        console.log(`   Response: ${JSON.stringify(json).substring(0, 100)}...`);
      } catch {
        console.log(`   Response: ${responseText.substring(0, 100)}...`);
      }
      return true;
    } else {
      console.log(`❌ ${endpoint.name} (${authName}): Error (${response.status})`);
      console.log(`   Response: ${responseText}`);
      
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.code) {
          console.log(`   Error Code: ${errorJson.code}`);
          console.log(`   Error Message: ${errorJson.message}`);
        }
      } catch {
        // Not JSON
      }
      
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint.name} (${authName}): Network Error`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('WordPress & WooCommerce REST API Test');
  console.log('='.repeat(70) + '\n');

  for (const auth of authHeaders) {
    console.log(`\n🔐 Testing with: ${auth.name}`);
    console.log('-'.repeat(70));
    
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint, auth.value, auth.name);
      await new Promise(resolve => setTimeout(resolve, 300)); // Delay
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('Test Complete');
  console.log('='.repeat(70));
  
  console.log('\n💡 If WordPress Core API works but WooCommerce API fails:');
  console.log('   - Check WooCommerce plugin is activated');
  console.log('   - Check WooCommerce REST API settings');
  console.log('   - Check user capabilities for WooCommerce');
  
  console.log('\n💡 If all APIs fail:');
  console.log('   - Check authentication credentials');
  console.log('   - Check user role (must be Administrator)');
  console.log('   - Check WordPress REST API is enabled');
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

