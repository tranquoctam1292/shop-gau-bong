# 📋 DANH SÁCH CÔNG VIỆC THỦ CÔNG CẦN THỰC HIỆN

## ⚠️ LƯU Ý QUAN TRỌNG

File này liệt kê các công việc cần thực hiện **THỦ CÔNG** cho **DEPLOYMENT** (Hosting & Vercel).

**Chiến lược hiện tại:**
- ✅ **Local Development:** Đang tập trung hoàn thiện trên Local
- ⏳ **Deployment:** Sẽ thực hiện sau khi Local đã hoàn thiện

**Xem Local Development Checklist:** `docs/LOCAL_DEVELOPMENT_CHECKLIST.md`

---

## 📋 PHÂN LOẠI CÔNG VIỆC

### 🏠 Local Development (Đang làm)
- Xem: `docs/LOCAL_DEVELOPMENT_CHECKLIST.md`
- Tập trung hoàn thiện trên Local trước

### 🚀 Deployment (Sẽ làm sau)
- Các công việc dưới đây
- Chỉ thực hiện sau khi Local đã hoàn thiện

---

## 🏗️ PHASE 1: SETUP & PLANNING

### WordPress Local Development (XAMPP)

#### WP-LOCAL-001: Install WordPress trên XAMPP
- [ ] **Download và cài đặt XAMPP** (nếu chưa có)
  - Windows: https://www.apachefriends.org/
  - Mac: MAMP hoặc Local by Flywheel
  - Linux: XAMPP hoặc LAMP stack
- [ ] **Khởi động Apache và MySQL** trong XAMPP Control Panel
- [ ] **Download WordPress** từ wordpress.org (latest version 6.0+)
- [ ] **Giải nén WordPress** vào `C:\xampp\htdocs\wordpress` (hoặc tên folder khác)
- [ ] **Tạo database** trong phpMyAdmin:
  - Truy cập: http://localhost/phpmyadmin
  - Tạo database mới: `shop_gau_bong` (hoặc tên khác)
- [ ] **Chạy WordPress installer:**
  - Truy cập: http://localhost/wordpress
  - Điền thông tin: database name, username, password, host
  - Tạo admin account
- [ ] **Lưu lại thông tin:**
  - Admin username: `[username]`
  - Admin password: `[password]`
  - Database name: `[database_name]`
  - Database user: `[database_user]`
  - Database password: `[database_password]`

#### WP-LOCAL-002: Install Plugins
- [ ] **Install WooCommerce:**
  - Vào WordPress Admin > Plugins > Add New
  - Search "WooCommerce"
  - Install và Activate
  - Chạy WooCommerce Setup Wizard
- [ ] **Install WPGraphQL:**
  - Search "WPGraphQL"
  - Install version 1.14.0+
  - Activate
- [ ] **Install WPGraphQL WooCommerce:**
  - Search "WPGraphQL WooCommerce"
  - Install version 0.12.0+
  - Activate
- [ ] **Install WPGraphQL ACF** (nếu dùng ACF):
  - Search "WPGraphQL ACF"
  - Install và Activate
- [ ] **Install JWT Authentication:**
  - Search "JWT Authentication for WP-API"
  - Install và Activate
  - Configure secret key
- [ ] **Install Advanced Custom Fields (ACF):**
  - Search "Advanced Custom Fields"
  - Install version 6.0+
  - Activate

#### WP-LOCAL-003: Configure WooCommerce
- [ ] **Chạy WooCommerce Setup Wizard:**
  - Store address
  - Currency: VND (₫)
  - Payment methods (Test Mode)
  - Shipping zones
- [ ] **Tạo Product Categories:**
  - Gấu bông nhỏ
  - Gấu bông vừa
  - Gấu bông lớn
  - Gấu bông cao cấp
- [ ] **Thêm Sample Products:**
  - Xem hướng dẫn: `docs/ADD_PRODUCTS_WORDPRESS.md`
  - Đảm bảo có đầy đủ dimensions (length, width, height)

