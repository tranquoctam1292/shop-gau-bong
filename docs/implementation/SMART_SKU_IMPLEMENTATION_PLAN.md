# 📋 SMART SKU IMPLEMENTATION PLAN

**Ngày tạo:** 2025-01-XX  
**Status:** Planning  
**Module:** Product Management  
**Spec Reference:** `smart_sku.md`

---

## 🎯 TỔNG QUAN

Tính năng Smart SKU Generation cho phép Admin tự động sinh mã SKU chuẩn xác dựa trên pattern (công thức) có thể cấu hình, thay vì nhập thủ công dễ gây lỗi trùng lặp.

### Mục tiêu
- ✅ Tự động sinh SKU theo pattern có thể cấu hình
- ✅ Hỗ trợ tokens: `{CATEGORY_CODE}`, `{PRODUCT_NAME}`, `{ATTRIBUTE_VALUE}`, `{YEAR}`, `{INCREMENT}`
- ✅ Từ điển viết tắt (abbreviation dictionary) để SKU ngắn gọn
- ✅ Xử lý trùng lặp tự động
- ✅ Tích hợp vào Product Form (product level và variant level)

---

## 🗄️ DATABASE SCHEMA (MongoDB)

### Collection: `skuSettings`

```typescript
interface SkuSetting {
  _id: ObjectId;
  categoryId?: string | null; // null = global pattern, ObjectId = category-specific
  pattern: string; // e.g., "{CATEGORY_CODE}-{PRODUCT_NAME}-{ATTRIBUTE_VALUE}-{INCREMENT}"
  separator: string; // Default: "-"
  caseType: 'UPPER' | 'LOWER'; // Default: 'UPPER'
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ categoryId: 1 }` - Unique index (only one pattern per category, sparse for null values)

### Collection: `skuAbbreviations`

```typescript
interface SkuAbbreviation {
  _id: ObjectId;
  type: 'ATTRIBUTE'; // Note: Category code stored in categories.code field, not here
  originalValue: string; // e.g., "Màu Đỏ", "Xanh Dương", "Size L"
  shortCode: string; // e.g., "DO", "XD", "L"
  categoryId?: string | null; // Optional: category-specific mapping
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ type: 1, originalValue: 1 }` - For lookup
- `{ type: 1, categoryId: 1, originalValue: 1 }` - For category-specific lookup

### Collection: `skuCounters` (Sequence Collection)

**Purpose:** Atomic increment for `{INCREMENT}` token, faster and safer than `countDocuments()`

```typescript
interface SkuCounter {
  _id: ObjectId;
  key: string; // e.g., "CAT-ATTR-2025" (base SKU without increment)
  sequence: number; // Current sequence number
  updatedAt: Date;
}
```

**Indexes:**
- `{ key: 1 }` - Unique index (one counter per base SKU)

**Important Behavior:**
- ✅ **Counter Key = Base SKU Pattern:** Key được tạo từ base SKU (không có increment)
- ✅ **Pattern Change = Counter Reset:** Nếu Admin đổi Pattern (e.g., từ `{CAT}-{NAME}-{INC}` sang `{CAT}-{YEAR}-{INC}`), counter key sẽ thay đổi → counter reset về 1 cho pattern mới
- ✅ **No Reuse on Delete:** Khi xóa sản phẩm, counter không lùi lại (để tránh reuse ID gây nhầm lẫn lịch sử). Đây là behavior đúng, cần document rõ cho Admin.

### Collection: `skuHistory` (Audit Log)

**Purpose:** Track SKU changes for existing products (for order lookup, SEO redirect, debugging)

```typescript
interface SkuHistory {
  _id: ObjectId;
  productId: string; // Product ObjectId
  variantId?: string; // Variant ID (if variant SKU changed)
  oldSku: string; // Previous SKU
  newSku: string; // New SKU
  patternUsed?: string; // Pattern used to generate new SKU (for debugging)
  reason: 'regenerate' | 'manual' | 'bulk_import'; // Reason for change
  changedBy: string; // Admin user ID
  changedAt: Date;
}
```

**Indexes:**
- `{ productId: 1, changedAt: -1 }` - For product history lookup
- `{ oldSku: 1 }` - For SKU redirect lookup
- `{ variantId: 1 }` - For variant history lookup

