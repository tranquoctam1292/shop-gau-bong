# Kế Hoạch Refactor ProductQuickEditDialog.tsx

## 📊 Tổng Quan

**File hiện tại:** `components/admin/products/ProductQuickEditDialog.tsx`  
**Độ dài:** 5,172 dòng  
**Mục tiêu:** Giảm xuống < 500 dòng cho file chính, tách thành các component/hook nhỏ hơn

**Ngày tạo:** 2025-01-XX  
**Trạng thái:** Planning

---

## 🎯 Mục Tiêu Refactor

1. **Maintainability:** Mỗi file < 300 dòng, dễ tìm và sửa code
2. **Testability:** Test từng section/hook riêng lẻ
3. **Performance:** Chỉ re-render section thay đổi (React.memo)
4. **Reusability:** Tái sử dụng sections ở nơi khác
5. **Collaboration:** Giảm conflict khi làm việc nhóm

---

## 📋 Phân Tích Cấu Trúc Hiện Tại

### 1. Schema & Types (~150 dòng)
- `quickEditSchema` (Zod schema với 30+ fields)
- `QuickEditFormData` type
- `ProductQuickEditDialogProps` interface
- Helper functions (`nanToUndefined`)

### 2. Hooks & State Management (~800 dòng)
- **React Hooks:** `useState`, `useEffect`, `useMemo`, `useCallback` (153 instances)
- **Custom Hooks:**
  - `useQuickUpdateProduct` - Update logic
  - `useSkuValidation` - SKU validation
  - `useMobileKeyboard` - Mobile keyboard handling
  - `useCategories` - Categories fetching
  - `useProductHistory` - History tab
  - `useUndoRedo` - Undo/Redo functionality
  - `useProduct` - Product data fetching
- **Form State:** `useForm` với react-hook-form
- **Local State:** 20+ useState hooks

### 3. Event Handlers (~1,000 dòng)
- `onSubmit` - Form submission (bulk + single)
- `onError` - Form validation errors
- `handleStockQtyChange` - Stock quantity logic
- `handleFieldFocus` / `handleFieldBlur` - Field state management
- `handleOpenChange` / `handleCloseClick` - Dialog lifecycle
- Keyboard shortcuts handlers
- Version checking logic
- CSRF token pre-fetching

### 4. Form Content JSX (~3,000+ dòng)
- **Accordion Sections:**
  1. Basic Info Section (~400 dòng)
  2. Pricing Section (~300 dòng)
  3. Inventory Section (~250 dòng)
  4. Product Type Section (~200 dòng)
  5. Shipping Section (~300 dòng)
  6. Dimensions Section (~200 dòng)
  7. Categories Section (~300 dòng)
  8. Images Section (~400 dòng)
  9. SEO Section (~250 dòng)
  10. Variants Section (~400 dòng)
  11. Product Options Section (~200 dòng)
- **Tabs:** Edit, History, Comparison
- **Skip Links:** Accessibility navigation
- **Loading States:** Skeleton, progress indicators

### 5. Dialog/Sheet Wrapper (~500 dòng)
- Mobile Sheet component
- Desktop Dialog component
- Footer với buttons (Save, Cancel, Undo, Redo)
- Header với title và close button
- Keyboard shortcuts help dialog

---

## 🏗️ Cấu Trúc Mới Đề Xuất

```
components/admin/products/ProductQuickEditDialog/
├── index.tsx                          # Main component (~300 lines)
├── ProductQuickEditDialog.tsx        # Dialog/Sheet wrapper (~200 lines)
├── types.ts                          # Types & interfaces (~100 lines)
├── schema.ts                         # Zod schema (~150 lines)
│
├── sections/                        # Form sections
│   ├── BasicInfoSection.tsx         # ~300 lines
│   ├── PricingSection.tsx           # ~250 lines
│   ├── InventorySection.tsx         # ~200 lines
│   ├── ProductTypeSection.tsx       # ~150 lines
│   ├── ShippingSection.tsx          # ~250 lines
│   ├── DimensionsSection.tsx        # ~150 lines
│   ├── CategoriesSection.tsx         # ~250 lines
│   ├── ImagesSection.tsx            # ~350 lines
│   ├── SeoSection.tsx               # ~200 lines
│   ├── VariantsSection.tsx           # ~350 lines
│   └── ProductOptionsSection.tsx    # ~150 lines
│
├── components/                      # Shared components
│   ├── QuickEditDialogHeader.tsx    # ~100 lines
│   ├── QuickEditDialogFooter.tsx    # ~150 lines
│   ├── QuickEditTabs.tsx            # ~200 lines
│   ├── QuickEditHistoryTab.tsx      # ~200 lines
│   ├── QuickEditComparisonTab.tsx    # ~150 lines
│   └── QuickEditSkipLinks.tsx       # ~50 lines
│
├── hooks/                           # Custom hooks
│   ├── useQuickEditForm.ts          # Form setup & state (~300 lines)
│   ├── useQuickEditHandlers.ts      # Event handlers (~400 lines)
│   ├── useQuickEditValidation.ts     # Validation logic (~200 lines)
│   ├── useQuickEditLifecycle.ts     # Dialog lifecycle (~150 lines)
│   └── useQuickEditVersionCheck.ts  # Version checking (~100 lines)
│
└── utils/                           # Utility functions
    ├── formHelpers.ts               # Form field helpers (~100 lines)
    ├── fieldStateHelpers.ts         # Field state management (~100 lines)
    └── sectionHelpers.ts            # Section utilities (~50 lines)
```

