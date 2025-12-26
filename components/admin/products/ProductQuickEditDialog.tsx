'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';
// PHASE 6: Most UI components moved to extracted components - only keep essential imports
import type { MappedProduct } from '@/lib/utils/productMapper';
import { useQuickUpdateProduct } from '@/lib/hooks/useQuickUpdateProduct';
import { useToastContext } from '@/components/providers/ToastProvider';
import { useSkuValidation } from '@/lib/hooks/useSkuValidation';
import { useMobileKeyboard } from '@/lib/hooks/useMobileKeyboard';
import { useCategories } from '@/lib/hooks/useCategories';
import { useProductHistory } from '@/lib/hooks/useProductHistory';
import { LoadingProgressIndicator, type LoadingStep } from './LoadingProgressIndicator';
// PERFORMANCE OPTIMIZATION (2.1.0): Use React Query hook for product fetching
import { useProduct, type ProductWithVariants as UseProductWithVariants } from '@/lib/hooks/useProduct';

// PHASE 1: Preparation - Import types and schema from extracted files
import type { QuickEditFormData, ProductQuickEditDialogProps } from './ProductQuickEditDialog/types';
import { QuickEditFormProvider } from './ProductQuickEditDialog/context/QuickEditFormProvider';
// PHASE 3: Extract Hooks
import { useQuickEditForm } from './ProductQuickEditDialog/hooks/useQuickEditForm';
import { useQuickEditHandlers } from './ProductQuickEditDialog/hooks/useQuickEditHandlers';
import { useQuickEditValidation } from './ProductQuickEditDialog/hooks/useQuickEditValidation';
import { useQuickEditLifecycle } from './ProductQuickEditDialog/hooks/useQuickEditLifecycle';
import { useQuickEditVersionCheck } from './ProductQuickEditDialog/hooks/useQuickEditVersionCheck';
import { useQuickEditKeyboardShortcuts } from './ProductQuickEditDialog/hooks/useQuickEditKeyboardShortcuts';
import { useQuickEditTemplates } from './ProductQuickEditDialog/hooks/useQuickEditTemplates';
import { useQuickEditUndoRedo } from './ProductQuickEditDialog/hooks/useQuickEditUndoRedo';
import { useQuickEditProductSync } from './ProductQuickEditDialog/hooks/useQuickEditProductSync';
import { useQuickEditProgressiveLoading } from './ProductQuickEditDialog/hooks/useQuickEditProgressiveLoading';
import { useQuickEditFieldWatchers } from './ProductQuickEditDialog/hooks/useQuickEditFieldWatchers';
// PHASE 2: Extract Form Sections
import { DimensionsSection } from './ProductQuickEditDialog/sections/DimensionsSection';
import { ShippingSection } from './ProductQuickEditDialog/sections/ShippingSection';
import { ProductTypeSection } from './ProductQuickEditDialog/sections/ProductTypeSection';
import { SeoSection } from './ProductQuickEditDialog/sections/SeoSection';
import { InventorySection } from './ProductQuickEditDialog/sections/InventorySection';
import { PricingSection } from './ProductQuickEditDialog/sections/PricingSection';
import { BasicInfoSection } from './ProductQuickEditDialog/sections/BasicInfoSection';
import { CategoriesSection } from './ProductQuickEditDialog/sections/CategoriesSection';
import { ImagesSection } from './ProductQuickEditDialog/sections/ImagesSection';
import { VariantsSection } from './ProductQuickEditDialog/sections/VariantsSection';
import { ProductOptionsSection } from './ProductQuickEditDialog/sections/ProductOptionsSection';
// PHASE 4: Extract Components
import { QuickEditDialogHeader } from './ProductQuickEditDialog/components/QuickEditDialogHeader';
import { QuickEditDialogFooter } from './ProductQuickEditDialog/components/QuickEditDialogFooter';
import { QuickEditSkipLinks } from './ProductQuickEditDialog/components/QuickEditSkipLinks';
import { QuickEditComparisonDialog } from './ProductQuickEditDialog/components/QuickEditComparisonDialog';
import { QuickEditKeyboardShortcutsDialog } from './ProductQuickEditDialog/components/QuickEditKeyboardShortcutsDialog';
import { QuickEditConfirmCloseDialog } from './ProductQuickEditDialog/components/QuickEditConfirmCloseDialog';
import { QuickEditStatusChangeWarningDialog } from './ProductQuickEditDialog/components/QuickEditStatusChangeWarningDialog';
import { QuickEditProductTypeWarningDialog } from './ProductQuickEditDialog/components/QuickEditProductTypeWarningDialog';
import { QuickEditScheduleDialog } from './ProductQuickEditDialog/components/QuickEditScheduleDialog';
import { QuickEditSaveTemplateDialog } from './ProductQuickEditDialog/components/QuickEditSaveTemplateDialog';
import { QuickEditFormContent } from './ProductQuickEditDialog/components/QuickEditFormContent';
import { QuickEditDialogContainer } from './ProductQuickEditDialog/components/QuickEditDialogContainer';
// PHASE 5: Extract Utils
import { createFormStateSnapshot } from './ProductQuickEditDialog/utils/formHelpers';
import { isDirtyCheck } from './ProductQuickEditDialog/utils/dirtyCheckHelpers';

