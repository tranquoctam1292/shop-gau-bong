# 📋 LOCAL DEVELOPMENT CHECKLIST

## 🎯 Mục tiêu

Hoàn thiện website trên môi trường **Local (XAMPP)** trước khi deploy lên hosting và Vercel.

**Chiến lược:** 
- ✅ Tập trung hoàn thiện trên Local
- ⏳ Deploy lên Hosting & Vercel sau khi Local đã hoàn thiện

---

## ✅ ĐÃ HOÀN THÀNH (Local)

### WordPress Local Setup
- [x] WordPress 6.0+ đã cài đặt trên XAMPP
- [x] WooCommerce plugin đã cài đặt
- [x] WPGraphQL plugin đã cài đặt
- [x] WPGraphQL WooCommerce extension đã cài đặt
- [x] GraphQL endpoint hoạt động: `http://localhost/wordpress/graphql`

### Next.js Local Setup
- [x] Next.js project đã khởi tạo
- [x] Dependencies đã cài đặt
- [x] GraphQL client (Apollo Client) đã setup
- [x] Environment variables (`.env.local`) đã cấu hình
- [x] Base components đã tạo
- [x] Routing structure đã setup

### Code & Features
- [x] Phase 2: Core Features (100%)
- [x] Phase 3: Advanced Features (85%)
- [x] Phase 4: Polish & Optimization (90%)
- [x] Phase 5: Documentation & Guides (60%)

---

## 🚧 CẦN HOÀN THIỆN TRÊN LOCAL

### 1. WordPress Local Configuration

#### WP-LOCAL-003: Configure WooCommerce
- [ ] **Chạy WooCommerce Setup Wizard:**
  - Store address (địa chỉ shop)
  - Currency: VND (₫)
  - Payment methods (Test Mode)
  - Shipping zones
- [ ] **Tạo Product Categories:**
  - Gấu bông nhỏ
  - Gấu bông vừa
  - Gấu bông lớn
  - Gấu bông cao cấp
- [ ] **Thêm Sample Products:**
  - Xem hướng dẫn: `docs/ADD_PRODUCTS_WORDPRESS.md`
  - Đảm bảo có đầy đủ dimensions (length, width, height)
  - Test với các kích thước khác nhau

#### WP-LOCAL-004: Setup Custom Fields (ACF)
- [ ] **Install ACF (Advanced Custom Fields):**
  - Vào WordPress Admin > Plugins > Add New
  - Search "Advanced Custom Fields"
  - Install version 6.0+
  - Activate
- [ ] **Install WPGraphQL ACF Extension:**
  - Search "WPGraphQL for Advanced Custom Fields"
  - Install và Activate
- [ ] **Tạo Field Group "Product Specs":**
  - Vào Custom Fields > Add New
  - Field Group Name: "Product Specs"
  - Location Rules: Show if Post Type is equal to Product
- [ ] **Thêm các fields:**
  - Length (cm) - Number field
  - Width (cm) - Number field
  - Height (cm) - Number field
  - Volumetric Weight (kg) - Number field (read-only, auto-calculate)
  - Material - Text field
  - Origin - Text field
- [ ] **Publish Field Group**

#### WP-LOCAL-005: Configure Payment & Shipping
- [ ] **Configure Payment Gateways (Test Mode):**
  - WooCommerce > Settings > Payments
  - Enable COD (Cash on Delivery)
  - Enable Bank Transfer (BACS)
  - Configure VietQR (nếu có plugin) - Test Mode
  - Configure MoMo (nếu có plugin) - Test Mode
- [ ] **Setup Shipping Zones:**
  - WooCommerce > Settings > Shipping
  - Add zone: "Vietnam"
  - Add shipping method: Custom Shipping hoặc Flat Rate
- [ ] **Configure Shipping Calculation:**
  - Setup tính phí theo weight
  - Verify volumetric weight calculation

#### WP-LOCAL-006: Custom Functions
- [ ] **Copy Custom Functions:**
  - Copy từ `wordpress/functions-custom.php` hoặc `wordpress/plugin-custom-functions.php`
  - Paste vào theme's `functions.php` hoặc tạo custom plugin
  - Functions bao gồm:
    - Auto-calculate volumetric weight
    - CORS headers cho GraphQL
- [ ] **Activate Custom Plugin** (nếu tạo plugin)

### 2. Next.js Local Development

#### NX-007: Generate GraphQL Types
- [ ] **Enable GraphQL Introspection:**
  - Vào WordPress Admin > GraphQL > Settings
  - Enable "Public Introspection" hoặc "Allow Public Introspection"
- [ ] **Generate Types:**
  ```bash
  npm run codegen
  ```
- [ ] **Verify Types Generated:**
  - Check `types/generated/graphql.ts`
  - Verify có đầy đủ types cho Product, Order, Cart, etc.

#### NX-005: Complete UI Components
- [ ] **Input Component:**
  - Tạo component với validation
  - Mobile-friendly (touch targets 44x44px)
- [ ] **Select Component:**
  - Dropdown với search (nếu cần)
  - Mobile-friendly
- [ ] **Modal/Dialog Component:**
  - Reusable modal component
  - Mobile-friendly

### 3. Testing & Bug Fixes

#### Local Testing
- [ ] **Test Product Browsing:**
  - Browse products list
  - Filter by category
  - Search products
  - View product detail
- [ ] **Test Shopping Cart:**
  - Add to cart
  - Update quantity
  - Remove items
  - Cart drawer
- [ ] **Test Checkout:**
  - Fill checkout form
  - Select payment method
  - Create order
  - Order confirmation
