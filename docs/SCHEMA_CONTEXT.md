# 📊 Schema Context - Custom CMS (MongoDB)

**Last Updated:** 2025-01-XX  
**Database:** MongoDB  
**API Method:** Next.js API Routes  
**Base URL:** `/api/cms/` (public) và `/api/admin/` (admin)

**Recent Updates (2025-01):**
- Improved API route error handling: All routes now return JSON (not HTML error pages)
- Fixed Vercel deployment issues: Lazy loading for `isomorphic-dompurify` to avoid ES Module errors
- Enhanced MongoDB connection error handling in API routes

---

## 🔄 Migration Note

**⚠️ IMPORTANT:** Project đã migrated từ **WordPress/WooCommerce** sang **Custom CMS với MongoDB**.

**Previous:** WordPress + WooCommerce REST API  
**Current:** Custom CMS với MongoDB + Next.js API Routes  
**Status:** ✅ Migration completed. All WordPress/WooCommerce references removed from active code.

**Note:** Migration scripts và documentation cũ vẫn có thể reference WordPress/WooCommerce cho historical purposes.

---

## 📦 MongoDB Product Structure

### Core Product Document

```typescript
interface MongoProduct {
  _id: ObjectId;                    // MongoDB ObjectId
  name: string;                     // Product name
  slug: string;                     // URL slug (unique, auto-generated from name)
  type: 'simple' | 'variable';      // Product type
  status: 'draft' | 'publish' | 'trash'; // Product status
  featured: boolean;                 // Featured product flag
  isActive: boolean;                // Product active flag
  visibility?: 'public' | 'private' | 'password'; // Visibility setting
  password?: string;                // Password if visibility === 'password'
  
  // Soft Delete (Phase 1)
  deletedAt?: Date | null;          // Soft delete timestamp (null = not deleted)
  // When deleted: deletedAt = new Date(), status = 'trash'
  
  // Optimistic Locking (Phase 4)
  version?: number;                  // Version field for optimistic locking (starts at 1)
  price: number;                     // Current price (sale or regular)
  regularPrice?: number;            // Regular price
  salePrice?: number;               // Sale price (if on sale)
  onSale: boolean;                 // Is on sale?
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  stockQuantity?: number;           // Stock quantity
  sku?: string;                     // SKU
  description?: string;             // Full description
  shortDescription?: string;        // Short description
  // Images (Phase 3)
  images?: string[];                 // Legacy: Array of image URLs (for backward compatibility)
  _thumbnail_id?: string;           // Attachment ID for featured image (new structure)
  _product_image_gallery?: string;  // Comma-separated attachment IDs for gallery (new structure)
  
  category?: string;                 // Legacy: Single category ID (ObjectId as string)
  categoryId?: string;               // Single primary category ID
  categories?: string[];             // Multiple category IDs (new structure)
  tags?: string[];                  // Product tags
  variants?: MongoVariant[];         // Product variations
  // Dimensions
  length?: number;                  // Length in cm
  width?: number;                   // Width in cm
  height?: number;                  // Height in cm
  weight?: number;                  // Weight in kg
  volumetricWeight?: number;         // Calculated: (L * W * H) / 6000
  material?: string;                // Material
  origin?: string;                  // Origin
  // Advanced fields (from CMS sync)
  productDetails?: {
    ageRecommendation?: string;
    careInstructions?: string;
    safetyInformation?: string;
    productSpecifications?: string;
    sizeGuide?: string;
    materialDetails?: string;
    warrantyInformation?: string;
  };
  seo?: {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
    robotsMeta?: string;
  };
  giftFeatures?: {
    giftWrapping: boolean;
    giftWrappingPrice?: number;
    giftMessageEnabled: boolean;
    giftMessageMaxLength?: number;
    giftCardEnabled: boolean;
    giftCardTypes?: string[];
    giftDeliveryDateEnabled: boolean;
    giftCategories?: string[];
    giftSuggestions?: string[];
  };
  mediaExtended?: {
    videos?: Array<{
      url: string;
      type: 'youtube' | 'vimeo' | 'upload';
      thumbnail?: string;
    }>;
    view360Images?: string[];
    imageAltTexts?: Record<string, string>; // imageId -> altText (Phase 3: SEO Alt Text)
  };
  
  // Product Data Meta Box (Phase 1-4)
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
    salePrice?: number;              // Must be < regularPrice (Phase 1: Validation)
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
      salePrice?: number;            // Must be < regularPrice (Phase 1: Validation)
      stockQuantity?: number;
      sku?: string;
      image?: string;
    }>;
  };
  collectionCombo?: {
    collections?: string[];
    comboProducts?: string[];
    bundleProducts?: Array<{
      productId: string;
      quantity: number;
      discount?: number;
    }>;
    relatedProducts?: string[];
    upsellProducts?: string[];
    crossSellProducts?: string[];
  };
  // SEO (Phase 1)
  seo?: {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
    robotsMeta?: string;
  };
  _productSchema?: object;          // JSON-LD schema for SEO
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  scheduledDate?: Date;             // For scheduled publishing
  minPrice?: number;                 // Calculated from variants
  maxPrice?: number;                 // Calculated from variants
}
```

