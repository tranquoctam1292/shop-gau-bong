# 💼 PRODUCT MODULE - BUSINESS LOGIC REFERENCE

**Last Updated:** 2025-12-17  
**Status:** 📚 Long-term Reference Document  
**Parent Document:** [PRODUCT_MODULE_REFERENCE.md](../PRODUCT_MODULE_REFERENCE.md)

---

## 7. BUSINESS LOGIC

### 7.1 Pricing Logic

**Price Calculation:**
```typescript
// If variation is selected, use variation price
if (selectedVariation) {
  return String(selectedVariation.price || 0);
}

// For variable products without selected variation, use minPrice
if (product.type === 'variable') {
  return String(product.minPrice || 0);
}

// For simple products, use product price (salePrice if onSale, else regularPrice)
return product.onSale ? product.salePrice : product.price;
```

**Price Display:**
- If `onSale` and `salePrice` exists: Show both `regularPrice` (strikethrough) and `salePrice`
- Otherwise: Show `regularPrice` only
- If price is missing: Show "Liên hệ"

### 7.2 Stock Management

**Stock Status:**
- `instock` - Available for purchase
- `outofstock` - Not available
- `onbackorder` - Available for pre-order

**Stock Check:**
```typescript
const isAvailable = product.stockStatus === 'instock' &&
  (!product.manageStock || (product.stockQuantity ?? 0) > 0);
```

**Variant Stock:**
- Check variant stock if variation is selected
- Fallback to product stock if no variation

### 7.3 Slug Generation

**Rules:**
- Auto-generate from product name (on create only)
- Preserve existing slug (on update)
- Convert to URL-friendly format (lowercase, hyphens)
- Check uniqueness (add random suffix if duplicate)

**Implementation:**
```typescript
// Only generate on create
if (!productId) {
  const baseSlug = slugify(productName);
  const uniqueSlug = await ensureUniqueSlug(baseSlug);
  // ...
}
```

### 7.4 Optimistic Locking

**Purpose:** Prevent concurrent edit conflicts

**Implementation:**
- Each product has `version` field
- Client sends `version` in PUT request
- Server checks `version` matches current version
- If mismatch: Return 409 Conflict error
- If match: Increment version and update

**Client Handling:**
```typescript
try {
  await updateProduct({ ...data, version: currentVersion });
} catch (error) {
  if (error.status === 409) {
    // Version mismatch - reload product
    await refetch();
    showToast('Product was updated by another user. Please refresh.');
  }
}
```

### 7.5 Soft Delete

**Implementation:**
- Set `deletedAt: new Date()` instead of hard delete
- Set `status: 'trash'`
- Public API filters out `deletedAt: null`
- Trash can be restored or permanently deleted

### 7.6 Quick Edit Logic

**Purpose:** Enable rapid updates to essential product fields without opening full edit form

**Auto-Sync Stock Status:**
```typescript
// When stockQuantity is updated:
if (stockQuantity > 0 && stockStatus !== 'onbackorder') {
  stockStatus = 'instock';
} else if (stockQuantity <= 0 && stockStatus !== 'onbackorder') {
  stockStatus = 'outofstock';
}
// Respects onbackorder status and manual overrides
```

**Sale Price Management:**
- Setting `salePrice` automatically clears `salePriceStartDate` and `salePriceEndDate`
- Setting `salePrice: null` clears the sale price field entirely
- Validation: `salePrice` must be < `regularPrice` (if both provided)

**Manage Stock Logic:**
- When `manageStock = false`, automatically sets `stockQuantity = 0`
- When `manageStock = true`, stock fields become editable

**Variant Updates:**
- Only updates provided fields (sku, price, stock)
- Preserves display fields (size, color, colorCode, image)
- Validates variant IDs exist before updating
- Recalculates `minPrice`, `maxPrice`, `totalStock` after update

**Optimistic Locking:**
- Requires `version` field in request
- Returns 409 Conflict if version mismatch
- Frontend handles version mismatch by showing error and allowing retry

**Audit Logging:**
- Creates audit log entry in `adminActivityLogs` collection
- Records old values and changes
- Includes admin ID, IP address, user agent

---

**See Also:**
- [Backend API](./API.md)
- [Frontend Components](./COMPONENTS.md)
- [Hooks & Utilities](./HOOKS.md)
- [Main Reference](../PRODUCT_MODULE_REFERENCE.md)

