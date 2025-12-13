# PRODUCT MODULE CONTEXT

**Last Updated:** 2025-01-13  
**Status:** Phase 1-4 Complete (19/22 tasks)  
**Reference:** `PRODUCT_MODULE_FIX_PLAN.md`, `PRODUCT_MODULE_REVIEW_REPORT.md`

---

## 📋 OVERVIEW

Product Module đã được refactor và optimize qua 4 phases:
- **Phase 1:** Critical & High Priority (5/5 tasks ✅)
- **Phase 2:** Medium Priority (3/4 tasks ✅, 1 deferred)
- **Phase 3:** UX Improvements (7/8 tasks ✅, 1 deferred)
- **Phase 4:** Performance & Security (4/5 tasks ✅, 1 deferred)

---

## 🗄️ DATABASE SCHEMA

### Product Document Structure

```typescript
interface ProductDocument {
  _id: ObjectId;
  name: string;
  slug: string; // Unique, auto-generated from name
  description: string; // HTML content
  shortDescription?: string;
  sku?: string;
  
  // Status & Visibility
  status: 'draft' | 'publish' | 'trash';
  isActive: boolean;
  visibility: 'public' | 'private' | 'password';
  password?: string; // Only if visibility === 'password'
  
  // Soft Delete
  deletedAt?: Date | null; // null = not deleted, Date = deleted timestamp
  // When deleted: deletedAt = new Date(), status = 'trash'
  
  // Optimistic Locking
  version: number; // Starts at 1, increments on each update
  
  // Images
  _thumbnail_id?: string; // Attachment ID for featured image
  _product_image_gallery?: string; // Comma-separated attachment IDs
  images?: string[]; // Legacy: array of image URLs (for backward compatibility)
  
  // Media Extended (SEO & Additional Media)
  mediaExtended?: {
    imageAltTexts?: Record<string, string>; // imageId -> altText
    videos?: Array<{ url: string; type: 'youtube' | 'vimeo' | 'upload'; thumbnail?: string }>;
    view360Images?: string[];
  };
  
  // Product Data Meta Box
  productDataMetaBox?: {
    productType: 'simple' | 'variable' | 'grouped' | 'external';
    isVirtual: boolean;
    isDownloadable: boolean;
    sku?: string;
    manageStock: boolean;
    stockQuantity?: number;
    stockStatus: 'instock' | 'outofstock' | 'onbackorder';
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    regularPrice?: number;
    salePrice?: number; // Must be < regularPrice
    salePriceStartDate?: Date;
    salePriceEndDate?: Date;
    costPrice?: number;
    lowStockThreshold?: number;
    backorders: 'no' | 'notify' | 'yes';
    soldIndividually: boolean;
    purchaseNote?: string;
    menuOrder: number;
    enableReviews: boolean;
    attributes?: Array<{
      name: string;
      options: string[];
      visible: boolean;
      variation: boolean;
    }>;
    variations?: Array<{
      id: string;
      attributes: Record<string, string>;
      regularPrice: number;
      salePrice?: number;
      stockQuantity?: number;
      sku?: string;
      image?: string;
    }>;
  };
  
  // Variants (Frontend format)
  variants?: Array<{
    id: string;
    size: string;
    color?: string;
    colorCode?: string;
    price: number;
    stock: number;
    image?: string;
    sku?: string;
  }>;
  
  // Categories & Tags
  category?: string; // Legacy: single category ID
  categoryId?: string; // Single primary category
  categories?: string[]; // Multiple categories (new)
  tags?: string[];
  
  // SEO
  seo?: {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    ogImage?: string;
  };
  _productSchema?: object; // JSON-LD schema
  
  // Gift Features
  giftFeatures?: {
    giftWrapping: boolean;
    giftMessageEnabled: boolean;
    giftCardEnabled: boolean;
    giftDeliveryDateEnabled: boolean;
  };
  
  // Pricing
  minPrice?: number;
  maxPrice?: number;
  price?: number; // Legacy: single price
  
  // Dimensions & Weight
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  volumetricWeight?: number; // Calculated: (L * W * H) / 6000
  
  // Flags
  isHot?: boolean; // Featured product
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date; // For scheduled publishing
}
```

---

## 🔐 API ENDPOINTS

### Admin API (`/api/admin/products`)

