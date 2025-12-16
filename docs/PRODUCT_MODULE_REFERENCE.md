# 📦 PRODUCT MODULE - COMPREHENSIVE REFERENCE

**Last Updated:** 2025-01-XX  
**Status:** 📚 Long-term Reference Document  
**Purpose:** Complete technical reference for Product Module and related modules

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Backend API](#backend-api)
4. [Frontend Components](#frontend-components)
5. [Hooks & Utilities](#hooks--utilities)
6. [Data Flow](#data-flow)
7. [Business Logic](#business-logic)
8. [Related Modules](#related-modules)
9. [Common Patterns](#common-patterns)
10. [Troubleshooting](#troubleshooting)

---

## 1. OVERVIEW

### 1.1 Module Purpose
Product Module là module trung tâm của hệ thống e-commerce, quản lý toàn bộ thông tin sản phẩm từ backend đến frontend.

### 1.2 Key Features
- ✅ Product CRUD operations
- ✅ Product variations (size, color)
- ✅ Product images & media
- ✅ Product categories & tags
- ✅ Product pricing & inventory
- ✅ SEO optimization
- ✅ Soft delete & trash management
- ✅ Optimistic locking (version control)
- ✅ Bulk operations

### 1.3 Tech Stack
- **Backend:** Next.js API Routes (`/api/admin/products/*`, `/api/cms/products/*`)
- **Database:** MongoDB (collection: `products`)
- **Frontend:** Next.js 14+ (App Router), React, TypeScript
- **State Management:** React Query, Zustand (cart)
- **UI:** Shadcn UI, Tailwind CSS

---

## 2. DATABASE SCHEMA

### 2.1 Product Document Structure

**Note:** For complete and up-to-date schema, see [SCHEMA_CONTEXT.md](./SCHEMA_CONTEXT.md)

```typescript
interface MongoProduct {
  _id: ObjectId;
  name: string;                    // Product name
  slug: string;                     // URL-friendly identifier (unique)
  description: string;              // HTML content
  shortDescription?: string;       // Short description for listings
  sku?: string;                     // Stock Keeping Unit
  minPrice: number;                 // Minimum price (from variants or regularPrice)
  maxPrice?: number;                // Maximum price (if has variants)
  
  // Status & Visibility
  status: 'draft' | 'publish' | 'trash';
  isActive: boolean;                // Product active flag
  visibility?: 'public' | 'private' | 'password';
  password?: string;                // Password if visibility === 'password'
  
  // Soft Delete
  deletedAt?: Date | null;          // Soft delete timestamp (null = not deleted)
  
  // Optimistic Locking
  version: number;                  // Optimistic locking version (starts at 1)
  
  // Images (Legacy & New Structure)
  _thumbnail_id?: string;           // Attachment ID for featured image (Media Library)
  _product_image_gallery?: string;  // Comma-separated attachment IDs for gallery
  images?: string[];                // Legacy: array of image URLs (backward compatibility)
  featuredImage?: string;           // Main product image URL
  
  // Categories & Tags
  categories: ObjectId[];           // Category references (many-to-many)
  tags: string[];                   // Product tags
  
  // Product Data Meta Box (Core Product Data)
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
    regularPrice?: number;           // Base price
    salePrice?: number;             // Discounted price (must be < regularPrice)
    salePriceStartDate?: Date;
    salePriceEndDate?: Date;
    costPrice?: number;
    lowStockThreshold?: number;
    backorders: 'no' | 'notify' | 'yes';
    soldIndividually: boolean;
    purchaseNote?: string;
    menuOrder: number;
    enableReviews: boolean;
    
    // Attributes & Variations
    attributes?: Array<{
      name: string;
      options: string[];
      visible: boolean;
      variation: boolean;
      globalAttributeId?: string;
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
  
  // Variants (Frontend format - direct size/color fields)
  variants?: MongoVariant[];        // Product variations
  
  // SEO Meta Box (Phase 1)
  seo?: {
    focusKeyword?: string;
    seoTitle?: string;
    seoDescription?: string;
    slug?: string;
    canonicalUrl?: string;
    robotsMeta?: string;
    ogImage?: string;
    ogImageId?: string;
    socialDescription?: string;
  };
  
  // Gift Features (Phase 2)
  giftFeatures?: {
    giftWrapping: boolean;  // Note: field name is giftWrapping, not giftWrappingEnabled
    giftWrappingPrice?: number;
    giftMessageEnabled: boolean;
    giftMessageMaxLength?: number;
    giftCardEnabled: boolean;
    giftCardTypes?: string[];
    giftDeliveryDateEnabled: boolean;
    giftCategories?: string[];
    giftSuggestions?: string[];
  };
  
  // Media Extended (Phase 2)
  mediaExtended?: {
    imageAltTexts?: Record<string, string>; // imageId -> altText
    videos?: Array<{
      url: string;
      type: 'youtube' | 'vimeo' | 'upload';
      thumbnail?: string;
    }>;
    view360Images?: string[];
  };
  
  // Product Details (Phase 1)
  productDetails?: {
    ageRecommendation?: string;
    careInstructions?: string;
    safetyInformation?: string;
    productSpecifications?: Record<string, string>;
    sizeGuide?: string;
    materialDetails?: string;
    warrantyInformation?: string;
  };
  
  // Collections & Relations (Phase 3)
  collections?: ObjectId[];         // Collection references
  relatedProducts?: ObjectId[];    // Related product IDs
  
  // Analytics (Phase 5)
  analytics?: {
    viewCount?: number;
    salesCount?: number;
    revenue?: number;
    lastViewed?: Date;
    lastSold?: Date;
  };
  
  // Reviews
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    author: string;
    createdAt: Date;
    helpful?: number;
  }>;
  
  // Flags
  isHot?: boolean;                  // Featured product flag
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date;             // For scheduled publishing
}
```

### 2.2 Variant Structure

```typescript
interface MongoVariant {
  id: string;                       // Unique variant ID
  size: string;                     // Size (e.g., "S", "M", "L")
  color?: string;                    // Color name
  colorCode?: string;                // Hex color code
  price: number;                     // Variant-specific price
  stock: number;                     // Variant stock quantity
  image?: string;                    // Variant-specific image
  sku?: string;                      // Variant SKU
}
```

### 2.3 Indexes

```typescript
// MongoDB indexes for performance
{
  slug: 1,                          // Unique index
  status: 1,                        // Filter by status
  deletedAt: 1,                    // Soft delete filter
  categories: 1,                   // Category queries
  tags: 1,                          // Tag queries
  'variants.size': 1,               // Size filter
  'variants.color': 1,              // Color filter
  createdAt: -1,                     // Sort by date
  regularPrice: 1,                  // Price range queries
}
```

### 2.4 Related Collections
- `categories` - Product categories
- `media` - Media library (images, videos)
- `orders` - Order items reference products
- `orderItems` - Order line items with product references

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
  action: 'delete' | 'publish' | 'draft' | 'trash';
  productIds: string[];
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
**Purpose:** Quick update (status, stock, price)  
**Authentication:** Required (Admin)  
**Permissions:** `product:update`

**Request Body:**
```typescript
{
  status?: 'draft' | 'publish' | 'trash';
  stockQuantity?: number;
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder';
  regularPrice?: number;
  salePrice?: number;
}
```

**Response:**
```typescript
{
  product: MappedProduct;
  message: string;
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

## 4. FRONTEND COMPONENTS

### 4.1 Admin Components (`components/admin/products/`)

#### ProductForm.tsx
**Purpose:** Main product creation/editing form  
**Location:** `components/admin/products/ProductForm.tsx`

**Key Features:**
- Multi-section form (Basic Info, Pricing, Images, Variants, SEO, etc.)
- Optimistic locking (version field)
- Slug auto-generation (on create only)
- Price validation (salePrice < regularPrice)
- Image upload via Media Library
- Variant management
- Form state management with `useForm` (react-hook-form)

**Important Props:**
```typescript
interface ProductFormProps {
  productId?: string;
  initialData?: MappedProduct;
  onSuccess?: (product: MappedProduct) => void;
}
```

#### ProductList.tsx
**Purpose:** Admin product listing page  
**Location:** `components/admin/products/ProductList.tsx`

**Key Features:**
- Data grid with sorting, filtering, pagination
- Bulk actions (delete, status change)
- Search functionality
- Trash management
- Inline editing (status, stock)

#### ProductDetailsSection.tsx
**Purpose:** Product details form section  
**Location:** `components/admin/products/ProductDetailsSection.tsx`

**Fields:**
- Age recommendation
- Care instructions
- Safety information
- Product specifications
- Size guide
- Material details
- Warranty information

#### VariantFormEnhanced.tsx
**Purpose:** Enhanced variant management  
**Location:** `components/admin/products/VariantFormEnhanced.tsx`

**Features:**
- Add/remove variants
- Size and color selection
- Price and stock per variant
- Variant-specific images
- SKU generation

#### SEOMetaBox.tsx
**Purpose:** SEO optimization section  
**Location:** `components/admin/products/SEOMetaBox.tsx`

**Features:**
- SEO title with length indicator
- Meta description with character counter
- Focus keyword
- Slug editing
- Google snippet preview
- Social sharing preview (OG tags)

### 4.2 Public Components (`components/product/`)

#### ProductCard.tsx
**Purpose:** Product card for listings  
**Location:** `components/product/ProductCard.tsx`

**Features:**
- Product image with fallback
- Product name and price
- Size/color options (up to 4 each)
- Add to cart button
- Gift button
- Badge support (new, hot, sale)
- Mobile-optimized

#### ProductInfo.tsx
**Purpose:** Product detail page main component  
**Location:** `components/product/ProductInfo.tsx`

**Features:**
- Product name and price
- Variation selector (size, color)
- Quantity selector
- Add to cart
- Product description
- Product highlights
- Trust badges

#### ProductGallery.tsx
**Purpose:** Product image gallery  
**Location:** `components/product/ProductGallery.tsx`

**Features:**
- Main image display
- Thumbnail navigation
- Zoom functionality
- Image lazy loading
- Next.js Image optimization

#### ProductFilters.tsx
**Purpose:** Product filtering component  
**Location:** `components/product/ProductFilters.tsx`

**Features:**
- Price range filter
- Size filter
- Color filter
- Category filter
- Sort options
- Mobile and desktop layouts
- URL sync

#### ProductList.tsx
**Purpose:** Product listing page  
**Location:** `components/product/ProductList.tsx`

**Features:**
- Grid/List view toggle
- Pagination
- Loading states
- Empty states
- Error handling

---

## 5. HOOKS & UTILITIES

### 5.1 Data Fetching Hooks

#### useProductsREST
**Location:** `lib/hooks/useProductsREST.ts`

**Purpose:** Fetch products list with filters

**Usage:**
```typescript
const { products, loading, error, currentPage, totalPages, totalProducts } = useProductsREST(12); // perPage = 12
// Filters are managed via useProductFilters hook
```

**Return Values:**
- `products` - Array of `MappedProduct[]`
- `loading` - Boolean loading state
- `error` - Error object or null
- `currentPage` - Current page number
- `totalPages` - Total number of pages
- `totalProducts` - Total number of products

#### useProductREST
**Location:** `lib/hooks/useProductREST.ts`

**Purpose:** Fetch single product by ID or slug

**Usage:**
```typescript
const { data: product, isLoading } = useProductREST('product-id');
```

#### useProductVariations
**Location:** `lib/hooks/useProductVariations.ts`

**Purpose:** Fetch product variations (lazy loading)

**Usage:**
```typescript
const { variations, isLoading, error, refetch } = useProductVariations(productId, {
  enabled: true  // Optional: only fetch when enabled is true
});
```

**Return Values:**
- `variations` - Array of `MongoVariant[]`
- `isLoading` - Boolean loading state
- `error` - Error object or null
- `refetch` - Function to manually refetch

### 5.2 Filter Hooks

#### useProductFilters
**Location:** `lib/hooks/useProductFilters.ts`

**Purpose:** Manage product filter state and URL sync

**Usage:**
```typescript
const {
  filters,
  updateFilter,
  clearFilters,
  applyFilters,
} = useProductFilters();
```

#### useProductAttributes
**Location:** `lib/hooks/useProductAttributes.ts`

**Purpose:** Fetch available product attributes (sizes, colors)

**Usage:**
```typescript
const { sizes, colors, isLoading } = useProductAttributes();
```

### 5.3 Utility Hooks

#### useProductPrice
**Location:** `lib/hooks/useProductPrice.ts`

**Purpose:** Calculate product price with variations

**Usage:**
```typescript
const { displayPrice, isOnSale, discountPercentage, priceRange } = useProductPrice(
  product,
  selectedVariation
);
```

**Return Values:**
- `displayPrice` - String price for display
- `isOnSale` - Boolean indicating if product is on sale
- `discountPercentage` - Number (0-100) discount percentage
- `regularPrice` - String regular price
- `salePrice` - String sale price (if on sale)
- `priceRange` - Object with `min` and `max` for variable products

#### useVariationMatcher
**Location:** `lib/hooks/useVariationMatcher.ts`

**Purpose:** Match product variations by size/color

**Usage:**
```typescript
const matchedVariation = useVariationMatcher(
  product,
  selectedSize,
  selectedColor
);
```

### 5.4 Utility Functions

#### productMapper.ts
**Location:** `lib/utils/productMapper.ts`

**Functions:**
- `mapMongoProduct()` - Map MongoDB product to frontend format
- `mapMongoCategory()` - Map MongoDB category to frontend format

**Important:** Always use mapper functions, never access MongoDB fields directly.

#### skuGenerator.ts
**Location:** `lib/utils/skuGenerator.ts`

**Functions:**
- `generateSKU()` - Generate unique SKU
- `validateSKU()` - Validate SKU format

#### sanitizeHtml.ts
**Location:** `lib/utils/sanitizeHtml.ts`

**Functions:**
- `sanitizeHtml()` - Sanitize HTML content (XSS protection)
- `stripHtmlTags()` - Remove HTML tags for display

---

## 6. DATA FLOW

### 6.1 Product Creation Flow

```
User Input (ProductForm)
  ↓
Form Validation (Zod schema)
  ↓
API Request (POST /api/admin/products)
  ↓
Backend Validation
  ↓
MongoDB Insert
  ↓
Response (MappedProduct)
  ↓
Frontend Update (React Query cache)
  ↓
UI Update
```

### 6.2 Product Update Flow

```
User Input (ProductForm)
  ↓
Form Validation
  ↓
API Request (PUT /api/admin/products/[id])
  ↓
Version Check (Optimistic Locking)
  ↓
MongoDB Update
  ↓
Response (Updated Product)
  ↓
Cache Invalidation
  ↓
UI Update
```

### 6.3 Product Display Flow (Public)

```
Page Load
  ↓
React Query Fetch (useProductREST)
  ↓
API Request (GET /api/cms/products/[slug])
  ↓
MongoDB Query (status: 'publish', deletedAt: null)
  ↓
Data Mapping (mapMongoProduct)
  ↓
Response (MappedProduct)
  ↓
React Query Cache
  ↓
Component Render
```

---

## 7. BUSINESS LOGIC

### 7.1 Pricing Logic

**Price Calculation:**
```typescript
// If variation is selected, use variation price
if (selectedVariation) {
  return String(selectedVariation.price || 0);
}

// For variable products without selected variation, use minPrice
if (product.type === 'variable') {
  return String(product.minPrice || 0);
}

// For simple products, use product price (salePrice if onSale, else regularPrice)
return product.onSale ? product.salePrice : product.price;
```

**Price Display:**
- If `onSale` and `salePrice` exists: Show both `regularPrice` (strikethrough) and `salePrice`
- Otherwise: Show `regularPrice` only
- If price is missing: Show "Liên hệ"

### 7.2 Stock Management

**Stock Status:**
- `instock` - Available for purchase
- `outofstock` - Not available
- `onbackorder` - Available for pre-order

**Stock Check:**
```typescript
const isAvailable = product.stockStatus === 'instock' &&
  (!product.manageStock || (product.stockQuantity ?? 0) > 0);
```

**Variant Stock:**
- Check variant stock if variation is selected
- Fallback to product stock if no variation

### 7.3 Slug Generation

**Rules:**
- Auto-generate from product name (on create only)
- Preserve existing slug (on update)
- Convert to URL-friendly format (lowercase, hyphens)
- Check uniqueness (add random suffix if duplicate)

**Implementation:**
```typescript
// Only generate on create
if (!productId) {
  const baseSlug = slugify(productName);
  const uniqueSlug = await ensureUniqueSlug(baseSlug);
  // ...
}
```

### 7.4 Optimistic Locking

**Purpose:** Prevent concurrent edit conflicts

**Implementation:**
- Each product has `version` field
- Client sends `version` in PUT request
- Server checks `version` matches current version
- If mismatch: Return 409 Conflict error
- If match: Increment version and update

**Client Handling:**
```typescript
try {
  await updateProduct({ ...data, version: currentVersion });
} catch (error) {
  if (error.status === 409) {
    // Version mismatch - reload product
    await refetch();
    showToast('Product was updated by another user. Please refresh.');
  }
}
```

### 7.5 Soft Delete

**Implementation:**
- Set `deletedAt: new Date()` instead of hard delete
- Set `status: 'trash'`
- Public API filters out `deletedAt: null`
- Trash can be restored or permanently deleted

---

## 8. RELATED MODULES

### 8.1 Category Module
**Relationship:** Products belong to categories (many-to-many)

**Integration:**
- Product form: Category selector
- Product listing: Filter by category
- Category page: Display products in category

**API:**
- `/api/admin/categories` - Category management
- `/api/cms/categories` - Public category API

### 8.2 Media Library Module
**Relationship:** Products use media files (images, videos)

**Integration:**
- Product form: Media Library modal for image selection
- Product images: Stored in `media` collection
- Image optimization: Automatic thumbnail generation

**API:**
- `/api/admin/media` - Media management
- Media Library component: `MediaLibraryModal`

### 8.3 Order Management Module
**Relationship:** Orders contain product references

**Integration:**
- Order items: Reference product ID
- Product stock: Deducted on order confirmation
- Product variants: Stored in order items

**API:**
- `/api/admin/orders` - Order management

### 8.4 Inventory Module
**Relationship:** Products track inventory

**Integration:**
- Stock quantity: Managed per product/variant
- Stock status: `in_stock`, `out_of_stock`, `on_backorder`
- Stock reservation: On order creation
- Stock deduction: On order confirmation

---

## 9. COMMON PATTERNS

### 9.1 Error Handling

**Backend:**
```typescript
try {
  // Operation
} catch (error: unknown) {
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { error: 'Unknown error' },
    { status: 500 }
  );
}
```

**Frontend:**
```typescript
const { data, error, isLoading } = useProductREST(id);

if (error) {
  return <ErrorDisplay error={error} />;
}

if (isLoading) {
  return <LoadingSpinner />;
}
```

### 9.2 Null/Undefined Handling

**Always check before use:**
```typescript
// Bad
const price = product.regularPrice;

// Good
const price = product.regularPrice ?? 0;
const image = product.featuredImage || '/images/placeholder.png';
```

**Safe Array Mapping:**
```typescript
// Bad
products.map(p => p.name);

// Good
products
  .filter((p): p is NonNullable<typeof p> => Boolean(p))
  .map(p => p.name);
```

### 9.3 Image Handling

**Always use Next.js Image:**
```typescript
import Image from 'next/image';

<Image
  src={product.featuredImage || '/images/placeholder.png'}
  alt={product.name}
  width={500}
  height={500}
  className="object-cover"
/>
```

**Exception:** Only use `<img>` when `ref` is required (e.g., Cropper.js)

### 9.4 Form State Management

**Use react-hook-form:**
```typescript
const form = useForm<ProductFormData>({
  defaultValues: initialData,
  resolver: zodResolver(productSchema),
});

const onSubmit = async (data: ProductFormData) => {
  try {
    await updateProduct({ ...data, version: currentVersion });
    showToast('Product updated successfully');
  } catch (error) {
    showToast('Failed to update product', 'error');
  }
};
```

---

## 10. TROUBLESHOOTING

### 10.1 Common Issues

#### Issue: Version Mismatch Error (409)
**Cause:** Product was updated by another user  
**Solution:** Reload product and retry

#### Issue: Slug Already Exists
**Cause:** Duplicate slug generation  
**Solution:** Auto-add random suffix or manual slug edit

#### Issue: Price Validation Error
**Cause:** `salePrice >= regularPrice`  
**Solution:** Ensure `salePrice < regularPrice`

#### Issue: Image Not Loading
**Cause:** Missing image URL or invalid path  
**Solution:** Check image URL, use placeholder fallback

#### Issue: Variant Not Matching
**Cause:** Incorrect size/color matching logic  
**Solution:** Use `useVariationMatcher` hook, check variant structure

### 10.2 Debug Tips

**Enable React Query DevTools:**
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

**Check MongoDB Documents:**
```typescript
// In API route
const product = await collections.products.findOne({ _id: id });
console.log('MongoDB Product:', JSON.stringify(product, null, 2));
```

**Check Mapped Product:**
```typescript
const mapped = mapMongoProduct(mongoProduct);
console.log('Mapped Product:', mapped);
```

---

## 📚 RELATED DOCUMENTATION

- [Product Module Context](./PRODUCT_MODULE_CONTEXT.md) - Detailed context
- [Product Module Complete](./PRODUCT_MODULE_COMPLETE.md) - Review and improvements
- [Schema Context](./SCHEMA_CONTEXT.md) - Complete database schema
- [Product Features Sync Analysis](./reports/PRODUCT_FEATURES_SYNC_ANALYSIS.md) - Feature comparison
- [Product Module Fix Plan](./implementation/PRODUCT_MODULE_FIX_PLAN.md) - Fixes and improvements

---

## 🔄 UPDATE LOG

- **2025-01-XX:** Initial comprehensive reference document created
- **2025-01-XX:** Added complete API endpoints (20+ endpoints)
- **2025-01-XX:** Expanded database schema with all fields
- **2025-01-XX:** Added Validation Rules section
- **2025-01-XX:** Codebase verification and corrections:
  - Fixed query parameter naming (`limit` → `per_page`)
  - Fixed endpoint methods (`POST` → `GET` for validate-slug)
  - Fixed endpoint paths (`bulk` → `bulk-action`)
  - Updated hook signatures and return values
  - Fixed stock status values (`in_stock` → `instock`)
  - Fixed giftFeatures field name (`giftWrappingEnabled` → `giftWrapping`)
  - Updated price calculation logic
- **Future:** Update as module evolves

---

**Note:** This document should be updated whenever significant changes are made to the Product Module.