### Product Variants

**⚠️ IMPORTANT:** MongoDB variant structure uses direct `size` and `color` fields, NOT an `attributes` object.

```typescript
interface MongoVariant {
  id: string;                       // Variant ID (string, not ObjectId)
  size: string;                     // Size value (e.g., "25cm", "30cm", "L", "M")
  color?: string;                   // Color value (optional, e.g., "Hồng", "Xanh")
  colorCode?: string;               // Hex color code (optional, e.g., "#FF9EB5")
  price: number;                    // Variant price (required)
  stock: number;                    // Stock quantity (required)
  image?: string;                   // Variant-specific image URL (optional)
  sku?: string;                     // Variant SKU (optional)
}
```

**Usage in Components:**
```typescript
// ✅ CORRECT: Match variation by size/color directly
const matchedVariation = variations.find((variation) => {
  if (variation.size && variation.size === selectedSize) {
    if (selectedColor) {
      return !variation.color || variation.color === selectedColor;
    }
    return true;
  }
  return false;
});

// ❌ WRONG: Don't use variation.attributes.find() - this doesn't exist
const sizeAttr = variation.attributes.find(...); // ERROR: attributes is undefined
```

**Note:** 
- MongoDB variants are stored in `product.variants` array
- API endpoint: `GET /api/cms/products/[id]/variations`
- Hook: `useProductVariations(productId)` returns `MongoVariant[]`
- No `on_sale`, `sale_price`, `regular_price` fields - only `price`

### Product Images

**Structure:**
- `images: string[]` - Array of image URLs
- First image (`images[0]`) = Main product image
- Remaining images = Gallery images
- Variant-specific images stored in `variants[].image`

**Usage:**
```typescript
const mainImage = product.images[0] || '/images/teddy-placeholder.png';
const galleryImages = product.images.slice(1);
```

### Product Categories

```typescript
interface MongoCategory {
  _id: ObjectId;                    // Category ID
  name: string;                     // Category name
  slug: string;                     // URL slug (unique)
  description?: string;             // Category description
  parentId?: string;               // Parent category ID (for hierarchical)
  image?: string;                   // Category image URL
  position?: number;                // Display order
  createdAt: Date;
  updatedAt: Date;
}
```

### Product Tags

**Structure:**
- `tags?: string[]` - Array of tag strings (simple strings, not objects)

**Usage:**
```typescript
const productTags = product.tags || [];
```

---

## 🗄️ Database Collections

### Collections Structure

```typescript
// Access via lib/db.ts
const collections = await getCollections();

// Available collections:
collections.products      // Product documents
collections.categories    // Category documents
collections.orders        // Order documents
collections.orderItems    // Order line items (snapshot data)
collections.orderHistories // Order history/audit log
collections.shipments     // Shipment tracking documents
collections.refunds       // Refund records
collections.users         // User documents (admin)
collections.banners       // Banner documents
collections.posts         // Blog post documents
collections.authors       // Author documents
collections.comments      // Comment documents
collections.postCategories // Blog category documents
collections.postTags       // Blog tag documents
collections.productTemplates // Product template documents
collections.productReviews  // Product review documents
collections.productAnalytics // Product analytics documents
collections.productAttributes // Global product attributes
collections.productAttributeTerms // Attribute terms/values
collections.media // Media Library documents
```

---

## 📦 Order Management System

**Status:** ✅ Complete

See `docs/SCHEMA_CONTEXT_ORDERS.md` for complete Order Management System schema including:
- Orders collection structure
- Order Items (snapshot data)
- Order Histories (audit log)
- Shipments collection
- Refunds collection
- Order State Machine
- Inventory Management

---

## 🔄 Data Mapping

### Frontend Product Format

