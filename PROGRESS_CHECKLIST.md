# PROGRESS CHECKLIST - Sửa Lỗi Nghiêm Trọng

**Tạo ngày:** 2025-12-30
**Cập nhật lần cuối:** 2025-12-30
**Trạng thái tổng:** 🟢 Phase 1 + Phase 2 HOÀN THÀNH

---

## TỔNG QUAN TIẾN ĐỘ

| Hạng mục | Tổng | Hoàn thành | Tiến độ |
|----------|------|------------|---------|
| Lỗi CRITICAL (Rules of Hooks) | 5 | 5 | ██████████ 100% |
| Lỗi Bảo mật (npm audit) | 3 | 3 | ██████████ 100% |
| Lỗi WARNING (Missing Deps) | 26 | 0 | ░░░░░░░░░░ 0% |
| Lỗi WARNING (Ref Cleanup) | 2 | 0 | ░░░░░░░░░░ 0% |
| Lỗi WARNING (img tag) | 3 | 0 | ░░░░░░░░░░ 0% |

---

## PHASE 1: LỖI CRITICAL - RULES OF HOOKS ✅ HOÀN THÀNH

### 1.1. DynamicNavigationMenu.tsx ✅
- **File:** `components/layout/DynamicNavigationMenu.tsx`
- **Dòng:** 47
- **Vấn đề:** useMemo sau early return
- **Độ khó:** ✅ Dễ
- **Rủi ro:** ✅ Thấp

| Bước | Mô tả | Trạng thái | Ngày |
|------|-------|------------|------|
| [x] | Di chuyển `useMemo` lên trước early return | ✅ Done | 2025-12-30 |
| [x] | Handle null trong useMemo | ✅ Done | 2025-12-30 |
| [x] | Loại bỏ `itemsKey` không cần thiết | ✅ Done | 2025-12-30 |
| [x] | Chạy `npm run type-check` | ✅ Pass | 2025-12-30 |
| [x] | Chạy `npm run lint` | ✅ Pass | 2025-12-30 |
| [ ] | Test manual: Menu hoạt động đúng | ⬜ Chưa | |

---

### 1.2. ProductCard.tsx ✅
- **File:** `components/product/ProductCard.tsx`
- **Dòng:** 224
- **Vấn đề:** useMemo `isOutOfStock` sau early return
- **Độ khó:** 🟡 Trung bình
- **Rủi ro:** 🟡 Trung bình

| Bước | Mô tả | Trạng thái | Ngày |
|------|-------|------------|------|
| [x] | Di chuyển `isOutOfStock` useMemo lên trước early return | ✅ Done | 2025-12-30 |
| [x] | Thêm `product` vào dependency array | ✅ Done | 2025-12-30 |
| [x] | Handle null product trong useMemo | ✅ Done | 2025-12-30 |
| [x] | Chạy `npm run type-check` | ✅ Pass | 2025-12-30 |
| [x] | Chạy `npm run lint` | ✅ Pass | 2025-12-30 |
| [ ] | Test: Trang chủ hiển thị đúng | ⬜ Chưa | |
| [ ] | Test: Quick add to cart hoạt động | ⬜ Chưa | |
| [ ] | Test: Out of stock badge hiển thị đúng | ⬜ Chưa | |

---

### 1.3. ProductInfo.tsx ✅
- **File:** `components/product/ProductInfo.tsx`
- **Dòng:** 200
- **Vấn đề:** useMemo `isOutOfStock` sau early return
- **Độ khó:** 🟡 Trung bình
- **Rủi ro:** 🟡 Trung bình

| Bước | Mô tả | Trạng thái | Ngày |
|------|-------|------------|------|
| [x] | Di chuyển `isOutOfStock` useMemo lên trước early return | ✅ Done | 2025-12-30 |
| [x] | Thêm `product` vào dependency array | ✅ Done | 2025-12-30 |
| [x] | Handle null product trong useMemo | ✅ Done | 2025-12-30 |
| [x] | Chạy `npm run type-check` | ✅ Pass | 2025-12-30 |
| [x] | Chạy `npm run lint` | ✅ Pass | 2025-12-30 |
| [ ] | Test: Trang chi tiết sản phẩm hiển thị đúng | ⬜ Chưa | |
| [ ] | Test: Add to cart hoạt động | ⬜ Chưa | |
| [ ] | Test: Chọn variation cập nhật giá đúng | ⬜ Chưa | |

---

