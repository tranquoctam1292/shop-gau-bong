# 🚀 Migration Plan: WordPress → Custom CMS (Next.js + API Routes + Database)

**Ngày tạo:** 2025-01-XX  
**Status:** Planning Phase  
**Estimated Timeline:** 4-6 tuần

---

## 📋 MỤC LỤC

1. [Tổng quan Migration](#1-tổng-quan-migration)
2. [Tính khả thi & Đánh giá](#2-tính-khả-thi--đánh-giá)
3. [Kiến trúc mới](#3-kiến-trúc-mới)
4. [Database Schema Design](#4-database-schema-design)
5. [API Routes Structure](#5-api-routes-structure)
6. [Migration Strategy](#6-migration-strategy)
7. [Implementation Plan](#7-implementation-plan)
8. [Risks & Mitigation](#8-risks--mitigation)

---

## 1. TỔNG QUAN MIGRATION

### 1.1. Mục tiêu

Chuyển đổi từ **WordPress + WooCommerce** sang **Custom CMS** được xây dựng hoàn toàn bằng:
- **Next.js 14** (App Router)
- **Next.js API Routes** (Backend API)
- **Database** (PostgreSQL hoặc MySQL)
- **ORM** (Prisma hoặc Drizzle ORM)

### 1.2. Lợi ích

✅ **Full Control:** Kiểm soát hoàn toàn backend logic  
✅ **Performance:** Tối ưu database queries, không phụ thuộc WordPress overhead  
✅ **Cost:** Giảm chi phí hosting WordPress (chỉ cần database hosting)  
✅ **Flexibility:** Dễ dàng customize và mở rộng  
✅ **Modern Stack:** Sử dụng TypeScript, type-safe database queries  
✅ **Unified Codebase:** Frontend và Backend trong cùng một repo  

### 1.3. Thách thức

⚠️ **Development Time:** Cần xây dựng lại toàn bộ CMS từ đầu  
⚠️ **Data Migration:** Cần migrate toàn bộ data từ WordPress  
⚠️ **Admin Panel:** Cần xây dựng admin panel để quản lý sản phẩm  
⚠️ **Payment Integration:** Cần migrate payment webhooks và logic  
⚠️ **Testing:** Cần test kỹ lưỡng trước khi deploy production  

---

## 2. TÍNH KHẢ THI & ĐÁNH GIÁ

### 2.1. ✅ CÓ THỂ LÀM ĐƯỢC

**Lý do:**
- Codebase hiện tại đã có abstraction layer tốt (`lib/api/woocommerce.ts`, `productMapper.ts`)
- Frontend components đã tách biệt với backend (chỉ gọi API)
- Next.js API Routes đã được setup sẵn (proxy pattern)
- TypeScript types đã được định nghĩa rõ ràng

### 2.2. Tác động đến Codebase

#### Files cần thay đổi:

**Backend Layer:**
- `lib/api/woocommerce.ts` → `lib/api/cms.ts` (thay thế)
- `app/api/woocommerce/*` → `app/api/cms/*` (thay thế)
- `types/woocommerce.ts` → `types/cms.ts` (update)

**Frontend Layer:**
- `lib/hooks/useProductsREST.ts` → Update API endpoints
- `lib/hooks/useProductVariations.ts` → Update API endpoints
- `lib/hooks/useCategoriesREST.ts` → Update API endpoints
- `lib/utils/productMapper.ts` → Update mapping logic (nếu cần)

**Components:**
- ✅ **Không cần thay đổi** - Components chỉ gọi hooks, không phụ thuộc backend

---

## 3. KIẾN TRÚC MỚI

### 3.1. Architecture Diagram

```
┌─────────────────────────────────────┐
│   Next.js Frontend (App Router)     │
│   - Pages & Components               │
│   - React Query Hooks               │
└──────────────┬──────────────────────┘
               │
               │ HTTP Requests
               │
┌──────────────▼──────────────────────┐
│   Next.js API Routes                 │
│   /api/cms/products                  │
│   /api/cms/categories                │
│   /api/cms/orders                    │
│   /api/cms/admin/*                   │
└──────────────┬──────────────────────┘
               │
               │ Prisma/Drizzle ORM
               │
┌──────────────▼──────────────────────┐
│   Database (PostgreSQL/MySQL)        │
│   - products                         │
│   - categories                       │
│   - orders                           │
│   - users (admin)                    │
└─────────────────────────────────────┘
```

### 3.2. Tech Stack mới

#### Database
- **PostgreSQL** (recommended) hoặc **MySQL**
- **ORM:** Prisma (recommended) hoặc Drizzle ORM
- **Migration:** Prisma Migrate hoặc Drizzle Kit

#### Backend (Next.js API Routes)
- Next.js 14 API Routes
- TypeScript (strict mode)
- Zod (validation)
- NextAuth.js (admin authentication)

#### Admin Panel
- Next.js App Router pages (`/admin/*`)
- Shadcn UI components
- React Hook Form + Zod
- File upload (Next.js API Route)

---

## 4. DATABASE SCHEMA DESIGN

### 4.1. Products Table

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  sku VARCHAR(100) UNIQUE,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  regular_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10, 2),
  on_sale BOOLEAN DEFAULT FALSE,
  
  -- Stock
  stock_status VARCHAR(20) DEFAULT 'instock', -- 'instock', 'outofstock', 'onbackorder'
  stock_quantity INTEGER,
  manage_stock BOOLEAN DEFAULT FALSE,
  
  -- Product Type
  type VARCHAR(20) DEFAULT 'simple', -- 'simple', 'variable', 'grouped', 'external'
  status VARCHAR(20) DEFAULT 'publish', -- 'draft', 'pending', 'private', 'publish'
  featured BOOLEAN DEFAULT FALSE,
  
  -- Dimensions & Weight (for shipping calculation)
  weight DECIMAL(8, 2), -- kg
  length DECIMAL(8, 2), -- cm
  width DECIMAL(8, 2),  -- cm
  height DECIMAL(8, 2), -- cm
  volumetric_weight DECIMAL(8, 2), -- calculated: (L * W * H) / 6000
  
  -- Custom Fields (ACF equivalent)
  material VARCHAR(100),
  origin VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_featured (featured),
  INDEX idx_type (type)
);
```

### 4.2. Product Images Table

```sql
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  position INTEGER DEFAULT 0, -- 0 = main image, 1+ = gallery images
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_product_id (product_id),
  INDEX idx_position (position)
);
```

### 4.3. Categories Table

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image_url VARCHAR(500),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_slug (slug),
  INDEX idx_parent_id (parent_id)
);
```

### 4.4. Product Categories (Many-to-Many)

```sql
CREATE TABLE product_categories (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id),
  
  INDEX idx_product_id (product_id),
  INDEX idx_category_id (category_id)
);
```

### 4.5. Product Attributes Table

```sql
CREATE TABLE product_attributes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- 'pa_size', 'pa_color', 'material', etc.
  options TEXT[], -- Array of options: ['S', 'M', 'L', 'XL']
  position INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT TRUE,
  variation BOOLEAN DEFAULT FALSE, -- Can be used for variations
  
  INDEX idx_product_id (product_id),
  INDEX idx_name (name)
);
```

### 4.6. Product Variations Table

```sql
CREATE TABLE product_variations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100),
  price DECIMAL(10, 2),
  regular_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  on_sale BOOLEAN DEFAULT FALSE,
  stock_status VARCHAR(20) DEFAULT 'instock',
  stock_quantity INTEGER,
  image_url VARCHAR(500),
  attributes JSONB, -- { "pa_size": "60cm", "pa_color": "#FF0000" }
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_product_id (product_id),
  INDEX idx_sku (sku)
);
```

### 4.7. Orders Table

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Display number (e.g., "ORD-2025-001")
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'cancelled', 'refunded'
  
  -- Customer Info
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Billing Address
  billing_first_name VARCHAR(100),
  billing_last_name VARCHAR(100),
  billing_address_1 VARCHAR(255),
  billing_address_2 VARCHAR(255),
  billing_city VARCHAR(100),
  billing_postcode VARCHAR(20),
  billing_country VARCHAR(2) DEFAULT 'VN',
  
  -- Shipping Address
  shipping_first_name VARCHAR(100),
  shipping_last_name VARCHAR(100),
  shipping_address_1 VARCHAR(255),
  shipping_address_2 VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_postcode VARCHAR(20),
  shipping_country VARCHAR(2) DEFAULT 'VN',
  
  -- Payment
  payment_method VARCHAR(50), -- 'cod', 'momo', 'vietqr', 'bank_transfer'
  payment_method_title VARCHAR(255),
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  transaction_id VARCHAR(255),
  
  -- Totals
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping_total DECIMAL(10, 2) DEFAULT 0,
  tax_total DECIMAL(10, 2) DEFAULT 0,
  discount_total DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'VND',
  
  -- Notes
  customer_note TEXT,
  admin_note TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  INDEX idx_order_number (order_number),
  INDEX idx_status (status),
  INDEX idx_customer_email (customer_email),
  INDEX idx_created_at (created_at)
);
```

### 4.8. Order Items Table

```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  variation_id INTEGER REFERENCES product_variations(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL, -- Snapshot at time of order
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
);
```

### 4.9. Users Table (Admin)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hashed
  name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'admin', -- 'admin', 'editor', 'viewer'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_email (email)
);
```

### 4.10. Banners Table (Hero Carousel)

```sql
CREATE TABLE banners (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(500),
  position INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_position (position),
  INDEX idx_active (active)
);
```

---

## 5. API ROUTES STRUCTURE

### 5.1. Public API Routes

```
app/api/cms/
├── products/
│   ├── route.ts              # GET /api/cms/products (list)
│   └── [id]/
│       ├── route.ts          # GET /api/cms/products/[id] (single)
│       └── variations/
│           └── route.ts      # GET /api/cms/products/[id]/variations
├── categories/
│   ├── route.ts              # GET /api/cms/categories
│   └── [id]/
│       └── route.ts          # GET /api/cms/categories/[id]
├── orders/
│   ├── route.ts              # POST /api/cms/orders (create)
│   └── [id]/
│       └── route.ts          # GET /api/cms/orders/[id]
└── banners/
    └── route.ts              # GET /api/cms/banners
```

### 5.2. Admin API Routes (Protected)

```
app/api/cms/admin/
├── products/
│   ├── route.ts              # GET, POST /api/cms/admin/products
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE /api/cms/admin/products/[id]
├── categories/
│   ├── route.ts              # GET, POST /api/cms/admin/categories
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE /api/cms/admin/categories/[id]
├── orders/
│   ├── route.ts              # GET /api/cms/admin/orders
│   └── [id]/
│       └── route.ts          # GET, PUT /api/cms/admin/orders/[id]
├── upload/
│   └── route.ts              # POST /api/cms/admin/upload (image upload)
└── auth/
    ├── login/
    │   └── route.ts          # POST /api/cms/admin/auth/login
    └── logout/
        └── route.ts          # POST /api/cms/admin/auth/logout
```

### 5.3. API Client Structure

**New file:** `lib/api/cms.ts`

```typescript
/**
 * Custom CMS API Client
 * Replaces lib/api/woocommerce.ts
 */

// Similar structure to wcApi, but calls Next.js API routes instead
export const cmsApi = {
  // Products
  getProducts: (params?: Record<string, any>) => 
    fetch('/api/cms/products?' + new URLSearchParams(params)),
  
  getProduct: (id: number) => 
    fetch(`/api/cms/products/${id}`),
  
  getProductVariations: (productId: number) => 
    fetch(`/api/cms/products/${productId}/variations`),
  
  // Categories
  getCategories: (params?: Record<string, any>) => 
    fetch('/api/cms/categories?' + new URLSearchParams(params)),
  
  // Orders
  createOrder: (data: any) => 
    fetch('/api/cms/orders', { method: 'POST', body: JSON.stringify(data) }),
  
  getOrder: (id: number) => 
    fetch(`/api/cms/orders/${id}`),
  
  // Banners
  getBanners: () => 
    fetch('/api/cms/banners'),
};
```

---

## 6. MIGRATION STRATEGY

### 6.1. Data Migration từ WordPress

#### Step 1: Export Data từ WordPress

**Option A: WooCommerce REST API Export**
```typescript
// scripts/export-wordpress-data.ts
// Export products, categories, orders từ WordPress REST API
```

**Option B: Direct Database Export**
```sql
-- Export từ WordPress MySQL database
-- products, categories, orders, images
```

#### Step 2: Transform Data

```typescript
// scripts/transform-wordpress-data.ts
// Transform WordPress format → Custom CMS format
// - Map ACF fields từ meta_data
// - Map product images
// - Map categories relationships
```

#### Step 3: Import vào Database mới

```typescript
// scripts/import-to-cms.ts
// Import transformed data vào PostgreSQL/MySQL
// - Use Prisma Client hoặc raw SQL
```

### 6.2. Migration Timeline

**Phase 1: Setup (Tuần 1)**
- [ ] Setup database (PostgreSQL/MySQL)
- [ ] Setup Prisma/Drizzle ORM
- [ ] Create database schema
- [ ] Setup Next.js API Routes structure

**Phase 2: Core API (Tuần 2-3)**
- [ ] Implement Products API
- [ ] Implement Categories API
- [ ] Implement Orders API
- [ ] Implement Banners API
- [ ] Update API client (`lib/api/cms.ts`)

**Phase 3: Admin Panel (Tuần 3-4)**
- [ ] Build admin authentication
- [ ] Build product management UI
- [ ] Build category management UI
- [ ] Build order management UI
- [ ] Build image upload functionality

**Phase 4: Data Migration (Tuần 4-5)**
- [ ] Export data từ WordPress
- [ ] Transform data
- [ ] Import vào database mới
- [ ] Verify data integrity

**Phase 5: Frontend Update (Tuần 5)**
- [ ] Update hooks to use new API endpoints
- [ ] Update productMapper if needed
- [ ] Test all frontend features

**Phase 6: Testing & Deployment (Tuần 6)**
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor & fix issues

---

## 7. IMPLEMENTATION PLAN

### 7.1. Database Setup với Prisma

**Install Prisma:**
```bash
npm install prisma @prisma/client
npx prisma init
```

**Prisma Schema (`prisma/schema.prisma`):**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "mysql"
  url      = env("DATABASE_URL")
}

model Product {
  id                Int      @id @default(autoincrement())
  name              String
  slug              String   @unique
  description       String?  @db.Text
  shortDescription  String?  @db.Text
  sku               String?  @unique
  
  price             Decimal  @default(0) @db.Decimal(10, 2)
  regularPrice     Decimal  @default(0) @db.Decimal(10, 2)
  salePrice        Decimal? @db.Decimal(10, 2)
  onSale           Boolean  @default(false)
  
  stockStatus      String   @default("instock")
  stockQuantity    Int?
  manageStock      Boolean  @default(false)
  
  type            String   @default("simple")
  status          String   @default("publish")
  featured        Boolean  @default(false)
  
  weight          Decimal? @db.Decimal(8, 2)
  length          Decimal? @db.Decimal(8, 2)
  width           Decimal? @db.Decimal(8, 2)
  height          Decimal? @db.Decimal(8, 2)
  volumetricWeight Decimal? @db.Decimal(8, 2)
  
  material        String?
  origin          String?
  
  images          ProductImage[]
  categories     ProductCategory[]
  attributes     ProductAttribute[]
  variations     ProductVariation[]
  orderItems     OrderItem[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([slug])
  @@index([status])
  @@index([featured])
}

model ProductImage {
  id        Int      @id @default(autoincrement())
  productId Int
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String   @db.VarChar(500)
  altText   String?
  position  Int      @default(0)
  createdAt DateTime @default(now())
  
  @@index([productId])
}

model Category {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?  @db.Text
  parentId    Int?
  parent      Category? @relation("CategoryParent", fields: [parentId], references: [id], onDelete: SetNull)
  children    Category[] @relation("CategoryParent")
  imageUrl    String?  @db.VarChar(500)
  position    Int      @default(0)
  products    ProductCategory[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([slug])
  @@index([parentId])
}

model ProductCategory {
  productId  Int
  categoryId  Int
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@id([productId, categoryId])
  @@index([productId])
  @@index([categoryId])
}

// ... (other models: ProductAttribute, ProductVariation, Order, OrderItem, User, Banner)
```

### 7.2. API Route Example: Products

**File:** `app/api/cms/products/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '10', 10);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const minPrice = searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined;
    const maxPrice = searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined;
    
    // Build Prisma query
    const where: any = {
      status: 'publish',
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }
    
    if (featured) {
      where.featured = true;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    
    // Fetch products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            orderBy: { position: 'asc' },
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
    
    const totalPages = Math.ceil(total / perPage);
    
    return NextResponse.json({
      products,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        perPage,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

---

## 8. RISKS & MITIGATION

### 8.1. Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | High | Medium | Backup WordPress data, test migration on staging first |
| Performance issues | Medium | Low | Optimize database queries, add indexes, use caching |
| Admin panel complexity | Medium | Medium | Use existing UI libraries (Shadcn), follow best practices |
| Payment webhook issues | High | Low | Test webhooks thoroughly, maintain backward compatibility |
| Downtime during migration | High | Low | Use blue-green deployment, migrate during low traffic |

### 8.2. Rollback Plan

**Nếu migration thất bại:**
1. Keep WordPress backend running in parallel
2. Switch API routes back to WordPress proxy
3. Investigate issues in staging environment
4. Fix and retry migration

---

## 9. COST COMPARISON

### WordPress Hosting (Current)
- WordPress hosting: $10-30/tháng
- Total: **$10-30/tháng**

### Custom CMS (New)
- Database hosting (PostgreSQL): $0-20/tháng (Vercel Postgres, Supabase free tier, hoặc self-hosted)
- Next.js hosting: $0/tháng (Vercel free tier) hoặc $20/tháng (Pro)
- Total: **$0-40/tháng** (có thể rẻ hơn nếu dùng free tiers)

**Lưu ý:** Custom CMS có thể tiết kiệm chi phí nếu scale lớn, nhưng cần thời gian development.

---

## 10. RECOMMENDATION

### ✅ NÊN MIGRATE NẾU:

- Bạn muốn full control over backend
- Bạn có thời gian 4-6 tuần để development
- Bạn muốn tối ưu performance và cost
- Bạn muốn unified codebase (frontend + backend)

### ❌ KHÔNG NÊN MIGRATE NẾU:

- Bạn cần launch nhanh (WordPress đã hoạt động tốt)
- Bạn không có thời gian để maintain custom CMS
- Bạn cần các tính năng WooCommerce phức tạp (subscriptions, memberships, etc.)
- Team không có kinh nghiệm với database và backend development

---

## 11. NEXT STEPS

Nếu quyết định migrate:

1. **Review & Approve Plan:** Xem xét kỹ plan này
2. **Setup Database:** Chọn PostgreSQL hoặc MySQL, setup Prisma
3. **Create Database Schema:** Implement schema theo design ở trên
4. **Build Core API:** Implement Products, Categories, Orders API
5. **Build Admin Panel:** Xây dựng admin interface
6. **Data Migration:** Export và import data từ WordPress
7. **Testing:** Test kỹ lưỡng trên staging
8. **Deploy:** Deploy production và monitor

---

**Last Updated:** 2025-01-XX  
**Status:** Ready for Review  
**Next Action:** Awaiting approval to proceed with implementation

