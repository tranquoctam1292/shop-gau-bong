# 📊 Schema Context - WooCommerce REST API

**Last Updated:** 2025-01-XX  
**API Method:** WooCommerce REST API (v3)  
**Base URL:** `/wp-json/wc/v3/`

---

## 🔄 Migration Note

**⚠️ IMPORTANT:** Project đã migrated từ **WPGraphQL** sang **WooCommerce REST API** để tránh compatibility issues và duplicate field errors.

**Previous:** WPGraphQL với GraphQL queries  
**Current:** WooCommerce REST API với Next.js API routes proxy  
**Status:** ✅ Migration completed. All GraphQL references removed.

---

## 📦 WooCommerce Product Structure

### Core Product Fields

```typescript
interface WooCommerceProduct {
  id: number;                    // Product ID
  name: string;                  // Product name
  slug: string;                  // URL slug
  type: 'simple' | 'variable' | 'grouped' | 'external';
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured: boolean;             // Featured product flag
  price: string;                  // Current price (sale or regular)
  regular_price: string;         // Regular price
  sale_price: string;            // Sale price (empty if not on sale)
  on_sale: boolean;              // Is on sale?
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  sku: string;                    // SKU
  description: string;           // Full description
  short_description: string;     // Short description
}
```

### Product Images

```typescript
images: Array<{
  id: number;
  src: string;                    // Image URL
  name: string;                   // Image filename
  alt: string;                    // Alt text
}>;
```

**Usage:**
- First image (`images[0]`) = Main product image
- Remaining images = Gallery images

### Product Categories

```typescript
categories: Array<{
  id: number;
  name: string;
  slug: string;
}>;
```

### Product Tags

```typescript
tags: Array<{
  id: number;
  name: string;
  slug: string;
}>;
```

### Product Dimensions

```typescript
dimensions: {
  length: string;    // e.g., "30" (cm)
  width: string;    // e.g., "25" (cm)
  height: string;   // e.g., "35" (cm)
};
weight: string;     // e.g., "0.5" (kg)
```

---

## 🎯 ACF Custom Fields (Meta Data)

**⚠️ CRITICAL:** ACF fields được lưu trong `meta_data` array, không phải direct properties.

### Meta Data Structure

```typescript
meta_data: Array<{
  id: number;
  key: string;        // ACF field key
  value: any;         // ACF field value
}>;
```

### ACF Fields for Products

| Field Key | Type | Description | Usage |
|-----------|------|-------------|-------|
| `length` | `number` | Chiều dài (cm) | Shipping calculation |
| `width` | `number` | Chiều rộng (cm) | Shipping calculation |
| `height` | `number` | Chiều cao (cm) | Shipping calculation |
| `volumetric_weight` | `number` | Cân nặng quy đổi thể tích | Shipping calculation |
| `material` | `string` | Chất liệu | Product specs |
| `origin` | `string` | Xuất xứ | Product specs |

### Accessing ACF Fields

**Helper Function:**
```typescript
// lib/api/woocommerce.ts
export function getMetaValue(
  metaData: Array<{ key: string; value: any }>,
  key: string
): any {
  const meta = metaData?.find((m) => m.key === key);
  return meta?.value;
}
```

**Usage:**
```typescript
const length = getMetaValue(product.meta_data, 'length');
const width = getMetaValue(product.meta_data, 'width');
const height = getMetaValue(product.meta_data, 'height');
const volumetricWeight = getMetaValue(product.meta_data, 'volumetric_weight');
```

---

## 📐 Product Mapper

**File:** `lib/utils/productMapper.ts`

Maps WooCommerce REST API format → Frontend format (tương thích với components hiện tại).

### Mapped Product Type

```typescript
interface MappedProduct {
  databaseId: number;             // WooCommerce product ID
  id: string;                     // Legacy format (for compatibility)
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  onSale: boolean;
  image: {
    sourceUrl: string;
    altText: string;
  } | null;
  galleryImages: Array<{
    sourceUrl: string;
    altText: string;
  }>;
  length: number | null;          // From ACF meta_data
  width: number | null;           // From ACF meta_data
  height: number | null;          // From ACF meta_data
  volumetricWeight: number | null; // From ACF meta_data
  material: string | null;        // From ACF meta_data
  origin: string | null;          // From ACF meta_data
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  stockStatus: string;
  stockQuantity: number | null;
  weight: string | null;
}
```

