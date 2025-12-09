# DEPLOYMENT STRATEGY - Hosting Chuyên Nghiệp

## 🏗️ Kiến Trúc Deployment

```
┌─────────────────────────────────────────────────────────┐
│              LOCAL DEVELOPMENT (XAMPP)                  │
│                                                           │
│  ┌──────────────────┐                                   │
│  │  LOCAL ENV       │                                   │
│  │                  │                                   │
│  │  WordPress       │                                   │
│  │  + WooCommerce   │                                   │
│  │  + WPGraphQL     │                                   │
│  │                  │                                   │
│  │  localhost/      │                                   │
│  │  wordpress       │                                   │
│  └──────────────────┘                                   │
│           │                                              │
└───────────┼──────────────────────────────────────────────┘
            │
            │ (Development)
            │
┌───────────▼──────────┐
│  NEXT.JS LOCAL       │
│  (localhost:3000)   │
└──────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    HOSTING PROVIDER                      │
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │  STAGING ENV     │      │  PRODUCTION ENV  │         │
│  │                  │      │                  │         │
│  │  WordPress       │      │  WordPress       │         │
│  │  + WooCommerce   │      │  + WooCommerce   │         │
│  │  + WPGraphQL     │      │  + WPGraphQL     │         │
│  │                  │      │                  │         │
│  │  staging.domain  │      │  domain.com      │         │
│  └──────────────────┘      └──────────────────┘         │
│           │                          │                    │
└───────────┼──────────────────────────┼────────────────────┘
            │                          │
            │                          │
┌───────────▼──────────┐    ┌──────────▼──────────┐
│  NEXT.JS STAGING     │    │  NEXT.JS PRODUCTION │
│  (Vercel/Netlify)    │    │  (Vercel/Netlify)   │
│                      │    │                     │
│  staging-app.domain  │    │  app.domain.com     │
└──────────────────────┘    └─────────────────────┘
```

## 📋 Workflow Development

### 1. Development Phase
```
Developer Local Machine
    ↓
Next.js (localhost:3000)
    ↓ (GraphQL API calls)
WordPress Local XAMPP (localhost/wordpress)
```

**Environment Variables:**
- `.env.local` → Point to Local XAMPP WordPress (`http://localhost/wordpress`)

### 2. Staging Phase
```
Next.js Staging (Vercel/Netlify)
    ↓ (GraphQL API calls)
WordPress Staging (staging.domain.com)
```

**Environment Variables:**
- `.env.staging` → Point to Staging WordPress
- Payment gateways: **Test Mode**

### 3. Production Phase
```
Next.js Production (Vercel/Netlify)
    ↓ (GraphQL API calls)
WordPress Production (domain.com)
```

**Environment Variables:**
- `.env.production` → Point to Production WordPress
- Payment gateways: **Live Mode**

## 🔄 Deployment Process

### Step 1: Setup WordPress Local (XAMPP)

1. **Cài đặt XAMPP:**
   - Download và cài đặt XAMPP
   - Start Apache và MySQL
   - Verify: `http://localhost` hoạt động

2. **Cài đặt WordPress:**
   - Download WordPress từ wordpress.org
   - Copy vào `C:\xampp\htdocs\wordpress` (hoặc tên folder khác)
   - Tạo database trong phpMyAdmin
   - Chạy WordPress installer tại `http://localhost/wordpress`

3. **Cấu hình WordPress:**
   - Install plugins (WooCommerce, WPGraphQL, etc.)
   - Configure WooCommerce
   - Setup Custom Fields
   - Enable GraphQL endpoint
   - Setup CORS cho `http://localhost:3000`

### Step 2: Setup WordPress Hosting (Staging & Production)

1. **Chọn Hosting Provider:**
   - WP Engine (recommended - có staging built-in)
   - SiteGround
   - Cloudways
   - Kinsta
   - Vietnix / P.A Vietnam (cho thị trường VN)

2. **Tạo Staging Environment:**
   - Nếu hosting có staging: Sử dụng tính năng staging
   - Nếu không: Tạo subdomain `staging.yourdomain.com`
   - Setup SSL cho staging
   - Migrate data từ Local (nếu cần)

3. **Tạo Production Environment:**
   - Setup production domain `yourdomain.com`
   - Setup SSL certificate
   - Configure database riêng
   - Migrate data từ Staging

### Step 3: Install WordPress trên Staging

1. Cài đặt WordPress 6.0+
2. Install plugins:
   - WooCommerce
   - WPGraphQL
   - WPGraphQL WooCommerce
   - WPGraphQL ACF (nếu dùng)
   - JWT Authentication
   - ACF

