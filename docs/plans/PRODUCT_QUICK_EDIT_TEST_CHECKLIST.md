# ProductQuickEditDialog - Test Checklist

**Date:** 2025-01-XX  
**Refactor Status:** Phase 0-6 Complete (80% file size reduction)  
**File Size:** 1,025 lines (down from 5,172 lines)

---

## 🎯 Pre-Testing Setup

### Build & Compilation
- [ ] Run `npm run type-check` - ✅ Already passed
- [ ] Run `npm run build` - No errors
- [ ] Run `npm run lint` - No errors
- [ ] Check browser console - No errors on page load

### Environment
- [ ] Test on Desktop (Chrome, Firefox, Safari)
- [ ] Test on Mobile (iOS Safari, Android Chrome)
- [ ] Test on different screen sizes (mobile, tablet, desktop)

---

## ✅ Basic Functionality Tests

### Dialog Opening/Closing
- [ ] Open dialog (single product) - Dialog appears correctly
- [ ] Open dialog (bulk mode) - Dialog appears with bulk count
- [ ] Close dialog with X button - Closes without warning if no changes
- [ ] Close dialog with unsaved changes - Shows confirmation dialog
- [ ] Close dialog with Esc key - Works correctly
- [ ] Close dialog by clicking outside - Works correctly (desktop only)

### Form Initialization
- [ ] Form loads with correct initial values
- [ ] All fields display correct data from product
- [ ] Variants load correctly (if product has variants)
- [ ] Images load correctly (featured + gallery)
- [ ] Categories and tags load correctly
- [ ] Form doesn't reset unexpectedly during editing

---

## 📝 Form Field Tests

### Basic Info Section
- [ ] Product Name - Can edit, validation works
- [ ] SKU - Can edit, real-time validation works (shows checkmark/error)
- [ ] Barcode/GTIN/EAN - Can edit, saves correctly

### Pricing Section
- [ ] Regular Price - Can edit, formatting works
- [ ] Sale Price - Can edit, validation (salePrice < regularPrice) works
- [ ] Cost Price - Can edit, saves correctly
- [ ] Profit margin calculation - Shows correctly

### Inventory Section
- [ ] Stock Quantity - Can edit, auto-syncs stock status
- [ ] Stock Status - Can change, saves correctly
- [ ] Manage Stock checkbox - Toggles correctly
- [ ] Low Stock Threshold - Can edit, saves correctly

### Categories & Tags
- [ ] Categories popover - Opens/closes correctly
- [ ] Category selection - Can select/deselect categories
- [ ] Tags input - Can add/remove tags
- [ ] Categories lazy load - Only fetches when popover opens

### Images
- [ ] Featured Image - Can select/change
- [ ] Gallery Images - Can add/remove images
- [ ] Media Library Modal - Opens/closes correctly
- [ ] Image upload - Works correctly

### Weight & Dimensions
- [ ] Weight - Can edit, saves correctly
- [ ] Length/Width/Height - Can edit, saves correctly
- [ ] Shipping calculation - Uses correct values

### SEO Section
- [ ] SEO Title - Can edit, character count works
- [ ] SEO Description - Can edit, character count works
- [ ] Slug - Can edit, validation works
- [ ] SEO Preview - Shows correctly

### Product Type & Visibility
- [ ] Product Type - Can change, warning dialog shows if has variants
- [ ] Visibility - Can change, password field shows when needed
- [ ] Password - Can set/clear password

### Shipping & Tax
- [ ] Shipping Class - Can select, saves correctly
- [ ] Tax Status - Can change, saves correctly
- [ ] Tax Class - Can select, saves correctly

### Variants Section
- [ ] Variants table - Loads correctly
- [ ] Variant editing - Can edit SKU, price, stock
- [ ] Variant table - Virtual scrolling works (if 50+ variants)
- [ ] Variant changes - Saves correctly

---

## 💾 Form Submission Tests

### Single Product Mode
- [ ] Save button - Submits form correctly
- [ ] Save with Ctrl+S - Works correctly
- [ ] Success feedback - Shows green flash on saved fields
- [ ] Success indicator - Shows "Đã lưu" message
- [ ] Dialog auto-closes - After 2 seconds on success
- [ ] Form resets - With updated data after save
- [ ] Version sync - Updates correctly after save

### Bulk Edit Mode
- [ ] Bulk update - Updates all selected products
- [ ] Progress indicator - Shows progress correctly
- [ ] Bulk success - Shows correct count
- [ ] Error handling - Shows errors for failed products