**Note:** `patternUsed` field helps debug SKU generation issues when tracing history.

### Product Schema Updates

**Add to `products` collection:**
- `sku_normalized?: string` - Normalized SKU (uppercase, no special chars) for search/duplicate check
- `code?: string` - **REQUIRED**: Category code field (add to categories collection)

**Add to `variants` array:**
- `sku_normalized?: string` - Normalized variant SKU

**Unique Indexes (CRITICAL for Race Condition Prevention):**
- `products.createIndex({ sku_normalized: 1 }, { unique: true, sparse: true })` - Product level SKU
- Note: Variant SKU uniqueness checked via query (variants are nested array)

---

## 🔧 CORE LOGIC

### 1. Pattern Token Parser

**File:** `lib/utils/skuGenerator.ts`

```typescript
// Supported tokens (including BRAND_CODE for future use)
const TOKENS = {
  CATEGORY_CODE: '{CATEGORY_CODE}',
  BRAND_CODE: '{BRAND_CODE}', // Returns empty string if no brand
  PRODUCT_NAME: '{PRODUCT_NAME}',
  ATTRIBUTE_VALUE: '{ATTRIBUTE_VALUE}',
  YEAR: '{YEAR}',
  INCREMENT: '{INCREMENT}',
} as const;

// Dynamic attributes structure (not hardcoded size/color)
interface AttributePair {
  key: string; // e.g., 'size', 'color', 'material', 'capacity'
  value: string; // e.g., 'L', 'Red', 'Cotton', '500GB'
}

// Parse pattern and replace tokens
function parsePattern(
  pattern: string,
  context: {
    categoryCode?: string;
    brandCode?: string; // Optional, returns empty if not provided
    productName?: string;
    attributes?: AttributePair[]; // Dynamic attributes array
    year?: number;
    increment?: number;
  },
  separator: string = '-',
  caseType: 'UPPER' | 'LOWER' = 'UPPER'
): string;
```

**Key Changes:**
- ✅ Added `{BRAND_CODE}` token (returns empty string if no brand)
- ✅ Changed `attributeValues?: string[]` → `attributes?: AttributePair[]` for dynamic support
- ✅ Supports any attribute keys (size, color, material, capacity, etc.)

### 2. Abbreviation Lookup

**Logic:**
1. Check `skuAbbreviations` collection by `type` and `originalValue`
2. If found → return `shortCode`
3. If not found → auto-generate: slugify + uppercase + take first 3 chars

**Function:**
```typescript
async function getAbbreviation(
  type: 'CATEGORY' | 'ATTRIBUTE',
  originalValue: string,
  categoryId?: string
): Promise<string>;
```

### 3. SKU Generation Logic (Two-Path Approach)

**⚠️ CRITICAL:** Logic được tách thành 2 luồng rõ ràng dựa trên Pattern có chứa `{INCREMENT}` hay không.

#### Path 1: Pattern CÓ chứa `{INCREMENT}` Token

**Logic Flow:**
1. Parse các token tĩnh (Category, Name, Attributes, Year) → tạo `baseSku` (không có increment)
2. Tạo `counterKey` từ `baseSku` (e.g., "CAT-AO-THUN")
3. **Atomic Increment:** Gọi `skuCounters.findOneAndUpdate({key: counterKey}, {$inc: {sequence: 1}})` để lấy số tiếp theo
4. Ghép số vào SKU → SKU cuối cùng (e.g., "CAT-AO-THUN-001")
5. **(Optional) Final Check:** Check `sku_normalized` index lần cuối để bắt trường hợp hãn hữu (manual insert). Không cần vòng lặp Retry phức tạp.

**Function:**
```typescript
async function generateSkuWithIncrement(
  pattern: string,
  context: SkuContext,
  excludeProductId?: string,
  isVariant: boolean = false
): Promise<string>;
```

**Key Points:**
- ✅ Không check DB trước khi lấy Counter (Counter đảm bảo uniqueness)
- ✅ Atomic operation đảm bảo không race condition
- ✅ Chỉ check DB lần cuối để catch edge cases (manual insert)

#### Path 2: Pattern KHÔNG chứa `{INCREMENT}` Token