#### GET `/api/admin/products`
- **Query Params:**
  - `page`, `per_page`: Pagination
  - `search`: Search by name, description, SKU
  - `status`: Filter by status (`draft`, `publish`, `trash`)
  - `trashed`: Boolean, show only trashed products
  - `category`, `brand`, `priceMin`, `priceMax`, `stockStatus`: Filters
- **Response:** `{ products: MappedProduct[], pagination: {...}, total: number }`
- **Note:** Automatically filters `deletedAt: null` unless `trashed=true`

#### POST `/api/admin/products`
- **Body:** ProductFormData
- **Validation:**
  - Zod schema with `.refine()` for `salePrice < regularPrice`
  - Slug uniqueness check
  - Auto-generates `version: 1`
- **Response:** `{ product: MappedProduct }` (status 201)

#### GET `/api/admin/products/[id]`
- **Params:** `id` (ObjectId or slug)
- **Response:** `{ product: MappedProduct }`
- **Note:** Returns product with current `version` field

#### PUT `/api/admin/products/[id]`
- **Body:** ProductFormData (must include `version` for optimistic locking)
- **Validation:**
  - Optimistic locking: Checks `version` matches current version
  - Returns 409 `VERSION_MISMATCH` if version doesn't match
  - Zod schema with `.refine()` for `salePrice < regularPrice`
  - Slug uniqueness check (if slug changed)
- **Response:** `{ product: MappedProduct }` (with updated `version`)
- **Note:** Increments `version` after successful update

#### DELETE `/api/admin/products/[id]`
- **Soft Delete:** Sets `deletedAt: new Date()`, `status: 'trash'`
- **Response:** `{ success: true, message: string, product: MappedProduct }`
- **Note:** Never hard deletes (prevents foreign key issues)

#### POST `/api/admin/products/bulk-action`
- **Body:** `{ ids: string[], action: string, value?: any }`
- **Actions:**
  - `soft_delete`: Soft delete multiple products
  - `restore`: Restore from trash
  - `force_delete`: Hard delete (use with caution)
  - `update_status`: Update status to `draft` or `publish`
  - `update_price`: Update price for all selected
  - `update_stock`: Update stock quantity

#### GET `/api/admin/products/validate-slug`
- **Query:** `slug: string`
- **Response:** `{ exists: boolean }`
- **Use:** Check if slug is available before generating

### Public API (`/api/cms/products`)

#### GET `/api/cms/products`
- **Query Params:** Same as admin API
- **Filters:**
  - **CRITICAL:** Only returns `status: 'publish'` and `deletedAt: null`
  - `isActive: true`
- **Response:** `{ products: MappedProduct[], pagination: {...} }`

#### GET `/api/cms/products/[id]`
- **Params:** `id` (ObjectId or slug)
- **Filters:**
  - **CRITICAL:** Only returns `status: 'publish'` and `deletedAt: null`
  - `isActive: true`
- **Response:** `{ product: MappedProduct }`

---

## 🎨 COMPONENTS

### ProductForm (`components/admin/ProductForm.tsx`)
- **Features:**
  - Optimistic locking with version field
  - Dirty check before submit
  - Local state for input fields (onBlur optimization)
  - Auto-save functionality
  - Slug auto-generation (only on create)
  - Price validation
  - Image alt text management
- **State Management:**
  - `formData`: Main form state
  - `initialFormData`: For dirty check comparison
  - `localName`: Local state for name input (onBlur optimization)
  - `version`: Current product version (for optimistic locking)

### PriceInput (`components/admin/products/PriceInput.tsx`)
- **Purpose:** Format price with thousand separators (10.000.000 đ)
- **Props:**
  - `value?: number`: Numeric value
  - `onChange?: (value: number | undefined) => void`
  - `showCurrency?: boolean`: Show "đ" suffix
- **Usage:** Replace native `<input type="number">` for price fields

### FeaturedImageBox (`components/admin/products/sidebar/FeaturedImageBox.tsx`)
- **Features:**
  - Media picker integration
  - Alt text input for SEO
  - Hidden input `_thumbnail_id`
- **Props:**
  - `thumbnailId?: string`
  - `thumbnailUrl?: string`
  - `altText?: string`
  - `onAltTextChange?: (altText: string) => void`

