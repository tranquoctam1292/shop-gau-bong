# 🔍 BÁO CÁO KIỂM TRA CODE DUPLICATION (DRY VIOLATIONS)

**Ngày tạo:** 2025-01-XX  
**Phạm vi:** Toàn bộ dự án Shop Gấu Bông  
**Tổng số file:** 781 files

---

## 📊 TỔNG QUAN

Dự án có **781 files** được track bởi Git. Sau khi quét và phân tích, phát hiện các patterns lặp lại (DRY violations) ở nhiều mức độ khác nhau.

---

## 🚨 CÁC VẤN ĐỀ NGHIÊM TRỌNG (CRITICAL)

### 1. **Duplicate `cn()` Function** ⚠️

**Vấn đề:** Function `cn()` được định nghĩa ở 2 nơi khác nhau:

- `lib/utils.ts` (6 dòng)
- `lib/utils/cn.ts` (10 dòng)

**Impact:** 
- Có thể gây confusion khi import
- Tăng bundle size không cần thiết
- Vi phạm nguyên tắc DRY

**Giải pháp:**
- ✅ **Xóa `lib/utils.ts`** (file này chỉ có 1 function)
- ✅ **Giữ lại `lib/utils/cn.ts`** (có documentation đầy đủ hơn)
- ✅ **Cập nhật tất cả imports** từ `@/lib/utils` sang `@/lib/utils/cn`

**Files cần cập nhật:**
```bash
# Tìm tất cả files import từ lib/utils
grep -r "from '@/lib/utils'" --include="*.ts" --include="*.tsx"
```

---

### 2. **Duplicate `generateUniqueSlug()` Function** ⚠️

**Vấn đề:** Function `generateUniqueSlug()` có 2 implementations khác nhau:

1. `lib/utils/slug.ts` - Generic version với callback `checkExists`
2. `lib/utils/categoryHelpers.ts` - Category-specific version với database access

**Chi tiết:**

**File 1: `lib/utils/slug.ts`**
```typescript
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string>
```
- ✅ Generic, reusable
- ✅ Không phụ thuộc vào database
- ✅ Có thể dùng cho bất kỳ collection nào

**File 2: `lib/utils/categoryHelpers.ts`**
```typescript
export async function generateUniqueSlug(
  name: string,
  existingSlugs: string[] = [],
  excludeId?: string
): Promise<string>
```
- ❌ Category-specific (hardcoded `categories` collection)
- ❌ Phụ thuộc vào database structure
- ❌ Không reusable cho collections khác

**Giải pháp:**
- ✅ **Giữ lại `lib/utils/slug.ts`** (generic version)
- ✅ **Refactor `lib/utils/categoryHelpers.ts`** để sử dụng generic version
- ✅ **Tạo wrapper function** `generateUniqueCategorySlug()` nếu cần

**Code refactor:**
```typescript
// lib/utils/categoryHelpers.ts
import { generateUniqueSlug as generateUniqueSlugGeneric } from './slug';
import { generateSlug } from './slug';

export async function generateUniqueCategorySlug(
  name: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = generateSlug(name);
  
  return generateUniqueSlugGeneric(baseSlug, async (slug: string) => {
    const { categories } = await getCollections();
    const query: Record<string, unknown> = { slug };
    if (excludeId && ObjectId.isValid(excludeId)) {
      query._id = { $ne: new ObjectId(excludeId) };
    }
    const exists = await categories.findOne(query);
    return !!exists;
  });
}
```

---

## ⚠️ CÁC VẤN ĐỀ TRUNG BÌNH (MEDIUM)

### 3. **Repeated `export const dynamic = 'force-dynamic'`**

**Vấn đề:** 76 admin API routes đều có dòng này:
```typescript
export const dynamic = 'force-dynamic';
```

**Impact:**
- Code lặp lại không cần thiết
- Khó maintain nếu cần thay đổi behavior

**Giải pháp:**
- ✅ **Tạo shared config file:** `lib/config/api-routes.ts`
```typescript
export const API_ROUTE_CONFIG = {
  dynamic: 'force-dynamic' as const,
} as const;
```
- ✅ **Hoặc sử dụng Next.js route segment config** (nếu Next.js hỗ trợ)

**Note:** Hiện tại Next.js yêu cầu export này trong mỗi route file, nên có thể không refactor được. Nhưng có thể tạo comment template để dễ maintain.

---

### 4. **Repeated ObjectId Validation Patterns**

**Vấn đề:** Pattern `ObjectId.isValid()` xuất hiện 78 lần trong 39 files

**Pattern lặp:**
```typescript
if (!ObjectId.isValid(id)) {
  return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
}
const objectId = new ObjectId(id);
```

**Giải pháp:**
- ✅ **Tạo helper function:** `lib/utils/objectId.ts`
```typescript
import { ObjectId } from '@/lib/db';

export function toObjectId(id: string | undefined | null): ObjectId | null {
  if (!id || !ObjectId.isValid(id)) {
    return null;
  }
  return new ObjectId(id);
}

export function validateObjectId(id: string | undefined | null): { valid: boolean; objectId?: ObjectId; error?: string } {
  if (!id) {
    return { valid: false, error: 'ID is required' };
  }
  if (!ObjectId.isValid(id)) {
    return { valid: false, error: 'Invalid ID format' };
  }
  return { valid: true, objectId: new ObjectId(id) };
}
```