#### WP-LOCAL-004: Setup Custom Fields (ACF)
- [ ] **Tạo Field Group "Product Specs":**
  - Vào Custom Fields > Add New
  - Field Group Name: "Product Specs"
  - Location Rules: Show if Post Type is equal to Product
- [ ] **Thêm các fields:**
  - Length (cm) - Number field
  - Width (cm) - Number field
  - Height (cm) - Number field
  - Volumetric Weight (kg) - Number field (read-only, auto-calculate)
  - Material - Text field
  - Origin - Text field
- [ ] **Publish Field Group**

#### WP-LOCAL-005: Configure Payment & Shipping
- [ ] **Configure Payment Gateways (Test Mode):**
  - WooCommerce > Settings > Payments
  - Enable COD (Cash on Delivery)
  - Enable Bank Transfer (BACS)
  - Configure VietQR (nếu có plugin) - Test Mode
  - Configure MoMo (nếu có plugin) - Test Mode
- [ ] **Setup Shipping Zones:**
  - WooCommerce > Settings > Shipping
  - Add zone: "Vietnam"
  - Add shipping method: Custom Shipping hoặc Flat Rate
- [ ] **Configure Shipping Calculation:**
  - Setup tính phí theo weight
  - Verify volumetric weight calculation

### WordPress Staging Environment

#### WP-STG-001: Mua và Setup Hosting
- [ ] **Chọn Hosting Provider:**
  - Vietnix (recommended cho VN)
  - WP Engine (premium)
  - SiteGround
  - Cloudways
  - Kinsta
- [ ] **Đăng ký và thanh toán** hosting plan
- [ ] **Tạo Staging Environment:**
  - Nếu hosting có staging built-in: Sử dụng tính năng staging
  - Nếu không: Tạo subdomain `staging.yourdomain.com`
- [ ] **Setup SSL Certificate:**
  - Let's Encrypt (free) hoặc Premium SSL
  - Verify HTTPS working
- [ ] **Tạo Database:**
  - Database name: `wp_staging`
  - Database user: `wp_staging_user`
  - Database password: `[strong_password]`
  - **Lưu lại thông tin**

#### WP-STG-002: Install WordPress trên Staging
- [ ] **Download WordPress** (nếu chưa có auto-installer)
- [ ] **Upload WordPress files** lên staging folder
- [ ] **Tạo wp-config.php** với staging database credentials
- [ ] **Chạy WordPress installer** tại `https://staging.yourdomain.com`
- [ ] **Install plugins** (giống như Local):
  - WooCommerce
  - WPGraphQL
  - WPGraphQL WooCommerce
  - WPGraphQL ACF (nếu dùng)
  - JWT Authentication
  - ACF
- [ ] **Configure plugins** (giống như Local)
- [ ] **Migrate data từ Local** (nếu cần):
  - Export từ Local
  - Import vào Staging

#### WP-STG-003: Configure Staging
- [ ] **Configure WooCommerce:**
  - Store settings
  - Payment gateways (Test Mode)
  - Shipping zones
- [ ] **Setup Custom Fields** (ACF)
- [ ] **Configure WPGraphQL:**
  - Enable GraphQL endpoint
  - Setup CORS cho Next.js staging domain
- [ ] **Disable search engine indexing:**
  - Settings > Reading > Discourage search engines
- [ ] **Test GraphQL queries:**
  - Truy cập GraphiQL: `https://staging.yourdomain.com/wp-admin/admin.php?page=graphql-ide`
  - Test queries

### WordPress Production Environment

#### WP-PROD-001: Setup Production
- [ ] **Setup Production Domain:**
  - Point domain đến hosting
  - Configure DNS records
- [ ] **Setup SSL Certificate:**
  - Let's Encrypt (free) hoặc Premium SSL
  - Force HTTPS
- [ ] **Tạo Database:**
  - Database name: `wp_production`
  - Database user: `wp_production_user`
  - Database password: `[strong_password_different_from_staging]`
  - **Lưu lại thông tin**

