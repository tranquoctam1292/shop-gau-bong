# ✅ Phase 2 Testing Checklist

## 📋 Tổng quan

Test Phase 2: Migrate Products từ WPGraphQL sang WooCommerce REST API.

## 🔧 Pre-requisites

- [ ] WordPress đang chạy
- [ ] WooCommerce đã được cài đặt và có products
- [ ] REST API credentials đã được setup trong `.env.local`:
  ```env
  WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  NEXT_PUBLIC_WORDPRESS_URL=http://localhost/wordpress
  ```
- [ ] Next.js dev server đã được restart sau khi thêm credentials
- [ ] Có ít nhất 3-5 products trong WordPress
- [ ] Có ít nhất 2-3 categories trong WordPress

---

## 🧪 Test Cases

### 1. Homepage - Category Grid

**URL:** `http://localhost:3000`

**Test Steps:**
1. [ ] Mở homepage
2. [ ] Scroll xuống phần "Danh mục sản phẩm"
3. [ ] Verify categories hiển thị đúng (2 cols mobile, 4 cols desktop)
4. [ ] Verify category images hiển thị (hoặc placeholder)
5. [ ] Verify category names hiển thị đúng
6. [ ] Verify product count hiển thị (nếu có)
7. [ ] Click vào một category
8. [ ] Verify redirect đến `/products?category=slug` đúng

**Expected Results:**
- Categories load thành công
- Layout responsive (2 cols mobile, 4 cols desktop)
- Images hiển thị hoặc có placeholder
- Click category redirect đúng

**Issues Found:**
```
[Ghi lại các issues nếu có]
```

---

### 2. Products Listing Page

**URL:** `http://localhost:3000/products`

**Test Steps:**
1. [ ] Mở products page
2. [ ] Verify products hiển thị (grid hoặc list view)
3. [ ] Verify product images hiển thị
4. [ ] Verify product names hiển thị
5. [ ] Verify prices hiển thị đúng format (ví dụ: "500.000 ₫")
6. [ ] Verify "Thêm vào giỏ" button hiển thị
7. [ ] Test pagination (nếu có > 12 products)
8. [ ] Test view toggle (grid/list)
9. [ ] Test filters sidebar (nếu có)

**Expected Results:**
- Products load thành công
- Images, names, prices hiển thị đúng
- Buttons hoạt động
- Pagination hoạt động (nếu có)

**Issues Found:**
```
[Ghi lại các issues nếu có]
```

---

### 3. Product Filters

**URL:** `http://localhost:3000/products`

**Test Steps:**
1. [ ] Test category filter:
   - Click category trong sidebar
   - Verify URL có `?category=slug`
   - Verify products được filter đúng
2. [ ] Test search:
   - Nhập search term
   - Verify products được filter
   - Verify URL có `?search=term`
3. [ ] Test price filter (nếu có):
   - Set min/max price
   - Verify products được filter
4. [ ] Test sort:
   - Test sort by price (asc/desc)
   - Test sort by name (asc/desc)
   - Test sort by newest
   - Verify products được sort đúng

**Expected Results:**
- Filters hoạt động đúng
- URL params được update
- Products được filter/sort đúng

**Issues Found:**
```
[Ghi lại các issues nếu có]
```

---

### 4. Product Detail Page

**URL:** `http://localhost:3000/products/[slug]`

**Test Steps:**
1. [ ] Mở product detail page từ product card
2. [ ] Verify main product image hiển thị
3. [ ] Verify gallery images hiển thị (nếu có)
4. [ ] Verify product name hiển thị
5. [ ] Verify SKU hiển thị (nếu có)
6. [ ] Verify price hiển thị đúng format
7. [ ] Verify regular price hiển thị nếu on sale
8. [ ] Verify product specs hiển thị:
   - Length, Width, Height
   - Volumetric Weight
   - Material (nếu có)
   - Origin (nếu có)
9. [ ] Verify stock status hiển thị
10. [ ] Test quantity selector:
    - Increase quantity
    - Decrease quantity
    - Verify min/max limits
11. [ ] Test "Thêm vào giỏ" button:
    - Click với quantity = 1
    - Click với quantity > 1
    - Verify items được add vào cart đúng số lượng
12. [ ] Verify product description hiển thị (nếu có)
13. [ ] Verify related products hiển thị (nếu có)

**Expected Results:**
- Product data load đầy đủ
- Images hiển thị
- Specs hiển thị đúng
- Add to cart hoạt động
- Quantity selector hoạt động

**Issues Found:**
```
[Ghi lại các issues nếu có]
```

---

### 5. Add to Cart Functionality

**Test Steps:**
1. [ ] Add product từ product card (homepage/products page)
2. [ ] Add product từ product detail page
3. [ ] Add multiple products
4. [ ] Add same product multiple times
5. [ ] Verify cart drawer/cart icon update
6. [ ] Verify cart items hiển thị đúng:
   - Product name
   - Product image
   - Quantity
   - Price
   - Total price
7. [ ] Test remove item from cart
8. [ ] Test update quantity in cart
9. [ ] Verify shipping calculation (nếu có)

