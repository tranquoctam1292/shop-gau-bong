'use client';

import { useForm, UseFormRegister, UseFormSetValue, UseFormWatch, UseFormGetValues, UseFormReset, FieldErrors, FormState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useRef } from 'react';
import { quickEditSchema } from '../schema';
import type { QuickEditFormData } from '../types';
import type { MappedProduct } from '@/lib/utils/productMapper';
import type { ProductWithVariants } from '@/lib/hooks/useProduct';
import { parsePrice, parsePriceOptional } from '@/lib/utils/typeConverters';

/**
 * Hook for Quick Edit Form Setup
 * 
 * PHASE 3.1: Extract Form Setup Logic
 * 
 * Handles:
 * - Form initialization with react-hook-form
 * - initialData calculation from product
 * - snapshotInitialData management
 * - formInitialized state with 150ms delay
 * 
 * @param product - Product data (optional for bulk mode)
 * @param productWithVariants - Product with variants data (optional)
 * @param isBulkMode - Whether in bulk edit mode
 * @param open - Whether dialog is open
 * @param onResetSnapshot - Callback when snapshot is reset
 * @returns Form methods and state
 */

interface UseQuickEditFormOptions {
  product?: MappedProduct;
  productWithVariants?: ProductWithVariants | null;
  isBulkMode: boolean;
  open: boolean;
  onResetSnapshot?: (snapshot: QuickEditFormData | null) => void;
  externalSnapshot?: QuickEditFormData | null; // Allow external control of snapshot (for template loading, etc.)
}

