# 🚀 HƯỚNG DẪN SETUP NHANH

## ✅ Đã hoàn thành
- [x] XAMPP đã cài đặt
- [x] WordPress đã cài đặt trên XAMPP

## 📋 Bước tiếp theo

### 1. Cài đặt Plugins WordPress (15 phút)

Truy cập WordPress Admin: `http://localhost/wordpress/wp-admin`

Cài đặt các plugins sau (theo thứ tự):

1. **WooCommerce** - E-commerce plugin (có trong repository)
2. **WPGraphQL** - GraphQL API (có trong repository)
3. **WPGraphQL for WooCommerce** - GraphQL cho WooCommerce ⚠️ **Phải tải từ GitHub**
4. **Advanced Custom Fields (ACF)** - Custom fields (có trong repository)
5. **WPGraphQL for Advanced Custom Fields** - Expose ACF qua GraphQL (có trong repository)

**Xem chi tiết:** 
- `docs/WORDPRESS_SETUP_GUIDE.md` - Hướng dẫn tổng thể
- `docs/INSTALL_WPGraphQL_WOOCOMMERCE.md` - Hướng dẫn cài WPGraphQL for WooCommerce từ GitHub

### 2. Setup Custom Fields (10 phút)

1. Vào **Custom Fields > Add New**
2. Tạo Field Group "Product Specs"
3. Thêm các fields:
   - `length` (Number, Required)
   - `width` (Number, Required)
   - `height` (Number, Required)
   - `volumetric_weight` (Number, Auto-calculate)
   - `material` (Text)
   - `origin` (Text)

**Xem chi tiết:** `docs/WORDPRESS_SETUP_GUIDE.md` - Bước 4

### 3. Copy Custom Functions (2 phút)

Copy nội dung từ `wordpress/functions-custom.php` vào `functions.php` của theme hoặc tạo custom plugin.

Hoặc copy vào: `C:\xampp\htdocs\wordpress\wp-content\themes\[your-theme]\functions.php`

### 4. Cấu hình Environment Variables (1 phút)

Tạo file `.env.local` trong root project:

```env
NEXT_PUBLIC_WORDPRESS_URL=http://localhost/wordpress
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost/wordpress/graphql
```

### 5. Test GraphQL Connection (1 phút)

```bash
npm run test:graphql
```

Hoặc truy cập: `http://localhost/wordpress/graphql` trong browser.

### 6. Generate GraphQL Types (1 phút)

```bash
npm run codegen
```

Sau khi chạy, types sẽ được generate vào `types/generated/graphql.ts`

### 7. Tạo Sample Products (10 phút)

1. Vào **Products > Add New**
2. Tạo 2-3 sản phẩm mẫu
3. **Quan trọng:** Điền đầy đủ Length, Width, Height
4. Verify Volumetric Weight tự động tính

## ✅ Checklist hoàn thành Phase 1 - WordPress Local

- [ ] WooCommerce installed & activated
- [ ] WPGraphQL installed & activated
- [ ] WPGraphQL WooCommerce installed & activated
- [ ] ACF installed & activated
- [ ] WPGraphQL ACF installed & activated
- [ ] Custom Fields created (length, width, height, volumetric_weight)
- [ ] Custom functions copied (auto-calculate + CORS)
- [ ] GraphQL endpoint working: `http://localhost/wordpress/graphql`
- [ ] Test GraphQL query successful
- [ ] Sample products created
- [ ] `.env.local` configured
- [ ] GraphQL types generated

## 🔗 Links hữu ích

- WordPress Admin: `http://localhost/wordpress/wp-admin`
- GraphQL Endpoint: `http://localhost/wordpress/graphql`
- Products: `http://localhost/wordpress/wp-admin/edit.php?post_type=product`
- ACF Fields: `http://localhost/wordpress/wp-admin/edit.php?post_type=acf-field-group`

## 📚 Tài liệu chi tiết

- `docs/WORDPRESS_SETUP_GUIDE.md` - Hướng dẫn setup WordPress chi tiết
- `HUONG_DAN_CAU_HINH.md` - Hướng dẫn cấu hình tổng thể
- `TIEN_DO_DU_AN.md` - Theo dõi tiến độ

