# 🐛 Troubleshooting: Lỗi 500 Internal Server Error

## 🔍 Phân tích lỗi

Khi deploy lên Vercel, lỗi **500 Internal Server Error** thường xảy ra ở các API routes:
- `/api/woocommerce/products` → 500
- `/api/woocommerce/categories` → 500

---

## 🚨 Nguyên nhân chính

### 1. **Environment Variables chưa được set** (90% trường hợp)

**Triệu chứng:**
- Tất cả API routes trả về 500
- Console log: "WooCommerce REST API credentials are not configured"

**Giải pháp:**
👉 Xem file `docs/VERCEL_ENV_SETUP.md` để cấu hình đầy đủ.

**Checklist:**
- [ ] `NEXT_PUBLIC_WORDPRESS_URL` đã được set
- [ ] `WOOCOMMERCE_CONSUMER_KEY` đã được set
- [ ] `WOOCOMMERCE_CONSUMER_SECRET` đã được set
- [ ] Tất cả biến đã được set cho **Production** environment
- [ ] Đã **Redeploy** sau khi thêm biến

---

### 2. **WooCommerce API Credentials không đúng**

**Triệu chứng:**
- API trả về 401 Unauthorized
- Console log: "WooCommerce API error: 401"

**Giải pháp:**
1. Kiểm tra Consumer Key/Secret trong WordPress:
   - Vào **WooCommerce > Settings > Advanced > REST API**
   - Verify key có quyền **Read/Write**
2. Tạo key mới nếu cần:
   - Delete key cũ
   - Tạo key mới với quyền **Read/Write**
   - Copy Consumer Key và Consumer Secret
   - Update trong Vercel Environment Variables
   - Redeploy

---

### 3. **WordPress URL không accessible từ Vercel**

**Triệu chứng:**
- API trả về Network Error hoặc Timeout
- Console log: "Failed to fetch"

**Giải pháp:**
1. Test WordPress API trực tiếp:
   ```
   https://www.teddyland.vn/wp-json/wc/v3/products
   ```
   - Nếu không mở được → WordPress chưa được deploy đúng
   - Nếu mở được nhưng yêu cầu auth → Bình thường

2. Kiểm tra CORS:
   - WordPress có thể chặn requests từ Vercel
   - Cần cấu hình CORS trong WordPress
   - Hoặc sử dụng WordPress plugin (ví dụ: "CORS Headers")

3. Kiểm tra Firewall:
   - Một số hosting chặn requests từ serverless functions
   - Cần whitelist Vercel IPs hoặc disable firewall cho API routes

---

### 4. **WooCommerce REST API chưa được enable**

**Triệu chứng:**
- API trả về 404 Not Found
- Endpoint `/wp-json/wc/v3/` không tồn tại

**Giải pháp:**
1. Kiểm tra WooCommerce đã được cài đặt:
   - Vào WordPress Admin
   - Kiểm tra plugin WooCommerce đã active

2. Kiểm tra REST API:
   - Truy cập: `https://your-wordpress.com/wp-json/wc/v3/`
   - Nếu không thấy JSON response → WooCommerce chưa được cấu hình đúng

---

### 5. **Lỗi trong code (Runtime Error)**

**Triệu chứng:**
- API trả về 500 với error message cụ thể
- Console log có stack trace

**Giải pháp:**
1. Kiểm tra Vercel Logs:
   - Vào Vercel Dashboard > Project > Deployments
   - Click vào deployment mới nhất
   - Xem tab **Functions** để xem error logs

2. Test API route:
   - Tạo test route: `/api/test-env`
   - Truy cập: `https://your-domain.vercel.app/api/test-env`
   - Xem response để verify environment variables

---

## 🔧 Các bước debug

### Step 1: Test Environment Variables

Truy cập: `https://your-domain.vercel.app/api/test-env`

Response mong đợi:
```json
{
  "hasWordPressUrl": true,
  "wordPressUrl": "https://www.teddyland.vn",
  "hasConsumerKey": true,
  "hasConsumerSecret": true,
  "consumerKeyLength": 43,
  "consumerSecretLength": 43,
  "isValid": true
}
```

Nếu `isValid: false` → Environment variables chưa được set đúng.

---

### Step 2: Test WordPress API trực tiếp

Truy cập: `https://www.teddyland.vn/wp-json/wc/v3/products`

- Nếu yêu cầu authentication → Bình thường
- Nếu trả về 404 → WooCommerce REST API chưa được enable
- Nếu trả về 500 → WordPress có lỗi

---

### Step 3: Kiểm tra Vercel Logs

1. Vào Vercel Dashboard
2. Chọn project
3. Vào tab **Deployments**
4. Click vào deployment mới nhất
5. Xem tab **Functions** hoặc **Logs**
6. Tìm error messages liên quan đến:
   - "WooCommerce REST API credentials"
   - "Failed to fetch"
   - "401 Unauthorized"
   - "Network Error"

---

### Step 4: Test với curl

```bash
# Test WordPress API với credentials
curl -u "CONSUMER_KEY:CONSUMER_SECRET" \
  "https://www.teddyland.vn/wp-json/wc/v3/products?per_page=1"
```

Nếu curl thành công nhưng Vercel lỗi → Có thể là CORS hoặc Firewall issue.

---

## ✅ Checklist tổng hợp

Trước khi báo lỗi, đảm bảo đã check:

- [ ] Environment variables đã được set trong Vercel
- [ ] Tất cả biến đã được set cho **Production** environment
- [ ] Đã **Redeploy** sau khi thêm/sửa biến
- [ ] WordPress URL accessible từ browser
- [ ] WooCommerce REST API đã được enable
- [ ] Consumer Key/Secret có quyền **Read/Write**
- [ ] Đã test `/api/test-env` và thấy `isValid: true`
- [ ] Đã kiểm tra Vercel Logs để xem error chi tiết

---

## 📞 Nếu vẫn còn lỗi

1. **Collect thông tin:**
   - Screenshot Vercel Environment Variables (ẩn values)
   - Response từ `/api/test-env`
   - Vercel Logs (Functions tab)
   - Error message từ browser console

2. **Verify WordPress:**
   - WordPress URL có accessible không?
   - WooCommerce REST API có hoạt động không?
   - Consumer Key/Secret có đúng không?

3. **Contact support:**
   - Vercel Support (nếu là Vercel issue)
   - WordPress Hosting Support (nếu là hosting issue)

---

**Status:** ✅ Hướng dẫn đầy đủ để troubleshoot lỗi 500

