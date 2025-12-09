# 🔄 Migration Plan: WPGraphQL → WooCommerce REST API

## 📋 Tổng quan

**Mục tiêu:** Chuyển từ WPGraphQL WooCommerce sang WooCommerce REST API để tránh compatibility issues và duplicate field errors.

**Lý do:**
- WPGraphQL WooCommerce không tương thích với WooCommerce version mới
- Duplicate field errors trên ProductVariation type
- REST API là native của WooCommerce, ổn định hơn

**Thời gian ước tính:** 3-5 ngày (tùy vào số lượng features)

---

## 🎯 Phân tích tác động

### Files cần thay đổi

#### 1. **Core API Layer** (Priority: HIGH)
- [ ] `lib/api/graphql.ts` → Replace với REST API client
- [ ] `lib/api/queries/products.graphql` → Replace với REST API functions
- [ ] `lib/api/mutations/order.graphql` → Replace với REST API functions
- [ ] `lib/api/mutations/cart.graphql` → Replace với REST API functions
- [ ] `lib/api/queries/cart.graphql` → Replace với REST API functions
- [ ] `lib/api/queries/orders.graphql` → Replace với REST API functions
- [ ] `codegen.ts` → Remove hoặc update (không cần GraphQL codegen nữa)

#### 2. **Hooks** (Priority: HIGH)
- [ ] `lib/hooks/useProductsWithFilters.ts` → Rewrite với REST API
- [ ] `lib/hooks/useProduct.ts` → Rewrite với REST API
- [ ] `lib/hooks/useCategories.ts` → Rewrite với REST API
- [ ] `lib/hooks/useCheckout.ts` → Rewrite với REST API
- [ ] `lib/hooks/useCartSync.ts` → Update (có thể giữ nguyên local cart logic)
- [ ] `lib/hooks/useOrderActions.ts` → Rewrite với REST API
- [ ] `lib/hooks/useShippingEstimate.ts` → Update (có thể giữ nguyên logic)

#### 3. **Components** (Priority: MEDIUM)
- [ ] `components/product/ProductCard.tsx` → Update data structure
- [ ] `components/product/ProductList.tsx` → Update data structure
- [ ] `components/home/CategoryGrid.tsx` → Update data structure
- [ ] `app/(shop)/products/page.tsx` → Update data fetching
- [ ] `app/(shop)/products/[slug]/page.tsx` → Update data fetching
- [ ] `app/(shop)/checkout/page.tsx` → Update order creation
- [ ] `app/(shop)/order-confirmation/page.tsx` → Update order fetching

#### 4. **API Routes** (Priority: HIGH)
- [ ] `app/api/invoice/[orderId]/route.ts` → Update order fetching

#### 5. **Utilities** (Priority: LOW)
- [ ] `lib/utils/format.ts` → Có thể giữ nguyên
- [ ] `lib/utils/shipping.ts` → Có thể giữ nguyên
- [ ] `lib/utils/invoice.ts` → Update data structure

#### 6. **Providers** (Priority: MEDIUM)
- [ ] `lib/providers/apollo-provider.tsx` → Replace với REST API provider (optional)

#### 7. **Type Definitions** (Priority: HIGH)
- [ ] `types/generated/graphql.ts` → Replace với REST API types
- [ ] Tạo `types/woocommerce.ts` → Define REST API response types

---

## 🚀 Migration Phases

### **Phase 1: Setup REST API Client** (Day 1)

#### Step 1.1: Install Dependencies
```bash
# Không cần install thêm, chỉ cần fetch API
# WooCommerce REST API là built-in
```

#### Step 1.2: Create REST API Client
**File mới:** `lib/api/woocommerce.ts`

```typescript
/**
 * WooCommerce REST API Client
 * Base URL: /wp-json/wc/v3/
 * Authentication: Consumer Key & Consumer Secret (hoặc Application Password)
 */

const WOOCOMMERCE_API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_URL + '/wp-json/wc/v3';
const CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

// Helper function để tạo Basic Auth header
function getAuthHeader(): string {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
}

// Generic fetch function
async function wcFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${WOOCOMMERCE_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const wcApi = {
  // Products
  getProducts: (params?: Record<string, any>) => wcFetch<any[]>(`/products?${new URLSearchParams(params)}`),
  getProduct: (id: number) => wcFetch<any>(`/products/${id}`),
  searchProducts: (search: string, params?: Record<string, any>) => 
    wcFetch<any[]>(`/products?search=${encodeURIComponent(search)}&${new URLSearchParams(params)}`),
  
  // Categories
  getCategories: (params?: Record<string, any>) => wcFetch<any[]>(`/products/categories?${new URLSearchParams(params)}`),
  getCategory: (id: number) => wcFetch<any>(`/products/categories/${id}`),
  
  // Orders
  createOrder: (data: any) => wcFetch<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrder: (id: number) => wcFetch<any>(`/orders/${id}`),
  updateOrder: (id: number, data: any) => 
    wcFetch<any>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Cart (WooCommerce REST API không có cart endpoint, cần dùng session hoặc local cart)
  // Cart sẽ vẫn dùng local storage như hiện tại
};
```

