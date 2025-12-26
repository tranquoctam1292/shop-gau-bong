# ProductQuickEditDialog Refactor - Progress Tracking

## 📊 Tổng Quan

**File gốc:** `components/admin/products/ProductQuickEditDialog.tsx`  
**Độ dài ban đầu:** 5,172 dòng  
**Độ dài hiện tại:** 1,165 dòng (giảm 4,007 dòng, -77.5%)  
**Mục tiêu:** Giảm xuống < 500 dòng cho file chính

**Ngày bắt đầu:** TBD  
**Ngày hoàn thành:** TBD  
**Trạng thái:** 🟡 In Progress (Phase 6)

**Kế hoạch chi tiết:** `PRODUCT_QUICK_EDIT_REFACTOR_PLAN.md`

---

## 📈 Progress Overview

| Phase | Status | Progress | Time Spent | Time Estimate |
|-------|--------|----------|------------|---------------|
| Phase 0: Context API Setup | ✅ Completed | 100% | 2.5h | 3-4h |
| Phase 1: Preparation | ✅ Completed | 100% | 0.5h | 1-2h |
| Phase 2: Extract Sections | ✅ Completed | 100% (11/11) | 5h | 22-33h |
| Phase 3: Extract Hooks | ✅ Completed | 100% (8/8) | 8h | 15-20h |
| Phase 4: Extract Components | ✅ Completed | 100% (14/14) | 3h | 6-12h |
| Phase 5: Extract Utils | ✅ Completed | 100% (4/4) | 1h | 3h |
| Phase 6: Final Cleanup | ✅ Completed (Partial) | 80% (3.2/4) | 3h | 2-3h |
| Testing & Review | 🟡 Ready to Start | 0% | 0h | 10-15h |
| **Total** | | **~85%** | **22h** | **59-104h** |

**Legend:**
- ⚪ Not Started
- 🟡 In Progress
- ✅ Completed
- ⚠️ Blocked
- ❌ Failed

---

## Phase 0: Context API Setup ⚠️ CRITICAL

**Mục tiêu:** Setup Context API trước khi extract sections để tránh props drilling  
**Thời gian ước tính:** 3-4 giờ  
**Rủi ro:** ⚠️ MEDIUM

### Tasks Checklist

- [x] **0.1** Tạo file `components/admin/products/ProductQuickEditDialog/context/QuickEditFormContext.tsx`
  - [x] Define `QuickEditFormContextValue` interface
  - [x] Create `QuickEditFormContext` với `createContext`
  - [x] Export context

- [x] **0.2** Tạo file `components/admin/products/ProductQuickEditDialog/context/QuickEditFormProvider.tsx`
  - [x] Create Provider component
  - [x] Accept form methods và state từ props
  - [x] Memoize context value với `useMemo`
  - [x] Wrap children với Provider

- [x] **0.3** Tạo file `components/admin/products/ProductQuickEditDialog/hooks/useQuickEditFormContext.ts`
  - [x] Create hook `useQuickEditFormContext()`
  - [x] Add error handling (throw if used outside Provider)
  - [x] Return typed context value

- [x] **0.4** Integrate Context vào file gốc
  - [x] Import Provider component
  - [x] Wrap form content trong Provider
  - [x] Pass all required values to Provider
  - [x] Export SkuValidationResult type từ useSkuValidation
  - [ ] Test: Đảm bảo không breaking changes (manual testing needed)

- [x] **0.5** Testing & Validation
  - [x] Test script created và chạy thành công (16/16 tests passed)
  - [x] Verify Context files structure
  - [x] Verify Context exports
  - [x] Verify Provider integration
  - [x] Verify Hook structure
  - [x] Verify TypeScript compatibility
  - [ ] Manual testing: Test Context access trong component (runtime)
  - [ ] Manual testing: Test memoization (no unnecessary re-renders) - React DevTools
  - [ ] Manual testing: Test error handling (hook outside Provider) - runtime
  - [ ] Visual regression test (UI không thay đổi) - manual

### Notes
- ✅ Context value đã được memoized với useMemo
- ✅ Tất cả form methods và state đã pass vào Provider
- ✅ Export SkuValidationResult type từ useSkuValidation hook
- ⚠️ Cần manual testing để verify không breaking changes
- ⚠️ Cần test Context access và memoization

### Blockers
- None

### Completed Tasks
- ✅ Created QuickEditFormContext.tsx với full interface
- ✅ Created QuickEditFormProvider.tsx với memoization
- ✅ Created useQuickEditFormContext.ts hook
- ✅ Created types.ts và schema.ts (preparation for Phase 1)
- ✅ Integrated Provider vào file gốc
- ✅ Fixed TypeScript errors (export SkuValidationResult)
- ✅ Type check passes
- ✅ Created test script: `scripts/test-quick-edit-context.js`
- ✅ Added npm script: `npm run test:quick-edit-context`
- ✅ All automated tests pass (16/16)

