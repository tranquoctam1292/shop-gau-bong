# 📋 PRE-DEPLOYMENT CHECKLIST - TỔNG RÀ SOÁT TRƯỚC KHI DEPLOY

**Ngày tạo:** 11/12/2025  
**Mục đích:** Đảm bảo website sẵn sàng deploy lên Production

---

## 🔍 PHẦN 1: CODE QUALITY & BUILD

### 1.1. TypeScript & Build Errors
- [ ] **Chạy TypeScript check:** `npm run type-check`
  - ✅ Không có TypeScript errors
  - ✅ Không có type warnings nghiêm trọng
- [ ] **Chạy build test:** `npm run build`
  - ⚠️ **LƯU Ý:** Có một số pages cần Suspense boundaries:
    - `/products` - `useSearchParams()` cần wrap trong Suspense
    - `/search` - `useSearchParams()` cần wrap trong Suspense
    - `/posts` - Cần kiểm tra Suspense
    - `/order-confirmation` - Cần kiểm tra Suspense
  - ✅ Build thành công không có errors (hoặc chỉ có warnings về Suspense)
  - ✅ Không có warnings nghiêm trọng khác
  - ✅ Build output size hợp lý
- [ ] **Chạy lint:** `npm run lint` (nếu có)
  - ✅ Không có linting errors nghiêm trọng

### 1.2. Code Cleanup
- [ ] **Loại bỏ console.log:**
  - ✅ Đã loại bỏ tất cả `console.log` debug code
  - ✅ Chỉ giữ lại `console.error` cho error handling (nếu cần)
- [ ] **Loại bỏ code lỗi thời:**
  - ✅ Không còn GraphQL code (đã migrate sang REST API)
  - ✅ Không còn unused imports
  - ✅ Không còn commented-out code không cần thiết
- [ ] **Code comments:**
  - ✅ Code có comments rõ ràng cho logic phức tạp
  - ✅ Comments bằng tiếng Anh hoặc tiếng Việt

### 1.3. Dependencies
- [ ] **Kiểm tra package.json:**
  - ✅ Tất cả dependencies đã được cài đặt
  - ✅ Không có deprecated packages
  - ✅ Security vulnerabilities đã được fix (`npm audit fix`)
- [ ] **Node version:**
  - ✅ Node.js version >= 18.0.0 (theo `package.json` engines)
  - ✅ npm version >= 9.0.0

---

## 🔐 PHẦN 2: SECURITY & ENVIRONMENT VARIABLES

### 2.1. Environment Variables
- [ ] **Kiểm tra .env files:**
  - ✅ `.env.local` không được commit vào Git (đã có trong `.gitignore`)
  - ✅ `.env.example` có đầy đủ các biến cần thiết (không có giá trị thực)
  - ✅ Tất cả environment variables đã được document

### 2.2. Required Environment Variables (Production)
- [ ] **WordPress/WooCommerce:**
  - ✅ `NEXT_PUBLIC_WORDPRESS_URL` - Production WordPress URL (HTTPS)
  - ✅ `WOOCOMMERCE_CONSUMER_KEY` - Production Consumer Key
  - ✅ `WOOCOMMERCE_CONSUMER_SECRET` - Production Consumer Secret
  - ✅ `WORDPRESS_USERNAME` (optional - nếu dùng App Password)
  - ✅ `WORDPRESS_APP_PASSWORD` (optional - nếu dùng App Password)

- [ ] **Site Configuration:**
  - ✅ `NEXT_PUBLIC_SITE_URL` - Production site URL (HTTPS)

- [ ] **Payment Gateways (LIVE MODE):**
  - ✅ `NEXT_PUBLIC_VIETQR_API_KEY` - **Live API Key** (không phải test key)
  - ✅ `NEXT_PUBLIC_MOMO_PARTNER_CODE` - **Live Partner Code**
  - ✅ `MOMO_SECRET_KEY` - **Live Secret Key** (server-side only)
  - ✅ `NEXT_PUBLIC_ZALOPAY_APP_ID` (nếu sử dụng)
  - ✅ `ZALOPAY_KEY1`, `ZALOPAY_KEY2` (nếu sử dụng)

- [ ] **NextAuth (nếu sử dụng):**
  - ✅ `NEXTAUTH_URL` - Production URL
  - ✅ `NEXTAUTH_SECRET` - Strong secret key

- [ ] **Analytics (optional):**
  - ✅ `NEXT_PUBLIC_GA_ID` - Google Analytics ID

### 2.3. Security Headers
- [ ] **Kiểm tra vercel.json:**
  - ✅ Security headers đã được cấu hình:
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `X-XSS-Protection: 1; mode=block`
    - `Referrer-Policy: strict-origin-when-cross-origin`

### 2.4. API Security
- [ ] **API Routes:**
  - ✅ Tất cả API routes sử dụng server-side credentials (không expose keys)
  - ✅ WooCommerce API calls chỉ qua Next.js API routes (`/api/woocommerce/*`)
  - ✅ Payment webhooks có validation (signature check)

