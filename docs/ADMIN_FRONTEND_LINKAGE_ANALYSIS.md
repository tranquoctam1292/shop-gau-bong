# Phân Tích Liên Kết Admin - Frontend

**Ngày:** 2025-01-XX  
**Mục đích:** Kiểm tra các tính năng trong `components/admin/products` có được liên kết với frontend tương ứng không

---

## 📊 TỔNG QUAN

### Admin Components (`components/admin/products/`)
- **ProductForm** - Form tạo/sửa sản phẩm
- **ProductDataMetaBox** - Quản lý dữ liệu sản phẩm (giá, kho, vận chuyển, biến thể)
- **SEOMetaBox** - Quản lý SEO
- **GiftFeaturesSection** - Tính năng quà tặng
- **MediaExtendedSection** - Media mở rộng (video, 360°)
- **Image Editor Components** - Chỉnh sửa ảnh inline

### Frontend Pages
- `/products` - Danh sách sản phẩm
- `/products/[slug]` - Chi tiết sản phẩm
- `/` - Homepage với các sections sản phẩm

---

## ✅ CÁC TÍNH NĂNG ĐÃ ĐƯỢC LIÊN KẾT

### 1. Basic Product Fields ✅
| Admin Field | Database Field | API Route | Frontend Display | Status |
|------------|----------------|-----------|------------------|--------|
| `name` | `name` | ✅ `/api/cms/products/[id]` | ✅ `ProductInfo` | ✅ Linked |
| `slug` | `slug` | ✅ `/api/cms/products/[id]` | ✅ URL routing | ✅ Linked |
| `description` | `description` | ✅ `/api/cms/products/[id]` | ✅ `ProductDescription` | ✅ Linked |
| `shortDescription` | `shortDescription` | ✅ `/api/cms/products/[id]` | ✅ `ProductInfo` | ✅ Linked |
| `sku` | `sku` | ✅ `/api/cms/products/[id]` | ✅ `ProductInfo` | ✅ Linked |
| `categories` | `category` | ✅ `/api/cms/products/[id]` | ✅ Breadcrumb | ✅ Linked |
| `tags` | `tags` | ✅ `/api/cms/products/[id]` | ⚠️ Not displayed | ⚠️ Partial |

### 2. Product Images ✅
| Admin Field | Database Field | API Route | Frontend Display | Status |
|------------|----------------|-----------|------------------|--------|
| `_thumbnail_id` | `_thumbnail_id` | ✅ `/api/cms/products/[id]` | ✅ `ProductGallery` | ✅ Linked |
| `_product_image_gallery` | `_product_image_gallery` | ✅ `/api/cms/products/[id]` | ✅ `ProductGallery` | ✅ Linked |
| Image Alt Text | `mediaExtended.imageAltTexts` | ✅ `/api/cms/products/[id]` | ✅ `ProductGallery` (altText) | ✅ Linked |

### 3. ProductDataMetaBox - General Tab ⚠️
| Admin Field | Database Field | API Route | Frontend Display | Status |
|------------|----------------|-----------|------------------|--------|
| `regularPrice` | `productDataMetaBox.regularPrice` | ✅ Used in schema | ✅ `ProductInfo` (via `regularPrice`) | ⚠️ **ISSUE** |
| `salePrice` | `productDataMetaBox.salePrice` | ✅ Used in schema | ✅ `ProductInfo` (via `salePrice`) | ⚠️ **ISSUE** |
| `costPrice` | `productDataMetaBox.costPrice` | ✅ Saved | ❌ Not displayed (admin only) | ✅ OK |

**⚠️ VẤN ĐỀ:** 
- `productDataMetaBox.regularPrice` và `productDataMetaBox.salePrice` được lưu vào database
- Nhưng `mapMongoProduct()` không map các fields này sang frontend format
- Frontend đang dùng `minPrice` và `maxPrice` thay vì `regularPrice` và `salePrice`
- **TODO:** Cần update `mapMongoProduct()` để map từ `productDataMetaBox`

### 4. ProductDataMetaBox - Inventory Tab ✅
| Admin Field | Database Field | API Route | Frontend Display | Status |
|------------|----------------|-----------|------------------|--------|
| `sku` | `productDataMetaBox.sku` | ✅ `/api/cms/products/[id]` | ✅ `ProductInfo` | ✅ Linked |
| `stockStatus` | `productDataMetaBox.stockStatus` | ✅ Used in schema | ✅ `ProductInfo` (stockStatus) | ⚠️ **ISSUE** |
| `stockQuantity` | `productDataMetaBox.stockQuantity` | ✅ `/api/cms/products/[id]` | ✅ `ProductInfo` | ⚠️ **ISSUE** |
| `manageStock` | `productDataMetaBox.manageStock` | ✅ Saved | ❌ Not displayed (admin only) | ✅ OK |