#### Step 1.3: Create Type Definitions
**File mới:** `types/woocommerce.ts`

```typescript
/**
 * WooCommerce REST API Type Definitions
 * Based on WooCommerce REST API v3 documentation
 */

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    options: string[];
  }>;
  default_attributes: any[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: Array<{
    id: number;
    key: string;
    value: string | number | object;
  }>;
  // ACF fields sẽ nằm trong meta_data với key như 'length', 'width', 'height', 'volumetric_weight'
  weight?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  manage_stock: boolean;
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
}

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: string;
  image: {
    id: number;
    src: string;
    name: string;
    alt: string;
  } | null;
  menu_order: number;
  count: number;
}

export interface WooCommerceOrder {
  id: number;
  parent_id: number;
  status: string;
  currency: string;
  date_created: string;
  date_modified: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  customer_id: number;
  order_key: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_paid: string | null;
  date_completed: string | null;
  cart_hash: string;
  meta_data: Array<{
    id: number;
    key: string;
    value: string | number | object;
  }>;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    tax_class: string;
    subtotal: string;
    subtotal_tax: string;
    total: string;
    total_tax: string;
    sku: string;
    price: string;
    meta_data: Array<{
      id: number;
      key: string;
      value: string | number | object;
    }>;
  }>;
  shipping_lines: Array<{
    id: number;
    method_title: string;
    method_id: string;
    total: string;
    total_tax: string;
  }>;
  fee_lines: any[];
  coupon_lines: any[];
  refunds: any[];
  customer_note: string;
}

export interface WooCommerceOrderCreateInput {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
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

#### Step 1.4: Environment Variables
**File:** `.env.local`

```env
# WooCommerce REST API
NEXT_PUBLIC_WORDPRESS_URL=http://localhost/wordpress
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note:** Cần tạo Consumer Key & Secret trong WordPress:
1. Vào **WooCommerce > Settings > Advanced > REST API**
2. Click **"Add key"**
3. Set permissions: **Read/Write**
4. Copy Consumer Key & Secret

---

### **Phase 2: Migrate Products** (Day 2)

#### Step 2.1: Create Product Hooks
**File mới:** `lib/hooks/useProductsREST.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { wcApi } from '@/lib/api/woocommerce';
import type { WooCommerceProduct } from '@/types/woocommerce';

export function useProductsREST(params?: {
  per_page?: number;
  page?: number;
  category?: string;
  search?: string;
  orderby?: string;
  order?: 'asc' | 'desc';
}) {
  const [products, setProducts] = useState<WooCommerceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const data = await wcApi.getProducts(params);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch products'));
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [JSON.stringify(params)]);

  return { products, loading, error };
}
```

#### Step 2.2: Create Product Detail Hook
**File mới:** `lib/hooks/useProductREST.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { wcApi } from '@/lib/api/woocommerce';
import type { WooCommerceProduct } from '@/types/woocommerce';

export function useProductREST(id: number) {
  const [product, setProduct] = useState<WooCommerceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const data = await wcApi.getProduct(id);
        setProduct(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch product'));
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProduct();
    }
  }, [id]);

  return { product, loading, error };
}
```

#### Step 2.3: Create Categories Hook
**File mới:** `lib/hooks/useCategoriesREST.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { wcApi } from '@/lib/api/woocommerce';
import type { WooCommerceCategory } from '@/types/woocommerce';

export function useCategoriesREST(params?: {
  per_page?: number;
  page?: number;
  orderby?: string;
  order?: 'asc' | 'desc';
}) {
  const [categories, setCategories] = useState<WooCommerceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const data = await wcApi.getCategories(params);
        setCategories(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [JSON.stringify(params)]);

  return { categories, loading, error };
}
```

#### Step 2.4: Update Components
- Update `components/product/ProductCard.tsx` để sử dụng `WooCommerceProduct` type
- Update `components/home/CategoryGrid.tsx` để sử dụng `useCategoriesREST`
- Update `app/(shop)/products/page.tsx` để sử dụng `useProductsREST`
- Update `app/(shop)/products/[slug]/page.tsx` để sử dụng `useProductREST`

