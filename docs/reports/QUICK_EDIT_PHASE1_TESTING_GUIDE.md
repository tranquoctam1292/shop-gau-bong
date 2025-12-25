# Phase 1 Performance Optimization - Manual Testing Guide

**Date:** 2025-01-XX  
**Status:** Ready for Testing

---

## ✅ Code Verification Results

**Automated Code Check:** ✅ **26/26 checks passed**

Tất cả implementations đã được verify:
- ✅ CSRF Token Pre-fetching (11 checks)
- ✅ CSRF Token Cache Improvement (7 checks)
- ✅ Categories Lazy Loading (5 checks)
- ✅ Categories Cache Improvement (3 checks)

---

## 🧪 Manual Testing Steps

### Prerequisites
1. Start dev server: `npm run dev`
2. Open browser DevTools (F12)
3. Navigate to Network tab
4. Navigate to Application tab → Session Storage

---

### Test 1: CSRF Token Pre-fetching

#### Test 1.1: Pre-fetch on Hover (ProductCell)
1. Navigate to `/admin/products`
2. Open DevTools → Network tab
3. Clear sessionStorage: `sessionStorage.clear()` (trong Console)
4. **Hover** vào "Sửa nhanh" button trên một product row
5. **Wait 400ms** (debounce delay)
6. **Verify:** 
   - ✅ Network tab → Request đến `/api/admin/auth/csrf-token` xuất hiện
   - ✅ Request completed successfully (status 200)
7. **Click** vào "Sửa nhanh" button
8. **Verify:**
   - ✅ Dialog mở ngay lập tức
   - ✅ Network tab → KHÔNG có request mới đến `/api/admin/auth/csrf-token` (đã có sẵn)

#### Test 1.2: Pre-fetch on Hover (ProductActionMenu)
1. Navigate to `/admin/products`
2. Open DevTools → Network tab
3. Clear sessionStorage: `sessionStorage.clear()`
4. Click vào "..." menu button trên một product row
5. **Hover** vào "Sửa nhanh" menu item
6. **Wait 400ms**
7. **Verify:** 
   - ✅ Network tab → Request đến `/api/admin/auth/csrf-token` xuất hiện
8. **Click** vào "Sửa nhanh"
9. **Verify:** Dialog mở, không có request mới

#### Test 1.3: Debounce Cancellation
1. Navigate to `/admin/products`
2. Open DevTools → Network tab
3. Clear sessionStorage: `sessionStorage.clear()`
4. **Hover** vào "Sửa nhanh" button
5. **Immediately move mouse away** (trước khi 400ms)
6. **Verify:**
   - ✅ Network tab → KHÔNG có request đến `/api/admin/auth/csrf-token`
   - ✅ Debounce timer đã bị cancel

#### Test 1.4: Quick Click (Before Pre-fetch Completes)
1. Navigate to `/admin/products`
2. Open DevTools → Network tab
3. Clear sessionStorage: `sessionStorage.clear()`
4. **Hover** vào "Sửa nhanh" button
5. **Immediately click** (trong vòng 400ms)
6. **Verify:**
   - ✅ Dialog vẫn mở thành công
   - ✅ Token được fetch khi cần (fallback behavior)
   - ✅ Không có lỗi

---

### Test 2: CSRF Token Cache (sessionStorage)

#### Test 2.1: Token Saved to sessionStorage
1. Navigate to `/admin/products`
2. Open DevTools → Application → Session Storage
3. Clear sessionStorage: `sessionStorage.clear()`
4. Hover vào "Sửa nhanh" button (wait 400ms)
5. **Verify:**
   - ✅ Session Storage → Key `csrf_token_cache` xuất hiện
   - ✅ Value có format: `{"token":"...","expiresAt":...}`
   - ✅ `expiresAt` là timestamp trong tương lai

#### Test 2.2: Token Persists Across Page Refresh
1. Complete Test 2.1 (token đã được lưu)
2. **Refresh page** (F5)
3. Open DevTools → Application → Session Storage
4. **Verify:**
   - ✅ Key `csrf_token_cache` vẫn còn
   - ✅ Value không thay đổi
