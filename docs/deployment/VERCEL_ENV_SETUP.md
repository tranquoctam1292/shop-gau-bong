# 🔧 Cấu hình Environment Variables trên Vercel

## 🚨 Lỗi 500 Internal Server Error

Lỗi 500 thường xảy ra khi **Environment Variables chưa được cấu hình** trên Vercel.

---

## ✅ Các bước cấu hình

### 1. Vào Vercel Dashboard

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** > **Environment Variables**

### 2. Thêm các Environment Variables

Thêm **TẤT CẢ** các biến sau:

#### **Required Variables:**

```env
# WordPress URL (Production)
NEXT_PUBLIC_WORDPRESS_URL=https://www.teddyland.vn

# WooCommerce REST API Credentials
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### **Optional Variables:**

```env
# Site URL (cho metadata, sitemap)
NEXT_PUBLIC_SITE_URL=https://www.teddyland.vn

# Alternative: WordPress Application Password (nếu không dùng WooCommerce API keys)
WORDPRESS_USERNAME=admin
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

### 3. Chọn Environment

Khi thêm từng biến, chọn environment:
- ✅ **Production** (bắt buộc)
- ✅ **Preview** (khuyến nghị)
- ✅ **Development** (tùy chọn)

### 4. Redeploy

Sau khi thêm tất cả biến:
1. Vào tab **Deployments**
2. Click **⋮** (3 chấm) trên deployment mới nhất
3. Chọn **Redeploy**
4. Hoặc push code mới lên GitHub để trigger auto-deploy

---

## 🔍 Kiểm tra Environment Variables

### Cách 1: Vercel Dashboard
1. Vào **Settings** > **Environment Variables**
2. Xác nhận tất cả biến đã được thêm

### Cách 2: Vercel CLI
```bash
vercel env ls
```

### Cách 3: Test API Route
Tạo file test: `app/api/test-env/route.ts`

```typescript
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = {
    hasWordPressUrl: !!process.env.NEXT_PUBLIC_WORDPRESS_URL,
    hasConsumerKey: !!process.env.WOOCOMMERCE_CONSUMER_KEY,
    hasConsumerSecret: !!process.env.WOOCOMMERCE_CONSUMER_SECRET,
    wordPressUrl: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'NOT SET',
    // Không expose credentials trong response
  };
  
  return NextResponse.json(env);
}
```

Truy cập: `https://your-domain.vercel.app/api/test-env`

---

## ⚠️ Lưu ý quan trọng

### 1. **NEXT_PUBLIC_ prefix**
- Biến có prefix `NEXT_PUBLIC_` sẽ được expose ra client
- Chỉ dùng cho **public data** (như WordPress URL)
- **KHÔNG** dùng cho credentials (Consumer Key/Secret)

### 2. **WooCommerce API Credentials**
- **KHÔNG** thêm prefix `NEXT_PUBLIC_` cho `WOOCOMMERCE_CONSUMER_KEY` và `WOOCOMMERCE_CONSUMER_SECRET`
- Chỉ sử dụng trong **server-side** (API routes)
- Nếu expose ra client → **SECURITY RISK**

### 3. **WordPress URL**
- Phải là **full URL** với protocol (`https://`)
- Không có trailing slash (`/`)
- Ví dụ: `https://www.teddyland.vn` ✅
- Ví dụ: `https://www.teddyland.vn/` ❌

### 4. **CORS Issues**
Nếu WordPress hosting chặn requests từ Vercel:
- Cần cấu hình CORS trong WordPress
- Hoặc sử dụng WordPress plugin để allow Vercel domain

---

## 🐛 Troubleshooting

### Lỗi: "WooCommerce REST API credentials are not configured"

**Nguyên nhân:** `WOOCOMMERCE_CONSUMER_KEY` hoặc `WOOCOMMERCE_CONSUMER_SECRET` chưa được set.

**Giải pháp:**
1. Kiểm tra Vercel Environment Variables
2. Đảm bảo không có typo trong tên biến
3. Redeploy sau khi thêm biến

### Lỗi: "Failed to fetch products" (500)

**Nguyên nhân:** 
- WordPress URL không đúng
- WooCommerce API credentials không đúng
- WordPress không accessible từ Vercel

**Giải pháp:**
1. Test WordPress API trực tiếp:
   ```
   https://www.teddyland.vn/wp-json/wc/v3/products
   ```
2. Kiểm tra WooCommerce REST API đã được enable trong WordPress
3. Verify Consumer Key/Secret trong WordPress admin

### Lỗi: "Network Error" hoặc "CORS Error"

**Nguyên nhân:** WordPress hosting chặn requests từ Vercel.

**Giải pháp:**
1. Cấu hình CORS trong WordPress
2. Hoặc sử dụng WordPress plugin (ví dụ: "CORS Headers")
3. Allow Vercel domain trong WordPress security settings

---

## 📝 Checklist

Trước khi deploy, đảm bảo:

- [ ] `NEXT_PUBLIC_WORDPRESS_URL` đã được set (production URL)
- [ ] `WOOCOMMERCE_CONSUMER_KEY` đã được set
- [ ] `WOOCOMMERCE_CONSUMER_SECRET` đã được set
- [ ] Tất cả biến đã được set cho **Production** environment
- [ ] Đã redeploy sau khi thêm biến
- [ ] WordPress URL accessible từ browser
- [ ] WooCommerce REST API đã được enable trong WordPress

---

**Status:** ✅ Hướng dẫn đầy đủ để fix lỗi 500