#### Step 2.5: Helper Functions
**File mới:** `lib/utils/productMapper.ts`

```typescript
/**
 * Map WooCommerce REST API product to frontend format
 */
import type { WooCommerceProduct } from '@/types/woocommerce';

export interface MappedProduct {
  id: number;
  databaseId: number;
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
  description: string;
  shortDescription: string;
  sku: string;
  stockStatus: string;
  stockQuantity: number | null;
  weight: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  volumetricWeight: number | null;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

export function mapWooCommerceProduct(wcProduct: WooCommerceProduct): MappedProduct {
  // Extract ACF fields from meta_data
  const length = wcProduct.meta_data.find(m => m.key === 'length')?.value as number | undefined;
  const width = wcProduct.meta_data.find(m => m.key === 'width')?.value as number | undefined;
  const height = wcProduct.meta_data.find(m => m.key === 'height')?.value as number | undefined;
  const volumetricWeight = wcProduct.meta_data.find(m => m.key === 'volumetric_weight')?.value as number | undefined;

  return {
    id: wcProduct.id,
    databaseId: wcProduct.id,
    name: wcProduct.name,
    slug: wcProduct.slug,
    price: wcProduct.price,
    regularPrice: wcProduct.regular_price,
    salePrice: wcProduct.sale_price || '',
    onSale: wcProduct.on_sale,
    image: wcProduct.images?.[0] ? {
      sourceUrl: wcProduct.images[0].src,
      altText: wcProduct.images[0].alt || wcProduct.name,
    } : null,
    galleryImages: wcProduct.images?.slice(1).map(img => ({
      sourceUrl: img.src,
      altText: img.alt || wcProduct.name,
    })) || [],
    description: wcProduct.description || '',
    shortDescription: wcProduct.short_description || '',
    sku: wcProduct.sku || '',
    stockStatus: wcProduct.stock_status,
    stockQuantity: wcProduct.stock_quantity,
    weight: wcProduct.weight || null,
    length: length || null,
    width: width || null,
    height: height || null,
    volumetricWeight: volumetricWeight || null,
    categories: wcProduct.categories || [],
  };
}
```

---

### **Phase 3: Migrate Orders** (Day 3)

#### Step 3.1: Create Order Hook
**File mới:** `lib/hooks/useCheckoutREST.ts`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { wcApi } from '@/lib/api/woocommerce';
import { useCartStore } from '@/lib/store/cartStore';
import type { WooCommerceOrderCreateInput } from '@/types/woocommerce';

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  billingAddress1: string;
  billingAddress2?: string;
  billingCity: string;
  billingPostcode: string;
  billingCountry: string;
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingCity?: string;
  shippingPostcode?: string;
  shippingCountry?: string;
  shippingMethod?: string;
  paymentMethod: 'bacs' | 'cod' | 'momo' | 'bank_transfer';
  customerNote?: string;
}

export function useCheckoutREST() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitOrder = async (formData: CheckoutFormData) => {
    setIsProcessing(true);
    setError(null);

    try {
      const lineItems = items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      }));

      const shippingAddress = {
        first_name: formData.shippingFirstName || formData.firstName,
        last_name: formData.shippingLastName || formData.lastName,
        address_1: formData.shippingAddress1 || formData.billingAddress1,
        address_2: formData.shippingAddress2 || formData.billingAddress2 || '',
        city: formData.shippingCity || formData.billingCity,
        postcode: formData.shippingPostcode || formData.billingPostcode,
        country: formData.shippingCountry || formData.billingCountry,
      };

      const orderInput: WooCommerceOrderCreateInput = {
        payment_method: formData.paymentMethod,
        payment_method_title: getPaymentMethodTitle(formData.paymentMethod),
        set_paid: formData.paymentMethod === 'cod' ? false : false, // COD không paid ngay
        billing: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address_1: formData.billingAddress1,
          address_2: formData.billingAddress2 || '',
          city: formData.billingCity,
          postcode: formData.billingPostcode,
          country: formData.billingCountry,
        },
        shipping: shippingAddress,
        line_items: lineItems,
      };

      if (formData.shippingMethod) {
        orderInput.shipping_lines = [
          {
            method_id: formData.shippingMethod,
            method_title: 'Shipping',
            total: '0',
          },
        ];
      }

      if (formData.customerNote) {
        orderInput.customer_note = formData.customerNote;
      }

      const order = await wcApi.createOrder(orderInput);

      clearCart();
      if (formData.paymentMethod) {
        localStorage.setItem(`order_${order.id}_paymentMethod`, formData.paymentMethod);
      }
      router.push(`/order-confirmation?orderId=${order.id}&paymentMethod=${formData.paymentMethod}&total=${getTotalPrice()}`);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.');
      console.error('Order creation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    submitOrder,
    isProcessing,
    error,
    cartItems: items,
    totalPrice: getTotalPrice(),
  };
}