**⚠️ VẤN ĐỀ:**
- `productDataMetaBox.stockStatus` và `stockQuantity` được lưu
- Nhưng `mapMongoProduct()` đang tính từ `variants` thay vì dùng `productDataMetaBox`
- **TODO:** Cần update `mapMongoProduct()` để ưu tiên `productDataMetaBox` fields

### 5. ProductDataMetaBox - Shipping Tab ✅
| Admin Field | Database Field | API Route | Frontend Display | Status |
|------------|----------------|-----------|------------------|--------|
| `weight` | `productDataMetaBox.weight` | ✅ `/api/cms/products/[id]` | ✅ Shipping calculation | ✅ Linked |
| `length` | `productDataMetaBox.length` | ✅ `/api/cms/products/[id]` | ✅ Shipping calculation | ✅ Linked |
| `width` | `productDataMetaBox.width` | ✅ `/api/cms/products/[id]` | ✅ Shipping calculation | ✅ Linked |
| `height` | `productDataMetaBox.height` | ✅ `/api/cms/products/[id]` | ✅ Shipping calculation | ✅ Linked |

**✅ OK:** Dimensions được map đúng trong `mapMongoProduct()`

### 6. ProductDataMetaBox - Variations ⚠️
| Admin Field | Database Field | API Route | Frontend Display | Status |
|------------|----------------|-----------|------------------|--------|
| `variations[]` | `productDataMetaBox.variations` | ⚠️ Not converted | ✅ `/api/cms/products/[id]/variations` | ⚠️ **ISSUE** |
| Variation prices | `variants[].price` | ✅ `/api/cms/products/[id]/variations` | ✅ `ProductInfo` | ⚠️ **ISSUE** |

**⚠️ VẤN ĐỀ NGHIÊM TRỌNG:**
- `ProductDataMetaBox.variations` được lưu vào `productDataMetaBox.variations` trong database
- Nhưng API route `/api/cms/products/[id]/variations` đang đọc từ `product.variants` (old structure)
- **TODO:** Cần convert `productDataMetaBox.variations` → `variants` khi save, hoặc update API route để đọc từ `productDataMetaBox.variations`

### 7. SEO Meta Box ✅
| Admin Field | Database Field | API Route | Frontend Display | Status |
|------------|----------------|-----------|------------------|--------|
| `seoTitle` | `seo.seoTitle` | ✅ Used in schema | ✅ Meta tags (generateMetadata) | ✅ Linked |
| `seoDescription` | `seo.seoDescription` | ✅ Used in schema | ✅ Meta tags | ✅ Linked |
| `slug` | `seo.slug` | ✅ `/api/cms/products/[id]` | ✅ URL routing | ✅ Linked |
| `ogImage` | `seo.ogImage` | ✅ Used in schema | ✅ Open Graph tags | ✅ Linked |
| Schema JSON-LD | `_productSchema` | ✅ Generated | ✅ `<script type="application/ld+json">` | ✅ Linked |

**✅ OK:** SEO fields được map và hiển thị đúng

### 8. Gift Features ❌
| Admin Field | Database Field | API Route | Frontend Display | Status |
|------------|----------------|-----------|------------------|--------|
| `giftWrapping` | `giftFeatures.giftWrapping` | ✅ Saved | ❌ Not displayed | ❌ **NOT LINKED** |
| `giftMessageEnabled` | `giftFeatures.giftMessageEnabled` | ✅ Saved | ❌ Not displayed | ❌ **NOT LINKED** |
| `giftCardEnabled` | `giftFeatures.giftCardEnabled` | ✅ Saved | ❌ Not displayed | ❌ **NOT LINKED** |

**❌ VẤN ĐỀ:**
- Gift features được lưu vào database
- Nhưng không được expose qua `/api/cms/products/[id]`
- Frontend không có component để hiển thị gift features
- **TODO:** Cần expose gift features trong API và tạo frontend components

### 9. Media Extended ❌
| Admin Field | Database Field | API Route | Frontend Display | Status |
|------------|----------------|-----------|------------------|--------|
| `videos[]` | `mediaExtended.videos` | ✅ Saved | ❌ Not displayed | ❌ **NOT LINKED** |
| `view360Images[]` | `mediaExtended.view360Images` | ✅ Saved | ❌ Not displayed | ❌ **NOT LINKED** |
| `imageAltTexts` | `mediaExtended.imageAltTexts` | ✅ Saved | ✅ Used in ProductGallery | ✅ Linked |

