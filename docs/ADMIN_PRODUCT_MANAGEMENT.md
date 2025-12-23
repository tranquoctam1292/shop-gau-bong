# Admin Product Management - Verification Guide

## ✅ Mục tiêu

Verify rằng WordPress Admin có thể quản lý sản phẩm đầy đủ với tất cả custom fields cần thiết cho tính năng volumetric weight shipping.

## 📋 Checklist Verification

### ADM-001: Verify WordPress Admin có thể quản lý sản phẩm

#### 1. Tạo/Sửa/Xóa sản phẩm ✅
**Cách verify:**
1. Đăng nhập WordPress Admin: `http://localhost/wordpress/wp-admin`
2. Vào **Products > Add New**
3. Tạo sản phẩm mới với:
   - Tên sản phẩm
   - Mô tả
   - Giá
   - Hình ảnh
4. Click **Publish**
5. Verify sản phẩm xuất hiện trong **Products > All Products**
6. Edit sản phẩm và verify có thể sửa
7. Delete sản phẩm và verify có thể xóa

**Expected Result:** ✅ Có thể tạo/sửa/xóa sản phẩm thành công

#### 2. Upload hình ảnh ✅
**Cách verify:**
1. Khi tạo/sửa sản phẩm, click **Set product image**
2. Upload hình ảnh từ máy tính
3. Set làm **Product image**
4. Có thể thêm **Product gallery** (nhiều hình)
5. Save sản phẩm
6. Verify hình ảnh hiển thị trong frontend

**Expected Result:** ✅ Hình ảnh upload và hiển thị đúng

#### 3. Nhập đầy đủ kích thước (length, width, height) ✅
**Cách verify:**
1. Khi tạo/sửa sản phẩm, scroll xuống phần **Product Specs** (ACF Fields)
2. Nhập các giá trị:
   - **Length** (cm): Ví dụ `30`
   - **Width** (cm): Ví dụ `25`
   - **Height** (cm): Ví dụ `40`
3. Save sản phẩm
4. Verify các giá trị được lưu
5. Refresh page và verify giá trị vẫn còn

**Expected Result:** ✅ Có thể nhập và lưu length, width, height

**Lưu ý:** Nếu không thấy fields này, cần:
- Install ACF plugin
- Tạo Field Group "Product Specs" với các fields:
  - `length` (Number)
  - `width` (Number)
  - `height` (Number)
  - `material` (Text)
  - `origin` (Text)
- Set Location Rules: Show if Post Type is equal to Product

Xem chi tiết: `docs/ACF_SETUP_GUIDE.md`

#### 4. Xem volumetric weight auto-calculated ✅
**Cách verify:**
1. Sau khi nhập length, width, height và save
2. Refresh page hoặc edit lại sản phẩm
3. Kiểm tra field **Volumetric Weight** trong Product Specs
4. Verify giá trị được tính tự động: `(L × W × H) / 6000`

**Ví dụ:**
- Length: 30cm, Width: 25cm, Height: 40cm
- Volumetric Weight = (30 × 25 × 40) / 6000 = 5 kg

**Expected Result:** ✅ Volumetric weight tự động tính và hiển thị

**Lưu ý:** Cần có custom function trong WordPress để auto-calculate. Xem: `wordpress/plugin-custom-functions.php`

#### 5. Quản lý đơn hàng ✅
**Cách verify:**
1. Vào **WooCommerce > Orders**
2. Verify có thể xem danh sách đơn hàng
3. Click vào một đơn hàng để xem chi tiết
4. Verify có thể:
   - Xem thông tin khách hàng
   - Xem sản phẩm trong đơn hàng
   - Xem tổng tiền
   - Cập nhật trạng thái đơn hàng
   - Thêm ghi chú

**Expected Result:** ✅ Có thể quản lý đơn hàng đầy đủ

## 🔧 Setup Requirements

### 1. ACF (Advanced Custom Fields) Plugin
- ✅ Install ACF plugin
- ✅ Tạo Field Group "Product Specs"
- ✅ Add fields: length, width, height, material, origin
- ✅ Set Location Rules cho Product post type

### 2. Custom Functions Plugin
- ✅ Install custom plugin: `wordpress/plugin-custom-functions.php`
- ✅ Function `calculate_volumetric_weight` tự động tính khi save product
- ✅ Function `add_cors_http_header` cho CORS

### 3. WooCommerce Setup
- ✅ WooCommerce plugin installed
- ✅ Product post type enabled
- ✅ Orders management enabled

## 📝 Testing Steps

### Test Case 1: Tạo sản phẩm với đầy đủ thông tin
1. Tạo sản phẩm mới
2. Nhập: Name, Description, Price, Image
3. Nhập: Length=30, Width=25, Height=40
4. Save
5. **Verify:** Volumetric Weight = 5 kg (auto-calculated)

### Test Case 2: Sửa kích thước sản phẩm
1. Edit sản phẩm
2. Thay đổi Length từ 30 → 35
3. Save
4. **Verify:** Volumetric Weight tự động update = 5.83 kg

### Test Case 3: Xóa sản phẩm
1. Vào Products > All Products
2. Hover vào sản phẩm → Trash
3. **Verify:** Sản phẩm bị xóa (hoặc move to trash)

### Test Case 4: Quản lý đơn hàng
1. Tạo đơn hàng test từ frontend
2. Vào WooCommerce > Orders
3. **Verify:** Đơn hàng xuất hiện với đầy đủ thông tin

## ✅ Verification Checklist

- [ ] Có thể tạo sản phẩm mới
- [ ] Có thể upload hình ảnh sản phẩm
- [ ] Có thể nhập length, width, height
- [ ] Volumetric weight tự động tính khi save
- [ ] Có thể sửa sản phẩm
- [ ] Có thể xóa sản phẩm
- [ ] Có thể xem danh sách đơn hàng
- [ ] Có thể xem chi tiết đơn hàng
- [ ] Có thể cập nhật trạng thái đơn hàng

## 🚨 Troubleshooting

### Không thấy Product Specs fields
→ Cần install ACF và tạo Field Group. Xem: `docs/ACF_SETUP_GUIDE.md`

### Volumetric weight không tự động tính
→ Kiểm tra custom plugin đã được activate chưa. Xem: `wordpress/plugin-custom-functions.php`

### Không thể upload hình ảnh
→ Kiểm tra WordPress file permissions và upload directory

### Đơn hàng không xuất hiện
→ Kiểm tra WooCommerce đã được setup đúng chưa

