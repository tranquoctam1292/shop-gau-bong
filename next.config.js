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
    instrumentationHook: false,
    // Optimize package imports - tree shake unused exports
    optimizePackageImports: [
      'lucide-react', // Tree shake unused icons
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@tanstack/react-query', // Tree shake unused query functions
      'date-fns', // Tree shake unused date functions
      'zod', // Tree shake unused validators
    ],
  },
  
  // Webpack optimizations for bundle size and tree shaking
  webpack: (config, { isServer, webpack }) => {
    // Optimize bundle size - external server-only modules
    if (!isServer) {
      // Client-side: exclude server-only modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Note: Server-side modules (mongodb, sharp) are kept bundled
    // as they are required at runtime and Next.js handles them efficiently

    // Enable tree shaking (merge with Next.js defaults to avoid conflicts)
    // Note: Next.js already has tree shaking enabled by default
    // We only override specific properties that don't conflict with cacheUnaffected
    if (config.optimization) {
      // Merge optimization config without overriding cacheUnaffected
      config.optimization = {
        ...config.optimization,
        // Don't set usedExports here - it conflicts with cacheUnaffected in Next.js 14
        // Next.js already enables tree shaking by default
        // usedExports is handled by Next.js internally
        moduleIds: config.optimization.moduleIds || 'deterministic', // Better caching
        chunkIds: config.optimization.chunkIds || 'deterministic', // Better caching
      };
    }

    // Optimize module resolution for better tree shaking
    config.resolve = {
      ...config.resolve,
      // Prefer ES modules for better tree shaking
      mainFields: ['module', 'main'],
    };

    // Split chunks optimization for better code splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          // Vendor chunks - separate large libraries
          default: false,
          vendors: false,
          // React and React DOM
          react: {
            name: 'react-vendor',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            priority: 20,
            reuseExistingChunk: true,
          },
          // Next.js framework
          nextjs: {
            name: 'nextjs-vendor',
            test: /[\\/]node_modules[\\/](next)[\\/]/,
            priority: 20,
            reuseExistingChunk: true,
          },
          // UI libraries (Radix UI)
          radix: {
            name: 'radix-vendor',
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            priority: 15,
            reuseExistingChunk: true,
          },
          // Icons (Lucide)
          icons: {
            name: 'icons-vendor',
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            priority: 15,
            reuseExistingChunk: true,
          },
          // Form libraries
          forms: {
            name: 'forms-vendor',
            test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
            priority: 15,
            reuseExistingChunk: true,
          },
          // Query libraries
          query: {
            name: 'query-vendor',
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            priority: 15,
            reuseExistingChunk: true,
          },
          // Other vendor libraries
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
            minChunks: 2, // Only bundle if used in 2+ chunks
          },
        },
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