// Extended product type with variants (from API)
// PERFORMANCE OPTIMIZATION (2.1.0): Use type from useProduct hook to avoid type conflicts
type ProductWithVariants = UseProductWithVariants;

// Hook to detect mobile vs desktop
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function ProductQuickEditDialog({
  product,
  productIds,
  open,
  onClose,
  onSuccess,
  onBulkSuccess,
}: ProductQuickEditDialogProps) {
  // PHASE 2: Bulk Edit Mode (4.2.5)
  const isBulkMode = Boolean(productIds && productIds.length > 0);
  const bulkProductCount = productIds?.length || 0;
  const isMobile = useIsMobile(); // Detect mobile vs desktop to render only Dialog or Sheet
  
  // PHASE 3: Product History Tab (4.3.5)
  const [activeTab, setActiveTab] = useState<string>('edit');
  const [historyPage, setHistoryPage] = useState(1);
  // UX/UI UPGRADE Phase 4.2.2: Keyboard shortcuts help dialog
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  // PHASE 5.3.2: Accordion Layout - Track expanded sections (default: basic-info và pricing)
  const [expandedSections, setExpandedSections] = useState<string[]>(['section-basic-info', 'section-pricing']);
  // PERFORMANCE: Only fetch history when dialog is open and user is on history tab
  const { data: historyData, isLoading: isLoadingHistory } = useProductHistory(
    product?.id,
    historyPage,
    20, // 20 items per page for history
    open && activeTab === 'history' && !isBulkMode // Only fetch when needed
  );
  
  const { showToast } = useToastContext();
  // PHASE 2: Success Feedback Enhancement (7.11.4) - Track updates for visual feedback
  const savedUpdatesRef = useRef<Record<string, unknown>>({});
  // FIX: Store timeout IDs to prevent memory leaks when dialog closes
  const timeoutRefs = useRef<{
    flashAnimation?: NodeJS.Timeout;
    successIndicator?: NodeJS.Timeout;
    closeDialog?: NodeJS.Timeout;
  }>({});
  const { quickUpdate, isLoading } = useQuickUpdateProduct({
    onSuccess: (updatedProduct) => {
      // FIX: Update productWithVariants state with new version from API response
      // This ensures the form uses the latest version for the next edit
      // Critical for optimistic locking: version must be synced after each update
      setProductWithVariants(updatedProduct as unknown as ProductWithVariants);
      
      // Update parent component state (for product list)
      onSuccess?.(updatedProduct);
      
      // Reset form with updated product data (including new version)
      // This ensures if user opens dialog again, form will use latest version
      const updatedInitialData: QuickEditFormData = {
        name: updatedProduct.name || '',
        sku: updatedProduct.sku || '',
        status: updatedProduct.status || 'draft',
        manageStock: updatedProduct.stockQuantity !== null && updatedProduct.stockQuantity !== undefined,
        regularPrice: (updatedProduct.regularPrice && updatedProduct.regularPrice !== '') 
          ? (() => {
              const parsed = parseFloat(updatedProduct.regularPrice);
              return !isNaN(parsed) ? parsed : 0;
            })()
          : 0,
        salePrice: (updatedProduct.salePrice && updatedProduct.salePrice !== '') 
          ? (() => {
              const parsed = parseFloat(updatedProduct.salePrice);
              return !isNaN(parsed) ? parsed : undefined;
            })()
          : undefined,
        stockQuantity: updatedProduct.stockQuantity || 0,
        stockStatus: (updatedProduct.stockStatus as 'instock' | 'outofstock' | 'onbackorder') || 'instock',
        // CRITICAL: Use updated version from API response
        version: updatedProduct.version || 1,
        bulkUpdate: false,
        variants: (updatedProduct as unknown as ProductWithVariants).variants?.map((v: any) => ({
          id: v.id || '',
          sku: v.sku || '',
          price: (typeof v.price === 'number' && !isNaN(v.price)) ? v.price : 0,
          stock: (typeof v.stock === 'number' && !isNaN(v.stock)) 
            ? v.stock 
            : (typeof v.stockQuantity === 'number' && !isNaN(v.stockQuantity)) 
              ? v.stockQuantity 
              : 0,
          size: v.size || '',
          color: v.color || undefined,
          colorCode: v.colorCode || undefined,
          image: v.image || undefined,
        })) || [],
      };
      
      // Reset form with updated data (including new version)
      // PHASE 3.1: Use externalSnapshot to update snapshot in hook
      setExternalSnapshot(updatedInitialData);
      reset(updatedInitialData);
      
      // PHASE 6: Extract Undo/Redo - Reset history after save
      handleSaveSuccess(updatedInitialData);
      
      // PHASE 2: Success Feedback Enhancement (7.11.4)
      const now = new Date();
      setLastSavedTime(now);
      setShowSuccessIndicator(true);
      
      // Track which fields were saved (for visual flash) - use savedUpdatesRef
      const savedFieldsSet = new Set<string>();
      const updates = savedUpdatesRef.current;
      if (updates.name !== undefined) savedFieldsSet.add('name');
      if (updates.sku !== undefined) savedFieldsSet.add('sku');
      if (updates.regularPrice !== undefined) savedFieldsSet.add('regularPrice');
      if (updates.salePrice !== undefined) savedFieldsSet.add('salePrice');
      if (updates.stockQuantity !== undefined) savedFieldsSet.add('stockQuantity');
      if (updates.stockStatus !== undefined) savedFieldsSet.add('stockStatus');
      if (updates.status !== undefined) savedFieldsSet.add('status');
      setSavedFields(savedFieldsSet);
      
      // UX/UI UPGRADE Phase 2.2.1: Trigger green flash animation cho saved fields
      setFlashingFields(new Set(savedFieldsSet));
      // Remove flash animation after 1s (smooth fade out)
      // FIX: Store timeout ID to prevent memory leak
      timeoutRefs.current.flashAnimation = setTimeout(() => {
        setFlashingFields(new Set());
        timeoutRefs.current.flashAnimation = undefined;
      }, 1000);
      
      // Hide success indicator after 3 seconds
      // FIX: Store timeout ID and move before onClose() to prevent memory leak
      timeoutRefs.current.successIndicator = setTimeout(() => {
        setShowSuccessIndicator(false);
        setSavedFields(new Set());
        timeoutRefs.current.successIndicator = undefined;
      }, 3000);
      
      // Close dialog after showing success feedback (delay 2 seconds)
      // FIX: Store timeout ID to allow cancellation if needed
      timeoutRefs.current.closeDialog = setTimeout(() => {
        // Clear all pending timeouts before closing to prevent state updates after unmount
        if (timeoutRefs.current.flashAnimation) {
          clearTimeout(timeoutRefs.current.flashAnimation);
          timeoutRefs.current.flashAnimation = undefined;
        }
        if (timeoutRefs.current.successIndicator) {
          clearTimeout(timeoutRefs.current.successIndicator);
          timeoutRefs.current.successIndicator = undefined;
        }
        timeoutRefs.current.closeDialog = undefined;
        onClose();
      }, 2000);
    },
    onError: (error) => {
      if (error.message === 'VERSION_MISMATCH') {
        showToast('Sản phẩm đã được chỉnh sửa bởi người khác. Vui lòng làm mới và thử lại.', 'error');
        // PERFORMANCE OPTIMIZATION: Use React Query refetch instead of direct fetch
        // This ensures form gets latest version from server and benefits from React Query cache
        if (product?.id && !isBulkMode) {
          setLoadingProduct(true);
          refetchProduct()
            .then((result) => {
              if (result.data) {
                // Product data will be automatically synced via useEffect (line 405-487)
                // No need to manually setProductWithVariants here
              }
            })
            .catch((err) => {
              console.error('[ProductQuickEditDialog] Error refreshing product:', err);
            })
            .finally(() => {
              setLoadingProduct(false);
            });
        }
      } else if (error.message === 'CSRF_TOKEN_INVALID_AFTER_RETRY') {
        // CSRF error after retry - toast already shown in hook, just log
        console.error('[ProductQuickEditDialog] CSRF token invalid after retry:', error);
      } else if (error.message.includes('CSRF_TOKEN_INVALID') || error.message.includes('CSRF_TOKEN_MISSING') || error.message.includes('CSRF_ORIGIN_INVALID')) {
        // Fallback: Show toast if CSRF error not handled by retry logic
        showToast('CSRF token không hợp lệ. Vui lòng tải lại trang và thử lại.', 'error');
      }
      // Don't close dialog on error - let user fix and retry
    },
  });

  // PHASE 3.4: showConfirmClose moved to useQuickEditLifecycle hook
  // PHASE 2: Product Type Change Warning (4.2.3)
  const [showProductTypeWarning, setShowProductTypeWarning] = useState(false);
  const [pendingProductType, setPendingProductType] = useState<'simple' | 'variable' | 'grouped' | 'external' | null>(null);
  // PHASE 3: Status Change Confirmation (7.10.3)
  const [showStatusChangeWarning, setShowStatusChangeWarning] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'draft' | 'publish' | 'trash' | null>(null);
  const [previousStatus, setPreviousStatus] = useState<'draft' | 'publish' | 'trash' | null>(null);
  // PHASE 4: Quick Edit Templates (4.3.8)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showLoadTemplateDialog, setShowLoadTemplateDialog] = useState(false);
  // PHASE 4: Product Comparison (4.4.1)
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  // PHASE 4: Scheduled Updates (4.4.2)
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [productWithVariants, setProductWithVariants] = useState<ProductWithVariants | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  // PHASE 2: Loading Progress Indicator (7.9.3)
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle');
  // PHASE 2: Success Feedback Enhancement (7.11.4)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set());
  // UX/UI UPGRADE Phase 2.2.1: Green flash animation cho saved fields
  const [flashingFields, setFlashingFields] = useState<Set<string>>(new Set());
  // PHASE 2: Visual Feedback for Edited Fields (7.11.2)
  const [fieldOriginalValues, setFieldOriginalValues] = useState<Record<string, any>>({});
  // PHASE 2: Mobile Sheet Scrolling Issues (7.11.8)
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  // PHASE 3.5: pollingIntervalRef, lastCheckedVersionRef, and formIsDirtyRef moved to useQuickEditVersionCheck hook
  // PHASE 3.4: isDirtyRef moved to useQuickEditLifecycle hook
  // PHASE 6: Progressive loading moved to useQuickEditProgressiveLoading hook

  // PERFORMANCE OPTIMIZATION (2.1.0): Use React Query hook for product fetching
  // This enables caching and pre-fetching capabilities
  const productId = product?.id;
  // PERFORMANCE OPTIMIZATION (2.1.2): Use lightweight endpoint for Quick Edit
  const { product: fetchedProduct, isLoading: isLoadingProduct, error: productError, refetch: refetchProduct } = useProduct(
    productId || null,
    { 
      enabled: open && !!productId && !isBulkMode,
      useLightweight: true, // Use lightweight endpoint for Quick Edit
    }
  );

  // PHASE 6: Extract Progressive Loading Logic
  const { loadedSections, setLoadedSections } = useQuickEditProgressiveLoading({
    open,
    loadingProduct,
    isBulkMode,
  });

  // PHASE 6: Extract Product Sync Logic
  useQuickEditProductSync({
    open,
    productId,
    isBulkMode,
    product,
    fetchedProduct,
    isLoadingProduct,
    productError,
    setProductWithVariants,
    setLoadingProduct,
    setLoadingStep,
    showToast,
  });

  // PHASE 3.1: Extract useQuickEditForm hook - Form setup logic moved to hook
  // State to control external snapshot updates (for template loading, save success, etc.)
  const [externalSnapshot, setExternalSnapshot] = useState<QuickEditFormData | null>(null);
  
  // Callback to update fieldOriginalValues when snapshot is reset
  const handleSnapshotReset = useCallback((snapshot: QuickEditFormData | null) => {
    if (snapshot) {
      // PHASE 2: Visual Feedback for Edited Fields (7.11.2) - Store original values
      const originalValues: Record<string, any> = {
        name: snapshot.name || '',
        sku: snapshot.sku || '',
        status: snapshot.status || 'draft',
        regularPrice: snapshot.regularPrice || 0,
        salePrice: snapshot.salePrice,
        stockQuantity: snapshot.stockQuantity || 0,
        stockStatus: snapshot.stockStatus || 'instock',
        weight: snapshot.weight,
        length: snapshot.length,
        width: snapshot.width,
        height: snapshot.height,
        lowStockThreshold: snapshot.lowStockThreshold,
        categories: snapshot.categories || [],
        tags: snapshot.tags || [],
        _thumbnail_id: snapshot._thumbnail_id,
        _product_image_gallery: snapshot._product_image_gallery,
        seoTitle: snapshot.seoTitle,
        seoDescription: snapshot.seoDescription,
        slug: snapshot.slug,
        costPrice: snapshot.costPrice,
        productType: snapshot.productType,
        visibility: snapshot.visibility,
        shippingClass: snapshot.shippingClass,
        taxStatus: snapshot.taxStatus,
        taxClass: snapshot.taxClass,
        barcode: snapshot.barcode,
        gtin: snapshot.gtin,
        ean: snapshot.ean,
        soldIndividually: snapshot.soldIndividually,
        backorders: snapshot.backorders,
      };
      setFieldOriginalValues(originalValues);
    } else {
      setFieldOriginalValues({});
    }
  }, []);

  // PHASE 3.1: Use extracted hook for form setup
  const {
    register,
    setValue,
    watch,
    getValues,
    reset,
    handleSubmit,
    errors,
    formState,
    initialData,
    snapshotInitialData,
    formInitialized,
  } = useQuickEditForm({
    product,
    productWithVariants,
    isBulkMode,
    open,
    onResetSnapshot: handleSnapshotReset,
    externalSnapshot: externalSnapshot || undefined, // Pass external snapshot if set
  });

  // Extract formState properties for backward compatibility
  // Ensure formState includes errors (required by QuickEditFormProvider)
  const formStateFull = {
    ...formState,
    errors,
  };
  const formIsDirty = formState.isDirty;

  // PHASE 3.4: Extract useQuickEditLifecycle hook - Lifecycle handlers moved to hook
  const {
    showConfirmClose,
    setShowConfirmClose,
    handleOpenChange,
    handleCloseClick,
    handleConfirmClose,
  } = useQuickEditLifecycle({
    open,
    isDirty: formIsDirty,
    isLoading,
    reset,
    initialData,
    onClose,
  });

  // PHASE 3.5: Extract useQuickEditVersionCheck hook - Version checking moved to hook
  useQuickEditVersionCheck({
    open,
    isBulkMode,
    product: product ?? null,
    productWithVariants,
    setProductWithVariants,
    isDirty: formIsDirty,
    refetchProduct,
    showToast,
  });

  // PHASE 3: Quick Actions & Shortcuts (7.11.15) - Reset form handler
  const handleResetForm = useCallback(() => {
    if (!snapshotInitialData) return;
    
    // Reset form to initial data
    reset(snapshotInitialData, { keepDefaultValues: false });
    
    // Show toast notification
    showToast('Đã đặt lại form về giá trị ban đầu', 'info');
  }, [snapshotInitialData, reset, showToast]);

  // PHASE 6: Extract Field Watchers - Centralize all watch() calls
  const {
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
  } = useQuickEditFieldWatchers({ watch });
  
  // State for UI
  const [categoriesPopoverOpen, setCategoriesPopoverOpen] = useState(false);
  
  // Fetch categories for selection
  // PERFORMANCE OPTIMIZATION (1.2.1): Lazy load categories - only fetch when Categories popover opens
  const { categories: allCategories, isLoading: isLoadingCategories } = useCategories({
    type: 'tree',
    status: 'active',
    enabled: categoriesPopoverOpen, // Only fetch when Categories popover is open
  });
  
  // PHASE 2: SKU Real-time Validation (7.8.2) - Debounced validation với visual feedback
  const skuValidation = useSkuValidation({
    sku: sku || '',
    productId: product?.id,
    debounceMs: 500,
    enabled: open && !isBulkMode, // Only validate when dialog is open and not in bulk mode
  });
  
  // PHASE 2: Mobile Keyboard Issues (7.9.2) - Auto-scroll và keyboard handling
  const { isKeyboardOpen, containerRef, handleInputFocus } = useMobileKeyboard({
    enabled: open, // Only enable when dialog is open
    scrollOffset: 100, // 100px from top
  });
  
  // PHASE 3: Field Focus Visual Enhancement (7.11.13) - Track focused field
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);
  
  // PHASE 3.3: Extract useQuickEditValidation hook - Validation helpers moved to hook
  const {
    normalizeValue,
    isFieldEdited,
    getFieldClassName,
    getErrorCountForSection,
    allValidationErrors,
    getErrorsBySection,
    scrollToErrorField,
  } = useQuickEditValidation({
    errors,
    focusedFieldId,
    savedFields,
    flashingFields,
    fieldOriginalValues,
    setExpandedSections,
    showToast,
  });
  
  // PHASE 2: tagsInputValue moved to CategoriesSection component
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [mediaLibraryMode, setMediaLibraryMode] = useState<'featured' | 'gallery'>('featured');
  
  // Create formData object for dirty check (wrapped in useMemo to prevent dependency changes)
  const formData = useMemo(() => ({
    name,
    sku,
    status,
    manageStock,
    regularPrice,
    salePrice,
    stockQuantity,
    stockStatus: currentStockStatus,
    variants,
    bulkUpdate,
  }), [name, sku, status, manageStock, regularPrice, salePrice, stockQuantity, currentStockStatus, variants, bulkUpdate]);

  // PHASE 5.1: Use formHelpers for form state snapshot
  const getFormStateSnapshot = useCallback((): QuickEditFormData => {
    return createFormStateSnapshot(getValues, {
      selectedCategories,
      selectedTags,
      featuredImageId,
      galleryImageIds,
      weight,
      length,
      width,
      height,
      lowStockThreshold,
    });
  }, [getValues, selectedCategories, selectedTags, featuredImageId, galleryImageIds, weight, length, width, height, lowStockThreshold]);

  // PHASE 6: Extract Undo/Redo Tracking Logic
  // Convert types to match useQuickEditUndoRedo expectations (string for prices/weight)
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    handleSaveSuccess,
  } = useQuickEditUndoRedo({
    open,
    formInitialized,
    isBulkMode,
    snapshotInitialData,
    variants,
    getFormStateSnapshot,
    reset,
    name,
    sku,
    status,
    manageStock,
    regularPrice: typeof regularPrice === 'number' ? String(regularPrice) : regularPrice,
    salePrice: typeof salePrice === 'number' ? String(salePrice) : salePrice,
    stockQuantity,
    currentStockStatus,
    selectedCategories,
    selectedTags,
    featuredImageId,
    galleryImageIds,
    weight: typeof weight === 'number' ? String(weight) : (weight ?? null),
    length,
    width,
    height,
    lowStockThreshold,
  });

  // PHASE 6: Extract Template Handlers
  // Create prevFormStateRef for template hook (not used but required by interface)
  const prevFormStateRef = useRef<QuickEditFormData | null>(null);
  const {
    templates,
    loadingTemplates,
    templateName,
    setTemplateName,
    templateDescription,
    setTemplateDescription,
    templateCategory,
    setTemplateCategory,
    templateSearchQuery,
    setTemplateSearchQuery,
    fetchTemplates,
    handleSaveTemplate: handleSaveTemplateFromHook,
    handleLoadTemplate: handleLoadTemplateFromHook,
    handleDeleteTemplate,
  } = useQuickEditTemplates({
    isBulkMode,
    showLoadTemplateDialog,
    getFormStateSnapshot,
    setExternalSnapshot,
    reset,
    resetHistory,
    prevFormStateRef,
    showToast,
  });

  // Wrapper to close dialog after save
  const handleSaveTemplate = useCallback(async () => {
    await handleSaveTemplateFromHook();
    setShowSaveTemplateDialog(false);
  }, [handleSaveTemplateFromHook]);

  // Wrapper to close dialog after load
  const handleLoadTemplate = useCallback(async (templateId: string) => {
    await handleLoadTemplateFromHook(templateId);
    setShowLoadTemplateDialog(false);
  }, [handleLoadTemplateFromHook]);

  // Reset form when dialog opens (only once, not when initialData changes)
  // CRITICAL FIX #17: Prevent form reset when initialData changes during editing
  // Also reset confirm close state when dialog opens and snapshot initial data
  // PHASE 2: Mobile Sheet Scrolling Issues (7.11.8) - Reset scroll state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setScrollProgress(0);
      setShowScrollToTop(false);
    }
  }, [open]);

  // PHASE 6: Extract Keyboard Shortcuts Handler
  useQuickEditKeyboardShortcuts({
    open,
    activeTab,
    formIsDirty,
    isLoading,
    onSave: () => {
          const form = document.getElementById('quick-edit-form') as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
    },
    onShowShortcutsHelp: () => setShowShortcutsHelp(true),
    onClose,
    setShowConfirmClose,
    showToast,
  });

  // FIX: Cleanup timeouts on unmount or when dialog closes to prevent memory leaks
  useEffect(() => {
    // Copy ref values to variables to avoid stale closure warnings
    const timeouts = timeoutRefs.current;
    return () => {
      // Clear all pending timeouts when component unmounts or dialog closes
      if (timeouts.flashAnimation) {
        clearTimeout(timeouts.flashAnimation);
        timeouts.flashAnimation = undefined;
      }
      if (timeouts.successIndicator) {
        clearTimeout(timeouts.successIndicator);
        timeouts.successIndicator = undefined;
      }
      if (timeouts.closeDialog) {
        clearTimeout(timeouts.closeDialog);
        timeouts.closeDialog = undefined;
      }
    };
  }, [open]); // Re-run cleanup when dialog opens/closes

  // PHASE 3.5: Version checking logic moved to useQuickEditVersionCheck hook

  // PHASE 4: CSRF Protection (7.12.2) - Pre-fetch CSRF token when dialog opens
  useEffect(() => {
    if (open && !isBulkMode) {
      // Pre-fetch CSRF token to ensure it's available when form is submitted
      // This prevents 403 errors due to missing token
      import('@/lib/utils/csrfClient').then(({ getCsrfTokenHeader }) => {
        getCsrfTokenHeader().catch((error) => {
          console.error('[ProductQuickEditDialog] Failed to pre-fetch CSRF token:', error);
          // Don't show error to user - token will be fetched on submit if needed
        });
      });
    }
  }, [open, isBulkMode]);

  // PHASE 3.1: Form initialization logic moved to useQuickEditForm hook
  // PHASE 3.4: Reset confirm dialog state when opening moved to useQuickEditLifecycle hook
  // Clear external snapshot when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Clear external snapshot when dialog opens (will use initialData from hook)
      setExternalSnapshot(null);
      } else {
      // Clear external snapshot when dialog closes
      setExternalSnapshot(null);
    }
  }, [open]);

  // PHASE 2: handleStockQuantityChange extracted to InventorySection component

  // PHASE 3.3: normalizeValue moved to useQuickEditValidation hook

  // PHASE 6: Extract isDirty Check Function
  // Convert types to match isDirtyCheck expectations (string for prices/weight, null for undefined)
  const isDirty = useMemo(() => {
    return isDirtyCheck({
      open,
      snapshotInitialData,
      formInitialized,
      name: name || '',
      sku: sku || '',
      status: status || 'draft',
      manageStock: manageStock ?? false,
      regularPrice: typeof regularPrice === 'number' ? String(regularPrice) : (regularPrice || '0'),
      salePrice: typeof salePrice === 'number' ? String(salePrice) : (salePrice || ''),
      stockQuantity: typeof stockQuantity === 'number' ? stockQuantity : null,
      currentStockStatus: currentStockStatus || 'instock',
      costPrice: typeof costPrice === 'number' ? String(costPrice) : (costPrice ?? null),
      formData,
      selectedCategories,
      selectedTags,
      featuredImageId,
      galleryImageIds,
      weight: typeof weight === 'number' ? String(weight) : (weight ?? null),
      length: typeof length === 'number' ? length : (length ?? null),
      width: typeof width === 'number' ? width : (width ?? null),
      height: typeof height === 'number' ? height : (height ?? null),
      lowStockThreshold: typeof lowStockThreshold === 'number' ? lowStockThreshold : (lowStockThreshold ?? null),
      seoTitle: seoTitle ?? null,
      seoDescription: seoDescription ?? null,
      slug: slug ?? null,
      productType: productType || 'simple',
      visibility: visibility || 'public',
      password: password ?? null,
      shippingClass: shippingClass ?? null,
      taxStatus: taxStatus || 'taxable',
      taxClass: taxClass ?? null,
      barcode: barcode ?? null,
      gtin: gtin ?? null,
      ean: ean ?? null,
      soldIndividually: soldIndividually ?? false,
      backorders: backorders || 'no',
      normalizeValue,
    });
  }, [
    open, snapshotInitialData, formInitialized,
    name, sku, status, manageStock, regularPrice, salePrice, stockQuantity, currentStockStatus,
    costPrice,
    formData,
    selectedCategories, selectedTags, featuredImageId, galleryImageIds,
    weight, length, width, height, lowStockThreshold,
    seoTitle, seoDescription, slug,
    productType, visibility, password,
    shippingClass, taxStatus, taxClass,
    barcode, gtin, ean,
    soldIndividually, backorders,
    normalizeValue,
  ]);

  // PHASE 3.4: Before unload warning and navigation guard moved to useQuickEditLifecycle hook
    
  // PHASE 3.3: isFieldEdited and getFieldClassName moved to useQuickEditValidation hook



  // PHASE 3.4: handleOpenChange, handleCloseClick, handleConfirmClose moved to useQuickEditLifecycle hook

  // PHASE 2: Bulk Edit Progress (4.2.5)
  const [bulkUpdateProgress, setBulkUpdateProgress] = useState<{
    current: number;
    total: number;
    status: 'idle' | 'updating' | 'completed' | 'error';
  }>({
    current: 0,
    total: 0,
    status: 'idle',
  });

  // PHASE 3.2: Extract useQuickEditHandlers hook - Form handlers moved to hook
  const {
    onSubmit,
    onError,
    handleFieldFocus,
    handleFieldBlur,
  } = useQuickEditHandlers({
    product,
    productIds,
    isBulkMode,
    productWithVariants,
    reset,
    quickUpdate,
    setLoadingStep,
    setBulkUpdateProgress,
    setExternalSnapshot,
    setProductWithVariants,
    setLoadingProduct,
    setLastSavedTime,
    setShowSuccessIndicator,
    setSavedFields,
    setFlashingFields,
    setFocusedFieldId,
    onSuccess,
    onBulkSuccess,
    onClose,
    showToast,
    resetHistory,
    refetchProduct,
    handleInputFocus,
    timeoutRefs,
    savedUpdatesRef,
  });

  // PHASE 2: handleStockQtyChange extracted to InventorySection component

  // PHASE 3.3: allValidationErrors, getErrorsBySection, getErrorCountForSection, scrollToErrorField moved to useQuickEditValidation hook

  // PHASE 5.3.2: Accordion Layout - Auto-expand sections with errors
  useEffect(() => {
    if (allValidationErrors.length > 0) {
      const sectionsWithErrors = Object.keys(getErrorsBySection);
      setExpandedSections(prev => {
        const newExpanded = [...prev];
        sectionsWithErrors.forEach(sectionId => {
          if (!newExpanded.includes(sectionId)) {
            newExpanded.push(sectionId);
          }
        });
        return newExpanded;
      });
    }
  }, [allValidationErrors, getErrorsBySection]);

  // PHASE 6: Extract Form Content
  const formContent = (
    <QuickEditFormContent
      register={register}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      reset={reset}
      errors={errors}
      formState={formStateFull}
      handleSubmit={handleSubmit}
      handleFieldFocus={(fieldId: string, e?: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => handleFieldFocus(fieldId, e)}
      handleFieldBlur={(e?: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => handleFieldBlur(e)}
      onSubmit={onSubmit}
      onError={onError}
      getFieldClassName={getFieldClassName}
      getErrorCountForSection={getErrorCountForSection}
      scrollToErrorField={scrollToErrorField}
      allValidationErrors={allValidationErrors}
      savedFields={savedFields}
      flashingFields={flashingFields}
      fieldOriginalValues={fieldOriginalValues}
      expandedSections={expandedSections}
      setExpandedSections={setExpandedSections}
      skuValidation={{ isValid: skuValidation.isValid, isValidating: skuValidation.isValidating, error: skuValidation.error }}
      allCategories={allCategories}
      isLoadingCategories={isLoadingCategories}
      variants={variants}
      isBulkMode={isBulkMode}
      isMobile={isMobile}
      loadingProduct={loadingProduct}
      loadingStep={loadingStep}
      showSuccessIndicator={showSuccessIndicator}
      isDirty={isDirty}
      lastSavedTime={lastSavedTime}
      product={product || null}
      productWithVariants={productWithVariants}
      loadedSections={loadedSections}
      mediaLibraryOpen={mediaLibraryOpen}
      setMediaLibraryOpen={setMediaLibraryOpen}
      mediaLibraryMode={mediaLibraryMode}
      setMediaLibraryMode={setMediaLibraryMode}
        showStatusChangeWarning={showStatusChangeWarning}
        setShowStatusChangeWarning={setShowStatusChangeWarning}
        pendingStatus={pendingStatus}
        setPendingStatus={setPendingStatus}
        previousStatus={previousStatus}
        setPreviousStatus={setPreviousStatus}
          showProductTypeWarning={showProductTypeWarning}
          setShowProductTypeWarning={setShowProductTypeWarning}
          pendingProductType={pendingProductType}
          setPendingProductType={setPendingProductType}
        />
  );

  // PHASE 6: Extract Dialog Container
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
                const target = e.currentTarget;
                const scrollTop = target.scrollTop;
                const scrollHeight = target.scrollHeight - target.clientHeight;
                const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
                setScrollProgress(progress);
    setShowScrollToTop(scrollTop > 200);
  };

  return (
    <>
      <QuickEditDialogContainer
        open={open}
        onOpenChange={handleOpenChange}
        isMobile={isMobile}
        isBulkMode={isBulkMode}
        bulkProductCount={bulkProductCount}
        productId={product?.id}
        isDirty={isDirty}
        formIsDirty={formIsDirty}
        isLoading={isLoading}
        showSuccessIndicator={showSuccessIndicator}
        lastSavedTime={lastSavedTime}
        activeTab={activeTab}
        scrollProgress={scrollProgress}
        showScrollToTop={showScrollToTop}
        onScroll={handleScroll}
        onShowShortcutsHelp={() => setShowShortcutsHelp(true)}
        onClose={handleCloseClick}
        onReset={handleResetForm}
        onShowComparison={!isBulkMode && isDirty ? () => setShowComparisonDialog(true) : undefined}
        onShowSchedule={!isBulkMode && isDirty ? () => setShowScheduleDialog(true) : undefined}
            >
              {formContent}
      </QuickEditDialogContainer>

      {/* PHASE 6: Extract Status Change Warning Dialog */}
      <QuickEditStatusChangeWarningDialog
        open={showStatusChangeWarning}
        onOpenChange={setShowStatusChangeWarning}
        pendingStatus={pendingStatus}
        previousStatus={previousStatus}
        onConfirm={() => {
                if (pendingStatus) {
                  setValue('status', pendingStatus, { shouldDirty: true });
                  setShowStatusChangeWarning(false);
                  setPendingStatus(null);
                  setPreviousStatus(null);
                  showToast('Trạng thái đã được thay đổi. Nhớ lưu thay đổi để áp dụng.', 'info');
                }
              }}
        onCancel={() => {
          setShowStatusChangeWarning(false);
          setPendingStatus(null);
          setPreviousStatus(null);
        }}
      />

      {/* PHASE 6: Extract Product Type Warning Dialog */}
      <QuickEditProductTypeWarningDialog
        open={showProductTypeWarning}
        onOpenChange={setShowProductTypeWarning}
        pendingProductType={pendingProductType}
        variantCount={formData.variants?.length || 0}
        onConfirm={() => {
                if (pendingProductType) {
                  setValue('productType', pendingProductType, { shouldDirty: true });
                  setShowProductTypeWarning(false);
                  setPendingProductType(null);
                  showToast(
                    'Loại sản phẩm đã được thay đổi. Lưu ý: Các biến thể sẽ bị xóa khi bạn lưu thay đổi.',
                    'warning'
                  );
                }
              }}
        onCancel={() => {
          setShowProductTypeWarning(false);
          setPendingProductType(null);
        }}
      />

      {/* PHASE 6: Extract Confirm Close Dialog */}
      <QuickEditConfirmCloseDialog
        open={showConfirmClose}
        onOpenChange={setShowConfirmClose}
        onConfirm={handleConfirmClose}
      />

      {/* PHASE 6: Extract Save Template Dialog */}
      <QuickEditSaveTemplateDialog
        open={showSaveTemplateDialog}
        onOpenChange={setShowSaveTemplateDialog}
        templateName={templateName}
        templateDescription={templateDescription}
        templateCategory={templateCategory}
        onTemplateNameChange={setTemplateName}
        onTemplateDescriptionChange={setTemplateDescription}
        onTemplateCategoryChange={setTemplateCategory}
        onSave={handleSaveTemplate}
      />

      {/* PHASE 6: Extract Schedule Dialog */}
      <QuickEditScheduleDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        scheduledDateTime={scheduledDateTime}
        onDateTimeChange={setScheduledDateTime}
        onConfirm={async () => {
                if (!scheduledDateTime) {
                  showToast('Vui lòng chọn ngày và giờ', 'error');
                  return;
                }

                if (!product?.id) {
                  showToast('Không tìm thấy sản phẩm', 'error');
                  return;
                }

                const scheduledDate = new Date(scheduledDateTime);
                if (scheduledDate <= new Date()) {
                  showToast('Thời gian phải trong tương lai', 'error');
                  return;
                }

                try {
                  const { getCsrfTokenHeader } = await import('@/lib/utils/csrfClient');
                  const csrfToken = await getCsrfTokenHeader();
                  
                  const currentFormData = getFormStateSnapshot();
                  const response = await fetch('/api/admin/products/scheduled-updates', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                      productId: product.id,
                      scheduledAt: scheduledDate.toISOString(),
                      updateData: currentFormData,
                    }),
                  });

                  if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error?.error || 'Failed to schedule update');
                  }

                  showToast(`Đã lên lịch cập nhật cho ${scheduledDate.toLocaleString('vi-VN')}`, 'success');
                  setShowScheduleDialog(false);
                  setScheduledDateTime('');
                } catch (error: unknown) {
                  console.error('Error scheduling update:', error);
                  const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lên lịch cập nhật';
                  showToast(errorMessage, 'error');
                }
              }}
      />

      {/* PHASE 6: Extract Comparison Dialog */}
      <QuickEditComparisonDialog
        open={showComparisonDialog}
        onOpenChange={setShowComparisonDialog}
        snapshotInitialData={snapshotInitialData}
        productId={product?.id}
        productName={product?.name}
      />

      {/* PHASE 6: Extract Keyboard Shortcuts Dialog */}
      <QuickEditKeyboardShortcutsDialog
        open={showShortcutsHelp}
        onOpenChange={setShowShortcutsHelp}
        isMobile={isMobile}
      />
    </>
  );
}

