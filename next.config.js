/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Disable ESLint during build (can be enabled later)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Image Optimization
  images: {
    domains: [], // Thêm domain WordPress của bạn vào đây
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
  
  env: {
    NEXT_PUBLIC_WORDPRESS_URL: process.env.NEXT_PUBLIC_WORDPRESS_URL,
    NEXT_PUBLIC_WOOCOMMERCE_KEY: process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY,
    NEXT_PUBLIC_WOOCOMMERCE_SECRET: process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET,
  },
}

module.exports = nextConfig