### ProductGalleryBox (`components/admin/products/sidebar/ProductGalleryBox.tsx`)
- **Features:**
  - Drag & drop reordering (@dnd-kit)
  - Multi-select media picker
  - Alt text inputs for each image
  - Hidden input `_product_image_gallery` (comma-separated IDs)
- **Props:**
  - `galleryImages?: GalleryImage[]`
  - `onImagesChange: (images: GalleryImage[]) => void`
  - `onAltTextChange?: (imageId: string, altText: string) => void`

### ClassicEditor (`components/admin/products/ClassicEditor.tsx`)
- **Features:**
  - Visual/Text mode toggle
  - Image paste uploads to server (not Base64)
  - Video embed support
  - Image editing tools
- **Image Upload:**
  - Paste handler uploads to `/api/admin/media/upload`
  - Disables Base64 (`allowBase64: false`)
  - Uses toast for error messages

---

## 🔒 SECURITY & VALIDATION

### XSS Protection
- **Library:** `isomorphic-dompurify`
- **Usage:** All HTML content sanitized before rendering
- **Function:** `sanitizeHtml(html: string): string` in `lib/utils/sanitizeHtml.ts`
- **Applied to:**
  - Product descriptions (`dangerouslySetInnerHTML`)
  - Public product pages
  - Admin product preview

### Price Validation
- **Rule:** `salePrice` must be less than `regularPrice`
- **Implementation:** Zod `.refine()` in product schema
- **Error:** Returns validation error if violated

### Optimistic Locking
- **Field:** `version` (number, starts at 1)
- **Check:** On PUT request, compares request version with current version
- **Conflict:** Returns 409 `VERSION_MISMATCH` if versions don't match
- **Update:** Increments version after successful update
- **Frontend:** Shows toast message and reloads page on conflict

### Slug Validation
- **Uniqueness:** Checked before create/update
- **Auto-generation:** Only on create, preserves on edit
- **Duplicate Handling:** Appends random suffix if duplicate
- **Function:** `generateUniqueSlug()` in `lib/utils/slug.ts`

---

## 🚀 BEST PRACTICES

### Creating Products
1. Auto-generate slug from name (only on create)
2. Initialize `version: 1`
3. Validate `salePrice < regularPrice`
4. Check slug uniqueness
5. Set `deletedAt: null` (default)

### Updating Products
1. Always include `version` field in request
2. Handle `VERSION_MISMATCH` error (409)
3. Update `version` in formData after successful save
4. Update `initialFormData` with new version
5. Preserve slug unless explicitly changed

### Deleting Products
1. **Never hard delete** (use soft delete)
2. Set `deletedAt: new Date()`
3. Set `status: 'trash'`
4. Filter `deletedAt: null` in queries

### Image Management
1. Use `_thumbnail_id` for featured image
2. Use `_product_image_gallery` (comma-separated IDs) for gallery
3. Store alt texts in `mediaExtended.imageAltTexts`
4. Always provide alt text for SEO

### Form Optimization
1. Use local state for input fields
2. Update formData onBlur (not onChange)
3. Use `isDirty()` before submitting
4. Show loading states for async operations
5. Use toast instead of alert()

---

## 📝 MIGRATION NOTES

### From WordPress/WooCommerce
- **No longer uses:** WordPress post types, WooCommerce product types
- **Uses:** Custom MongoDB schema with `productDataMetaBox`
- **Images:** Attachment IDs instead of WordPress attachment IDs
- **Categories:** MongoDB ObjectIds instead of WordPress term IDs

### Backward Compatibility
- **Legacy fields:** `images[]`, `category`, `price` still supported
- **New fields:** `_thumbnail_id`, `_product_image_gallery`, `categories[]` preferred
- **Mapper:** `mapMongoProduct()` handles both old and new formats

---

## 🔗 RELATED FILES

- **Plan:** `docs/PRODUCT_MODULE_FIX_PLAN.md`
- **Review:** `docs/PRODUCT_MODULE_REVIEW_REPORT.md`
- **Schema:** `docs/SCHEMA_CONTEXT.md`
- **Mapper:** `lib/utils/productMapper.ts`
- **Slug Utils:** `lib/utils/slug.ts`
- **Sanitize:** `lib/utils/sanitizeHtml.ts`

---

**Last Review:** 2025-01-13  
**Status:** ✅ Production Ready
