# 📦 PRODUCT MODULE - COMPREHENSIVE REFERENCE

**Last Updated:** 2025-01-XX  
**Status:** 📚 Long-term Reference Document  
**Purpose:** Complete technical reference for Product Module and related modules

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Backend API](./product-module/API.md) - **See separate file**
4. [Frontend Components](./product-module/COMPONENTS.md) - **See separate file**
5. [Hooks & Utilities](./product-module/HOOKS.md) - **See separate file**
6. [Data Flow](#data-flow)
7. [Business Logic](./product-module/BUSINESS_LOGIC.md) - **See separate file**
8. [Related Modules](#related-modules)
9. [Common Patterns](#common-patterns)
10. [Troubleshooting](#troubleshooting)

**Note:** This document has been split into multiple files for better maintainability. Large sections (API, Components, Hooks, Business Logic) are now in separate files under `docs/product-module/`.

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
- ✅ Quick Edit (rapid updates without full form)

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

**📄 This section has been moved to:** [product-module/API.md](./product-module/API.md)

For complete API documentation including all endpoints, request/response formats, validation rules, and examples, please refer to the dedicated API reference document.

**Quick Links:**
- [Admin API Routes](./product-module/API.md#31-admin-api-routes-apiadminproducts)
- [Quick Update Endpoint](./product-module/API.md#patch-apiadminproductsidquick-update)
- [Public API Routes](./product-module/API.md#33-public-api-routes-apicmsproducts)
- [Validation Rules](./product-module/API.md#35-validation-rules)

---

## 4. FRONTEND COMPONENTS

**ðŸ“„ This section has been moved to:** [product-module/COMPONENTS.md](./product-module/COMPONENTS.md)

For complete frontend components documentation, please refer to the dedicated Components reference document.

---

## 5. HOOKS & UTILITIES

**📄 This section has been moved to:** [product-module/HOOKS.md](./product-module/HOOKS.md)

For complete hooks and utilities documentation including usage examples, return values, and interfaces, please refer to the dedicated Hooks reference document.

**Quick Links:**
- [Data Fetching Hooks](./product-module/HOOKS.md#51-data-fetching-hooks)
- [useQuickUpdateProduct](./product-module/HOOKS.md#usequickupdateproduct)
- [Utility Functions](./product-module/HOOKS.md#54-utility-functions)

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

**ðŸ“„ This section has been moved to:** [product-module/BUSINESS_LOGIC.md](./product-module/BUSINESS_LOGIC.md)

For complete business logic documentation, please refer to the dedicated Business Logic reference document.

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
- **2025-12-17:** Added Quick Edit feature documentation:
  - Expanded PATCH `/api/admin/products/[id]/quick-update` endpoint documentation
  - Added `ProductQuickEditDialog` component documentation
  - Added `VariantQuickEditTable` component documentation
  - Added `useQuickUpdateProduct` hook documentation
  - Added Quick Edit business logic section (7.6)
  - Documented auto-sync stock status, sale price management, variant updates
  - Documented optimistic locking and audit logging for Quick Edit
- **Future:** Update as module evolves

---

**Note:** This document should be updated whenever significant changes are made to the Product Module.