**Expected Results:**
- Add to cart hoạt động
- Cart updates real-time
- Items hiển thị đúng
- Quantity updates đúng
- Shipping calculation đúng (nếu có dimensions)

**Issues Found:**
```
[Ghi lại các issues nếu có]
```

---

### 6. API Routes Testing

**Test trong Browser DevTools > Network tab:**

1. [ ] Test `/api/woocommerce/products`:
   - Open Network tab
   - Load products page
   - Verify request đến `/api/woocommerce/products`
   - Verify response status 200
   - Verify response có `products` array
2. [ ] Test `/api/woocommerce/products/[id]`:
   - Load product detail page
   - Verify request đến `/api/woocommerce/products/[id]`
   - Verify response status 200
   - Verify response có `product` object
3. [ ] Test `/api/woocommerce/categories`:
   - Load homepage
   - Verify request đến `/api/woocommerce/categories`
   - Verify response status 200
   - Verify response có `categories` array

**Expected Results:**
- API routes hoạt động
- Responses đúng format
- No CORS errors
- No authentication errors

**Issues Found:**
```
[Ghi lại các issues nếu có]
```

---

### 7. Error Handling

**Test Steps:**
1. [ ] Test với invalid product ID:
   - Navigate to `/products/invalid-slug`
   - Verify error message hiển thị
   - Verify không crash
2. [ ] Test với empty products:
   - Tạm thời hide tất cả products trong WordPress
   - Verify empty state hiển thị
3. [ ] Test với network error:
   - Disconnect internet
   - Verify error message hiển thị
   - Verify retry option (nếu có)

**Expected Results:**
- Errors được handle gracefully
- Error messages hiển thị rõ ràng
- App không crash

**Issues Found:**
```
[Ghi lại các issues nếu có]
```

---

### 8. Mobile Responsiveness

**Test trên mobile viewport (375px width):**

1. [ ] Test homepage category grid (2 cols)
2. [ ] Test products page (2 cols grid)
3. [ ] Test product detail page
4. [ ] Test filters sidebar (collapsed/expanded)
5. [ ] Test cart drawer
6. [ ] Verify touch targets >= 44x44px
7. [ ] Verify no horizontal scroll

**Expected Results:**
- Layout responsive
- Touch targets đủ lớn
- No horizontal scroll
- Text readable

**Issues Found:**
```
[Ghi lại các issues nếu có]
```

---

### 9. Performance

**Test với Browser DevTools > Performance tab:**

1. [ ] Test initial page load time
2. [ ] Test products page load time
3. [ ] Test product detail page load time
4. [ ] Verify images lazy load
5. [ ] Verify no unnecessary re-renders

**Expected Results:**
- Page load < 3s
- Images lazy load
- Smooth scrolling

**Issues Found:**
```
[Ghi lại các issues nếu có]
```

---

### 10. Console Errors

**Test trong Browser DevTools > Console:**

1. [ ] Verify no console errors
2. [ ] Verify no console warnings (trừ hydration warnings nếu do extensions)
3. [ ] Verify no network errors
4. [ ] Verify no React errors

**Expected Results:**
- No errors
- Minimal warnings

**Issues Found:**
```
[Ghi lại các issues nếu có]
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "WooCommerce REST API credentials are not configured"

**Solution:**
1. Check `.env.local` có credentials
2. Restart Next.js dev server
3. Verify variable names: `WOOCOMMERCE_CONSUMER_KEY` và `WOOCOMMERCE_CONSUMER_SECRET`

### Issue 2: "401 Unauthorized" trong Network tab

**Solution:**
1. Verify Consumer Key & Secret đúng
2. Check permissions trong WordPress (phải là Read/Write)
3. Verify credentials không có spaces/line breaks

### Issue 3: Products không load

**Solution:**
1. Check WordPress REST API endpoint: `http://localhost/wordpress/wp-json/wc/v3/products`
2. Verify WooCommerce plugin activated
3. Verify products có status "Published"
4. Check browser console for errors

### Issue 4: Images không hiển thị

**Solution:**
1. Verify product có images trong WordPress
2. Check image URLs trong Network tab
3. Verify Next.js Image component config
4. Check CORS settings (nếu images từ external domain)

### Issue 5: Product specs (length, width, height) không hiển thị

**Solution:**
1. Verify ACF fields được set trong WordPress
2. Check meta_data trong API response
3. Verify field names: `length`, `width`, `height`, `volumetric_weight`
4. Check product mapper utility

---

## 📝 Test Results Summary

**Date:** _______________

**Tester:** _______________

**Overall Status:** 
- [ ] ✅ Pass
- [ ] ⚠️ Pass with issues
- [ ] ❌ Fail

**Total Test Cases:** _____

**Passed:** _____

**Failed:** _____

**Issues Found:** _____

**Critical Issues:**
```
[List critical issues here]
```

**Non-Critical Issues:**
```
[List non-critical issues here]
```

**Notes:**
```
[Additional notes]
```

---

## ✅ Sign-off

- [ ] All test cases passed
- [ ] No critical issues
- [ ] Ready for Phase 3 (Orders migration)

**Approved by:** _______________

**Date:** _______________