#### WP-PROD-002: Install WordPress trên Production
- [ ] **Install WordPress** (hoặc clone từ Staging)
- [ ] **Install plugins** (giống như Staging)
- [ ] **Migrate data từ Staging** (nếu cần)

#### WP-PROD-003: Configure Production
- [ ] **Configure WooCommerce:**
  - Store settings
  - **Payment gateways: LIVE MODE** ⚠️
  - Shipping zones
- [ ] **Setup Custom Fields** (ACF)
- [ ] **Configure WPGraphQL:**
  - Enable GraphQL endpoint
  - **Disable GraphiQL** (security)
  - **Setup CORS chỉ cho phép production Next.js domain**
- [ ] **Enable search engine indexing:**
  - Settings > Reading > Allow search engines
- [ ] **Configure Security:**
  - Install Wordfence Security
  - Configure firewall
  - Setup backups (UpdraftPlus)

---

## 🚀 PHASE 5: DEPLOYMENT

### Next.js Deployment

#### DEPLOY-004: Vercel/Netlify Setup
- [ ] **Đăng ký Vercel Account:**
  - Truy cập: https://vercel.com
  - Sign up với GitHub/GitLab/Bitbucket
- [ ] **Import Project:**
  - Add New Project
  - Connect Git repository
  - Import `shop-gau-bong`
- [ ] **Configure Environment Variables (Staging):**
  - NEXT_PUBLIC_WORDPRESS_URL: `https://staging.yourdomain.com`
  - NEXT_PUBLIC_GRAPHQL_ENDPOINT: `https://staging.yourdomain.com/graphql`
  - NEXTAUTH_URL: `https://staging-app.yourdomain.com`
  - NEXTAUTH_SECRET: `[generate_with_openssl_rand_base64_32]`
  - Payment keys: **Test Mode keys**
  - Select Environment: **Staging**
- [ ] **Configure Environment Variables (Production):**
  - NEXT_PUBLIC_WORDPRESS_URL: `https://yourdomain.com`
  - NEXT_PUBLIC_GRAPHQL_ENDPOINT: `https://yourdomain.com/graphql`
  - NEXTAUTH_URL: `https://app.yourdomain.com`
  - NEXTAUTH_SECRET: `[generate_new_secret_for_production]`
  - Payment keys: **LIVE MODE keys** ⚠️
  - Select Environment: **Production**
- [ ] **Deploy Staging:**
  - Create staging branch: `git checkout -b staging`
  - Push to remote: `git push -u origin staging`
  - Vercel sẽ auto-deploy staging branch
  - Test staging deployment
- [ ] **Deploy Production:**
  - Merge staging → main: `git merge staging`
  - Push to main: `git push origin main`
  - Vercel sẽ auto-deploy production
  - Test production deployment
- [ ] **Setup Custom Domain:**
  - Vào Settings > Domains
  - Add domain: `app.yourdomain.com` (hoặc `yourdomain.com`)
  - Configure DNS records (CNAME hoặc A record)
  - Wait for DNS propagation (24-48 hours)
  - SSL sẽ tự động cài đặt

### CDN & Optimization

#### DEPLOY-005: Cloudflare Setup
- [ ] **Đăng ký Cloudflare Account:**
  - Truy cập: https://cloudflare.com
  - Sign up (Free plan đủ dùng)
- [ ] **Add Website:**
  - Add site: `yourdomain.com`
  - Chọn plan: Free
- [ ] **Update Nameservers:**
  - Cloudflare sẽ hiển thị nameservers mới
  - Vào domain registrar
  - Update nameservers thành Cloudflare nameservers
  - Wait for propagation (24-48 hours)
- [ ] **Configure DNS Records:**
  - A record: `yourdomain.com` → WordPress IP
  - CNAME: `www` → `yourdomain.com`
  - CNAME: `app` → Vercel/Netlify (nếu có)
