# 🎨 PRODUCT MODULE - FRONTEND COMPONENTS REFERENCE

**Last Updated:** 2025-12-17  
**Status:** 📚 Long-term Reference Document  
**Parent Document:** [PRODUCT_MODULE_REFERENCE.md](../PRODUCT_MODULE_REFERENCE.md)

---

## 4. FRONTEND COMPONENTS

### 4.1 Admin Components (`components/admin/products/`)

#### ProductForm.tsx
**Purpose:** Main product creation/editing form  
**Location:** `components/admin/products/ProductForm.tsx`

**Key Features:**
- Multi-section form (Basic Info, Pricing, Images, Variants, SEO, etc.)
- Optimistic locking (version field)
- Slug auto-generation (on create only)
- Price validation (salePrice < regularPrice)
- Image upload via Media Library
- Variant management
- Form state management with `useForm` (react-hook-form)

**Important Props:**
```typescript
interface ProductFormProps {
  productId?: string;
  initialData?: MappedProduct;
  onSuccess?: (product: MappedProduct) => void;
}
```

#### ProductList.tsx
**Purpose:** Admin product listing page  
**Location:** `components/admin/products/ProductList.tsx`

**Key Features:**
- Data grid with sorting, filtering, pagination
- Bulk actions (delete, status change)
- Search functionality
- Trash management
- Inline editing (status, stock)

#### ProductQuickEditDialog.tsx
**Purpose:** Quick edit dialog for rapid product updates  
**Location:** `components/admin/products/ProductQuickEditDialog.tsx`

**Key Features:**
- Quick edit form for essential product fields
- Responsive design (Dialog on desktop, Sheet on mobile)
- Dirty check with confirmation dialog
- Optimistic locking support
- Variant inline editing
- Auto-sync stock status
- Form validation with Zod

**Editable Fields:**
- Name, SKU, Status
- Regular Price, Sale Price
- Stock Management (manageStock, stockQuantity, stockStatus)
- Variants (SKU, price, stock per variant)

**Important Props:**
```typescript
interface ProductQuickEditDialogProps {
  product: MappedProduct;
  open: boolean;
  onClose: () => void;
  onSuccess?: (updatedProduct: MappedProduct) => void;
}
```

**Usage:**
```typescript
<ProductQuickEditDialog
  product={product}
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={(updated) => {
    // Refresh product list
    refetch();
  }}
/>
```

**Business Logic:**
- Auto-sync stock status when stock quantity changes
- Prevent form reset when initialData changes during editing
- Preserve variant display fields (size, color, colorCode, image) when updating
- Handle salePrice clearing (null value)
- Version mismatch handling with user-friendly error messages

#### VariantQuickEditTable.tsx
**Purpose:** Inline variant editing table within Quick Edit dialog  
**Location:** `components/admin/products/VariantQuickEditTable.tsx`

**Key Features:**
- Click-to-edit cells (SKU, price, stock)
- Bulk update mode (apply to all variants)
- Real-time validation
- Preserves display fields (size, color, colorCode, image)
- Mobile-optimized table layout

**Important Props:**
```typescript
interface VariantQuickEditTableProps {
  variants: Variant[];
  onVariantsChange: (variants: Variant[]) => void;
  bulkUpdate: boolean;
  onBulkUpdateChange: (enabled: boolean) => void;
}
```

**Variant Structure:**
```typescript
interface Variant {
  id: string;
  size: string;
  color?: string;
  colorCode?: string;
  price: number;
  stock?: number;
  image?: string;
  sku?: string;
}
```

#### ProductDetailsSection.tsx
**Purpose:** Product details form section  
**Location:** `components/admin/products/ProductDetailsSection.tsx`

**Fields:**
- Age recommendation
- Care instructions
- Safety information
- Product specifications
- Size guide
- Material details
- Warranty information

#### VariantFormEnhanced.tsx
**Purpose:** Enhanced variant management  
**Location:** `components/admin/products/VariantFormEnhanced.tsx`

**Features:**
- Add/remove variants
- Size and color selection
- Price and stock per variant
- Variant-specific images
- SKU generation

#### SEOMetaBox.tsx
**Purpose:** SEO optimization section  
**Location:** `components/admin/products/SEOMetaBox.tsx`

**Features:**
- SEO title with length indicator
- Meta description with character counter
- Focus keyword
- Slug editing
- Google snippet preview
- Social sharing preview (OG tags)

### 4.2 Public Components (`components/product/`)

#### ProductCard.tsx
**Purpose:** Product card for listings  
**Location:** `components/product/ProductCard.tsx`

**Features:**
- Product image with fallback
- Product name and price
- Size/color options (up to 4 each)
- Add to cart button
- Gift button
- Badge support (new, hot, sale)
- Mobile-optimized

#### ProductInfo.tsx
**Purpose:** Product detail page main component  
**Location:** `components/product/ProductInfo.tsx`

**Features:**
- Product name and price
- Variation selector (size, color)
- Quantity selector
- Add to cart
- Product description
- Product highlights
- Trust badges

#### ProductGallery.tsx
**Purpose:** Product image gallery  
**Location:** `components/product/ProductGallery.tsx`

**Features:**
- Main image display
- Thumbnail navigation
- Zoom functionality
- Image lazy loading
- Next.js Image optimization

#### ProductFilters.tsx
**Purpose:** Product filtering component  
**Location:** `components/product/ProductFilters.tsx`

**Features:**
- Price range filter
- Size filter
- Color filter
- Category filter
- Sort options
- Mobile and desktop layouts
- URL sync

#### ProductList.tsx
**Purpose:** Product listing page  
**Location:** `components/product/ProductList.tsx`

**Features:**
- Grid/List view toggle
- Pagination
- Loading states
- Empty states
- Error handling

---

**See Also:**
- [Backend API](./API.md)
- [Hooks & Utilities](./HOOKS.md)
- [Business Logic](./BUSINESS_LOGIC.md)
- [Main Reference](../PRODUCT_MODULE_REFERENCE.md)

