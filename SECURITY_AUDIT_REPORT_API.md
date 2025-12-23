# 🔒 BÁO CÁO KIỂM TRA BẢO MẬT API ROUTES

**Ngày tạo:** 2025-01-XX  
**Phạm vi:** Thư mục `app/api` (106 API route files)  
**Phương pháp:** Manual security audit + Pattern analysis

---

## 📊 TỔNG QUAN

Dự án có **106 API route files** trong thư mục `app/api`:
- **Admin API routes:** 76 files (`/api/admin/*`)
- **Public CMS API routes:** 20+ files (`/api/cms/*`)
- **Payment API routes:** 4 files (`/api/payment/*`)
- **Other routes:** 6+ files (locations, invoice, test-env)

---

## ✅ CÁC ĐIỂM MẠNH (STRENGTHS)

### 1. **Authentication & Authorization** ✅

**Status:** EXCELLENT

- ✅ **Middleware được extract:** `withAuthAdmin` middleware được sử dụng ở **76 admin routes**
- ✅ **Token revocation:** Có kiểm tra `token_version` để revoke tokens
- ✅ **Permission-based access:** Có RBAC system với permission checking
- ✅ **Account status check:** Kiểm tra `is_active` và `must_change_password`

**Code example:**
```typescript
// lib/middleware/authMiddleware.ts
export async function withAuthAdmin(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  requiredPermission?: Permission
): Promise<NextResponse>
```

**Coverage:**
- ✅ 76/76 admin routes sử dụng `withAuthAdmin`
- ✅ Public routes (`/api/cms/*`) không yêu cầu authentication (đúng design)

---

### 2. **Input Validation** ✅

**Status:** EXCELLENT

- ✅ **Zod validation:** 51 files sử dụng Zod schema validation
- ✅ **Type safety:** Sử dụng TypeScript với proper types
- ✅ **Validation error handling:** Có `handleValidationError` utility

**Code example:**
```typescript
// app/api/admin/auth/login/route.ts
const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

const validation = loginSchema.safeParse(body);
if (!validation.success) {
  return NextResponse.json({ error: ... }, { status: 400 });
}
```

**Coverage:**
- ✅ 51/106 routes có Zod validation
- ⚠️ 55 routes chưa có explicit validation (cần review)

---

### 3. **Rate Limiting** ✅

**Status:** GOOD

- ✅ **Login rate limiting:** Có rate limiting cho login endpoint (5 attempts / 15 min)
- ✅ **MongoDB-based:** Sử dụng MongoDB cho rate limiting (serverless-compatible)

**Code example:**
```typescript
// app/api/admin/auth/login/route.ts
const rateLimitKey = getLoginRateLimitKey(clientIP, username);
const isWithinLimit = await checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
```

**Coverage:**
- ✅ Login endpoint có rate limiting
- ⚠️ Các endpoints khác chưa có rate limiting (cần thêm)

---

### 4. **Password Security** ✅

**Status:** EXCELLENT

- ✅ **Password hashing:** Sử dụng bcrypt (`comparePassword`, `hashPassword`)
- ✅ **No password in logs:** Không log password trong error messages
- ✅ **Generic error messages:** Không reveal nếu user exists

**Code example:**
```typescript
// app/api/admin/auth/login/route.ts
if (!user) {
  // Don't reveal if user exists (security best practice)
  return NextResponse.json({
    code: 'INVALID_CREDENTIALS',
    message: 'Tên đăng nhập hoặc mật khẩu không đúng',
  }, { status: 401 });
}
```

---

### 5. **No Code Injection** ✅

**Status:** EXCELLENT

- ✅ **No eval():** Không tìm thấy `eval()`, `Function()`, hoặc `new Function()`
- ✅ **No dangerous patterns:** Không có code injection vulnerabilities

---

### 6. **Error Handling** ✅

**Status:** GOOD

- ✅ **Generic error messages:** Không expose sensitive information
- ✅ **Proper status codes:** Sử dụng đúng HTTP status codes
- ⚠️ **Error type:** Một số routes vẫn dùng `catch (error: any)` (28 occurrences)

**Recommendation:**
```typescript
// Before
catch (error: any) {
  console.error('[API] Error:', error);
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// After
catch (error: unknown) {
  console.error('[API] Error:', error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json({ error: message }, { status: 500 });
}
```

---

## ⚠️ CÁC VẤN ĐỀ CẦN QUAN TÂM (CONCERNS)

### 1. **NoSQL Injection Risk** ⚠️

