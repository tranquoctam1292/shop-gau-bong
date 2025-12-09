# 🚀 Phase 2 Quick Test Guide

## ⚡ Quick Test (5 phút)

### Step 1: Verify API Routes

Mở browser và test các endpoints:

1. **Products API:**
   ```
   http://localhost:3000/api/woocommerce/products?per_page=5
   ```
   Expected: JSON response với `products` array

2. **Categories API:**
   ```
   http://localhost:3000/api/woocommerce/categories
   ```
   Expected: JSON response với `categories` array

3. **Single Product API:**
   ```
   http://localhost:3000/api/woocommerce/products/1
   ```
   Expected: JSON response với `product` object

### Step 2: Visual Test

1. **Homepage:**
   - Mở `http://localhost:3000`
   - Scroll xuống "Danh mục sản phẩm"
   - Verify categories hiển thị

2. **Products Page:**
   - Mở `http://localhost:3000/products`
   - Verify products hiển thị
   - Click vào một product

3. **Product Detail:**
   - Verify product info hiển thị
   - Click "Thêm vào giỏ"
   - Verify cart updates

### Step 3: Console Check

1. Mở Browser DevTools (F12)
2. Check Console tab:
   - ✅ No errors
   - ⚠️ Warnings OK (trừ hydration do extensions)
3. Check Network tab:
   - ✅ API requests thành công (200 status)
   - ✅ No CORS errors

## ✅ Pass Criteria

- [ ] API routes return data
- [ ] Homepage categories hiển thị
- [ ] Products page hiển thị products
- [ ] Product detail page hiển thị đầy đủ
- [ ] Add to cart hoạt động
- [ ] No console errors
- [ ] No network errors

## 🐛 Nếu có lỗi

1. Check `.env.local` có credentials
2. Restart Next.js dev server
3. Check WordPress REST API: `http://localhost/wordpress/wp-json/wc/v3/products`
4. Xem `docs/PHASE2_TESTING_CHECKLIST.md` để debug chi tiết