- [ ] **Test User Account:**
  - Login/Register
  - View orders
  - View order detail
  - Manage addresses
- [ ] **Test Payment Methods:**
  - COD flow
  - Bank Transfer flow
  - VietQR (nếu có test account)
  - MoMo (nếu có test account)
- [ ] **Test Shipping Calculation:**
  - Products với dimensions
  - Products không có dimensions
  - Different provinces
  - Cart shipping estimate

#### Bug Fixes
- [ ] **Fix Price Format Issue:**
  - ✅ Đã fix: `formatPrice` tự động nhân 1000 nếu giá < 1000
  - [ ] Verify giá hiển thị đúng trên tất cả pages
- [ ] **Fix any console errors**
- [ ] **Fix any TypeScript errors**
- [ ] **Fix mobile layout issues**
- [ ] **Fix GraphQL query errors**

### 4. Content & Data

#### Add Products
- [ ] **Tạo ít nhất 10-20 sample products:**
  - Đa dạng kích thước (nhỏ, vừa, lớn)
  - Đa dạng giá (từ 100k đến 2 triệu)
  - Đầy đủ thông tin (images, descriptions, specs)
  - Xem: `docs/ADD_PRODUCTS_WORDPRESS.md`
- [ ] **Verify Products trong GraphQL:**
  - Test query: `npm run test:graphql`
  - Verify tất cả fields đều có data

#### Add Blog Posts (Optional)
- [ ] **Tạo sample blog posts:**
  - Categories
  - Tags
  - Featured images
  - Content

### 5. Performance & Optimization

#### Local Performance
- [ ] **Run Lighthouse Audit:**
  ```bash
  npm run test:lighthouse
  ```
- [ ] **Run Performance Test:**
  ```bash
  npm run test:performance
  ```
- [ ] **Optimize based on results:**
  - Fix performance issues
  - Optimize images
  - Reduce bundle size

#### Code Quality
- [ ] **Run TypeScript Check:**
  ```bash
  npm run type-check
  ```
- [ ] **Run Linter:**
  ```bash
  npm run lint
  ```
- [ ] **Fix all errors**

### 6. Testing

#### Unit Tests
- [ ] **Run Unit Tests:**
  ```bash
  npm test
  ```
- [ ] **Fix failing tests**

#### Integration Tests
- [ ] **Run Integration Tests:**
  ```bash
  npm run test:integration
  ```
- [ ] **Fix failing tests**

#### E2E Tests
- [ ] **Run E2E Tests:**
  ```bash
  npm run test:e2e
  ```
- [ ] **Add products to WordPress** để tests pass
- [ ] **Fix failing tests**

---

## 📊 Tiến độ Local Development

**Overall:** ~70% hoàn thành

**By Area:**
- WordPress Setup: 60% (cần ACF, Custom Fields, Products)
- Next.js Setup: 95% (cần generate types, complete UI components)
- Features: 90% (đã hoàn thành hầu hết)
- Testing: 80% (cần add products để tests pass)
- Content: 20% (cần add products và content)

---

## 🎯 Ưu tiên (Theo thứ tự)

### Priority 1: Essential Setup
1. **Install ACF & Setup Custom Fields** (30 phút)
2. **Add Sample Products** (1-2 giờ)
3. **Generate GraphQL Types** (5 phút)
4. **Test tất cả features** (2-3 giờ)

### Priority 2: Bug Fixes & Polish
5. **Fix price format issue** ✅ (đã fix)
6. **Fix any console errors**
7. **Fix mobile layout issues**
8. **Run và fix tests**

### Priority 3: Content & Testing
9. **Add more products** (10-20 products)
10. **Add blog posts** (optional)
11. **Comprehensive testing**
12. **Performance optimization**

---

## ✅ Completion Criteria (Before Deployment)

Trước khi deploy lên hosting và Vercel, đảm bảo:

- [ ] **WordPress Local hoàn thiện:**
  - [ ] ACF và Custom Fields setup
  - [ ] Có ít nhất 10-20 products với đầy đủ thông tin
  - [ ] Payment gateways configured (Test Mode)
  - [ ] Shipping zones configured
  - [ ] GraphQL working correctly

- [ ] **Next.js Local hoàn thiện:**
  - [ ] GraphQL types generated
  - [ ] Tất cả features working
  - [ ] No console errors
  - [ ] No TypeScript errors
  - [ ] Mobile responsive verified

- [ ] **Testing hoàn thiện:**
  - [ ] Unit tests passing
  - [ ] Integration tests passing
  - [ ] E2E tests passing (cần products)
  - [ ] Manual testing completed

- [ ] **Performance:**
  - [ ] Lighthouse score > 80
  - [ ] Core Web Vitals acceptable
  - [ ] Bundle size optimized

---

## 📝 Notes

- **Focus:** Hoàn thiện trên Local trước
- **Deployment:** Sẽ làm sau khi Local đã hoàn thiện
- **Timeline:** Không gấp, tập trung vào chất lượng

---

## 🔗 Related Documents

- **Add Products:** `docs/ADD_PRODUCTS_WORDPRESS.md`
- **ACF Setup:** `docs/ACF_SETUP_GUIDE.md`
- **WordPress Setup:** `docs/WORDPRESS_SETUP_GUIDE.md`
- **Manual Tasks:** `docs/MANUAL_TASKS_CHECKLIST.md` (cho deployment)

---

**Last Updated:** 2024-12-20  
**Status:** 🟡 In Progress - Focusing on Local Development

