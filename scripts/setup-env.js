/**
 * Script để tạo .env.local từ .env.example
 * Chạy: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');

const envExamplePath = path.join(__dirname, '..', '.env.example');
const envLocalPath = path.join(__dirname, '..', '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  .env.local already exists!');
  console.log('   If you want to recreate it, delete the file first.');
  process.exit(0);
}

// Check if .env.example exists
if (!fs.existsSync(envExamplePath)) {
  console.log('⚠️  .env.example not found. Creating .env.local with default values...');
  // Create default .env.local content
  const defaultEnv = `# Database
MONGODB_URI=mongodb://localhost:27017/shop-gau-bong
MONGODB_DB_NAME=shop-gau-bong

# Authentication (for Admin Panel)
AUTH_SECRET=EXAMPLE_ONLY_abc123XYZ789_GENERATE_YOUR_OWN_WITH_OPENSSL
NEXTAUTH_URL=http://localhost:3000

# Admin Credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-strong-password-here

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Payment Gateway - VietQR
NEXT_PUBLIC_VIETQR_ACCOUNT_NO=your_account_number
NEXT_PUBLIC_VIETQR_ACCOUNT_NAME=SHOP GAU BONG
NEXT_PUBLIC_VIETQR_ACQ_ID=970415
VIETQR_WEBHOOK_SECRET=your_webhook_secret

# Payment Gateway - MoMo
NEXT_PUBLIC_MOMO_PARTNER_CODE=your_momo_partner_code
MOMO_SECRET_KEY=your_momo_secret_key
`;
  fs.writeFileSync(envLocalPath, defaultEnv);
  console.log('✅ Created .env.local with default local development values!');
  console.log('');
  console.log('📝 Please update the following if needed:');
  console.log('   - MONGODB_URI (if using MongoDB Atlas or different connection)');
  console.log('   - AUTH_SECRET (generate with: openssl rand -base64 32)');
  console.log('   - ADMIN_EMAIL and ADMIN_PASSWORD');
  console.log('   - Payment gateway keys (when ready)');
  console.log('');
  process.exit(0);
}

// Read .env.example
const envExample = fs.readFileSync(envExamplePath, 'utf8');

// Create .env.local with default values for local development
const envLocal = envExample
  .replace(/MONGODB_URI=.*/g, 'MONGODB_URI=mongodb://localhost:27017/shop-gau-bong')
  .replace(/NEXTAUTH_URL=.*/g, 'NEXTAUTH_URL=http://localhost:3000')
  .replace(/NEXT_PUBLIC_SITE_URL=.*/g, 'NEXT_PUBLIC_SITE_URL=http://localhost:3000');

// Write .env.local
fs.writeFileSync(envLocalPath, envLocal);

console.log('✅ Created .env.local with default local development values!');
console.log('');
console.log('📝 Please update the following if needed:');
console.log('   - MONGODB_URI (if using MongoDB Atlas or different connection)');
console.log('   - AUTH_SECRET (generate with: openssl rand -base64 32)');
console.log('   - ADMIN_EMAIL and ADMIN_PASSWORD');
console.log('   - Payment gateway keys (when ready)');
console.log('');

