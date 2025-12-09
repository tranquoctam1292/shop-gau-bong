# 📦 HƯỚNG DẪN CÀI ĐẶT CUSTOM FUNCTIONS

## 🎯 Mục đích

File này chứa custom functions cho:
- Auto-calculate Volumetric Weight
- CORS headers cho Next.js

## 📋 Cách cài đặt

### Cách 1: Tạo Custom Plugin (Khuyến nghị) ⭐

**Bước 1: Tạo folder plugin**
1. Tạo folder: `C:\xampp\htdocs\wordpress\wp-content\plugins\shop-gaubong-custom`
2. Copy file `plugin-custom-functions.php` vào folder đó
3. Đổi tên thành: `shop-gaubong-custom.php`

**Bước 2: Activate plugin**
1. Vào WordPress Admin: `http://localhost/wordpress/wp-admin`
2. Vào **Plugins**
3. Tìm "Shop Gấu Bông - Custom Functions"
4. Click **Activate**

**✅ Xong!** Plugin sẽ tự động chạy.

---

### Cách 2: Copy vào functions.php của theme

**Lưu ý:** Chỉ làm nếu bạn đang dùng custom theme hoặc child theme.

**Bước 1: Tìm functions.php**
- Path: `C:\xampp\htdocs\wordpress\wp-content\themes\[your-theme]\functions.php`
- Nếu dùng theme mặc định (Twenty Twenty-Four), **KHÔNG nên** sửa trực tiếp
- Nên tạo child theme trước

**Bước 2: Copy code**
1. Mở `functions-custom.php`
2. Copy toàn bộ nội dung
3. Mở `functions.php` của theme
4. Paste vào cuối file (trước dòng `?>` nếu có)

**Bước 3: Save file**

---

## ✅ Verify đã cài đúng

### Test 1: Kiểm tra plugin
1. Vào **Plugins** trong WordPress Admin
2. Tìm "Shop Gấu Bông - Custom Functions"
3. Phải thấy status: **Active**

### Test 2: Test CORS
1. Chạy Next.js: `npm run dev`
2. Mở `http://localhost:3000`
3. GraphQL requests sẽ không bị CORS block

### Test 3: Test Volumetric Weight
1. Tạo product trong WooCommerce
2. Điền Length, Width, Height
3. Save product
4. Verify: Volumetric Weight tự động tính

---

## 🐛 Troubleshooting

### Plugin không hiển thị
- **Nguyên nhân:** Folder hoặc file name sai
- **Giải pháp:** 
  - Folder phải là: `wp-content/plugins/shop-gaubong-custom/`
  - File phải là: `shop-gaubong-custom.php`

### CORS vẫn lỗi
- **Nguyên nhân:** Plugin chưa activate hoặc code chưa được copy
- **Giải pháp:**
  1. Verify plugin đã activate
  2. Clear browser cache
  3. Test từ Next.js app thay vì file HTML local

### Volumetric Weight không tự tính
- **Nguyên nhân:** ACF chưa được cài hoặc fields chưa được tạo
- **Giải pháp:**
  1. Verify ACF đã được cài đặt
  2. Verify fields `length`, `width`, `height` đã được tạo
  3. Save lại product

---

## 📝 Files liên quan

- `wordpress/plugin-custom-functions.php` - Plugin version (khuyến nghị)
- `wordpress/functions-custom.php` - Code để copy vào functions.php
- `docs/FIX_CORS_ERROR.md` - Hướng dẫn fix CORS chi tiết