5. Hover vào "Sửa nhanh" button
6. **Verify:**
   - ✅ Network tab → KHÔNG có request mới (dùng token từ cache)

#### Test 2.3: Token Expiry Check
1. Navigate to `/admin/products`
2. Open DevTools → Console
3. Manually set expired token:
   ```javascript
   sessionStorage.setItem('csrf_token_cache', JSON.stringify({
     token: 'test-token',
     expiresAt: Date.now() - 1000 // Expired 1 second ago
   }));
   ```
4. Hover vào "Sửa nhanh" button
5. **Verify:**
   - ✅ Network tab → Request mới đến `/api/admin/auth/csrf-token`
   - ✅ Token mới được lưu vào sessionStorage với `expiresAt` mới

#### Test 2.4: Cache Clear on Logout
1. Complete Test 2.1 (token đã được lưu)
2. **Logout** từ admin panel
3. Open DevTools → Application → Session Storage
4. **Verify:**
   - ✅ Key `csrf_token_cache` đã bị xóa
   - ✅ Session Storage không còn token

---

### Test 3: Categories Lazy Loading

#### Test 3.1: Categories NOT Fetched on Dialog Open
1. Navigate to `/admin/products`
2. Open DevTools → Network tab
3. Clear Network log
4. Click "Sửa nhanh" trên một product
5. **Verify:**
   - ✅ Dialog mở
   - ✅ Network tab → **KHÔNG có** request đến `/api/admin/categories`
   - ✅ Dialog mở nhanh hơn (không đợi categories)

#### Test 3.2: Categories Fetched When Popover Opens
1. Complete Test 3.1 (dialog đã mở)
2. **Click** vào "Categories" field trong dialog
3. **Verify:**
   - ✅ Network tab → Request đến `/api/admin/categories?type=tree&status=active`
   - ✅ Popover mở và hiển thị loading state

#### Test 3.3: Loading State Display
1. Complete Test 3.2 (click Categories field)
2. **Verify:**
   - ✅ Loading spinner (`Loader2` icon) hiển thị
   - ✅ Text "Đang tải danh mục..." hiển thị
   - ✅ UI responsive, không bị freeze

#### Test 3.4: Categories Display After Load
1. Complete Test 3.3 (wait for categories to load)
2. **Verify:**
   - ✅ Loading spinner biến mất
   - ✅ Categories list hiển thị
   - ✅ Có thể select/deselect categories

#### Test 3.5: Categories from Cache (Second Open)
1. Complete Test 3.4 (categories đã được fetch)
2. Close dialog
3. Open dialog lần 2 (trong vòng 30 phút)
4. Click "Categories" field
5. **Verify:**
   - ✅ Categories hiển thị **ngay lập tức** (không loading)
   - ✅ Network tab → **KHÔNG có** request mới (dùng cache)
   - ✅ UI smooth, không delay

#### Test 3.6: Empty State
1. Navigate to `/admin/products`
2. Open dialog
3. Click "Categories" field
4. **Verify:**
   - ✅ Nếu không có categories → Show "Không có danh mục nào"
   - ✅ Không có loading spinner khi empty

---

### Test 4: Performance Measurement

#### Test 4.1: Measure Dialog Open Time (Before Optimization)
1. Navigate to `/admin/products`
2. Open DevTools → Network tab → Enable "Disable cache"
3. Clear sessionStorage: `sessionStorage.clear()`
4. Open Performance tab → Start recording
5. Click "Sửa nhanh" button
6. Wait for dialog to fully load
7. Stop recording
8. **Measure:**
   - Total time từ click đến dialog ready
   - CSRF token fetch time
   - Categories fetch time (nếu có)
   - Product data fetch time

#### Test 4.2: Measure Dialog Open Time (After Optimization)
1. Navigate to `/admin/products`
2. Open DevTools → Network tab
3. **Hover** vào "Sửa nhanh" button (wait 400ms) → Pre-fetch CSRF token
4. Open Performance tab → Start recording
5. Click "Sửa nhanh" button
6. Wait for dialog to fully load
7. Stop recording
8. **Measure:**
   - Total time từ click đến dialog ready
   - CSRF token: Should be <0.1s (from cache)
   - Categories: Should be 0s (lazy loaded)
   - Product data: Baseline (~2.7s)