**Status:** NEEDS REVIEW

**Vấn đề:** Sử dụng `$regex` với user input có thể dẫn đến NoSQL injection

**Pattern tìm thấy:**
```typescript
// app/api/cms/products/route.ts
const search = searchParams.get('search');
if (search) {
  query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
  ];
}
```

**Risk Level:** LOW-MEDIUM
- MongoDB `$regex` operator có thể bị abuse nếu không sanitize
- ReDoS (Regular Expression Denial of Service) attacks

**Giải pháp:**
```typescript
// lib/utils/sanitizeRegex.ts
export function sanitizeRegexInput(input: string): string {
  // Remove regex special characters
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Usage
const sanitizedSearch = sanitizeRegexInput(search);
query.$or = [
  { name: { $regex: sanitizedSearch, $options: 'i' } },
];
```

**Files cần review:**
- `app/api/cms/products/route.ts`
- `app/api/admin/products/route.ts`
- `app/api/admin/posts/route.ts`
- Các routes khác sử dụng `$regex` với user input

---

### 2. **Missing Rate Limiting** ⚠️

**Status:** NEEDS IMPROVEMENT

**Vấn đề:** Chỉ có rate limiting cho login endpoint, các endpoints khác chưa có

**Risk Level:** MEDIUM
- DDoS attacks
- Brute force attacks
- Resource exhaustion

**Giải pháp:**
- ✅ Đã có `rateLimiter.ts` utility
- ⚠️ Cần apply cho các sensitive endpoints:
  - Password reset
  - Order creation
  - Payment processing
  - API endpoints với high cost operations

**Recommendation:**
```typescript
// lib/utils/rateLimiter.ts (already exists)
import { checkRateLimit } from '@/lib/utils/rateLimiter';

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const clientIP = getClientIP(request);
  const rateLimitKey = `api:${clientIP}`;
  const isWithinLimit = await checkRateLimit(rateLimitKey, 10, 60 * 1000);
  
  if (!isWithinLimit) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // ... handler code
}
```

---

### 3. **Environment Variables Exposure** ⚠️

**Status:** NEEDS REVIEW

**Vấn đề:** 73 files sử dụng `process.env.*` - cần đảm bảo không expose sensitive data

**Risk Level:** MEDIUM
- API keys, secrets có thể bị expose trong error messages
- Debug information có thể leak secrets

**Giải pháp:**
- ✅ Không log `process.env` values
- ✅ Validate environment variables ở startup
- ✅ Sử dụng `.env.local` (đã có trong `.gitignore`)

**Files cần review:**
- `app/api/test-env/route.ts` - ⚠️ **CRITICAL:** Có thể expose env vars
- Các payment webhook handlers
- Database connection files

**Recommendation:**
```typescript
// ❌ BAD
console.error('Error:', process.env.MONGODB_URI);

// ✅ GOOD
console.error('Database connection error');
```

---

### 4. **CORS Configuration** ⚠️

**Status:** NEEDS REVIEW

**Vấn đề:** Không thấy explicit CORS configuration trong API routes

**Risk Level:** LOW-MEDIUM
- CORS misconfiguration có thể dẫn đến unauthorized access
- Next.js có default CORS behavior, nhưng nên explicit

**Giải pháp:**
```typescript
// lib/utils/cors.ts
export function setCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
```

**Note:** Next.js API routes có default CORS, nhưng nên explicit cho production.

---

### 5. **ObjectId Validation** ⚠️

**Status:** NEEDS IMPROVEMENT

**Vấn đề:** Pattern `ObjectId.isValid()` lặp lại 78 lần, có thể inconsistent

**Risk Level:** LOW
- Invalid ObjectId có thể gây errors
- Inconsistent validation logic

**Giải pháp:**
- ✅ Đã đề xuất trong DRY_AUDIT_REPORT.md
- Tạo helper function `validateObjectId()`

---

### 6. **Pagination Limits** ⚠️

**Status:** NEEDS REVIEW

**Vấn đề:** Pagination parameters không có max limit validation

**Risk Level:** LOW-MEDIUM
- Large `per_page` values có thể gây DoS
- Database query performance issues

**Current code:**
```typescript
const perPage = parseInt(searchParams.get('per_page') || '10', 10);
```

**Giải pháp:**
```typescript
const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '10', 10)));
```

---

## 🚨 CÁC VẤN ĐỀ NGHIÊM TRỌNG (CRITICAL)

### 1. **Test Environment Endpoint** 🚨

