/**
 * Dirty Check Helpers
 * 
 * PHASE 6: Extract isDirty Check Function
 * 
 * Pure utility functions for checking if form is dirty
 */

import type { QuickEditFormData } from '../types';

export interface IsDirtyCheckOptions {
  open: boolean;
  snapshotInitialData: QuickEditFormData | null;
  formInitialized: boolean;
  name: string;
  sku: string;
  status: string;
  manageStock: boolean;
  regularPrice: string;
  salePrice: string;
  stockQuantity: number | null;
  currentStockStatus: string;
  costPrice: string | null;
  formData: {
    variants?: Array<{ id: string; sku?: string; price?: number; stock?: number }>;
  };
  selectedCategories: string[];
  selectedTags: string[];
  featuredImageId: string | undefined;
  galleryImageIds: string | undefined;
  weight: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  lowStockThreshold: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  slug: string | null;
  productType: string;
  visibility: string;
  password: string | null;
  shippingClass: string | null;
  taxStatus: string;
  taxClass: string | null;
  barcode: string | null;
  gtin: string | null;
  ean: string | null;
  soldIndividually: boolean;
  backorders: string;
  normalizeValue: (value: unknown) => string;
}

/**
 * Check if form is dirty (has unsaved changes)
 * 
 * PHASE 1: Dirty Check Optimization (7.7.2) - Optimized with early exit and memoization
 */
export function isDirtyCheck(options: IsDirtyCheckOptions): boolean {
  const {
    open,
    snapshotInitialData,
    formInitialized,
    name,
    sku,
    status,
    manageStock,
    regularPrice,
    salePrice,
    stockQuantity,
    currentStockStatus,
    costPrice,
    formData,
    selectedCategories,
    selectedTags,
    featuredImageId,
    galleryImageIds,
    weight,
    length,
    width,
    height,
    lowStockThreshold,
    seoTitle,
    seoDescription,
    slug,
    productType,
    visibility,
    password,
    shippingClass,
    taxStatus,
    taxClass,
    barcode,
    gtin,
    ean,
    soldIndividually,
    backorders,
    normalizeValue,
  } = options;

  // CRITICAL FIX: Only check isDirty if form has been initialized (reset completed)
  // This prevents false positive when dialog just opened and form hasn't been reset yet
  // formInitialized is set after reset() completes (150ms delay), ensuring form values are ready for comparison
  if (!open) return false;
  if (!snapshotInitialData || !formInitialized) return false;

  const baseData = snapshotInitialData;

  // Early exit checks - return immediately on first difference
  if (normalizeValue(name) !== normalizeValue(baseData.name)) return true;
  if (normalizeValue(sku) !== normalizeValue(baseData.sku)) return true;
  if (status !== baseData.status) return true;
  if (manageStock !== baseData.manageStock) return true;
  if (normalizeValue(regularPrice) !== normalizeValue(baseData.regularPrice)) return true;
  if (normalizeValue(salePrice) !== normalizeValue(baseData.salePrice)) return true;
  if (normalizeValue(stockQuantity) !== normalizeValue(baseData.stockQuantity)) return true;
  if (currentStockStatus !== baseData.stockStatus) return true;
  
  // PHASE 1: Check new fields (categories, tags, images, weight, dimensions, lowStockThreshold)
  const currentCategories = selectedCategories || [];
  const initialCategories = baseData.categories || [];
  if (currentCategories.length !== initialCategories.length ||
      currentCategories.some((id, i) => id !== initialCategories[i])) {
    return true; // Early exit
  }
  
  const currentTags = selectedTags || [];
  const initialTags = baseData.tags || [];
  if (currentTags.length !== initialTags.length ||
      currentTags.some((tag, i) => tag !== initialTags[i])) {
    return true; // Early exit
  }
  
  const currentFeaturedImage = featuredImageId;
  const initialFeaturedImage = baseData._thumbnail_id;
  if (normalizeValue(currentFeaturedImage) !== normalizeValue(initialFeaturedImage)) {
    return true; // Early exit
  }
  
  const currentGallery = galleryImageIds || '';
  const initialGallery = baseData._product_image_gallery || '';
  if (normalizeValue(currentGallery) !== normalizeValue(initialGallery)) {
    return true; // Early exit
  }
  
  // Check weight & dimensions
  if (normalizeValue(weight) !== normalizeValue(baseData.weight)) return true;
  if (normalizeValue(length) !== normalizeValue(baseData.length)) return true;
  if (normalizeValue(width) !== normalizeValue(baseData.width)) return true;
  if (normalizeValue(height) !== normalizeValue(baseData.height)) return true;
  if (normalizeValue(lowStockThreshold) !== normalizeValue(baseData.lowStockThreshold)) return true;
  
  // PHASE 2: Check SEO fields (seoTitle, seoDescription, slug)
  if (normalizeValue(seoTitle) !== normalizeValue(baseData.seoTitle)) return true;
  if (normalizeValue(seoDescription) !== normalizeValue(baseData.seoDescription)) return true;
  if (normalizeValue(slug) !== normalizeValue(baseData.slug)) return true;
  
  // PHASE 2: Check Cost Price (4.2.2)
  if (normalizeValue(costPrice) !== normalizeValue(baseData.costPrice)) return true;
  
  // PHASE 2: Check Product Type & Visibility (4.2.3)
  if (productType !== baseData.productType) return true;
  if (visibility !== baseData.visibility) return true;
  if (normalizeValue(password) !== normalizeValue(baseData.password)) return true;
  
  // PHASE 2: Check Shipping Class & Tax Settings (4.2.4)
  if (normalizeValue(shippingClass) !== normalizeValue(baseData.shippingClass)) return true;
  if (taxStatus !== baseData.taxStatus) return true;
  if (normalizeValue(taxClass) !== normalizeValue(baseData.taxClass)) return true;
  
  // PHASE 3: Check Barcode/GTIN/EAN (4.3.1)
  if (normalizeValue(barcode) !== normalizeValue(baseData.barcode)) return true;
  if (normalizeValue(gtin) !== normalizeValue(baseData.gtin)) return true;
  if (normalizeValue(ean) !== normalizeValue(baseData.ean)) return true;
  
  // PHASE 3: Check Sold Individually (4.3.3)
  if (soldIndividually !== baseData.soldIndividually) return true;
  
  // PHASE 3: Check Backorders Settings (4.3.4)
  if (backorders !== baseData.backorders) return true;
  
  // Custom check for variants (not tracked by react-hook-form's isDirty)
  const currentVariants = formData.variants || [];
  const initialVariants = baseData.variants || [];
  
  // Early exit: Check length first
  if (currentVariants.length !== initialVariants.length) return true;
  
  // Early exit: Check each variant and return immediately on first difference
  for (let i = 0; i < currentVariants.length; i++) {
    const v = currentVariants[i];
    const initial = initialVariants[i];
    if (!initial) return true;
    
    // Normalize and compare variant fields - early exit on first difference
    if (v.id !== initial.id) return true;
    if (normalizeValue(v.sku) !== normalizeValue(initial.sku)) return true;
    if (normalizeValue(v.price) !== normalizeValue(initial.price)) return true;
    if (normalizeValue(v.stock) !== normalizeValue(initial.stock)) return true;
  }
  
  // No changes detected
  return false;
}