#### Test 4.3: Compare Performance
1. Compare results từ Test 4.1 và 4.2
2. **Expected Improvements:**
   - CSRF Token: 2.2s → <0.1s (giảm ~95%)
   - Categories: 2.7s → 0s (lazy loaded)
   - Total Time: ~7.7s → ~2.7s (giảm ~65%)

---

## 📊 Expected Performance Metrics

### Baseline (Before Optimization)
- CSRF Token Fetch: **~2.2s**
- Categories Fetch: **~2.7s**
- Product Data Fetch: **~2.7s**
- **Total Time:** **~7.7s**

### After Phase 1 (Expected)
- CSRF Token: **<0.1s** (pre-fetched + cached)
- Categories: **0s** (lazy loaded) hoặc **<0.1s** (nếu có cache)
- Product Data: **~2.7s** (chưa optimize)
- **Total Time:** **~2.7s** (giảm **65%**)

---

## 🐛 Known Issues / Edge Cases

### Edge Case 1: Network Slow/Intermittent
- **Scenario:** Pre-fetch fails due to network issues
- **Expected:** Dialog vẫn mở, token được fetch khi cần (fallback)
- **Test:** Disable network → Hover → Enable network → Click → Verify

### Edge Case 2: Session Expires During Pre-fetch
- **Scenario:** Session expires between pre-fetch and dialog open
- **Expected:** Token invalid → Auto-fetch new token
- **Test:** Pre-fetch → Wait for session expiry → Open dialog → Verify

### Edge Case 3: Multiple Tabs
- **Scenario:** User opens multiple tabs, each with different token
- **Expected:** Each tab has its own sessionStorage (isolated)
- **Test:** Open 2 tabs → Pre-fetch in tab 1 → Check tab 2 → Verify isolation

---

## ✅ Test Completion Checklist

- [ ] Test 1.1: Pre-fetch on Hover (ProductCell) - ✅/❌
- [ ] Test 1.2: Pre-fetch on Hover (ProductActionMenu) - ✅/❌
- [ ] Test 1.3: Debounce Cancellation - ✅/❌
- [ ] Test 1.4: Quick Click - ✅/❌
- [ ] Test 2.1: Token Saved to sessionStorage - ✅/❌
- [ ] Test 2.2: Token Persists Across Refresh - ✅/❌
- [ ] Test 2.3: Token Expiry Check - ✅/❌
- [ ] Test 2.4: Cache Clear on Logout - ✅/❌
- [ ] Test 3.1: Categories NOT Fetched on Open - ✅/❌
- [ ] Test 3.2: Categories Fetched When Popover Opens - ✅/❌
- [ ] Test 3.3: Loading State Display - ✅/❌
- [ ] Test 3.4: Categories Display After Load - ✅/❌
- [ ] Test 3.5: Categories from Cache - ✅/❌
- [ ] Test 3.6: Empty State - ✅/❌
- [ ] Test 4.1: Performance Measurement (Before) - ✅/❌
- [ ] Test 4.2: Performance Measurement (After) - ✅/❌
- [ ] Test 4.3: Performance Comparison - ✅/❌

---

## 📝 Test Results Template

```markdown
### Test Execution Log

**Date:** 2025-01-XX
**Tester:** [Your Name]
**Browser:** Chrome/Firefox/Safari [Version]
**Network:** Fast 3G / Slow 3G / WiFi

#### Performance Metrics:
- CSRF Token (Before): ___s
- CSRF Token (After): ___s
- Categories (Before): ___s
- Categories (After): ___s
- Total Time (Before): ___s
- Total Time (After): ___s
- **Improvement:** ___%

#### Issues Found:
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

#### Notes:
[Any additional observations]
```

---

## 🚀 Next Steps

Sau khi test Phase 1:
1. Document actual performance improvements
2. Fix any issues found
3. Proceed với Phase 2 (API Optimization) nếu Phase 1 verified

---

**Last Updated:** 2025-01-XX