3. Configure:
   - WooCommerce settings
   - Custom Fields (length, width, height, volumetric_weight)
   - Payment gateways (Test Mode)
   - Shipping zones
   - GraphQL endpoint

4. Test GraphQL queries

### Step 4: Install WordPress trên Production

1. Cài đặt WordPress 6.0+ (hoặc clone từ Staging)
2. Install cùng plugins như Staging
3. Configure:
   - WooCommerce settings
   - Custom Fields
   - Payment gateways (Live Mode) ⚠️
   - Shipping zones
   - GraphQL endpoint

4. Setup CORS chỉ cho phép production Next.js domain

### Step 5: Deploy Next.js

#### Staging Deployment:
1. Push code lên Git repository
2. Connect Vercel/Netlify với Git repo
3. Configure environment variables:
   - `NEXT_PUBLIC_WORDPRESS_URL` → Staging WordPress URL
   - `NEXT_PUBLIC_GRAPHQL_ENDPOINT` → Staging GraphQL endpoint
   - Payment keys → Test mode keys
4. Deploy staging branch
5. Test integration

#### Production Deployment:
1. Merge staging → main/master branch
2. Configure environment variables:
   - `NEXT_PUBLIC_WORDPRESS_URL` → Production WordPress URL
   - `NEXT_PUBLIC_GRAPHQL_ENDPOINT` → Production GraphQL endpoint
   - Payment keys → **Live mode keys** ⚠️
3. Deploy production
4. Setup custom domain
5. Final testing

## 🔐 Security Best Practices

### WordPress Staging:
- [ ] Disable search engine indexing
- [ ] Password protection (optional)
- [ ] CORS chỉ cho phép Next.js staging domain
- [ ] SSL certificate
- [ ] Security plugin (Wordfence, Sucuri)

### WordPress Production:
- [ ] Enable search engine indexing
- [ ] CORS chỉ cho phép Next.js production domain
- [ ] SSL certificate (bắt buộc)
- [ ] Security plugin với firewall
- [ ] Regular security scans
- [ ] Backup tự động

### Next.js:
- [ ] Environment variables không commit vào Git
- [ ] Use `.env.local`, `.env.staging`, `.env.production`
- [ ] Secure API keys
- [ ] Rate limiting (nếu cần)

## 📊 Environment Variables Matrix

| Variable | Local Dev | Staging | Production |
|----------|-----------|---------|------------|
| `NEXT_PUBLIC_WORDPRESS_URL` | `localhost/wordpress` | `staging.domain` | `domain.com` |
| `NEXT_PUBLIC_GRAPHQL_ENDPOINT` | `localhost/wordpress/graphql` | `staging.domain/graphql` | `domain.com/graphql` |
| `NEXT_PUBLIC_VIETQR_API_KEY` | Test Key | Test Key | **Live Key** ⚠️ |
| `NEXT_PUBLIC_MOMO_PARTNER_CODE` | Test Code | Test Code | **Live Code** ⚠️ |
| `MOMO_SECRET_KEY` | Test Secret | Test Secret | **Live Secret** ⚠️ |

## 🚀 Deployment Checklist

### Pre-Deployment:
- [ ] All features tested trên Staging
- [ ] GraphQL queries working
- [ ] Payment gateways tested (test mode)
- [ ] Shipping calculation tested
- [ ] Mobile responsive verified
- [ ] Performance optimized

### Staging Deployment:
- [ ] WordPress Staging configured
- [ ] Next.js Staging deployed
- [ ] Environment variables configured
- [ ] Integration tested
- [ ] Payment test mode verified

### Production Deployment:
- [ ] WordPress Production configured
- [ ] Payment gateways switched to **Live Mode** ⚠️
- [ ] Next.js Production deployed
- [ ] Custom domain configured
- [ ] SSL certificates verified
- [ ] CORS configured correctly
- [ ] Final end-to-end testing
- [ ] Monitoring setup (Sentry, Analytics)

## 🔄 Update Workflow

1. **Develop trên Local:**
   - Code changes
   - Test với Staging WordPress
   - Commit & push

2. **Deploy to Staging:**
   - Auto-deploy từ staging branch
   - Test trên Staging
   - Verify với client/stakeholder

3. **Deploy to Production:**
   - Merge staging → main
   - Auto-deploy production
   - Monitor for issues
   - Rollback nếu cần

## 📝 Notes

- **Luôn test trên Staging trước khi deploy Production**
- **Payment keys: Cẩn thận khi switch sang Live Mode**
- **Backup trước khi deploy major changes**
- **Monitor logs sau khi deploy**

