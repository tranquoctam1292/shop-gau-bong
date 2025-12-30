# BÁO CÁO LỖI NGHIÊM TRỌNG - Shop Gấu Bông

**Ngày kiểm tra:** 2025-12-30
**Phiên bản:** 1.0.0

---

## TỔNG QUAN

| Loại kiểm tra | Kết quả |
|---------------|---------|
| TypeScript Type-check | ✅ PASS (0 lỗi) |
| Build Production | ✅ PASS |
| ESLint | ❌ 5 ERROR + 30 WARNING |
| npm audit | ❌ 3 lỗ hổng HIGH |

---

## 1. LỖI NGHIÊM TRỌNG (CRITICAL) - CẦN SỬA NGAY

### 1.1. Vi phạm Rules of Hooks (5 lỗi)

**Mức độ:** 🔴 CRITICAL - Có thể gây crash ứng dụng

| File | Dòng | Mô tả |
|------|------|-------|
| `components/admin/products/ProductQuickEditDialog/components/QuickEditComparisonTab.tsx` | 33 | Hook `useQuickEditFormContext` được gọi có điều kiện trong try-catch |
| `components/layout/DynamicNavigationMenu.tsx` | 47 | Hook `useMemo` được gọi SAU early return (dòng 36-41) |
| `components/product/ProductCard.tsx` | 224 | Hook `useMemo` được gọi SAU early return (dòng 216) |
| `components/product/ProductInfo.tsx` | 200 | Hook `useMemo` được gọi SAU early return (dòng 189-192) |
| `components/ui/dialog.tsx` | 90 | Thiếu định nghĩa rule `@typescript-eslint/no-explicit-any` |

**Giải thích:** React Hooks phải được gọi theo CÙNG THỨ TỰ trong mọi lần render. Khi có early return trước hook, số lượng hooks thay đổi giữa các lần render → crash.

**Cách sửa:**
```tsx
// ❌ SAI - Hook sau early return
if (!data) return null;
const memoized = useMemo(() => ..., [deps]);

// ✅ ĐÚNG - Tất cả hooks trước early return
const memoized = useMemo(() => ..., [deps]);
if (!data) return null;
```

---

### 1.2. Lỗ hổng Bảo mật npm (3 HIGH)

**Mức độ:** 🔴 HIGH

| Package | Lỗ hổng | Mô tả |
|---------|---------|-------|
| `glob` 10.2.0 - 10.4.5 | Command Injection | CLI: Command injection via -c/--cmd executes matches with shell:true |
| `@next/eslint-plugin-next` | Phụ thuộc glob | Ảnh hưởng bởi lỗ hổng glob |
| `eslint-config-next` | Phụ thuộc @next/eslint-plugin-next | Ảnh hưởng bởi lỗ hổng glob |

**Cách sửa:**
```bash
npm audit fix
```

---

## 2. LỖI TRUNG BÌNH (WARNING) - NÊN SỬA

### 2.1. Missing Dependencies trong React Hooks (26 cảnh báo)

**Mức độ:** 🟡 WARNING - Có thể gây stale data hoặc infinite loops

| File | Hook | Dependencies thiếu |
|------|------|---------------------|
| `app/admin/attributes/[id]/terms/page.tsx` | useEffect | `fetchAttribute`, `fetchTerms` |
| `app/admin/settings/contact-widget/components/ContactWidgetForm.tsx` | useMemo | `items` |
| `components/admin/AuthorForm.tsx` | useEffect | `formData.slug` |
| `components/admin/CategoryForm.tsx` | useEffect | `formData.slug` |
| `components/admin/media/MediaUploader.tsx` | useCallback | `uploadFilesSequentially` |
| `components/admin/OrderDetail.tsx` | useMemo | `order` |
| `components/admin/PostEditor.tsx` | useEffect | `formData.slug` |
| `components/admin/ProductForm.tsx` | useEffect | `showToast` |
| `components/admin/products/ComboProductsBuilder.tsx` | useEffect | `bundleProducts`, `onChange` |
| `components/admin/products/LoadingProgressIndicator.tsx` | useEffect | `timeElapsed` |
| `components/admin/products/ProductAnalytics.tsx` | useEffect | `fetchAnalytics` |
| `components/admin/products/ProductDataMetaBox/InventoryTab.tsx` | useEffect | `skuValue` |
| `components/admin/products/ProductReviews.tsx` | useEffect | `fetchReviews` |
| `components/admin/products/SEOMetaBox.tsx` | useMemo | `hasRelatedProducts` |
| `components/admin/products/VariantQuickEditTable.tsx` | useEffect | `variants` |
| `components/product/AdvancedFilters.tsx` | useMemo | `maxPrice`, `minPrice` |
| `components/product/ProductGallery.tsx` | useMemo | Biến `baseImages` thay đổi mỗi render |
| `lib/hooks/useCategoriesREST.ts` | useEffect | `params.parent` + complex expression |
| `lib/hooks/useShippingRates.ts` | useEffect | `shippingConfig`, `shippingItems` |
| `lib/hooks/useUndoRedo.ts` | useCallback | `canUndo`, `canRedo` |

