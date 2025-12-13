/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Disable ESLint during build (can be enabled later)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Image Optimization
  images: {
    // Note: Add image storage domains here (S3, Cloudinary, etc.)
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    return config;
  },
  
  // Environment variables are accessed directly via process.env
  // No need to explicitly expose WordPress/WooCommerce env vars anymore
  
  // HTTP Security Headers (V1.2: Enhanced security for RBAC module)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // V1.2: Strict Transport Security (HTTPS only in production)
          {
            key: 'Strict-Transport-Security',
            value: process.env.NODE_ENV === 'production' 
              ? 'max-age=31536000; includeSubDomains; preload'
              : 'max-age=0' // Disable in development
          },
          // V1.2: Frame Options (prevent clickjacking)
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // V1.2: Content Type Options (prevent MIME sniffing)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // V1.2: XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // V1.2: Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // V1.2: Permissions Policy (restrict browser features)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ]
      }
    ]
  },
  
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig

