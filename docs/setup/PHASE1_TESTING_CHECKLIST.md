# PHASE 1 - TESTING CHECKLIST

**Ngày:** 14/12/2025  
**Phase:** Phase 1 - Critical Bug Fixes  
**Status:** ✅ All Fixes Implemented - Ready for Testing

---

## ✅ FIXES IMPLEMENTED

### 1. ✅ Fix Async State Update trong ProductInfo.tsx
**File:** `components/product/ProductInfo.tsx`  
**Changes:**
- Sử dụng biến cục bộ `sizeToUse` và `colorToUse` thay vì phụ thuộc vào state
- Tính toán `variationToUse` ngay lập tức với biến cục bộ
- Đảm bảo giá và variationId được tính đúng khi thêm vào giỏ
- Loại bỏ console.log không cần thiết

### 2. ✅ Fix Race Condition trong ProductCard.tsx
**File:** `components/product/ProductCard.tsx`  
**Changes:**
- Thêm check trong `handleQuickAdd` để prevent quick add khi variations chưa load xong
- Redirect to product detail page nếu là variable product mà chưa có variations
- Prevent wrong pricing khi variations chưa available
- Loại bỏ console.log không cần thiết

### 3. ✅ Thêm Loading Feedback UI
**File:** `components/product/ProductCard.tsx`  
**Changes:**
- Thêm state `isAddingToCart` để track loading
- Hiển thị `Loader2` icon khi đang add to cart
- Disable button khi đang loading hoặc out of stock
- Try-catch-finally để handle errors và reset state

---

## 📋 MANUAL TESTING CHECKLIST

### Test Case 1: Add to Cart - Variable Product with Size
**Scenario:** Thêm sản phẩm có size vào giỏ (người dùng đã chọn size)

**Steps:**
1. [ ] Truy cập trang product detail của sản phẩm có variations (size)
2. [ ] Chọn một size cụ thể (VD: "60cm")
3. [ ] Click button "Thêm giỏ hàng"
4. [ ] Kiểm tra giỏ hàng

**Expected Results:**
- ✅ Sản phẩm được thêm vào giỏ thành công
- ✅ Tên sản phẩm bao gồm size đã chọn (VD: "Gấu Bông Teddy (60cm)")
- ✅ Giá hiển thị đúng theo variation đã chọn
- ✅ `variationId` được lưu trong cart item
- ✅ QuickCheckoutModal được mở sau khi add thành công

---

### Test Case 2: Add to Cart - Variable Product without Size (Auto-select)
**Scenario:** Thêm sản phẩm có size vào giỏ (người dùng chưa chọn size)

**Steps:**
1. [ ] Truy cập trang product detail của sản phẩm có variations
2. [ ] KHÔNG chọn size
3. [ ] Click button "Thêm giỏ hàng"
4. [ ] Kiểm tra giỏ hàng

**Expected Results:**
- ✅ Sản phẩm được thêm vào giỏ thành công
- ✅ Size đầu tiên trong list được tự động chọn
- ✅ Tên sản phẩm bao gồm size tự động chọn
- ✅ Giá đúng theo variation tự động chọn
- ✅ `variationId` được lưu đúng
- ✅ UI update: size được highlight sau khi thêm

---

### Test Case 3: Quick Add - Simple Product
**Scenario:** Quick add sản phẩm simple (không có biến thể)

**Steps:**
1. [ ] Truy cập homepage hoặc product list
2. [ ] Hover vào product card (simple product)
3. [ ] Click nút Quick Add (icon giỏ hàng)
4. [ ] Quan sát loading state
5. [ ] Kiểm tra giỏ hàng

**Expected Results:**
- ✅ Nút Quick Add hiển thị loading icon (Loader2 spinning)
- ✅ Button bị disable khi đang loading
- ✅ Sản phẩm được thêm vào giỏ thành công
- ✅ Giá đúng theo product price
- ✅ QuickCheckoutModal được mở
- ✅ Loading state reset sau 500ms

---

### Test Case 4: Quick Add - Variable Product (Chưa Load Variations)
**Scenario:** Quick add sản phẩm variable khi variations chưa load xong

**Steps:**
1. [ ] Truy cập homepage hoặc product list
2. [ ] Tìm product card của variable product
3. [ ] KHÔNG hover (để variations chưa fetch)
4. [ ] Click nút Quick Add ngay lập tức
5. [ ] Quan sát behavior

**Expected Results:**
- ✅ KHÔNG thêm vào giỏ
- ✅ Redirect to product detail page
- ✅ KHÔNG có lỗi console
- ✅ User có thể chọn size trên trang detail

**Lý do:** Prevent race condition - không cho phép quick add khi chưa có variations data để tránh sai giá

---

### Test Case 5: Quick Add - Variable Product (Đã Load Variations, Chưa Chọn)
**Scenario:** Quick add sản phẩm variable sau khi hover (variations đã load) nhưng chưa chọn size

**Steps:**
1. [ ] Truy cập homepage hoặc product list
2. [ ] Hover vào product card của variable product (wait for variations to load)
3. [ ] KHÔNG chọn size
4. [ ] Click nút Quick Add
5. [ ] Quan sát behavior

**Expected Results:**
- ✅ KHÔNG thêm vào giỏ
- ✅ Redirect to product detail page
- ✅ User được yêu cầu chọn size trên trang detail

**Lý do:** Variable products cần phải chọn variation trước khi add

---

### Test Case 6: Quick Add - Variable Product (Đã Chọn Size)
**Scenario:** Quick add sản phẩm variable sau khi chọn size

**Steps:**
1. [ ] Truy cập homepage hoặc product list
2. [ ] Hover vào product card của variable product
3. [ ] Click chọn một size (VD: "80cm")
4. [ ] Click nút Quick Add
5. [ ] Quan sát loading state
6. [ ] Kiểm tra giỏ hàng

**Expected Results:**
- ✅ Nút Quick Add hiển thị loading icon
- ✅ Sản phẩm được thêm vào giỏ với size đã chọn
- ✅ Giá đúng theo variation đã chọn
- ✅ `variationId` được lưu đúng
- ✅ QuickCheckoutModal được mở

---

### Test Case 7: Price Calculation - Variable Product
**Scenario:** Verify giá được tính đúng cho variable products

**Steps:**
1. [ ] Tạo test product với variations có giá khác nhau:
   - Size 60cm: 500,000đ
   - Size 80cm: 700,000đ
   - Size 1m: 900,000đ
2. [ ] Truy cập trang product detail
3. [ ] Chọn từng size và quan sát giá hiển thị
4. [ ] Add to cart và verify giá trong cart

**Expected Results:**
- ✅ Giá thay đổi đúng khi chọn size khác nhau
- ✅ Giá trong cart khớp với giá hiển thị trên product page
- ✅ KHÔNG có hiện tượng "flash of wrong price"

---

### Test Case 8: Multiple Quantities
**Scenario:** Thêm sản phẩm với quantity > 1

**Steps:**
1. [ ] Truy cập product detail page
2. [ ] Chọn size (nếu có)
3. [ ] Tăng quantity lên 3
4. [ ] Click "Thêm giỏ hàng"
5. [ ] Kiểm tra giỏ hàng

**Expected Results:**
- ✅ 3 items được thêm vào giỏ
- ✅ Tất cả items có cùng size và giá
- ✅ Total price = quantity × unit price

---

### Test Case 9: Out of Stock Product
**Scenario:** Quick add product out of stock

**Steps:**
1. [ ] Tạo product với stockStatus = 'outofstock'
2. [ ] Hover vào product card
3. [ ] Quan sát Quick Add button

**Expected Results:**
- ✅ Quick Add button bị disabled
- ✅ KHÔNG thể click để add to cart

---

### Test Case 10: Loading State Persistence
**Scenario:** Verify loading state được reset đúng cách

**Steps:**
1. [ ] Click Quick Add trên product card
2. [ ] Quan sát loading state
3. [ ] Wait for operation to complete
4. [ ] Click Quick Add lần nữa

**Expected Results:**
- ✅ Loading state hiển thị khi click lần 1
- ✅ Loading state reset sau 500ms
- ✅ Button có thể click lại sau khi reset
- ✅ KHÔNG bị stuck ở loading state

---

## 🔍 CODE REVIEW CHECKLIST

### ProductInfo.tsx
- [x] ✅ Sử dụng biến cục bộ `sizeToUse` và `colorToUse`
- [x] ✅ Tính toán `variationToUse` với biến cục bộ (không phụ thuộc state)
- [x] ✅ Price calculation đúng: `String(variationToUse.price)` cho variation, `product.salePrice` hoặc `product.price` cho product
- [x] ✅ variationId được pass đúng vào addToCart
- [x] ✅ Product name bao gồm size: `${product.name} ${sizeToUse ? '(${sizeToUse})' : ''}`
- [x] ✅ KHÔNG có console.log (đã loại bỏ)
- [x] ✅ Try-catch-finally để handle errors

### ProductCard.tsx
- [x] ✅ Import `useRouter` từ `next/navigation`
- [x] ✅ Import `Loader2` icon từ `lucide-react`
- [x] ✅ State `isAddingToCart` để track loading
- [x] ✅ Check `product.type === 'variable'` trước khi quick add
- [x] ✅ Check `isLoadingVariations || variations.length === 0` để prevent race condition
- [x] ✅ Redirect to product page nếu chưa có variations hoặc chưa chọn variation
- [x] ✅ Try-catch-finally trong `handleQuickAdd`
- [x] ✅ Loading UI: `Loader2` icon khi `isAddingToCart === true`
- [x] ✅ Button disabled khi `isAddingToCart || isOutOfStock`
- [x] ✅ KHÔNG có console.log production code (chỉ còn error logging)
- [x] ✅ setTimeout 500ms để reset loading state

---

## 🎯 EXPECTED OUTCOMES

### Critical Bugs Fixed:
1. ✅ **NO MORE đơn hàng thiếu size/color** - Local variables ensure correct attribute selection
2. ✅ **NO MORE sai giá cho variable products** - Race condition prevented with proper checks
3. ✅ **Better UX** - Loading feedback shows system is processing

### Performance:
- ✅ No blocking operations
- ✅ Proper error handling
- ✅ Loading states clear and responsive

### Code Quality:
- ✅ No console.log in production (only error logging)
- ✅ Proper TypeScript types
- ✅ Defensive coding with null/undefined checks
- ✅ Mobile-first design maintained

---

## 🚨 REGRESSION TESTING

### Areas to Watch:
1. [ ] Existing simple products still work normally
2. [ ] ProductList page performance (no slowdown from fixes)
3. [ ] Cart state updates correctly
4. [ ] QuickCheckoutModal opens properly
5. [ ] No TypeScript errors in build
6. [ ] No console errors in browser

---

## ✅ COMPLETION CRITERIA

Phase 1 is considered **COMPLETE** when:

- [ ] All 10 manual test cases PASS
- [ ] All code review items checked ✅
- [ ] No regression bugs found
- [ ] TypeScript build succeeds: `npm run type-check`
- [ ] Pre-deploy check passes: `npm run pre-deploy`
- [ ] Code committed with proper message
- [ ] Plan document updated with Phase 1 completion status

---

## 📝 TESTING NOTES

### Test Environment:
- Browser: Chrome/Firefox/Safari
- Devices: Desktop + Mobile (90% traffic from mobile)
- Test Products:
  - Simple product (no variations)
  - Variable product (size only)
  - Variable product (size + color)
  - Out of stock product

### How to Test:
1. Start dev server: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Follow test cases in order
4. Document any failures or unexpected behavior
5. Re-test after fixes

---

**Ready to test? Let's verify these critical fixes work correctly! 🚀**
