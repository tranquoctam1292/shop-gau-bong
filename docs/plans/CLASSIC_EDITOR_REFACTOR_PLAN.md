# ClassicEditor Refactor Plan

**File hiện tại:** `components/admin/products/ClassicEditor.tsx`  
**Độ dài:** 1,949 dòng  
**Mục tiêu:** Giảm xuống < 300 dòng cho file chính

**Ngày tạo:** 2025-01-XX  
**Trạng thái:** Planning

---

## 📊 Phân Tích Cấu Trúc Hiện Tại

### Responsibilities (9 responsibilities - cần tách)

1. **Editor Initialization** (~100 dòng)
   - Tiptap editor setup với extensions
   - Editor configuration

2. **Paste Handling** (~150 dòng)
   - Image paste → upload to server
   - Video URL paste → embed
   - Clipboard handling

3. **Content Synchronization** (~50 dòng)
   - Sync value prop với editor
   - Sync giữa visual và text mode

4. **Keyboard Shortcuts** (~250 dòng)
   - System shortcuts (Ctrl/Cmd + ...)
   - Alt + Shift shortcuts
   - Mode-specific shortcuts

5. **Sticky Toolbar** (~70 dòng)
   - Scroll detection
   - Sticky positioning logic

6. **Helper Functions** (~200 dòng)
   - `insertQuickTag` - Insert HTML tags in text mode
   - `addLink` - Add link dialog
   - `addImage` - Add image dialog
   - `insertReadMore` - Insert read more tag

7. **Toolbar UI** (~800 dòng)
   - Toolbar Row 1 (Core formatting)
   - Toolbar Row 2 (Advanced formatting)
   - Sticky Toolbar (duplicate của toolbar)
   - Mode toggle buttons

8. **Visual Mode UI** (~50 dòng)
   - EditorContent component
   - InlineImageToolbar

9. **Text Mode UI** (~200 dòng)
   - QuickTags toolbar
   - Textarea component

---

## 🎯 Kế Hoạch Refactor

### Folder Structure

```
ClassicEditor/
├── index.tsx                    # Main component (orchestration only, < 300 lines)
├── types.ts                     # Type definitions ✅ DONE
├── components/                   # Sub-components
│   ├── ClassicEditorToolbar.tsx
│   ├── ClassicEditorToolbarRow1.tsx
│   ├── ClassicEditorToolbarRow2.tsx
│   ├── ClassicEditorStickyToolbar.tsx
│   ├── ClassicEditorTextMode.tsx
│   └── ClassicEditorVisualMode.tsx
├── hooks/                       # Custom hooks
│   ├── useClassicEditor.ts      # Editor initialization
│   ├── useClassicEditorPaste.ts # Paste handling
│   ├── useClassicEditorKeyboard.ts # Keyboard shortcuts
│   ├── useClassicEditorSticky.ts # Sticky toolbar
│   └── useClassicEditorMode.ts  # Mode switching & sync
└── utils/                       # Utility functions
    ├── classicEditorExtensions.ts # Tiptap extensions ✅ DONE
    └── classicEditorHelpers.ts   # Helper functions (insertQuickTag, addLink, etc.)
```

---

## 📋 Phases

### Phase 1: Setup & Types ✅
- [x] Create folder structure
- [x] Extract types.ts
- [x] Extract extensions setup

### Phase 2: Extract Utils ✅
- [x] Extract helper functions (insertQuickTag, addLink, addImage, insertReadMore)
- [x] Extract HTML cleaning logic

### Phase 3: Extract Hooks ✅
- [x] Extract useClassicEditor (editor initialization)
- [x] Extract useClassicEditorPaste (paste handling)
- [x] Extract useClassicEditorKeyboard (keyboard shortcuts)
- [x] Extract useClassicEditorSticky (sticky toolbar)
- [x] Extract useClassicEditorMode (mode switching)

### Phase 4: Extract Components ✅
- [x] Create ClassicEditorContext (Context API để tránh props drilling)
- [x] Extract ClassicEditorToolbarRow1 (337 lines)
- [x] Extract ClassicEditorToolbarRow2 (202 lines)
- [x] Extract ClassicEditorStickyToolbar (34 lines)
- [x] Extract ClassicEditorTextMode (166 lines)
- [x] Extract ClassicEditorVisualMode (22 lines)
- [x] Extract ClassicEditorToolbar (20 lines - wrapper)
- [x] Extract ClassicEditorModeToggle (38 lines)