### 1.4. QuickEditComparisonTab.tsx ✅
- **File:** `components/admin/products/ProductQuickEditDialog/components/QuickEditComparisonTab.tsx`
- **Dòng:** 33
- **Vấn đề:** Hook trong conditional (try-catch)
- **Độ khó:** 🟡 Trung bình
- **Rủi ro:** 🟡 Trung bình

| Bước | Mô tả | Trạng thái | Ngày |
|------|-------|------------|------|
| [x] | Sử dụng `useContext` trực tiếp thay vì hook wrapper | ✅ Done | 2025-12-30 |
| [x] | Loại bỏ try-catch, gọi hook unconditionally | ✅ Done | 2025-12-30 |
| [x] | Chạy `npm run type-check` | ✅ Pass | 2025-12-30 |
| [x] | Chạy `npm run lint` | ✅ Pass | 2025-12-30 |
| [ ] | Test: Quick Edit Dialog hoạt động | ⬜ Chưa | |
| [ ] | Test: Tab Comparison hiển thị đúng | ⬜ Chưa | |

---

### 1.5. dialog.tsx (ESLint Config) ✅
- **File:** `components/ui/dialog.tsx` + `.eslintrc.json`
- **Dòng:** 90
- **Vấn đề:** Missing ESLint rule definition
- **Độ khó:** ✅ Dễ
- **Rủi ro:** ✅ Thấp

| Bước | Mô tả | Trạng thái | Ngày |
|------|-------|------------|------|
| [x] | Thay `any` bằng typed assertion `{ current: HTMLDivElement \| null }` | ✅ Done | 2025-12-30 |
| [x] | Loại bỏ eslint-disable comment không cần thiết | ✅ Done | 2025-12-30 |
| [x] | Chạy `npm run lint` | ✅ Pass | 2025-12-30 |

---

## PHASE 2: LỖI BẢO MẬT ✅ HOÀN THÀNH

### 2.1. npm audit vulnerabilities ✅
- **Package:** glob, @next/eslint-plugin-next, eslint-config-next
- **Severity:** HIGH
- **Loại:** Command Injection

| Bước | Mô tả | Trạng thái | Ngày |
|------|-------|------------|------|
| [x] | Chạy `npm audit fix` | ❌ Không fix được | 2025-12-30 |
| [x] | Cập nhật eslint-config-next@14.2.35 | ❌ Vẫn còn lỗ hổng | 2025-12-30 |
| [x] | Thêm `overrides: { "glob": "^10.5.0" }` vào package.json | ✅ Done | 2025-12-30 |
| [x] | Xóa node_modules và cài lại | ✅ Done | 2025-12-30 |
| [x] | Chạy `npm audit` để verify | ✅ **0 vulnerabilities** | 2025-12-30 |
| [x] | Build production test | ✅ Pass | 2025-12-30 |

---

## PHASE 3: MISSING DEPENDENCIES (Ưu tiên cao)

### 3.1. Admin Pages

| File | Hook | Missing Deps | Trạng thái |
|------|------|--------------|------------|
| [ ] `app/admin/attributes/[id]/terms/page.tsx` | useEffect | `fetchAttribute`, `fetchTerms` | ⬜ |
| [ ] `components/admin/AuthorForm.tsx` | useEffect | `formData.slug` | ⬜ |
| [ ] `components/admin/CategoryForm.tsx` | useEffect | `formData.slug` | ⬜ |
| [ ] `components/admin/PostEditor.tsx` | useEffect | `formData.slug` | ⬜ |
| [ ] `components/admin/ProductForm.tsx` | useEffect | `showToast` | ⬜ |

### 3.2. Admin Components

| File | Hook | Missing Deps | Trạng thái |
|------|------|--------------|------------|
| [ ] `components/admin/media/MediaUploader.tsx` | useCallback | `uploadFilesSequentially` | ⬜ |
| [ ] `components/admin/OrderDetail.tsx` | useMemo | `order` | ⬜ |
| [ ] `components/admin/products/ComboProductsBuilder.tsx` | useEffect | `bundleProducts`, `onChange` | ⬜ |
| [ ] `components/admin/products/LoadingProgressIndicator.tsx` | useEffect | `timeElapsed` | ⬜ |
| [ ] `components/admin/products/ProductAnalytics.tsx` | useEffect | `fetchAnalytics` | ⬜ |
| [ ] `components/admin/products/ProductDataMetaBox/InventoryTab.tsx` | useEffect | `skuValue` | ⬜ |
| [ ] `components/admin/products/ProductReviews.tsx` | useEffect | `fetchReviews` | ⬜ |
| [ ] `components/admin/products/SEOMetaBox.tsx` | useMemo | `hasRelatedProducts` | ⬜ |
| [ ] `components/admin/products/VariantQuickEditTable.tsx` | useEffect | `variants` | ⬜ |