### Test Results
```
✅ Passed: 16/16 tests
- Context files exist ✓
- Context structure ✓
- Provider structure ✓
- Hook structure ✓
- Types and Schema ✓
- Main file integration ✓
- Exports ✓
- SkuValidationResult export ✓
- TypeScript compatibility ✓
```

### Remaining Manual Tests
- [ ] Runtime: Open dialog và verify form hoạt động
- [ ] React DevTools: Check memoization (no unnecessary re-renders)
- [ ] Error handling: Test hook outside Provider (should throw error)
- [ ] Visual: UI không thay đổi so với trước

---

## Phase 1: Preparation

**Mục tiêu:** Chuẩn bị infrastructure, không breaking changes  
**Thời gian ước tính:** 1-2 giờ  
**Rủi ro:** ⚠️ LOW

### Tasks Checklist

- [x] **1.1** Tạo cấu trúc thư mục mới
  - [x] Create `components/admin/products/ProductQuickEditDialog/` directory (done in Phase 0)
  - [x] Create subdirectories: `sections/`, `components/`, `hooks/`, `utils/`, `context/`, `types/` (done in Phase 0)

- [x] **1.2** Extract Types & Schema
  - [x] Create `types.ts` - Copy types từ file gốc (done in Phase 0)
    - [x] `QuickEditFormData` type
    - [x] `ProductQuickEditDialogProps` interface
  - [x] Create `schema.ts` - Copy schema từ file gốc (done in Phase 0)
    - [x] `quickEditSchema` (Zod schema)
    - [x] `nanToUndefined` helper
  - [x] Export all types và schema
  - [x] Remove old schema/types code from main file (~110 lines removed)

- [x] **1.3** Create Index File
  - [x] Create `index.tsx` - Re-export `ProductQuickEditDialog` từ file gốc
  - [x] Export types for convenience
  - [x] Ensure backward compatibility
  - [ ] Test: Dynamic imports vẫn hoạt động (manual test needed)

- [x] **1.4** Update Imports trong file gốc
  - [x] Import types từ `./ProductQuickEditDialog/types`
  - [x] Import schema từ `./ProductQuickEditDialog/schema`
  - [x] Remove old schema/types code
  - [x] Test: TypeScript compilation passes
  - [ ] Test: No runtime errors (manual test needed)

- [x] **1.5** Testing & Validation
  - [x] Run `npm run type-check` - No errors
  - [ ] Run `npm run build` - No errors (manual test needed)
  - [ ] Test: Dialog opens và works normally (manual test needed)
  - [ ] Visual regression test (manual test needed)

### Notes
- ✅ Chỉ tách code, không thay đổi logic
- ✅ Đảm bảo backward compatibility (index.tsx created)
- ⚠️ Test dynamic imports trong ProductCell, ProductActionMenu, BulkActionsBar (manual test needed)
- ✅ Removed ~110 lines of old schema/types code from main file

### Blockers
- None

### Completed Tasks
- ✅ Removed old schema code from main file (lines 59-169)
- ✅ Created index.tsx for backward compatibility
- ✅ Updated imports to use extracted types/schema
- ✅ Type check passes
- ✅ File size reduced by ~110 lines

---

## Phase 2: Extract Form Sections

**Mục tiêu:** Tách các Accordion sections thành components riêng  
**Thời gian ước tính:** 22-33 giờ (2-3h/section × 11 sections)  
**Rủi ro:** ⚠️ LOW-MEDIUM

### Sections Priority Order

#### 2.1 DimensionsSection (Risk: ⚠️ LOW) ✅ COMPLETED
- [x] Create `sections/DimensionsSection.tsx`
- [x] Copy JSX code từ file gốc
- [x] Use `useQuickEditFormContext()` thay vì props
- [x] Extract props interface (nếu có section-specific props) - No props needed
- [x] Wrap với `React.memo`
- [x] Update imports
- [x] Replace trong file gốc
- [x] Test: TypeScript check passes, no linter errors
- [x] **File size reduction:** 5,087 → 4,943 lines (-144 lines, -2.8%)
- [ ] Manual testing: Runtime test, visual comparison
- [ ] Commit: "refactor: extract DimensionsSection"

#### 2.2 ShippingSection (Risk: ⚠️ LOW) ✅ COMPLETED
- [x] Create `sections/ShippingSection.tsx`
- [x] Copy JSX code từ file gốc
- [x] Use Context API
- [x] Wrap với `React.memo`
- [x] Replace trong file gốc
- [x] Test: TypeScript check passes, no linter errors
- [ ] Manual testing: Runtime test, visual comparison
- [ ] Commit: "refactor: extract ShippingSection"