**Cách sửa mẫu:**
```tsx
// ❌ SAI
useEffect(() => {
  fetchData();
}, []); // Missing fetchData

// ✅ ĐÚNG
const fetchData = useCallback(async () => {
  // logic
}, [dependencies]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

---

### 2.2. Ref Cleanup Warning (2 cảnh báo)

**Mức độ:** 🟡 WARNING

| File | Mô tả |
|------|-------|
| `components/admin/products/ClassicEditor/hooks/useClassicEditorPaste.ts` | `timeoutRefs.current` có thể thay đổi trước cleanup |
| `components/admin/products/ClassicEditor/hooks/useClassicEditorTimeout.ts` | `timeoutRefs.current` có thể thay đổi trước cleanup |

**Cách sửa:**
```tsx
useEffect(() => {
  const currentRefs = timeoutRefs.current; // Copy ref value
  return () => {
    currentRefs.forEach(clearTimeout); // Use copied value
  };
}, []);
```

---

### 2.3. Sử dụng `<img>` thay vì Next.js Image (3 cảnh báo)

**Mức độ:** 🟡 WARNING - Ảnh hưởng hiệu suất LCP

| File | Dòng |
|------|------|
| `components/admin/products/ImagePixelEditor.tsx` | 375 |
| `components/admin/products/RelatedProductsSelector.tsx` | 169 |
| `components/admin/products/sidebar/ProductGalleryBox.tsx` | 272 |

**Lưu ý:** Một số trường hợp dùng `<img>` là cần thiết (ví dụ: Cropper.js cần ref). Kiểm tra từng file trước khi sửa.

---

## 3. VẤN ĐỀ TIỀM ẨN KHÁC

### 3.1. Console.log trong Production (277 occurrences)

**Mức độ:** 🟠 INFO

Phát hiện 277 `console.log/error/warn` trong 129 files của thư mục `app/`. Theo `.cursorrules`, nên xóa debug console.log trước khi deploy.

**Gợi ý:** Chỉ giữ lại console.error cho error handling thực sự cần thiết.

---

### 3.2. Sử dụng dangerouslySetInnerHTML (16 occurrences)

**Mức độ:** 🟠 INFO - Đã được sanitize đúng cách

Các file sử dụng `dangerouslySetInnerHTML` đều đã sử dụng `sanitizeHtml()` hoặc là JSON schema hợp lệ:
- `lib/utils/sanitizeHtml.ts` - Định nghĩa sanitizer
- `app/(shop)/products/[slug]/page.tsx` - JSON-LD schema (an toàn)
- `components/layout/ScriptsInjector.tsx` - GA/FB Pixel scripts
- `app/admin/products/[id]/page.tsx` - Đã sanitize
- `components/product/ProductDescription.tsx` - Đã sanitize

**Kết luận:** ✅ Đã xử lý đúng XSS prevention

---

## 4. HÀNH ĐỘNG ĐỀ XUẤT

### Ưu tiên CAO (Sửa ngay):
1. [ ] Sửa 4 lỗi Rules of Hooks - Di chuyển hooks lên trước early return
2. [ ] Chạy `npm audit fix` để vá lỗ hổng glob

### Ưu tiên TRUNG BÌNH (Sửa trong sprint này):
3. [ ] Thêm missing dependencies vào 26 hooks
4. [ ] Sửa 2 ref cleanup warnings

### Ưu tiên THẤP (Backlog):
5. [ ] Review và dọn console.log không cần thiết
6. [ ] Kiểm tra 3 file dùng `<img>` xem có thể chuyển sang Next/Image không

---

## 5. LỆNH KIỂM TRA

```bash
# Kiểm tra lại sau khi sửa
npm run type-check    # TypeScript
npm run lint          # ESLint
npm run build         # Build production
npm audit             # Security vulnerabilities

