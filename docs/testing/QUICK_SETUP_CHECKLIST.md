# ✅ QUICK SETUP CHECKLIST - Phase 1

## 🎯 Mục tiêu: Hoàn thành Phase 1 - Setup & Planning

---

## ✅ ĐÃ HOÀN THÀNH

- [x] XAMPP đã cài đặt và chạy
- [x] WordPress đã cài đặt trên XAMPP
- [x] WooCommerce plugin đã cài đặt
- [x] WPGraphQL plugin đã cài đặt
- [x] WPGraphQL WooCommerce extension đã cài đặt
- [x] GraphQL endpoint hoạt động: `http://localhost/wordpress/graphql`
- [x] Query syntax đúng (inline fragment)

---

## 📋 CẦN LÀM TIẾP (Theo thứ tự)

### 1. Cài đặt ACF và Extensions (5 phút)

- [ ] **ACF (Advanced Custom Fields)**
  1. Vào WordPress Admin > Plugins > Add New
  2. Tìm "Advanced Custom Fields"
  3. Install và Activate

- [ ] **WPGraphQL for Advanced Custom Fields**
  1. Vào Plugins > Add New
  2. Tìm "WPGraphQL for Advanced Custom Fields"
  3. Install và Activate

### 2. Setup Custom Fields (15 phút)

- [ ] **Tạo Field Group "Product Specs"**
  1. Vào **Custom Fields > Add New**
  2. Field Group Name: `Product Specs`
  3. Location Rules: Show if **Post Type** is equal to **Product**

- [ ] **Thêm các Fields:**
  - [ ] `length` (Number, Required) - Chiều dài (cm)
  - [ ] `width` (Number, Required) - Chiều rộng (cm)
  - [ ] `height` (Number, Required) - Chiều cao (cm)
  - [ ] `volumetric_weight` (Number) - Cân nặng quy đổi (auto-calculate)
  - [ ] `material` (Text) - Chất liệu
  - [ ] `origin` (Text) - Xuất xứ

**Xem chi tiết:** `docs/WORDPRESS_SETUP_GUIDE.md` - Bước 4

### 3. Copy Custom Functions (2 phút)

- [ ] Copy nội dung từ `wordpress/functions-custom.php`
- [ ] Paste vào `functions.php` của theme:
  - Path: `C:\xampp\htdocs\wordpress\wp-content\themes\[your-theme]\functions.php`
  - Hoặc tạo custom plugin

**Lưu ý:** Nếu theme là Twenty Twenty-Four hoặc theme mặc định, nên tạo child theme hoặc custom plugin.

### 4. Configure WooCommerce (10 phút)

- [ ] **Store Settings:**
  1. Vào **WooCommerce > Settings > General**
  2. Country: **Vietnam**
  3. Currency: **Vietnamese Dong (₫)**

- [ ] **Shipping:**
  1. Vào **WooCommerce > Settings > Shipping**
  2. Tạo shipping zone "Vietnam"
  3. Add shipping method: Flat rate (sẽ config sau)

- [ ] **Tax:**
  1. Vào **WooCommerce > Settings > Tax**
  2. Enable taxes: **Yes**
  3. Prices entered with tax: **Yes, I will enter prices inclusive of tax**

### 5. Tạo Sample Products (20 phút)

- [ ] **Tạo Product Categories:**
  1. Vào **Products > Categories**
  2. Tạo: "Gấu bông nhỏ", "Gấu bông lớn", "Gấu bông theo chủ đề"

- [ ] **Tạo 2-3 Sample Products:**
  1. Vào **Products > Add New**
  2. Điền thông tin:
     - Name, Description, Price
     - Upload Product Image
     - Chọn Category
  3. **Quan trọng:** Điền Custom Fields:
     - Length: 50 (cm)
     - Width: 40 (cm)
     - Height: 30 (cm)
     - Material: "Bông gòn 4D"
     - Origin: "Việt Nam"
  4. Verify: Volumetric Weight tự động tính = (50 × 40 × 30) / 6000 = 10kg
  5. Publish

**Xem chi tiết:** `docs/WORDPRESS_SETUP_GUIDE.md` - Bước 7

### 6. Setup Next.js Environment (5 phút)

- [ ] **Tạo `.env.local`:**
  ```env
  NEXT_PUBLIC_WORDPRESS_URL=http://localhost/wordpress
  NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost/wordpress/graphql
  ```

- [ ] **Verify:** File `.env.local` đã được tạo trong root project

### 7. Enable GraphQL Introspection (2 phút)

- [ ] **Vào WordPress Admin:**
  1. Vào **GraphQL > Settings**
  2. Tìm phần **"Public Introspection"** hoặc **"Access Control"**
  3. ✅ **Enable "Allow Public Introspection"**
  4. Click **Save Changes**

**Xem chi tiết:** `docs/FIX_GRAPHQL_INTROSPECTION.md`

### 8. Generate GraphQL Types (2 phút)

- [ ] **Chạy codegen:**
  ```bash
  npm run codegen
  ```

- [ ] **Verify:** File `types/generated/graphql.ts` đã được tạo

### 8. Test End-to-End (5 phút)

- [ ] **Test GraphQL với products:**
  1. Mở `test-graphql.html`
  2. Run Query
  3. Verify: Thấy products trong response

- [ ] **Test với Custom Fields:**
  ```graphql
  query {
    products(first: 1) {
      nodes {
        ... on SimpleProduct {
          id
          name
          price
          productSpecs {
            length
            width
            height
            volumetricWeight
          }
        }
      }
    }
  }
  ```

---

## ✅ HOÀN THÀNH PHASE 1

Sau khi hoàn thành tất cả các bước trên, bạn sẽ có:

- ✅ WordPress local hoàn chỉnh với WooCommerce
- ✅ WPGraphQL endpoint hoạt động
- ✅ Custom Fields cho products
- ✅ Sample products với volumetric weight
- ✅ Next.js environment configured
- ✅ GraphQL types generated
- ✅ Ready cho Phase 2: Core Features

---

## 📚 Tài liệu tham khảo

- `docs/WORDPRESS_SETUP_GUIDE.md` - Hướng dẫn chi tiết
- `wordpress/functions-custom.php` - Custom functions code
- `TIEN_DO_DU_AN.md` - Theo dõi tiến độ đầy đủ

---

## 🆘 Nếu gặp vấn đề

- **Custom Fields không hiển thị:** Kiểm tra ACF và WPGraphQL ACF đã activate
- **Volumetric weight không tự tính:** Kiểm tra custom functions đã copy vào functions.php
- **GraphQL không thấy productSpecs:** Verify ACF fields đã được expose qua GraphQL
- **Codegen lỗi:** Kiểm tra `.env.local` và GraphQL endpoint accessible