export function useQuickEditForm({
  product,
  productWithVariants,
  isBulkMode,
  open,
  onResetSnapshot,
  externalSnapshot,
}: UseQuickEditFormOptions) {
  // Store initial data snapshot when dialog opens to prevent comparison issues
  const [snapshotInitialData, setSnapshotInitialData] = useState<QuickEditFormData | null>(null);
  
  // CRITICAL FIX: Track if form has been initialized (reset completed) to prevent false positive isDirty
  const [formInitialized, setFormInitialized] = useState(false);
  
  // CRITICAL FIX: Track if form initialization check has been performed (prevents re-checking on every field change)
  const formInitializedCheckedRef = useRef(false);

  // Initialize form data from product (single mode) or empty (bulk mode)
  const initialData = useMemo<QuickEditFormData>(() => {
    // PHASE 2: Bulk Edit Mode (4.2.5) - Start with empty/default values
    if (isBulkMode) {
      return {
        name: '',
        sku: '',
        status: 'draft',
        manageStock: false,
        regularPrice: 0,
        salePrice: undefined,
        stockQuantity: 0,
        stockStatus: 'instock',
        version: 1,
        bulkUpdate: true, // Mark as bulk update
        weight: undefined,
        length: undefined,
        width: undefined,
        height: undefined,
        lowStockThreshold: undefined,
        categories: [],
        tags: [],
        _thumbnail_id: undefined,
        _product_image_gallery: undefined,
        seoTitle: '',
        seoDescription: '',
        slug: '',
        costPrice: undefined,
        productType: 'simple',
        visibility: 'public',
        password: '',
        shippingClass: undefined,
        taxStatus: 'taxable',
        taxClass: undefined,
        barcode: undefined,
        gtin: undefined,
        ean: undefined,
        soldIndividually: undefined,
        backorders: undefined,
        variants: [],
      };
    }
    
    const currentProduct = productWithVariants || product;
    if (!currentProduct) {
      // Fallback empty data if no product
      return {
        name: '',
        sku: '',
        status: 'draft',
        manageStock: false,
        regularPrice: 0,
        salePrice: undefined,
        stockQuantity: 0,
        stockStatus: 'instock',
        version: 1,
        bulkUpdate: false,
        weight: undefined,
        length: undefined,
        width: undefined,
        height: undefined,
        lowStockThreshold: undefined,
        categories: [],
        tags: [],
        _thumbnail_id: undefined,
        _product_image_gallery: undefined,
        seoTitle: '',
        seoDescription: '',
        slug: '',
        costPrice: undefined,
        productType: 'simple',
        visibility: 'public',
        password: '',
        shippingClass: undefined,
        taxStatus: 'taxable',
        taxClass: undefined,
        barcode: undefined,
        gtin: undefined,
        ean: undefined,
        soldIndividually: undefined,
        backorders: undefined,
        variants: [],
      };
    }

    // Type-safe access to product properties
    const productAny = currentProduct as Record<string, unknown>;
    const regularPriceValue = productAny.regularPrice;
    const salePriceValue = productAny.salePrice;
    const weightValue = productAny.weight;
    const categoriesValue = productAny.categories;
    const tagsValue = productAny.tags;
    const galleryImagesValue = productAny.galleryImages;
    
    // Type-safe access to string properties
    const slugValue = productAny.slug;
    const nameValue = productAny.name;
    const skuValue = productAny.sku;
    const shortDescriptionValue = productAny.shortDescription;
    
    // Get variants from productWithVariants (from API) or product (fallback)
    const productVariants = (currentProduct as unknown as ProductWithVariants).variants || [];
    
    return {
      name: typeof nameValue === 'string' ? nameValue : '',
      sku: typeof skuValue === 'string' ? skuValue : '',
      status: currentProduct.status || 'draft',
      manageStock: currentProduct.stockQuantity !== null && currentProduct.stockQuantity !== undefined,
      // PHASE 2: Type Mismatch Fix (7.8.1) - Use type-safe conversion helpers
      regularPrice: parsePrice(regularPriceValue as string | number | null | undefined, 0),
      salePrice: parsePriceOptional(salePriceValue as string | number | null | undefined),
      stockQuantity: typeof currentProduct.stockQuantity === 'number' ? currentProduct.stockQuantity : 0,
      stockStatus: (currentProduct.stockStatus as 'instock' | 'outofstock' | 'onbackorder') || 'instock',
      // Fix #22: Default version to 1 if undefined (for optimistic locking)
      version: currentProduct.version || 1,
      bulkUpdate: false,
      // PHASE 1: Weight & Dimensions (4.1.3)
      weight: weightValue && typeof weightValue === 'string' ? parseFloat(weightValue) : undefined,
      length: typeof currentProduct.length === 'number' ? currentProduct.length : undefined,
      width: typeof currentProduct.width === 'number' ? currentProduct.width : undefined,
      height: typeof currentProduct.height === 'number' ? currentProduct.height : undefined,
      // PHASE 1: Low Stock Threshold (4.1.4) - Get from productDataMetaBox if available
      lowStockThreshold: (currentProduct as any).productDataMetaBox?.lowStockThreshold ?? undefined,
      // PHASE 1: Categories & Tags (4.1.1)
      categories: Array.isArray(categoriesValue) 
        ? categoriesValue.map((cat: any) => String(cat?.id || cat?.databaseId || cat)) 
        : [],
      tags: Array.isArray(tagsValue)
        ? tagsValue.map((tag: any) => typeof tag === 'string' ? tag : tag?.name || '')
        : [],
      // PHASE 1: Featured Image & Gallery (4.1.2)
      _thumbnail_id: (currentProduct as any)._thumbnail_id || ((currentProduct.image as any)?.id) || undefined,
      _product_image_gallery: (currentProduct as any)._product_image_gallery || 
        (Array.isArray(galleryImagesValue) && galleryImagesValue.length > 0
          ? galleryImagesValue.map((img: any) => img?.id).filter(Boolean).join(',')
          : undefined),
      // PHASE 2: SEO Fields (4.2.1)
      seoTitle: (currentProduct as any).seo?.seoTitle || (typeof nameValue === 'string' ? nameValue : ''),
      seoDescription: (currentProduct as any).seo?.seoDescription || (typeof shortDescriptionValue === 'string' ? shortDescriptionValue : ''),
      slug: typeof slugValue === 'string' ? slugValue : '',
      // PHASE 2: Cost Price (4.2.2)
      costPrice: (currentProduct as any).productDataMetaBox?.costPrice ?? undefined,
      // PHASE 2: Product Type & Visibility (4.2.3)
      productType: (currentProduct as any).productDataMetaBox?.productType || 'simple',
      visibility: (currentProduct as any).visibility || 'public',
      password: (currentProduct as any).password || '',
      // PHASE 2: Shipping Class & Tax Settings (4.2.4)
      shippingClass: (currentProduct as any).productDataMetaBox?.shippingClass || '__none__',
      taxStatus: (currentProduct as any).productDataMetaBox?.taxStatus || 'taxable',
      taxClass: (currentProduct as any).productDataMetaBox?.taxClass || '__none__',
      // PHASE 3: Barcode/GTIN/EAN (4.3.1)
      barcode: (currentProduct as any).productDataMetaBox?.barcode || undefined,
      gtin: (currentProduct as any).productDataMetaBox?.gtin || undefined,
      ean: (currentProduct as any).productDataMetaBox?.ean || undefined,
      // PHASE 3: Sold Individually (4.3.3)
      soldIndividually: (currentProduct as any).productDataMetaBox?.soldIndividually ?? false,
      // PHASE 3: Backorders Settings (4.3.4)
      backorders: (currentProduct as any).productDataMetaBox?.backorders || 'no',
      // PHASE 3: Product Options (4.3.2) - Attributes for enable/disable (not stored in form, calculated from productDataMetaBox)
      variants: productVariants.map((v: any) => ({
        id: v.id || '',
        sku: v.sku || '',
        price: (typeof v.price === 'number' && !isNaN(v.price)) ? v.price : 0,
        stock: (typeof v.stock === 'number' && !isNaN(v.stock)) 
          ? v.stock 
          : (typeof v.stockQuantity === 'number' && !isNaN(v.stockQuantity)) 
            ? v.stockQuantity 
            : 0,
        // Include size, color, colorCode for display (not editable in form, but needed for VariantQuickEditTable)
        size: v.size || '',
        // Preserve color and colorCode (trim empty strings to undefined)
        color: (v.color && typeof v.color === 'string' && v.color.trim()) ? v.color.trim() : undefined,
        colorCode: (v.colorCode && typeof v.colorCode === 'string' && v.colorCode.trim()) ? v.colorCode.trim() : undefined,
        image: v.image || undefined,
      })),
    };
  }, [product, productWithVariants, isBulkMode]);

  // Initialize react-hook-form
  const form = useForm<QuickEditFormData>({
    resolver: zodResolver(quickEditSchema),
    defaultValues: initialData,
  });
  
  const {
    register,
    setValue,
    watch,
    getValues,
    reset,
    handleSubmit,
    formState,
  } = form;
  
  const { errors } = formState;

  // Reset form when dialog opens (only once, not when initialData changes)
  // CRITICAL FIX #17: Prevent form reset when initialData changes during editing
  useEffect(() => {
    // If externalSnapshot is provided, use it (for template loading, save success, etc.)
    // Otherwise, use initialData when dialog opens
    const dataToUse = externalSnapshot !== undefined && externalSnapshot !== null 
      ? externalSnapshot 
      : (open && initialData ? initialData : null);
    
    if (open && dataToUse) {
      // CRITICAL FIX: Reset form first, then set snapshot
      // This ensures form values are ready before isDirty check
      reset(dataToUse, { keepDefaultValues: false });
      // Snapshot initial data after reset to ensure stable comparison
      setSnapshotInitialData(dataToUse);
      // CRITICAL FIX: Mark form as not initialized initially
      // formInitialized will be set to true after a delay to ensure form is fully reset
      setFormInitialized(false);
      formInitializedCheckedRef.current = false;
      
      // Notify parent component about snapshot reset
      if (onResetSnapshot) {
        onResetSnapshot(dataToUse);
      }
    } else if (!open) {
      // Clear snapshot when dialog closes
      setSnapshotInitialData(null);
      setFormInitialized(false); // Reset form initialized flag when dialog closes
      formInitializedCheckedRef.current = false; // Reset checked flag when dialog closes
      
      // Notify parent component about snapshot reset
      if (onResetSnapshot) {
        onResetSnapshot(null);
      }
    }
    // Remove initialData from dependencies to prevent reset during editing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset, onResetSnapshot, externalSnapshot]);

  // CRITICAL FIX: Set formInitialized to true after form has been reset
  // Use a delay to ensure form values are fully synchronized after reset()
  useEffect(() => {
    if (open && snapshotInitialData && !formInitializedCheckedRef.current) {
      // Use requestAnimationFrame twice + setTimeout to ensure form is fully reset
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Additional delay to ensure all form values are synchronized
          const timer = setTimeout(() => {
            setFormInitialized(true);
            formInitializedCheckedRef.current = true;
          }, 150); // 150ms delay to ensure form is fully reset
          
          // Cleanup function is not needed here as timer will complete
          // If dialog closes before timer completes, the effect will re-run and reset formInitialized
          return () => {
            clearTimeout(timer);
          };
        });
      });
    } else if (!open) {
      // Reset checked flag when dialog closes
      formInitializedCheckedRef.current = false;
    }
  }, [open, snapshotInitialData]); // Only depend on open and snapshotInitialData

  return {
    // Form methods
    register,
    setValue,
    watch,
    getValues,
    reset,
    handleSubmit,
    
    // Form state
    errors,
    formState,
    
    // Initial data
    initialData,
    snapshotInitialData,
    formInitialized,
  };
}

