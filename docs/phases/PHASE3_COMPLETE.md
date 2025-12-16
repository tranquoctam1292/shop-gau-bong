# Phase 3: Data Migration - Hoàn Thành

## Tổng Quan

Phase 3 đã hoàn thành việc tạo các script và tools để migrate dữ liệu từ WordPress/WooCommerce sang MongoDB.

## Files Đã Tạo

### 1. Migration Script

**File:** `scripts/migrate-wordpress-to-mongodb.ts`

**Chức năng:**
- Export products, categories, và variations từ WooCommerce REST API
- Transform data từ WooCommerce format sang MongoDB format
- Import vào MongoDB với error handling và duplicate detection
- Support pagination cho large datasets
- Rate limiting để tránh overwhelm API

**Usage:**
```bash
npm run migrate:wordpress-to-mongodb
```

### 2. Verification Script

**File:** `scripts/verify-migration.ts`

**Chức năng:**
- Verify data integrity sau khi migration
- Check products: total, published, draft, variants, images, missing fields
- Check categories: total, top-level, with parent, images
- Check data integrity: products without category, invalid variants

**Usage:**
```bash
npm run migrate:verify
```

### 3. Documentation

**File:** `docs/PHASE3_DATA_MIGRATION_GUIDE.md`

**Nội dung:**
- Hướng dẫn chi tiết migration process
- Data transformation mapping tables
- Troubleshooting guide
- Best practices

## Features

### ✅ Data Transformation

- **Products**: Transform từ WooCommerce REST API format sang MongoDB format
  - Extract ACF fields từ `meta_data`
  - Calculate volumetric weight nếu chưa có
  - Map categories, tags, images
  - Transform variations thành variants

- **Categories**: Transform với parent-child relationships
  - Import parent categories trước
  - Map parent references bằng ObjectId

- **Variations**: Transform thành MongoDB variants
  - Extract size và color từ attributes
  - Map price, stock, images

### ✅ Error Handling

- Network errors: Graceful degradation
- Data validation: Skip invalid records và log errors
- Duplicate detection: Update existing records
- Rate limiting: Small delays để tránh overwhelm

### ✅ Statistics & Reporting

- Real-time progress reporting
- Detailed statistics sau khi hoàn tất
- Error logging với context

## Migration Process

### Step 1: Prepare Environment

1. Đảm bảo MongoDB connection đã được cấu hình trong `.env.local`
2. Đảm bảo WooCommerce REST API credentials đã được cấu hình
3. Setup database indexes: `npm run db:setup-indexes`

### Step 2: Run Migration

```bash
npm run migrate:wordpress-to-mongodb
```

Script sẽ:
1. Connect đến MongoDB
2. Fetch categories từ WooCommerce
3. Import categories (parent categories trước)
4. Fetch products từ WooCommerce (với pagination)
5. Fetch variations cho variable products
6. Transform và import products
7. Print summary statistics

### Step 3: Verify Migration

```bash
npm run migrate:verify
```

Script sẽ verify:
- Products integrity
- Categories integrity
- Data relationships
- Missing fields
- Invalid data

## Data Mapping

### Products

| WooCommerce | MongoDB | Notes |
|------------|---------|-------|
| `id` | `_wcId` | Reference |
| `name` | `name` | Direct |
| `slug` | `slug` | Direct |
| `price` | `minPrice` | Parsed |
| `images[].src` | `images[]` | Array |
| `categories[0].id` | `category` | ObjectId |
| `meta_data['length']` | `length` | ACF field |
| `variations[]` | `variants[]` | Transformed |

### Categories

| WooCommerce | MongoDB | Notes |
|------------|---------|-------|
| `id` | `_wcId` | Reference |
| `name` | `name` | Direct |
| `slug` | `slug` | Direct |
| `parent` | `parentId` | ObjectId |
| `image.src` | `imageUrl` | Direct |

### Variations → Variants

| WooCommerce | MongoDB | Notes |
|------------|---------|-------|
| `id` | `id` | `var_{id}` |
| `attributes[pa_size]` | `size` | Extracted |
| `attributes[pa_color]` | `color` | Extracted |
| `price` | `price` | Parsed |
| `stock_quantity` | `stock` | Direct |

## Prerequisites

### Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/shop-gau-bong
MONGODB_DB_NAME=shop-gau-bong

# WooCommerce REST API
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx
```

### Database Setup

```bash
# Setup indexes
npm run db:setup-indexes

# Test connection
npm run test:mongodb
```

## Next Steps

Sau khi migration hoàn tất:

1. ✅ **Verify data**: `npm run migrate:verify`
2. ✅ **Test API routes**: `npm run test:api-routes`
3. ✅ **Phase 4**: Update frontend components để sử dụng CMS API

## Notes

- Script migration **không xóa** data cũ trong MongoDB
- Nếu product/category đã tồn tại (by slug hoặc `_wcId`), script sẽ **update** thay vì tạo duplicate
- Images URLs được giữ nguyên (không migrate images sang Vercel Blob trong Phase 3)
- Migration có thể mất 10-30 phút với large datasets (>1000 products)

## Troubleshooting

Xem `docs/PHASE3_DATA_MIGRATION_GUIDE.md` để biết chi tiết troubleshooting guide.

## Summary

✅ **Phase 3 hoàn thành** với đầy đủ:
- Migration script với error handling
- Verification script
- Comprehensive documentation
- Data transformation logic
- Duplicate detection và update logic

Sẵn sàng để chạy migration và tiếp tục Phase 4!