# Pre-deploy check (chạy tất cả)
npm run pre-deploy
```

---

## 6. REVIEW CHI TIẾT - PHÂN TÍCH XUNG ĐỘT KHI SỬA

**Ngày review:** 2025-12-30

### 6.1. QuickEditComparisonTab.tsx (Dòng 33)

**Phân tích lỗi:**
```tsx
// Dòng 28-42: Hook được gọi trong if-else và try-catch
if (getValuesProp) {
  getValues = getValuesProp;
} else {
  try {
    const context = useQuickEditFormContext(); // ❌ Hook trong try-catch
    getValues = context.getValues;
  } catch (error) {
    throw new Error('...');
  }
}
```

**Đánh giá mức độ nghiêm trọng:** 🟡 **TRUNG BÌNH**

**Lý do:**
- ESLint báo lỗi vì hook có thể được gọi có điều kiện
- NHƯNG thực tế: Khi `getValuesProp` được truyền vào, hook KHÔNG được gọi → số lượng hooks thay đổi giữa các lần render
- Tuy nhiên, component này được dùng trong context của `ProductQuickEditDialog` và luôn có provider

**Xung đột tiềm ẩn khi sửa:**
- ⚠️ Nếu luôn gọi hook trước → Component sẽ LUÔN yêu cầu Provider, không thể dùng với `getValuesProp`
- ⚠️ Logic "fallback to context" sẽ bị phá vỡ
- ⚠️ Cần refactor lại API của component

**Giải pháp đề xuất:**
```tsx
// ✅ OPTION 1: Luôn gọi hook, bỏ qua nếu có prop
const contextValue = useQuickEditFormContext(); // Luôn gọi (yêu cầu Provider)
const getValues = getValuesProp || contextValue.getValues;

// ✅ OPTION 2: Tách thành 2 component
// - QuickEditComparisonTabWithContext (dùng context)
// - QuickEditComparisonTabWithProps (dùng props)
```

**Rủi ro:** ⚠️ TRUNG BÌNH - Cần test kỹ sau khi sửa

---

### 6.2. DynamicNavigationMenu.tsx (Dòng 47)

**Phân tích lỗi:**
```tsx
// Dòng 36-41: Early return TRƯỚC useMemo
if (!menu || !menu.items || menu.items.length === 0) {
  if (fallbackToHardcoded) {
    return <HardcodedNavigationMenu />;
  }
  return null;
}

// Dòng 47: useMemo SAU early return
const validItems = useMemo(() => {...}, [itemsKey]); // ❌ Sau early return
```

**Đánh giá mức độ nghiêm trọng:** 🔴 **CAO**

**Lý do:**
- Khi `menu` là null → return sớm → useMemo KHÔNG được gọi
- Khi `menu` có data → useMemo ĐƯỢC gọi
- Số lượng hooks thay đổi → Vi phạm Rules of Hooks

**Xung đột tiềm ẩn khi sửa:**
- ✅ Ít xung đột - chỉ cần di chuyển useMemo lên trước early return
- ⚠️ Cần kiểm tra `menu?.items` có thể null trong useMemo

**Giải pháp đề xuất:**
```tsx
// ✅ ĐÚNG: useMemo TRƯỚC early return
const itemsKey = menu?.items?.map(item => item.id).join(',') ?? '';
const validItems = useMemo(() => {
  if (!menu?.items) return [];
  return menu.items.filter((item) => item.url && item.url !== '#');
}, [itemsKey, menu?.items]);

// Early return SAU tất cả hooks
if (!menu || !menu.items || menu.items.length === 0) {
  if (fallbackToHardcoded) return <HardcodedNavigationMenu />;
  return null;
}
```

**Rủi ro:** ✅ THẤP - Sửa đơn giản, không ảnh hưởng logic

---

### 6.3. ProductCard.tsx (Dòng 224)

**Phân tích lỗi:**
```tsx
// Dòng 216: Early return
if (!product || !product.name) return null;

// Dòng 224: useMemo SAU early return
const isOutOfStock = useMemo(() => {...}, [product.stockStatus, selectedVariation]);
```

**Đánh giá mức độ nghiêm trọng:** 🔴 **CAO** (Component quan trọng - hiển thị trên trang chủ)

**Xung đột tiềm ẩn khi sửa:**
- ⚠️ Component có NHIỀU hooks phía trên (useState, useEffect, useMemo)
- ⚠️ Cần đếm và đảm bảo TẤT CẢ hooks trước early return
- ⚠️ useMemo `isOutOfStock` phụ thuộc vào `product.stockStatus` - cần handle null

**Phân tích hooks hiện tại (trước early return):**
1. `useState` x6 (dòng 31-48)
2. `useMemo` - hasRegularPrice (dòng 51)
3. `useProductVariations` (dòng 65)
4. `useEffect` x2 (dòng 75, 85)
5. `useSmallestSizeByPrice` (dòng 82)
6. `useVariationMatcher` (dòng 92)
7. `useMemo` - imageUrl (dòng 95)
8. `useProductPrice` (dòng 105)
9. `useMemo` x3 (dòng 108, 124, 181)

**Hooks SAU early return (cần di chuyển):**
1. `useMemo` - isOutOfStock (dòng 224) ← Phải di chuyển LÊN

**Giải pháp đề xuất:**
```tsx
// Di chuyển useMemo lên TRƯỚC early return (sau dòng 213)
const isOutOfStock = useMemo(() => {
  if (!product) return true; // Handle null product
  if (selectedVariation) {
    const variantStock = selectedVariation.stockQuantity ?? selectedVariation.stock;
    if (variantStock === undefined || variantStock === null) return true;
    return variantStock <= 0;
  }
  return product.stockStatus === 'outofstock';
}, [product, selectedVariation]); // Thêm product vào deps

