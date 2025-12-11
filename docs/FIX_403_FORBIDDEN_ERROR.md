# 🚨 Fix: Lỗi 403 Forbidden từ WooCommerce API

## 🔍 Phân tích lỗi

Từ Vercel logs, lỗi chính là:
```
WooCommerce API error: 403 Forbidden
```

**Khác biệt:**
- `401 Unauthorized` → Sai credentials (Consumer Key/Secret không đúng)
- `403 Forbidden` → Credentials đúng nhưng **không có quyền truy cập**

---

## 🚨 Nguyên nhân

### 1. **API Key không có quyền Read/Write** (90% trường hợp)

**Triệu chứng:**
- WooCommerce API trả về `403 Forbidden`
- Consumer Key/Secret đã được set đúng trong Vercel

**Giải pháp:**
1. Vào **WordPress Admin**
2. Vào **WooCommerce > Settings > Advanced > REST API**
3. Tìm API key đang sử dụng
4. Kiểm tra **Permissions**:
   - ❌ **Read only** → Không đủ quyền
   - ✅ **Read/Write** → Đúng quyền (cần cho create orders)

5. Nếu là **Read only**, có 2 cách:
   - **Option A:** Sửa permissions (nếu có quyền)
   - **Option B:** Tạo API key mới với quyền **Read/Write**

---

### 2. **API Key bị vô hiệu hóa hoặc xóa**

**Triệu chứng:**
- API key không còn tồn tại trong WordPress
- Hoặc key bị disable

**Giải pháp:**
1. Kiểm tra API key trong WordPress Admin
2. Nếu không thấy → Tạo key mới
3. Copy Consumer Key và Consumer Secret mới
4. Update trong Vercel Environment Variables
5. Redeploy

---

### 3. **WordPress Security Plugin chặn requests**

**Triệu chứng:**
- API key có quyền Read/Write
- Nhưng vẫn bị `403 Forbidden`
- Có thể có security plugin như Wordfence, iThemes Security, etc.

**Giải pháp:**
1. Kiểm tra WordPress plugins:
   - Wordfence
   - iThemes Security
   - All In One WP Security
   - Sucuri Security

2. Whitelist Vercel IPs hoặc disable security cho REST API:
   - Vào plugin settings
   - Tìm "REST API" hoặc "API" settings
   - Allow REST API requests
   - Hoặc whitelist Vercel IP ranges

3. **Alternative:** Tạm thời disable security plugin để test

---

### 4. **WordPress .htaccess chặn REST API**

**Triệu chứng:**
- Không có security plugin
- Nhưng vẫn `403 Forbidden`

**Giải pháp:**
1. Kiểm tra file `.htaccess` trong WordPress root
2. Tìm rules chặn `/wp-json/` hoặc REST API
3. Thêm exception cho REST API:
   ```apache
   # Allow REST API
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteCond %{REQUEST_URI} ^/wp-json/ [NC]
     RewriteRule ^ - [L]
   </IfModule>
   ```

---

## ✅ Các bước fix

### Step 1: Kiểm tra API Key Permissions

1. Đăng nhập WordPress Admin
2. Vào **WooCommerce > Settings > Advanced > REST API**
3. Tìm API key đang sử dụng (dựa vào Consumer Key trong Vercel)
4. Kiểm tra **Permissions**:
   - Phải là **Read/Write** ✅
   - Nếu là **Read only** → Cần sửa hoặc tạo key mới

---

### Step 2: Tạo API Key mới (nếu cần)

1. Vào **WooCommerce > Settings > Advanced > REST API**
2. Click **Add key** hoặc **Create an API key**
3. Điền thông tin:
   - **Description:** `Next.js Frontend (Vercel)`
   - **User:** Chọn user có quyền admin
   - **Permissions:** Chọn **Read/Write** ⚠️ QUAN TRỌNG
4. Click **Generate API key**
5. Copy **Consumer Key** và **Consumer Secret**

---

### Step 3: Update Vercel Environment Variables

