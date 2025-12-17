# 📡 PRODUCT MODULE - BACKEND API REFERENCE

**Last Updated:** 2025-12-17  
**Status:** 📚 Long-term Reference Document  
**Parent Document:** [PRODUCT_MODULE_REFERENCE.md](../PRODUCT_MODULE_REFERENCE.md)

---

## 3. BACKEND API

### 3.1 Admin API Routes (`/api/admin/products`)

#### GET `/api/admin/products`
**Purpose:** List products with filters and pagination  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

**Query Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10)
- `search` - Search term (name, SKU, description)
- `status` - Filter by status (`draft`, `publish`, `trash`)
- `category` - Filter by category ID
- `tag` - Filter by tag
- `sortBy` - Sort field (`name`, `price`, `createdAt`, `updatedAt`)
- `sortOrder` - Sort direction (`asc`, `desc`)

**Response:**
```typescript
{
  products: MappedProduct[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;  // Note: uses perPage, not limit
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters?: {
    trashCount?: number;  // Count of trashed products (for trash tab badge)
  };
}
```

#### POST `/api/admin/products`
**Purpose:** Create new product  
**Authentication:** Required (Admin)  
**Permissions:** `product:create`

**Request Body:**
```typescript
{
  name: string;
  description: string;
  regularPrice: number;
  salePrice?: number;
  // ... (see API documentation)
}
```

**Response:**
```typescript
{
  product: MappedProduct;
  message: string;
}
```

#### GET `/api/admin/products/[id]`
**Purpose:** Get single product by ID  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

**Response:**
```typescript
{
  product: MappedProduct;
}
```

#### PUT `/api/admin/products/[id]`
**Purpose:** Update product  
**Authentication:** Required (Admin)  
**Permissions:** `product:update`

**Request Body:**
```typescript
{
  // Product fields to update
  version: number;  // Required for optimistic locking
  // ... other fields
}
```

**Error Responses:**
- `409 Conflict` - Version mismatch (optimistic locking)
- `404 Not Found` - Product not found

#### DELETE `/api/admin/products/[id]`
**Purpose:** Soft delete product  
**Authentication:** Required (Admin)  
**Permissions:** `product:delete`

**Response:**
```typescript
{
  message: string;
}
```

#### POST `/api/admin/products/bulk-action`
**Purpose:** Bulk operations (delete, status change, restore)  
**Authentication:** Required (Admin)  
**Permissions:** `product:update`, `product:delete`

**Request Body:**
```typescript
{
  ids: string[];  // Array of product IDs
  action: 'soft_delete' | 'force_delete' | 'restore' | 'update_status' | 'update_price' | 'update_stock';
  value?: string | number;  // Optional: value for update_status, update_price, or update_stock
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
  affected: number;
}
```

#### POST `/api/admin/products/validate-sku`
**Purpose:** Validate SKU uniqueness  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

**Query Parameters:**
- `sku` - SKU to validate
- `productId` - Optional: exclude this product from check

**Response:**
```typescript
{
  exists: boolean;
  available: boolean;
}
```

#### GET `/api/admin/products/validate-slug`
**Purpose:** Validate slug uniqueness  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

**Query Parameters:**
- `slug` - Slug to validate
- `productId` - Optional: exclude this product from check

**Response:**
```typescript
{
  exists: boolean;
  available: boolean;
}
```

#### POST `/api/admin/products/import`
**Purpose:** Import products from file  
**Authentication:** Required (Admin)  
**Permissions:** `product:create`

**Request:** Multipart form data with file

**Response:**
```typescript
{
  success: boolean;
  imported: number;
  errors: string[];
}
```

#### POST `/api/admin/products/export`
**Purpose:** Export products to file  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

**Query Parameters:**
- `format` - Export format (`csv`, `json`, `xlsx`)
- `status` - Filter by status
- `category` - Filter by category

**Response:** File download

#### POST `/api/admin/products/auto-cleanup-trash`
**Purpose:** Auto cleanup products in trash (older than X days)  
**Authentication:** Required (Admin)  
**Permissions:** `product:delete`

**Query Parameters:**
- `days` - Days to keep in trash (default: 30)

**Response:**
```typescript
{
  success: boolean;
  deleted: number;
}
```

#### GET `/api/admin/products/templates`
**Purpose:** Get product templates  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

**Response:**
```typescript
{
  templates: ProductTemplate[];
}
```