### Error Handling
- [ ] Validation errors - Display correctly
- [ ] Version mismatch - Shows warning and refreshes
- [ ] CSRF errors - Shows error message
- [ ] Network errors - Shows error message
- [ ] Error fields - Auto-scroll to first error

---

## 🎨 UI/UX Tests

### Visual Feedback
- [ ] Edited fields - Show blue border
- [ ] Saved fields - Show green flash animation
- [ ] Error fields - Show red border
- [ ] Field focus - Shows focus ring
- [ ] Success indicator - Shows at bottom

### Sections
- [ ] Accordion sections - Expand/collapse works
- [ ] Error badges - Show on section headers
- [ ] Section auto-expand - Expands when has errors
- [ ] Skip links - Navigation works

### Mobile UX
- [ ] Sheet opens - On mobile devices
- [ ] Keyboard handling - Auto-scrolls when keyboard opens
- [ ] Touch targets - All buttons >= 44x44px
- [ ] Scroll behavior - Works smoothly
- [ ] Scroll to top - Button appears when scrolled

---

## ⌨️ Keyboard Shortcuts

- [ ] Ctrl+S - Saves form
- [ ] Ctrl+Z - Undo (if available)
- [ ] Ctrl+Y - Redo (if available)
- [ ] Esc - Closes dialog
- [ ] Tab navigation - Works through all fields
- [ ] Keyboard shortcuts help - Dialog shows correctly

---

## 🔄 Advanced Features

### Templates
- [ ] Save template - Works correctly
- [ ] Load template - Works correctly
- [ ] Delete template - Works correctly
- [ ] Template search - Works correctly

### Comparison
- [ ] Comparison dialog - Opens correctly
- [ ] Field comparison - Shows changes correctly
- [ ] Comparison tab - Works correctly (if implemented)

### History
- [ ] History tab - Shows product history
- [ ] History pagination - Works correctly
- [ ] History data - Loads correctly

### Scheduled Updates
- [ ] Schedule dialog - Opens correctly
- [ ] Date/time picker - Works correctly
- [ ] Schedule submission - Works correctly

### Undo/Redo
- [ ] Undo - Reverts changes correctly
- [ ] Redo - Re-applies changes correctly
- [ ] History tracking - Works correctly

---

## 🐛 Edge Cases

### Data Edge Cases
- [ ] Empty/null values - Handled correctly
- [ ] Missing images - Shows placeholder
- [ ] Missing categories - Handles gracefully
- [ ] Large datasets - Performance acceptable (50+ variants)
- [ ] Special characters - In product name, SKU, etc.

### State Edge Cases
- [ ] Fast typing - Before form initialization
- [ ] Multiple rapid saves - Handles correctly
- [ ] Concurrent edits - Version checking works
- [ ] Dialog open/close - State resets correctly
- [ ] Form dirty state - Detects correctly

### Browser Edge Cases
- [ ] Browser back button - Shows warning if dirty
- [ ] Page refresh - Shows warning if dirty
- [ ] Tab close - Shows warning if dirty
- [ ] Network offline - Handles gracefully

---

## 📊 Performance Tests

- [ ] Dialog open time - < 2 seconds
- [ ] Form initialization - < 500ms
- [ ] Field updates - No lag (< 50ms)
- [ ] Save operation - < 3 seconds
- [ ] Large variant table - Virtual scrolling works smoothly
- [ ] Memory leaks - No leaks on open/close cycles

---

## 🔍 Code Quality Checks

- [ ] No console errors
- [ ] No console warnings
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All imports resolve
- [ ] No unused variables
- [ ] No memory leaks

---

## 📝 Test Results Template

```
Test Date: __________
Tester: __________
Environment: __________

### Summary
- Total Tests: ___
- Passed: ___
- Failed: ___
- Skipped: ___

### Critical Issues Found
1. __________
2. __________

### Minor Issues Found
1. __________
2. __________

### Notes
__________
__________
```

---

## 🚀 Next Steps After Testing

1. **If All Tests Pass:**
   - Commit changes
   - Update documentation
   - Deploy to staging
   - Consider extracting more if needed

2. **If Issues Found:**
   - Fix critical issues first
   - Re-test after fixes
   - Document any breaking changes
   - Update progress tracking

3. **Future Refactoring (Optional):**
   - Extract success feedback logic
   - Group state management
   - Extract inline handlers
   - Move useIsMobile to shared hooks
   - Cleanup comments/dead code

---

**Last Updated:** 2025-01-XX  
**Status:** 🟡 Ready for Testing