**Tổng:** ~4,500 dòng (tách thành 30+ files nhỏ)

---

## 🔄 Strategy Refactor: Incremental & Safe

### Phase 0: Context API Setup (Prerequisite) ⚠️ CRITICAL
**Mục tiêu:** Setup Context API trước khi extract sections để tránh props drilling

**Why First:**
- Sections sẽ dùng Context thay vì props
- Phải setup trước khi extract sections
- Giảm refactoring effort cho sections

**Tasks:**
1. Tạo `QuickEditFormContext.tsx` với Context definition
2. Tạo `QuickEditFormProvider.tsx` với Provider component
3. Tạo `useQuickEditFormContext.ts` hook
4. Wrap form content trong Provider (trong file gốc)
5. Test: Đảm bảo Context works, không breaking changes

**Context Value Structure:**
```typescript
interface QuickEditFormContextValue {
  // Form methods (from react-hook-form)
  register: UseFormRegister<QuickEditFormData>;
  setValue: UseFormSetValue<QuickEditFormData>;
  watch: UseFormWatch<QuickEditFormData>;
  getValues: UseFormGetValues<QuickEditFormData>;
  reset: UseFormReset<QuickEditFormData>;
  
  // Form state
  errors: FieldErrors<QuickEditFormData>;
  formState: FormState<QuickEditFormData>;
  
  // Shared handlers
  handleFieldFocus: (fieldId: string, e?: React.FocusEvent) => void;
  handleFieldBlur: (e?: React.FocusEvent) => void;
  getFieldClassName: (field: string, value: any, hasError: boolean, isSaved: boolean, fieldId: string, isValid?: boolean) => string;
  getErrorCountForSection: (sectionId: string) => number;
  
  // Shared state
  savedFields: Set<string>;
  flashingFields: Set<string>;
  fieldOriginalValues: Record<string, any>;
  expandedSections: string[];
  setExpandedSections: (sections: string[]) => void;
  
  // Section-specific (optional, passed via props)
  skuValidation?: SkuValidationResult;
  categories?: Category[];
  isLoadingCategories?: boolean;
  variants?: Variant[];
  
  // Mode flags
  isBulkMode: boolean;
  isMobile: boolean;
}
```

**Memoization Strategy:**
```typescript
const contextValue = useMemo(() => ({
  register,
  setValue,
  watch,
  // ... other stable values
  handleFieldFocus,
  handleFieldBlur,
  getFieldClassName,
  // ... other handlers
}), [
  register, setValue, watch, // Form methods are stable
  handleFieldFocus, handleFieldBlur, getFieldClassName, // Handlers are memoized
  savedFields, flashingFields, fieldOriginalValues, // State values
  expandedSections,
  // ... other dependencies
]);
```

**Rủi ro:** ⚠️ MEDIUM (Context setup, memoization)  
**Thời gian:** 3-4 giờ

---

### Phase 1: Preparation (Không thay đổi code)
**Mục tiêu:** Chuẩn bị infrastructure, không breaking changes

1. ✅ Tạo cấu trúc thư mục mới
2. ✅ Tạo file `types.ts` và `schema.ts` (copy từ file gốc)
3. ✅ Tạo file `index.tsx` (re-export từ file gốc để backward compatibility)
4. ✅ Update imports trong file gốc để dùng types/schema từ files mới
5. ✅ **NEW:** Setup Context API (Phase 0)
6. ✅ Test: Đảm bảo không có breaking changes

**Rủi ro:** Thấp (chỉ tách code, không thay đổi logic)  
**Thời gian:** 1-2 giờ (sau Phase 0)

---

### Phase 2: Extract Form Sections (Low Risk)
**Mục tiêu:** Tách các Accordion sections thành components riêng

**Thứ tự ưu tiên (từ ít phụ thuộc đến nhiều phụ thuộc):**

1. **DimensionsSection** (ít phụ thuộc nhất)
   - Props: `formData`, `errors`, `register`, `setValue`, `watch`
   - Dependencies: `Input`, `Label`, `Ruler` icon
   - Risk: ⚠️ LOW

2. **ShippingSection**
   - Props: tương tự DimensionsSection
   - Dependencies: `Select`, `Input`, `Label`
   - Risk: ⚠️ LOW

3. **ProductTypeSection**
   - Props: tương tự
   - Dependencies: `Select`, `Input`, `Label`
   - Risk: ⚠️ LOW

4. **SeoSection**
   - Props: tương tự
   - Dependencies: `Input`, `Textarea`, `Label`
   - Risk: ⚠️ LOW

5. **ProductOptionsSection**
   - Props: tương tự
   - Dependencies: `Checkbox`, `Select`, `Label`
   - Risk: ⚠️ LOW

6. **InventorySection**
   - Props: tương tự + `handleStockQtyChange`
   - Dependencies: `Input`, `Select`, `Label`, stock logic
   - Risk: ⚠️ MEDIUM (có business logic)

7. **PricingSection**
   - Props: tương tự + `PriceInput`
   - Dependencies: `PriceInput`, validation logic
   - Risk: ⚠️ MEDIUM (có validation phức tạp)

8. **BasicInfoSection**
   - Props: tương tự + `skuValidation`, `handleFieldFocus`, `handleFieldBlur`
   - Dependencies: `Input`, `Label`, SKU validation hook
   - Risk: ⚠️ MEDIUM (có SKU validation)

9. **CategoriesSection**
   - Props: tương tự + `categories`, `isLoadingCategories`
   - Dependencies: `Popover`, `useCategories` hook
   - Risk: ⚠️ MEDIUM (có async data fetching)

10. **ImagesSection**
    - Props: tương tự + `MediaLibraryModal`
    - Dependencies: `MediaLibraryModal`, image handling
    - Risk: ⚠️ MEDIUM (có modal interaction)

11. **VariantsSection**
    - Props: tương tự + `VariantQuickEditTable`, variants data
    - Dependencies: `VariantQuickEditTable`, complex state
    - Risk: ⚠️ HIGH (phức tạp nhất, nhiều state)

**Quy trình cho mỗi section:**
1. Tạo file mới `sections/[SectionName]Section.tsx`
2. Copy JSX code từ file gốc
3. **Use Context:** Replace props với `useQuickEditFormContext()`
4. Extract props interface (chỉ section-specific props)
5. Update imports
6. Wrap component với `React.memo` để optimize re-renders
7. Replace trong file gốc: `<SectionComponent {...sectionSpecificProps} />`
8. Test: Manual testing + visual comparison
9. Commit: "refactor: extract [SectionName]Section"

**Example Section Structure:**
```typescript
'use client';

import { memo } from 'react';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DimensionsSectionProps {
  // Only section-specific props (if any)
  // Most props come from Context
}

export const DimensionsSection = memo(function DimensionsSection({
  // Section-specific props
}: DimensionsSectionProps) {
  const {
    register,
    setValue,
    watch,
    errors,
    handleFieldFocus,
    handleFieldBlur,
    getFieldClassName,
    savedFields,
    flashingFields,
  } = useQuickEditFormContext();

  const length = watch('length');
  const width = watch('width');
  const height = watch('height');

  return (
    <AccordionItem value="section-dimensions">
      {/* Section JSX */}
    </AccordionItem>
  );
});
```

**Rủi ro:** 
- ⚠️ MEDIUM: Props drilling (nhiều props cần pass)
- ⚠️ LOW: Breaking changes (nếu props interface sai)

**Thời gian:** 2-3 giờ/section × 11 sections = 22-33 giờ

---

### Phase 3: Extract Hooks (Medium Risk)
**Mục tiêu:** Tách business logic vào custom hooks

1. **useQuickEditForm.ts**
   - Form setup (`useForm`, `register`, `watch`, `setValue`)
   - Form state management
   - Initial data loading
   - Risk: ⚠️ MEDIUM (core form logic)

2. **useQuickEditHandlers.ts**
   - `onSubmit` handler
   - `onError` handler
   - `handleStockQtyChange`
   - `handleFieldFocus` / `handleFieldBlur`
   - Risk: ⚠️ MEDIUM (complex business logic)

3. **useQuickEditValidation.ts**
   - Field validation helpers
   - Error counting per section
   - Field state helpers (`getFieldClassName`)
   - Risk: ⚠️ LOW (pure functions)

4. **useQuickEditLifecycle.ts**
   - Dialog open/close handlers
   - Before unload warning
   - Keyboard shortcuts
   - Risk: ⚠️ MEDIUM (event listeners)

5. **useQuickEditVersionCheck.ts**
   - Version polling logic
   - Version mismatch detection
   - Risk: ⚠️ LOW (isolated logic)

**Quy trình:**
1. Tạo hook file mới
2. Move logic từ component vào hook
3. Return values/helpers từ hook
4. Update component để dùng hook
5. Test: Đảm bảo behavior giống hệt
6. Commit: "refactor: extract useQuickEdit[HookName]"

**Rủi ro:**
- ⚠️ HIGH: Hook dependencies (useEffect, useMemo dependencies)
- ⚠️ MEDIUM: State synchronization issues