- [ ] **Configure Cloudflare Settings:**
  - SSL/TLS: Full (strict)
  - Always Use HTTPS: ON
  - Auto Minify: JavaScript, CSS, HTML
  - Brotli: ON
  - Caching: Standard

### Monitoring & Analytics

#### DEPLOY-006: Sentry Setup
- [ ] **Đăng ký Sentry Account:**
  - Truy cập: https://sentry.io
  - Sign up (Free plan: 5,000 events/month)
- [ ] **Create Project:**
  - Platform: Next.js
  - Project Name: shop-gau-bong
- [ ] **Install Sentry SDK:**
  - Run: `npx @sentry/wizard@latest -i nextjs`
  - Wizard sẽ tự động configure
- [ ] **Get DSN:**
  - Copy DSN từ Sentry dashboard
- [ ] **Add Environment Variables:**
  - SENTRY_DSN: `[your_sentry_dsn]`
  - SENTRY_ENVIRONMENT: `staging` / `production`
  - SENTRY_AUTH_TOKEN: `[your_auth_token]`
- [ ] **Test Error Tracking:**
  - Trigger test error
  - Verify error appears in Sentry dashboard

#### DEPLOY-006: Google Analytics Setup
- [ ] **Tạo Google Analytics Account:**
  - Truy cập: https://analytics.google.com
  - Create account: "Shop Gấu Bông"
  - Create property: "Shop Gấu Bông Website"
- [ ] **Get Measurement ID:**
  - Copy Measurement ID: `G-XXXXXXXXXX`
- [ ] **Add Environment Variable:**
  - NEXT_PUBLIC_GA_ID: `G-XXXXXXXXXX`
- [ ] **Verify Tracking:**
  - Visit website
  - Check Google Analytics Real-time reports

#### DEPLOY-006: Uptime Monitoring
- [ ] **Đăng ký UptimeRobot:**
  - Truy cập: https://uptimerobot.com
  - Sign up (Free: 50 monitors)
- [ ] **Create Monitors:**
  - Monitor 1: WordPress Production (`https://yourdomain.com`)
  - Monitor 2: WordPress Staging (`https://staging.yourdomain.com`)
  - Monitor 3: Next.js Production (`https://app.yourdomain.com`)
  - Monitor 4: GraphQL Endpoint (`https://yourdomain.com/graphql`)
- [ ] **Configure Alerts:**
  - Add email/SMS contacts
  - Set alert thresholds

---

## 🧪 PHASE 5: TESTING

### Final Testing

#### FINAL-001: Comprehensive Testing
- [ ] **Test User Flows:**
  - Browse products
  - Add to cart
  - Checkout
  - Place order
  - View orders
  - Manage account
- [ ] **Test Payment Gateways:**
  - VietQR (test với số tiền nhỏ)
  - MoMo (test với số tiền nhỏ)
  - COD
  - Bank Transfer
- [ ] **Test Shipping Calculation:**
  - Products với dimensions
  - Products không có dimensions
  - Different provinces
  - Different weights
- [ ] **Test Error Handling:**
  - Network errors
  - Invalid data
  - Form validation

#### FINAL-002: Cross-Browser Testing
- [ ] **Test trên Chrome** (desktop & mobile)
- [ ] **Test trên Firefox** (desktop & mobile)
- [ ] **Test trên Safari** (desktop & iOS)
- [ ] **Test trên Edge** (desktop & mobile)
- [ ] **Document any issues** found

#### FINAL-003: Performance Testing
- [ ] **Run Lighthouse Audit:**
  - Homepage
  - Products page
  - Product detail page
  - Checkout page
- [ ] **Check Core Web Vitals:**
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- [ ] **Document results** và fix issues nếu cần

---

## 🚀 PHASE 5: GO LIVE

### Pre-Launch Checklist