**File:** `app/api/test-env/route.ts`

**Vấn đề:** Endpoint này có thể expose environment variables

**Risk Level:** CRITICAL

**Action Required:**
- ⚠️ **DISABLE trong production**
- ⚠️ **Remove hoặc protect với authentication**
- ⚠️ **Never expose trong production builds**

**Recommendation:**
```typescript
// app/api/test-env/route.ts
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  // Or require authentication
  return withAuthAdmin(request, async (req) => {
    // ... handler
  });
}
```

---

### 2. **Payment Webhook Security** 🚨

**Files:**
- `app/api/payment/webhook/vietqr/route.ts`
- `app/api/payment/webhook/momo/route.ts`

**Vấn đề:** Webhook endpoints cần verify signature để prevent tampering

**Risk Level:** CRITICAL

**Action Required:**
- ✅ Verify webhook signatures
- ✅ Validate request source
- ✅ Rate limiting cho webhook endpoints

**Recommendation:**
```typescript
// app/api/payment/webhook/vietqr/route.ts
export async function POST(request: NextRequest) {
  // Verify signature
  const signature = request.headers.get('x-vietqr-signature');
  const body = await request.text();
  
  const isValid = verifyWebhookSignature(body, signature, process.env.VIETQR_SECRET);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // ... process webhook
}
```

---

## 📋 KẾ HOẠCH HÀNH ĐỘNG (ACTION PLAN)

### Priority 1 (Critical - Làm ngay)
1. 🚨 **Disable/Protect test-env endpoint** trong production
2. 🚨 **Verify webhook signatures** cho payment webhooks
3. ⚠️ **Review NoSQL injection risks** với `$regex` patterns

### Priority 2 (High - Làm trong tuần này)
4. ⚠️ **Add rate limiting** cho sensitive endpoints
5. ⚠️ **Sanitize regex inputs** trong search queries
6. ⚠️ **Add pagination limits** (max 100 items per page)

### Priority 3 (Medium - Có thể làm sau)
7. ⚠️ **Explicit CORS configuration** cho production
8. ⚠️ **Improve error handling** (replace `error: any` với `error: unknown`)
9. ⚠️ **Environment variable validation** ở startup

---

## 📊 THỐNG KÊ BẢO MẬT

| Category | Status | Coverage | Priority |
|----------|--------|----------|----------|
| Authentication | ✅ Excellent | 76/76 admin routes | - |
| Authorization | ✅ Excellent | RBAC system | - |
| Input Validation | ✅ Good | 51/106 routes | P3 |
| Rate Limiting | ⚠️ Partial | 1/106 routes | P2 |
| Password Security | ✅ Excellent | All auth routes | - |
| Code Injection | ✅ Excellent | 0 vulnerabilities | - |
| NoSQL Injection | ⚠️ Needs Review | Multiple routes | P1 |
| Error Handling | ✅ Good | Generic messages | P3 |
| Webhook Security | 🚨 Critical | 2 endpoints | P1 |
| Test Endpoints | 🚨 Critical | 1 endpoint | P1 |

---

## ✅ CHECKLIST BẢO MẬT

### Authentication & Authorization
- [x] Admin routes protected với `withAuthAdmin`
- [x] Token revocation mechanism
- [x] Permission-based access control
- [x] Account status checks

### Input Validation
- [x] Zod schema validation (51 routes)
- [ ] Input sanitization for regex
- [ ] Pagination limits
- [ ] ObjectId validation consistency

### Rate Limiting
- [x] Login endpoint rate limiting
- [ ] Password reset rate limiting
- [ ] API endpoints rate limiting
- [ ] Webhook endpoints rate limiting

### Data Protection
- [x] Password hashing (bcrypt)
- [x] No password in logs
- [ ] Environment variable protection
- [ ] Sensitive data in error messages

### Security Headers
- [ ] CORS configuration
- [ ] Security headers (X-Frame-Options, etc.)
- [ ] Content Security Policy

---

## 🔗 TÀI LIỆU THAM KHẢO

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [OWASP NoSQL Injection](https://owasp.org/www-community/attacks/NoSQL_Injection)

---

## 📝 NOTES

- Báo cáo này được tạo tự động dựa trên pattern analysis
- Cần manual review cho các critical endpoints
- Test trong staging environment trước khi deploy
- Regular security audits recommended (quarterly)

---

**Lưu ý:** Đây là báo cáo tự động. Cần review và test kỹ trước khi apply các fixes.