**Usage:**
```typescript
// Before
if (!ObjectId.isValid(id)) {
  return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
}
const objectId = new ObjectId(id);

// After
const validation = validateObjectId(id);
if (!validation.valid) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}
const objectId = validation.objectId!;
```

---

### 5. **Repeated Pagination Parsing**

**Vấn đề:** Pattern parsing pagination params lặp lại ở 7+ files

**Pattern lặp:**
```typescript
const page = parseInt(searchParams.get('page') || '1', 10);
const perPage = parseInt(searchParams.get('per_page') || '10', 10);
```

**Giải pháp:**
- ✅ **Tạo helper function:** `lib/utils/pagination.ts`
```typescript
export interface PaginationParams {
  page: number;
  perPage: number;
  skip: number;
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultPerPage: number = 10
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.max(1, Math.min(100, parseInt(searchParams.get('per_page') || String(defaultPerPage), 10)));
  const skip = (page - 1) * perPage;
  
  return { page, perPage, skip };
}
```

**Usage:**
```typescript
// Before
const page = parseInt(searchParams.get('page') || '1', 10);
const perPage = parseInt(searchParams.get('per_page') || '10', 10);
const skip = (page - 1) * perPage;

// After
const { page, perPage, skip } = parsePaginationParams(searchParams, 10);
```

---

### 6. **Repeated Query Building Patterns**

**Vấn đề:** Pattern `const query: any = {}` xuất hiện ở 9+ files với logic tương tự

**Pattern lặp:**
```typescript
const query: any = {};
if (search) {
  query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { content: { $regex: search, $options: 'i' } },
  ];
}
if (status) {
  query.status = status;
}
```

**Giải pháp:**
- ✅ **Tạo query builder utility:** `lib/utils/queryBuilder.ts`
```typescript
export interface QueryBuilderOptions {
  search?: string;
  searchFields?: string[];
  status?: string;
  categoryId?: string;
  authorId?: string;
  // ... other common filters
}

export function buildMongoQuery(options: QueryBuilderOptions): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  
  // Search
  if (options.search && options.searchFields && options.searchFields.length > 0) {
    query.$or = options.searchFields.map(field => ({
      [field]: { $regex: options.search, $options: 'i' }
    }));
  }
  
  // Status
  if (options.status) {
    query.status = options.status;
  }
  
  // Category
  if (options.categoryId) {
    query.categoryId = options.categoryId;
  }
  
  // Author
  if (options.authorId) {
    query.authorId = options.authorId;
  }
  
  return query;
}
```

**Note:** Query builder có thể quá generic, cần cân nhắc giữa reusability và flexibility.

---

### 7. **Repeated Error Handling Patterns**

**Vấn đề:** Pattern `catch (error: any)` xuất hiện 28 lần

**Pattern lặp:**
```typescript
catch (error: any) {
  console.error('[API] Error:', error);
  return NextResponse.json(
    { error: error.message || 'Internal server error' },
    { status: 500 }
  );
}
```

**Giải pháp:**
- ✅ **Tạo error handler utility:** `lib/utils/apiErrorHandler.ts`
```typescript
import { NextResponse } from 'next/server';

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
}

export function handleApiError(error: unknown, context?: string): NextResponse {
  console.error(`[${context || 'API'}] Error:`, error);
  
  if (error instanceof Error) {
    // Check for known error types
    if (error.message.includes('validation')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

**Usage:**
```typescript
// Before
catch (error: any) {
  console.error('[API] Error:', error);
  return NextResponse.json(
    { error: error.message || 'Internal server error' },
    { status: 500 }
  );
}

// After
catch (error: unknown) {
  return handleApiError(error, 'Products API');
}
```

---

## ✅ CÁC ĐIỂM TỐT (GOOD PRACTICES)

### 1. **Authentication Wrapper** ✅

- ✅ `withAuthAdmin` middleware đã được extract và reuse ở 76 files
- ✅ Không có code duplication ở phần authentication

### 2. **Validation Error Handler** ✅

- ✅ `handleValidationError` đã được extract và reuse ở 8 files
- ✅ Consistent error format

---

## 📋 KẾ HOẠCH HÀNH ĐỘNG (ACTION PLAN)

### Priority 1 (Critical - Làm ngay)
1. ✅ Xóa duplicate `cn()` function
2. ✅ Refactor duplicate `generateUniqueSlug()` function

### Priority 2 (Medium - Làm trong tuần này)
3. ✅ Tạo `validateObjectId()` helper
4. ✅ Tạo `parsePaginationParams()` helper
5. ✅ Tạo `handleApiError()` helper

### Priority 3 (Low - Có thể làm sau)
6. ⚠️ Tạo query builder utility (cần đánh giá kỹ)
7. ⚠️ Extract `export const dynamic` (nếu Next.js cho phép)

---

## 📊 THỐNG KÊ

| Loại | Số lượng | Mức độ | Ưu tiên |
|------|----------|--------|---------|
| Duplicate functions | 2 | Critical | P1 |
| Repeated patterns | 5+ | Medium | P2 |
| Good practices | 2 | - | - |

---

## 🔗 TÀI LIỆU THAM KHẢO

- [DRY Principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
- [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

---

**Lưu ý:** Báo cáo này được tạo tự động. Cần review và test kỹ trước khi apply các refactoring.