**Thời gian:** 3-4 giờ/hook × 5 hooks = 15-20 giờ

---

### Phase 4: Extract Components (Low Risk)
**Mục tiêu:** Tách Dialog wrapper, Header, Footer, Tabs

1. **QuickEditDialogHeader.tsx**
   - Title, close button
   - Keyboard shortcuts button
   - Risk: ⚠️ LOW

2. **QuickEditDialogFooter.tsx**
   - Save, Cancel buttons
   - Undo/Redo buttons
   - Success indicator
   - Risk: ⚠️ LOW

3. **QuickEditTabs.tsx**
   - Tab navigation
   - Tab content rendering
   - Risk: ⚠️ LOW

4. **QuickEditHistoryTab.tsx**
   - History data display
   - Pagination
   - Risk: ⚠️ LOW

5. **QuickEditComparisonTab.tsx**
   - Version comparison UI
   - Risk: ⚠️ LOW

6. **QuickEditSkipLinks.tsx**
   - Accessibility skip links
   - Risk: ⚠️ LOW

**Quy trình:** Tương tự Phase 2

**Rủi ro:** ⚠️ LOW

**Thời gian:** 1-2 giờ/component × 6 components = 6-12 giờ

---

### Phase 5: Extract Utils (Low Risk)
**Mục tiêu:** Tách utility functions

1. **formHelpers.ts**
   - Field formatting helpers
   - Value conversion helpers
   - Risk: ⚠️ LOW

2. **fieldStateHelpers.ts**
   - `getFieldClassName` helper
   - Field state management
   - Risk: ⚠️ LOW

3. **sectionHelpers.ts**
   - Section error counting
   - Section utilities
   - Risk: ⚠️ LOW

**Quy trình:** Move pure functions, update imports

**Rủi ro:** ⚠️ LOW

**Thời gian:** 1 giờ/file × 3 files = 3 giờ

---

### Phase 6: Final Cleanup (Low Risk)
**Mục tiêu:** Cleanup file gốc, optimize imports

1. Remove unused imports
2. Remove duplicate code
3. Update comments
4. Optimize re-exports
5. Final testing

**Rủi ro:** ⚠️ LOW

**Thời gian:** 2-3 giờ

---

## ⚠️ Rủi Ro & Xung Đột

### 1. Props Drilling (High Risk) ⚠️ CRITICAL
**Vấn đề:** Nhiều sections cần nhiều props (formData, errors, register, setValue, watch, handlers)

**Phân tích chi tiết:**
- **Base props mỗi section cần:** `register`, `setValue`, `watch`, `errors`, `formState`
- **Shared handlers:** `handleFieldFocus`, `handleFieldBlur`, `getFieldClassName`
- **Shared state:** `savedFields`, `flashingFields`, `fieldOriginalValues`
- **Section-specific:** `skuValidation` (BasicInfo), `categories` (Categories), `variants` (Variants)
- **Tổng:** 15-20 props/section

**Giải pháp đề xuất:**
```typescript
// Option 1: Context API (Recommended)
interface QuickEditFormContextValue {
  // Form methods
  register: UseFormRegister<QuickEditFormData>;
  setValue: UseFormSetValue<QuickEditFormData>;
  watch: UseFormWatch<QuickEditFormData>;
  // Form state
  errors: FieldErrors<QuickEditFormData>;
  formState: FormState<QuickEditFormData>;
  // Shared handlers
  handleFieldFocus: (fieldId: string, e?: React.FocusEvent) => void;
  handleFieldBlur: (e?: React.FocusEvent) => void;
  getFieldClassName: (field: string, value: any, hasError: boolean, isSaved: boolean, fieldId: string, isValid?: boolean) => string;
  // Shared state
  savedFields: Set<string>;
  flashingFields: Set<string>;
  fieldOriginalValues: Record<string, any>;
  // Section-specific (optional)
  skuValidation?: SkuValidationResult;
  categories?: Category[];
  isLoadingCategories?: boolean;
  variants?: Variant[];
}

const QuickEditFormContext = createContext<QuickEditFormContextValue | null>(null);

// Hook để access context
export function useQuickEditFormContext() {
  const context = useContext(QuickEditFormContext);
  if (!context) {
    throw new Error('useQuickEditFormContext must be used within QuickEditFormProvider');
  }
  return context;
}
```

**Benefits:**
- Giảm props từ 15-20 xuống 0-2 props (chỉ section-specific)
- Type-safe với TypeScript
- Dễ test với mock context
- Centralized state management

**Implementation:**
- Wrap form content trong `QuickEditFormProvider`
- Sections dùng `useQuickEditFormContext()` thay vì props
- Section-specific props vẫn pass qua props (optional)

**Rủi ro:**
- ⚠️ MEDIUM: Context re-render nếu value object thay đổi
- **Giải pháp:** Memoize context value với `useMemo`

**Impact:** Giảm complexity đáng kể, dễ maintain

---