Products from MongoDB are mapped to frontend format using `mapMongoProduct()`:

```typescript
// lib/utils/productMapper.ts
import { mapMongoProduct } from '@/lib/utils/productMapper';

// In API route
const product = await collections.products.findOne({ slug });
const mappedProduct = mapMongoProduct(product);
```

**Mapped Product Structure:**
```typescript
interface MappedProduct {
  id: string;                      // _id.toString()
  databaseId: string;              // _id.toString() (for compatibility)
  name: string;
  slug: string;
  price: number;
  regularPrice?: number;
  salePrice?: number;
  onSale: boolean;
  stockStatus: string;
  images: string[];
  categories: Array<{
    id: string;
    databaseId: string;
    name: string;
    slug: string;
  }>;
  // ... other fields
}
```

---

## 📡 API Routes

### Public API Routes (`/api/cms/*`)

**Products:**
- `GET /api/cms/products` - List products (with filters, pagination)
- `GET /api/cms/products/[id]` - Get single product
- `GET /api/cms/products/[id]/variations` - Get product variations
- `GET /api/cms/products/[id]/reviews` - Get product reviews
- `POST /api/cms/products/[id]/reviews` - Submit product review

**Categories:**
- `GET /api/cms/categories` - List categories

**Orders:**
- `POST /api/cms/orders` - Create order

**Banners:**
- `GET /api/cms/banners` - Get active banners

**Blog:**
- `GET /api/cms/posts` - List blog posts
- `GET /api/cms/posts/[slug]` - Get single blog post

### Admin API Routes (`/api/admin/*`)

**Products:**
- `GET /api/admin/products` - List products (admin)
- `POST /api/admin/products` - Create product
- `GET /api/admin/products/[id]` - Get single product
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product
- `POST /api/admin/products/[id]/duplicate` - Duplicate product
- `GET /api/admin/products/[id]/reviews` - Get product reviews
- `POST /api/admin/products/[id]/reviews` - Create review
- `GET /api/admin/products/[id]/analytics` - Get product analytics

**Categories:**
- `GET /api/admin/categories` - List categories
- `POST /api/admin/categories` - Create category
- `GET /api/admin/categories/[id]` - Get single category
- `PUT /api/admin/categories/[id]` - Update category
- `DELETE /api/admin/categories/[id]` - Delete category

**Orders:**
- `GET /api/admin/orders` - List orders
- `GET /api/admin/orders/[id]` - Get single order
- `PUT /api/admin/orders/[id]` - Update order

**Blog:**
- `GET /api/admin/posts` - List posts
- `POST /api/admin/posts` - Create post
- `GET /api/admin/posts/[id]` - Get single post
- `PUT /api/admin/posts/[id]` - Update post
- `DELETE /api/admin/posts/[id]` - Delete post

**Authentication:**
- All admin routes require authentication via NextAuth.js
- Use `requireAdmin()` helper from `lib/auth.ts`

---

## 🔐 Database Connection

### Connection Setup

```typescript
// lib/db.ts
import { connectDB, getCollections } from '@/lib/db';

// Connect to MongoDB
const client = await connectDB();

// Get collections
const collections = await getCollections();
const product = await collections.products.findOne({ slug: 'product-slug' });
```

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/shop-gau-bong
# or
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shop-gau-bong
MONGODB_DB_NAME=shop-gau-bong
```

---

## 📊 Indexes

### Product Indexes

```typescript
// Created via scripts/setup-database-indexes.ts
products.createIndex({ slug: 1 }, { unique: true });
products.createIndex({ status: 1 });
products.createIndex({ category: 1 });
products.createIndex({ featured: 1 });
products.createIndex({ createdAt: -1 });
products.createIndex({ 'variants.stockStatus': 1 });
```

### Category Indexes

```typescript
categories.createIndex({ slug: 1 }, { unique: true });
categories.createIndex({ parentId: 1 });
categories.createIndex({ position: 1 });
```

### Order Indexes

```typescript
orders.createIndex({ orderNumber: 1 }, { unique: true });
orders.createIndex({ customerEmail: 1 });
orders.createIndex({ status: 1 });
orders.createIndex({ createdAt: -1 });
```

---

## 🛠️ Helper Functions

### Product Mapper

```typescript
// lib/utils/productMapper.ts
import { mapMongoProduct, mapMongoProducts } from '@/lib/utils/productMapper';

// Map single product
const mappedProduct = mapMongoProduct(mongoProduct);