function getPaymentMethodTitle(method: string): string {
  const titles: Record<string, string> = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bacs: 'Chuyển khoản ngân hàng (VietQR)',
    momo: 'Ví MoMo',
    bank_transfer: 'Chuyển khoản ngân hàng',
  };
  return titles[method] || method;
}
```

#### Step 3.2: Update Checkout Page
- Update `app/(shop)/checkout/page.tsx` để sử dụng `useCheckoutREST` thay vì `useCheckout`

#### Step 3.3: Update Order Confirmation
- Update `app/(shop)/order-confirmation/page.tsx` để fetch order từ REST API

#### Step 3.4: Update Invoice API Route
- Update `app/api/invoice/[orderId]/route.ts` để fetch order từ REST API

#### Step 3.5: Update Order Actions
- Update `lib/hooks/useOrderActions.ts` để sử dụng REST API

---

### **Phase 4: Cleanup & Testing** (Day 4-5)

#### Step 4.1: Remove GraphQL Dependencies
- [ ] Remove `@apollo/client` from `package.json` (nếu không dùng cho blog posts)
- [ ] Remove `@graphql-codegen/*` packages
- [ ] Remove `lib/api/graphql.ts`
- [ ] Remove `codegen.ts`
- [ ] Remove all `.graphql` files (hoặc giữ lại cho blog posts nếu cần)

#### Step 4.2: Update Providers
- [ ] Update `lib/providers/apollo-provider.tsx` → Remove hoặc chỉ dùng cho blog posts
- [ ] Update `app/layout.tsx` → Remove ApolloProvider nếu không cần

#### Step 4.3: Update Environment Variables
- [ ] Update `.env.example` với WooCommerce REST API credentials
- [ ] Update documentation

#### Step 4.4: Testing Checklist
- [ ] Test product listing
- [ ] Test product detail page
- [ ] Test category filtering
- [ ] Test search
- [ ] Test add to cart
- [ ] Test checkout flow
- [ ] Test order creation
- [ ] Test order confirmation
- [ ] Test invoice download
- [ ] Test order cancellation
- [ ] Test shipping calculation
- [ ] Test mobile responsiveness

---

## ⚠️ Rủi ro & Lưu ý

### 1. **ACF Fields trong REST API**
- ACF fields không tự động expose trong WooCommerce REST API
- **Giải pháp:** Sử dụng `meta_data` array hoặc custom endpoint

### 2. **Cart Management**
- WooCommerce REST API không có cart endpoint
- **Giải pháp:** Tiếp tục dùng local cart (như hiện tại)

### 3. **Authentication**
- REST API cần Consumer Key & Secret
- **Giải pháp:** Store credentials trong environment variables

### 4. **Rate Limiting**
- REST API có rate limiting
- **Giải pháp:** Implement caching và request throttling

### 5. **Type Safety**
- Mất type safety từ GraphQL codegen
- **Giải pháp:** Define types manually trong `types/woocommerce.ts`

---

## 📚 Tài liệu tham khảo

- WooCommerce REST API Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/
- WooCommerce REST API Authentication: https://woocommerce.github.io/woocommerce-rest-api-docs/#authentication
- WooCommerce REST API Products: https://woocommerce.github.io/woocommerce-rest-api-docs/#products

---

## ✅ Checklist tổng thể

### Phase 1: Setup
- [ ] Create REST API client (`lib/api/woocommerce.ts`)
- [ ] Create type definitions (`types/woocommerce.ts`)
- [ ] Setup environment variables
- [ ] Create Consumer Key & Secret trong WordPress

### Phase 2: Products
- [ ] Create `useProductsREST` hook
- [ ] Create `useProductREST` hook
- [ ] Create `useCategoriesREST` hook
- [ ] Create product mapper utility
- [ ] Update product components
- [ ] Update product pages

### Phase 3: Orders
- [ ] Create `useCheckoutREST` hook
- [ ] Update checkout page
- [ ] Update order confirmation page
- [ ] Update invoice API route
- [ ] Update order actions hook

### Phase 4: Cleanup
- [ ] Remove GraphQL dependencies
- [ ] Remove GraphQL files
- [ ] Update providers
- [ ] Update documentation
- [ ] Testing

---

## 🎯 Next Steps

1. **Review plan này với team**
2. **Setup WordPress REST API credentials**
3. **Bắt đầu Phase 1: Setup REST API Client**
4. **Test từng phase trước khi chuyển sang phase tiếp theo**