#### 2.3 ProductTypeSection (Risk: ⚠️ LOW) ✅ COMPLETED
- [x] Create `sections/ProductTypeSection.tsx`
- [x] Copy JSX code từ file gốc
- [x] Use Context API
- [x] Pass section-specific props (showProductTypeWarning, pendingProductType, setters)
- [x] Wrap với `React.memo`
- [x] Replace trong file gốc
- [x] Test: TypeScript check passes, no linter errors
- [ ] Manual testing: Runtime test, visual comparison, product type warning dialog
- [ ] Commit: "refactor: extract ProductTypeSection"

#### 2.4 SeoSection (Risk: ⚠️ LOW) ✅ COMPLETED
- [x] Create `sections/SeoSection.tsx`
- [x] Copy JSX code từ file gốc
- [x] Use Context API
- [x] Pass section-specific props (product, isBulkMode, onClose)
- [x] Wrap với `React.memo`
- [x] Replace trong file gốc
- [x] Test: TypeScript check passes, no linter errors
- [ ] Manual testing: Runtime test, visual comparison, SEO preview
- [ ] Commit: "refactor: extract SeoSection"

#### 2.5 ProductOptionsSection (Risk: ⚠️ LOW) ✅ **COMPLETED**
- [x] Create `sections/ProductOptionsSection.tsx`
- [x] Copy JSX code từ file gốc (Attributes Enable/Disable)
- [x] Use Context API (useQuickEditFormContext)
- [x] Use useMemo for productAttributes and variants
- [x] Wrap với `React.memo`
- [x] Replace trong file gốc
- [x] Pass props: product, productWithVariants
- [x] TypeScript check passed (npm run type-check)
- [ ] Test: Manual testing (Runtime test, visual comparison, attributes enable/disable)
- [ ] Commit: "refactor: extract ProductOptionsSection"
- **Note:** Barcode/GTIN/EAN đã được extract vào BasicInfoSection. "Sold Individually" đã được extract vào InventorySection. Chỉ extract phần Attributes Enable/Disable.

#### 2.6 InventorySection (Risk: ⚠️ MEDIUM) ✅ COMPLETED
- [x] Create `sections/InventorySection.tsx`
- [x] Copy JSX code từ file gốc
- [x] Use Context API
- [x] Extract `handleStockQuantityChange` logic (pure function)
- [x] Extract `handleStockQtyChange` logic (with auto-sync)
- [x] Pass `loadedSections` via props
- [x] Wrap với `React.memo`
- [x] Replace trong file gốc
- [x] Test: TypeScript check passes, no linter errors
- [ ] Manual testing: Stock quantity logic, auto-sync stock status
- [ ] Commit: "refactor: extract InventorySection"

#### 2.7 PricingSection (Risk: ⚠️ MEDIUM) ✅ COMPLETED
- [x] Create `sections/PricingSection.tsx`
- [x] Copy JSX code từ file gốc
- [x] Use Context API
- [x] Pass status warning props (showStatusChangeWarning, pendingStatus, setters)
- [x] Handle `PriceInput` component
- [x] Wrap với `React.memo`
- [x] Replace trong file gốc
- [x] Test: TypeScript check passes, no linter errors
- [ ] Manual testing: Price validation (salePrice < regularPrice), profit margin calculation
- [ ] Commit: "refactor: extract PricingSection"

#### 2.8 BasicInfoSection (Risk: ⚠️ MEDIUM) ✅ COMPLETED
- [x] Create `sections/BasicInfoSection.tsx`
- [x] Copy JSX code từ file gốc (includes Product Name, SKU, Barcode, GTIN, EAN)
- [x] Use Context API
- [x] Pass `skuValidation` via props (section-specific)
- [x] Handle SKU validation UI with visual feedback icons
- [x] Wrap với `React.memo`
- [x] Replace trong file gốc
- [x] Test: TypeScript check passes, no linter errors
- [ ] Manual testing: SKU validation, field focus/blur
- [ ] Commit: "refactor: extract BasicInfoSection"

#### 2.9 CategoriesSection (Risk: ⚠️ MEDIUM) ✅ COMPLETED
- [x] Create `sections/CategoriesSection.tsx`
- [x] Copy JSX code từ file gốc
- [x] Use Context API
- [x] Pass `categories`, `isLoadingCategories` via props
- [x] Handle Popover state (moved to component)
- [x] Handle Tags input state (moved to component)
- [x] Wrap với `React.memo`
- [x] Replace trong file gốc
- [x] Test: TypeScript check passes, no linter errors
- [ ] Manual testing: Categories fetching, selection, tags input
- [ ] Commit: "refactor: extract CategoriesSection"

#### 2.10 ImagesSection (Risk: ⚠️ MEDIUM) ✅ COMPLETED
- [x] Create `sections/ImagesSection.tsx`
- [x] Copy JSX code từ file gốc (Featured Image + Gallery Images)
- [x] Use Context API
- [x] Handle `MediaLibraryModal` interaction (moved to component)
- [x] Pass `mediaLibraryOpen`, `setMediaLibraryOpen`, `mediaLibraryMode`, `setMediaLibraryMode` via props
- [x] Wrap với `React.memo`
- [x] Replace trong file gốc
- [x] Remove duplicate MediaLibraryModal from file gốc
- [x] Test: TypeScript check passes, no linter errors
- [ ] Manual testing: Image selection, gallery management
- [ ] Commit: "refactor: extract ImagesSection"