**Logic Flow:**
1. Parse token → SKU gốc (e.g., "CAT-AO-THUN")
2. **Check DB:** Check `sku_normalized` trong DB
3. **If NOT duplicate:** Return SKU gốc
4. **If duplicate:** Kích hoạt Fallback logic:
   - Tạo `counterKey` từ base SKU
   - Lấy Counter cho key đó
   - Nối thêm suffix (e.g., "CAT-AO-THUN-01")
   - Retry check DB (max 5 lần)

**Function:**
```typescript
async function generateSkuWithoutIncrement(
  pattern: string,
  context: SkuContext,
  excludeProductId?: string,
  isVariant: boolean = false,
  maxRetries: number = 5
): Promise<string>;
```

**Key Points:**
- ✅ Check DB trước (vì không có increment trong pattern)
- ✅ Chỉ dùng Counter khi phát hiện duplicate (fallback)
- ✅ Retry limit (max 5) để tránh infinite loop

#### Main Entry Point

**Function:**
```typescript
async function generateSku(
  pattern: string,
  context: SkuContext,
  excludeProductId?: string,
  isVariant: boolean = false
): Promise<string> {
  const hasIncrement = pattern.includes('{INCREMENT}');
  
  if (hasIncrement) {
    return generateSkuWithIncrement(pattern, context, excludeProductId, isVariant);
  } else {
    return generateSkuWithoutIncrement(pattern, context, excludeProductId, isVariant);
  }
}
```

**Race Condition Prevention:**
- ✅ Unique index on `sku_normalized` at database level
- ✅ Atomic increment using `skuCounters` collection
- ✅ Two-path approach eliminates unnecessary DB checks

### 4. Category Code Extraction

**✅ DECISION: Option A (Mandatory)**

**Requirement:** Add `code` field to `categories` collection as **required field**.

**Rationale:**
- Single source of truth (no hybrid approach)
- Abbreviation dictionary only for Attributes (colors, sizes, materials)
- Category code should be explicit and managed by admin

**Migration:**
- Add `code: string` field to categories schema
- Update category form to include code input
- Auto-generate code from name if not provided (slugify + uppercase, max 10 chars)
- Validate code uniqueness

**Function:**
```typescript
async function getCategoryCode(categoryId: string): Promise<string>;
// Returns category.code field (required)
```

### 5. SKU Normalization

**Purpose:** Normalize SKU for search and duplicate checking (case-insensitive, no special chars)

**Function:**
```typescript
function normalizeSku(sku: string): string;
// Returns: Uppercase, remove special chars, trim
// Example: "AT-RED-L-001" → "ATREDL001"
```

**Usage:**
- Store `sku_normalized` in product/variant documents
- Use for duplicate checking (faster than regex)
- Use for search queries

---

## 📡 API ROUTES

### 1. Generate SKU Preview

**Endpoint:** `POST /api/admin/sku/generate`

**Purpose:** Generate SKU preview without saving to DB (for UI preview)

**Request Body:**
```typescript
{
  productName: string;
  categoryId?: string;
  brandId?: string; // Optional, for {BRAND_CODE} token
  attributes?: Array<{ // Dynamic attributes (not hardcoded)
    key: string; // e.g., 'size', 'color', 'material'
    value: string; // e.g., 'L', 'Red', 'Cotton'
  }>;
  isVariant?: boolean; // true = generate for variant, false = product level
  variantIndex?: number; // For variant generation
}
```

**Response:**
```typescript
{
  sku: string; // Generated SKU (with placeholder for {INCREMENT} if in preview mode)
  sku_normalized?: string; // Normalized SKU (only if not preview mode)
  preview?: string; // Optional: preview of how SKU was generated
  hasIncrementToken?: boolean; // Whether pattern contains {INCREMENT}
}
```

**Implementation:**
- Get SKU pattern (category-specific or global)
- Get category code from `categories.code` field (required)
- Check if pattern contains `{INCREMENT}` token
- **If preview mode:**
  - For `{INCREMENT}` token: Replace with placeholder `###` or `<SEQ>` (NOT actual number)
  - Show note: "Số thứ tự thực tế sẽ được gán khi lưu sản phẩm để đảm bảo không trùng lặp."
