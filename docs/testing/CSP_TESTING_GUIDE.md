# 🧪 Hướng Dẫn Test CSP Header

**Vấn đề:** Không thấy CSP header trong DevTools Network tab

---

## ⚠️ Lưu Ý Quan Trọng

**CSP header chỉ xuất hiện trên MAIN HTML DOCUMENT**, không phải trên:
- ❌ Third-party requests (Kaspersky, Google Analytics, etc.)
- ❌ API requests (`/api/*`)
- ❌ Static files (`/_next/static/*`)
- ❌ Image requests
- ❌ Font requests

---

## ✅ Cách Kiểm Tra Đúng

### 1. Tìm Main Document Request

Trong DevTools Network tab:

1. **Filter theo "Doc" (Document)**
   - Click vào filter "Doc" ở thanh filter
   - Hoặc gõ `type:document` trong filter box

2. **Tìm request đầu tiên (thường là `/` hoặc trang bạn đang xem)**
   - Request này thường có:
     - Name: `/` hoặc tên trang (ví dụ: `/products`)
     - Type: `document`
     - Status: `200` (hoặc `304` nếu cached)

3. **Click vào request đó và xem Response Headers**
   - Tab "Headers" → Section "Response Headers"
   - Tìm `Content-Security-Policy` header

### 2. Screenshot Hướng Dẫn

```
DevTools Network Tab:
┌─────────────────────────────────────────┐
│ [All] [Doc] [CSS] [JS] [Font] [Img] ... │  ← Click "Doc"
├─────────────────────────────────────────┤
│ Name              Type      Status     │
│ /                 document  200         │  ← Click vào đây
│ /products         document  200         │
│ ...                                     │
└─────────────────────────────────────────┘

Sau khi click vào request "/":
┌─────────────────────────────────────────┐
│ Headers | Preview | Response | ...     │
├─────────────────────────────────────────┤
│ Response Headers:                       │
│   Content-Security-Policy: default-src │  ← Tìm header này
│   X-DNS-Prefetch-Control: on           │
│   X-Frame-Options: SAMEORIGIN          │
│   ...                                   │
└─────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### Nếu vẫn không thấy CSP header:

#### 1. Kiểm tra Dev Server đã restart chưa
```bash
# Stop dev server (Ctrl+C)
# Restart lại
npm run dev
```

#### 2. Kiểm tra Middleware có được load không
- Mở Console tab trong DevTools
- Tìm log errors về middleware
- Nếu có lỗi, fix và restart

#### 3. Kiểm tra Matcher Config
- Middleware chỉ apply cho routes match pattern
- API routes (`/api/*`) sẽ KHÔNG có CSP header (đúng như thiết kế)

#### 4. Test với Production Build
```bash
npm run build
npm run start
```
Sau đó test lại trong browser

#### 5. Kiểm tra Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) hoặc `Cmd+Shift+R` (Mac)
- Hoặc mở DevTools → Network → Check "Disable cache"

---

## 🧪 Test Script

Tạo file test để verify middleware hoạt động:

```typescript
// test-middleware.ts (temporary test file)
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

// Test middleware
const request = new NextRequest(new URL('http://localhost:3000/'));
const response = middleware(request);

console.log('CSP Header:', response.headers.get('Content-Security-Policy'));
console.log('Nonce Header:', response.headers.get('x-nonce'));
```

---

## 📝 Expected Headers trên Main Document

Khi kiểm tra đúng main document request, bạn sẽ thấy:

```
Response Headers:
  Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...' 'strict-dynamic' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests;
  x-nonce: [base64-string]
  X-DNS-Prefetch-Control: on
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: origin-when-cross-origin
```

---

## ✅ Checklist

- [ ] Đã filter theo "Doc" trong Network tab
- [ ] Đã click vào main document request (thường là `/`)
- [ ] Đã xem Response Headers (không phải Request Headers)
- [ ] Đã hard refresh page (`Ctrl+Shift+R`)
- [ ] Đã restart dev server sau khi tạo middleware
- [ ] Đã test với production build (`npm run build && npm run start`)

---

**Nếu vẫn không thấy CSP header sau khi làm theo hướng dẫn trên, có thể middleware không được load. Kiểm tra:**
1. File `middleware.ts` có ở root directory không?
2. Có lỗi TypeScript/build không?
3. Dev server có restart sau khi tạo middleware không?
