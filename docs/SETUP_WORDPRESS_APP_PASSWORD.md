# 🔧 Setup WordPress Application Password

## 📋 Tổng quan

Nếu WooCommerce REST API key không work, có thể dùng WordPress Application Password thay thế.

## 🚀 Các bước setup

### Step 1: Tạo Application Password

1. Đăng nhập vào **WordPress Admin**
2. Vào **Users > Your Profile** (hoặc **Users > All Users > Edit** user của bạn)
3. Scroll xuống section **"Application Passwords"**
4. Tạo password mới:
   - **Application Name:** `Next.js Frontend`
   - Click **"Add New Application Password"**
5. Copy **Application Password** (format: `xxxx xxxx xxxx xxxx xxxx xxxx`)
   - ⚠️ **QUAN TRỌNG:** Password chỉ hiển thị 1 lần, copy ngay!

### Step 2: Add vào Environment Variables

Mở `.env.local` và thêm:

```env
# WordPress Application Password (Alternative to WooCommerce REST API key)
WORDPRESS_USERNAME=your_username
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

**Note:** 
- `WORDPRESS_USERNAME` là username để login WordPress (không phải email)
- `WORDPRESS_APP_PASSWORD` là application password vừa tạo (có thể giữ spaces hoặc remove)

### Step 3: Restart Next.js Dev Server

```bash
# Stop dev server (Ctrl+C)
# Start lại
npm run dev
```

### Step 4: Test

```bash
npm run test:woocommerce-api
```

**Expected:** ✅ All tests passed

---

## 🔄 Switch Between Methods

Code đã được update để support cả 2 methods:

1. **WooCommerce REST API key** (preferred):
   ```env
   WOOCOMMERCE_CONSUMER_KEY=ck_...
   WOOCOMMERCE_CONSUMER_SECRET=cs_...
   ```

2. **WordPress Application Password** (fallback):
   ```env
   WORDPRESS_USERNAME=admin
   WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
   ```

Code sẽ tự động dùng method nào có credentials.

---

## 🐛 Troubleshooting

### Error: "Application Passwords" section không hiển thị

**Solution:**
- WordPress 5.6+ mới có Application Passwords
- Update WordPress lên version mới nhất

### Error: "Invalid username or password"

**Solution:**
1. Verify `WORDPRESS_USERNAME` đúng (username, không phải email)
2. Verify `WORDPRESS_APP_PASSWORD` đúng (copy đầy đủ, có thể remove spaces)
3. Verify application password chưa bị revoked

### Error: Vẫn 401

**Solution:**
1. Verify user có **Administrator** role
2. Verify WooCommerce plugin activated
3. Test với WooCommerce REST API key method

---

## 📚 References

- WordPress Application Passwords: https://wordpress.org/support/article/application-passwords/