// Map array of products
const mappedProducts = mapMongoProducts(mongoProducts);
```

### Database Access

```typescript
// lib/db.ts
import { getCollections, ObjectId } from '@/lib/db';

// Get collections
const collections = await getCollections();

// Query with ObjectId
const product = await collections.products.findOne({ 
  _id: new ObjectId(productId) 
});
```

---

## 📚 Related Files

- `lib/db.ts` - MongoDB connection and collection access
- `lib/utils/productMapper.ts` - Product mapping utilities
- `types/woocommerce.ts` - Frontend type definitions (kept for compatibility)
- `app/api/cms/**/route.ts` - Public API routes
- `app/api/admin/**/route.ts` - Admin API routes
- `scripts/setup-database-indexes.ts` - Database index setup

---

## 🔗 External Documentation

- [MongoDB Node.js Driver Documentation](https://www.mongodb.com/docs/drivers/node/current/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextAuth.js Documentation](https://next-auth.js.org/)

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Updated for Custom CMS (MongoDB)

---

## 📸 Media Library Collection

**Status:** ✅ Complete

### Media Document Structure

```typescript
interface MongoMedia {
  _id: ObjectId;
  
  // Thông tin file cơ bản
  name: string;             // Tên hiển thị (editable)
  filename: string;         // Tên file gốc trên đĩa/cloud
  url: string;              // Đường dẫn truy cập công khai (Public URL)
  path: string;             // Đường dẫn vật lý hoặc S3 Key (để xóa file)
  
  // Phân loại
  type: 'image' | 'video' | 'document' | 'other';
  mimeType: string;         // e.g., 'image/jpeg', 'video/mp4'
  extension: string;        // e.g., 'jpg', 'png'
  folder?: string;          // Optional: phân cấp thư mục
  
  // Metadata kỹ thuật
  size: number;             // Kích thước file (bytes)
  width?: number;           // Chỉ dành cho ảnh/video
  height?: number;          // Chỉ dành cho ảnh/video
  
  // Metadata SEO & Quản lý
  altText?: string;         // Thẻ alt cho SEO
  caption?: string;         // Chú thích ảnh
  description?: string;     // Mô tả chi tiết
  
  // System
  uploadedBy?: ObjectId;    // User ID người upload
  createdAt: Date;
  updatedAt: Date;
}
```

### Media Indexes

```typescript
// Text search index
media.createIndex({ name: 'text', altText: 'text' });

// Filter indexes
media.createIndex({ type: 1 });
media.createIndex({ folder: 1 });
media.createIndex({ uploadedBy: 1 });

