# 🔗 CSP External Services Whitelist Guide

**Ngày tạo:** 2025-12-13  
**Mục đích:** Document các external services cần whitelist trong CSP khi implement

---

## 📋 Tổng Quan

CSP (Content Security Policy) chỉ cần whitelist các external services được load từ **client-side** (browser). Các services được gọi từ **server-side** (API routes) không cần whitelist trong CSP.

---

## 🔍 External Services trong Project

### 1. Payment Gateways (Server-side Only)

Các payment gateways được gọi từ API routes (server-side), **KHÔNG cần** whitelist trong CSP:

- **MoMo Payment:**
  - Production: `https://payment.momo.vn`
  - Sandbox: `https://test-payment.momo.vn`
  - **Status:** Server-side only ✅

- **VietQR:**
  - API: `https://img.vietqr.io`
  - **Status:** Server-side only ✅

- **Bank Transfer:**
  - **Status:** No external domains ✅

### 2. Shipping Services (Server-side Only)

- **GHTK (Giao Hàng Tiết Kiệm):**
  - API: `https://services.giaohangtietkiem.vn`
  - **Status:** Server-side only ✅

- **GHN (Giao Hàng Nhanh):**
  - API: `https://online-gateway.ghn.vn`
  - **Status:** Server-side only ✅

### 3. Future External Services (Cần Whitelist)

Khi implement các services sau, cần update CSP trong `middleware.ts`:

#### Google Analytics (Nếu implement)
```typescript
script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.google-analytics.com https://www.googletagmanager.com;
img-src 'self' blob: data: https: https://www.google-analytics.com;
connect-src 'self' https://www.google-analytics.com;
```

#### Sentry (Error Tracking - Nếu implement)
```typescript
script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.sentry.io;
connect-src 'self' https://*.sentry.io;
```

#### CDN / Image Hosting (Nếu dùng)
```typescript
img-src 'self' blob: data: https: https://cdn.yourdomain.com https://images.cloudinary.com;
font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com;
```

#### Payment Gateway Redirects (Nếu redirect đến external page)
```typescript
// Nếu MoMo redirect đến external payment page
frame-src 'self' https://payment.momo.vn;
form-action 'self' https://payment.momo.vn;
```

---

## ⚠️ Lưu Ý về Browser Extensions

**Kaspersky và các browser extensions** có thể tự động inject scripts và modify CSP. Điều này là **bình thường** và không cần xử lý trong code.

CSP header có thể hiển thị:
```
script-src ... http://gc.kis.v2.scr.kaspersky-labs.com ...
```

Đây là do browser extension tự động thêm, không phải từ code của chúng ta.

---

## 📝 Cách Thêm External Service vào CSP

### Bước 1: Xác định Resource Type

- **Scripts:** Thêm vào `script-src`
- **Styles:** Thêm vào `style-src`
- **Images:** Thêm vào `img-src`
- **Fonts:** Thêm vào `font-src`
- **Frames/iframes:** Thêm vào `frame-src`
- **API calls:** Thêm vào `connect-src`
- **Forms:** Thêm vào `form-action`

### Bước 2: Update middleware.ts

```typescript
const cspHeader = `
  default-src 'self';
  script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://external-domain.com;
  img-src 'self' blob: data: https: https://external-domain.com;
  // ... other directives
`;
```

### Bước 3: Test

1. Restart dev server
2. Check Console for CSP violations
3. Verify service hoạt động bình thường

---

## ✅ Current Status

**Hiện tại:** Không cần whitelist external services vì:
- ✅ Payment gateways: Server-side only
- ✅ Shipping services: Server-side only
- ✅ No Google Analytics: Chưa implement
- ✅ No Sentry: Chưa implement
- ✅ No CDN: Chưa setup

**CSP hiện tại:** Hoạt động tốt với `'self'` và `https:` wildcard cho images.

---

**Last Updated:** 2025-12-13  
**Status:** ✅ No external services need whitelisting currently