### 2. State Synchronization (High Risk) ⚠️ CRITICAL
**Vấn đề:** State được share giữa nhiều sections (ví dụ: `savedFields`, `expandedSections`)

**Phân tích chi tiết:**
- **Shared UI State:**
  - `expandedSections: string[]` - Accordion expanded state (used in all sections)
  - `savedFields: Set<string>` - Track saved fields (used in all sections for visual feedback)
  - `flashingFields: Set<string>` - Flash animation state (used in all sections)
  - `fieldOriginalValues: Record<string, any>` - Original values for comparison (used in all sections)
  
- **Form State:**
  - `snapshotInitialData: QuickEditFormData | null` - Critical cho dirty check
  - `formInitialized: boolean` - Critical flag để prevent false positive isDirty
  - `formIsDirty: boolean` - Form dirty state (from react-hook-form)
  
- **Complex Dependencies:**
  - `isDirty` calculation phụ thuộc vào `snapshotInitialData`, `formInitialized`, và 30+ watched fields
  - Form initialization có timing issue (150ms delay sau reset)
  - Dirty check dùng `normalizeValue` helper để compare values

**Giải pháp:**
- **Option 1: Context API (Recommended)**
  - Move shared state vào Context
  - Sections access qua `useQuickEditFormContext()`
  - Parent component quản lý state lifecycle
  
- **Option 2: Custom Hook**
  - Tạo `useQuickEditSharedState()` hook
  - Return shared state và setters
  - Sections dùng hook này

**Critical Considerations:**
- ⚠️ **Form Initialization Timing:** 
  - `formInitialized` flag có 150ms delay sau `reset()`
  - Phải đảm bảo timing không bị ảnh hưởng khi extract
  - Test thoroughly với form initialization flow
  
- ⚠️ **Dirty Check Logic:**
  - `isDirty` calculation phức tạp với 30+ fields
  - Dùng `normalizeValue` để compare
  - Phải preserve logic khi extract
  
- ⚠️ **State Update Order:**
  - `savedFields` → `flashingFields` → timeout cleanup
  - Phải preserve update order

**Documentation Required:**
- State dependencies diagram
- State update flow
- Timing constraints

**Impact:** Tránh state desync, nhưng cần cẩn thận với timing

---

### 3. Hook Dependencies (High Risk) ⚠️ CRITICAL
**Vấn đề:** `useEffect`, `useMemo`, `useCallback` dependencies có thể bị miss khi extract

**Phân tích chi tiết:**
- **102 useState/useEffect/useMemo/useCallback instances** trong file
- **126 watch/setValue/register calls** - form state dependencies
- **Complex dependency chains:**
  - `isDirty` depends on 30+ watched fields + `snapshotInitialData` + `formInitialized`
  - `initialData` depends on `product`, `productWithVariants`, `isBulkMode`
  - Form initialization effect depends on `open`, `snapshotInitialData`, `formInitializedCheckedRef`

**Critical Dependencies to Watch:**
1. **Form Initialization:**
   ```typescript
   useEffect(() => {
     if (open && snapshotInitialData && !formInitializedCheckedRef.current) {
       // 150ms delay logic
     }
   }, [open, snapshotInitialData]); // ⚠️ Must include snapshotInitialData
   ```

2. **Dirty Check:**
   ```typescript
   const isDirty = useMemo(() => {
     // Depends on 30+ watched fields
   }, [name, sku, status, ..., snapshotInitialData, formInitialized]); // ⚠️ All dependencies must be included
   ```

3. **Product Data Sync:**
   ```typescript
   useEffect(() => {
     // Sync product data when fetched
   }, [fetchedProduct, productWithVariants, isBulkMode]); // ⚠️ Complex dependencies
   ```

**Giải pháp:**
- **ESLint Rule:** Enable `react-hooks/exhaustive-deps` với error level
- **Dependency Audit Checklist:**
  - [ ] List all dependencies before extraction
  - [ ] Verify dependencies after extraction
  - [ ] Test với missing dependencies (should fail)
  - [ ] Test với extra dependencies (should work but may cause unnecessary re-renders)
  
- **Extraction Strategy:**
  - Extract hooks với ALL dependencies included
  - Document dependency rationale
  - Use `useMemo`/`useCallback` để stabilize dependencies
  
- **Testing:**
  - Test hook với different dependency combinations
  - Test edge cases (null, undefined, empty)
  - Test timing issues (delays, timeouts)

**Impact:** Tránh bugs do missing dependencies, nhưng cần review cẩn thận

---

### 4. Dynamic Imports (Medium Risk)
**Vấn đề:** File được import bằng `dynamic()` trong 3 files:
- `ProductCell.tsx`
- `ProductActionMenu.tsx`
- `BulkActionsBar.tsx`

**Giải pháp:**
- Giữ export name `ProductQuickEditDialog` trong `index.tsx`
- Update dynamic import path nếu cần: `'./ProductQuickEditDialog'` → `'./ProductQuickEditDialog/index'`
- Test dynamic import vẫn hoạt động

