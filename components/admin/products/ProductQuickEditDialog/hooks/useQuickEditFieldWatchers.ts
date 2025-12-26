/**
 * Field Watchers Hook for Quick Edit
 * 
 * PHASE 6: Extract Field Watching Logic
 * 
 * Centralizes all watch() calls to reduce code duplication
 */

'use client';

import { useMemo } from 'react';
import type { UseFormWatch } from 'react-hook-form';
import type { QuickEditFormData } from '../types';

export interface UseQuickEditFieldWatchersOptions {
  watch: UseFormWatch<QuickEditFormData>;
}

export interface UseQuickEditFieldWatchersResult {
  // Basic fields
  name: string;
  sku: string | undefined;
  status: 'draft' | 'publish' | 'trash';
  manageStock: boolean;
  regularPrice: number;
  salePrice: number | undefined;
  costPrice: number | undefined;
  stockQuantity: number;
  currentStockStatus: 'instock' | 'outofstock' | 'onbackorder';
  
  // Categories & Tags
  selectedCategories: string[];
  selectedTags: string[];
  
  // Images
  featuredImageId: string | undefined;
  galleryImageIds: string | undefined;
  
  // Weight & Dimensions
  weight: number | undefined;
  length: number | undefined;
  width: number | undefined;
  height: number | undefined;
  lowStockThreshold: number | undefined;
  
  // SEO
  seoTitle: string | undefined;
  seoDescription: string | undefined;
  slug: string | undefined;
  
  // Product Type & Visibility
  productType: 'simple' | 'variable' | 'grouped' | 'external' | undefined;
  visibility: 'public' | 'private' | 'password' | undefined;
  password: string | undefined;
  
  // Shipping & Tax
  shippingClass: string | undefined;
  taxStatus: 'taxable' | 'shipping' | 'none' | undefined;
  taxClass: string | undefined;
  
  // Barcode/GTIN/EAN
  barcode: string | undefined;
  gtin: string | undefined;
  ean: string | undefined;
  
  // Other
  soldIndividually: boolean | undefined;
  backorders: 'no' | 'notify' | 'yes' | undefined;
  variants: QuickEditFormData['variants'];
  bulkUpdate: boolean;
}

export function useQuickEditFieldWatchers({
  watch,
}: UseQuickEditFieldWatchersOptions): UseQuickEditFieldWatchersResult {
  // Watch all form fields
  const name = watch('name');
  const sku = watch('sku');
  const status = watch('status');
  const manageStock = watch('manageStock');
  const regularPrice = watch('regularPrice');
  const salePrice = watch('salePrice');
  const costPrice = watch('costPrice');
  const stockQuantity = watch('stockQuantity');
  const currentStockStatus = watch('stockStatus');
  
  // PHASE 1: Categories & Tags (4.1.1)
  // Wrap in useMemo to prevent dependency issues in other hooks
  const categoriesValue = watch('categories');
  const tagsValue = watch('tags');
  const selectedCategories = useMemo(() => categoriesValue || [], [categoriesValue]);
  const selectedTags = useMemo(() => tagsValue || [], [tagsValue]);
  
  // PHASE 1: Featured Image & Gallery (4.1.2)
  const featuredImageId = watch('_thumbnail_id');
  const galleryImageIds = watch('_product_image_gallery');
  
  // PHASE 1: Weight & Dimensions (4.1.3) & Low Stock Threshold (4.1.4)
  const weight = watch('weight');
  const length = watch('length');
  const width = watch('width');
  const height = watch('height');
  const lowStockThreshold = watch('lowStockThreshold');
  
  // PHASE 2: SEO fields (4.2.1)
  const seoTitle = watch('seoTitle');
  const seoDescription = watch('seoDescription');
  const slug = watch('slug');
  
  // PHASE 2: Product Type & Visibility (4.2.3)
  const productType = watch('productType');
  const visibility = watch('visibility');
  const password = watch('password');
  
  // PHASE 2: Shipping Class & Tax Settings (4.2.4)
  const shippingClass = watch('shippingClass');
  const taxStatus = watch('taxStatus');
  const taxClass = watch('taxClass');
  
  // PHASE 3: Barcode/GTIN/EAN (4.3.1)
  const barcode = watch('barcode');
  const gtin = watch('gtin');
  const ean = watch('ean');
  
  // PHASE 3: Sold Individually (4.3.3)
  const soldIndividually = watch('soldIndividually');
  
  // PHASE 3: Backorders Settings (4.3.4)
  const backorders = watch('backorders');
  
  const variants = watch('variants');
  const bulkUpdate = watch('bulkUpdate');

  return {
    name,
    sku,
    status,
    manageStock,
    regularPrice,
    salePrice,
    costPrice,
    stockQuantity,
    currentStockStatus,
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
    variants,
    bulkUpdate,
  };
}

