# 🔒 Content Security Policy (CSP) Implementation

**Ngày implement:** 2025-12-13  
**File:** `middleware.ts`  
**Status:** ✅ Implemented - Cần test trong browser

---

## 📋 Tổng Quan

Content Security Policy (CSP) là một lớp bảo vệ quan trọng chống lại XSS (Cross-Site Scripting) attacks. CSP hoạt động bằng cách chỉ định các nguồn được phép load resources (scripts, styles, images, etc.).

---

## 🔧 Implementation

### Middleware Location
- **File:** `middleware.ts` (root directory)
- **Framework:** Next.js Middleware
- **Size:** 25.9 kB (compiled)

### CSP Directives

```typescript
default-src 'self';
script-src 'self' 'nonce-{nonce}' 'strict-dynamic' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data: https:;
font-src 'self' data:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
block-all-mixed-content;
upgrade-insecure-requests;
```

### Giải Thích Các Directives

1. **`default-src 'self'`**
   - Mặc định chỉ cho phép load resources từ cùng origin
   - Áp dụng cho tất cả resource types không được chỉ định riêng

2. **`script-src 'self' 'nonce-{nonce}' 'strict-dynamic' 'unsafe-eval' 'unsafe-inline'`**
   - `'self'`: Cho phép scripts từ cùng origin
   - `'nonce-{nonce}'`: Cho phép inline scripts có nonce attribute
   - `'strict-dynamic'`: Cho phép scripts được load bởi trusted scripts
   - `'unsafe-eval'`: Cần cho Next.js development (có thể remove trong production)
   - `'unsafe-inline'`: Cần cho một số thư viện (có thể tối ưu sau)

3. **`style-src 'self' 'unsafe-inline'`**
   - `'unsafe-inline'`: **Cần thiết** cho Tailwind CSS (generated styles)
   - Không thể remove vì Tailwind inject styles vào `<style>` tags

4. **`img-src 'self' blob: data: https:`**
   - `'self'`: Images từ cùng origin
   - `blob:`: Cho phép blob URLs (image uploads)
   - `data:`: Cho phép data URIs (base64 images)
   - `https:`: Cho phép images từ bất kỳ HTTPS domain nào

5. **`font-src 'self' data:`**
   - `'self'`: Fonts từ cùng origin
   - `data:`: Cho phép data URIs (base64 fonts)

6. **`object-src 'none'`**
   - Không cho phép `<object>`, `<embed>`, `<applet>` tags
   - Tăng bảo mật

7. **`base-uri 'self'`**
   - Chỉ cho phép `<base>` tag từ cùng origin
   - Ngăn chặn base tag injection attacks

8. **`form-action 'self'`**
   - Chỉ cho phép submit forms đến cùng origin
   - Ngăn chặn form hijacking

9. **`frame-ancestors 'none'`**
   - Không cho phép website được embed trong iframe
   - Tương đương với `X-Frame-Options: DENY`

10. **`block-all-mixed-content`**
    - Block HTTP resources trên HTTPS pages
    - Tăng bảo mật

11. **`upgrade-insecure-requests`**
    - Tự động upgrade HTTP requests thành HTTPS
    - Tăng bảo mật

---

## 🎯 Nonce Generation

Mỗi request được generate một unique nonce:
```typescript
const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
```

Nonce được set trong header `x-nonce` và có thể được sử dụng trong client-side code nếu cần.

**Lưu ý:** Hiện tại Next.js tự động handle nonce cho scripts, nhưng nếu cần inline scripts, phải thêm nonce attribute:
```html
<script nonce={nonce}>...</script>
```

---

## 🚫 Excluded Routes

Middleware không áp dụng cho:
- `/api/*` - API routes (CSP không cần cho API responses)
- `/_next/static/*` - Next.js static files
- `/_next/image/*` - Next.js image optimization
- `/favicon.ico` - Favicon
- `/robots.txt` - Robots file
- `/sitemap.xml` - Sitemap

---

## 🔄 Adding External Services

Khi cần thêm external services, update CSP directives trong `middleware.ts`:

### Google Analytics
```typescript
script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.google-analytics.com https://www.googletagmanager.com;
img-src 'self' blob: data: https: https://www.google-analytics.com;
```

### Payment Gateways (MoMo, VietQR)
```typescript
script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://payment.momo.vn https://vietqr.net;
frame-src 'self' https://payment.momo.vn https://vietqr.net;
```

### CDN / Image Hosting
```typescript
img-src 'self' blob: data: https: https://cdn.yourdomain.com https://images.cloudinary.com;
font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com;
```

### Sentry (Error Tracking)
```typescript
script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.sentry.io;
connect-src 'self' https://*.sentry.io;
```

---

## 🧪 Testing

### 1. Test trong Development
```bash
npm run dev
```

Mở browser DevTools → Console và kiểm tra:
- ✅ Không có CSP violations
- ✅ Website hoạt động bình thường
- ✅ Images, fonts load đúng

### 2. Test trong Production
```bash
npm run build
npm run start
```

Verify:
- ✅ CSP header được set đúng
- ✅ Không có violations
- ✅ Performance không bị ảnh hưởng

### 3. Test CSP Violations

Nếu có violations, browser console sẽ hiển thị:
```
Content Security Policy: The page's settings blocked the loading of a resource at ...
```

Fix bằng cách:
1. Xác định resource bị block
2. Thêm domain vào CSP directive tương ứng
3. Test lại

---

## ⚠️ Lưu Ý

1. **`unsafe-inline` cho styles:**
   - **Không thể remove** vì Tailwind CSS inject styles vào `<style>` tags
   - Đây là limitation của Tailwind CSS

2. **`unsafe-eval` cho scripts:**
   - Cần cho Next.js development mode
   - Có thể remove trong production nếu không cần

3. **`unsafe-inline` cho scripts:**
   - Hiện tại cần cho một số thư viện
   - Có thể tối ưu sau bằng cách dùng nonce-based approach

4. **External Services:**
   - Khi thêm external services, phải update CSP
   - Test kỹ để đảm bảo không có violations

---

## 📚 References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js: Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - Tool để test CSP

---

**Last Updated:** 2025-12-13  
**Status:** ✅ Implemented - Ready for browser testing