// Sort index
media.createIndex({ createdAt: -1 });
```

### API Routes

**Admin Routes:**
- `GET /api/admin/media` - List media (with filters, pagination)
- `POST /api/admin/media` - Upload media
- `GET /api/admin/media/[id]` - Get media detail
- `PUT /api/admin/media/[id]` - Update media metadata
- `DELETE /api/admin/media/[id]` - Delete media
- `GET /api/admin/media/search` - Advanced search

**See:** `docs/MEDIA_LIBRARY_API_DOCUMENTATION.md` for complete API documentation.

---

## 🔄 Recent Changes (2025-01-XX)

### Media Library Module Added ✅ Complete
- **Added:** Media Library collection and API endpoints
- **Features:** Upload, manage, search, delete media files
- **Integration:** ProductForm, CategoryForm, Editor via MediaLibraryModal
- **Storage:** Vercel Blob Storage with Adapter pattern (Local/Vercel Blob, easy switching to AWS S3)
- **Image Processing:** Sharp (resize, optimize, thumbnail, metadata extraction)
- **Auto-renaming:** Unique filename generation (timestamp + UUID) to prevent duplicates
- **React Query Hooks:** `useMediaList`, `useMedia`, `useUpdateMedia`, `useDeleteMedia` for efficient data fetching
- **Fixes Applied:**
  - Removed `folder` field from update mechanism to prevent broken links
  - Auto-renaming pattern to prevent duplicate uploads
  - MediaLibraryModal sync with main Media Library module
- **See:** `docs/MEDIA_LIBRARY_COMPLETE.md` for complete documentation

## 🔄 Recent Changes (2025-01-13)

### Product Module Refactoring (Phase 1-4) ✅ Complete
- **Soft Delete:** Products use `deletedAt` and `status: 'trash'` instead of hard delete
- **Optimistic Locking:** Added `version` field to prevent concurrent edit conflicts
- **Price Validation:** Zod schema validates `salePrice < regularPrice` (including variations)
- **Slug Management:** Auto-generate only on create, preserve on edit, duplicate check with random suffix
- **XSS Protection:** All HTML content sanitized with `isomorphic-dompurify`
- **Form Optimization:** Input fields use onBlur with local state to reduce rerenders
- **Price Formatting:** `PriceInput` component formats numbers with thousand separators
- **Image Alt Text:** SEO alt text inputs in FeaturedImageBox and ProductGalleryBox
- **Rich Text Editor:** Image paste uploads to server instead of Base64
- **Error Handling:** Toast notifications with specific error messages
- **See:** `docs/PRODUCT_MODULE_FIX_PLAN.md` and `docs/PRODUCT_MODULE_CONTEXT.md` for details

### Product Variations Structure Update (2025-12-13)
- **Changed:** MongoDB variants now use direct `size` and `color` fields instead of nested `attributes` object
- **Impact:** All variation matching logic updated to use `variation.size` and `variation.color` directly
- **Removed:** "Mua ngay" (Quick checkout) button from ProductInfo component - only "Thêm giỏ hàng" and "GỬI TẶNG" remain
- **Fixed:** Runtime error `Cannot read properties of undefined (reading 'find')` in ProductInfo by updating variation matching logic

## 🔐 Admin Account Management (RBAC) - Collections

### Admin Users Collection (`admin_users`)

**Purpose:** Store admin user accounts with role-based access control (RBAC)

```typescript
interface AdminUser {
  _id: ObjectId;
  username: string;                    // Unique username for login
  email: string;                       // Email address
  password_hash: string;                // Bcrypt hashed password
  full_name: string;                   // Display name
  role: AdminRole;                     // Role enum: SUPER_ADMIN, PRODUCT_MANAGER, ORDER_MANAGER, CONTENT_EDITOR, VIEWER
  permissions?: Permission[];          // Optional custom permissions (override role defaults)
  is_active: boolean;                  // Account active status
  must_change_password: boolean;       // Force password change on next login
  token_version: number;               // Token revocation version (increment to force logout all devices)
  version?: number;                     // Optimistic locking version
  last_login?: Date;                   // Last login timestamp
  created_by?: ObjectId;               // Reference to AdminUser._id (who created this account)
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `{ username: 1 }` - Unique index
- `{ email: 1 }` - Unique index
- `{ role: 1 }` - For role-based queries
- `{ is_active: 1 }` - For filtering active users
- `{ token_version: 1 }` - For token revocation checks

**AdminRole Enum:**
- `SUPER_ADMIN` - Full access including user management
- `PRODUCT_MANAGER` - Product and category management
- `ORDER_MANAGER` - Order viewing and updates
- `CONTENT_EDITOR` - Blog posts, pages, media management
- `VIEWER` - Read-only access

### Admin Activity Logs Collection (`admin_activity_logs`)

**Purpose:** Audit trail for all admin actions

```typescript
interface AdminActivityLog {
  _id: ObjectId;
  admin_id: ObjectId;                  // Reference to AdminUser._id
  action: AdminAction;                 // Action enum (LOGIN, LOGOUT, CREATE_PRODUCT, etc.)
  target_collection?: string;          // MongoDB collection name (e.g., 'products', 'orders')
  target_id?: ObjectId;                // ID of the affected document
  metadata?: {
    old_value?: unknown;                // Previous value (for updates)
    new_value?: unknown;                // New value (for updates)
    [key: string]: unknown;
  };
  ip_address?: string;                 // IP address of the action
  user_agent?: string;                 // User agent string
  createdAt: Date;
}
```

**Indexes:**
- `{ admin_id: 1, createdAt: -1 }` - For querying admin activity
- `{ action: 1 }` - For querying specific action types
- `{ target_collection: 1, target_id: 1 }` - For querying document audit history

**Key Business Logic:**
- **Login Flow:** Rate limiting (5 attempts/15 min), audit logging, token version check
- **Logout Flow:** API call to log activity before session destruction
- **RBAC Menu Filtering:** Menu items filtered by `AdminRole` enum, not hardcoded strings
- **Auto-Expand Sidebar:** Parent menus auto-expand when navigating to child routes
- **Rules of Hooks:** All hooks called before conditional returns to prevent React errors

**See:** `docs/ADMIN_ACCOUNT_RBAC_COMPLETE.md` for complete RBAC documentation
