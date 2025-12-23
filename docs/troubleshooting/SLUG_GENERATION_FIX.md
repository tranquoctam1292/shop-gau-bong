# Fix: Slug Generation - Xử lý chữ "đ" và "Đ"

**Ngày fix:** 2025-01-XX  
**Vấn đề:** Chữ "đ" và "Đ" không được convert thành "d" khi generate slug

---

## 🔴 VẤN ĐỀ

Khi generate slug từ tiếng Việt, chữ "đ" và "Đ" không được convert thành "d", dẫn đến:
- Slug không hợp lệ: "màu-đỏ" thay vì "mau-do"
- Chữ "đ" bị loại bỏ hoàn toàn: "độ-dài" → "ộ-dài" (sai)

**Nguyên nhân:**
- `normalize('NFD')` không decompose chữ "đ" và "Đ" (chúng không có diacritics)
- Regex `/[^a-z0-9]+/g` loại bỏ "đ" vì nó không phải a-z hoặc 0-9

---

## ✅ GIẢI PHÁP

### 1. Tạo Utility Function Chung
**File:** `lib/utils/slug.ts` (NEW)

- Xử lý đúng chữ "đ" và "Đ" TRƯỚC khi normalize
- Xử lý tất cả ký tự tiếng Việt có dấu (sau normalize)
- Reusable cho toàn bộ codebase

### 2. Thay thế tất cả generateSlug functions

**Files đã fix:**
- ✅ `lib/utils/slug.ts` (NEW - Utility function)
- ✅ `app/api/admin/attributes/route.ts`
- ✅ `app/api/admin/attributes/[id]/route.ts`
- ✅ `app/api/admin/attributes/[id]/terms/route.ts`
- ✅ `app/api/admin/attributes/[id]/terms/[termId]/route.ts`
- ✅ `components/admin/attributes/AttributeForm.tsx`
- ✅ `components/admin/attributes/TermForm.tsx`
- ✅ `components/admin/products/QuickAddTermModal.tsx`
- ✅ `components/admin/ProductForm.tsx`
- ✅ `components/admin/AuthorForm.tsx`
- ✅ `components/admin/CategoryForm.tsx`
- ✅ `components/admin/PostEditor.tsx`
- ✅ `components/product/ProductInfo.tsx`
- ✅ `components/product/ProductCard.tsx`

---

## 📝 IMPLEMENTATION

### Utility Function (`lib/utils/slug.ts`)

```typescript
export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    // Handle đ/Đ BEFORE normalize (đ/Đ are not decomposed by NFD)
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD') // Decompose characters (é → e + ́, ả → a + ̉)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (dấu)
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
```

**Key Points:**
1. **Xử lý đ/Đ TRƯỚC normalize**: Vì đ/Đ không được decompose bởi NFD
2. **Xử lý các ký tự có dấu SAU normalize**: normalize('NFD') sẽ decompose (é → e + ́), sau đó remove diacritics

---

## 🧪 TEST CASES

| Input | Expected Output | Status |
|-------|----------------|--------|
| "Màu đỏ" | "mau-do" | ✅ |
| "Độ dài" | "do-dai" | ✅ |
| "Đậu phộng" | "dau-phong" | ✅ |
| "Kích thước" | "kich-thuoc" | ✅ |
| "Hồng đào" | "hong-dao" | ✅ |
| "Nâu đậm" | "nau-dam" | ✅ |
| "Đen" | "den" | ✅ |
| "Đỏ" | "do" | ✅ |

---

## 📋 CHECKLIST

- [x] Tạo utility function `lib/utils/slug.ts`
- [x] Fix tất cả API routes (4 files)
- [x] Fix tất cả admin components (3 files)
- [x] Fix ProductForm.tsx
- [x] Fix ProductInfo.tsx và ProductCard.tsx
- [x] Test với các ký tự tiếng Việt khác (á, à, ả, ã, ạ, etc.)

---

## ✅ KẾT QUẢ

- ✅ Chữ "đ" và "Đ" được convert đúng thành "d"
- ✅ Tất cả ký tự tiếng Việt có dấu được xử lý đúng
- ✅ Code DRY: Một utility function duy nhất thay vì 7+ duplicate functions
- ✅ Consistent: Tất cả slug generation sử dụng cùng logic

---

**Status:** ✅ COMPLETE