**Mapping Function:**
```typescript
import { mapWooCommerceProduct } from '@/lib/utils/productMapper';

const mappedProduct = mapWooCommerceProduct(wcProduct);
```

---

## 🛒 WooCommerce Order Structure

### Order Create Input

```typescript
interface WooCommerceOrderCreateInput {
  payment_method: string;         // e.g., 'cod', 'bacs', 'momo'
  payment_method_title: string;   // e.g., 'Thanh toán khi nhận hàng (COD)'
  set_paid: boolean;              // false for COD/bank transfer
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2?: string;
    city: string;
    postcode: string;
    country: string;              // e.g., 'VN'
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    product_id: number;
    quantity: number;
  }>;
  shipping_lines?: Array<{
    method_id: string;
    method_title: string;
    total: string;
  }>;
  customer_note?: string;
}
```

### Order Response

```typescript
interface WooCommerceOrder {
  id: number;
  number: string;                 // Order number (display)
  status: string;                 // e.g., 'pending', 'processing', 'completed'
  date_created: string;           // ISO 8601 format
  total: string;                  // Total amount
  currency: string;               // e.g., 'VND'
  payment_method: string;
  payment_method_title: string;
  billing: { /* ... */ };
  shipping: { /* ... */ };
  line_items: Array<{
    id: number;
    name: string;
    sku: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  shipping_total: string;
  total_tax: string;
  customer_note?: string;
}
```

---

## 📂 WooCommerce Category Structure

```typescript
interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  count: number;                  // Product count
  image: {
    src: string;
    alt: string;
  } | null;
}
```

---

## 🔌 API Endpoints (via Next.js Proxy)

**⚠️ IMPORTANT:** All WooCommerce REST API calls go through Next.js API routes to secure credentials.

### Products

- `GET /api/woocommerce/products` - List products
- `GET /api/woocommerce/products/[id]` - Get single product

**Query Parameters:**
- `per_page`: Number of products (default: 10, max: 100)
- `page`: Page number
- `search`: Search term
- `featured`: `true`/`false` - Featured products only
- `category`: Category slug
- `orderby`: `date`, `popularity`, `price`, `rating`
- `order`: `asc`/`desc`
- `status`: `publish` (default)

### Categories

- `GET /api/woocommerce/categories` - List categories

**Query Parameters:**
- `per_page`: Number of categories (default: 10, max: 100)
- `orderby`: `id`, `name`, `slug`, `count`
- `order`: `asc`/`desc`
- `hide_empty`: `true`/`false` - Hide empty categories

### Orders

- `GET /api/woocommerce/orders` - List orders
- `POST /api/woocommerce/orders` - Create order
- `GET /api/woocommerce/orders/[id]` - Get single order
- `PUT /api/woocommerce/orders/[id]` - Update order

---

## 🔐 Authentication

### WooCommerce REST API Keys

**Environment Variables:**
```env
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx
```

**Alternative: WordPress Application Password**
```env
WORDPRESS_USERNAME=admin
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

**⚠️ SECURITY:** Credentials chỉ được sử dụng trong Next.js API routes (server-side), không expose ra client.

---

## 📝 Important Notes

### 1. Meta Data Access

**Always use helper function:**
```typescript
import { getMetaValue } from '@/lib/api/woocommerce';

const length = getMetaValue(product.meta_data, 'length');
```

**Never access directly:**
```typescript
// ❌ BAD
const length = product.meta_data.find(m => m.key === 'length')?.value;

// ✅ GOOD
const length = getMetaValue(product.meta_data, 'length');
```

### 2. Price Format

**WooCommerce returns prices as strings:**
```typescript
price: "500000"  // 500,000 VND
```

**Format for display:**
```typescript
import { formatPrice } from '@/lib/utils/format';

const displayPrice = formatPrice(product.price); // "500.000₫"
```

### 3. Null/Undefined Handling

**Always check for null/undefined:**
```typescript
// ❌ BAD
const imageUrl = product.images[0].src;

