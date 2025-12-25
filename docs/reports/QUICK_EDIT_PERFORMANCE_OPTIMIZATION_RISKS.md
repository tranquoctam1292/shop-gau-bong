# Quick Edit Performance Optimization - Risk Analysis & Mitigation

## Tổng quan
Phân tích các rủi ro, xung đột, và lỗ hổng tiềm ẩn khi triển khai kế hoạch tối ưu hóa hiệu năng.

**Ngày tạo:** 2025-01-XX

---

## Phase 1: Immediate Wins - Risk Analysis

### 1.1. CSRF Token Pre-fetching & Caching

#### 1.1.1 Pre-fetch khi hover vào "Quick Edit" button

**Rủi ro:**
- ⚠️ **Token Expiration:** Token có thể hết hạn giữa lúc pre-fetch và khi dialog mở (nếu user hover rồi đợi lâu)
- ⚠️ **Race Condition:** Nếu user click nhanh trước khi pre-fetch hoàn thành → dialog vẫn phải đợi
- ⚠️ **Wasted Requests:** Pre-fetch token nhưng user không mở dialog → lãng phí request
- ⚠️ **Session Expiry:** Token có thể invalid nếu session expire trong khi pre-fetch

**Giải pháp:**
- ✅ Validate token expiry time trước khi sử dụng (check `csrfTokenExpiresAt`)
- ✅ Nếu token đã expire, fetch lại ngay khi dialog mở
- ✅ Debounce pre-fetch (chỉ fetch sau 300-500ms hover để tránh wasted requests)
- ✅ Handle token expiry gracefully: Auto-refetch nếu token invalid

**Xung đột tiềm ẩn:**
- ❌ **None identified** - Pre-fetch không ảnh hưởng đến logic hiện tại

---

#### 1.1.2 Improve CSRF Token Cache Strategy

**Rủi ro:**
- ⚠️ **Security:** Cache token quá lâu (24h) có thể tăng risk nếu token bị compromise
- ⚠️ **Token Rotation:** Nếu admin force logout/all users → cached tokens vẫn còn → potential security issue
- ⚠️ **Cross-tab Issues:** Token cached trong một tab có thể không sync với tab khác

**Giải pháp:**
- ✅ Keep server-side TTL = 24h (đã có), client-side cache TTL = 24h (match server)
- ✅ Clear client-side cache khi logout (đã implement trong `logout/route.ts`)
- ✅ Clear client-side cache khi detect token invalid (403 error)
- ✅ Use sessionStorage thay vì localStorage để tránh cross-tab issues

**Xung đột tiềm ẩn:**
- ⚠️ **Hot Reload:** Hiện tại đã có MongoDB fallback cho hot reload → OK
- ❌ **None other identified**

---

### 1.2. Categories Lazy Loading & Better Caching

#### 1.2.1 Defer categories fetch đến khi user click vào Categories field

**Rủi ro:**
- ⚠️ **UX:** User phải đợi khi click vào Categories field lần đầu → có thể cảm thấy chậm
- ⚠️ **Race Condition:** Nếu user click nhanh vào Categories field ngay khi dialog mở → vẫn phải đợi fetch
- ⚠️ **Empty State:** Categories field sẽ trống khi dialog mở → có thể confuse user

**Giải pháp:**
- ✅ Show loading spinner trong Categories popover khi đang fetch
- ✅ Pre-fetch categories khi dialog mở (nhưng với low priority/defer)
- ✅ Use React Query cache: Nếu đã có cache từ lần trước → show ngay
- ✅ Show placeholder text: "Đang tải danh mục..." khi chưa có data

**Xung đột tiềm ẩn:**
- ⚠️ **Current Implementation:** `useCategories` đang được gọi ở top-level của component
  - **Impact:** Nếu set `enabled: false`, component vẫn render nhưng `categories` sẽ là empty array
  - **Solution:** OK, vì component đã handle empty array case
- ❌ **None other identified**

---

#### 1.2.2 Improve React Query Cache for Categories

**Rủi ro:**
- ⚠️ **Stale Data:** Cache 30 phút có thể show stale data nếu admin update categories
- ⚠️ **Memory:** Cache lâu hơn → tốn memory hơn (nhưng categories không lớn → OK)

**Giải pháp:**
- ✅ Invalidate cache khi categories được update (trong category management page)
- ✅ Use `staleTime: 30 minutes` (reasonable cho data ít thay đổi)
- ✅ Use `gcTime: 1 hour` (garbage collection time)

**Xung đột tiềm ẩn:**
- ❌ **None identified** - React Query cache không ảnh hưởng đến data consistency