- **If save mode:**
  - Use two-path approach (with/without increment)
  - Generate actual SKU with atomic increment
  - Return final SKU

**⚠️ CRITICAL: Live Preview Behavior**
- **Pattern WITH {INCREMENT}:** Show placeholder (e.g., "AT-001-###") instead of actual number
- **Reason:** Multiple users can see same preview number, but actual number assigned on save
- **User Message:** "Số thứ tự thực tế sẽ được gán khi lưu sản phẩm để đảm bảo không trùng lặp."

### 1b. Bulk Generate SKU

**Endpoint:** `POST /api/admin/sku/generate-bulk`

**Purpose:** Generate SKUs for multiple products (e.g., Excel import)

**Request Body:**
```typescript
{
  products: Array<{
    productName: string;
    categoryId?: string;
    brandId?: string;
    variants?: Array<{
      attributes: Array<{ key: string; value: string }>;
    }>;
  }>;
}
```

**Response:**
```typescript
{
  results: Array<{
    productIndex: number;
    productSku?: string;
    variantSkus?: Array<{
      variantIndex: number;
      sku: string;
    }>;
    error?: string;
  }>;
}
```

**Implementation:**
- Batch process products
- Use bulk duplicate check for performance
- Return results with errors (if any)

### 2. SKU Settings Management

**Endpoints:**
- `GET /api/admin/sku/settings` - Get all settings (global + category-specific)
- `GET /api/admin/sku/settings?categoryId=xxx` - Get setting for specific category
- `POST /api/admin/sku/settings` - Create/Update setting
- `DELETE /api/admin/sku/settings?categoryId=xxx` - Delete category-specific setting

**Request Body (POST):**
```typescript
{
  categoryId?: string | null; // null = global
  pattern: string;
  separator?: string; // Default: "-"
  caseType?: 'UPPER' | 'LOWER'; // Default: 'UPPER'
}
```

### 3. Abbreviation Dictionary Management

**Endpoints:**
- `GET /api/admin/sku/abbreviations?type=ATTRIBUTE` - List abbreviations (only ATTRIBUTE type)
- `POST /api/admin/sku/abbreviations` - Create abbreviation
- `PUT /api/admin/sku/abbreviations/[id]` - Update abbreviation
- `DELETE /api/admin/sku/abbreviations/[id]` - Delete abbreviation

**Request Body (POST):**
```typescript
{
  type: 'ATTRIBUTE'; // Only ATTRIBUTE (Category code stored in categories.code)
  originalValue: string; // e.g., "Màu Đỏ", "Size L", "Material Cotton"
  shortCode: string; // Uppercase only, e.g., "DO", "L", "COT"
  categoryId?: string | null; // Optional: category-specific mapping
}
```

**Note:** Category codes are managed via categories collection, not abbreviation dictionary.

---

## 🎨 UI COMPONENTS

### 1. SKU Settings Page

**Path:** `/admin/settings/sku`

**Sections:**
1. **Global Pattern:**
   - Input field for pattern
   - Token chips below input (click to insert)
   - Separator selector (-, _, .)
   - Case type selector (UPPER, LOWER)
   - Preview example

2. **Category Exceptions:**
   - Table showing category-specific patterns
   - Add/Edit/Delete buttons
   - Override global pattern for specific categories

3. **Abbreviation Dictionary:**
   - Table with columns: Type, Original Value, Short Code, Category (optional)
   - Add/Edit/Delete rows
   - Search and filter

**Component:** `app/admin/settings/sku/page.tsx`

### 2. Product Form Integration

**File:** `components/admin/ProductForm.tsx`

**Changes:**
1. **Product Level SKU:**
   - Add button "⚡ Auto Gen" next to SKU input
   - On click: Call `/api/admin/sku/generate` and fill input
   - Show loading state during generation

2. **Variant Level SKU:**
   - Add checkbox "Auto-generate SKU for all variants" in variants table header
   - **Live preview:** Show generated SKU in gray text when attributes selected
     - **⚠️ IMPORTANT:** If pattern contains `{INCREMENT}`, show placeholder (e.g., "AT-RED-L-###") instead of actual number
     - Show tooltip: "Số thứ tự thực tế sẽ được gán khi lưu sản phẩm để đảm bảo không trùng lặp."
   - **Variant Uniqueness Validation:** Validate that no two variants have identical attributes (size, color, etc.) before generating SKU
   - If user manually edits → override auto-generated
   - Add "Regenerate SKUs" button to reset all variant SKUs

