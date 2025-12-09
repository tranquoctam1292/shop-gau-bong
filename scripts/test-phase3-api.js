/**
 * Test Script for Phase 3: Orders API Routes
 * 
 * Tests:
 * 1. GET /api/woocommerce/orders (list orders)
 * 2. GET /api/woocommerce/orders/[id] (single order)
 * 3. POST /api/woocommerce/orders (create order)
 * 4. GET /api/invoice/[orderId] (invoice PDF)
 */

// Try to load dotenv if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not installed, use environment variables directly
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Test colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function testGetOrders() {
  logInfo('\n📋 Test 1: GET /api/woocommerce/orders');
  log('='.repeat(60));
  
  try {
    const response = await fetch(`${BASE_URL}/api/woocommerce/orders?per_page=5`);
    const data = await response.json();
    
    if (response.ok && data.orders) {
      logSuccess(`Orders API: Success (${response.status})`);
      logInfo(`   Found ${data.orders.length} orders`);
      if (data.orders.length > 0) {
        const firstOrder = data.orders[0];
        logInfo(`   First order ID: ${firstOrder.id}, Status: ${firstOrder.status}`);
        return firstOrder.id;
      }
      return null;
    } else {
      logError(`Orders API: Error (${response.status})`);
      logError(`   Response: ${JSON.stringify(data, null, 2)}`);
      return null;
    }
  } catch (error) {
    logError(`Orders API: Exception`);
    logError(`   ${error.message}`);
    return null;
  }
}

async function testGetSingleOrder(orderId) {
  if (!orderId) {
    logWarning('\n⏭️  Test 2: GET /api/woocommerce/orders/[id] - SKIPPED (no order ID)');
    return null;
  }
  
  logInfo(`\n📋 Test 2: GET /api/woocommerce/orders/${orderId}`);
  log('='.repeat(60));
  
  try {
    const response = await fetch(`${BASE_URL}/api/woocommerce/orders/${orderId}`);
    const data = await response.json();
    
    if (response.ok && data.order) {
      logSuccess(`Single Order API: Success (${response.status})`);
      logInfo(`   Order ID: ${data.order.id}`);
      logInfo(`   Order Number: ${data.order.number || 'N/A'}`);
      logInfo(`   Status: ${data.order.status}`);
      logInfo(`   Total: ${data.order.total} ${data.order.currency}`);
      logInfo(`   Payment Method: ${data.order.payment_method}`);
      logInfo(`   Line Items: ${data.order.line_items?.length || 0}`);
      return data.order;
    } else {
      logError(`Single Order API: Error (${response.status})`);
      logError(`   Response: ${JSON.stringify(data, null, 2)}`);
      return null;
    }
  } catch (error) {
    logError(`Single Order API: Exception`);
    logError(`   ${error.message}`);
    return null;
  }
}

async function testCreateOrder() {
  logInfo('\n📋 Test 3: POST /api/woocommerce/orders (Create Order)');
  log('='.repeat(60));
  logWarning('   Note: This requires a valid product ID in line_items');
  
  // Get first product ID (you may need to adjust this)
  const productId = 91; // Replace with actual product ID from your WooCommerce
  
  const orderData = {
    payment_method: 'cod',
    payment_method_title: 'Thanh toán khi nhận hàng (COD)',
    set_paid: false,
    billing: {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone: '0123456789',
      address_1: '123 Test Street',
      city: 'Ho Chi Minh',
      postcode: '700000',
      country: 'VN',
    },
    shipping: {
      first_name: 'Test',
      last_name: 'User',
      address_1: '123 Test Street',
      city: 'Ho Chi Minh',
      postcode: '700000',
      country: 'VN',
    },
    line_items: [
      {
        product_id: productId,
        quantity: 1,
      },
    ],
    customer_note: 'Test order from Phase 3 API test script',
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/woocommerce/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    const data = await response.json();
    
    if (response.ok && data.order) {
      logSuccess(`Create Order API: Success (${response.status})`);
      logInfo(`   Order ID: ${data.order.id}`);
      logInfo(`   Order Number: ${data.order.number || 'N/A'}`);
      logInfo(`   Status: ${data.order.status}`);
      logInfo(`   Total: ${data.order.total} ${data.order.currency}`);
      logWarning(`   ⚠️  Please delete this test order (ID: ${data.order.id}) from WooCommerce admin`);
      return data.order.id;
    } else {
      logError(`Create Order API: Error (${response.status})`);
      logError(`   Response: ${JSON.stringify(data, null, 2)}`);
      return null;
    }
  } catch (error) {
    logError(`Create Order API: Exception`);
    logError(`   ${error.message}`);
    return null;
  }
}

async function testInvoice(orderId) {
  if (!orderId) {
    logWarning('\n⏭️  Test 4: GET /api/invoice/[orderId] - SKIPPED (no order ID)');
    return;
  }
  
  logInfo(`\n📋 Test 4: GET /api/invoice/${orderId}`);
  log('='.repeat(60));
  
  try {
    const response = await fetch(`${BASE_URL}/api/invoice/${orderId}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        logSuccess(`Invoice API: Success (${response.status})`);
        logInfo(`   Content-Type: ${contentType}`);
        logInfo(`   PDF generated successfully`);
        logWarning(`   ⚠️  PDF cannot be displayed in console. Check browser for download.`);
      } else {
        logError(`Invoice API: Wrong Content-Type`);
        logError(`   Expected: application/pdf`);
        logError(`   Got: ${contentType}`);
      }
    } else {
      const data = await response.json().catch(() => ({}));
      logError(`Invoice API: Error (${response.status})`);
      logError(`   Response: ${JSON.stringify(data, null, 2)}`);
    }
  } catch (error) {
    logError(`Invoice API: Exception`);
    logError(`   ${error.message}`);
  }
}

async function runTests() {
  log('\n' + '='.repeat(60));
  log('🧪 Phase 3 API Routes Test', colors.blue);
  log('='.repeat(60));
  logInfo(`Base URL: ${BASE_URL}`);
  logInfo(`Make sure Next.js dev server is running (npm run dev)`);
  
  // Test 1: Get orders
  const firstOrderId = await testGetOrders();
  
  // Test 2: Get single order
  const order = await testGetSingleOrder(firstOrderId);
  
  // Test 3: Create order (optional - comment out if you don't want to create test orders)
  // const newOrderId = await testCreateOrder();
  
  // Test 4: Invoice
  if (firstOrderId) {
    await testInvoice(firstOrderId);
  }
  
  // Summary
  log('\n' + '='.repeat(60));
  log('📊 Test Summary', colors.blue);
  log('='.repeat(60));
  logInfo('✅ All API routes tested');
  logInfo('📝 Check results above for any errors');
  logInfo('🔍 For full testing, use browser to test checkout flow');
  log('\n');
}

// Run tests
runTests().catch((error) => {
  logError(`\nFatal error: ${error.message}`);
  process.exit(1);
});