---

## Phase 2: API Optimization - Risk Analysis

### 2.1. Product Data Fetch Optimization

#### 2.1.1 Pre-fetch product data khi hover vào "Quick Edit" button

**Rủi ro:**
- ⚠️ **Stale Data:** Product có thể được update giữa lúc pre-fetch và khi dialog mở
- ⚠️ **Version Mismatch:** Pre-fetched data có version cũ → conflict với current product version
- ⚠️ **Wasted Requests:** Pre-fetch nhưng user không mở dialog
- ⚠️ **Race Condition:** User click nhanh trước khi pre-fetch hoàn thành

**Giải pháp:**
- ✅ Validate version khi dialog mở: Compare pre-fetched version với current version
- ✅ Nếu version mismatch → fetch lại data mới (đã có logic này)
- ✅ Debounce pre-fetch (chỉ fetch sau 300-500ms hover)
- ✅ Use React Query prefetching với `staleTime` hợp lý (5 phút)
- ✅ Cancel pre-fetch nếu user không mở dialog (AbortController)

**Xung đột tiềm ẩn:**
- ⚠️ **Current Fetch Logic:** Dialog đang fetch product data trong `useEffect` khi `open = true`
  - **Impact:** Nếu pre-fetch → có thể có duplicate request
  - **Solution:** Check React Query cache trước, chỉ fetch nếu không có cache hoặc cache stale
- ❌ **None other identified**

---

#### 2.1.2 Lightweight Product API Endpoint

**Rủi ro:**
- ⚠️ **Missing Fields:** Endpoint mới có thể thiếu fields mà Quick Edit form cần
- ⚠️ **Data Inconsistency:** Two endpoints có thể return khác nhau → confusion
- ⚠️ **Maintenance:** Phải maintain 2 endpoints → more code to maintain

**Giải pháp:**
- ✅ Comprehensive testing: Đảm bảo tất cả fields cần thiết đều có
- ✅ Document rõ ràng: Ghi chú fields nào được include/exclude
- ✅ Reuse logic: Extract common mapping logic để tránh duplicate
- ✅ Fallback: Nếu lightweight endpoint fail → fallback về full endpoint

**Xung đột tiềm ẩn:**
- ❌ **None identified** - New endpoint không ảnh hưởng đến existing endpoints

---

#### 2.1.3 MongoDB Query Optimization

**Rủi ro:**
- ⚠️ **Missing Indexes:** Add indexes có thể ảnh hưởng đến write performance
- ⚠️ **Query Breaking:** Change projection có thể break existing code nếu có code phụ thuộc vào fields bị loại bỏ

**Giải pháp:**
- ✅ Test write performance sau khi add indexes
- ✅ Monitor index usage để đảm bảo indexes được sử dụng
- ✅ Gradual rollout: Test trên dev/staging trước
- ✅ Keep backward compatibility: Đảm bảo existing code vẫn work

**Xung đột tiềm ẩn:**
- ❌ **None identified** - Index optimization là safe operation

---

### 2.2. Parallel API Calls Optimization

**Rủi ro:**
- ⚠️ **None identified** - Đảm bảo parallel calls là safe, không có side effects

**Giải pháp:**
- ✅ Review code để đảm bảo không có dependencies giữa các API calls
- ✅ Use Promise.all() hoặc Promise.allSettled() để handle errors gracefully

**Xung đột tiềm ẩn:**
- ❌ **None identified**

---

## Phase 3: Advanced Optimizations - Risk Analysis

### 3.1. Database Index Optimization

**Rủi ro:**
- ⚠️ **Write Performance:** Indexes có thể làm chậm write operations (insert/update)
- ⚠️ **Disk Space:** Indexes tốn disk space (nhưng MongoDB indexes không lớn → OK)

**Giải pháp:**
- ✅ Monitor write performance sau khi add indexes
- ✅ Use compound indexes khi cần (thay vì multiple single indexes)
- ✅ Remove unused indexes

**Xung đột tiềm ẩn:**
- ❌ **None identified**

---

### 3.2. Server-Side Caching

**Rủi ro:**
- ⚠️ **Stale Data:** Cache có thể show stale data nếu không invalidate đúng cách
- ⚠️ **Memory:** In-memory cache tốn RAM (nhưng categories và product metadata không lớn → OK)
- ⚠️ **Cache Invalidation:** Phải invalidate cache khi data update → có thể miss cases

