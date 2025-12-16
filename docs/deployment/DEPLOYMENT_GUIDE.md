# 🚀 Deployment Guide

Hướng dẫn chi tiết deploy website lên production.

---

## 📋 Mục lục

1. [WordPress Hosting Setup](#1-wordpress-hosting-setup)
2. [WordPress Staging Configuration](#2-wordpress-staging-configuration)
3. [WordPress Production Configuration](#3-wordpress-production-configuration)
4. [Next.js Deployment](#4-nextjs-deployment)
5. [CDN & Image Optimization](#5-cdn--image-optimization)
6. [Monitoring & Analytics](#6-monitoring--analytics)

---

## 1. WordPress Hosting Setup

### Chọn Hosting Provider
- **Recommended:** SiteGround, WP Engine, Kinsta
- **Requirements:**
  - PHP 8.0+
  - MySQL 5.7+ hoặc MariaDB 10.3+
  - SSL certificate
  - SSH access (optional nhưng recommended)

### Setup Staging & Production Environments
- Tạo 2 environments riêng biệt
- Staging: `staging.yourdomain.com`
- Production: `www.yourdomain.com`

### Database Setup
- Tạo separate databases cho staging và production
- Backup database trước khi migrate

### SSL Certificate
- Enable SSL cho cả staging và production
- Use Let's Encrypt (free) hoặc paid SSL

**Chi tiết:** Xem `DEPLOY_001_WORDPRESS_HOSTING_SETUP.md` (đã hợp nhất)

---

## 2. WordPress Staging Configuration

### Install WordPress
1. Download latest WordPress
2. Upload via FTP hoặc hosting control panel
3. Run WordPress installation wizard

### Install Required Plugins
- WooCommerce
- WooCommerce REST API (built-in)
- Custom plugin: `shop-gaubong-custom.php`

### Configure WPGraphQL (Optional - for blog)
- Install WPGraphQL plugin
- Configure CORS settings
- Test GraphQL endpoint

### Configure WooCommerce
- Setup products, categories
- Configure shipping zones
- Setup payment gateways (test mode)
- Enable guest checkout

### Environment Variables
- Set `WP_DEBUG = true` (staging only)
- Configure database credentials
- Setup API keys

**Chi tiết:** Xem `DEPLOY_002_WORDPRESS_STAGING.md` (đã hợp nhất)

---

## 3. WordPress Production Configuration

### Security Hardening
- Disable `WP_DEBUG` (set to `false`)
- Remove debug plugins
- Enable security plugins (Wordfence, etc.)
- Setup firewall rules

### Performance Optimization
- Enable caching (WP Super Cache, W3 Total Cache)
- Optimize database
- Enable Gzip compression
- Setup CDN (Cloudflare)

### Payment Gateways
- Switch từ test mode sang live mode
- Configure live API keys:
  - MoMo
  - VietQR
  - Bank Transfer

### Backup Strategy
- Setup automatic backups (daily)
- Test restore process
- Store backups off-site

**Chi tiết:** Xem `DEPLOY_003_WORDPRESS_PRODUCTION.md` (đã hợp nhất)

---

## 4. Next.js Deployment

### Choose Platform
- **Recommended:** Vercel (easiest), Netlify, AWS Amplify
- **Alternative:** Self-hosted (VPS, Docker)

### Vercel Deployment

#### Setup
1. Connect GitHub repository
2. Configure build settings:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Environment Variables
Set trong Vercel dashboard:
```
NEXT_PUBLIC_WORDPRESS_URL=https://yourdomain.com
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

#### Custom Domain
1. Add domain trong Vercel dashboard
2. Configure DNS records
3. SSL tự động được setup

#### Deployment
- Automatic: Push to main branch triggers deploy
- Manual: Deploy từ Vercel dashboard

**Chi tiết:** Xem `DEPLOY_004_NEXTJS_DEPLOYMENT.md` (đã hợp nhất)

---

## 5. CDN & Image Optimization

### Cloudflare Setup
1. Add site to Cloudflare
2. Update nameservers
3. Enable:
   - Auto Minify
   - Brotli compression
   - Image optimization
   - Caching

### Next.js Image Optimization
- Sử dụng Next.js `Image` component
- Configure `next.config.js`:
```js
images: {
  domains: ['yourdomain.com'],
  formats: ['image/avif', 'image/webp'],
}
```

### Image CDN
- Upload images to Cloudflare Images hoặc Cloudinary
- Use optimized image URLs

**Chi tiết:** Xem `DEPLOY_005_CDN_IMAGE_OPTIMIZATION.md` (đã hợp nhất)

---

## 6. Monitoring & Analytics

### Error Tracking
- **Sentry:**
  1. Create Sentry account
  2. Install `@sentry/nextjs`
  3. Configure DSN trong environment variables
  4. Setup alerts

### Analytics
- **Google Analytics:**
  1. Create GA4 property
  2. Add tracking code to `app/layout.tsx`
  3. Setup conversion tracking

### Uptime Monitoring
- **UptimeRobot** hoặc **Pingdom:**
  1. Add monitoring URLs
  2. Setup alerts (email, SMS)
  3. Monitor response times

### Performance Monitoring
- **Vercel Analytics:** Built-in với Vercel
- **Lighthouse CI:** Automated performance testing
- **Web Vitals:** Monitor Core Web Vitals

**Chi tiết:** Xem `DEPLOY_006_MONITORING_ANALYTICS.md` (đã hợp nhất)

---

## 📝 Pre-Deployment Checklist

- [ ] WordPress staging configured và tested
- [ ] All products, categories added
- [ ] Payment gateways configured (test mode)
- [ ] WooCommerce REST API keys generated
- [ ] Next.js build successful (`npm run build`)
- [ ] Environment variables configured
- [ ] SSL certificates active
- [ ] Domain DNS configured
- [ ] CDN configured
- [ ] Monitoring setup
- [ ] Backup strategy in place

---

## 🚨 Post-Deployment Checklist

- [ ] Test homepage loads correctly
- [ ] Test product listing page
- [ ] Test product detail page
- [ ] Test add to cart
- [ ] Test checkout flow
- [ ] Test payment gateways (live mode)
- [ ] Test order confirmation
- [ ] Test invoice download
- [ ] Verify SSL certificate
- [ ] Check error logs
- [ ] Monitor performance metrics

---

## Deployment Strategy

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              LOCAL DEVELOPMENT (XAMPP)                  │
│  ┌──────────────────┐                                   │
│  │  LOCAL ENV       │                                   │
│  │  WordPress       │                                   │
│  │  + WooCommerce   │                                   │
│  │  localhost/      │                                   │
│  │  wordpress       │                                   │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
            │
┌───────────▼──────────┐
│  NEXT.JS LOCAL        │
│  (localhost:3000)    │
└──────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    HOSTING PROVIDER                     │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │  STAGING ENV     │      │  PRODUCTION ENV  │       │
│  │  WordPress       │      │  WordPress       │       │
│  │  + WooCommerce   │      │  + WooCommerce   │       │
│  │  staging.domain  │      │  domain.com      │       │
│  └──────────────────┘      └──────────────────┘       │
└─────────────────────────────────────────────────────────┘
            │                          │
┌───────────▼──────────┐    ┌──────────▼──────────┐
│  NEXT.JS STAGING      │    │  NEXT.JS PRODUCTION │
│  (Vercel/Netlify)     │    │  (Vercel/Netlify)   │
│  staging-app.domain   │    │  app.domain.com     │
└──────────────────────┘    └─────────────────────┘
```

### Environment Strategy

1. **Local Development:**
   - WordPress trên XAMPP
   - Next.js trên localhost:3000
   - Development database

2. **Staging:**
   - WordPress staging environment
   - Next.js staging deployment (Vercel preview)
   - Staging database

3. **Production:**
   - WordPress production environment
   - Next.js production deployment (Vercel)
   - Production database

---

## Deployment Summary

### Pre-Deployment Checklist

#### Code Quality
- ✅ **TypeScript:** Không có TypeScript errors (`npm run type-check` pass)
- ✅ **Code Cleanup:** Đã loại bỏ tất cả `console.log` debug code
- ✅ **Dependencies:** Tất cả dependencies đã được cài đặt, không có deprecated packages

#### Security
- ✅ **Environment Variables:** `.env.local` đã được ignore trong `.gitignore`
- ✅ **Security Headers:** Đã được cấu hình trong `vercel.json`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ **API Security:** Tất cả WooCommerce API calls chỉ qua Next.js API routes

#### Configuration Files
- ✅ **next.config.js:** Đã được cấu hình đúng:
  - `reactStrictMode: true`
  - Image optimization settings
  - `poweredByHeader: false`
- ✅ **vercel.json:** Đã được cấu hình với security headers và build commands
- ✅ **package.json:** Node version requirements đã được set (>= 18.0.0)

### Build Warnings

**Suspense Boundaries:**
- Một số pages cần wrap `useSearchParams()` trong Suspense boundary
- Xem `PRE_DEPLOYMENT_CHECKLIST.md` cho chi tiết

### Post-Deployment

1. **Verify:**
   - Test tất cả API routes
   - Test checkout flow
   - Test payment methods
   - Test mobile responsiveness

2. **Monitor:**
   - Vercel logs
   - Error tracking
   - Performance metrics

---

**Last Updated:** 2025-01-XX  
**Status:** Consolidated from DEPLOYMENT_STRATEGY.md and DEPLOYMENT_SUMMARY.md  
**Status:** Consolidated from DEPLOY_001-006 files

