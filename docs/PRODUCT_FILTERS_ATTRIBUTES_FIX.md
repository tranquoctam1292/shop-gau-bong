# 🔧 PRODUCT FILTERS ATTRIBUTES FIX

**Date:** 2025-01-XX  
**Status:** ✅ Fixed

---

## 📋 Vấn Đề

Bộ lọc kích thước (size) và màu sắc (color) hiển thị "Không có tùy chọn" mặc dù có sản phẩm với các kích thước và màu sắc khác nhau.

---

## 🔍 Nguyên Nhân

1. **File `useProductAttributes.ts` có code duplicate** - Có 2 phần code giống nhau (dòng 186-238), gây lỗi syntax
2. **Thiếu debug logging** - Không có cách nào để debug tại sao attributes không được extract
3. **Logic extract attributes có thể không match** - Cần kiểm tra xem products có `attributes` field được map đúng không

---

## ✅ Giải Pháp

### 1. **Sửa Code Duplicate**
- Xóa phần code duplicate (dòng 186-238)
- Giữ lại phần code đúng và hoàn chỉnh

### 2. **Thêm Debug Logging**
- Thêm logging khi extract attributes từ products
- Log số lượng products, số products có attributes, và số attributes tìm được
- Thêm warning khi không tìm thấy size/color options

### 3. **Cải Thiện Logic Extract**
- Đảm bảo logic extract attributes từ `product.attributes` đúng
- Hỗ trợ cả `pa_size` và `size` naming conventions
- Hỗ trợ cả `pa_color` và `color` naming conventions

---

## 📝 Files Đã Sửa

1. **`lib/hooks/useProductAttributes.ts`**
   - ✅ Xóa code duplicate
   - ✅ Thêm debug logging khi extract attributes
   - ✅ Thêm warning logging khi không tìm thấy options
   - ✅ Cải thiện logic extract từ products

---

## 🧪 Testing

### Cách Test:
1. Mở browser console (F12)
2. Vào trang `/products`
3. Click vào bộ lọc "Kích thước" hoặc "Màu sắc"
4. Kiểm tra console logs:
   - `[useProductAttributes] Extracted attributes:` - Hiển thị số lượng attributes tìm được
   - `[useProductAttributes] No size options found` - Warning nếu không tìm thấy size options
   - `[useProductAttributes] No color options found` - Warning nếu không tìm thấy color options

### Expected Results:
- Console logs hiển thị attributes được extract từ products
- Bộ lọc hiển thị các options (size, color) thay vì "Không có tùy chọn"
- Nếu vẫn không có options, console logs sẽ giúp debug vấn đề

---

## 🔍 Debug Steps

Nếu vẫn không có options:

1. **Kiểm tra console logs:**
   - Xem `totalProducts` - Có products không?
   - Xem `productsWithAttributes` - Có products có attributes không?
   - Xem `attributesMap` - Có attributes nào được extract không?

2. **Kiểm tra API response:**
   - Mở Network tab trong DevTools
   - Tìm request `/api/cms/products?per_page=100&page=1`
   - Kiểm tra response có field `attributes` trong products không?

3. **Kiểm tra productMapper:**
   - Xem `lib/utils/productMapper.ts`
   - Kiểm tra `mapMongoProduct` có tạo `attributes` array không?
   - Kiểm tra logic extract từ variants có đúng không?

---

## 📊 Expected Data Structure

### Product từ API `/api/cms/products`:
```json
{
  "products": [
    {
      "id": "...",
      "name": "...",
      "attributes": [
        {
          "name": "pa_size",
          "options": ["Nhỏ", "Vừa", "Lớn", "Rất lớn"]
        },
        {
          "name": "pa_color",
          "options": ["Đỏ", "Xanh", "Vàng"]
        }
      ]
    }
  ]
}
```

### Attributes từ `useProductAttributes`:
```typescript
[
  {
    name: "pa_size",
    slug: "size",
    options: ["Nhỏ", "Vừa", "Lớn", "Rất lớn"]
  },
  {
    name: "pa_color",
    slug: "color",
    options: ["Đỏ", "Xanh", "Vàng"]
  }
]
```

---

**Status:** ✅ Ready for Testing
