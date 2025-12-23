# ⚠️ LEGACY WORDPRESS DIRECTORY

> **⚠️ LEGACY CODE - KHÔNG CÒN SỬ DỤNG**  
> This directory contains legacy WordPress/WooCommerce code from the old system.  
> **Current System:** Custom CMS with MongoDB  
> **Status:** These files are kept for historical reference only.

---

## 📁 Contents

This directory contains WordPress custom functions that were used during the WordPress/WooCommerce phase:

1. **`functions-custom.php`** - Custom PHP functions for WordPress
   - Auto-calculate Volumetric Weight
   - CORS headers for Next.js
   - GraphQL guest checkout permissions

2. **`plugin-custom-functions.php`** - Plugin version of custom functions
   - Same functionality as `functions-custom.php` but packaged as a WordPress plugin

3. **`README_INSTALL.md`** - Installation guide for WordPress setup
   - Instructions for installing custom functions
   - Troubleshooting guide

---

## ✅ Migration Status

### Volumetric Weight Calculation
- **Old (WordPress):** PHP function `calculate_volumetric_weight()` in `functions-custom.php`
- **New (MongoDB/Custom CMS):** TypeScript function `calculateVolumetricWeight()` in `lib/utils/shipping.ts`
- **Status:** ✅ **MIGRATED**

### CORS Headers
- **Old (WordPress):** PHP function `add_cors_http_header()` in `functions-custom.php`
- **New (MongoDB/Custom CMS):** Next.js API routes handle CORS automatically
- **Status:** ✅ **MIGRATED** (no longer needed)

### GraphQL Guest Checkout
- **Old (WordPress):** PHP filters in `functions-custom.php`
- **New (MongoDB/Custom CMS):** Handled in Next.js API routes (`app/api/payment/*`)
- **Status:** ✅ **MIGRATED**

---

## 🗑️ Can Be Deleted?

**Recommendation:** ⚠️ **KEEP FOR NOW** (historical reference)

These files can be safely deleted if:
- ✅ You're 100% sure you won't need to reference the old WordPress implementation
- ✅ All migration scripts have been completed
- ✅ No documentation references these files

**However, it's recommended to keep them for:**
- 📚 Historical reference
- 🔍 Debugging migration issues
- 📖 Understanding the old system architecture

---

## 📝 Current Implementation

### Volumetric Weight
**Location:** `lib/utils/shipping.ts`
```typescript
export function calculateVolumetricWeight(
  length: number | null | undefined,
  width: number | null | undefined,
  height: number | null | undefined
): number {
  const l = Number(length) || 0;
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  if (l <= 0 || w <= 0 || h <= 0) return 0;
  return (l * w * h) / 6000;
}
```

**Used in:**
- `app/api/admin/products/route.ts` - Auto-calculate when creating products
- `app/api/admin/products/[id]/route.ts` - Auto-calculate when updating products
- `lib/services/shipping.ts` - Shipping cost calculation

### CORS
**Location:** Next.js API routes automatically handle CORS
- No manual CORS configuration needed
- Next.js handles CORS for API routes automatically

---

## 🔗 Related Documentation

- `PLAN_DON_DEP_MA_NGUON.md` - Cleanup plan
- `docs/WORDPRESS_SETUP_GUIDE.md` - Legacy WordPress setup guide (marked as LEGACY)
- `lib/utils/shipping.ts` - Current volumetric weight implementation

---

**Last Updated:** 2025-12-13  
**Status:** ✅ All functions migrated to MongoDB/Custom CMS