#### POST `/api/admin/products/templates`
**Purpose:** Create product template  
**Authentication:** Required (Admin)  
**Permissions:** `product:create`

**Request Body:**
```typescript
{
  name: string;
  data: Partial<MongoProduct>;
}
```

#### GET `/api/admin/products/templates/[id]`
**Purpose:** Get single template  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

### 3.2 Additional Admin Product Endpoints (`/api/admin/products/[id]/*`)

#### POST `/api/admin/products/[id]/duplicate`
**Purpose:** Duplicate product  
**Authentication:** Required (Admin)  
**Permissions:** `product:create`

**Response:**
```typescript
{
  product: MappedProduct;
  message: string;
}
```

#### PATCH `/api/admin/products/[id]/quick-update`
**Purpose:** Quick update product fields (name, SKU, status, price, stock, variants)  
**Authentication:** Required (Admin)  
**Permissions:** `product:update`

**Request Body:**
```typescript
{
  name?: string;                    // Product name
  sku?: string;                     // Product SKU
  status?: 'draft' | 'publish' | 'trash';
  manageStock?: boolean;            // Enable/disable stock management
  regularPrice?: number;            // Regular price (min: 0)
  salePrice?: number | null;        // Sale price (min: 0, nullable to clear)
  stockQuantity?: number;           // Stock quantity (min: 0)
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder';
  version?: number;                 // Optimistic locking version
  variants?: Array<{                // Variant updates (for variable products)
    id: string;                     // Variant ID (required)
    sku?: string;                   // Variant SKU
    price?: number;                 // Variant price (min: 0)
    stock?: number;                 // Variant stock (min: 0)
    // Note: Variants don't have stockStatus - they inherit from parent
  }>;
  // Backward compatibility
  price?: number;                   // Alias for regularPrice
}
```

**Validation Rules:**
- At least one field must be provided
- `salePrice` must be < `regularPrice` (if both provided)
- `salePrice: null` clears the sale price field
- Variant IDs must exist in product
- Version check for optimistic locking (409 Conflict if mismatch)

**Business Logic:**
- **Auto-Sync Stock Status:** When `stockQuantity` is updated:
  - If `stockQuantity > 0` → Auto-set `stockStatus = 'instock'` (unless `onbackorder` or manual override)
  - If `stockQuantity <= 0` → Auto-set `stockStatus = 'outofstock'` (unless `onbackorder` or manual override)
  - Respects `onbackorder` status and manual `stockStatus` overrides
- **Sale Price Cleanup:** When `salePrice` is updated, automatically clears `salePriceStartDate` and `salePriceEndDate`
- **Manage Stock:** When `manageStock = false`, clears `stockQuantity = 0`
- **Variant Updates:** Only updates provided fields, preserves other variant data
- **Bounds Recalculation:** Automatically recalculates `minPrice`, `maxPrice`, `totalStock` after update
- **Audit Log:** Creates audit log entry in `adminActivityLogs` collection

**Response:**
```typescript
{
  success: boolean;
  product: MappedProduct;
}
```

**Error Responses:**
- `400 Bad Request` - Validation error or invalid variant IDs
- `404 Not Found` - Product not found
- `409 Conflict` - Version mismatch (optimistic locking)
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions

**Example Request:**
```typescript
// Update product name and price
PATCH /api/admin/products/507f1f77bcf86cd799439011/quick-update
{
  "name": "Gấu Bông Mới",
  "regularPrice": 500000,
  "salePrice": 400000,
  "version": 5
}

// Clear sale price
PATCH /api/admin/products/507f1f77bcf86cd799439011/quick-update
{
  "salePrice": null,
  "version": 6
}

// Update variant stock
PATCH /api/admin/products/507f1f77bcf86cd799439011/quick-update
{
  "variants": [
    { "id": "variant-1", "stock": 10 },
    { "id": "variant-2", "price": 450000 }
  ],
  "version": 7
}
```

#### PATCH `/api/admin/products/[id]/restore`
**Purpose:** Restore product from trash  
**Authentication:** Required (Admin)  
**Permissions:** `product:update`

**Response:**
```typescript
{
  product: MappedProduct;
  message: string;
}
```

#### DELETE `/api/admin/products/[id]/force`
**Purpose:** Force delete (permanent delete)  
**Authentication:** Required (Admin)  
**Permissions:** `product:delete`

**Warning:** This permanently deletes the product. Use with caution.

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

