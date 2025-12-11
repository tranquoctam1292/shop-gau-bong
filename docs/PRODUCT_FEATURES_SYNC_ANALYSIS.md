# Phân Tích Đồng Bộ Tính Năng Sản Phẩm

**Ngày tạo:** 2025-01-XX  
**Mục tiêu:** So sánh và đồng bộ tính năng sản phẩm giữa CMS mẫu (fullcode.txt) và CMS hiện tại

---

## 📊 SO SÁNH TỔNG QUAN

### ✅ Tính Năng Đã Có (CMS Hiện Tại)

#### 1. ProductForm.tsx (Cơ bản)
- ✅ Thông tin cơ bản (name, slug, description, SKU)
- ✅ Variant management (size, color, price, stock)
- ✅ Image management (URL-based)
- ✅ Category selection
- ✅ Tags management
- ✅ Additional info (dimensions, weight, material, origin)
- ✅ Status management (draft/publish, active/inactive, hot product)
- ✅ Auto-generate slug

#### 2. API Routes
- ✅ GET /api/admin/products - List products
- ✅ POST /api/admin/products - Create product
- ✅ GET /api/admin/products/[id] - Get product
- ✅ PUT /api/admin/products/[id] - Update product
- ✅ DELETE /api/admin/products/[id] - Delete product

---

## ❌ Tính Năng Chưa Có (Từ CMS Mẫu - fullcode.txt)

### 1. ProductFormV3 - Advanced Sections

#### A. ProductDetailsSection ❌
**Mục đích:** Thông tin chi tiết sản phẩm nâng cao

**Tính năng:**
- [ ] Age recommendation (độ tuổi phù hợp)
- [ ] Care instructions (hướng dẫn bảo quản)
- [ ] Safety information (thông tin an toàn)
- [ ] Product specifications (thông số kỹ thuật chi tiết)
- [ ] Size guide (hướng dẫn chọn size)
- [ ] Material details (chi tiết chất liệu)
- [ ] Warranty information (thông tin bảo hành)

**File cần tạo:**
- `components/admin/products/ProductDetailsSection.tsx`

---

#### B. GiftFeaturesSection ❌
**Mục đích:** Tính năng quà tặng (Gift Order System)

**Tính năng:**
- [ ] Gift wrapping options (tùy chọn gói quà)
- [ ] Gift message (tin nhắn quà tặng)
- [ ] Gift card support (hỗ trợ thẻ quà tặng)
- [ ] Gift delivery date (ngày giao quà)
- [ ] Gift recipient info (thông tin người nhận)
- [ ] Gift categories (danh mục quà tặng)
- [ ] Gift suggestions (gợi ý quà tặng)

**File cần tạo:**
- `components/admin/products/GiftFeaturesSection.tsx`
- `components/product/GiftFeaturesSection.tsx` (frontend)

**Database fields cần thêm:**
```typescript
{
  giftWrapping: boolean;
  giftMessageEnabled: boolean;
  giftCardEnabled: boolean;
  giftCategories: string[];
  giftSuggestions: string[];
}
```

---

#### C. MediaExtendedSection ❌
**Mục đích:** Quản lý media mở rộng

**Tính năng:**
- [ ] Video upload/embed (video sản phẩm)
- [ ] 360° view images (ảnh xoay 360 độ)
- [ ] Image gallery với drag & drop reorder
- [ ] Image alt text management
- [ ] Image optimization preview
- [ ] Thumbnail generation
- [ ] Image compression settings

**File cần tạo:**
- `components/admin/products/MediaExtendedSection.tsx`

**Database fields cần thêm:**
```typescript
{
  videos: Array<{
    url: string;
    type: 'youtube' | 'vimeo' | 'upload';
    thumbnail?: string;
  }>;
  view360Images: string[];
  imageAltTexts: Record<string, string>; // imageUrl -> altText
}
```

---

#### D. CollectionComboSection ❌
**Mục đích:** Bộ sưu tập & Combo sản phẩm

**Tính năng:**
- [ ] Product collections (bộ sưu tập)
- [ ] Combo products (sản phẩm combo)
- [ ] Bundle products (sản phẩm bundle)
- [ ] Related products (sản phẩm liên quan)
- [ ] Upsell products (sản phẩm upsell)
- [ ] Cross-sell products (sản phẩm cross-sell)
- [ ] Product sets (bộ sản phẩm)

**File cần tạo:**
- `components/admin/products/CollectionComboSection.tsx`

**Database fields cần thêm:**
```typescript
{
  collections: string[]; // Collection IDs
  comboProducts: string[]; // Product IDs
  bundleProducts: Array<{
    productId: string;
    quantity: number;
    discount?: number;
  }>;
  relatedProducts: string[];
  upsellProducts: string[];
  crossSellProducts: string[];
}
```

---

#### E. VariantFormEnhanced ❌
**Mục đích:** Form biến thể nâng cao

**Tính năng:**
- [ ] Color picker với color code (hex/rgb)
- [ ] Variant images (ảnh cho từng variant)
- [ ] Variant SKU auto-generation
- [ ] Variant stock alerts (cảnh báo hết hàng)
- [ ] Variant pricing rules (quy tắc giá)
- [ ] Variant bulk operations (thao tác hàng loạt)
- [ ] Variant templates (mẫu variant)

**File cần tạo:**
- `components/admin/products/VariantFormEnhanced.tsx`

**Database fields cần thêm:**
```typescript
{
  variants: Array<{
    id: string;
    size: string;
    color?: string;
    colorCode?: string; // hex/rgb
    price: number;
    stock: number;
    image?: string; // Variant-specific image
    sku?: string;
    stockAlertThreshold?: number; // Cảnh báo khi stock < threshold
    pricingRule?: {
      type: 'fixed' | 'percentage' | 'formula';
      value: number;
    };
  }>;
}
```

