# 📋 PRODUCT QUICK EDIT - MANUAL TEST GUIDE

**Ngày tạo:** 17/12/2025  
**Mục đích:** Hướng dẫn test thủ công tính năng Quick Edit

---

## 🎯 PREPARATION

### 1. Đảm bảo môi trường sẵn sàng
- ✅ Dev server đang chạy: `npm run dev`
- ✅ Đã đăng nhập vào admin panel
- ✅ Có ít nhất 1 sản phẩm trong database (simple product)
- ✅ Có ít nhất 1 sản phẩm có variants (variable product)

### 2. Truy cập Product List
- URL: `http://localhost:3000/admin/products`
- Đảm bảo bạn thấy danh sách sản phẩm

---

## 🧪 TEST CASES

### Test 1: Mở Quick Edit Dialog

**Steps:**
1. Tìm một sản phẩm trong danh sách
2. Click vào menu "..." (MoreHorizontal icon) ở cột "Hành động"
3. Chọn "Sửa nhanh" từ dropdown menu

**Expected Results:**
- ✅ Dialog mở ra (trên desktop)
- ✅ Sheet mở ra từ dưới lên (trên mobile)
- ✅ Form hiển thị đầy đủ các fields:
  - Tên sản phẩm
  - SKU
  - Trạng thái
  - Giá thường
  - Giá khuyến mãi
  - Quản lý kho (checkbox)
  - Số lượng tồn kho (nếu manageStock = true)
  - Trạng thái kho (nếu manageStock = true)
  - Biến thể (nếu product có variants)

---

### Test 2: Update Product Name

**Steps:**
1. Mở Quick Edit dialog
2. Thay đổi "Tên sản phẩm"
3. Click "Lưu thay đổi"

**Expected Results:**
- ✅ Form validation pass
- ✅ API call thành công
- ✅ Product name được cập nhật
- ✅ Dialog đóng lại
- ✅ Product list tự động refresh
- ✅ Toast notification hiển thị "Đã cập nhật sản phẩm thành công"

---

### Test 3: Update Price Fields

**Steps:**
1. Mở Quick Edit dialog
2. Thay đổi "Giá thường" (ví dụ: 500000)
3. Thay đổi "Giá khuyến mãi" (ví dụ: 400000)
4. Click "Lưu thay đổi"

**Expected Results:**
- ✅ Prices được cập nhật
- ✅ Sale dates được xóa (nếu salePrice bị xóa)
- ✅ Validation: salePrice < regularPrice

**Test Invalid Case:**
- Thử set salePrice > regularPrice
- Expected: Validation error, form không submit

---

### Test 4: Update Stock Fields

**Steps:**
1. Mở Quick Edit dialog
2. Check "Quản lý kho"
3. Nhập "Số lượng tồn kho" (ví dụ: 100)
4. Chọn "Trạng thái kho" = "Còn hàng"
5. Click "Lưu thay đổi"

**Expected Results:**
- ✅ Stock fields được cập nhật
- ✅ manageStock = true
- ✅ stockQuantity = 100
- ✅ stockStatus = 'instock'

---

### Test 5: Auto-Sync Stock Status

**Steps:**
1. Mở Quick Edit dialog
2. Check "Quản lý kho"
3. Set "Số lượng tồn kho" = 0
4. **KHÔNG** thay đổi "Trạng thái kho"
5. Click "Lưu thay đổi"

**Expected Results:**
- ✅ stockStatus tự động chuyển thành "Hết hàng" (outofstock)
- ✅ Auto-sync hoạt động đúng

**Test với onbackorder:**
1. Set "Trạng thái kho" = "Đặt hàng trước" (onbackorder)
2. Thay đổi "Số lượng tồn kho" = 50
3. Click "Lưu thay đổi"

**Expected Results:**
- ✅ stockStatus vẫn là "Đặt hàng trước" (không auto-sync)
- ✅ onbackorder status được tôn trọng

---

### Test 6: Disable Manage Stock

**Steps:**
1. Mở Quick Edit dialog
2. Uncheck "Quản lý kho"
3. Click "Lưu thay đổi"

**Expected Results:**
- ✅ manageStock = false
- ✅ stockQuantity được clear (set về 0 hoặc null)
- ✅ Stock fields bị ẩn

---

### Test 7: Update Status

**Steps:**
1. Mở Quick Edit dialog
2. Thay đổi "Trạng thái" = "Bản nháp" (draft)
3. Click "Lưu thay đổi"

**Expected Results:**
- ✅ Product status được cập nhật
- ✅ Product có thể biến mất khỏi danh sách (nếu filter = publish)

---

### Test 8: Update SKU

**Steps:**
1. Mở Quick Edit dialog
2. Thay đổi "SKU"
3. Click "Lưu thay đổi"

**Expected Results:**
- ✅ SKU được cập nhật
- ✅ Validation: SKU có thể để trống (optional)

---

### Test 9: Dirty Check

**Steps:**
1. Mở Quick Edit dialog
2. Thay đổi bất kỳ field nào
3. Click "Hủy" hoặc click outside dialog