**Components:**
- `components/admin/products/SkuAutoGenerateButton.tsx` - Button component
- `components/admin/products/VariantSkuGenerator.tsx` - Variant SKU generator logic

---

## 🔄 EDGE CASES & LOGIC

### 1. Category Change Trigger

**Scenario:** User changes category in Product Form

**Solution:**
- Watch `categoryId` change in ProductForm
- If category changed → trigger SKU regeneration preview
- Show toast: "Category changed. Click 'Auto Gen' to regenerate SKU with new pattern."

### 2. Existing Products Protection

**Rule:** Never auto-update SKU of existing products

**Solution:**
- Only generate SKU when:
  - Creating new product (`!productId`)
  - User explicitly clicks "Auto Gen" button
  - User clicks "Regenerate SKUs" for variants

### 3. Special Characters Removal

**Logic:**
- Remove special characters from product name when generating SKU
- Example: "Áo thun 100% Cotton" → "AO-THUN-100-COTTON"
- Use `slugify` utility: `lib/utils/slug.ts`

### 4. Increment Handling (Atomic Sequence)

**Logic:**
- Use `skuCounters` collection for atomic increment (faster than `countDocuments()`)
- If pattern includes `{INCREMENT}`:
  - Get/Increment sequence from `skuCounters` collection using base SKU as key
  - Format: `001`, `002`, `003`, etc. (3 digits)
- If pattern doesn't include `{INCREMENT}`:
  - Append `-01`, `-02` if duplicate found (fallback)
  - Also use `skuCounters` for atomic increment

**Function:**
```typescript
async function getNextIncrement(baseSku: string): Promise<number>;
// Uses findOneAndUpdate with $inc for atomic operation
```

### 5. SKU History/Audit Logging

**Purpose:** Track SKU changes for existing products (order lookup, SEO redirect, debugging)

**When to Log:**
- SKU regenerated (user clicks "Regenerate SKUs")
- SKU manually changed
- Bulk import changes SKU

**Function:**
```typescript
async function logSkuChange(
  productId: string,
  oldSku: string,
  newSku: string,
  reason: 'regenerate' | 'manual' | 'bulk_import',
  patternUsed?: string, // Pattern used to generate new SKU
  variantId?: string,
  changedBy?: string
): Promise<void>;
```

**Usage:**
- Call before updating SKU in product/variant
- Store in `skuHistory` collection with `patternUsed` field
- Can be used for:
  - Order history lookup (old SKU → new SKU)
  - SEO redirects (301 redirect old SKU URL)
  - Audit trail
  - Debugging SKU generation issues

### 6. Variant Uniqueness Validation

**Purpose:** Prevent duplicate variants with identical attributes (business logic validation)

**Function:**
```typescript
function validateVariantUniqueness(
  variants: Array<{
    size: string;
    color?: string;
    [key: string]: any; // Other attributes
  }>
): { isValid: boolean; errors: string[] };
```

**Logic:**
- Check if any two variants have identical attributes (size, color, etc.)
- Return error if duplicates found
- **Call BEFORE generating SKU** to prevent business logic errors

**Usage:**
- Validate in ProductForm before submit
- Validate in API route before generating SKU
- Show error message: "Không thể tạo 2 biến thể có cùng thuộc tính (Size, Màu, ...)"

---

## 📝 IMPLEMENTATION STEPS

### Phase 1: Database & Core Logic
1. ✅ Create MongoDB collections: `skuSettings`, `skuAbbreviations`, `skuCounters`, `skuHistory`
2. ✅ Setup database indexes (including unique index on `sku_normalized`)
3. ✅ **Migration Script:** Create script to migrate existing categories (add `code` field)
   - Scan all categories with `code: null/undefined`
   - Auto-generate code from name (slugify + uppercase, max 10 chars)
   - Check for duplicates, add suffix if needed
   - Update to DB
   - **⚠️ CRITICAL:** Run this script BEFORE deploying code that requires `code` field