### 3.3. Settings & Contact Widget

| File | Hook | Missing Deps | Trạng thái |
|------|------|--------------|------------|
| [ ] `app/admin/settings/contact-widget/components/ContactWidgetForm.tsx` | useMemo | `items` | ⬜ |

### 3.4. Product Components (Frontend)

| File | Hook | Missing Deps | Trạng thái |
|------|------|--------------|------------|
| [ ] `components/product/AdvancedFilters.tsx` | useMemo | `maxPrice`, `minPrice` | ⬜ |
| [ ] `components/product/ProductGallery.tsx` | useMemo | `baseImages` variable | ⬜ |

### 3.5. Hooks

| File | Hook | Missing Deps | Trạng thái |
|------|------|--------------|------------|
| [ ] `lib/hooks/useCategoriesREST.ts` | useEffect | `params.parent` | ⬜ |
| [ ] `lib/hooks/useShippingRates.ts` | useEffect | `shippingConfig`, `shippingItems` | ⬜ |
| [ ] `lib/hooks/useUndoRedo.ts` | useCallback | `canUndo`, `canRedo` | ⬜ |

---

## PHASE 4: REF CLEANUP WARNINGS

| File | Trạng thái |
|------|------------|
| [ ] `components/admin/products/ClassicEditor/hooks/useClassicEditorPaste.ts` | ⬜ |
| [ ] `components/admin/products/ClassicEditor/hooks/useClassicEditorTimeout.ts` | ⬜ |

---

## PHASE 5: IMG TAG WARNINGS (Thấp)

| File | Dòng | Cần sửa? | Trạng thái |
|------|------|----------|------------|
| [ ] `components/admin/products/ImagePixelEditor.tsx` | 375 | Kiểm tra (Cropper.js?) | ⬜ |
| [ ] `components/admin/products/RelatedProductsSelector.tsx` | 169 | Có thể sửa | ⬜ |
| [ ] `components/admin/products/sidebar/ProductGalleryBox.tsx` | 272 | Kiểm tra | ⬜ |

---

## KIỂM TRA SAU KHI SỬA

### Checklist cuối cùng

| Kiểm tra | Lệnh | Trạng thái |
|----------|------|------------|
| [x] TypeScript | `npm run type-check` | ✅ Pass |
| [x] ESLint (0 Errors) | `npm run lint` | ✅ Pass (chỉ còn warnings) |
| [x] Build | `npm run build` | ✅ Pass |
| [ ] Security | `npm audit` | ⬜ |
| [ ] Pre-deploy | `npm run pre-deploy` | ⬜ |

### Test thủ công

| Trang/Chức năng | Trạng thái |
|-----------------|------------|
| [ ] Trang chủ - Hiển thị sản phẩm | ⬜ |
| [ ] Trang chi tiết sản phẩm | ⬜ |
| [ ] Chọn size/color variation | ⬜ |
| [ ] Add to cart | ⬜ |
| [ ] Menu navigation (desktop) | ⬜ |
| [ ] Menu navigation (mobile) | ⬜ |
| [ ] Admin - Quick Edit Dialog | ⬜ |
| [ ] Admin - Product list | ⬜ |

---

## LỊCH SỬ CẬP NHẬT

| Ngày | Người thực hiện | Nội dung |
|------|-----------------|----------|
| 2025-12-30 | Claude Code | Tạo checklist ban đầu |
| 2025-12-30 | Claude Opus 4.5 | ✅ Hoàn thành Phase 1: Sửa 5 lỗi CRITICAL Rules of Hooks |
| 2025-12-30 | Claude Opus 4.5 | ✅ Hoàn thành Phase 2: Fix 3 lỗ hổng bảo mật HIGH (glob override) |

---

## GHI CHÚ

### Ký hiệu trạng thái:
- ⬜ Chưa bắt đầu
- 🔄 Đang làm
- ✅ Hoàn thành
- ❌ Bỏ qua / Không cần
- ⚠️ Có vấn đề

### Cách cập nhật:
1. Đánh dấu `[x]` khi hoàn thành task
2. Cập nhật trạng thái và ngày
3. Cập nhật tiến độ ở phần TỔNG QUAN

### Liên kết:
- [Báo cáo lỗi chi tiết](./BAO_CAO_LOI_NGHIEM_TRONG.md)
- [CLAUDE.md](./CLAUDE.md)
