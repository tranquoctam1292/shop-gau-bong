/**
 * Script để generate NEXTAUTH_SECRET
 * 
 * Usage: node scripts/generate-nextauth-secret.js
 */

const crypto = require('crypto');

// Generate a secure random secret (32 bytes = 256 bits)
const secret = crypto.randomBytes(32).toString('base64');

console.log('\n✅ Generated NEXTAUTH_SECRET:');
console.log('─'.repeat(60));
console.log(secret);
console.log('─'.repeat(60));
console.log('\n📝 Hướng dẫn:');
console.log('1. Copy secret trên');
console.log('2. Vào Vercel Dashboard > Settings > Environment Variables');
console.log('3. Thêm biến:');
console.log('   Key: NEXTAUTH_SECRET');
console.log('   Value: [paste secret ở trên]');
console.log('   Environment: Production, Preview, Development');
console.log('4. Save và Redeploy\n');