4. ✅ Add `code` field to `categories` collection (REQUIRED, not optional)
5. ✅ Add `sku_normalized` field to products and variants schema
6. ✅ Create `lib/utils/skuGenerator.ts` with core functions:
   - `parsePattern()` with dynamic attributes support
   - `getAbbreviation()` (ATTRIBUTE only)
   - `getCategoryCode()` (from categories.code)
   - `generateSku()` - Main entry point (two-path approach)
   - `generateSkuWithIncrement()` - Path 1: Pattern with {INCREMENT}
   - `generateSkuWithoutIncrement()` - Path 2: Pattern without {INCREMENT}
   - `normalizeSku()` for duplicate checking
   - `getNextIncrement()` using atomic sequence
   - `logSkuChange()` for audit trail (with patternUsed)
   - `validateVariantUniqueness()` for business logic validation

### Phase 2: API Routes
1. ✅ Create `/api/admin/sku/generate` endpoint (single product/variant)
2. ✅ Create `/api/admin/sku/generate-bulk` endpoint (bulk generation for Excel import)
3. ✅ Create `/api/admin/sku/settings` endpoints
4. ✅ Create `/api/admin/sku/abbreviations` endpoints (ATTRIBUTE only)
5. ✅ Add authentication check (require admin)
6. ✅ Add error handling for retry limit exceeded

### Phase 3: Settings Page
1. ✅ Create `/admin/settings/sku` page
2. ✅ Build Global Pattern section
3. ✅ Build Category Exceptions table
4. ✅ Build Abbreviation Dictionary table
5. ✅ Add to admin navigation menu

### Phase 4: Product Form Integration
1. ✅ Add "Auto Gen" button to product SKU field
2. ✅ Add variant SKU auto-generation checkbox
3. ✅ Add live preview for variant SKUs:
   - **If pattern has {INCREMENT}:** Show placeholder (e.g., "AT-001-###") with tooltip
   - **If pattern no {INCREMENT}:** Show actual preview SKU
4. ✅ Add variant uniqueness validation (prevent duplicate variants)
5. ✅ Add "Regenerate SKUs" button
6. ✅ Handle category change trigger

### Phase 5: Testing & Edge Cases
1. ✅ Test pattern parsing with all tokens (including {BRAND_CODE})
2. ✅ Test dynamic attributes (size, color, material, etc.)
3. ✅ Test abbreviation lookup (found + not found)
4. ✅ Test two-path approach (with/without {INCREMENT})
5. ✅ Test atomic increment (skuCounters) - Path 1
6. ✅ Test duplicate handling with fallback (Path 2)
7. ✅ Test race condition prevention (concurrent requests)
8. ✅ Test SKU normalization
9. ✅ Test category change trigger
10. ✅ Test special characters removal
11. ✅ Test existing products protection
12. ✅ Test bulk generation (1000+ products)
13. ✅ Test SKU history logging (with patternUsed)
14. ✅ Test unique index enforcement
15. ✅ Test variant uniqueness validation
16. ✅ Test live preview placeholder for {INCREMENT} token
17. ✅ Test counter reset when pattern changes
18. ✅ Test counter behavior on product delete (no reuse)

---

## 🔗 RELATED FILES

### New Files to Create
- `lib/utils/skuGenerator.ts` - Core SKU generation logic
- `app/api/admin/sku/generate/route.ts` - Generate SKU API (single)
- `app/api/admin/sku/generate-bulk/route.ts` - Bulk generate SKU API
- `app/api/admin/sku/settings/route.ts` - Settings management API
- `app/api/admin/sku/abbreviations/route.ts` - Abbreviation management API
- `app/admin/settings/sku/page.tsx` - Settings page
- `components/admin/products/SkuAutoGenerateButton.tsx` - Auto-gen button
- `components/admin/products/VariantSkuGenerator.tsx` - Variant SKU logic

