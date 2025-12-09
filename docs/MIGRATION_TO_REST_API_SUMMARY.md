# 📋 Migration Summary: WPGraphQL → REST API

## 🎯 Tại sao chuyển sang REST API?

1. **Compatibility Issues:** WPGraphQL WooCommerce không tương thích với WooCommerce version mới
2. **Duplicate Field Errors:** Lỗi duplicate field trên ProductVariation type
3. **Stability:** REST API là native của WooCommerce, ổn định hơn
4. **Maintenance:** Dễ maintain và debug hơn

## 📊 So sánh

| Feature | WPGraphQL | REST API |
|---------|-----------|----------|
| **Type Safety** | ✅ Auto-generated từ schema | ⚠️ Manual types |
| **Over/Under Fetching** | ✅ Chỉ fetch fields cần | ⚠️ Fetch toàn bộ object |
| **Caching** | ✅ Apollo Client cache | ⚠️ Cần implement manual |
| **Compatibility** | ❌ Có issues | ✅ Native, ổn định |
| **Learning Curve** | ⚠️ Cần hiểu GraphQL | ✅ REST API quen thuộc |
| **ACF Fields** | ✅ Tự động expose | ⚠️ Cần qua meta_data |

## 🚀 Migration Timeline

- **Day 1:** Setup REST API Client & Types
- **Day 2:** Migrate Products & Categories
- **Day 3:** Migrate Orders & Checkout
- **Day 4-5:** Cleanup & Testing

## 📝 Files cần thay đổi

### Core Files (HIGH Priority)
- `lib/api/graphql.ts` → `lib/api/woocommerce.ts`
- `lib/hooks/useProductsWithFilters.ts` → `lib/hooks/useProductsREST.ts`
- `lib/hooks/useProduct.ts` → `lib/hooks/useProductREST.ts`
- `lib/hooks/useCategories.ts` → `lib/hooks/useCategoriesREST.ts`
- `lib/hooks/useCheckout.ts` → `lib/hooks/useCheckoutREST.ts`
- `lib/hooks/useOrderActions.ts` → Update với REST API

### Components (MEDIUM Priority)
- `components/product/ProductCard.tsx` → Update data structure
- `components/home/CategoryGrid.tsx` → Update data structure
- `app/(shop)/products/page.tsx` → Update data fetching
- `app/(shop)/products/[slug]/page.tsx` → Update data fetching
- `app/(shop)/checkout/page.tsx` → Update order creation

### API Routes (HIGH Priority)
- `app/api/invoice/[orderId]/route.ts` → Update order fetching

### Remove (After Migration)
- `lib/api/graphql.ts`
- `codegen.ts`
- All `.graphql` files (trừ blog posts nếu cần)
- `@apollo/client` dependency (nếu không dùng cho blog)

## ⚙️ Setup Requirements

### 1. WordPress Setup
1. Vào **WooCommerce > Settings > Advanced > REST API**
2. Click **"Add key"**
3. Set permissions: **Read/Write**
4. Copy **Consumer Key** & **Consumer Secret**

### 2. Environment Variables
```env
NEXT_PUBLIC_WORDPRESS_URL=http://localhost/wordpress
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. ACF Fields trong REST API
ACF fields sẽ nằm trong `meta_data` array:
```typescript
const length = product.meta_data.find(m => m.key === 'length')?.value;
const width = product.meta_data.find(m => m.key === 'width')?.value;
const height = product.meta_data.find(m => m.key === 'height')?.value;
const volumetricWeight = product.meta_data.find(m => m.key === 'volumetric_weight')?.value;
```

## ✅ Quick Start

1. **Review** `docs/MIGRATION_TO_REST_API_PLAN.md` (chi tiết đầy đủ)
2. **Setup** WordPress REST API credentials
3. **Create** `lib/api/woocommerce.ts` (REST API client)
4. **Create** `types/woocommerce.ts` (Type definitions)
5. **Migrate** từng feature một (Products → Orders)
6. **Test** kỹ từng phase trước khi chuyển sang phase tiếp theo

## 🔗 References

- Full Migration Plan: `docs/MIGRATION_TO_REST_API_PLAN.md`
- WooCommerce REST API Docs: https://woocommerce.github.io/woocommerce-rest-api-docs/

