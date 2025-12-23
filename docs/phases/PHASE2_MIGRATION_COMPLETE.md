# ✅ Phase 2: Migrate API Routes - COMPLETE

**Date:** 2025-01-XX  
**Status:** ✅ Complete  
**Next Phase:** Phase 3 - Data Migration

---

## 📋 Completed Tasks

### ✅ 1. Public API Routes

**Files Created:**
- `app/api/cms/products/route.ts` - GET products list
- `app/api/cms/products/[id]/route.ts` - GET single product
- `app/api/cms/products/[id]/variations/route.ts` - GET product variations
- `app/api/cms/categories/route.ts` - GET categories list
- `app/api/cms/orders/route.ts` - POST create order
- `app/api/cms/banners/route.ts` - GET active banners

**Features:**
- ✅ MongoDB queries using `getCollections()`
- ✅ Pagination support
- ✅ Filtering (search, category, price, size, color, material)
- ✅ Product variations support
- ✅ Order creation with line items
- ✅ Error handling with proper status codes

### ✅ 2. Admin API Routes

**Files Created:**
- `app/api/admin/products/route.ts` - GET list, POST create
- `app/api/admin/products/[id]/route.ts` - GET, PUT, DELETE
- `app/api/admin/categories/route.ts` - GET list, POST create
- `app/api/admin/orders/route.ts` - GET list
- `app/api/admin/orders/[id]/route.ts` - GET, PUT

**Features:**
- ✅ CRUD operations for products
- ✅ CRUD operations for categories
- ✅ Order management
- ✅ Zod validation schemas
- ✅ Volumetric weight auto-calculation
- ✅ Slug uniqueness validation
- ✅ TODO: Authentication (to be added in Phase 5)

### ✅ 3. Product Mapper Updates

**File:** `lib/utils/productMapper.ts`

**Added Functions:**
- ✅ `mapMongoProduct()` - Map MongoDB product → Frontend format
- ✅ `mapMongoProducts()` - Map array of products
- ✅ `mapMongoCategory()` - Map MongoDB category → Frontend format
- ✅ `mapMongoCategories()` - Map array of categories

**Key Features:**
- ✅ Handles MongoDB ObjectId conversion
- ✅ Extracts variants for attributes
- ✅ Calculates price from variants
- ✅ Maps images array
- ✅ Maintains backward compatibility with existing `MappedProduct` interface

### ✅ 4. API Client

**File:** `lib/api/cms.ts`

**Created:** New API client to replace `lib/api/woocommerce.ts`

**Methods:**
- ✅ `getProducts()` - Fetch products list
- ✅ `getProduct()` - Fetch single product
- ✅ `getProductVariations()` - Fetch variations
- ✅ `searchProducts()` - Search products
- ✅ `getCategories()` - Fetch categories
- ✅ `getCategory()` - Fetch single category

**Note:** This client calls Next.js API routes (not external API)

---

## 📁 Files Created

```
app/api/
├── cms/                          # Public API Routes
│   ├── products/
│   │   ├── route.ts              ✅ GET products list
│   │   ├── [id]/
│   │   │   ├── route.ts          ✅ GET single product
│   │   │   └── variations/
│   │   │       └── route.ts      ✅ GET variations
│   ├── categories/
│   │   └── route.ts              ✅ GET categories
│   ├── orders/
│   │   └── route.ts              ✅ POST create order
│   └── banners/
│       └── route.ts              ✅ GET banners
│
└── admin/                        # Admin API Routes (Protected)
    ├── products/
    │   ├── route.ts              ✅ GET list, POST create
    │   └── [id]/
    │       └── route.ts          ✅ GET, PUT, DELETE
    ├── categories/
    │   └── route.ts              ✅ GET list, POST create
    └── orders/
        ├── route.ts              ✅ GET list
        └── [id]/
            └── route.ts          ✅ GET, PUT

lib/
├── api/
│   └── cms.ts                    ✅ API client
└── utils/
    └── productMapper.ts          ✅ Updated with MongoDB mappers
```

---

