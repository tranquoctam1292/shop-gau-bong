/**
 * Test Validation Script
 * 
 * Test Zod validation schemas với invalid và valid data
 * 
 * Run: tsx scripts/test-validation.ts
 */

import { momoPaymentSchema, vietqrPaymentSchema, validateBankTransferFile } from '../lib/validations/payment';
import { createOrderSchema, updateOrderSchema } from '../lib/validations/order';
import { z } from 'zod';

console.log('🧪 Testing Validation Schemas...\n');

// Test counters
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error: any) {
    console.error(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

// ==================== MoMo Payment Schema Tests ====================

console.log('📋 Testing MoMo Payment Schema\n');

// Valid data
test('MoMo: Valid data should pass', () => {
  const validData = {
    orderId: '123',
    amount: 100000,
    returnUrl: 'https://example.com/return',
    notifyUrl: 'https://example.com/notify',
  };
  const result = momoPaymentSchema.parse(validData);
  if (result.orderId !== '123') throw new Error('orderId should be string');
  if (result.amount !== 100000) throw new Error('amount should be 100000');
});

test('MoMo: orderId as number should be converted to string', () => {
  const validData = {
    orderId: 123,
    amount: 100000,
    returnUrl: 'https://example.com/return',
    notifyUrl: 'https://example.com/notify',
  };
  const result = momoPaymentSchema.parse(validData);
  if (typeof result.orderId !== 'string') throw new Error('orderId should be converted to string');
});

// Invalid data
test('MoMo: Missing orderId should fail', () => {
  try {
    momoPaymentSchema.parse({
      amount: 100000,
      returnUrl: 'https://example.com/return',
      notifyUrl: 'https://example.com/notify',
    });
    throw new Error('Should have failed');
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
  }
});

test('MoMo: Negative amount should fail', () => {
  try {
    momoPaymentSchema.parse({
      orderId: '123',
      amount: -1000,
      returnUrl: 'https://example.com/return',
      notifyUrl: 'https://example.com/notify',
    });
    throw new Error('Should have failed');
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
  }
});

test('MoMo: Invalid URL should fail', () => {
  try {
    momoPaymentSchema.parse({
      orderId: '123',
      amount: 100000,
      returnUrl: 'not-a-url',
      notifyUrl: 'https://example.com/notify',
    });
    throw new Error('Should have failed');
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
  }
});

// ==================== VietQR Payment Schema Tests ====================

console.log('\n📋 Testing VietQR Payment Schema\n');

// Valid data
test('VietQR: Valid data should pass', () => {
  const validData = {
    orderId: '123',
    amount: 100000,
    accountNo: '1234567890',
    accountName: 'Nguyen Van A',
    acqId: '970422',
  };
  const result = vietqrPaymentSchema.parse(validData);
  if (result.orderId !== '123') throw new Error('orderId should be string');
});

test('VietQR: orderId as number should be converted to string', () => {
  const validData = {
    orderId: 123,
    amount: 100000,
    accountNo: '1234567890',
    accountName: 'Nguyen Van A',
    acqId: '970422',
  };
  const result = vietqrPaymentSchema.parse(validData);
  if (typeof result.orderId !== 'string') throw new Error('orderId should be converted to string');
});

// Invalid data
test('VietQR: Missing accountNo should fail', () => {
  try {
    vietqrPaymentSchema.parse({
      orderId: '123',
      amount: 100000,
      accountName: 'Nguyen Van A',
      acqId: '970422',
    });
    throw new Error('Should have failed');
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
  }
});

test('VietQR: Empty accountName should fail', () => {
  try {
    vietqrPaymentSchema.parse({
      orderId: '123',
      amount: 100000,
      accountNo: '1234567890',
      accountName: '',
      acqId: '970422',
    });
    throw new Error('Should have failed');
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
  }
});

// ==================== Order Schema Tests ====================

console.log('\n📋 Testing Order Schemas\n');

// Valid order creation
test('Order: Valid order creation should pass', () => {
  const validOrder = {
    customerName: 'Nguyen Van A',
    customerEmail: 'test@example.com',
    customerPhone: '0912345678',
    orderType: 'personal' as const,
    billing: {
      firstName: 'Nguyen',
      lastName: 'Van A',
      address1: '123 Main St',
      city: 'Ho Chi Minh',
      postcode: '70000',
      country: 'VN',
    },
    shipping: {
      firstName: 'Nguyen',
      lastName: 'Van A',
      address1: '123 Main St',
      city: 'Ho Chi Minh',
      postcode: '70000',
      country: 'VN',
    },
    lineItems: [
      {
        productId: 'prod123',
        productName: 'Gau bong',
        quantity: 1,
        price: 100000,
      },
    ],
    paymentMethod: 'cod' as const,
    paymentMethodTitle: 'COD',
    subtotal: 100000,
    shippingTotal: 30000,
    total: 130000,
  };
  const result = createOrderSchema.parse(validOrder);
  if (result.customerName !== 'Nguyen Van A') throw new Error('customerName should match');
});

// Invalid order creation
test('Order: Invalid email should fail', () => {
  try {
    createOrderSchema.parse({
      customerName: 'Nguyen Van A',
      customerEmail: 'invalid-email',
      billing: {
        firstName: 'Nguyen',
        lastName: 'Van A',
        address1: '123 Main St',
        city: 'Ho Chi Minh',
        postcode: '70000',
        country: 'VN',
      },
      shipping: {
        firstName: 'Nguyen',
        lastName: 'Van A',
        address1: '123 Main St',
        city: 'Ho Chi Minh',
        postcode: '70000',
        country: 'VN',
      },
      lineItems: [
        {
          productId: 'prod123',
          productName: 'Gau bong',
          quantity: 1,
          price: 100000,
        },
      ],
      paymentMethod: 'cod',
      paymentMethodTitle: 'COD',
      subtotal: 100000,
      shippingTotal: 30000,
      total: 130000,
    });
    throw new Error('Should have failed');
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
  }
});

test('Order: Empty lineItems should fail', () => {
  try {
    createOrderSchema.parse({
      customerName: 'Nguyen Van A',
      customerEmail: 'test@example.com',
      billing: {
        firstName: 'Nguyen',
        lastName: 'Van A',
        address1: '123 Main St',
        city: 'Ho Chi Minh',
        postcode: '70000',
        country: 'VN',
      },
      shipping: {
        firstName: 'Nguyen',
        lastName: 'Van A',
        address1: '123 Main St',
        city: 'Ho Chi Minh',
        postcode: '70000',
        country: 'VN',
      },
      lineItems: [],
      paymentMethod: 'cod',
      paymentMethodTitle: 'COD',
      subtotal: 0,
      shippingTotal: 0,
      total: 0,
    });
    throw new Error('Should have failed');
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
  }
});

test('Order: Total mismatch should fail', () => {
  try {
    createOrderSchema.parse({
      customerName: 'Nguyen Van A',
      customerEmail: 'test@example.com',
      billing: {
        firstName: 'Nguyen',
        lastName: 'Van A',
        address1: '123 Main St',
        city: 'Ho Chi Minh',
        postcode: '70000',
        country: 'VN',
      },
      shipping: {
        firstName: 'Nguyen',
        lastName: 'Van A',
        address1: '123 Main St',
        city: 'Ho Chi Minh',
        postcode: '70000',
        country: 'VN',
      },
      lineItems: [
        {
          productId: 'prod123',
          productName: 'Gau bong',
          quantity: 1,
          price: 100000,
        },
      ],
      paymentMethod: 'cod',
      paymentMethodTitle: 'COD',
      subtotal: 100000,
      shippingTotal: 30000,
      total: 200000, // Wrong total
    });
    throw new Error('Should have failed');
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
  }
});

// Order update schema
test('Order Update: Valid update should pass', () => {
  const validUpdate = {
    status: 'processing' as const,
    customerNote: 'Please deliver in the morning',
  };
  const result = updateOrderSchema.parse(validUpdate);
  if (result.status !== 'processing') throw new Error('status should match');
});

test('Order Update: Empty update should fail', () => {
  try {
    updateOrderSchema.parse({});
    throw new Error('Should have failed');
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
  }
});

// ==================== File Validation Tests ====================

console.log('\n📋 Testing File Validation\n');

// Mock File object for testing
function createMockFile(name: string, type: string, size: number): File {
  const blob = new Blob(['test'], { type });
  const file = new File([blob], name, { type });
  // Override size property
  Object.defineProperty(file, 'size', { value: size, writable: false });
  return file;
}

test('File: Valid JPEG file should pass', () => {
  const file = createMockFile('receipt.jpg', 'image/jpeg', 1024 * 1024); // 1MB
  const result = validateBankTransferFile(file);
  if (!result.valid) throw new Error('Valid JPEG should pass');
});

test('File: Valid PDF file should pass', () => {
  const file = createMockFile('receipt.pdf', 'application/pdf', 2 * 1024 * 1024); // 2MB
  const result = validateBankTransferFile(file);
  if (!result.valid) throw new Error('Valid PDF should pass');
});

test('File: Invalid file type should fail', () => {
  const file = createMockFile('receipt.txt', 'text/plain', 1024);
  const result = validateBankTransferFile(file);
  if (result.valid) throw new Error('Invalid file type should fail');
});

test('File: File too large should fail', () => {
  const file = createMockFile('receipt.jpg', 'image/jpeg', 6 * 1024 * 1024); // 6MB
  const result = validateBankTransferFile(file);
  if (result.valid) throw new Error('File too large should fail');
});

// ==================== Summary ====================

console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary');
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total: ${passed + failed}`);
console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️ Some tests failed. Please review the errors above.');
  process.exit(1);
}