**Impact:** Tránh breaking changes cho consumers

---

### 5. Type Safety (Medium Risk)
**Vấn đề:** TypeScript types có thể bị miss khi extract

**Giải pháp:**
- Export types từ `types.ts`
- Use strict TypeScript mode
- Test type checking: `npm run type-check`

**Impact:** Tránh runtime errors

---

### 6. Form Initialization Timing (High Risk) ⚠️ CRITICAL
**Vấn đề:** Form initialization có timing issues phức tạp

**Phân tích chi tiết:**
- **150ms delay** sau `reset()` để ensure form values synchronized
- **formInitialized flag** prevents false positive `isDirty`
- **formInitializedCheckedRef** prevents re-checking on every field change
- **Timing sequence:**
  1. Dialog opens → `open = true`
  2. Product data fetched → `productWithVariants` set
  3. `initialData` calculated → `snapshotInitialData` set
  4. `reset(snapshotInitialData)` called
  5. **150ms delay** → `formInitialized = true`
  6. `isDirty` check enabled

**Critical Issues:**
- ⚠️ **Race Condition:** Nếu user types before 150ms delay, `isDirty` may be false
- ⚠️ **False Positive Prevention:** `formInitialized` flag critical để prevent false positive
- ⚠️ **Ref Cleanup:** `formInitializedCheckedRef` must reset when dialog closes

**Giải pháp:**
- **Preserve Timing Logic:** Không thay đổi 150ms delay khi extract
- **Document Timing:** Document why 150ms delay is needed
- **Test Timing:** Test với fast typing, slow typing, delayed product fetch
- **Alternative Approach (Future):** Consider using `reset()` callback hoặc `useEffect` với proper dependencies

**Impact:** Critical - timing issues có thể break dirty check logic

---

### 7. Testing Coverage (Medium Risk)
**Vấn đề:** Không có unit tests hiện tại, nhưng có complex logic cần test

**Phân tích chi tiết:**
- **Complex Logic to Test:**
  - Form initialization timing (150ms delay)
  - Dirty check với 30+ fields
  - `normalizeValue` helper với edge cases
  - Version mismatch detection
  - CSRF token refresh
  - Bulk update flow
  - Undo/Redo functionality

**Giải pháp:**
- **Manual Testing:** Sau mỗi phase, test full workflow
- **Visual Regression:** Screenshot comparison trước/sau refactor
- **Integration Testing:** Test với real API, real data
- **Edge Case Testing:**
  - Fast typing (before form initialization)
  - Slow typing (after form initialization)
  - Network errors
  - Version conflicts
  - Session expiry
  - Empty/null values
  - Large datasets (bulk mode)

**Test Scenarios (Priority Order):**
1. **P0 - Critical Paths:**
   - Open dialog → Fill form → Submit (single product)
   - Open dialog → Fill form → Submit (bulk mode)
   - Open dialog → Make changes → Cancel (unsaved warning)
   - Version mismatch detection
   
2. **P1 - Form State:**
   - Dirty check accuracy
   - Form initialization timing
   - Field state (focus, blur, saved, flashing)
   - Validation errors
   
3. **P2 - Edge Cases:**
   - Network errors
   - CSRF token refresh
   - Session expiry
   - Empty/null values
   - Large datasets

**Impact:** Đảm bảo behavior không thay đổi, nhưng cần comprehensive testing

---

### 8. Performance Considerations (Medium Risk)
**Vấn đề:** Refactor có thể ảnh hưởng performance nếu không cẩn thận

**Phân tích chi tiết:**
- **Current Optimizations:**
  - `useMemo` cho `initialData`, `isDirty`, `formData`
  - `useCallback` cho handlers
  - Selective `watch()` calls (không watch all fields)
  - Progressive loading cho sections
  
- **Potential Issues:**
  - Context re-renders nếu context value không memoized
  - Props drilling có thể cause unnecessary re-renders
  - Section components không memoized → re-render khi parent re-renders

**Giải pháp:**
- **Memoize Context Value:**
  ```typescript
  const contextValue = useMemo(() => ({
    register,
    setValue,
    watch,
    // ... other values
  }), [register, setValue, watch, /* ... dependencies */]);
  ```

- **Memoize Section Components:**
  ```typescript
  export const BasicInfoSection = React.memo(({ ...props }) => {
    // Component code
  });
  ```

- **Selective Re-renders:**
  - Use `React.memo` với custom comparison function
  - Use `useMemo`/`useCallback` để stabilize props
  - Avoid unnecessary context updates

- **Performance Testing:**
  - Measure render times trước/sau refactor
  - Test với large forms (50+ fields)
  - Test với bulk mode (100+ products)
  - Profile với React DevTools

**Impact:** Có thể improve performance nếu done correctly, nhưng có thể degrade nếu không cẩn thận

---