// ✅ GOOD
const imageUrl = product.images?.[0]?.src || '/images/teddy-placeholder.png';
```

### 4. Volumetric Weight Calculation

**Formula:**
```typescript
const volumetricWeight = (length * width * height) / 6000;
const finalWeight = Math.max(actualWeight || 0, volumetricWeight || 0);
```

**ACF Field:** `volumetric_weight` (pre-calculated)  
**Fallback:** Calculate from `length`, `width`, `height` if not available

---

---

## 🎨 Product Variations

**⚠️ IMPORTANT:** Variable products support size and color attributes. Variations are fetched lazily to optimize performance.

**URL Query Params:** When users select size/color on ProductCard, the selection is preserved in URL query params (e.g., `?attribute_pa_size=60cm&attribute_pa_color=do`). ProductInfo component automatically reads these params and pre-selects the variation on product detail page.

### Variation Structure

```typescript
interface WooCommerceVariation {
  id: number;                      // Variation ID
  price: string;                   // Variation price
  regular_price: string;           // Regular price
  sale_price: string;              // Sale price (if on sale)
  on_sale: boolean;                 // Is on sale?
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  attributes: Array<{
    id: number;
    name: string;                  // e.g., 'pa_size', 'pa_color'
    option: string;                // e.g., '60cm', '#FF0000'
  }>;
  image: {
    src: string;
    alt: string;
  } | null;
}
```

### Product Attributes

```typescript
interface WooCommerceProductAttribute {
  id: number;
  name: string;                    // e.g., 'pa_size', 'pa_color'
  slug: string;                    // e.g., 'pa-size', 'pa-color'
  options: string[];               // Available options
  variation: boolean;               // Can be used for variations
  visible: boolean;                 // Show in product page
}
```

### Fetching Variations

**API Route:**
- `GET /api/woocommerce/products/[id]/variations` - Get all variations for a product

**Hook:**
```typescript
import { useProductVariations } from '@/lib/hooks/useProductVariations';

// Lazy loading: Only fetch when needed
const { data: variations, isLoading } = useProductVariations(productId, {
  enabled: isHovered || selectedSize !== null, // Fetch on hover or size selection
});
```

**React Query Caching:**
- Variations are cached for 5 minutes (`staleTime: 5 * 60 * 1000`)
- Automatic request deduplication (same productId = single request)
- Background refetching enabled

### Usage in ProductCard

```typescript
// Display size options (up to 4)
const sizeAttribute = product.attributes?.find(a => a.name === 'pa_size');
const displaySizes = sizeAttribute?.options.slice(0, 4) || [];

// Display color options (up to 4)
const colorAttribute = product.attributes?.find(a => a.name === 'pa_color');
const displayColors = colorAttribute?.options.slice(0, 4) || [];

// Dynamic pricing based on selected variation
const selectedVariation = variations?.find(v => 
  v.attributes.some(a => a.name === 'pa_size' && a.option === selectedSize)
);
const displayPrice = selectedVariation?.price || product.price;
```

---

## ⚡ React Query Integration

**Provider:** `lib/providers/QueryProvider.tsx`

**Configuration:**
- `staleTime`: 5 minutes (default)
- `gcTime`: 10 minutes (garbage collection)
- `retry`: 1 time on failure
- `refetchOnWindowFocus`: false (to reduce unnecessary requests)

**Usage:**
```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['variations', productId],
  queryFn: () => fetchVariations(productId),
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
});
```

**Benefits:**
- Automatic caching and deduplication
- Background refetching
- Loading and error states
- Optimistic updates support

---

## 🔗 Related Files

- `lib/api/woocommerce.ts` - REST API client
- `lib/utils/productMapper.ts` - Product mapper
- `types/woocommerce.ts` - TypeScript type definitions (includes `WooCommerceVariation`)
- `app/api/woocommerce/**/route.ts` - Next.js API route proxies
- `lib/hooks/useProductVariations.ts` - React Query hook for variations
- `lib/providers/QueryProvider.tsx` - React Query provider setup

---

## 📚 References

- [WooCommerce REST API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [WooCommerce REST API Authentication](https://woocommerce.github.io/woocommerce-rest-api-docs/#authentication)
- [WooCommerce Product Variations](https://woocommerce.github.io/woocommerce-rest-api-docs/#product-variations)
- [React Query Documentation](https://tanstack.com/query/latest)