### Files to Modify
- `components/admin/ProductForm.tsx` - Add SKU auto-generation UI + variant uniqueness validation
- `app/admin/layout.tsx` - Add SKU settings to navigation
- `lib/db.ts` - Add collections: `skuSettings`, `skuAbbreviations`, `skuCounters`, `skuHistory`
- `types/mongodb.ts` - Add types: `SkuSetting`, `SkuAbbreviation`, `SkuCounter`, `SkuHistory`
- `scripts/setup-database-indexes.ts` - Add indexes for new collections + unique index on `sku_normalized`
- `scripts/migrate-category-codes.ts` - **NEW:** Migration script for existing categories
- `app/api/admin/products/route.ts` - Update to save `sku_normalized` when SKU is set + validate variant uniqueness
- `app/api/admin/products/[id]/route.ts` - Update to save `sku_normalized` and log SKU changes (with patternUsed)
- `components/admin/CategoryForm.tsx` - Add `code` field input (required)
- `app/api/admin/categories/route.ts` - Add `code` field validation and auto-generation

---

## ⚠️ NOTES & CONSIDERATIONS

### Brand Field
- **✅ DECISION:** Add `{BRAND_CODE}` token from the start (returns empty string if no brand)
- **Rationale:** Avoid refactoring later when brand field is added
- **Implementation:** Token returns empty string if `brandCode` not provided

### Category Code
- **✅ DECISION:** Option A (Mandatory) - Add `code` field to categories collection
- **Rationale:** Single source of truth, no hybrid approach
- **Requirement:** `code` field is required for all categories
- **Abbreviation Dictionary:** Only used for Attributes (colors, sizes, materials), NOT categories

### Variant Attributes
- **✅ DECISION:** Dynamic attributes array (not hardcoded size/color)
- **Structure:** `attributes: Array<{ key: string, value: string }>`
- **Benefits:** Supports any attribute (size, color, material, capacity, etc.)
- **Mapping:** Convert MongoDB variant `size`/`color` to attributes array when generating SKU

### Performance Optimizations
- ✅ **Atomic Increment:** Use `skuCounters` collection instead of `countDocuments()`
- ✅ **Normalized SKU:** Store `sku_normalized` for fast duplicate checking
- ✅ **Unique Index:** Database-level unique constraint on `sku_normalized` prevents race conditions
- ✅ **Retry Limit:** Max 5 retries prevents infinite loops
- ✅ **Bulk Operations:** Bulk generate API for Excel import (1000+ products)
- ✅ **Caching:** Cache abbreviation dictionary in memory (refresh on update)

### Race Condition Prevention
- ✅ **Unique Index:** `products.createIndex({ sku_normalized: 1 }, { unique: true, sparse: true })`
- ✅ **Atomic Operations:** Use `findOneAndUpdate` with `$inc` for sequence increment
- ✅ **Error Handling:** Catch duplicate key errors and retry with incremented value

### Missing Features (Future Enhancements)
- ⏳ **Bulk Generate:** ✅ Added to plan (Phase 2)
- ⏳ **History/Audit:** ✅ Added to plan (Phase 1 - logging function with patternUsed)
- ⏳ **SKU Redirect:** Can use `skuHistory` collection for 301 redirects (future feature)

### Edge Cases & Behaviors

#### Product Deletion
- **Behavior:** When product is deleted, counter sequence does NOT decrease
- **Rationale:** Prevents reuse of SKU numbers, maintains history integrity
- **Documentation:** Note this behavior clearly for Admin (they may notice "jumping numbers")

#### Pattern Change
- **Behavior:** When SKU pattern is changed, counter key changes → counter resets to 1
- **Rationale:** New pattern = new sequence namespace
- **Example:** Pattern `{CAT}-{NAME}-{INC}` → `{CAT}-{YEAR}-{INC}` → Counter resets

#### Variant Duplicate Attributes
- **Validation:** Check for duplicate variants with identical attributes BEFORE generating SKU
- **Error Message:** "Không thể tạo 2 biến thể có cùng thuộc tính (Size, Màu, ...)"
- **Implementation:** Validate in both Frontend (ProductForm) and Backend (API route)

---

## ✅ ACCEPTANCE CRITERIA

### Core Features
- [ ] Admin can configure global SKU pattern
- [ ] Admin can override pattern for specific categories
- [ ] Admin can manage abbreviation dictionary (ATTRIBUTE only)
- [ ] Categories have required `code` field
- [ ] Product form has "Auto Gen" button for product SKU
- [ ] Variant table has auto-generate checkbox and live preview
- [ ] Generated SKUs are unique (no duplicates, enforced by unique index)
- [ ] Special characters are removed from SKU
- [ ] Category change triggers SKU regeneration prompt
- [ ] Existing products are not auto-updated
- [ ] All API routes require admin authentication