#### GET `/api/admin/products/[id]/analytics`
**Purpose:** Get product analytics  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

**Response:**
```typescript
{
  viewCount: number;
  salesCount: number;
  revenue: number;
  lastViewed?: Date;
  lastSold?: Date;
}
```

#### POST `/api/admin/products/[id]/analytics`
**Purpose:** Track product view  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

**Response:**
```typescript
{
  success: boolean;
}
```

#### GET `/api/admin/products/[id]/stock`
**Purpose:** Get product stock information  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

**Response:**
```typescript
{
  stockQuantity: number;
  stockStatus: string;
  reservedQuantity?: number;
  availableQuantity: number;
}
```

#### GET `/api/admin/products/[id]/reviews`
**Purpose:** Get product reviews  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

**Response:**
```typescript
{
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}
```

#### POST `/api/admin/products/[id]/reviews`
**Purpose:** Create product review (admin)  
**Authentication:** Required (Admin)  
**Permissions:** `product:update`

**Request Body:**
```typescript
{
  rating: number; // 1-5
  comment: string;
  author: string;
}
```

#### GET `/api/admin/products/[id]/reviews/[reviewId]`
**Purpose:** Get single review  
**Authentication:** Required (Admin)  
**Permissions:** `product:read`

#### PUT `/api/admin/products/[id]/reviews/[reviewId]`
**Purpose:** Update review  
**Authentication:** Required (Admin)  
**Permissions:** `product:update`

#### DELETE `/api/admin/products/[id]/reviews/[reviewId]`
**Purpose:** Delete review  
**Authentication:** Required (Admin)  
**Permissions:** `product:update`

#### PUT `/api/admin/products/[id]/variations/bulk`
**Purpose:** Bulk update variations  
**Authentication:** Required (Admin)  
**Permissions:** `product:update`

**Request Body:**
```typescript
{
  variations: Array<{
    id: string;
    price?: number;
    stock?: number;
    // ... other fields
  }>;
}
```

#### POST `/api/admin/products/[id]/variations/map-images`
**Purpose:** Map images to variations  
**Authentication:** Required (Admin)  
**Permissions:** `product:update`

**Request Body:**
```typescript
{
  mappings: Array<{
    variationId: string;
    imageId: string;
  }>;
}
```

### 3.3 Public API Routes (`/api/cms/products`)

#### GET `/api/cms/products`
**Purpose:** List published products (public)  
**Authentication:** Not required

**Query Parameters:**
- Similar to admin API but only returns `status: 'publish'` products
- `deletedAt: null` filter applied automatically

**Response:**
```typescript
{
  products: MappedProduct[];
  pagination: PaginationInfo;
}
```

#### GET `/api/cms/products/[id]`
**Purpose:** Get product by ID or slug (public)  
**Authentication:** Not required  
**Note:** The `[id]` parameter accepts both ObjectId and slug

**Response:**
```typescript
{
  product: MappedProduct;
}
```

#### GET `/api/cms/products/attributes`
**Purpose:** Get available product attributes (sizes, colors)  
**Authentication:** Not required

**Response:**
```typescript
{
  sizes: string[];
  colors: string[];
  materials?: string[];
}
```

#### GET `/api/cms/products/[id]/variations`
**Purpose:** Get product variations (public)  
**Authentication:** Not required

**Response:**
```typescript
{
  variations: MongoVariant[];
}
```

#### GET `/api/cms/products/[id]/reviews`
**Purpose:** Get product reviews (public)  
**Authentication:** Not required

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `rating` - Filter by rating (1-5)

**Response:**
```typescript
{
  reviews: Review[];
  pagination: PaginationInfo;
  averageRating: number;
  totalReviews: number;
}
```

#### POST `/api/cms/products/[id]/reviews`
**Purpose:** Submit product review (public)  
**Authentication:** Not required

**Request Body:**
```typescript
{
  rating: number; // 1-5
  comment: string;
  author: string;
  email?: string;
}
```

**Response:**
```typescript
{
  review: Review;
  message: string;
}
```

#### POST `/api/cms/products/[id]/reviews/[reviewId]/helpful`
**Purpose:** Mark review as helpful  
**Authentication:** Not required

**Response:**
```typescript
{
  success: boolean;
  helpfulCount: number;
}
```

### 3.4 Data Mapping

**MongoDB → Frontend Mapping:**
- Use `mapMongoProduct()` from `lib/utils/productMapper.ts`
- Converts `_id` → `id` (string)
- Converts `ObjectId[]` → `string[]`
- Handles null/undefined values
- Maps variants structure

**Example:**
```typescript
import { mapMongoProduct } from '@/lib/utils/productMapper';

const mongoProduct = await collections.products.findOne({ _id: id });
if (!mongoProduct) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

const mappedProduct = mapMongoProduct(mongoProduct as unknown as MongoProduct);
return NextResponse.json({ product: mappedProduct });
```

### 3.5 Validation Rules

**Location:** Validation schemas are defined in API routes using Zod

#### Product Creation Schema

**Required Fields:**
- `name` - String, min length 1
- `slug` - String, min length 1, must be unique
- `minPrice` - Number, min 0

**Optional Fields:**
- `description` - String
- `shortDescription` - String
- `sku` - String (must be unique if provided)
- `status` - Enum: `'draft' | 'publish' | 'trash'` (default: `'draft'`)
- `isActive` - Boolean (default: `true`)
- `visibility` - Enum: `'public' | 'private' | 'password'`
- `password` - String (required if `visibility === 'password'`)

**Price Validation:**
```typescript
// Rule 1: regularPrice is required for simple products
.refine((data) => {
  const productType = data.productDataMetaBox?.productType || 'simple';
  const isSimpleProduct = productType === 'simple';
  const hasVariations = data.productDataMetaBox?.variations?.length > 0;
  
  if (isSimpleProduct && !hasVariations) {
    return data.productDataMetaBox?.regularPrice > 0;
  }
  return true;
}, {
  message: "Giá bán thường là bắt buộc cho sản phẩm đơn giản",
  path: ["productDataMetaBox", "regularPrice"],
})

// Rule 2: If salePrice exists, regularPrice must exist
.refine((data) => {
  if (data.productDataMetaBox?.salePrice > 0) {
    return data.productDataMetaBox?.regularPrice !== undefined;
  }
  return true;
}, {
  message: "Phải có giá bán thường khi đặt giá khuyến mãi",
  path: ["productDataMetaBox", "salePrice"],
})

// Rule 3: salePrice must be less than regularPrice
.refine((data) => {
  if (data.productDataMetaBox?.salePrice && data.productDataMetaBox?.regularPrice) {
    return data.productDataMetaBox.salePrice < data.productDataMetaBox.regularPrice;
  }
  return true;
}, {
  message: "Giá khuyến mãi phải nhỏ hơn giá bán thường",
  path: ["productDataMetaBox", "salePrice"],
})
```

**Slug Validation:**
- Must be unique across all products
- Auto-generated from name if not provided (on create only)
- Preserved on update (unless explicitly changed)
- URL-friendly format (lowercase, hyphens)
- If duplicate found, random suffix is added

**SKU Validation:**
- Must be unique if provided
- Can be empty (optional)
- Normalized before checking (uppercase, trimmed)
- Checked via `/api/admin/products/validate-sku` endpoint

**Variant Validation:**
```typescript
variants: z.array(z.object({
  id: z.string(),
  size: z.string(),
  color: z.string().optional(),
  colorCode: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().min(0),
  image: z.string().optional(),
  sku: z.string().optional(),
})).default([])
```

**Validation Rules:**
- Variant `price` must be >= 0
- Variant `stock` must be >= 0
- Variant `salePrice` (if exists) must be < `regularPrice`
- Variant SKU must be unique if provided

**SEO Validation:**
```typescript
seo: z.object({
  focusKeyword: z.string().optional(),
  seoTitle: z.string().optional(), // Recommended: ~60 characters
  seoDescription: z.string().optional(), // Recommended: ~160 characters
  slug: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
  robotsMeta: z.string().optional(),
  ogImage: z.string().optional(),
  ogImageId: z.string().optional(),
  socialDescription: z.string().optional(),
}).optional()
```

**Error Responses:**
- `400 Bad Request` - Validation failed (Zod errors)
- `409 Conflict` - Duplicate slug/SKU or version mismatch
- `404 Not Found` - Product not found
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions

**Validation Error Format:**
```typescript
{
  error: string;
  issues?: Array<{
    path: (string | number)[];
    message: string;
  }>;
}
```

---

**See Also:**
- [Frontend Components](./COMPONENTS.md)
- [Hooks & Utilities](./HOOKS.md)
- [Business Logic](./BUSINESS_LOGIC.md)
- [Main Reference](../PRODUCT_MODULE_REFERENCE.md)

