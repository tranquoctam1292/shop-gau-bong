# 🪝 PRODUCT MODULE - HOOKS & UTILITIES REFERENCE

**Last Updated:** 2025-12-17  
**Status:** 📚 Long-term Reference Document  
**Parent Document:** [PRODUCT_MODULE_REFERENCE.md](../PRODUCT_MODULE_REFERENCE.md)

---

## 5. HOOKS & UTILITIES

### 5.1 Data Fetching Hooks

#### useProductsREST
**Location:** `lib/hooks/useProductsREST.ts`

**Purpose:** Fetch products list with filters

**Usage:**
```typescript
const { products, loading, error, currentPage, totalPages, totalProducts } = useProductsREST(12); // perPage = 12
// Filters are managed via useProductFilters hook
```

**Return Values:**
- `products` - Array of `MappedProduct[]`
- `loading` - Boolean loading state
- `error` - Error object or null
- `currentPage` - Current page number
- `totalPages` - Total number of pages
- `totalProducts` - Total number of products

#### useProductREST
**Location:** `lib/hooks/useProductREST.ts`

**Purpose:** Fetch single product by ID or slug

**Usage:**
```typescript
const { data: product, isLoading } = useProductREST('product-id');
```

#### useProductVariations
**Location:** `lib/hooks/useProductVariations.ts`

**Purpose:** Fetch product variations (lazy loading)

**Usage:**
```typescript
const { variations, isLoading, error, refetch } = useProductVariations(productId, {
  enabled: true  // Optional: only fetch when enabled is true
});
```

**Return Values:**
- `variations` - Array of `MongoVariant[]`
- `isLoading` - Boolean loading state
- `error` - Error object or null
- `refetch` - Function to manually refetch

### 5.2 Filter Hooks

#### useProductFilters
**Location:** `lib/hooks/useProductFilters.ts`

**Purpose:** Manage product filter state and URL sync

**Usage:**
```typescript
const {
  filters,
  updateFilter,
  clearFilters,
  applyFilters,
} = useProductFilters();
```

#### useProductAttributes
**Location:** `lib/hooks/useProductAttributes.ts`

**Purpose:** Fetch available product attributes (sizes, colors)

**Usage:**
```typescript
const { sizes, colors, isLoading } = useProductAttributes();
```

### 5.3 Utility Hooks

#### useProductPrice
**Location:** `lib/hooks/useProductPrice.ts`

**Purpose:** Calculate product price with variations

**Usage:**
```typescript
const { displayPrice, isOnSale, discountPercentage, priceRange } = useProductPrice(
  product,
  selectedVariation
);
```

**Return Values:**
- `displayPrice` - String price for display
- `isOnSale` - Boolean indicating if product is on sale
- `discountPercentage` - Number (0-100) discount percentage
- `regularPrice` - String regular price
- `salePrice` - String sale price (if on sale)
- `priceRange` - Object with `min` and `max` for variable products

#### useQuickUpdateProduct
**Location:** `lib/hooks/useQuickUpdateProduct.ts`

**Purpose:** Quick update product via API with loading state and error handling

**Usage:**
```typescript
const { quickUpdate, isLoading } = useQuickUpdateProduct({
  onSuccess: (updatedProduct) => {
    // Handle success
    refetch();
  },
  onError: (error) => {
    // Handle error (already shows toast)
    if (error.message === 'VERSION_MISMATCH') {
      // Handle version mismatch
    }
  },
});

// Update product
await quickUpdate(productId, {
  name: 'New Name',
  regularPrice: 500000,
  salePrice: 400000,
  version: currentVersion,
});
```

**Return Values:**
- `quickUpdate` - Function to update product
- `isLoading` - Boolean loading state

**QuickUpdateOptions Interface:**
```typescript
interface QuickUpdateOptions {
  name?: string;
  sku?: string;
  status?: 'draft' | 'publish' | 'trash';
  manageStock?: boolean;
  regularPrice?: number;
  salePrice?: number | null;  // null to clear
  stockQuantity?: number;
  stockStatus?: 'instock' | 'outofstock' | 'onbackorder';
  version?: number;  // For optimistic locking
  variants?: Array<{
    id: string;
    sku?: string;
    price?: number;
    stock?: number;
  }>;
}
```

**Error Handling:**
- Automatically shows toast notifications
- Handles `VERSION_MISMATCH` error (409 Conflict)
- Returns `null` on error, updated product on success

#### useVariationMatcher
**Location:** `lib/hooks/useVariationMatcher.ts`

**Purpose:** Match product variations by size/color

**Usage:**
```typescript
const matchedVariation = useVariationMatcher(
  product,
  selectedSize,
  selectedColor
);
```

### 5.4 Utility Functions

#### productMapper.ts
**Location:** `lib/utils/productMapper.ts`

**Functions:**
- `mapMongoProduct()` - Map MongoDB product to frontend format
- `mapMongoCategory()` - Map MongoDB category to frontend format

**Important:** Always use mapper functions, never access MongoDB fields directly.

#### skuGenerator.ts
**Location:** `lib/utils/skuGenerator.ts`

**Functions:**
- `generateSKU()` - Generate unique SKU
- `validateSKU()` - Validate SKU format

#### sanitizeHtml.ts
**Location:** `lib/utils/sanitizeHtml.ts`

**Functions:**
- `sanitizeHtml()` - Sanitize HTML content (XSS protection)
- `stripHtmlTags()` - Remove HTML tags for display

---

**See Also:**
- [Backend API](./API.md)
- [Frontend Components](./COMPONENTS.md)
- [Business Logic](./BUSINESS_LOGIC.md)
- [Main Reference](../PRODUCT_MODULE_REFERENCE.md)

