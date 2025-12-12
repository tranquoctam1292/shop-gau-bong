# 📊 Schema Context - Custom CMS (MongoDB)

**Last Updated:** 2025-01-XX  
**Database:** MongoDB  
**API Method:** Next.js API Routes  
**Base URL:** `/api/cms/` (public) và `/api/admin/` (admin)

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
  slug: string;                     // URL slug (unique)
  type: 'simple' | 'variable';      // Product type
  status: 'draft' | 'publish';       // Product status
  featured: boolean;                 // Featured product flag
  price: number;                     // Current price (sale or regular)
  regularPrice?: number;            // Regular price
  salePrice?: number;               // Sale price (if on sale)
  onSale: boolean;                 // Is on sale?
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  stockQuantity?: number;           // Stock quantity
  sku?: string;                     // SKU
  description?: string;             // Full description
  shortDescription?: string;        // Short description
  images: string[];                  // Array of image URLs
  category: string;                  // Category ID (ObjectId as string)
  categories?: string[];            // Additional category IDs
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
    imageAltTexts?: Record<string, string>;
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
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  minPrice?: number;                // Calculated from variants
  maxPrice?: number;                // Calculated from variants
}
```

### Product Variants

```typescript
interface MongoVariant {
  _id: ObjectId;                    // Variant ID
  productId: ObjectId;              // Parent product ID
  name: string;                     // Variant name (e.g., "Size: L, Color: Red")
  sku?: string;                     // Variant SKU
  price: number;                    // Variant price
  regularPrice?: number;            // Regular price
  salePrice?: number;               // Sale price
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  stockQuantity?: number;           // Stock quantity
  attributes: {
    size?: string;                  // Size attribute value
    color?: string;                 // Color attribute value
    [key: string]: string | undefined;
  };
  image?: string;                   // Variant-specific image
  createdAt: Date;
  updatedAt: Date;
}
```

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
