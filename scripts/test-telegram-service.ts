/**
 * Test Telegram Notification Service
 * 
 * Script để test Telegram notification service
 * Chạy: npm run test:telegram hoặc tsx scripts/test-telegram-service.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { sendTelegramNotification, getChatId } from '../lib/services/telegram';

async function testTelegramService() {
  console.log('🧪 Testing Telegram Notification Service...\n');
  
  // Check environment variables
  console.log('📋 Checking environment variables:');
  console.log(`  TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Not set'}`);
  console.log(`  TELEGRAM_CHAT_ID: ${process.env.TELEGRAM_CHAT_ID ? '✅ Set' : '❌ Not set'}`);
  console.log('');
  
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not set. Please add it to .env.local');
    console.log('');
    console.log('📝 How to get bot token:');
    console.log('   1. Open Telegram and search for @BotFather');
    console.log('   2. Send /newbot command');
    console.log('   3. Follow instructions to create bot');
    console.log('   4. Copy the bot token');
    process.exit(1);
  }
  
  if (!process.env.TELEGRAM_CHAT_ID) {
    console.error('❌ TELEGRAM_CHAT_ID is not set. Please add it to .env.local');
    console.log('');
    console.log('📝 How to get chat ID:');
    console.log('   1. Chat with your bot on Telegram (send any message)');
    console.log('   2. Run: npm run test:telegram-chat-id');
    console.log('   3. Copy the chat ID from output');
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
    },
    createdAt: new Date(),
    adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://teddyland.vn'}/admin/orders/TEST-${Date.now()}`,
  };
  
  console.log('📱 Sending test notification to Telegram...');
  console.log(`  Chat ID: ${process.env.TELEGRAM_CHAT_ID}`);
  console.log(`  Order Number: ${testOrderData.orderNumber}`);
  console.log('');
  
  try {
    const result = await sendTelegramNotification(testOrderData);
    
    if (result.success) {
      console.log('✅ Telegram notification sent successfully!');
      console.log('');
      console.log('📬 Please check your Telegram app');
      console.log('   You should receive a notification with order details');
      console.log('');
      console.log('💡 Tips:');
      console.log('   - Make sure Telegram app is installed and logged in');
      console.log('   - Check notification settings in Telegram app');
      console.log('   - Verify bot is working by chatting with it');
    } else {
      console.error('❌ Failed to send Telegram notification:', result.error);
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('   1. Check TELEGRAM_BOT_TOKEN is correct');
      console.log('   2. Check TELEGRAM_CHAT_ID is correct');
      console.log('   3. Make sure you have chatted with the bot');
      console.log('   4. Verify bot is active in BotFather');
      process.exit(1);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', errorMessage);
    process.exit(1);
  }
}

// Run test
testTelegramService()
  .then(() => {
    console.log('');
    console.log('✨ Test completed!');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

