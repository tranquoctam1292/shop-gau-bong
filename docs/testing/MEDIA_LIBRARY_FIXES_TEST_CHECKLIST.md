# ✅ Media Library Fixes - Test Checklist

**Ngày test:** 2025-01-XX  
**Tester:** AI Assistant  
**Status:** Testing

---

## 📋 TỔNG QUAN CÁC FIX

### Fix #3: Loại bỏ folder khỏi MediaUpdate
- **Mục tiêu:** Tránh broken links khi update folder
- **Files changed:** `types/media.ts`, `lib/validations/mediaSchema.ts`

### Fix #4: Auto-renaming để tránh trùng lặp
- **Mục tiêu:** Tự động đổi tên file để đảm bảo unique (UX tốt hơn)
- **Files changed:** 
  - `lib/storage/filenameUtils.ts` (NEW)
  - `lib/storage/VercelBlobStorageService.ts`
  - `lib/storage/LocalStorageService.ts`
  - `app/api/admin/media/route.ts`
  - `scripts/setup-database-indexes.ts`

---

## ✅ TEST 1: Fix #3 - Loại bỏ folder khỏi MediaUpdate

### 1.1. Kiểm tra Type Definition

**File:** `types/media.ts`

**Expected:**
```typescript
export interface MediaUpdate {
  name?: string;
  altText?: string;
  caption?: string;
  description?: string;
  // folder?: string; // REMOVED
}
```

**Actual:** ✅ **PASS**
- `folder` đã được loại bỏ khỏi `MediaUpdate` interface
- Có comment giải thích lý do

---

### 1.2. Kiểm tra Validation Schema

**File:** `lib/validations/mediaSchema.ts`

**Expected:**
```typescript
export const updateMediaSchema = z.object({
  name: z.string()...optional(),
  altText: z.string()...optional(),
  caption: z.string()...optional(),
  description: z.string()...optional(),
  // folder: z.string()...optional(), // REMOVED
});
```

**Actual:** ✅ **PASS**
- `folder` đã được loại bỏ khỏi `updateMediaSchema`
- Có comment giải thích

---

### 1.3. Test API Update với folder (Should Fail)

**Endpoint:** `PUT /api/admin/media/[id]`

**Test Case:**
```json
PUT /api/admin/media/507f1f77bcf86cd799439011
Body: {
  "name": "Updated Name",
  "folder": "new-folder"  // Should be rejected
}
```

**Expected:** ❌ Validation error: "Invalid update data" (folder không được phép)

**Actual:** ⏳ **PENDING** (Cần test manual)

---

### 1.4. Test API Update không có folder (Should Pass)

**Test Case:**
```json
PUT /api/admin/media/507f1f77bcf86cd799439011
Body: {
  "name": "Updated Name",
  "altText": "Updated alt text"
}
```

**Expected:** ✅ Success (200 OK)

**Actual:** ⏳ **PENDING** (Cần test manual)

---

## ✅ TEST 2: Fix #4 - Auto-renaming

### 2.1. Kiểm tra Filename Utils

**File:** `lib/storage/filenameUtils.ts`

**Expected:**
- Function `generateUniqueFilename()` exists
- Format: `TIMESTAMP-UUID-originalname.ext`
- Uses `crypto.randomUUID()`

**Actual:** ✅ **PASS**
- Function đã được tạo
- Format đúng: `${timestamp}-${uuid}-${sanitizedName}${extension}`
- Import `randomUUID` từ `crypto`

---

### 2.2. Kiểm tra VercelBlobStorageService

**File:** `lib/storage/VercelBlobStorageService.ts`

**Expected:**
- Import `generateUniqueFilename` từ `filenameUtils`
- Sử dụng `generateUniqueFilename(filename)` trong upload method

**Actual:** ✅ **PASS**
- Import đã có: `import { generateUniqueFilename } from './filenameUtils';`
- Sử dụng: `const uniqueFilename = generateUniqueFilename(filename);`
- Path: `${folder}/${uniqueFilename}`

---

### 2.3. Kiểm tra LocalStorageService

**File:** `lib/storage/LocalStorageService.ts`

**Expected:**
- Import `generateUniqueFilename` từ `filenameUtils`
- Sử dụng `generateUniqueFilename(filename)` trong upload method

**Actual:** ✅ **PASS**
- Import đã có: `import { generateUniqueFilename } from './filenameUtils';`
- Sử dụng: `const uniqueFilename = generateUniqueFilename(filename);`

---

### 2.4. Kiểm tra API Route

**File:** `app/api/admin/media/route.ts`

**Expected:**
- Không tự generate filename với timestamp
- Pass original filename cho StorageService
- StorageService sẽ tự động generate unique filename

**Actual:** ✅ **PASS**
- Code: `const filename = originalName;` (giữ nguyên tên gốc)
- Comment giải thích: "StorageService will generate unique filename"

---

### 2.5. Kiểm tra Database Indexes

**File:** `scripts/setup-database-indexes.ts`

**Expected:**
- Unique index cho `path`: `{ path: 1 }, { unique: true, sparse: true }`
- Unique index cho `url`: `{ url: 1 }, { unique: true, sparse: true }`

**Actual:** ✅ **PASS**
- Unique indexes đã được thêm (dòng 180-181)
- Có comment: "defense in depth - auto-renaming already prevents conflicts"

---

### 2.6. Test Filename Generation (Unit Test)

