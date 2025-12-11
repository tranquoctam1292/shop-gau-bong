import { NextResponse } from 'next/server';

/**
 * Test API Route: Kiểm tra Environment Variables
 * GET /api/test-env
 * 
 * Dùng để verify environment variables đã được set đúng trên Vercel
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const env = {
    // WordPress URL
    hasWordPressUrl: !!process.env.NEXT_PUBLIC_WORDPRESS_URL,
    wordPressUrl: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'NOT SET',
    
    // WooCommerce API Credentials
    hasConsumerKey: !!process.env.WOOCOMMERCE_CONSUMER_KEY,
    hasConsumerSecret: !!process.env.WOOCOMMERCE_CONSUMER_SECRET,
    consumerKeyLength: process.env.WOOCOMMERCE_CONSUMER_KEY?.length || 0,
    consumerSecretLength: process.env.WOOCOMMERCE_CONSUMER_SECRET?.length || 0,
    
    // Alternative: WordPress Application Password
    hasWordPressUsername: !!process.env.WORDPRESS_USERNAME,
    hasWordPressAppPassword: !!process.env.WORDPRESS_APP_PASSWORD,
    
    // Site URL
    hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
    
    // Environment
    nodeEnv: process.env.NODE_ENV,
    
    // Validation
    isValid: 
      !!process.env.NEXT_PUBLIC_WORDPRESS_URL &&
      (!!process.env.WOOCOMMERCE_CONSUMER_KEY && !!process.env.WOOCOMMERCE_CONSUMER_SECRET) ||
      (!!process.env.WORDPRESS_USERNAME && !!process.env.WORDPRESS_APP_PASSWORD),
  };
  
  return NextResponse.json(env, {
    status: env.isValid ? 200 : 500,
  });
}