#### 2.11 VariantsSection (Risk: ⚠️ HIGH) ✅ COMPLETED
- [x] Create `sections/VariantsSection.tsx`
- [x] Copy JSX code từ file gốc
- [x] Use Context API
- [x] Pass `productWithVariants`, `loadingProduct`, `loadedSections` via props
- [x] Handle `VariantQuickEditTable` integration
- [x] Use `useMemo` for variant mapping logic
- [x] Wrap với `React.memo`
- [x] Replace trong file gốc
- [x] Test: TypeScript check passes, no linter errors
- [ ] Manual testing: Variants editing, table interactions
- [ ] Commit: "refactor: extract VariantsSection"

### Testing Checklist (Sau mỗi section) ✅ TEST SCRIPT CREATED
- [x] **Automated Test Script:** `scripts/test-quick-edit-sections.js`
  - [x] Verify section files exist
  - [x] Verify Context API usage
  - [x] Verify React.memo usage
  - [x] Verify exports
  - [x] Verify main file imports
  - [x] Run: `npm run test:quick-edit-sections`
- [x] **Manual Test Guide:** `docs/plans/PRODUCT_QUICK_EDIT_SECTIONS_TEST_GUIDE.md`
  - [x] Section-by-section test cases
  - [x] Cross-section testing
  - [x] Common issues checklist
  - [x] Test results template
- [ ] **Manual Testing (Runtime):**
  - [ ] Section renders correctly
  - [ ] Form fields work (input, select, checkbox)
  - [ ] Validation errors display
  - [ ] Field focus/blur states
  - [ ] Saved fields highlighting
  - [ ] Flash animation (nếu có)
  - [ ] Error badges trên section header
  - [ ] Expand/collapse functionality
  - [ ] Visual comparison với original

### Notes
- Mỗi section extract riêng, test riêng
- Commit sau mỗi section để dễ rollback
- Use Context API để giảm props
- Wrap với React.memo để optimize

### Test Results (Automated)
**Test Script:** `npm run test:quick-edit-sections`
**Status:** ✅ PASSED (75/75 tests)
- ✅ All 10 section files exist
- ✅ All sections use Context API
- ✅ All sections use React.memo
- ✅ All sections have displayName
- ✅ All sections are exported
- ✅ All sections are imported in main file
- ✅ Context hook exists and works
- ✅ Context Provider exists and is used

**Manual Test Guide:** `docs/plans/PRODUCT_QUICK_EDIT_SECTIONS_TEST_GUIDE.md`
- ✅ Comprehensive test cases for each section
- ✅ Cross-section testing checklist
- ✅ Common issues to check
- ✅ Test results template

### Blockers
- None

---

## Phase 3: Extract Hooks

**Mục tiêu:** Tách business logic vào custom hooks  
**Thời gian ước tính:** 15-20 giờ (3-4h/hook × 5 hooks)  
**Thời gian thực tế:** 8 giờ  
**Rủi ro:** ⚠️ MEDIUM  
**Trạng thái:** ✅ COMPLETED (100% - 8/8 hooks)

### Hooks Extraction