**❌ VẤN ĐỀ:**
- Videos và 360° images được lưu nhưng không được expose qua API
- Frontend không có component để hiển thị videos/360° images
- **TODO:** Cần expose mediaExtended trong API và tạo frontend components

---

## 🐛 CÁC VẤN ĐỀ PHÁT HIỆN

### Critical Issues (Cần fix ngay)

1. **ProductDataMetaBox Variations không được convert sang MongoDB variants**
   - **Vấn đề:** `ProductDataMetaBox.variations` được lưu vào `productDataMetaBox.variations` nhưng không được convert sang `variants` array
   - **Impact:** Frontend không thể hiển thị variations
   - **Fix:** Cần convert `productDataMetaBox.variations` → `variants` khi save product

2. **Price fields không được map đúng**
   - **Vấn đề:** `productDataMetaBox.regularPrice` và `salePrice` không được map trong `mapMongoProduct()`
   - **Impact:** Frontend hiển thị giá sai (dùng `minPrice` thay vì `regularPrice`)
   - **Fix:** Update `mapMongoProduct()` để ưu tiên `productDataMetaBox` fields

3. **Stock fields không được map đúng**
   - **Vấn đề:** `productDataMetaBox.stockStatus` và `stockQuantity` không được map
   - **Impact:** Frontend hiển thị stock status sai
   - **Fix:** Update `mapMongoProduct()` để ưu tiên `productDataMetaBox` fields

### Medium Priority Issues

4. **Gift Features không được expose**
   - **Vấn đề:** Gift features được lưu nhưng không có trong API response
   - **Impact:** Frontend không thể hiển thị gift options
   - **Fix:** Expose `giftFeatures` trong `/api/cms/products/[id]` và tạo frontend components

5. **Media Extended không được expose**
   - **Vấn đề:** Videos và 360° images không có trong API response
   - **Impact:** Frontend không thể hiển thị videos/360° images
   - **Fix:** Expose `mediaExtended` trong API và tạo frontend components

---

## 📋 KẾ HOẠCH SỬA LỖI

### Priority 1: Fix Critical Issues

1. **Update `mapMongoProduct()` để map ProductDataMetaBox fields:**
   ```typescript
   // Ưu tiên productDataMetaBox fields
   const regularPrice = mongoProduct.productDataMetaBox?.regularPrice 
     || mongoProduct.maxPrice 
     || mongoProduct.minPrice || 0;
   
   const salePrice = mongoProduct.productDataMetaBox?.salePrice;
   const onSale = salePrice && salePrice < regularPrice;
   
   const stockStatus = mongoProduct.productDataMetaBox?.stockStatus 
     || (mongoProduct.variants?.length > 0 ? 'instock' : 'outofstock');
   
   const stockQuantity = mongoProduct.productDataMetaBox?.stockQuantity 
     || (mongoProduct.variants?.reduce(...) || null);
   ```

2. **Convert ProductDataMetaBox variations → MongoDB variants:**
   - Update `app/api/admin/products/route.ts` (POST)
   - Update `app/api/admin/products/[id]/route.ts` (PUT)
   - Convert `productDataMetaBox.variations` → `variants` array format

### Priority 2: Expose Missing Features

3. **Expose Gift Features trong API:**
   - Update `/api/cms/products/[id]` để include `giftFeatures`
   - Tạo frontend component `GiftOptions` để hiển thị

4. **Expose Media Extended trong API:**
   - Update `/api/cms/products/[id]` để include `mediaExtended`
   - Tạo frontend components: `ProductVideos`, `Product360View`

---

## ✅ KẾT LUẬN

### Đã liên kết đúng:
- ✅ Basic product fields (name, slug, description, images)
- ✅ SEO fields (meta tags, schema JSON-LD)
- ✅ Shipping dimensions (weight, length, width, height)
- ✅ Image alt texts

### Cần fix:
- ⚠️ ProductDataMetaBox price fields (regularPrice, salePrice)
- ⚠️ ProductDataMetaBox stock fields (stockStatus, stockQuantity)
- ⚠️ ProductDataMetaBox variations → MongoDB variants conversion
- ❌ Gift Features exposure
- ❌ Media Extended exposure (videos, 360° images)

**Tổng kết:** ~60% tính năng đã được liên kết đúng. Cần fix các vấn đề về mapping ProductDataMetaBox fields và expose các tính năng mới (Gift, Media Extended).