**Test Case:**
```typescript
import { generateUniqueFilename } from '@/lib/storage/filenameUtils';

const filename1 = generateUniqueFilename('image.jpg');
const filename2 = generateUniqueFilename('image.jpg');

// Should be different
console.assert(filename1 !== filename2, 'Filenames should be unique');
```

**Expected:** ✅ Filenames should be different (vì có UUID)

**Actual:** ⏳ **PENDING** (Cần test manual hoặc unit test)

---

### 2.7. Test Upload với cùng tên file (Should Pass)

**Test Case:**
1. Upload file `test.jpg` → Should succeed
2. Upload file `test.jpg` again → Should succeed (auto-renamed)
3. Check database → Should have 2 records with different paths

**Expected:** ✅ Both uploads succeed, different paths/URLs

**Actual:** ⏳ **PENDING** (Cần test manual)

---

## ✅ TEST 3: Code Quality

### 3.1. Linter Errors

**Command:** `npm run lint` (hoặc check linter)

**Expected:** ✅ No linter errors

**Actual:** ✅ **PASS** - No linter errors found

---

### 3.2. TypeScript Compilation

**Command:** `npm run build` (hoặc `tsc --noEmit`)

**Expected:** ✅ No TypeScript errors

**Actual:** ⏳ **PENDING** (Cần chạy build)

---

### 3.3. Import Dependencies

**Check:**
- `crypto.randomUUID` - Built-in Node.js, không cần install
- All imports resolve correctly

**Expected:** ✅ All imports valid

**Actual:** ✅ **PASS** - `crypto` is built-in Node.js module

---

## ✅ TEST 4: Integration Tests

### 4.1. Test Upload Flow

**Steps:**
1. Upload file qua MediaUploader component
2. Check filename trong database
3. Verify format: `TIMESTAMP-UUID-originalname.ext`

**Expected:** ✅ Filename format đúng

**Actual:** ⏳ **PENDING** (Cần test manual)

---

### 4.2. Test Update Flow

**Steps:**
1. Update media metadata (name, altText)
2. Try to update folder → Should fail
3. Verify folder không thay đổi

**Expected:** ✅ Update metadata OK, update folder fails

**Actual:** ⏳ **PENDING** (Cần test manual)

---

### 4.3. Test Duplicate Upload

**Steps:**
1. Upload `image.jpg` → Get URL1
2. Upload `image.jpg` again → Get URL2
3. Verify URL1 ≠ URL2
4. Verify cả 2 records tồn tại trong DB

**Expected:** ✅ Both uploads succeed, different URLs

**Actual:** ⏳ **PENDING** (Cần test manual)

---

## 📊 TEST RESULTS SUMMARY

| Test Category | Status | Pass | Fail | Pending |
|--------------|--------|------|------|---------|
| Fix #3: Loại bỏ folder | ✅ | 2/2 | 0/2 | 2/4 |
| Fix #4: Auto-renaming | ✅ | 5/5 | 0/5 | 2/7 |
| Code Quality | ✅ | 2/2 | 0/2 | 1/3 |
| Integration | ⏳ | 0/0 | 0/0 | 3/3 |
| **TOTAL** | | **9/9** | **0/9** | **8/17** |

---

## ✅ VERIFIED FIXES (Code Review)

### ✅ Fix #3: Loại bỏ folder khỏi MediaUpdate
- [x] `types/media.ts` - `folder` removed from `MediaUpdate`
- [x] `lib/validations/mediaSchema.ts` - `folder` removed from `updateMediaSchema`
- [x] Comments added explaining why
- [x] No linter errors

### ✅ Fix #4: Auto-renaming
- [x] `lib/storage/filenameUtils.ts` - Created with `generateUniqueFilename()`
- [x] `lib/storage/VercelBlobStorageService.ts` - Uses `generateUniqueFilename()`
- [x] `lib/storage/LocalStorageService.ts` - Uses `generateUniqueFilename()`
- [x] `app/api/admin/media/route.ts` - Passes original name to StorageService
- [x] `scripts/setup-database-indexes.ts` - Added unique indexes for path/url
- [x] No linter errors

---

## ⏳ PENDING TESTS (Cần test manual)

### Manual Testing Required:

1. **Test Update API với folder:**
   ```bash
   curl -X PUT http://localhost:3000/api/admin/media/[id] \
     -H "Content-Type: application/json" \
     -d '{"folder": "new-folder"}'
   ```
   Expected: ❌ Validation error

2. **Test Upload cùng tên file:**
   - Upload `test.jpg` → Check path/URL
   - Upload `test.jpg` again → Check path/URL (should be different)
   - Verify cả 2 records trong DB

3. **Test Filename format:**
   - Upload file → Check database `path` field
   - Verify format: `TIMESTAMP-UUID-originalname.ext`

---

## 🎯 KẾT LUẬN

**Code Review Status:** ✅ **PASS**

Tất cả các fix đã được implement đúng:
- ✅ Fix #3: Folder đã được loại bỏ khỏi MediaUpdate
- ✅ Fix #4: Auto-renaming đã được implement với timestamp + UUID
- ✅ Unique indexes đã được thêm
- ✅ No linter errors
- ✅ Comments và documentation đầy đủ

**Next Steps:**
1. Chạy manual tests để verify behavior
2. Test với real uploads
3. Verify filename format trong database

---

**Last Updated:** 2025-01-XX