---

## 🌐 PHẦN 3: WORDPRESS BACKEND

### 3.1. WordPress Production Setup
- [ ] **WordPress Installation:**
  - ✅ WordPress version mới nhất (6.0+)
  - ✅ PHP version >= 8.0
  - ✅ MySQL/MariaDB version >= 5.7
  - ✅ SSL certificate đã được cài đặt và hoạt động

### 3.2. WooCommerce Configuration
- [ ] **WooCommerce Settings:**
  - ✅ WooCommerce plugin đã cài đặt và kích hoạt
  - ✅ Store address đã được cấu hình
  - ✅ Currency: VND (₫)
  - ✅ Payment gateways đã được cấu hình (LIVE MODE)
  - ✅ Shipping zones đã được cấu hình
  - ✅ Guest checkout đã được bật

### 3.3. WooCommerce REST API
- [ ] **API Credentials:**
  - ✅ Consumer Key & Secret đã được tạo trong WooCommerce > Settings > Advanced > REST API
  - ✅ Permissions: Read/Write (cần để create orders)
  - ✅ API credentials đã được lưu vào environment variables

### 3.4. WordPress Security
- [ ] **Security Hardening:**
  - ✅ `WP_DEBUG = false` (production)
  - ✅ Security plugin đã được cài đặt (Wordfence, Sucuri, etc.)
  - ✅ Firewall rules đã được cấu hình
  - ✅ CORS settings chỉ cho phép production Next.js domain
  - ✅ Regular backups đã được setup

### 3.5. WordPress Performance
- [ ] **Performance Optimization:**
  - ✅ Caching plugin đã được cài đặt (WP Super Cache, W3 Total Cache)
  - ✅ Database đã được optimize
  - ✅ Gzip compression đã được bật
  - ✅ CDN đã được cấu hình (nếu có)

---

## 🚀 PHẦN 4: NEXT.JS DEPLOYMENT

### 4.1. Build Configuration
- [ ] **next.config.js:**
  - ✅ `reactStrictMode: true`
  - ✅ Image domains đã được cấu hình (WordPress domain)
  - ✅ Image optimization settings đã được tối ưu
  - ✅ `poweredByHeader: false` (security)

### 4.2. Vercel Configuration
- [ ] **vercel.json:**
  - ✅ Build command: `npm run build`
  - ✅ Framework: Next.js
  - ✅ Security headers đã được cấu hình
  - ✅ Regions đã được chọn (ví dụ: `sin1` cho Singapore)

### 4.3. Deployment Platform Setup
- [ ] **Vercel/Netlify:**
  - ✅ Repository đã được connect
  - ✅ Environment variables đã được cấu hình trong dashboard
  - ✅ Custom domain đã được setup (nếu có)
  - ✅ SSL certificate tự động (Vercel/Netlify tự động setup)

### 4.4. Build & Deploy
- [ ] **Pre-deploy:**
  - ✅ Code đã được push lên Git repository
  - ✅ Main/master branch đã sẵn sàng
  - ✅ Environment variables đã được set trong deployment platform
- [ ] **Deploy:**
  - ✅ Build thành công trên deployment platform
  - ✅ Không có build errors
  - ✅ Deployment URL hoạt động

---

## 🧪 PHẦN 5: TESTING

### 5.1. Functional Testing
- [ ] **Homepage:**
  - ✅ Homepage load đúng
  - ✅ Hero carousel hoạt động
  - ✅ Product sections hiển thị đúng
  - ✅ Navigation menu hoạt động

- [ ] **Product Pages:**
  - ✅ Product listing page load đúng
  - ✅ Product filters hoạt động (Price, Size, Color, Material)
  - ✅ Pagination hoạt động
  - ✅ Product detail page hiển thị đầy đủ thông tin
  - ✅ Product variations (size, color) hoạt động
  - ✅ Add to cart hoạt động

- [ ] **Cart & Checkout:**
  - ✅ Cart drawer hoạt động
  - ✅ Cart items hiển thị đúng
  - ✅ Update quantity hoạt động
  - ✅ Remove item hoạt động
  - ✅ Checkout page load đúng
  - ✅ Shipping calculation hoạt động
  - ✅ Payment methods hiển thị đúng

- [ ] **Payment:**
  - ✅ VietQR payment hoạt động (LIVE MODE)
  - ✅ MoMo payment hoạt động (LIVE MODE)
  - ✅ Bank transfer upload hoạt động
  - ✅ Payment webhooks hoạt động
  - ✅ Order confirmation page hiển thị đúng

### 5.2. Mobile Testing
- [ ] **Responsive Design:**
  - ✅ Mobile layout hiển thị đúng (< 768px)
  - ✅ Tablet layout hiển thị đúng (768px - 1024px)
  - ✅ Desktop layout hiển thị đúng (> 1024px)
  - ✅ Touch targets đủ lớn (44x44px minimum)
  - ✅ Horizontal scrolling hoạt động (filter bar)