1. Vào **Vercel Dashboard > Project > Settings > Environment Variables**
2. Update:
   - `WOOCOMMERCE_CONSUMER_KEY` = Consumer Key mới
   - `WOOCOMMERCE_CONSUMER_SECRET` = Consumer Secret mới
3. Đảm bảo chọn **Production** environment
4. Click **Save**

---

### Step 4: Redeploy

1. Vào **Vercel Dashboard > Deployments**
2. Click **⋮** (3 chấm) trên deployment mới nhất
3. Chọn **Redeploy**
4. Hoặc push code mới lên GitHub để trigger auto-deploy

---

### Step 5: Verify

1. Đợi deployment hoàn tất
2. Test API:
   ```
   https://www.teddyland.vn/api/woocommerce/products?per_page=1
   ```
3. Nếu trả về JSON với products → ✅ Thành công
4. Nếu vẫn `403` → Kiểm tra security plugins

---

## 🔍 Debug Steps

### Test 1: Verify API Key trong WordPress

1. Vào **WooCommerce > Settings > Advanced > REST API**
2. Click vào API key để xem details
3. Verify:
   - Status: **Active** ✅
   - Permissions: **Read/Write** ✅
   - User: Có quyền admin ✅

---

### Test 2: Test API trực tiếp với curl

```bash
# Test với Consumer Key/Secret
curl -u "CONSUMER_KEY:CONSUMER_SECRET" \
  "https://www.teddyland.vn/wp-json/wc/v3/products?per_page=1"
```

**Kết quả mong đợi:**
- `200 OK` với JSON response → API key đúng
- `401 Unauthorized` → Sai credentials
- `403 Forbidden` → Đúng credentials nhưng không có quyền

---

### Test 3: Kiểm tra Security Plugins

1. Vào **WordPress Admin > Plugins**
2. Tìm các security plugins:
   - Wordfence
   - iThemes Security
   - All In One WP Security
   - Sucuri Security

3. Vào plugin settings
4. Tìm "REST API" hoặc "API" settings
5. Enable/Allow REST API requests

---

### Test 4: Test REST API endpoint

Truy cập trực tiếp:
```
https://www.teddyland.vn/wp-json/wc/v3/
```

**Kết quả:**
- Nếu thấy JSON với WooCommerce endpoints → REST API hoạt động
- Nếu `403` hoặc `404` → Có vấn đề với REST API configuration

---

## 📝 Checklist

Trước khi báo lỗi, đảm bảo:

- [ ] API key có quyền **Read/Write** (không phải Read only)
- [ ] API key status là **Active**
- [ ] Consumer Key/Secret đã được update trong Vercel
- [ ] Đã **Redeploy** sau khi update credentials
- [ ] Đã test API với curl và thấy `200 OK`
- [ ] Đã kiểm tra security plugins (nếu có)
- [ ] Đã verify REST API endpoint accessible

---

## 🚨 Lưu ý quan trọng

### 1. **Permissions phải là Read/Write**

- **Read only** → Chỉ đọc được products, không tạo được orders
- **Read/Write** → Đọc products và tạo orders (cần cho checkout)

### 2. **Consumer Secret chỉ hiển thị 1 lần**

- Nếu quên Consumer Secret → Phải tạo key mới
- Không thể xem lại Consumer Secret sau khi tạo

### 3. **Security Plugins**

- Một số security plugins mặc định chặn REST API
- Cần whitelist hoặc disable security cho REST API

---

## 📞 Nếu vẫn còn lỗi

1. **Collect thông tin:**
   - Screenshot API key permissions trong WordPress
   - Response từ curl test
   - WordPress plugins list (đặc biệt security plugins)
   - Vercel logs (để xem error message chi tiết)

2. **Verify:**
   - API key có quyền Read/Write không?
   - Security plugins có chặn REST API không?
   - WordPress .htaccess có chặn `/wp-json/` không?

3. **Contact support:**
   - WordPress Hosting Support (nếu là hosting issue)
   - WooCommerce Support (nếu là WooCommerce issue)

---

**Status:** ✅ Hướng dẫn đầy đủ để fix lỗi 403 Forbidden