### Technical Requirements
- [ ] Unique index on `sku_normalized` prevents race conditions
- [ ] Atomic increment using `skuCounters` collection
- [ ] Retry limit (max 5) prevents infinite loops
- [ ] Dynamic attributes support (not hardcoded size/color)
- [ ] `{BRAND_CODE}` token returns empty string if no brand
- [ ] SKU normalization for case-insensitive duplicate checking
- [ ] SKU history logging for audit trail
- [ ] Bulk generation API for Excel import

### Performance
- [ ] SKU generation completes in < 500ms (single product)
- [ ] Bulk generation handles 1000+ products efficiently
- [ ] No race conditions in concurrent requests
- [ ] Abbreviation dictionary cached in memory

---

---

## 📊 REVIEW SUMMARY

**Review Date:** 2025-01-XX  
**Reviewer:** Technical Review (from `smart_sku.md`)  
**Score:** 8.5/10  
**Status:** ✅ Ready for Implementation (with improvements applied)

### Key Improvements Applied

1. ✅ **Category Code:** Chốt Option A (mandatory `code` field), không dùng hybrid
2. ✅ **Race Condition:** Thêm Unique Index trên `sku_normalized` + atomic operations
3. ✅ **Dynamic Attributes:** Thay đổi từ hardcoded size/color → dynamic attributes array
4. ✅ **SKU Normalization:** Thêm `sku_normalized` field cho search/duplicate check
5. ✅ **Atomic Increment:** Dùng `skuCounters` collection thay vì `countDocuments()`
6. ✅ **Retry Limit:** Giới hạn max 5 lần retry
7. ✅ **BRAND_CODE Token:** Thêm ngay từ đầu (trả về empty string nếu chưa có)
8. ✅ **Bulk Generate:** Thêm API endpoint cho Excel import
9. ✅ **History/Audit:** Thêm `skuHistory` collection để log SKU changes

### Technical Debt Avoided

- ✅ Single source of truth cho Category Code (không duplicate data)
- ✅ Race condition prevention ở database level
- ✅ Extensible attributes system (không cần refactor khi thêm attribute mới)
- ✅ Performance optimization với atomic operations và caching

---

---

## 🔍 DEEP REVIEW SUMMARY (2025-12-15)

**Reviewer:** Technical Deep Review  
**Score:** 9.5/10  
**Status:** ✅ Ready for Implementation (with refined logic details)

### Key Refinements Applied

1. ✅ **Two-Path Logic:** Tách `generateSku()` thành 2 luồng rõ ràng:
   - Path 1: Pattern CÓ `{INCREMENT}` → Dùng Counter luôn (không check DB trước)
   - Path 2: Pattern KHÔNG có `{INCREMENT}` → Check DB trước, fallback Counter nếu duplicate

2. ✅ **Live Preview Placeholder:** 
   - Pattern có `{INCREMENT}` → Hiển thị placeholder `###` hoặc `<SEQ>` (không phải số thật)
   - Tooltip: "Số thứ tự thực tế sẽ được gán khi lưu sản phẩm để đảm bảo không trùng lặp."

3. ✅ **Schema Enhancements:**
   - Thêm `patternUsed` vào `skuHistory` (for debugging)
   - Document counter behavior (reset on pattern change, no reuse on delete)

4. ✅ **Migration Strategy:**
   - Script migration cho Category Code (legacy data)
   - Chạy TRƯỚC khi deploy code mới

5. ✅ **Edge Cases:**
   - Variant uniqueness validation (prevent duplicate attributes)
   - Document counter behavior (no reuse on delete)
   - Document pattern change behavior (counter reset)

### Implementation Notes

- ✅ Logic được tinh chỉnh để tránh xung đột giữa Duplicate Check và Atomic Increment
- ✅ UI Preview được cập nhật để tránh confusion với số increment
- ✅ Migration script được thêm vào Phase 1
- ✅ Validation được thêm vào để prevent business logic errors

---

**Last Updated:** 2025-12-15  
**Status:** ✅ Planning Complete → Ready for Implementation (Refined)