#### LIVE-001: Final Checklist
- [ ] **All features tested** trên Staging
- [ ] **All payments tested** (với Test Mode)
- [ ] **All shipping calculations verified**
- [ ] **All error handling verified**
- [ ] **Performance optimized** (Lighthouse score > 90)
- [ ] **Security configured** (SSL, CORS, backups)
- [ ] **Monitoring setup** (Sentry, Analytics, Uptime)

#### LIVE-002: Launch
- [ ] **Switch Payment Gateways to LIVE MODE** ⚠️
  - VietQR: Update API key
  - MoMo: Update Partner Code & Secret Key
  - Verify với số tiền nhỏ trước
- [ ] **Final Production Deployment:**
  - Merge staging → main
  - Deploy production
  - Verify deployment successful
- [ ] **Switch DNS to Production** (nếu chưa)
- [ ] **Verify SSL certificates** active
- [ ] **Test production website** end-to-end
- [ ] **Announce launch** (social media, email, etc.)

#### LIVE-003: Post-Launch
- [ ] **Monitor error logs** (Sentry)
- [ ] **Monitor performance** (Google Analytics, Lighthouse)
- [ ] **Monitor uptime** (UptimeRobot)
- [ ] **Collect user feedback**
- [ ] **Fix critical issues** nếu có
- [ ] **Document lessons learned**

---

## 📝 NOTES

### Payment Gateway Credentials

**⚠️ QUAN TRỌNG:** Lưu tất cả credentials vào password manager

**Staging (Test Mode):**
- VietQR Test API Key: `[test_key]`
- MoMo Test Partner Code: `[test_code]`
- MoMo Test Secret Key: `[test_secret]`

**Production (LIVE MODE):**
- VietQR Live API Key: `[live_key]` ⚠️
- MoMo Live Partner Code: `[live_code]` ⚠️
- MoMo Live Secret Key: `[live_secret]` ⚠️

### Database Credentials

**Staging:**
- Database: `wp_staging`
- User: `wp_staging_user`
- Password: `[password]`
- Host: `localhost`

**Production:**
- Database: `wp_production`
- User: `wp_production_user`
- Password: `[password]`
- Host: `localhost`

### Domain & URLs

**Staging:**
- WordPress: `https://staging.yourdomain.com`
- Next.js: `https://staging-app.yourdomain.com`

**Production:**
- WordPress: `https://yourdomain.com`
- Next.js: `https://app.yourdomain.com`

### Environment Variables

**Generate Secrets:**
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# JWT Secret (WordPress)
# Generate trong WordPress Admin > Settings > JWT Auth
```

---

## ✅ Completion Status

- [ ] Phase 1: WordPress Local Setup
- [ ] Phase 1: WordPress Staging Setup
- [ ] Phase 1: WordPress Production Setup
- [ ] Phase 5: Next.js Deployment
- [ ] Phase 5: CDN Setup
- [ ] Phase 5: Monitoring Setup
- [ ] Phase 5: Final Testing
- [ ] Phase 5: Go Live

**Estimated Time:** 2-3 weeks (tùy vào hosting provider và complexity)

---

## 🆘 Support & Resources

**Documentation:**
- WordPress Hosting Setup: `docs/DEPLOY_001_WORDPRESS_HOSTING_SETUP.md`
- WordPress Staging: `docs/DEPLOY_002_WORDPRESS_STAGING.md`
- WordPress Production: `docs/DEPLOY_003_WORDPRESS_PRODUCTION.md`
- Next.js Deployment: `docs/DEPLOY_004_NEXTJS_DEPLOYMENT.md`
- CDN Setup: `docs/DEPLOY_005_CDN_IMAGE_OPTIMIZATION.md`
- Monitoring: `docs/DEPLOY_006_MONITORING_ANALYTICS.md`

**Hosting Support:**
- Vietnix: https://vietnix.vn/support
- WP Engine: https://wpengine.com/support
- Vercel: https://vercel.com/support

**Payment Gateway Support:**
- VietQR: https://vietqr.net/support
- MoMo: https://developers.momo.vn/

