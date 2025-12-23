/**
 * Test Email Service
 * 
 * Script để test email notification service
 * Chạy: npm run test:email hoặc tsx scripts/test-email-service.ts
 */

import { sendNewOrderNotificationEmail } from '../lib/services/email';

async function testEmailService() {
  console.log('🧪 Testing Email Notification Service...\n');
  
  // Check environment variables
  console.log('📋 Checking environment variables:');
  console.log(`  RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ Not set'}`);
  console.log(`  ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || '❌ Not set'}`);
  console.log(`  EMAIL_REPLY_TO: ${process.env.EMAIL_REPLY_TO || '❌ Not set'}`);
  console.log(`  NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || '❌ Not set'}`);
  console.log('');
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set. Please add it to .env.local');
    process.exit(1);
  }
  
  if (!process.env.ADMIN_EMAIL) {
    console.error('❌ ADMIN_EMAIL is not set. Please add it to .env.local');
    process.exit(1);
  }
  
  // Test data
  const testOrderData = {
    orderNumber: `TEST-${Date.now()}`,
    customerName: 'Nguyễn Văn Test',
    customerEmail: 'test@example.com',
    customerPhone: '0901234567',
    grandTotal: 500000,
    paymentMethod: 'cod',
    paymentMethodTitle: 'Thanh toán khi nhận hàng (COD)',
    items: [
      {
        productName: 'Gấu Bông Teddy Bear Size L',
        quantity: 2,
        price: 200000,
        total: 400000,
      },
      {
        productName: 'Gấu Bông Hello Kitty',
        quantity: 1,
        price: 100000,
        total: 100000,
      },
    ],
    shippingAddress: {
      address1: '123 Đường ABC',
      address2: 'Phường XYZ',
      province: 'Hà Nội',
      postcode: '100000',
      phone: '0901234567',
    },
    createdAt: new Date(),
  };
  
  console.log('📧 Sending test email...');
  console.log(`  To: ${process.env.ADMIN_EMAIL}`);
  console.log(`  Order Number: ${testOrderData.orderNumber}`);
  console.log('');
  
  try {
    const result = await sendNewOrderNotificationEmail(testOrderData);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('');
      console.log('📬 Please check your inbox at:', process.env.ADMIN_EMAIL);
      console.log('   Subject: 🧸 Đơn hàng mới -', testOrderData.orderNumber);
      console.log('');
      console.log('💡 Tips:');
      console.log('   - Check spam folder if email not received');
      console.log('   - Verify domain in Resend dashboard if email fails');
      console.log('   - Check Resend logs for delivery status');
    } else {
      console.error('❌ Failed to send email:', result.error);
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('   1. Check RESEND_API_KEY is correct');
      console.log('   2. Verify domain in Resend dashboard');
      console.log('   3. Check ADMIN_EMAIL is valid');
      console.log('   4. Review Resend dashboard logs');
      process.exit(1);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', errorMessage);
    process.exit(1);
  }
}

// Run test
testEmailService()
  .then(() => {
    console.log('');
    console.log('✨ Test completed!');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
