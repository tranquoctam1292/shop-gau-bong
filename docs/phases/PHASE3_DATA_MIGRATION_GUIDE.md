# Phase 3: Data Migration Guide

## Tổng Quan

Phase 3 thực hiện migration dữ liệu từ WordPress/WooCommerce sang MongoDB. Script migration sẽ:

1. **Export** dữ liệu từ WooCommerce REST API (products, categories, variations)
2. **Transform** dữ liệu từ format WooCommerce sang MongoDB format
3. **Import** dữ liệu vào MongoDB với error handling
4. **Verify** data integrity sau khi migration

## Prerequisites

### 1. Environment Variables

Đảm bảo các biến môi trường sau đã được cấu hình trong `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/shop-gau-bong
# hoặc MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shop-gau-bong
MONGODB_DB_NAME=shop-gau-bong

# WooCommerce REST API
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx
# Hoặc WordPress Application Password:
# WORDPRESS_USERNAME=admin
# WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

### 2. Database Setup

Đảm bảo MongoDB đã được setup và indexes đã được tạo:

```bash
npm run db:setup-indexes
```

### 3. WooCommerce API Access

- WooCommerce REST API credentials phải có quyền **Read** (ít nhất)
- Để migrate variations, cần quyền **Read** cho products và variations

## Migration Process

### Step 1: Run Migration

```bash
npm run migrate:wordpress-to-mongodb
```

Script sẽ:

1. **Connect** đến MongoDB
2. **Fetch** tất cả categories từ WooCommerce
3. **Import** categories vào MongoDB (parent categories trước)
4. **Fetch** tất cả products từ WooCommerce (với pagination)
5. **Fetch** variations cho mỗi variable product
6. **Transform** và **import** products vào MongoDB
7. **Print** summary với statistics

### Step 2: Verify Migration

Sau khi migration hoàn tất, chạy script verification:

```bash
npm run migrate:verify
```

Script sẽ kiểm tra:

- ✅ Products: total, published, draft, variants, images, missing fields
- ✅ Categories: total, top-level, with parent, images
- ✅ Data Integrity: products without category, invalid variants, orphaned categories

## Migration Details

### Data Transformation

#### Products

**WooCommerce → MongoDB:**

| WooCommerce Field | MongoDB Field | Notes |
|------------------|---------------|-------|
| `id` | `_wcId` | Stored for reference |
| `name` | `name` | Direct mapping |
| `slug` | `slug` | Direct mapping |
| `description` | `description` | Direct mapping |
| `short_description` | `shortDescription` | Direct mapping |
| `sku` | `sku` | Direct mapping |
| `price` / `regular_price` | `minPrice` | Use lowest price |
| `sale_price` | `maxPrice` | If on sale |
| `images[].src` | `images[]` | Array of image URLs |
| `categories[0].id` | `category` | First category (ObjectId) |
| `tags[].name` | `tags[]` | Array of tag names |
| `featured` | `isHot` | Boolean |
| `status === 'publish'` | `isActive` | Boolean |
| `status` | `status` | 'publish' or 'draft' |
| `meta_data['length']` | `length` | ACF field |
| `meta_data['width']` | `width` | ACF field |
| `meta_data['height']` | `height` | ACF field |
| `meta_data['volumetric_weight']` | `volumetricWeight` | ACF field or calculated |
| `meta_data['material']` | `material` | ACF field |
| `meta_data['origin']` | `origin` | ACF field |
| `dimensions.length` | `length` | Fallback if ACF not set |
| `dimensions.width` | `width` | Fallback if ACF not set |
| `dimensions.height` | `height` | Fallback if ACF not set |
| `weight` | `weight` | Parsed to number |
| `variations[]` | `variants[]` | Transformed from variations |

#### Categories

**WooCommerce → MongoDB:**

| WooCommerce Field | MongoDB Field | Notes |
|------------------|---------------|-------|
| `id` | `_wcId` | Stored for reference |
| `name` | `name` | Direct mapping |
| `slug` | `slug` | Direct mapping |
| `description` | `description` | Direct mapping |
| `parent` | `parentId` | ObjectId reference (null if top-level) |
| `image.src` | `imageUrl` | Direct mapping |
| `menu_order` | `position` | Direct mapping |
| `count` | `count` | Direct mapping |

#### Variations

**WooCommerce → MongoDB Variants:**

| WooCommerce Field | MongoDB Field | Notes |
|------------------|---------------|-------|
| `id` | `id` | `var_{variation_id}` |
| `attributes[pa_size].option` | `size` | Extracted from attributes |
| `attributes[pa_color].option` | `color` | Extracted from attributes |
| `meta_data['color_code']` | `colorCode` | ACF field |
| `price` / `regular_price` | `price` | Parsed to number |
| `stock_quantity` | `stock` | Direct mapping |
| `image.src` | `image` | Direct mapping |
| `sku` | `sku` | Direct mapping |

### Volumetric Weight Calculation

Nếu `volumetric_weight` không có trong ACF fields, script sẽ tự động tính:

```typescript
volumetricWeight = (length * width * height) / 6000
```

### Category Mapping

- Categories được import theo thứ tự: **parent categories trước, child categories sau**
- Parent category reference (`parentId`) được map từ WooCommerce ID sang MongoDB ObjectId
- Products reference categories bằng MongoDB ObjectId

### Error Handling

Script migration có error handling toàn diện:

- ✅ **Network errors**: Retry logic và graceful degradation
- ✅ **Data validation**: Skip invalid records và log errors
- ✅ **Duplicate detection**: Update existing records thay vì tạo duplicate
- ✅ **Rate limiting**: Small delays để tránh overwhelm API/database

## Migration Statistics

Script sẽ hiển thị statistics sau khi hoàn tất:

```
=== Migration Summary ===

