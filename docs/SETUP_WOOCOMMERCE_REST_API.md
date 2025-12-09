# 🔧 Setup WooCommerce REST API Credentials

## 📋 Tổng quan

Để sử dụng WooCommerce REST API, bạn cần tạo **Consumer Key** và **Consumer Secret** trong WordPress admin.

## 🚀 Các bước setup

### Step 1: Vào REST API Settings

1. Đăng nhập vào **WordPress Admin**
2. Vào **WooCommerce > Settings**
3. Click tab **Advanced**
4. Click **REST API** trong menu bên trái

### Step 2: Tạo API Key

1. Click nút **"Add key"** hoặc **"Create an API key"**
2. Điền thông tin:
   - **Description:** `Next.js Frontend` (hoặc tên bạn muốn)
   - **User:** Chọn user có quyền admin (thường là user hiện tại)
   - **Permissions:** Chọn **Read/Write** (cần để create orders)
3. Click **"Generate API key"**

### Step 3: Copy Credentials

Sau khi tạo, bạn sẽ thấy:
- **Consumer Key:** `ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Consumer Secret:** `cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**⚠️ QUAN TRỌNG:** 
- Copy cả 2 keys này ngay lập tức
- Consumer Secret chỉ hiển thị 1 lần, không thể xem lại sau đó
- Nếu quên, phải tạo key mới

### Step 4: Add vào Environment Variables

1. Mở file `.env.local` trong project Next.js
2. Thêm các dòng sau:

```env
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. **Restart Next.js dev server** để load environment variables mới

### Step 5: Verify Setup

Test REST API bằng cách:

1. Mở browser và truy cập:
   ```
   http://localhost/wordpress/wp-json/wc/v3/products
   ```
2. Browser sẽ yêu cầu authentication (username/password)
3. Nếu thấy JSON response với danh sách products → Setup thành công!

**Hoặc** test bằng curl:

```bash
curl -u "ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  "http://localhost/wordpress/wp-json/wc/v3/products"
```

## 🔒 Security Best Practices

1. **Không commit credentials vào Git:**
   - ✅ Thêm `.env.local` vào `.gitignore`
   - ✅ Chỉ commit `.env.example` (không có real credentials)

2. **Rotate keys định kỳ:**
   - Nên tạo key mới mỗi 3-6 tháng
   - Xóa key cũ sau khi tạo key mới

3. **Limit permissions:**
   - Nếu chỉ cần read, dùng **Read** permission thay vì **Read/Write**
   - Tạo separate keys cho different purposes

4. **Use HTTPS in production:**
   - REST API credentials được gửi qua Basic Auth
   - Luôn dùng HTTPS trong production để bảo mật

## 🐛 Troubleshooting

### Error: "WooCommerce REST API credentials are not configured"

**Nguyên nhân:** Environment variables chưa được set hoặc không được load.

**Giải pháp:**
1. Check `.env.local` có đúng format không
2. Restart Next.js dev server
3. Verify variable names: `WOOCOMMERCE_CONSUMER_KEY` và `WOOCOMMERCE_CONSUMER_SECRET`

### Error: "401 Unauthorized"

**Nguyên nhân:** Consumer Key hoặc Secret không đúng.

**Giải pháp:**
1. Verify credentials trong WordPress admin
2. Check có copy đầy đủ không (không có spaces, line breaks)
3. Tạo key mới nếu cần

### Error: "403 Forbidden"

**Nguyên nhân:** API key không có đủ permissions.

**Giải pháp:**
1. Vào WordPress admin > WooCommerce > Settings > Advanced > REST API
2. Edit API key
3. Set permissions thành **Read/Write**

### Error: "Connection refused" hoặc "Network error"

**Nguyên nhân:** WordPress URL không đúng hoặc WordPress chưa chạy.

**Giải pháp:**
1. Check `NEXT_PUBLIC_WORDPRESS_URL` trong `.env.local`
2. Verify WordPress đang chạy
3. Test WordPress URL trong browser: `http://localhost/wordpress`

## 📚 References

- WooCommerce REST API Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/
- WooCommerce REST API Authentication: https://woocommerce.github.io/woocommerce-rest-api-docs/#authentication