### 9. Git Conflicts (Medium Risk)
**Vấn đề:** File lớn dễ conflict khi nhiều người làm việc

**Giải pháp:**
- Refactor trong branch riêng: `refactor/quick-edit-dialog`
- Merge thường xuyên từ `main` để tránh conflicts
- Communicate với team về refactor plan

**Impact:** Tránh merge conflicts

---

## 🛡️ Phương Án Đảm Bảo An Toàn

### 1. Incremental Refactoring
- **Rule:** Chỉ refactor 1 section/hook tại một thời điểm
- **Benefit:** Dễ test, dễ rollback
- **Checkpoint:** Commit sau mỗi section/hook

---

### 2. Backward Compatibility
- **Rule:** Giữ export name `ProductQuickEditDialog` trong `index.tsx`
- **Benefit:** Không breaking changes cho consumers
- **Check:** Test dynamic imports vẫn hoạt động

---

### 3. Type Safety
- **Rule:** Strict TypeScript, no `any` types
- **Benefit:** Catch errors tại compile time
- **Check:** `npm run type-check` sau mỗi phase

---

### 4. Visual Regression Testing
- **Rule:** Screenshot comparison trước/sau refactor
- **Benefit:** Đảm bảo UI không thay đổi
- **Tool:** Manual testing + browser DevTools

---

### 5. Manual Testing Checklist
Sau mỗi phase, test các scenarios:

**Basic Functionality:**
- [ ] Open dialog (single product)
- [ ] Open dialog (bulk mode)
- [ ] Fill form fields
- [ ] Submit form (single)
- [ ] Submit form (bulk)
- [ ] Cancel dialog
- [ ] Close dialog với unsaved changes warning

**Form Validation:**
- [ ] Required fields validation
- [ ] Price validation (salePrice < regularPrice)
- [ ] SKU validation (real-time)
- [ ] Slug validation
- [ ] Error messages display

**Sections:**
- [ ] Expand/collapse sections
- [ ] Error badges trên section headers
- [ ] Skip links navigation
- [ ] Field focus/blur states
- [ ] Saved fields highlighting

**Tabs:**
- [ ] Switch tabs (Edit, History, Comparison)
- [ ] History pagination
- [ ] Version comparison

**Keyboard Shortcuts:**
- [ ] Ctrl+S (Save)
- [ ] Ctrl+Z (Undo)
- [ ] Ctrl+Y (Redo)
- [ ] Esc (Close)
- [ ] Tab navigation

**Mobile:**
- [ ] Sheet opens on mobile
- [ ] Keyboard handling
- [ ] Touch targets size
- [ ] Scroll behavior

**Edge Cases:**
- [ ] Version mismatch detection
- [ ] CSRF token refresh
- [ ] Network errors
- [ ] Loading states
- [ ] Empty states

---

### 6. Rollback Plan
**Nếu có lỗi nghiêm trọng:**

1. **Immediate:** Revert commit của phase gây lỗi
   ```bash
   git revert <commit-hash>
   ```

2. **Alternative:** Checkout file gốc từ `main` branch
   ```bash
   git checkout main -- components/admin/products/ProductQuickEditDialog.tsx
   ```

3. **Partial Rollback:** Chỉ rollback section/hook có vấn đề
   - Revert changes trong file đó
   - Hoặc copy code từ backup

**Backup Strategy:**
- Tạo branch backup: `backup/quick-edit-dialog-original`
- Commit file gốc vào backup branch trước khi refactor

---

### 7. Code Review Process
**Rule:** Code review bắt buộc trước khi merge

**Checklist cho reviewer:**
- [ ] Props interface đúng
- [ ] Hook dependencies đầy đủ
- [ ] Type safety (no `any`)
- [ ] No breaking changes
- [ ] Imports đúng
- [ ] Comments/documentation

---

### 8. Testing Strategy

**Unit Tests (Future):**
- Test từng section component riêng
- Test hooks với mock data
- Test utility functions

**Integration Tests:**
- Test form submission flow
- Test validation flow
- Test error handling

**E2E Tests (Future):**
- Test full user workflow
- Test với real API

**Hiện tại:** Manual testing + visual comparison

---

## 📅 Timeline Ước Tính

| Phase | Tasks | Time Estimate | Risk Level |
|-------|-------|---------------|------------|
| Phase 0: Context API Setup | Setup Context & Provider | 3-4 hours | ⚠️ MEDIUM |
| Phase 1: Preparation | Setup structure | 1-2 hours | ⚠️ LOW |
| Phase 2: Extract Sections | 11 sections | 22-33 hours | ⚠️ LOW-MEDIUM |
| Phase 3: Extract Hooks | 5 hooks | 15-20 hours | ⚠️ MEDIUM |
| Phase 4: Extract Components | 6 components | 6-12 hours | ⚠️ LOW |
| Phase 5: Extract Utils | 3 utils | 3 hours | ⚠️ LOW |
| Phase 6: Final Cleanup | Cleanup | 2-3 hours | ⚠️ LOW |
| **Testing & Review** | Manual testing | 10-15 hours | - |
| **Total** | | **59-104 hours** | |