### Phase 5: Refactor Main Component ✅
- [x] Refactor index.tsx để chỉ orchestrate
- [x] Verify file size < 300 lines (260 lines ✅)
- [ ] Test functionality (PENDING)

### Phase 6: Testing & Cleanup
- [ ] Full manual testing
- [ ] Fix any issues
- [ ] Update imports in parent components

---

## ⚠️ Lưu Ý

1. **State Management:** Các hooks cần share state (mode, editor, textContent) → Có thể cần Context API nếu props drilling > 3 levels
2. **Dependencies:** Helper functions cần access editor, mode, refs → Pass as parameters
3. **Performance:** Giữ nguyên HTML cleaning logic và performance optimizations
4. **Backward Compatibility:** Đảm bảo API không thay đổi (props interface giữ nguyên)

---

## 📊 Metrics

- **Before:** 1,949 lines
- **Target:** < 300 lines (main file)
- **Expected Files:** ~15 files
- **Estimated Time:** 8-12 hours

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Phase 1-5 Complete (95% Complete), Phase 6 Pending (Testing)

## ✅ Completed Work

### Files Created (17 files, ~1,904 lines):
1. ✅ `types.ts` (11 lines) - Type definitions
2. ✅ `utils/classicEditorExtensions.ts` (98 lines) - Tiptap extensions setup
3. ✅ `utils/classicEditorHelpers.ts` (203 lines) - Helper functions
4. ✅ `hooks/useClassicEditor.ts` (52 lines) - Editor initialization
5. ✅ `hooks/useClassicEditorPaste.ts` (165 lines) - Paste handling
6. ✅ `hooks/useClassicEditorMode.ts` (55 lines) - Mode switching & sync
7. ✅ `hooks/useClassicEditorKeyboard.ts` (282 lines) - Keyboard shortcuts
8. ✅ `hooks/useClassicEditorSticky.ts` (79 lines) - Sticky toolbar
9. ✅ `context/ClassicEditorContext.tsx` (45 lines) - Context API
10. ✅ `components/ClassicEditorToolbarRow1.tsx` (337 lines) - Toolbar Row 1
11. ✅ `components/ClassicEditorToolbarRow2.tsx` (202 lines) - Toolbar Row 2
12. ✅ `components/ClassicEditorStickyToolbar.tsx` (34 lines) - Sticky toolbar
13. ✅ `components/ClassicEditorTextMode.tsx` (166 lines) - Text mode
14. ✅ `components/ClassicEditorVisualMode.tsx` (22 lines) - Visual mode
15. ✅ `components/ClassicEditorToolbar.tsx` (20 lines) - Toolbar wrapper
16. ✅ `components/ClassicEditorModeToggle.tsx` (38 lines) - Mode toggle
17. ✅ `index.tsx` (260 lines) - Main component ✅ < 300 lines target

### Results:
- **Before:** 1,949 lines (1 file)
- **After:** ~1,904 lines (17 files)
- **Main file:** 260 lines ✅ (target < 300 lines)
- **Reduction:** Code được tách thành 17 files nhỏ, dễ maintain hơn
- **Structure:** Folder Pattern với hooks, components, utils, context

### Remaining Work:
- [x] Update imports in parent components (rename ClassicEditor.tsx → ClassicEditor.old.tsx) ✅
- [x] Deep review và fix critical issues (memory leaks, race conditions) ✅
- [x] Toolbar logic audit và fixes ✅
- [ ] Full manual testing (PENDING)

### Toolbar Logic Audit:
- **File:** `docs/plans/CLASSIC_EDITOR_TOOLBAR_LOGIC_AUDIT.md`
- **Status:** ✅ All Logic Issues Fixed
- **Issues Fixed:**
  - ✅ Heading Select sync với editor state
  - ✅ Underline/Justify mode checks
  - ✅ Heading parseInt validation
  - ✅ Text color validation & sanitization (XSS prevention)
  - ✅ Alignment active state indicators
  - ✅ List handlers error handling với setTimeoutSafe

### Audit Report:
- **File:** `docs/plans/CLASSIC_EDITOR_AUDIT_REPORT.md`
- **Status:** 🔴 Critical Issues Found → ✅ Fixed
- **Issues Fixed:**
  - ✅ Memory leaks (8 setTimeout instances) - Fixed với `useClassicEditorTimeout` hook
  - ✅ Race conditions (8 instances) - Fixed với `isMountedRef` pattern
  - ✅ Missing dependencies in useEditor - Fixed với useRef pattern
  - ✅ Sticky toolbar race condition - Fixed với isMountedRef check
  - ✅ Console.log in production - Wrapped trong dev check