### 5.3. Performance Testing
- [ ] **Performance Metrics:**
  - ✅ Lighthouse score >= 90 (Performance)
  - ✅ First Contentful Paint (FCP) < 1.8s
  - ✅ Largest Contentful Paint (LCP) < 2.5s
  - ✅ Time to Interactive (TTI) < 3.8s
  - ✅ Cumulative Layout Shift (CLS) < 0.1

### 5.4. Cross-Browser Testing
- [ ] **Browser Compatibility:**
  - ✅ Chrome (latest)
  - ✅ Firefox (latest)
  - ✅ Safari (latest)
  - ✅ Edge (latest)
  - ✅ Mobile browsers (Chrome, Safari)

---

## 📊 PHẦN 6: MONITORING & ANALYTICS

### 6.1. Error Tracking
- [ ] **Sentry (nếu sử dụng):**
  - ✅ Sentry đã được cài đặt và cấu hình
  - ✅ DSN đã được set trong environment variables
  - ✅ Error alerts đã được setup

### 6.2. Analytics
- [ ] **Google Analytics:**
  - ✅ GA4 property đã được tạo
  - ✅ Tracking code đã được thêm vào `app/layout.tsx`
  - ✅ Conversion tracking đã được setup

### 6.3. Uptime Monitoring
- [ ] **Uptime Monitoring:**
  - ✅ UptimeRobot/Pingdom đã được setup
  - ✅ Monitoring URLs đã được thêm
  - ✅ Alerts (email, SMS) đã được cấu hình

### 6.4. Performance Monitoring
- [ ] **Performance Monitoring:**
  - ✅ Vercel Analytics đã được enable (nếu dùng Vercel)
  - ✅ Web Vitals tracking đã được setup

---

## 🔄 PHẦN 7: POST-DEPLOYMENT

### 7.1. Immediate Checks
- [ ] **Sau khi deploy:**
  - ✅ Website load đúng URL production
  - ✅ SSL certificate hoạt động (HTTPS)
  - ✅ Không có console errors trong browser
  - ✅ API calls hoạt động (check Network tab)
  - ✅ Images load đúng

### 7.2. Critical Paths Testing
- [ ] **User Journey:**
  - ✅ Browse products → Add to cart → Checkout → Payment → Order confirmation
  - ✅ Tất cả các bước hoạt động không có lỗi

### 7.3. Monitoring
- [ ] **First 24 hours:**
  - ✅ Monitor error logs
  - ✅ Monitor performance metrics
  - ✅ Monitor payment transactions
  - ✅ Monitor server resources (CPU, Memory)

### 7.4. Rollback Plan
- [ ] **Nếu có vấn đề:**
  - ✅ Biết cách rollback về version trước
  - ✅ Có backup của database
  - ✅ Có backup của code

---

## 📝 PHẦN 8: DOCUMENTATION

### 8.1. Deployment Documentation
- [ ] **Documentation đã được cập nhật:**
  - ✅ `docs/DEPLOYMENT_GUIDE.md` - Hướng dẫn deploy
  - ✅ `docs/DEPLOYMENT_STRATEGY.md` - Chiến lược deploy
  - ✅ Environment variables đã được document
  - ✅ API endpoints đã được document

### 8.2. Runbook
- [ ] **Runbook cho operations:**
  - ✅ Cách deploy mới
  - ✅ Cách rollback
  - ✅ Cách troubleshoot common issues
  - ✅ Contact information cho support

---

## ✅ FINAL CHECKLIST

### Trước khi deploy Production:
- [ ] Tất cả các mục trên đã được check
- [ ] Staging environment đã được test kỹ
- [ ] Payment gateways đã được switch sang LIVE MODE
- [ ] Backup đã được tạo
- [ ] Team đã được thông báo về deployment
- [ ] Monitoring đã được setup

### Sau khi deploy Production:
- [ ] Website hoạt động đúng
- [ ] Không có critical errors
- [ ] Performance metrics đạt yêu cầu
- [ ] Payment transactions hoạt động
- [ ] Monitoring alerts hoạt động

---

## 🚨 CRITICAL WARNINGS

⚠️ **QUAN TRỌNG:**
1. **Payment Keys:** Đảm bảo đã switch sang LIVE MODE keys, không dùng test keys
2. **WordPress URL:** Đảm bảo `NEXT_PUBLIC_WORDPRESS_URL` point đến production WordPress (HTTPS)
3. **SSL:** Đảm bảo SSL certificate hoạt động cho cả WordPress và Next.js
4. **CORS:** Đảm bảo CORS settings chỉ cho phép production domains
5. **Backup:** Luôn có backup trước khi deploy major changes

---

**Last Updated:** 11/12/2025  
**Status:** ✅ Ready for Review