**Recommendation:** Chia thành 2-3 sprints (2-3 tuần)

---

## ✅ Success Criteria

1. **File size:** Main file < 500 dòng
2. **No breaking changes:** Tất cả consumers vẫn hoạt động
3. **Type safety:** No TypeScript errors
4. **Visual consistency:** UI giống hệt trước refactor
5. **Performance:** Không degrade performance
6. **Test coverage:** Manual testing pass 100%

---

## 📝 Notes

- **Priority:** Medium (không urgent, nhưng nên làm để improve maintainability)
- **Dependencies:** Không có dependencies với features khác
- **Impact:** High (ảnh hưởng đến maintainability lâu dài)
- **Risk:** Medium (cần cẩn thận với state management và props)

---

## 🔗 Related Documents

- `docs/reports/QUICK_EDIT_UX_UI_UPGRADE_PLAN.md` - UX/UI features
- `docs/reports/QUICK_EDIT_PERFORMANCE_OPTIMIZATION_PLAN.md` - Performance optimizations
- `docs/product-module/COMPONENTS.md` - Component documentation

---

---

## 🔍 Deep Review Findings

### Critical Dependencies Mapping

**Form State Dependencies:**
- `initialData` → depends on: `product`, `productWithVariants`, `isBulkMode`
- `snapshotInitialData` → depends on: `initialData` (set when dialog opens)
- `formInitialized` → depends on: `snapshotInitialData`, `open` (150ms delay)
- `isDirty` → depends on: 30+ watched fields + `snapshotInitialData` + `formInitialized`

**Shared State Dependencies:**
- `savedFields` → updated in `onSuccess` callback
- `flashingFields` → updated in `onSuccess` callback, cleared after 1s
- `expandedSections` → managed by Accordion component
- `fieldOriginalValues` → set on field focus

**Event Handler Dependencies:**
- `handleFieldFocus` → depends on: `handleInputFocus` (from useMobileKeyboard)
- `handleFieldBlur` → no dependencies (simple setter)
- `getFieldClassName` → depends on: `savedFields`, `flashingFields`, `errors`
- `getErrorCountForSection` → depends on: `errors` (from react-hook-form)

**Custom Hook Dependencies:**
- `useQuickUpdateProduct` → depends on: `showToast`, `onSuccess`, `onError`
- `useSkuValidation` → depends on: `sku`, `productId`, `open`, `isBulkMode`
- `useCategories` → depends on: `categoriesPopoverOpen`
- `useProduct` → depends on: `productId`, `open`, `isBulkMode`

### Form Initialization Flow

```
1. Dialog opens (open = true)
   ↓
2. Product data fetch triggered (if productId exists)
   ↓
3. productWithVariants state updated
   ↓
4. initialData calculated (useMemo)
   ↓
5. snapshotInitialData set (useEffect)
   ↓
6. reset(snapshotInitialData) called
   ↓
7. [150ms delay] → formInitialized = true
   ↓
8. isDirty check enabled
```

**Critical Timing:**
- ⚠️ User can type before step 7 → `isDirty` may be false (prevented by `formInitialized` flag)
- ⚠️ Must preserve 150ms delay when extracting hooks

### Props Interface Standardization

**Base Props (via Context):**
- `register`, `setValue`, `watch`, `getValues`, `reset`
- `errors`, `formState`
- `handleFieldFocus`, `handleFieldBlur`
- `getFieldClassName`, `getErrorCountForSection`
- `savedFields`, `flashingFields`, `fieldOriginalValues`
- `expandedSections`, `setExpandedSections`

**Section-Specific Props:**
- `BasicInfoSection`: `skuValidation` (optional)
- `CategoriesSection`: `categories`, `isLoadingCategories` (optional)
- `VariantsSection`: `variants` (optional)
- Other sections: No section-specific props

**Result:** Most sections need 0 props (all from Context), only 3 sections need optional props

### Performance Optimization Strategy

**Current Optimizations:**
- ✅ Selective `watch()` calls (không watch all fields)
- ✅ `useMemo` cho `initialData`, `isDirty`, `formData`
- ✅ `useCallback` cho handlers
- ✅ Progressive loading cho sections

**After Refactor:**
- ✅ Context value memoized
- ✅ Section components memoized với `React.memo`
- ✅ Handlers memoized với `useCallback`
- ✅ Selective re-renders (only affected sections)

**Performance Testing:**
- Measure render times: Before vs After
- Test scenarios:
  - Single product edit (baseline)
  - Bulk edit (100 products)
  - Fast typing (before form init)
  - Slow typing (after form init)
  - Large form (all sections expanded)

---

**Last Updated:** 2025-01-XX  
**Status:** Deep Review Complete - Ready for Implementation