Products:
  Fetched: 150
  Transformed: 150
  Imported: 150
  Errors: 0

Categories:
  Fetched: 20
  Transformed: 20
  Imported: 20
  Errors: 0

Variations:
  Fetched: 300
  Transformed: 300
  Errors: 0
```

## Troubleshooting

### Error: "WooCommerce API error: 401 Unauthorized"

**Nguyên nhân:** API credentials không đúng hoặc không có quyền.

**Giải pháp:**
1. Kiểm tra `WOOCOMMERCE_CONSUMER_KEY` và `WOOCOMMERCE_CONSUMER_SECRET` trong `.env.local`
2. Đảm bảo API key có quyền **Read** trong WooCommerce > Settings > Advanced > REST API
3. Thử dùng WordPress Application Password thay vì WooCommerce API key

### Error: "MongoDB connection failed"

**Nguyên nhân:** MongoDB không accessible hoặc credentials sai.

**Giải pháp:**
1. Kiểm tra `MONGODB_URI` trong `.env.local`
2. Test connection: `npm run test:mongodb`
3. Đảm bảo MongoDB server đang chạy (nếu local)

### Error: "Product import failed"

**Nguyên nhân:** Data validation error hoặc missing required fields.

**Giải pháp:**
1. Xem error log trong console để biết product nào bị lỗi
2. Kiểm tra WooCommerce product có đầy đủ required fields (name, slug, price)
3. Script sẽ skip products có lỗi và tiếp tục với products khác

### Migration chạy quá lâu

**Nguyên nhân:** Quá nhiều products hoặc network chậm.

**Giải pháp:**
1. Script có rate limiting để tránh overwhelm API
2. Có thể chạy migration trong background
3. Với số lượng lớn (>1000 products), migration có thể mất 10-30 phút

## Best Practices

### 1. Backup trước khi migration

```bash
# Backup MongoDB (nếu có data cũ)
mongodump --uri="mongodb://localhost:27017/shop-gau-bong" --out=./backup
```

### 2. Test với sample data trước

Nếu có nhiều products, có thể test với một số products trước:

1. Tạo test category trong WooCommerce
2. Assign một vài products vào test category
3. Filter migration chỉ cho test category (cần modify script)

### 3. Verify sau khi migration

Luôn chạy verification script sau migration:

```bash
npm run migrate:verify
```

### 4. Monitor errors

Xem error log trong console output. Nếu có nhiều errors, cần:

1. Fix data issues trong WooCommerce
2. Re-run migration (script sẽ update existing records)

## Next Steps

Sau khi migration hoàn tất:

1. ✅ **Verify data**: `npm run migrate:verify`
2. ✅ **Test API routes**: `npm run test:api-routes`
3. ✅ **Phase 4**: Update frontend components để sử dụng CMS API

## Notes

- Script migration **không xóa** data cũ trong MongoDB
- Nếu product/category đã tồn tại (by slug hoặc `_wcId`), script sẽ **update** thay vì tạo duplicate
- Images URLs được giữ nguyên (không migrate images sang Vercel Blob trong Phase 3)
- Orders migration có thể được thêm sau nếu cần

