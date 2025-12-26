# ClassicEditor List & Blockquote Features Audit

**Date:** 2025-01-XX  
**Status:** 🔍 Reviewing Logic  
**Features:** Bullet List, Ordered List, Blockquote

---

## 📋 Features to Test

### 1. Bullet List (Danh sách không thứ tự)
- **Visual Mode:** `editor.chain().focus().toggleBulletList().run()`
- **Text Mode:** Wrap selected text in `<ul><li>` or insert tags

### 2. Ordered List (Danh sách có thứ tự)
- **Visual Mode:** `editor.chain().focus().toggleOrderedList().run()`
- **Text Mode:** Wrap selected text in `<ol><li>` or insert tags

### 3. Blockquote (Trích dẫn)
- **Visual Mode:** `editor.chain().focus().toggleBlockquote().run()`
- **Text Mode:** Insert `<blockquote></blockquote>` tags

---

## 🔍 Potential Issues

### Issue 1: Blockquote in Text Mode - No Text Wrapping
**File:** `ClassicEditorToolbarRow1.tsx` - Line 435-440  
**Issue:** Blockquote button in text mode only inserts tags, doesn't wrap selected text

**Current Code:**
```typescript
onClick={() => {
  if (mode === 'visual' && editor) {
    editor.chain().focus().toggleBlockquote().run();
  } else if (mode === 'text') {
    insertQuickTag('<blockquote>', '</blockquote>');
  }
}}
```

**Problem:** 
- If user selects text and clicks blockquote, it inserts empty tags instead of wrapping selected text
- Inconsistent with list buttons behavior

**Fix:** Should wrap selected text in blockquote tags

---

### Issue 2: List Handlers - Cursor Position After Insert
**File:** `ClassicEditorToolbarRow1.tsx` - Lines 89-149  
**Issue:** When inserting list with selected text, cursor position may not be set correctly

**Current Code:**
```typescript
setTimeoutSafe(() => {
  if (isMounted() && textareaRef.current) {
    textareaRef.current.value = newText;
    textareaRef.current.focus(); // ❌ No cursor position set
  }
}, 0);
```

**Problem:**
- Cursor goes to end of textarea instead of after inserted list
- User experience is poor

**Fix:** Set cursor position after inserted list

---

### Issue 3: List Handlers - Missing Selection Range Update
**File:** `ClassicEditorToolbarRow1.tsx` - Lines 108-113, 139-144  
**Issue:** After inserting list, selection range is not updated

**Current Code:**
```typescript
textareaRef.current.value = newText;
textareaRef.current.focus(); // ❌ No setSelectionRange
```

**Fix:** Set selection range to position after inserted list

---

### Issue 4: Blockquote in Text Mode - Inconsistent with Lists
**File:** `ClassicEditorToolbarRow1.tsx` vs `ClassicEditorTextMode.tsx`  
**Issue:** Blockquote doesn't have dedicated handler like lists do

**Current:**
- Lists: Have `handleBulletList()` and `handleOrderedList()` with proper logic
- Blockquote: Only inline `insertQuickTag()` call

**Fix:** Create `handleBlockquote()` function for consistency

---

## ✅ Recommended Fixes

### Fix 1: Blockquote Text Wrapping
```typescript
const handleBlockquote = () => {
  if (mode === 'visual' && editor) {
    editor.chain().focus().toggleBlockquote().run();
  } else if (mode === 'text' && textareaRef.current) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText) {
      // Wrap selected text in blockquote
      const newText = textarea.value.substring(0, start) + 
        `<blockquote>${selectedText}</blockquote>` + 
        textarea.value.substring(end);
      setTextContent(newText);
      onChange(newText);
      
      setTimeoutSafe(() => {
        if (isMounted() && textareaRef.current) {
          textareaRef.current.value = newText;
          const newCursorPos = start + `<blockquote>${selectedText}</blockquote>`.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    } else {
      insertQuickTag('<blockquote>', '</blockquote>');
    }
  }
};
```

### Fix 2: List Handlers - Cursor Position
```typescript
setTimeoutSafe(() => {
  if (isMounted() && textareaRef.current) {
    textareaRef.current.value = newText;
    // Calculate cursor position after inserted list
    const listLength = `<ul>\n${listItems}\n</ul>`.length;
    const newCursorPos = start + listLength;
    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    textareaRef.current.focus();
  }
}, 0);
```

---

**Last Updated:** 2025-01-XX  
**Status:** 🔍 Issues Identified - Ready for Fixes