**Expected Results:**
- ✅ Confirm dialog xuất hiện: "Bạn có thay đổi chưa lưu"
- ✅ Options: "Hủy" hoặc "Thoát"
- ✅ Nếu chọn "Thoát": Dialog đóng, thay đổi bị mất
- ✅ Nếu chọn "Hủy": Quay lại form

**Test không có thay đổi:**
1. Mở Quick Edit dialog
2. **KHÔNG** thay đổi gì
3. Click "Hủy"

**Expected Results:**
- ✅ Dialog đóng ngay lập tức (không có confirm dialog)

---

### Test 10: Variant Editing (nếu product có variants)

**Steps:**
1. Mở Quick Edit dialog cho product có variants
2. Scroll xuống phần "Biến thể sản phẩm"
3. Click vào cell "SKU" của một variant
4. Nhập SKU mới
5. Press Enter hoặc click outside

**Expected Results:**
- ✅ Variant SKU được cập nhật
- ✅ Inline editing hoạt động mượt mà

**Test Bulk Update:**
1. Check "Áp dụng chung cho tất cả biến thể"
2. Nhập "SKU chung", "Giá chung", "Số lượng chung"
3. Click "Áp dụng cho tất cả"

**Expected Results:**
- ✅ Tất cả variants được cập nhật với giá trị chung
- ✅ Bulk update hoạt động đúng

---

### Test 11: Version Mismatch (Concurrent Edit)

**Steps:**
1. Mở Quick Edit dialog cho product A
2. Trong tab khác, mở và edit product A (full edit form)
3. Save changes trong tab 2 (version tăng lên)
4. Quay lại tab 1, thử save Quick Edit

**Expected Results:**
- ✅ Error toast: "Sản phẩm đã được chỉnh sửa bởi người khác. Vui lòng làm mới và thử lại."
- ✅ Form không submit
- ✅ Status code: 409 (VERSION_MISMATCH)

---

### Test 12: Responsive Design

**Desktop:**
1. Mở Quick Edit trên desktop (width > 768px)
2. Expected: Dialog component (centered modal)

**Mobile:**
1. Mở Quick Edit trên mobile (width < 768px)
2. Expected: Sheet component (slide up from bottom)

**Test:**
- Resize browser window
- Check component thay đổi giữa Dialog và Sheet

---

### Test 13: Form Validation

**Test Cases:**
1. **Empty name:** Xóa tên sản phẩm → Expected: Validation error
2. **Invalid sale price:** salePrice > regularPrice → Expected: Validation error
3. **Negative price:** regularPrice = -1000 → Expected: Validation error
4. **Negative stock:** stockQuantity = -10 → Expected: Validation error

**Expected Results:**
- ✅ Validation errors hiển thị dưới input fields
- ✅ Form không submit khi có validation errors
- ✅ Error messages rõ ràng, dễ hiểu

---

### Test 14: Loading States

**Steps:**
1. Mở Quick Edit dialog
2. Thay đổi một field
3. Click "Lưu thay đổi"

**Expected Results:**
- ✅ Button hiển thị "Đang lưu..." với spinner
- ✅ Form bị disable trong lúc submit
- ✅ Không thể click "Hủy" trong lúc submit

---

### Test 15: Error Handling

**Test Network Error:**
1. Mở Quick Edit dialog
2. Disconnect internet (hoặc stop dev server)
3. Thử save

**Expected Results:**
- ✅ Error toast hiển thị
- ✅ Form không submit
- ✅ User có thể retry

**Test Invalid Product ID:**
1. Manually navigate to: `/api/admin/products/invalid-id/quick-update`
2. Expected: 404 error

---

## 📊 TEST CHECKLIST

Copy checklist này và đánh dấu khi test:

```
[ ] Test 1: Mở Quick Edit Dialog
[ ] Test 2: Update Product Name
[ ] Test 3: Update Price Fields
[ ] Test 4: Update Stock Fields
[ ] Test 5: Auto-Sync Stock Status
[ ] Test 6: Disable Manage Stock
[ ] Test 7: Update Status
[ ] Test 8: Update SKU
[ ] Test 9: Dirty Check
[ ] Test 10: Variant Editing (nếu có)
[ ] Test 11: Version Mismatch
[ ] Test 12: Responsive Design
[ ] Test 13: Form Validation
[ ] Test 14: Loading States
[ ] Test 15: Error Handling
```

---

## 🐛 REPORTING BUGS

Nếu phát hiện bug, ghi lại:
1. **Test Case:** Test số mấy?
2. **Steps to Reproduce:** Các bước để reproduce bug
3. **Expected Result:** Kết quả mong đợi
4. **Actual Result:** Kết quả thực tế
5. **Screenshots:** (nếu có)
6. **Browser/Device:** Chrome/Firefox, Desktop/Mobile

---

## ✅ SIGN-OFF

Sau khi hoàn thành tất cả tests:

- **Tester Name:** ________________
- **Date:** ________________
- **Status:** [ ] All Passed [ ] Issues Found
- **Notes:** ________________

---

**Happy Testing! 🚀**