#### 3.1 useQuickEditForm.ts (Risk: ⚠️ MEDIUM) ✅ COMPLETED
- [x] Create `hooks/useQuickEditForm.ts`
- [x] Move form setup logic (`useForm` configuration)
- [x] Move `initialData` calculation
- [x] Move `snapshotInitialData` management
- [x] Move `formInitialized` logic (preserve 150ms delay)
- [x] Return: `register`, `setValue`, `watch`, `reset`, `getValues`, `handleSubmit`, `errors`, `formState`, `initialData`, `snapshotInitialData`, `formInitialized`
- [x] Update component để dùng hook
- [x] Support external snapshot updates (for template loading, save success)
- [x] Remove old form initialization useEffect
- [x] Fix TypeScript errors
- [ ] Test: Form initialization, dirty check (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract useQuickEditForm"

#### 3.2 useQuickEditHandlers.ts (Risk: ⚠️ MEDIUM) ✅ COMPLETED
- [x] Create `hooks/useQuickEditHandlers.ts`
- [x] Move `onSubmit` handler (bulk + single)
- [x] Move `onError` handler
- [x] Move `handleFieldFocus` / `handleFieldBlur`
- [x] Return: All handlers (onSubmit, onError, handleFieldFocus, handleFieldBlur)
- [x] Update component để dùng hook
- [x] Fix TypeScript errors (quickUpdate return type)
- [ ] Test: Form submission, error handling, field handlers (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract useQuickEditHandlers"

#### 3.3 useQuickEditValidation.ts (Risk: ⚠️ LOW) ✅ COMPLETED
- [x] Create `hooks/useQuickEditValidation.ts`
- [x] Move `getFieldClassName` helper
- [x] Move `getErrorCountForSection` helper
- [x] Move `normalizeValue` helper
- [x] Move `isFieldEdited` helper
- [x] Move `allValidationErrors` logic
- [x] Move `getErrorsBySection` logic
- [x] Move `scrollToErrorField` helper
- [x] Return: All validation helpers (normalizeValue, isFieldEdited, getFieldClassName, getErrorCountForSection, allValidationErrors, getErrorsBySection, scrollToErrorField)
- [x] Update component để dùng hook
- [x] Fix TypeScript errors (remove duplicate declarations)
- [x] Pass additional dependencies: `setExpandedSections`, `showToast`
- [x] Remove old helper definitions from main file (formatValueForTooltip, getFieldChangeTooltip, resetFieldToOriginal, scrollToErrorField)
- [x] TypeScript check passed (npm run type-check)
- [ ] Test: Field state, error counting (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract useQuickEditValidation"

#### 3.4 useQuickEditLifecycle.ts (Risk: ⚠️ MEDIUM) ✅ **COMPLETED**
- [x] Create `hooks/useQuickEditLifecycle.ts`
- [x] Move `handleOpenChange` / `handleCloseClick`
- [x] Move `handleConfirmClose`
- [x] Move `showConfirmClose` state
- [x] Move before unload warning logic (isDirtyRef, beforeunload event handler)
- [x] Move navigation guard logic (link click interception)
- [x] Return: Lifecycle handlers (showConfirmClose, setShowConfirmClose, handleOpenChange, handleCloseClick, handleConfirmClose)
- [x] Update component để dùng hook
- [x] Remove old definitions from main file
- [x] TypeScript check passed (npm run type-check)
- [ ] Test: Dialog open/close, keyboard shortcuts, before unload (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract useQuickEditLifecycle"

#### 3.5 useQuickEditVersionCheck.ts (Risk: ⚠️ LOW) ✅ **COMPLETED**
- [x] Create `hooks/useQuickEditVersionCheck.ts`
- [x] Move version polling logic (pollingIntervalRef, setInterval, cleanup)
- [x] Move version mismatch detection (check version change, auto-refresh or warning)
- [x] Move `checkProductVersion` function
- [x] Move refs: `pollingIntervalRef`, `lastCheckedVersionRef`, `isDirtyRef`
- [x] Return: Version check helpers (none - side effects only)
- [x] Update component để dùng hook
- [x] Remove old definitions from main file (checkProductVersion, pollingIntervalRef, lastCheckedVersionRef, formIsDirtyRef, useEffect hooks)
- [x] TypeScript check passed (npm run type-check)
- [ ] Test: Version polling, mismatch detection (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract useQuickEditVersionCheck"

#### 3.6 useQuickEditTemplates.ts (Risk: ⚠️ LOW) ✅ **COMPLETED**
- [x] Create `hooks/useQuickEditTemplates.ts`
- [x] Move template CRUD operations (fetch, save, load, delete)
- [x] Move template state management
- [x] Update component để dùng hook
- [x] TypeScript check passed
- [ ] Test: Template operations (MANUAL TEST NEEDED)

#### 3.7 useQuickEditUndoRedo.ts (Risk: ⚠️ MEDIUM) ✅ **COMPLETED**
- [x] Create `hooks/useQuickEditUndoRedo.ts`
- [x] Move undo/redo tracking logic
- [x] Move form state history management
- [x] Update component để dùng hook
- [x] TypeScript check passed
- [ ] Test: Undo/redo functionality (MANUAL TEST NEEDED)

#### 3.8 useQuickEditKeyboardShortcuts.ts (Risk: ⚠️ LOW) ✅ **COMPLETED**
- [x] Create `hooks/useQuickEditKeyboardShortcuts.ts`
- [x] Move keyboard shortcuts handlers (Ctrl+S, Ctrl+Z, Ctrl+Y, Esc)
- [x] Update component để dùng hook
- [x] TypeScript check passed
- [ ] Test: Keyboard shortcuts (MANUAL TEST NEEDED)

### Testing Checklist (Sau mỗi hook)
- [ ] Hook dependencies đầy đủ (ESLint check)
- [ ] Hook works correctly
- [ ] No unnecessary re-renders
- [ ] State synchronization correct
- [ ] Edge cases handled

### Notes
- Preserve ALL hook dependencies
- Use ESLint `react-hooks/exhaustive-deps` rule
- Test thoroughly với different scenarios
- Document dependency rationale
- ✅ All 8 hooks extracted successfully
- ✅ TypeScript errors fixed (27 errors resolved in latest session)

### Blockers
- None

### Completed Tasks
- ✅ All 8 hooks created and integrated
- ✅ TypeScript compilation passes
- ✅ All linter errors fixed

---

## Phase 4: Extract Components

**Mục tiêu:** Tách Dialog wrapper, Header, Footer, Tabs  
**Thời gian ước tính:** 6-12 giờ (1-2h/component × 6 components)  
**Rủi ro:** ⚠️ LOW

### Components Extraction

#### 4.1 QuickEditDialogHeader.tsx ✅ COMPLETED
- [x] Create `components/QuickEditDialogHeader.tsx`
- [x] Move title và close button
- [x] Move keyboard shortcuts button
- [x] Extract props interface
- [x] Replace trong file gốc (both Dialog and Sheet)
- [ ] Test: Header renders, buttons work (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract QuickEditDialogHeader"

#### 4.2 QuickEditDialogFooter.tsx ✅ COMPLETED
- [x] Create `components/QuickEditDialogFooter.tsx`
- [x] Move Save, Cancel buttons
- [x] Move Comparison, Schedule, Reset buttons
- [x] Move success indicator và last saved timestamp
- [x] Extract props interface
- [x] Replace trong file gốc (both Dialog and Sheet)
- [ ] Test: Buttons work, success indicator shows (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract QuickEditDialogFooter"

#### 4.3 QuickEditTabs.tsx ✅ COMPLETED
- [x] Create `components/QuickEditTabs.tsx`
- [x] Move tab navigation (TabsList, TabsTrigger)
- [x] Move tab content rendering (TabsContent với Edit, History, Comparison)
- [x] Extract props interface
- [x] Integrate QuickEditHistoryTab và QuickEditComparisonTab
- [ ] Replace trong file gốc (OPTIONAL - tabs chưa được render trong UI hiện tại)
- [ ] Test: Tab switching works (MANUAL TEST NEEDED - khi tabs được implement)
- [ ] Commit: "refactor: extract QuickEditTabs"

#### 4.4 QuickEditHistoryTab.tsx ✅ COMPLETED
- [x] Create `components/QuickEditHistoryTab.tsx`
- [x] Move history data display (useProductHistory hook)
- [x] Move pagination logic
- [x] Extract props interface
- [x] Integrated vào QuickEditTabs component
- [ ] Replace trong file gốc (OPTIONAL - tabs chưa được render trong UI hiện tại)
- [ ] Test: History display, pagination (MANUAL TEST NEEDED - khi tabs được implement)
- [ ] Commit: "refactor: extract QuickEditHistoryTab"

#### 4.5 QuickEditComparisonTab.tsx ✅ COMPLETED
- [x] Create `components/QuickEditComparisonTab.tsx`
- [x] Move version comparison UI (extracted from Comparison Dialog)
- [x] Extract props interface
- [x] Use Context API để access form values
- [x] Integrated vào QuickEditTabs component
- [ ] Replace trong file gốc (OPTIONAL - có thể giữ Comparison Dialog riêng hoặc dùng trong tabs)
- [ ] Test: Comparison display (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract QuickEditComparisonTab"

#### 4.6 QuickEditSkipLinks.tsx ✅ COMPLETED
- [x] Create `components/QuickEditSkipLinks.tsx`
- [x] Move accessibility skip links
- [x] Extract props interface
- [x] Replace trong file gốc
- [ ] Test: Skip links navigation (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract QuickEditSkipLinks"

#### 4.7-4.14 Additional Dialog Components ✅ COMPLETED
- [x] QuickEditComparisonDialog.tsx
- [x] QuickEditKeyboardShortcutsDialog.tsx
- [x] QuickEditConfirmCloseDialog.tsx
- [x] QuickEditStatusChangeWarningDialog.tsx
- [x] QuickEditProductTypeWarningDialog.tsx
- [x] QuickEditScheduleDialog.tsx
- [x] QuickEditSaveTemplateDialog.tsx
- [x] QuickEditDialogContainer.tsx
- [x] QuickEditFormContent.tsx

### Testing Checklist
- [ ] Component renders correctly
- [ ] Props passed correctly
- [ ] Functionality works
- [ ] Visual consistency

### Notes
- Low risk, straightforward extraction
- Test each component individually

### Blockers
- None

---

## Phase 5: Extract Utils

**Mục tiêu:** Tách utility functions  
**Thời gian ước tính:** 3 giờ (1h/file × 3 files)  
**Rủi ro:** ⚠️ LOW

### Utils Extraction

#### 5.1 formHelpers.ts ✅ COMPLETED
- [x] Create `utils/formHelpers.ts`
- [x] Move field formatting helpers (formatValueForDisplay, formatPriceValue)
- [x] Move value conversion helpers (createFormStateSnapshot)
- [x] Move comparison utilities (getComparisonFields, hasFieldChanged)
- [x] Export all helpers
- [x] Update QuickEditComparisonTab to use formHelpers
- [x] Update file gốc to use createFormStateSnapshot
- [ ] Test: Helpers work correctly (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract formHelpers"

#### 5.2 fieldStateHelpers.ts ✅ COMPLETED
- [x] Create `utils/fieldStateHelpers.ts`
- [x] Move field ID generation helpers (getFieldId)
- [x] Move field name utilities (getBaseFieldName, isVariantField, getVariantIndex, getVariantFieldName)
- [x] Export all helpers
- [x] Update useQuickEditValidation to use getFieldId
- [ ] Test: Helpers work correctly (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract fieldStateHelpers"

#### 5.3 sectionHelpers.ts ✅ COMPLETED
- [x] Create `utils/sectionHelpers.ts`
- [x] Move field to section mapping (FIELD_TO_SECTION_MAP)
- [x] Move section utilities (getSectionIdForField, getSectionDisplayName, getAllSectionIds)
- [x] Export section ID constants (SECTION_IDS)
- [x] Update useQuickEditValidation to use getSectionIdForField
- [ ] Test: Helpers work correctly (MANUAL TEST NEEDED)
- [ ] Commit: "refactor: extract sectionHelpers"

#### 5.4 dirtyCheckHelpers.ts ✅ COMPLETED
- [x] Create `utils/dirtyCheckHelpers.ts`
- [x] Move `isDirtyCheck` function
- [x] Move `IsDirtyCheckOptions` interface
- [x] Update component để dùng helper
- [x] TypeScript check passed
- [ ] Test: Dirty check logic (MANUAL TEST NEEDED)

### Testing Checklist
- [ ] Helpers work correctly
- [ ] No breaking changes
- [ ] Type safety maintained

### Notes
- Pure functions, easy to extract
- Low risk

### Blockers
- None

---

## Phase 6: Final Cleanup

**Mục tiêu:** Cleanup file gốc, optimize imports  
**Thời gian ước tính:** 2-3 giờ  
**Rủi ro:** ⚠️ LOW

### Tasks Checklist

- [x] **6.1** Cleanup file gốc 🟡 IN PROGRESS
  - [x] Remove unused imports (removed DialogHeader, DialogTitle, DialogDescription, SheetHeader, SheetTitle, Button, Input, Label, Select, Checkbox, Popover, Badge, Tabs, Accordion, Textarea, Image, and many unused icons from main file)
  - [x] Remove duplicate code (extracted 14 dialog/components)
  - [x] Extract useQuickEditProductSync hook (83 lines removed)
  - [x] Extract useQuickEditProgressiveLoading hook (35 lines removed)
  - [x] Extract useQuickEditFieldWatchers hook (43 lines removed)
  - [x] Remove unused router import
  - [x] Remove unused parsePrice/parsePriceOptional imports
  - [x] Update comments (updated PHASE comments)
  - [x] Fix TypeScript errors (27 errors resolved)
  - [ ] Verify file size < 500 lines (Current: 1,025 lines - reduced by 4,147 lines from original 5,172, -80.2% reduction)
  - [ ] Further cleanup needed to reach < 500 lines target (need to reduce 525 more lines)

- [x] **6.2** Optimize re-exports ✅ COMPLETED
  - [x] Update `index.tsx` với proper re-exports
  - [x] Export types và schema
  - [x] Export context (QuickEditFormProvider, useQuickEditFormContext)
  - [ ] Export sections (OPTIONAL - not needed by external consumers)
  - [ ] Export hooks (OPTIONAL - not needed by external consumers)

- [ ] **6.3** Final testing 🟡 READY TO START
  - [x] Run `npm run type-check` - No errors ✅
  - [ ] Run `npm run build` - No errors
  - [ ] Run `npm run lint` - No errors
  - [ ] Full manual testing (see Testing Checklist below)
  - [ ] Visual regression test

- [ ] **6.4** Documentation
  - [ ] Update component documentation
  - [ ] Document new structure
  - [ ] Update related docs

- [ ] **6.5** Final commit
  - [ ] Commit: "refactor: final cleanup ProductQuickEditDialog"
  - [ ] Update progress tracking

### Notes
- ✅ File gốc đã giảm từ 5,172 → 1,025 dòng (-80.2%)
- ⚠️ Chưa đạt mục tiêu < 500 lines (còn 525 dòng cần giảm)
- ✅ Quyết định: Dừng lại để test trước khi extract thêm
- ✅ All TypeScript errors fixed
- ✅ Code structure đã được cải thiện đáng kể
- [ ] Documentation cần update sau khi test xong

### Blockers
- None

### Phase 6 Summary (Partial Completion)
**Completed:**
- ✅ Extract 3 hooks mới (ProductSync, ProgressiveLoading, FieldWatchers)
- ✅ Remove unused imports (UI components, icons, utilities)
- ✅ Fix TypeScript errors
- ✅ Code cleanup và organization

**Remaining (Optional - for future):**
- Extract success feedback logic (~135 lines)
- Group state management (~100 lines)
- Extract inline handlers (~150 lines)
- Move useIsMobile to shared hooks (~15 lines)
- Cleanup comments/dead code (~125 lines)

**Decision:** Dừng lại để test trước khi extract thêm để đảm bảo stability.

---

## Testing & Review

**Mục tiêu:** Comprehensive testing và code review  
**Thời gian ước tính:** 10-15 giờ  
**Rủi ro:** - 

### Testing Checklist

#### Basic Functionality
- [ ] Open dialog (single product)
- [ ] Open dialog (bulk mode)
- [ ] Fill form fields
- [ ] Submit form (single)
- [ ] Submit form (bulk)
- [ ] Cancel dialog
- [ ] Close dialog với unsaved changes warning

#### Form Validation
- [ ] Required fields validation
- [ ] Price validation (salePrice < regularPrice)
- [ ] SKU validation (real-time)
- [ ] Slug validation
- [ ] Error messages display

#### Sections
- [ ] Expand/collapse sections
- [ ] Error badges trên section headers
- [ ] Skip links navigation
- [ ] Field focus/blur states
- [ ] Saved fields highlighting
- [ ] Flash animation

#### Tabs
- [ ] Switch tabs (Edit, History, Comparison)
- [ ] History pagination
- [ ] Version comparison

#### Keyboard Shortcuts
- [ ] Ctrl+S (Save)
- [ ] Ctrl+Z (Undo)
- [ ] Ctrl+Y (Redo)
- [ ] Esc (Close)
- [ ] Tab navigation

#### Mobile
- [ ] Sheet opens on mobile
- [ ] Keyboard handling
- [ ] Touch targets size
- [ ] Scroll behavior

#### Edge Cases
- [ ] Version mismatch detection
- [ ] CSRF token refresh
- [ ] Network errors
- [ ] Loading states
- [ ] Empty states
- [ ] Fast typing (before form init)
- [ ] Slow typing (after form init)
- [ ] Large datasets (bulk mode)

### Code Review Checklist

- [ ] Props interface đúng
- [ ] Hook dependencies đầy đủ
- [ ] Type safety (no `any`)
- [ ] No breaking changes
- [ ] Imports đúng
- [ ] Comments/documentation
- [ ] Performance optimizations (memoization)
- [ ] Context value memoized
- [ ] Section components memoized

### Notes
- Comprehensive testing required
- Code review bắt buộc
- Fix all issues trước khi merge

### Blockers
- None

---

## 📝 Notes & Blockers

### General Notes
- Refactor incrementally, test after each phase
- Commit sau mỗi section/hook để dễ rollback
- Preserve all functionality
- Maintain backward compatibility

### Blockers
- None currently

### Decisions Made
- Use Context API để giảm props drilling
- Extract sections theo priority (low risk → high risk)
- Preserve form initialization timing (150ms delay)
- Memoize Context value và section components

---

## 📊 Metrics

### File Size Reduction
- **Before:** 5,172 lines
- **After Phase 0-1:** 5,087 lines (giảm 85 lines, -1.6%)
- **After Phase 2:** ~4,000 lines (giảm ~1,087 lines, -21%)
- **After Phase 3-5:** 1,165 lines (giảm 4,007 lines, -77.5%)
- **After Phase 6 (partial):** 1,025 lines (giảm 4,147 lines, -80.2%)
- **Target:** < 500 lines (main file)
- **Progress:** 80.2% reduction (4,147/5,172 lines removed)
- **Remaining:** 525 lines cần giảm để đạt mục tiêu < 500 lines

### Files Created
- **Target:** 30+ files
- **Created:** 47 files
  - 11 sections
  - 14 components
  - 11 hooks (added: useQuickEditProductSync, useQuickEditProgressiveLoading, useQuickEditFieldWatchers)
  - 4 utils
  - 2 context files
  - 2 type/schema files
  - 1 index file
  - 2 additional files (dirtyCheckHelpers, etc.)

### Test Coverage
- **Before:** Manual testing only
- **After:** TBD

---

## 🔗 Related Documents

- **Kế hoạch chi tiết:** `PRODUCT_QUICK_EDIT_REFACTOR_PLAN.md`
- **Component docs:** `docs/product-module/COMPONENTS.md`
- **UX/UI Plan:** `docs/reports/QUICK_EDIT_UX_UI_UPGRADE_PLAN.md`

---

**Last Updated:** 2025-01-XX  
**Status:** 🟡 Ready for Testing - Phase 6 (Partial Complete)  
**Progress:** ~85% complete (Phase 0-5 done, Phase 6 partial, Testing ready to start)

**Decision:** Dừng lại để test trước khi extract thêm. File size đã giảm 80.2% (5,172 → 1,025 dòng).  
**Test Checklist:** See `PRODUCT_QUICK_EDIT_TEST_CHECKLIST.md`