**Giải pháp:**
- ✅ Comprehensive cache invalidation: Invalidate khi data được update
- ✅ Use TTL hợp lý: 5-10 phút cho product metadata, 30 phút cho categories
- ✅ Monitor cache hit rate để optimize TTL
- ✅ Use Redis nếu cần (better than in-memory for multi-instance)

**Xung đột tiềm ẩn:**
- ⚠️ **Hot Reload:** In-memory cache sẽ reset khi server restart/hot reload
  - **Impact:** First request sau restart sẽ chậm
  - **Solution:** OK, acceptable trade-off

---

### 3.3. Loading States & Progressive Loading

**Rủi ro:**
- ⚠️ **Complexity:** Progressive loading làm code phức tạp hơn
- ⚠️ **State Management:** Phải manage nhiều loading states → có thể có bugs

**Giải pháp:**
- ✅ Comprehensive testing: Test tất cả loading states
- ✅ Use loading state enum để avoid bugs
- ✅ Keep it simple: Don't over-engineer

**Xung đột tiềm ẩn:**
- ❌ **None identified**

---

## Security Vulnerabilities

### CSRF Token Caching
- ✅ **Safe:** Token được hash và validate ở server → cache không tăng risk
- ✅ **Safe:** Client chỉ cache plain token (không có secret) → OK
- ⚠️ **Risk:** Nếu token bị compromise → có thể dùng trong 24h
  - **Mitigation:** Server-side TTL = 24h, clear cache on logout, validate on every request

### Pre-fetching
- ✅ **Safe:** Pre-fetch chỉ là optimization, không thay đổi security model
- ✅ **Safe:** Vẫn validate token/authentication như bình thường

---

## Data Consistency Issues

### Stale Data
- ⚠️ **Risk:** Pre-fetched data có thể stale nếu product được update
- **Mitigation:** 
  - Version check khi dialog mở
  - React Query `staleTime` hợp lý (5 phút)
  - Auto-refetch nếu version mismatch

### Categories Cache
- ⚠️ **Risk:** Categories cache có thể stale nếu admin update categories
- **Mitigation:**
  - Invalidate cache khi categories được update
  - `staleTime: 30 minutes` (reasonable)
  - Show loading state khi fetch lại

---

## Edge Cases

### 1. User hovers vào button nhưng không click
- **Issue:** Wasted pre-fetch requests
- **Solution:** Debounce pre-fetch (300-500ms), cancel nếu không mở dialog

### 2. User click rất nhanh (trước khi pre-fetch hoàn thành)
- **Issue:** Dialog vẫn phải đợi fetch
- **Solution:** Show loading state, use React Query cache nếu available

### 3. Multiple tabs mở cùng lúc
- **Issue:** CSRF token cache có thể không sync giữa tabs
- **Solution:** Use sessionStorage (per-tab) thay vì localStorage (shared)

### 4. Network slow/intermittent
- **Issue:** Pre-fetch có thể fail
- **Solution:** Handle errors gracefully, fallback to normal fetch khi dialog mở

### 5. Session expires giữa pre-fetch và dialog open
- **Issue:** Pre-fetched data/token invalid
- **Solution:** Validate session/token khi dialog mở, fetch lại nếu invalid

---

## Recommendations

### High Priority Fixes
1. ✅ **Implement debouncing** cho pre-fetch (avoid wasted requests)
2. ✅ **Version validation** khi dialog mở (đảm bảo data fresh)
3. ✅ **Error handling** cho pre-fetch failures
4. ✅ **Loading states** cho lazy-loaded categories

### Medium Priority Fixes
5. ✅ **Cache invalidation** strategy cho categories (khi update)
6. ✅ **AbortController** cho pre-fetch cancellation

### Low Priority
7. ✅ **Monitoring** cho cache hit rates
8. ✅ **Metrics** để track performance improvements

---

## Testing Checklist

### Pre-fetching Tests
- [ ] Pre-fetch CSRF token on hover → token available when dialog opens
- [ ] Pre-fetch product data on hover → data available when dialog opens
- [ ] Pre-fetch cancellation khi user không mở dialog
- [ ] Pre-fetch với network slow/intermittent
- [ ] Pre-fetch với session expires

### Caching Tests
- [ ] CSRF token cache TTL = 24h
- [ ] Categories cache TTL = 30 minutes
- [ ] Cache invalidation khi data update
- [ ] Cache clear on logout

### Lazy Loading Tests
- [ ] Categories fetch only khi click vào field
- [ ] Loading state shown khi fetch categories
- [ ] Error handling khi categories fetch fail

### Data Consistency Tests
- [ ] Version mismatch detection (pre-fetched vs current)
- [ ] Auto-refetch khi version mismatch
- [ ] Stale data handling

