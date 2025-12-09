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
  const defaultEnv = `# WordPress Configuration
# Local Development: Point to Local XAMPP WordPress
NEXT_PUBLIC_WORDPRESS_URL=http://localhost/wordpress
# Staging: https://staging.yourdomain.com
# Production: https://yourdomain.com

# GraphQL Endpoint
# Local Development: Point to Local XAMPP GraphQL
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost/wordpress/graphql
# Staging: https://staging.yourdomain.com/graphql
# Production: https://yourdomain.com/graphql

# JWT Authentication (nếu sử dụng)
JWT_SECRET=your_jwt_secret_here

# Payment Gateway - VietQR
NEXT_PUBLIC_VIETQR_API_KEY=your_vietqr_api_key_here

# Payment Gateway - MoMo
NEXT_PUBLIC_MOMO_PARTNER_CODE=your_momo_partner_code
MOMO_SECRET_KEY=your_momo_secret_key

# Payment Gateway - ZaloPay (optional)
NEXT_PUBLIC_ZALOPAY_APP_ID=your_zalopay_app_id
ZALOPAY_KEY1=your_zalopay_key1
ZALOPAY_KEY2=your_zalopay_key2

# NextAuth (nếu sử dụng)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
`;
  fs.writeFileSync(envLocalPath, defaultEnv);
  console.log('✅ Created .env.local with default local development values!');
  console.log('');
  console.log('📝 Please update the following if needed:');
  console.log('   - NEXT_PUBLIC_WORDPRESS_URL (if your WordPress is in a different folder)');
  console.log('   - Payment gateway keys (when ready)');
  console.log('');
  process.exit(0);
}

// Read .env.example
const envExample = fs.readFileSync(envExamplePath, 'utf8');

// Create .env.local with default values for local development
const envLocal = envExample
  .replace(/NEXT_PUBLIC_WORDPRESS_URL=.*/g, 'NEXT_PUBLIC_WORDPRESS_URL=http://localhost/wordpress')
  .replace(/NEXT_PUBLIC_GRAPHQL_ENDPOINT=.*/g, 'NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost/wordpress/graphql')
  .replace(/NEXTAUTH_URL=.*/g, 'NEXTAUTH_URL=http://localhost:3000');

// Write .env.local
fs.writeFileSync(envLocalPath, envLocal);

console.log('✅ Created .env.local with default local development values!');
console.log('');
console.log('📝 Please update the following if needed:');
console.log('   - NEXT_PUBLIC_WORDPRESS_URL (if your WordPress is in a different folder)');
console.log('   - Payment gateway keys (when ready)');
console.log('');