---

### 2. Advanced Product Features

#### A. SEO Fields ❌
**Tính năng:**
- [ ] SEO title (meta title)
- [ ] SEO description (meta description)
- [ ] SEO keywords
- [ ] Open Graph image
- [ ] Schema.org markup
- [ ] Canonical URL
- [ ] Robots meta tags

**Database fields cần thêm:**
```typescript
{
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  robotsMeta?: string;
}
```

---

#### B. Product Reviews Management ❌
**Tính năng:**
- [ ] Review moderation
- [ ] Review ratings display
- [ ] Review replies
- [ ] Review helpfulness votes
- [ ] Review photos
- [ ] Review filters

**Files cần tạo:**
- `app/admin/products/[id]/reviews/page.tsx`
- `components/admin/ProductReviews.tsx`

---

#### C. Product Analytics ❌
**Tính năng:**
- [ ] View count
- [ ] Click count
- [ ] Conversion rate
- [ ] Sales statistics
- [ ] Popular variants
- [ ] Search keywords

**Database fields cần thêm:**
```typescript
{
  analytics: {
    views: number;
    clicks: number;
    conversions: number;
    popularVariants: string[];
    searchKeywords: string[];
  };
}
```

---

#### D. Product Bulk Operations ❌
**Tính năng:**
- [ ] Bulk edit (sửa hàng loạt)
- [ ] Bulk delete (xóa hàng loạt)
- [ ] Bulk status change (đổi trạng thái hàng loạt)
- [ ] Bulk category assignment (gán danh mục hàng loạt)
- [ ] Bulk price update (cập nhật giá hàng loạt)
- [ ] Bulk stock update (cập nhật tồn kho hàng loạt)
- [ ] Import/Export (CSV/Excel)

**Files cần tạo:**
- `app/admin/products/bulk/page.tsx`
- `components/admin/BulkProductOperations.tsx`

---

#### E. Product Duplicate/Clone ❌
**Tính năng:**
- [ ] Duplicate product
- [ ] Clone with variants
- [ ] Clone with images
- [ ] Clone with categories

**API Route cần thêm:**
- `POST /api/admin/products/[id]/duplicate`

---

#### F. Product Templates ❌
**Tính năng:**
- [ ] Save as template
- [ ] Load from template
- [ ] Template library
- [ ] Template categories

**Database collection cần thêm:**
- `product_templates`

---

#### G. Product Scheduling ❌
**Tính năng:**
- [ ] Schedule publish
- [ ] Schedule unpublish
- [ ] Schedule price change
- [ ] Schedule stock update

**Database fields cần thêm:**
```typescript
{
  scheduledPublish?: Date;
  scheduledUnpublish?: Date;
  scheduledPrice?: {
    price: number;
    date: Date;
  };
}
```

---

#### H. Product Import/Export ❌
**Tính năng:**
- [ ] CSV import
- [ ] Excel import
- [ ] JSON import
- [ ] WooCommerce import
- [ ] CSV export
- [ ] Excel export
- [ ] JSON export

**Files cần tạo:**
- `app/admin/products/import/page.tsx`
- `app/admin/products/export/page.tsx`
- `scripts/import-products.ts`
- `scripts/export-products.ts`

---

### 3. Advanced Variant Features

#### A. Variant Attributes ❌
**Tính năng:**
- [ ] Custom attributes (thuộc tính tùy chỉnh)
- [ ] Attribute groups (nhóm thuộc tính)
- [ ] Attribute filters (bộ lọc thuộc tính)
- [ ] Attribute combinations (tổ hợp thuộc tính)

**Database fields cần thêm:**
```typescript
{
  attributes: Array<{
    name: string;
    slug: string;
    type: 'select' | 'color' | 'image' | 'text';
    options: string[];
    required: boolean;
  }>;
}
```

---

#### B. Variant Stock Management ❌
**Tính năng:**
- [ ] Stock alerts (cảnh báo tồn kho)
- [ ] Low stock threshold
- [ ] Backorder management
- [ ] Stock history
- [ ] Stock locations (nhiều kho)

**Database fields cần thêm:**
```typescript
{
  stockManagement: {
    lowStockThreshold: number;
    backorderEnabled: boolean;
    stockLocations: Array<{
      location: string;
      stock: number;
    }>;
  };
}
```

---

## 📋 KẾ HOẠCH ĐỒNG BỘ

### Phase 1: Core Advanced Sections (Ưu tiên cao)
1. ProductDetailsSection
2. VariantFormEnhanced
3. SEO Fields

### Phase 2: Gift & Media Features (Ưu tiên cao)
1. GiftFeaturesSection
2. MediaExtendedSection

### Phase 3: Collections & Relations (Ưu tiên trung bình)
1. CollectionComboSection
2. Related/Upsell/Cross-sell products

### Phase 4: Advanced Operations (Ưu tiên trung bình)
1. Product Duplicate/Clone
2. Bulk Operations
3. Product Templates

### Phase 5: Analytics & Reviews (Ưu tiên thấp)
1. Product Analytics
2. Product Reviews Management

### Phase 6: Import/Export (Ưu tiên thấp)
1. CSV/Excel Import
2. CSV/Excel Export
3. WooCommerce Import

---

## 🎯 NEXT STEPS

1. **Review và prioritize:** Xác định tính năng nào cần thiết nhất
2. **Create database schema:** Thêm các fields/collections cần thiết
3. **Create components:** Bắt đầu với Phase 1
4. **Update API routes:** Thêm endpoints cho các tính năng mới
5. **Testing:** Test từng tính năng sau khi implement

---

**Status:** 📝 Analysis Complete - Ready for Implementation Planning