// Early return giữ nguyên vị trí (dòng 216)
if (!product || !product.name) return null;
```

**Rủi ro:** 🟡 TRUNG BÌNH - Cần cập nhật dependencies của useMemo

---

### 6.4. ProductInfo.tsx (Dòng 200)

**Phân tích lỗi:**
```tsx
// Dòng 189-192: Early return
if (!product || !product.name) {
  console.warn('[ProductInfo] Product or product.name is missing');
  return null;
}

// Dòng 200: useMemo SAU early return
const isOutOfStock = useMemo(() => {...}, [product.stockStatus, selectedVariation]);
```

**Đánh giá mức độ nghiêm trọng:** 🔴 **CAO** (Component quan trọng - trang chi tiết sản phẩm)

**Xung đột tiềm ẩn khi sửa:**
- ⚠️ Giống ProductCard - cần di chuyển useMemo lên trước early return
- ⚠️ Cần handle null trong useMemo

**Giải pháp đề xuất:** Tương tự ProductCard

**Rủi ro:** 🟡 TRUNG BÌNH

---

### 6.5. dialog.tsx (Dòng 90) - ESLint Config Issue

**Phân tích:**
- Đây KHÔNG phải lỗi code, mà là lỗi ESLint config
- Rule `@typescript-eslint/no-explicit-any` chưa được định nghĩa trong `.eslintrc.json`

**Giải pháp:**
```json
// .eslintrc.json - Thêm rule
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**Rủi ro:** ✅ THẤP - Không ảnh hưởng runtime

---

## 7. MA TRẬN XUNG ĐỘT KHI SỬA

| Lỗi | Độ khó sửa | Rủi ro regression | Cần test | Ảnh hưởng |
|-----|------------|-------------------|----------|-----------|
| QuickEditComparisonTab | 🟡 Trung bình | 🟡 Trung bình | Unit test | Admin Quick Edit |
| DynamicNavigationMenu | ✅ Dễ | ✅ Thấp | Manual | Menu navigation |
| ProductCard | 🟡 Trung bình | 🟡 Trung bình | E2E | Trang chủ, listing |
| ProductInfo | 🟡 Trung bình | 🟡 Trung bình | E2E | Trang chi tiết SP |
| dialog.tsx (ESLint) | ✅ Dễ | ✅ Không | Không cần | Config only |

---

## 8. THỨ TỰ SỬA ĐỀ XUẤT

**Bước 1 - Sửa nhanh, rủi ro thấp:**
1. `DynamicNavigationMenu.tsx` - Di chuyển useMemo lên
2. `dialog.tsx` / `.eslintrc.json` - Thêm rule definition

**Bước 2 - Sửa cẩn thận, test kỹ:**
3. `ProductCard.tsx` - Di chuyển useMemo, cập nhật deps
4. `ProductInfo.tsx` - Di chuyển useMemo, cập nhật deps

**Bước 3 - Cần refactor:**
5. `QuickEditComparisonTab.tsx` - Xem xét refactor API

**Sau mỗi bước:**
```bash
npm run type-check && npm run lint && npm run build
```

---

## 9. LƯU Ý QUAN TRỌNG

### ⚠️ Về npm audit fix:
- Lỗ hổng `glob` nằm trong dependency của ESLint/Next.js
- `npm audit fix` có thể KHÔNG sửa được vì đây là transitive dependency
- Cần chờ update từ `@next/eslint-plugin-next`
- **Mức độ ảnh hưởng thực tế: THẤP** - chỉ ảnh hưởng CLI của glob, không ảnh hưởng runtime

### ⚠️ Về Missing Dependencies Warnings:
- Một số warning có thể là **cố ý** (dùng `// eslint-disable-next-line`)
- Thêm dependencies có thể gây **infinite loop** nếu không cẩn thận
- Cần review từng case cụ thể trước khi sửa

---

**Cập nhật bởi:** Claude Code
**Phiên bản review:** 1.1
