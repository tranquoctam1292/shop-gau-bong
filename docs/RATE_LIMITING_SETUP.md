# 🛡️ Rate Limiting Setup Guide

**Ngày tạo:** 2025-12-13  
**Phase:** Phase 7 - Pre-Deployment Checklist

---

## 📋 Overview

Rate limiting giúp bảo vệ ứng dụng khỏi:
- DDoS attacks
- API abuse
- Resource exhaustion
- Uncontrolled billing costs

---

## 🔧 Vercel Rate Limiting Options

### Option 1: Vercel WAF (Recommended)

**Vercel WAF** là giải pháp rate limiting được khuyến nghị cho Vercel deployments.

#### Cách cấu hình:

1. **Truy cập Vercel Dashboard:**
   - Vào project → **Firewall** tab
   - Click **Configure** → **+ New Rule**

2. **Tạo Rate Limiting Rule:**
   - **Name:** "API Rate Limit" (hoặc tên phù hợp)
   - **If condition:**
     - Filter: `Request Path`
     - Operator: `Equals` hoặc `Starts with`
     - Value: `/api/*` (hoặc path cụ thể)
   - **Then action:** `Rate Limit`
   - **Strategy:** `Fixed Window` (Hobby/Pro) hoặc `Token Bucket` (Enterprise)
   - **Time Window:** 60 seconds (default, có thể điều chỉnh)
   - **Request Limit:** 100 requests (default, có thể điều chỉnh)
   - **Counting Key:** `IP` (hoặc `JA4 Digest`, `User Agent`, `Header` cho Enterprise)
   - **Action:** `Default (429)` hoặc `Deny`, `Challenge`, `Log`

3. **Publish Changes:**
   - Click **Review Changes**
   - Review và click **Publish**

#### Limits theo Plan:

| Plan | Rules | Counting Keys | Strategy | Window |
|------|-------|---------------|----------|--------|
| Hobby | 1 | IP, JA4 Digest | Fixed Window | 10s - 10min |
| Pro | 40 | IP, JA4 Digest | Fixed Window | 10s - 10min |
| Enterprise | 1000 | IP, JA4 Digest, User Agent, Headers | Fixed Window, Token Bucket | 10s - 1hr |

#### Pricing:

- **Included:** 1,000,000 allowed requests/month
- **Additional:** $0.50 per 1,000,000 allowed requests

---

### Option 2: Function Duration Limits (vercel.json)

Có thể giới hạn thời gian chạy của functions trong `vercel.json`:

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

**Note:** Đây không phải rate limiting, chỉ giới hạn thời gian chạy của function.

---

### Option 3: @vercel/firewall SDK (Advanced)

Sử dụng `@vercel/firewall` SDK để implement rate limiting trong code:

1. **Install package:**
   ```bash
   npm install @vercel/firewall
   ```

2. **Create WAF rule in dashboard** với Rate Limit ID

3. **Use in code:**
   ```typescript
   import { rateLimit } from '@vercel/firewall';

   export async function GET(request: NextRequest) {
     const ip = request.ip || request.headers.get('x-forwarded-for');
     
     const { success } = await rateLimit({
       identifier: ip,
       rateLimitId: 'your-rate-limit-id',
     });

     if (!success) {
       return NextResponse.json(
         { error: 'Too many requests' },
         { status: 429 }
       );
     }

     // Your API logic here
   }
   ```

---

## 📝 Recommended Configuration

### For API Routes

**Rule Name:** `API Rate Limit`

**Configuration:**
- **If:** Request Path starts with `/api/`
- **Then:** Rate Limit
- **Strategy:** Fixed Window
- **Time Window:** 60 seconds
- **Request Limit:** 100 requests per IP
- **Action:** Default (429)

### For Admin Routes (Stricter)

**Rule Name:** `Admin API Rate Limit`

**Configuration:**
- **If:** Request Path starts with `/api/admin/`
- **Then:** Rate Limit
- **Strategy:** Fixed Window
- **Time Window:** 60 seconds
- **Request Limit:** 50 requests per IP
- **Action:** Deny

### For Payment Routes (Very Strict)

**Rule Name:** `Payment API Rate Limit`

**Configuration:**
- **If:** Request Path starts with `/api/payment/`
- **Then:** Rate Limit
- **Strategy:** Fixed Window
- **Time Window:** 60 seconds
- **Request Limit:** 20 requests per IP
- **Action:** Deny

---

## 🧪 Testing

### Test Rate Limiting

1. **Send multiple requests:**
   ```bash
   # Send 101 requests in 60 seconds
   for i in {1..101}; do
     curl http://your-domain.com/api/test
   done
   ```

2. **Expected result:**
   - First 100 requests: 200 OK
   - Request 101: 429 Too Many Requests

### Monitor in Dashboard

1. Vào **Firewall** tab
2. Select **Custom Rule** từ traffic grouping dropdown
3. Xem traffic và rate limit hits

---

## 📊 Monitoring

### Vercel Dashboard

- **Firewall** tab → View rate limit hits
- **Logs** → Check for 429 responses
- **Analytics** → Monitor API usage patterns

### Response Headers

Khi rate limit được trigger, response sẽ có headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets
- `Retry-After`: Seconds to wait before retrying

---

## ⚠️ Important Notes

1. **Vercel.json không hỗ trợ rate limiting:**
   - Rate limiting phải cấu hình qua Vercel Dashboard
   - Không thể set rate limits trong `vercel.json`

2. **Built-in Protection:**
   - Vercel có DDoS protection tự động
   - Basic rate limiting được apply tự động
   - WAF rate limiting là additional layer

3. **Pricing:**
   - 1,000,000 requests/month included
   - Additional requests: $0.50 per 1M requests

4. **Local Development:**
   - Rate limiting chỉ hoạt động trên Vercel deployment
   - Không hoạt động trong local development

---

## ✅ Checklist

- [ ] Cấu hình rate limiting rule cho `/api/*` routes
- [ ] Cấu hình rate limiting rule cho `/api/admin/*` routes (stricter)
- [ ] Cấu hình rate limiting rule cho `/api/payment/*` routes (very strict)
- [ ] Test rate limiting với multiple requests
- [ ] Monitor rate limit hits trong dashboard
- [ ] Document rate limits cho team

---

## 📚 References

- [Vercel WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
- [Rate Limiting SDK](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk)
- [Add Rate Limiting Guide](https://vercel.com/guides/add-rate-limiting-vercel)

---

**Last Updated:** 2025-12-13
