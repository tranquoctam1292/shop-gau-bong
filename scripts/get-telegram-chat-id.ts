/**
 * Get Telegram Chat ID
 * 
 * Script để lấy Chat ID từ Telegram Bot
 * Chạy: npm run test:telegram-chat-id hoặc tsx scripts/get-telegram-chat-id.ts
 * 
 * Lưu ý: Phải chat với bot trước khi chạy script này
 */

import { getChatId } from '../lib/services/telegram';

async function getTelegramChatId() {
  console.log('🔍 Getting Telegram Chat ID...\n');
  
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
  
  console.log('📋 Instructions:');
  console.log('   1. Open Telegram app');
  console.log('   2. Find your bot (search by username)');
  console.log('   3. Send any message to the bot (e.g., "Hello")');
  console.log('   4. Wait a few seconds...');
  console.log('');
  console.log('⏳ Fetching chat ID...\n');
  
  try {
    const chatId = await getChatId();
    
    if (chatId) {
      console.log('✅ Chat ID found!');
      console.log('');
      console.log('📝 Add this to your .env.local:');
      console.log(`   TELEGRAM_CHAT_ID=${chatId}`);
      console.log('');
      console.log('💡 Tips:');
      console.log('   - Make sure you have sent a message to the bot');
      console.log('   - If chat ID is null, try sending another message and run again');
    } else {
      console.error('❌ Chat ID not found');
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('   1. Make sure you have chatted with the bot');
      console.log('   2. Send a message to the bot and wait a few seconds');
      console.log('   3. Run this script again');
      console.log('   4. Check TELEGRAM_BOT_TOKEN is correct');
      process.exit(1);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', errorMessage);
    process.exit(1);
  }
}

// Run
getTelegramChatId()
  .then(() => {
    console.log('');
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