## 🔧 API Endpoints Summary

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cms/products` | List products (with filters) |
| GET | `/api/cms/products/[id]` | Get single product |
| GET | `/api/cms/products/[id]/variations` | Get product variations |
| GET | `/api/cms/categories` | List categories |
| POST | `/api/cms/orders` | Create order (checkout) |
| GET | `/api/cms/banners` | Get active banners |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/products` | List products (admin) |
| POST | `/api/admin/products` | Create product |
| GET | `/api/admin/products/[id]` | Get single product |
| PUT | `/api/admin/products/[id]` | Update product |
| DELETE | `/api/admin/products/[id]` | Delete product |
| GET | `/api/admin/categories` | List categories |
| POST | `/api/admin/categories` | Create category |
| GET | `/api/admin/orders` | List orders |
| GET | `/api/admin/orders/[id]` | Get single order |
| PUT | `/api/admin/orders/[id]` | Update order |

---

## 🎯 Key Features Implemented

### Products API

✅ **Filtering:**
- Search by name, description, SKU
- Filter by category
- Filter by price range
- Filter by size (length)
- Filter by material
- Filter by color (from variants)
- Featured products filter

✅ **Pagination:**
- Page-based pagination
- Configurable per_page
- Total count and page info

✅ **Product Variations:**
- Nested variants in product document
- Support size and color variants
- Dynamic pricing from variants

### Categories API

✅ **Hierarchical Support:**
- Parent-child relationships
- Filter by parent category
- Position-based sorting

### Orders API

✅ **Order Creation:**
- Guest checkout support
- Gift order system (buyer/recipient info)
- Line items support
- Payment method tracking
- Order number generation

✅ **Order Management:**
- Status updates
- Payment status tracking
- Filter by order type (personal/gift)
- Search by order number, email, name

---

## ⚠️ TODO Items

### Authentication (Phase 5)

All admin routes have TODO comments for authentication:
```typescript
// TODO: Add authentication check
// const session = await auth();
// if (!session || session.user.role !== 'admin') {
//   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
// }
```

### Additional Features

- [ ] Product images upload endpoint
- [ ] Category images upload endpoint
- [ ] Order status webhooks
- [ ] Product bulk operations
- [ ] Category bulk operations

---

## 🧪 Testing

### Test Public Endpoints

```bash
# Test products list
curl http://localhost:3000/api/cms/products?page=1&per_page=10

# Test single product
curl http://localhost:3000/api/cms/products/[id]

# Test categories
curl http://localhost:3000/api/cms/categories

# Test banners
curl http://localhost:3000/api/cms/banners
```

### Test Admin Endpoints

```bash
# Test products list (admin)
curl http://localhost:3000/api/admin/products

# Test create product (admin)
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","slug":"test-product","minPrice":100000}'
```

---

## 📝 Code Usage Examples

### Using API Client

```typescript
import { cmsApi } from '@/lib/api/cms';

// Fetch products
const { products, pagination } = await cmsApi.getProducts({
  page: 1,
  per_page: 10,
  category: 'gau-bong',
});

// Fetch single product
const { product } = await cmsApi.getProduct('product-slug');

// Fetch variations
const { variations } = await cmsApi.getProductVariations(productId);
```

### Using Product Mapper

```typescript
import { mapMongoProduct } from '@/lib/utils/productMapper';

// In API route
const { products } = await getCollections();
const product = await products.findOne({ slug });
const mappedProduct = mapMongoProduct(product);
```

---

## ✅ Verification Checklist

- [x] Public API routes created
- [x] Admin API routes created
- [x] Product mapper updated for MongoDB
- [x] API client created
- [x] Error handling implemented
- [x] Validation schemas (Zod)
- [x] TypeScript types defined
- [ ] Authentication added (Phase 5)
- [ ] API routes tested with real data

---

## 🎯 Ready for Phase 3

Phase 2 is complete! You can now proceed to:

**Phase 3: Data Migration**
- Export data từ WordPress
- Transform data format
- Import vào MongoDB
- Verify data integrity

See `docs/CMS_INTEGRATION_ANALYSIS.md` for full migration plan.

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Phase 2 Complete