---

## Critical Issues Found

### ⚠️ CRITICAL: CSRF Token Cache Không Có TTL Check

**Issue:** `csrfClient.ts` hiện tại cache token trong memory nhưng **KHÔNG check expiry time**. Token có thể được cache vô thời hạn, dẫn đến stale token issues.

**Location:** `lib/utils/csrfClient.ts` lines 8-60

**Current Implementation:**
```typescript
let csrfTokenCache: string | null = null;
// ... No TTL check, cache forever until cleared
```

**Risk:**
- Token expire nhưng vẫn được sử dụng → 403 errors
- Token invalid nhưng không fetch lại → User experience issues

**Fix Required:**
- Add `csrfTokenExpiresAt` timestamp to cache
- Check expiry before returning cached token
- Auto-fetch new token if expired

---

### ⚠️ CRITICAL: Product Fetch Duplicate với React Query

**Issue:** `ProductQuickEditDialog.tsx` đang fetch product data trực tiếp bằng `fetch()` thay vì dùng React Query. Điều này:
1. Không tận dụng React Query cache
2. Có thể duplicate requests nếu nhiều dialogs mở cùng lúc
3. Pre-fetching sẽ không benefit từ React Query cache

**Location:** `components/admin/products/ProductQuickEditDialog.tsx` lines 405-494

**Current Implementation:**
```typescript
fetch(`/api/admin/products/${productId}`, {
  credentials: 'include',
})
```

**Fix Required:**
- Create `useProduct` hook với React Query
- Replace direct `fetch()` với React Query hook
- Enable pre-fetching từ button hover

---

### ⚠️ MEDIUM: Categories Fetch Location

**Issue:** Kế hoạch đề xuất lazy-load categories, nhưng cần xác định chính xác khi nào Categories popover mở.

**Current Implementation:**
- `useCategories` được gọi với `enabled: open` (fetch khi dialog opens)
- Categories được sử dụng trong Categories field (cần check UI location)

**Fix Required:**
- Identify exact location của Categories popover
- Change `enabled` condition để chỉ fetch khi popover opens
- Add loading state trong popover

---

### ⚠️ MEDIUM: Pre-fetch Strategy Conflict

**Issue:** Kế hoạch đề xuất pre-fetch khi hover, nhưng có 3 nơi gọi Quick Edit Dialog:
1. `ProductCell.tsx` - Button "Sửa nhanh" (inline trong table)
2. `ProductActionMenu.tsx` - Dropdown menu item
3. `BulkActionsBar.tsx` - Bulk edit button

**Risk:**
- Hover trên button trong table → pre-fetch nhiều products (waste)
- Dropdown menu không có hover event rõ ràng
- Bulk edit không có single product → không thể pre-fetch

**Fix Required:**
- Only pre-fetch cho single product edit (không bulk)
- Debounce pre-fetch để tránh waste
- Consider using `onMouseEnter` với delay 300-500ms

---

### ⚠️ LOW: CSRF Token Cache Storage Type

**Issue:** Kế hoạch đề xuất `sessionStorage` cho CSRF token cache, nhưng hiện tại đang dùng in-memory cache.

**Current:** `let csrfTokenCache: string | null = null;` (in-memory, lost on page refresh)

**Proposed:** sessionStorage với TTL 24h

**Consideration:**
- sessionStorage persist across page refreshes (good)
- sessionStorage cleared khi tab closes (acceptable)
- TTL check needed in sessionStorage

**Fix Required:**
- Update `csrfClient.ts` để sử dụng sessionStorage
- Add TTL check khi đọc từ sessionStorage
- Clear sessionStorage khi token invalid/expired

---

## Conclusion

**Overall Risk Level: MEDIUM-HIGH**

Có một số vấn đề CRITICAL cần fix trước khi triển khai optimizations:

### Critical Issues (Fix First):
1. ✅ **CSRF Token Cache TTL Check** - Must fix before 1.1.2
2. ✅ **Product Fetch với React Query** - Must fix before 2.1.1 pre-fetching

### Medium Issues (Fix Before Phase 1):
3. ✅ **Categories Lazy Loading Location** - Need to identify exact UI location
4. ✅ **Pre-fetch Strategy** - Need to handle 3 different entry points

### Low Issues (Can Fix Later):
5. ✅ **CSRF Token Storage Type** - Can be done in Phase 1

**Recommendation:** 
1. Fix Critical Issues trước (CSRF TTL, React Query for products)
2. Test thoroughly sau mỗi fix
3. Sau đó proceed với Phase 1 optimizations với mitigations đã đề xuất

