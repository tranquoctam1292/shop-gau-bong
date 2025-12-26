'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceInput } from './PriceInput';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, X, Image as ImageIcon, Plus, Search, Check, Package, DollarSign, Box, Ruler, Tag, AlertCircle, Info, FileText, CheckCircle2, Clock, RotateCcw, Circle, Keyboard, ArrowUp, Undo2, Redo2, Save, FolderOpen, Trash2, GitCompare, Download } from 'lucide-react';
import { LoadingProgressIndicator, type LoadingStep } from './LoadingProgressIndicator';
// PERFORMANCE OPTIMIZATION (3.3.1): Skeleton loader for immediate dialog display
import { ProductQuickEditSkeleton } from './ProductQuickEditSkeleton';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { parsePrice, parsePriceOptional, parseInteger, parseIntegerOptional, isValidPrice, isValidInteger } from '@/lib/utils/typeConverters';
import { useQuickUpdateProduct } from '@/lib/hooks/useQuickUpdateProduct';
import { useToastContext } from '@/components/providers/ToastProvider';
import { useSkuValidation } from '@/lib/hooks/useSkuValidation';
import { useMobileKeyboard } from '@/lib/hooks/useMobileKeyboard';
import { VariantQuickEditTable } from './VariantQuickEditTable';
import { useCategories } from '@/lib/hooks/useCategories';
import { MediaLibraryModal } from './MediaLibraryModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { useProductHistory } from '@/lib/hooks/useProductHistory';
import { useUndoRedo } from '@/lib/hooks/useUndoRedo';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
// PERFORMANCE OPTIMIZATION (2.1.0): Use React Query hook for product fetching
import { useProduct, type ProductWithVariants as UseProductWithVariants } from '@/lib/hooks/useProduct';

// PHASE 1: Preparation - Import types and schema from extracted files
import type { QuickEditFormData, ProductQuickEditDialogProps } from './ProductQuickEditDialog/types';
import { QuickEditFormProvider } from './ProductQuickEditDialog/context/QuickEditFormProvider';
// PHASE 3: Extract Hooks
import { useQuickEditForm } from './ProductQuickEditDialog/hooks/useQuickEditForm';
import { useQuickEditHandlers } from './ProductQuickEditDialog/hooks/useQuickEditHandlers';
import { useQuickEditValidation } from './ProductQuickEditDialog/hooks/useQuickEditValidation';
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
  const router = useRouter();
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
      
      // PHASE 4: Undo/Redo (4.3.7) - Reset history after save
      if (resetHistory) {
        resetHistory(updatedInitialData);
      }
      
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

  const [showConfirmClose, setShowConfirmClose] = useState(false);
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
  const [templates, setTemplates] = useState<Array<{ _id: string; name: string; description?: string; category?: string; templateData: any; createdAt: string }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
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
  // PHASE 3.1: Extract useQuickEditForm hook - Form setup logic moved to hook
  // CRITICAL FIX: Track last fetched product ID to prevent infinite loop
  const lastFetchedProductIdRef = useRef<string | null>(null);
  
  // PHASE 3: Client State Sync (7.12.7) - Polling interval ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedVersionRef = useRef<number | null>(null);
  // PHASE 3: Client State Sync (7.12.7) - Track form dirty state for polling
  const formIsDirtyRef = useRef<boolean>(false);
  // PHASE 4: Unsaved Changes Warning (7.11.10) - Track isDirty in ref for beforeunload
  const isDirtyRef = useRef<boolean>(false);
  // PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Track which sections are loaded
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set());
  const progressiveLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load critical sections first, then secondary sections
  useEffect(() => {
    if (!open) {
      // Reset loaded sections when dialog closes
      setLoadedSections(new Set());
      if (progressiveLoadTimeoutRef.current) {
        clearTimeout(progressiveLoadTimeoutRef.current);
        progressiveLoadTimeoutRef.current = null;
      }
      return;
    }

    if (loadingProduct || isBulkMode) {
      // Don't start progressive loading while still loading product data
      return;
    }

    // Critical sections: Load immediately when product data is ready
    if (!loadedSections.has('critical')) {
      setLoadedSections(prev => new Set([...prev, 'critical']));
    }

    // Secondary sections: Load after a short delay (100ms) to prioritize critical sections
    if (!loadedSections.has('secondary')) {
      progressiveLoadTimeoutRef.current = setTimeout(() => {
        setLoadedSections(prev => new Set([...prev, 'secondary']));
      }, 100);
    }

    return () => {
      if (progressiveLoadTimeoutRef.current) {
        clearTimeout(progressiveLoadTimeoutRef.current);
        progressiveLoadTimeoutRef.current = null;
      }
    };
  }, [open, loadingProduct, isBulkMode, loadedSections]);

  // Sync fetched product data to local state and handle version checking
  useEffect(() => {
    if (!open || !productId || isBulkMode) {
      // Reset ref when dialog closes
      if (!open) {
        lastFetchedProductIdRef.current = null;
        setProductWithVariants(null);
      }
      return;
    }

    // Skip if we already processed this product
    if (lastFetchedProductIdRef.current === productId) {
      return;
    }

    // Update loading state based on React Query loading state
    if (isLoadingProduct) {
      setLoadingProduct(true);
      setLoadingStep('fetching');
      return;
    }

    // Handle error
    if (productError) {
      console.error('[ProductQuickEditDialog] Error fetching product:', productError);
      // Reset ref on error so we can retry
      lastFetchedProductIdRef.current = null;
      setProductWithVariants(product as unknown as ProductWithVariants);
      setLoadingProduct(false);
      setLoadingStep('idle');
      return;
    }

    // Handle successful fetch
    if (fetchedProduct) {
      // PHASE 0: Concurrent Edit Conflict Check (7.1.1) - Simplified version
      // Check version khi mở dialog để detect concurrent edits
      const serverVersion = fetchedProduct.version || 0;
      const clientVersion = product.version || 0;
      
      if (serverVersion !== clientVersion && clientVersion > 0) {
        // Version khác → product đã được update từ nơi khác
        showToast(
          `Sản phẩm đã được cập nhật (version ${serverVersion} vs ${clientVersion}). Đang tải dữ liệu mới...`,
          'warning'
        );
      }
      
      // Debug: Log variants structure
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProductQuickEditDialog] API Response:', {
          hasVariants: !!fetchedProduct.variants,
          variantsCount: fetchedProduct.variants?.length || 0,
          firstVariant: fetchedProduct.variants?.[0],
          productDataMetaBox: fetchedProduct.productDataMetaBox ? {
            hasVariations: !!fetchedProduct.productDataMetaBox.variations,
            variationsCount: fetchedProduct.productDataMetaBox.variations?.length || 0,
            firstVariation: fetchedProduct.productDataMetaBox.variations?.[0],
            attributes: fetchedProduct.productDataMetaBox.attributes,
          } : null,
          version: {
            server: serverVersion,
            client: clientVersion,
            mismatch: serverVersion !== clientVersion,
          },
        });
      }
      
      // Mark as processed
      lastFetchedProductIdRef.current = productId;
      setProductWithVariants(fetchedProduct as ProductWithVariants);
      setLoadingProduct(false);
      // Delay reset to show completion briefly
      setTimeout(() => {
        setLoadingStep('idle');
      }, 300);
    } else {
      // Fallback to prop product if fetch returns null
      setProductWithVariants(product as unknown as ProductWithVariants);
      setLoadingProduct(false);
      setLoadingStep('idle');
    }
  }, [open, productId, isBulkMode, product?.version, fetchedProduct, isLoadingProduct, productError, product, showToast]);

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

  // PHASE 3: Quick Actions & Shortcuts (7.11.15) - Reset form handler
  const handleResetForm = useCallback(() => {
    if (!snapshotInitialData) return;
    
    // Reset form to initial data
    reset(snapshotInitialData, { keepDefaultValues: false });
    
    // Show toast notification
    showToast('Đã đặt lại form về giá trị ban đầu', 'info');
  }, [snapshotInitialData, reset, showToast]);

  // Optimize: Watch specific fields instead of all fields to reduce re-renders
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
  const variants = watch('variants');
  const bulkUpdate = watch('bulkUpdate');
  
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

  // PHASE 4: Undo/Redo (4.3.7) - Initialize undo/redo hook with form state
  // Create a snapshot of current form state for undo/redo
  const getFormStateSnapshot = useCallback((): QuickEditFormData => {
    const values = getValues();
    return {
      ...values,
      // Include watched values that might not be in getValues()
      categories: selectedCategories || [],
      tags: selectedTags || [],
      _thumbnail_id: featuredImageId,
      _product_image_gallery: galleryImageIds,
      weight,
      length,
      width,
      height,
      lowStockThreshold,
    };
  }, [getValues, selectedCategories, selectedTags, featuredImageId, galleryImageIds, weight, length, width, height, lowStockThreshold]);

  // Initialize undo/redo with initial form state
  const initialFormState = useMemo(() => {
    if (!open || !snapshotInitialData) return null;
    return snapshotInitialData;
  }, [open, snapshotInitialData]);

  // PHASE 4: Memory Optimization (7.4.2) - Dynamic maxHistory based on form size
  // Reduce maxHistory if form has many variants to save memory
  const variantCount = variants?.length || 0;
  const dynamicMaxHistory = useMemo(() => {
    if (variantCount > 50) return 20; // Large forms: reduce to 20
    if (variantCount > 20) return 30; // Medium forms: reduce to 30
    return 50; // Small forms: keep 50
  }, [variantCount]);

  // CRITICAL FIX: Flag to prevent tracking form changes during undo/redo
  const isUndoRedoInProgressRef = useRef(false);

  const {
    currentState: undoRedoState,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  } = useUndoRedo<QuickEditFormData | null>(
    initialFormState,
    dynamicMaxHistory, // PHASE 4: Dynamic maxHistory based on form size
    (state) => {
      // CRITICAL FIX: Set flag to prevent tracking during undo/redo
      isUndoRedoInProgressRef.current = true;
      // When state changes (undo/redo), restore form values
      if (state) {
        reset(state, { keepDefaultValues: false });
      }
      // Reset flag after form values settle (use requestAnimationFrame for better timing)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isUndoRedoInProgressRef.current = false;
        });
      });
    },
    true // PHASE 4: Use shallow copy for memory optimization
  );

  // PHASE 4: Undo/Redo (4.3.7) - Track form state changes and add to history
  // Only track when form is initialized and dialog is open
  const prevFormStateRef = useRef<QuickEditFormData | null>(null);
  useEffect(() => {
    // CRITICAL FIX: Prevent tracking during undo/redo to avoid infinite loop
    if (!open || !formInitialized || isBulkMode || isUndoRedoInProgressRef.current) return;

    const currentState = getFormStateSnapshot();
    
    // Only add to history if state actually changed
    if (prevFormStateRef.current) {
      const prevState = prevFormStateRef.current;
      // PHASE 4: Memory Optimization (7.4.2) - Use shallow comparison instead of JSON.stringify for better performance
      // Compare key fields directly instead of full JSON stringify (which is expensive for large objects)
      const hasChanged = 
        prevState.name !== currentState.name ||
        prevState.sku !== currentState.sku ||
        prevState.status !== currentState.status ||
        prevState.manageStock !== currentState.manageStock ||
        prevState.regularPrice !== currentState.regularPrice ||
        prevState.salePrice !== currentState.salePrice ||
        prevState.stockQuantity !== currentState.stockQuantity ||
        prevState.stockStatus !== currentState.stockStatus ||
        JSON.stringify(prevState.categories) !== JSON.stringify(currentState.categories) ||
        JSON.stringify(prevState.tags) !== JSON.stringify(currentState.tags) ||
        prevState._thumbnail_id !== currentState._thumbnail_id ||
        prevState._product_image_gallery !== currentState._product_image_gallery ||
        prevState.weight !== currentState.weight ||
        prevState.length !== currentState.length ||
        prevState.width !== currentState.width ||
        prevState.height !== currentState.height ||
        prevState.lowStockThreshold !== currentState.lowStockThreshold ||
        JSON.stringify(prevState.variants) !== JSON.stringify(currentState.variants);
      
      if (hasChanged && !isUndoRedoInProgressRef.current) {
        // CRITICAL FIX: Double check flag before adding to history (defensive check)
        addToHistory(currentState);
      }
    }
    
    // CRITICAL FIX: Only update prevFormStateRef if not in undo/redo to prevent tracking
    if (!isUndoRedoInProgressRef.current) {
      prevFormStateRef.current = currentState;
    }
  }, [open, formInitialized, isBulkMode, getFormStateSnapshot, addToHistory, name, sku, status, manageStock, regularPrice, salePrice, stockQuantity, currentStockStatus, variants, selectedCategories, selectedTags, featuredImageId, galleryImageIds, weight, length, width, height, lowStockThreshold]);

  // PHASE 4: Undo/Redo (4.3.7) - Reset history when form is saved
  const handleSaveSuccess = useCallback(() => {
    if (!snapshotInitialData) return;
    // Reset history to current state after save
    resetHistory(snapshotInitialData);
    prevFormStateRef.current = snapshotInitialData;
  }, [snapshotInitialData, resetHistory]);

  // PHASE 4: Quick Edit Templates (4.3.8) - Fetch templates
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch('/api/admin/products/templates', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error: unknown) {
      console.error('Error fetching templates:', error);
      showToast('Không thể tải danh sách template', 'error');
    } finally {
      setLoadingTemplates(false);
    }
  }, [showToast]);

  // PHASE 4: Quick Edit Templates (4.3.8) - Load templates only when user opens "Load template" dialog
  // PERFORMANCE: Don't fetch templates on dialog open, fetch only when user clicks "Load template" button
  useEffect(() => {
    if (showLoadTemplateDialog && !isBulkMode) {
      fetchTemplates(); // Only fetch when user opens the load template dialog
    }
  }, [showLoadTemplateDialog, isBulkMode, fetchTemplates]);

  // PHASE 4: Quick Edit Templates (4.3.8) - Save template handler
  const handleSaveTemplate = useCallback(async () => {
    if (!templateName.trim()) {
      showToast('Vui lòng nhập tên template', 'error');
      return;
    }

    try {
      // PHASE 1: CSRF Protection (7.12.2) - Include CSRF token in headers
      const { getCsrfTokenHeader } = await import('@/lib/utils/csrfClient');
      const csrfToken = await getCsrfTokenHeader();
      
      const currentFormData = getFormStateSnapshot();
      const response = await fetch('/api/admin/products/templates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken, // PHASE 1: CSRF Protection (7.12.2)
        },
        credentials: 'include',
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDescription.trim() || undefined,
          category: templateCategory.trim() || undefined,
          templateData: currentFormData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || 'Failed to save template');
      }

      showToast('Đã lưu template thành công', 'success');
      setShowSaveTemplateDialog(false);
      setTemplateName('');
      setTemplateDescription('');
      setTemplateCategory('');
      fetchTemplates();
    } catch (error: unknown) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu template';
      showToast(errorMessage, 'error');
    }
  }, [templateName, templateDescription, templateCategory, getFormStateSnapshot, showToast, fetchTemplates]);

  // PHASE 4: Quick Edit Templates (4.3.8) - Load template handler
  const handleLoadTemplate = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/products/templates/${templateId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load template');
      }

      const data = await response.json();
      if (data.template && data.template.templateData) {
        const templateData = data.template.templateData as QuickEditFormData;
        // Apply template data to form
        // PHASE 3.1: Use externalSnapshot to update snapshot in hook
        setExternalSnapshot(templateData);
        reset(templateData, { keepDefaultValues: false });
        // Reset history after loading template
        resetHistory(templateData);
        prevFormStateRef.current = templateData;
        showToast('Đã tải template thành công', 'success');
        setShowLoadTemplateDialog(false);
      } else {
        showToast('Template không hợp lệ', 'error');
      }
    } catch (error: unknown) {
      console.error('Error loading template:', error);
      showToast('Có lỗi xảy ra khi tải template', 'error');
    }
  }, [reset, resetHistory, showToast]);

  // PHASE 4: Quick Edit Templates (4.3.8) - Delete template handler
  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa template này?')) {
      return;
    }

    try {
      // PHASE 1: CSRF Protection (7.12.2) - Include CSRF token in headers
      const { getCsrfTokenHeader } = await import('@/lib/utils/csrfClient');
      const csrfToken = await getCsrfTokenHeader();
      
      const response = await fetch(`/api/admin/products/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken, // PHASE 1: CSRF Protection (7.12.2)
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || 'Failed to delete template');
      }

      showToast('Đã xóa template thành công', 'success');
      fetchTemplates();
    } catch (error: unknown) {
      console.error('Error deleting template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa template';
      showToast(errorMessage, 'error');
    }
  }, [showToast, fetchTemplates]);

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

  // PHASE 3: Keyboard Shortcuts (4.3.6)
  // PHASE 4: Keyboard Shortcuts Browser Conflict (7.4.1) - Enhanced with preventDefault and stopPropagation
  useEffect(() => {
    if (!open || activeTab !== 'edit') return; // Only handle shortcuts when edit tab is active

    const handleKeyDown = (e: KeyboardEvent) => {
      // PHASE 4: Browser detection for proper shortcut handling
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0;
      const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
      const shouldHandleShortcut = ctrlKey && (isMac || isWindows || isLinux);

      // Ctrl/Cmd + S: Save changes
      if (shouldHandleShortcut && e.key === 's' && !e.shiftKey && !e.altKey) {
        // PHASE 4: Prevent default browser behavior (save page) and stop propagation
        e.preventDefault();
        e.stopPropagation();
        if (formIsDirty && !isLoading) {
          const form = document.getElementById('quick-edit-form') as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }
        return;
      }

      // Ctrl/Cmd + 1-7: Jump to sections (already implemented in Phase 3)
      if (shouldHandleShortcut && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        e.stopPropagation();
        const sectionIndex = parseInt(e.key, 10) - 1;
        const sectionIds = [
          'section-basic-info',
          'section-pricing',
          'section-product-type',
          'section-shipping',
          'section-dimensions',
          'section-categories',
          'section-images',
        ];
        const targetSectionId = sectionIds[sectionIndex];
        if (targetSectionId) {
          const targetElement = document.getElementById(targetSectionId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const sectionName = targetElement.querySelector('h3')?.textContent || targetSectionId;
            showToast(`Chuyển đến mục: ${sectionName}`, 'info');
          }
        }
        return;
      }

      // Esc: Close dialog (with confirm if dirty)
      if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        // Check if focus is in an input/textarea (native Escape behavior should work there)
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.getAttribute('contenteditable') === 'true'
        );
        
        if (isInputFocused) {
          // Let native Escape behavior work (e.g., clear input, close dropdown)
          return;
        }
        
        // PHASE 4: Prevent default browser behavior and stop propagation when closing dialog
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;
        if (formIsDirty) {
          setShowConfirmClose(true);
        } else {
          onClose();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase to catch events early
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, activeTab, formIsDirty, isLoading, onClose, setShowConfirmClose, showToast, canUndo, canRedo, undo, redo]);

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

  // PHASE 3: Client State Sync (7.12.7) - Update formIsDirty ref when it changes
  useEffect(() => {
    formIsDirtyRef.current = formIsDirty;
  }, [formIsDirty]);

  // PHASE 3: Client State Sync (7.12.7) - Polling function to check version
  // PERFORMANCE OPTIMIZATION: Use React Query refetch instead of direct fetch
  const checkProductVersion = useCallback(async () => {
    const productId = product?.id;
    if (!open || !productId || isBulkMode || !refetchProduct) {
      return;
    }

    try {
      // PERFORMANCE OPTIMIZATION: Use React Query refetch instead of direct fetch
      // This benefits from React Query cache and deduplication
      const result = await refetchProduct();

      if (result.error) {
        // Silent fail for polling - don't interrupt user
        return;
      }

      if (!result.data) {
        return;
      }

      const serverVersion = result.data.version || 0;
      const currentVersion = lastCheckedVersionRef.current ?? (productWithVariants?.version || product?.version || 0);

      // Update last checked version
      lastCheckedVersionRef.current = serverVersion;

      // Only refresh if version changed
      if (serverVersion !== currentVersion && currentVersion > 0) {
        const isFormDirty = formIsDirtyRef.current;
        
        if (!isFormDirty) {
          // Version mismatch detected - refresh product data
          showToast(
            `Sản phẩm đã được cập nhật từ nơi khác (version ${serverVersion}). Đang tải dữ liệu mới...`,
            'warning'
          );
          
          // Refresh product data - this will trigger initialData recalculation and form reset
          // Note: fetchedProduct will also be updated via useEffect (line 405-487), but we set it here
          // to ensure immediate update for version check
          setProductWithVariants(result.data as ProductWithVariants);
        } else {
          // Version changed but form is dirty - show warning but don't auto-refresh
          showToast(
            `Sản phẩm đã được cập nhật từ nơi khác (version ${serverVersion}). Bạn đang có thay đổi chưa lưu. Lưu ý: Lưu có thể ghi đè các thay đổi khác.`,
            'warning'
          );
        }
      }
    } catch (error) {
      // Silent fail for polling - don't interrupt user
      console.error('[ProductQuickEditDialog] Polling error:', error);
    }
  }, [open, product?.id, isBulkMode, productWithVariants, product?.version, showToast, refetchProduct]);

  // PHASE 3: Client State Sync (7.12.7) - Setup polling when dialog opens
  useEffect(() => {
    if (!open || isBulkMode || !product?.id) {
      // Clear polling when dialog closes
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      lastCheckedVersionRef.current = null;
      return;
    }

    // Initialize last checked version after productWithVariants is loaded
    if (productWithVariants?.version !== undefined) {
      const currentVersion = productWithVariants.version || 0;
      if (lastCheckedVersionRef.current === null) {
        lastCheckedVersionRef.current = currentVersion;
      }
    } else if (product?.version !== undefined) {
      const currentVersion = product.version || 0;
      if (lastCheckedVersionRef.current === null) {
        lastCheckedVersionRef.current = currentVersion;
      }
    }

    // Poll every 15 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkProductVersion();
    }, 15000); // 15 seconds interval

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [open, isBulkMode, product?.id, product?.version, productWithVariants?.version, checkProductVersion]);

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
  // Reset confirm dialog state when opening
  useEffect(() => {
    if (open) {
      setShowConfirmClose(false);
      // Clear external snapshot when dialog opens (will use initialData from hook)
      setExternalSnapshot(null);
      } else {
      // Clear external snapshot when dialog closes
      setExternalSnapshot(null);
    }
  }, [open]);

  // PHASE 2: handleStockQuantityChange extracted to InventorySection component

  // PHASE 3.3: normalizeValue moved to useQuickEditValidation hook

  // PHASE 1: Dirty Check Optimization (7.7.2) - Optimized with early exit and memoization
  // Use snapshotInitialData for stable comparison (snapshot taken when dialog opens)
  const isDirty = useMemo(() => {
    // Early exit: If dialog is not open, always return false
    if (!open) return false;
    
    // CRITICAL FIX: Only check isDirty if form has been initialized (reset completed)
    // This prevents false positive when dialog just opened and form hasn't been reset yet
    // formInitialized is set after reset() completes (150ms delay), ensuring form values are ready for comparison
    if (!snapshotInitialData || !formInitialized) return false;
    
    const baseData = snapshotInitialData;
    
    // CRITICAL FIX: Compare all fields manually to avoid false positive from formIsDirty
    // Use watched values instead of getValues() to ensure we have the latest form state
    // react-hook-form's formIsDirty might be true even after reset due to internal state
    // PHASE 1: Check registered fields (name, sku, status, manageStock, regularPrice, salePrice, stockQuantity, stockStatus)
    // Use watched values (name, sku, status, etc.) which are already tracked and will trigger re-computation
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
  }, [
    open, snapshotInitialData, formInitialized,
    name, sku, status, manageStock, regularPrice, salePrice, stockQuantity, currentStockStatus,
    costPrice, // PHASE 2: Cost Price (4.2.2)
    formData.variants,
    selectedCategories, selectedTags, featuredImageId, galleryImageIds,
    weight, length, width, height, lowStockThreshold,
    // PHASE 2: SEO fields, Product Type & Visibility, Shipping & Tax
    seoTitle, seoDescription, slug,
    productType, visibility, password,
    shippingClass, taxStatus, taxClass,
    // PHASE 3: Barcode/GTIN/EAN, Sold Individually, Backorders
    barcode, gtin, ean,
    soldIndividually, backorders,
    normalizeValue, // UX/UI UPGRADE PREREQUISITE 2 (10.2.1): Add normalizeValue dependency
  ]);

  // PHASE 4: Unsaved Changes Warning (7.11.10) - Update isDirty ref for beforeunload (after isDirty is defined)
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // PHASE 4: Unsaved Changes Warning (7.11.10) - beforeunload event handler
  useEffect(() => {
    if (!open) return; // Only handle when dialog is open

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        // Standard way to show browser warning
        e.preventDefault();
        // Modern browsers ignore custom message, but we set it anyway
        e.returnValue = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [open]);

  // PHASE 4: Unsaved Changes Warning (7.11.10) - Navigation guard for Next.js App Router
  useEffect(() => {
    if (!open || !isDirty) return;

    // Intercept link clicks within the dialog
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        // Check if it's an internal link (same origin)
        try {
          const linkUrl = new URL(link.href);
          const currentUrl = new URL(window.location.href);
          
          // Only intercept internal navigation
          if (linkUrl.origin === currentUrl.origin && linkUrl.pathname !== currentUrl.pathname) {
            e.preventDefault();
            e.stopPropagation();
            
            // Show confirmation dialog
            if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang này?')) {
              // User confirmed, allow navigation
              window.location.href = link.href;
            }
          }
        } catch (error) {
          // Invalid URL, ignore
        }
      }
    };

    // Add click listener to document when dialog is open and form is dirty
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [open, isDirty]);
    
  // PHASE 3.3: isFieldEdited and getFieldClassName moved to useQuickEditValidation hook



  // Handle close from onOpenChange (backdrop click, ESC key)
  const handleOpenChange = (isOpen: boolean) => {
    // Prevent auto-close when dialog is being opened or when submitting
    if (isOpen === true || isLoading) {
      return;
    }
    
    // Only show confirm dialog if there are actual unsaved changes
    if (isOpen === false) {
      if (isDirty) {
        // Form has unsaved changes - show confirm dialog
        setShowConfirmClose(true);
      } else {
        // No changes - close immediately without confirmation
        onClose();
      }
    }
  };

  // Handle close from button click
  const handleCloseClick = () => {
    // Prevent close when submitting
    if (isLoading) {
      return;
    }
    
    // Only show confirm dialog if there are actual unsaved changes
    if (isDirty) {
      // Form has unsaved changes - show confirm dialog
      setShowConfirmClose(true);
    } else {
      // No changes - close immediately without confirmation
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    reset(initialData);
    onClose();
  };

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

  // PERFORMANCE OPTIMIZATION (3.3.1): Show skeleton loader while loading product data
  // PHASE 0: Context API Setup - Wrap form content in Provider
  const formContent = (
    <QuickEditFormProvider
      register={register}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      reset={reset}
      errors={errors}
      formState={formStateFull}
      handleFieldFocus={handleFieldFocus}
      handleFieldBlur={handleFieldBlur}
      getFieldClassName={getFieldClassName}
      getErrorCountForSection={getErrorCountForSection}
      savedFields={savedFields}
      flashingFields={flashingFields}
      fieldOriginalValues={fieldOriginalValues}
      expandedSections={expandedSections}
      setExpandedSections={setExpandedSections}
      skuValidation={skuValidation}
      categories={allCategories}
      isLoadingCategories={isLoadingCategories}
      variants={variants}
      isBulkMode={isBulkMode}
      isMobile={isMobile}
    >
    <form id="quick-edit-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
      {/* PERFORMANCE OPTIMIZATION (3.3.1): Show skeleton loader while loading */}
      {loadingProduct && !isBulkMode && (
        <ProductQuickEditSkeleton />
      )}
      
      {/* UX/UI UPGRADE Phase 4.2.1: Skip links cho keyboard navigation */}
      {!loadingProduct && (
        <nav className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-2 focus-within:left-2 focus-within:z-50 focus-within:bg-white focus-within:border focus-within:border-slate-300 focus-within:rounded-md focus-within:shadow-lg focus-within:p-2" aria-label="Skip to sections">
          <ul className="flex flex-wrap gap-2">
            <li>
              <a
                href="#section-basic-info"
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('section-basic-info');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    element.focus();
                  }
                }}
              >
                Bỏ qua đến: Thông tin cơ bản
              </a>
            </li>
            <li>
              <a
                href="#section-pricing"
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('section-pricing');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    element.focus();
                  }
                }}
              >
                Bỏ qua đến: Giá & Trạng thái
              </a>
            </li>
            <li>
              <a
                href="#section-images"
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('section-images');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    element.focus();
                  }
                }}
              >
                Bỏ qua đến: Hình ảnh
              </a>
            </li>
            <li>
              <a
                href="#section-seo"
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('section-seo');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    element.focus();
                  }
                }}
              >
                Bỏ qua đến: SEO & URL
              </a>
            </li>
          </ul>
        </nav>
      )}
      
      {/* PHASE 2: Success Feedback Enhancement (7.11.4) - "All changes saved" message */}
      {/* UX/UI UPGRADE Phase 4.1.3: aria-live region cho success message */}
      {!loadingProduct && showSuccessIndicator && !isDirty && (
        <div 
          className="bg-green-50 border border-green-200 rounded-md p-3 md:p-4 space-y-2 animate-in slide-in-from-top-2"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden="true" />
            <h4 className="text-sm font-semibold text-green-900">
              Tất cả thay đổi đã được lưu
            </h4>
          </div>
          {lastSavedTime && (
            <p className="text-xs text-green-700 ml-7">
              Đã lưu lúc: {lastSavedTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>
      )}
      
      {/* PHASE 1: Error Message Details (7.6.3) - Error Summary Section */}
      {/* UX/UI UPGRADE Phase 4.1.3: aria-live region cho error summary */}
      {!loadingProduct && allValidationErrors.length > 0 && (
        <div 
          className="bg-red-50 border border-red-200 rounded-md p-3 md:p-4 space-y-2 animate-in slide-in-from-top-2"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{allValidationErrors.length}</span>
            </div>
            <h4 className="text-sm font-semibold text-red-900">
              Có {allValidationErrors.length} lỗi validation cần sửa:
            </h4>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-800 ml-7">
            {allValidationErrors.map((err, index) => (
              <li key={index}>
                {/* UX/UI UPGRADE Phase 2.1.2: Error summary với clickable links */}
                {/* UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px */}
                <button
                  type="button"
                  onClick={() => scrollToErrorField(err.field)}
                  className="text-left hover:underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-1 -ml-1 transition-colors min-h-[44px] py-2 w-full"
                  aria-label={`Scroll to ${err.label} field`}
                >
                  <span className="font-medium">{err.label}:</span> {err.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* PHASE 2: Loading Progress Indicator (7.9.3) - Enhanced loading with progress steps */}
      {/* PERFORMANCE OPTIMIZATION (3.3.1): Only show overlay loader for bulk mode, skeleton for single mode */}
      {loadingProduct && isBulkMode && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-md">
          <LoadingProgressIndicator 
            step={loadingStep} 
            showTimeEstimate={true}
          />
        </div>
      )}
      {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
      {/* PERFORMANCE OPTIMIZATION (3.3.1): Hide form content while loading (skeleton shown above) */}
      {!loadingProduct && (
        <>
      {/* PHASE 5.3.2: Accordion Layout - Wrap sections in Accordion */}
      <Accordion 
        type="multiple" 
        value={expandedSections} 
        onValueChange={setExpandedSections}
        className="w-full space-y-0"
      >
        {/* Basic Info Section */}
        <AccordionItem value="section-basic-info" className="border-b border-slate-200">
          <AccordionTrigger 
            id="section-basic-info"
            className="hover:no-underline py-4 scroll-mt-4"
            aria-label="Thông tin cơ bản"
          >
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-slate-900">Thông tin cơ bản</h3>
              {getErrorCountForSection('section-basic-info') > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                  {getErrorCountForSection('section-basic-info')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-4">
      {/* PHASE 2: Extract Form Sections - BasicInfoSection */}
      <BasicInfoSection skuValidation={skuValidation} />
          </AccordionContent>
        </AccordionItem>

        {/* Pricing Section */}
        <AccordionItem value="section-pricing" className="border-b border-slate-200">
          <AccordionTrigger 
            id="section-pricing"
            className="hover:no-underline py-4 scroll-mt-4"
            aria-label="Giá & Trạng thái"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-slate-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-slate-900">Giá & Trạng thái</h3>
              {getErrorCountForSection('section-pricing') > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                  {getErrorCountForSection('section-pricing')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-4">
      {/* PHASE 2: Extract Form Sections - PricingSection */}
      <PricingSection
        showStatusChangeWarning={showStatusChangeWarning}
        setShowStatusChangeWarning={setShowStatusChangeWarning}
        pendingStatus={pendingStatus}
        setPendingStatus={setPendingStatus}
        previousStatus={previousStatus}
        setPreviousStatus={setPreviousStatus}
      />

      {/* PHASE 2: Extract Form Sections - InventorySection */}
      <InventorySection loadedSections={loadedSections} />
          </AccordionContent>
        </AccordionItem>

        {/* Product Type Section */}
        <AccordionItem value="section-product-type" className="border-b border-slate-200">
          <AccordionTrigger 
            id="section-product-type"
            className="hover:no-underline py-4 scroll-mt-4"
            aria-label="Loại sản phẩm & Hiển thị"
          >
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-slate-900">Loại sản phẩm & Hiển thị</h3>
              {getErrorCountForSection('section-product-type') > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                  {getErrorCountForSection('section-product-type')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-4">
      {/* PHASE 2: Extract Form Sections - ProductTypeSection */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
      {loadedSections.has('secondary') ? (
        <ProductTypeSection
          showProductTypeWarning={showProductTypeWarning}
          setShowProductTypeWarning={setShowProductTypeWarning}
          pendingProductType={pendingProductType}
          setPendingProductType={setPendingProductType}
        />
      ) : (
        <div className="mt-6 space-y-4 animate-pulse">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-4">
            <div className="h-10 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-200 rounded" />
          </div>
        </div>
      )}
          </AccordionContent>
        </AccordionItem>

        {/* Shipping & Tax Section */}
        <AccordionItem value="section-shipping" className="border-b border-slate-200">
          <AccordionTrigger 
            id="section-shipping"
            className="hover:no-underline py-4 scroll-mt-4"
            aria-label="Giao hàng & Thuế"
          >
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-slate-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-slate-900">Giao hàng & Thuế</h3>
              {getErrorCountForSection('section-shipping') > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                  {getErrorCountForSection('section-shipping')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-4">
      {/* PHASE 2: Extract Form Sections - ShippingSection */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
      {loadedSections.has('secondary') ? (
        <ShippingSection />
      ) : (
        <div className="mt-6 space-y-4 animate-pulse">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-4">
            <div className="h-10 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-200 rounded" />
          </div>
        </div>
      )}

      {/* PHASE 2: Extract Form Sections - DimensionsSection */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
      {loadedSections.has('secondary') ? (
        <DimensionsSection />
      ) : (
        <div className="mb-6 mt-6 space-y-4 animate-pulse">
          <div className="h-5 w-56 bg-slate-200 rounded" />
          {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      )}
          </AccordionContent>
        </AccordionItem>

        {/* Categories & Tags Section */}
        <AccordionItem value="section-categories" className="border-b border-slate-200">
          <AccordionTrigger 
            id="section-categories"
            className="hover:no-underline py-4 scroll-mt-4"
            aria-label="Danh mục & Thẻ"
          >
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-slate-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-slate-900">Danh mục & Thẻ</h3>
              {getErrorCountForSection('section-categories') > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                  {getErrorCountForSection('section-categories')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-4">
      {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Categories already lazy loaded, but show skeleton if section not loaded */}
      {loadedSections.has('secondary') ? (
        <>
      {/* PHASE 2: Extract Form Sections - CategoriesSection */}
      <CategoriesSection categories={allCategories} isLoadingCategories={isLoadingCategories} />
        </>
      ) : (
        <div className="mb-6 mt-6 space-y-4 animate-pulse">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-slate-200 rounded" />
                      </div>
                </div>
              )}
          </AccordionContent>
        </AccordionItem>

        {/* Images Section */}
        <AccordionItem value="section-images" className="border-b border-slate-200">
          <AccordionTrigger 
            id="section-images"
            className="hover:no-underline py-4 scroll-mt-4"
            aria-label="Hình ảnh sản phẩm"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-slate-600" aria-hidden="true" />
              <h3 className="text-base font-semibold text-slate-900">Hình ảnh sản phẩm</h3>
              {getErrorCountForSection('section-images') > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                  {getErrorCountForSection('section-images')}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-0 pb-4">
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
      {loadedSections.has('secondary') ? (
        <>
      {/* PHASE 2: Extract Form Sections - ImagesSection */}
      <ImagesSection
        product={product}
        mediaLibraryOpen={mediaLibraryOpen}
        setMediaLibraryOpen={setMediaLibraryOpen}
        mediaLibraryMode={mediaLibraryMode}
        setMediaLibraryMode={setMediaLibraryMode}
      />
        </>
      ) : (
        <div className="mb-6 mt-6 space-y-4 animate-pulse">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-slate-200 rounded" />
            <div className="space-y-2">
              <div className="h-10 bg-slate-200 rounded" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-20 bg-slate-200 rounded" />
                <div className="h-20 bg-slate-200 rounded" />
                <div className="h-20 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      )}
          </AccordionContent>
        </AccordionItem>

      {/* PHASE 2: Extract Form Sections - SeoSection */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
      {loadedSections.has('secondary') ? (
        <SeoSection
          product={product}
          isBulkMode={isBulkMode}
          onClose={onClose}
        />
      ) : (
        <div className="mt-6 space-y-4 animate-pulse">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          <div className="space-y-4">
            <div className="h-10 bg-slate-200 rounded" />
            <div className="h-20 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-200 rounded" />
          </div>
        </div>
      )}
      </Accordion>

      {/* PHASE 2: Extract Form Sections - VariantsSection */}
      <VariantsSection
        productWithVariants={productWithVariants}
        loadingProduct={loadingProduct}
        loadedSections={loadedSections}
      />

      {/* PHASE 3: Product Options (4.3.2) - Attributes Enable/Disable */}
      {(() => {
        // Only show for variable products with attributes
        const productAttributes = (productWithVariants as any)?.productDataMetaBox?.attributes || 
                                  (product as any)?.productDataMetaBox?.attributes || [];
        const hasAttributes = productAttributes.length > 0;
        const productType = watch('productType');
        const isVariableProduct = productType === 'variable' || product?.type === 'variable';
        const variants = formData.variants && formData.variants.length > 0 
          ? formData.variants 
          : (productWithVariants?.variants || []);
        
        if (!isVariableProduct || !hasAttributes) return null;
        
        return (
          <div className="space-y-4 mb-6">
            {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
            <div className="flex items-center gap-2 mb-2 mt-6">
              <Tag className="h-5 w-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Tùy chọn sản phẩm</h3>
            </div>
            
            {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-3">
              <p className="text-sm text-slate-600 mb-3">
                Bật/tắt các thuộc tính (Size, Color, etc.) cho sản phẩm
              </p>
              
              {productAttributes.map((attr: any, index: number) => {
                const attrName = attr.name || '';
                const isVisible = attr.visible !== false; // Default to true if not set
                const isVariation = attr.variation === true;
                
                // Check if attribute has active variants
                const hasActiveVariants = isVariation && variants.length > 0 && variants.some((variant: any) => {
                  const attrNameLower = attrName.toLowerCase();
                  if (attrNameLower === 'size' && variant.size) return true;
                  if (attrNameLower === 'color' && variant.color) return true;
                  return false;
                });
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isVisible}
                        onCheckedChange={(checked) => {
                          // Warning if disabling attribute with active variants
                          if (!checked && hasActiveVariants) {
                            const confirmMsg = `Thuộc tính "${attrName}" đang được sử dụng bởi ${variants.length} biến thể. Bạn có chắc muốn tắt không?`;
                            if (!window.confirm(confirmMsg)) {
                              return; // Don't update if user cancels
                            }
                          }
                          
                          // Update attributes array
                          const currentAttributes = productAttributes.map((a: any, idx: number) => {
                            if (idx === index) {
                              return { ...a, visible: checked };
                            }
                            return a;
                          });
                          
                          // Set form value
                          const attributesToUpdate = currentAttributes.map((a: any) => ({
                            name: a.name,
                            visible: a.visible !== false,
                          }));
                          
                          setValue('attributes', attributesToUpdate, { shouldDirty: true });
                        }}
                        id={`attribute-${index}`}
                      />
                      <Label 
                        htmlFor={`attribute-${index}`} 
                        className="text-sm font-medium text-slate-900 cursor-pointer"
                      >
                        {attrName}
                        {isVariation && (
                          <span className="ml-2 text-xs text-slate-500">(Dùng cho biến thể)</span>
                        )}
                      </Label>
                    </div>
                    
                    {hasActiveVariants && !isVisible && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Có biến thể đang sử dụng
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
        </>
      )}
    </form>
    </QuickEditFormProvider>
  );

  // ✅ FIX: Only render Dialog/Sheet when open to prevent multiple dialogs
  // This prevents rendering multiple instances when many products are in the list
  if (!open) {
    return null;
  }

  return (
    <>
      {/* Mobile: Sheet - Only render on mobile */}
      {isMobile && (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent 
            side="bottom" 
            className="h-[90vh] rounded-t-2xl overflow-hidden flex flex-col p-0"
          >
            {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
            <SheetHeader className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <SheetTitle className="text-lg font-semibold text-slate-900">
                    {isBulkMode ? `Sửa nhanh ${bulkProductCount} sản phẩm` : 'Sửa nhanh sản phẩm'}
                  </SheetTitle>
                  {!isBulkMode && <p className="text-sm text-slate-500 mt-1">ID: {product?.id || 'N/A'}</p>}
                  {/* PHASE 4: Unsaved Changes Warning (7.11.10) - Visual warning banner */}
                  {isDirty && (
                    <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <p className="text-xs text-amber-800">Bạn có thay đổi chưa lưu</p>
                    </div>
                  )}
                </div>
                {/* UX/UI UPGRADE Phase 4.2.2: Keyboard shortcuts help button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShortcutsHelp(true)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex-shrink-0"
                  aria-label="Xem phím tắt bàn phím"
                  title="Xem phím tắt bàn phím (?)"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>
            {/* UX/UI UPGRADE Phase 3.1.1: Improved scroll progress bar */}
            {scrollProgress > 0 && scrollProgress < 100 && (
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100/50 z-50 rounded-b-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 transition-all duration-300 ease-out rounded-r-full shadow-sm"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
            )}
            {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
            <div 
              ref={containerRef}
              className="flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-4 relative"
              onScroll={(e) => {
                // PHASE 2: Mobile Sheet Scrolling Issues (7.11.8) - Calculate scroll progress
                const target = e.currentTarget;
                const scrollTop = target.scrollTop;
                const scrollHeight = target.scrollHeight - target.clientHeight;
                const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
                setScrollProgress(progress);
                setShowScrollToTop(scrollTop > 200); // Show button after scrolling 200px
              }}
            >
              {formContent}
            </div>
            {/* PHASE 2: Mobile Sheet Scrolling Issues (7.11.8) - Scroll to top button */}
            {showScrollToTop && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (containerRef.current) {
                    containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="fixed bottom-24 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-white border-slate-200 hover:bg-slate-50 md:hidden"
                aria-label="Cuộn lên đầu"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            )}
            {/* PHASE 2: Button Placement & Hierarchy (7.11.5) - Sticky save button wrapper */}
            {/* PHASE 3: Product History Tab (4.3.5) - Only show footer when edit tab is active or bulk mode */}
            {(activeTab === 'edit' || isBulkMode) && (
              <div className="sticky bottom-0 z-50 bg-white border-t border-slate-200 px-4 py-3 md:px-6 md:py-4 flex-shrink-0">
                <SheetFooter className="px-0 py-0 border-0 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseClick}
                disabled={isLoading}
                  className="min-h-[44px] border-slate-200 text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </Button>
              {/* PHASE 4: Product Comparison (4.4.1) - Comparison button */}
              {!isBulkMode && isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowComparisonDialog(true)}
                  disabled={isLoading}
                  className="min-h-[44px] border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="So sánh thay đổi"
                >
                  <GitCompare className="h-4 w-4" />
                  So sánh
                </Button>
              )}
              {/* PHASE 4: Scheduled Updates (4.4.2) - Schedule button */}
              {!isBulkMode && isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScheduleDialog(true)}
                  disabled={isLoading}
                  className="min-h-[44px] border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Lên lịch cập nhật"
                >
                  <Clock className="h-4 w-4" />
                  Lên lịch
                </Button>
              )}
              {/* PHASE 3: Quick Actions & Shortcuts (7.11.15) - Reset form button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleResetForm}
                disabled={!formIsDirty || isLoading}
                className="min-h-[44px] border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Đặt lại
              </Button>
                <div className="flex flex-col items-end gap-1">
              <Button
                type="submit"
                form="quick-edit-form"
                disabled={!isDirty || isLoading}
                    className={`min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      showSuccessIndicator ? 'bg-green-600 hover:bg-green-700' : ''
                    }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : showSuccessIndicator ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        <span>Đã lưu</span>
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
                  {/* PHASE 2: Button Placement & Hierarchy (7.11.5) - Keyboard hint */}
                  {!isLoading && !showSuccessIndicator && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Keyboard className="h-3 w-3" />
                      <span>Ctrl+S để lưu</span>
                    </div>
                  )}
                </div>
            </SheetFooter>
              {/* PHASE 2: Success Feedback Enhancement (7.11.4) - Last saved timestamp */}
              {lastSavedTime && (
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 w-full justify-center">
                  <Clock className="h-3 w-3" />
                  <span>Đã lưu lúc: {lastSavedTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              )}
            </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop: Dialog - Only render on desktop */}
      {!isMobile && (
        <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-lg font-semibold text-slate-900">
                    {isBulkMode ? `Sửa nhanh ${bulkProductCount} sản phẩm` : 'Sửa nhanh sản phẩm'}
                  </DialogTitle>
                  {!isBulkMode && (
                    <DialogDescription className="text-sm text-slate-500 mt-1">
                      ID: {product?.id || 'N/A'}
                    </DialogDescription>
                  )}
                  {/* PHASE 4: Unsaved Changes Warning (7.11.10) - Visual warning banner */}
                  {isDirty && (
                    <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <p className="text-xs text-amber-800">Bạn có thay đổi chưa lưu</p>
                    </div>
                  )}
                </div>
                {/* UX/UI UPGRADE Phase 4.2.2: Keyboard shortcuts help button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShortcutsHelp(true)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px]"
                  aria-label="Xem phím tắt bàn phím"
                  title="Xem phím tắt bàn phím (?)"
                >
                  <Keyboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Phím tắt</span>
                </Button>
              </div>
            </DialogHeader>
            {/* UX/UI UPGRADE Phase 3.1.1: Improved scroll progress bar */}
            {scrollProgress > 0 && scrollProgress < 100 && (
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100/50 z-50 rounded-b-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 transition-all duration-300 ease-out rounded-r-full shadow-sm"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
            )}
            <div 
              className="flex-1 overflow-y-auto px-6 py-4 relative"
              onScroll={(e) => {
                // PHASE 2: Mobile Sheet Scrolling Issues (7.11.8) - Calculate scroll progress
                const target = e.currentTarget;
                const scrollTop = target.scrollTop;
                const scrollHeight = target.scrollHeight - target.clientHeight;
                const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
                setScrollProgress(progress);
                setShowScrollToTop(scrollTop > 200); // Show button after scrolling 200px
              }}
            >
              {formContent}
            </div>
            {/* PHASE 2: Mobile Sheet Scrolling Issues (7.11.8) - Scroll to top button (desktop) */}
            {showScrollToTop && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  // Find the scrollable container within DialogContent
                  const dialogContent = document.querySelector('[class*="DialogContent"]');
                  const scrollContainer = dialogContent?.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
                  if (scrollContainer) {
                    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="fixed bottom-24 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-white border-slate-200 hover:bg-slate-50 hidden md:flex"
                aria-label="Cuộn lên đầu"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            )}
            {/* PHASE 2: Button Placement & Hierarchy (7.11.5) - Sticky save button wrapper */}
            {/* PHASE 3: Product History Tab (4.3.5) - Only show footer when edit tab is active or bulk mode */}
            {(activeTab === 'edit' || isBulkMode) && (
              <div className="sticky bottom-0 z-50 bg-white border-t border-slate-200 px-6 py-4 flex-shrink-0">
                <DialogFooter className="px-0 py-0 border-0 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseClick}
                disabled={isLoading}
                  className="min-h-[44px] border-slate-200 text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </Button>
              {/* PHASE 4: Product Comparison (4.4.1) - Comparison button */}
              {!isBulkMode && isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowComparisonDialog(true)}
                  disabled={isLoading}
                  className="min-h-[44px] border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="So sánh thay đổi"
                >
                  <GitCompare className="h-4 w-4" />
                  So sánh
                </Button>
              )}
              {/* PHASE 4: Scheduled Updates (4.4.2) - Schedule button */}
              {!isBulkMode && isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScheduleDialog(true)}
                  disabled={isLoading}
                  className="min-h-[44px] border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Lên lịch cập nhật"
                >
                  <Clock className="h-4 w-4" />
                  Lên lịch
                </Button>
              )}
              {/* PHASE 3: Quick Actions & Shortcuts (7.11.15) - Reset form button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleResetForm}
                disabled={!formIsDirty || isLoading}
                className="min-h-[44px] border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Đặt lại
              </Button>
                <div className="flex flex-col items-end gap-1">
              <Button
                type="submit"
                form="quick-edit-form"
                disabled={!isDirty || isLoading}
                    className={`min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      showSuccessIndicator ? 'bg-green-600 hover:bg-green-700' : ''
                    }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : showSuccessIndicator ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        <span>Đã lưu</span>
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
                  {/* PHASE 2: Button Placement & Hierarchy (7.11.5) - Keyboard hint */}
                  {!isLoading && !showSuccessIndicator && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Keyboard className="h-3 w-3" />
                      <span>Ctrl+S để lưu</span>
                    </div>
                  )}
                </div>
            </DialogFooter>
              {/* PHASE 2: Success Feedback Enhancement (7.11.4) - Last saved timestamp */}
              {lastSavedTime && (
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2 w-full justify-center">
                  <Clock className="h-3 w-3" />
                  <span>Đã lưu lúc: {lastSavedTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              )}
            </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* PHASE 3: Status Change Confirmation (7.10.3) */}
      <Dialog open={showStatusChangeWarning} onOpenChange={setShowStatusChangeWarning} modal={true}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Xác nhận thay đổi trạng thái
            </DialogTitle>
            <DialogDescription className="pt-2">
              Bạn đang thay đổi trạng thái sản phẩm từ <strong>&quot;Đã xuất bản&quot;</strong> sang <strong>&quot;Bản nháp&quot;</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-700 mb-2">
              Sản phẩm sẽ không hiển thị trên website sau khi thay đổi. Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
              <p className="text-xs text-amber-800">
                <strong>Lưu ý:</strong> Bạn có thể thay đổi lại trạng thái thành &quot;Đã xuất bản&quot; bất cứ lúc nào.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowStatusChangeWarning(false);
                setPendingStatus(null);
                setPreviousStatus(null);
              }}
            >
              Hủy
            </Button>
            <Button 
              variant="default"
              onClick={() => {
                if (pendingStatus) {
                  setValue('status', pendingStatus, { shouldDirty: true });
                  setShowStatusChangeWarning(false);
                  setPendingStatus(null);
                  setPreviousStatus(null);
                  showToast('Trạng thái đã được thay đổi. Nhớ lưu thay đổi để áp dụng.', 'info');
                }
              }}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PHASE 3: Product Type Change Warning (7.3.2) */}
      <Dialog open={showProductTypeWarning} onOpenChange={setShowProductTypeWarning} modal={true}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Cảnh báo: Thay đổi loại sản phẩm
            </DialogTitle>
            <DialogDescription className="pt-2">
              Sản phẩm này đang có <strong>{formData.variants?.length || 0} biến thể</strong>. 
              Việc thay đổi loại sản phẩm từ <strong>&quot;Có biến thể&quot;</strong> sang <strong>
                {pendingProductType === 'simple' ? 'Đơn giản' : 
                 pendingProductType === 'grouped' ? 'Nhóm sản phẩm' : 
                 pendingProductType === 'external' ? 'Sản phẩm ngoài' : 'Loại khác'}
              </strong> sẽ khiến tất cả các biến thể bị xóa và không thể khôi phục.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-700 mb-2">
              Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
              <p className="text-xs text-amber-800">
                <strong>Lưu ý:</strong> Để thay đổi loại sản phẩm an toàn, vui lòng xóa hoặc quản lý các biến thể trước trong form chỉnh sửa đầy đủ.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowProductTypeWarning(false);
                setPendingProductType(null);
              }}
            >
              Hủy
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
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
            >
              Xác nhận thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Close Dialog */}
      <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose} modal={true}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bạn có thay đổi chưa lưu</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn thoát? Các thay đổi sẽ bị mất.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmClose(false)}>
              Hủy
            </Button>
            <Button onClick={handleConfirmClose}>Thoát</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PHASE 4: Quick Edit Templates (4.3.8) - Save Template Dialog */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog} modal={true}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lưu template</DialogTitle>
            <DialogDescription>
              Lưu các giá trị form hiện tại làm template để sử dụng sau
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-slate-900">Tên template *</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ví dụ: Gấu bông cơ bản"
                className="border-slate-200 focus:ring-2 focus:ring-slate-950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description" className="text-slate-900">Mô tả</Label>
              <Textarea
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={2}
                placeholder="Mô tả template..."
                className="border-slate-200 focus:ring-2 focus:ring-slate-950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-category" className="text-slate-900">Danh mục</Label>
              <Input
                id="template-category"
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                placeholder="Ví dụ: Gấu bông, Đồ chơi"
                className="border-slate-200 focus:ring-2 focus:ring-slate-950"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveTemplateDialog(false);
                setTemplateName('');
                setTemplateDescription('');
                setTemplateCategory('');
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
            >
              Lưu template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PHASE 4: Scheduled Updates (4.4.2) - Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog} modal={true}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lên lịch cập nhật
            </DialogTitle>
            <DialogDescription>
              Lên lịch để áp dụng các thay đổi vào thời điểm cụ thể
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-datetime" className="text-slate-900">Ngày và giờ *</Label>
              <Input
                id="schedule-datetime"
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="border-slate-200 focus:ring-2 focus:ring-slate-950"
              />
              <p className="text-xs text-slate-500">
                Chọn thời điểm để áp dụng các thay đổi. Thời gian phải trong tương lai.
              </p>
            </div>
            {scheduledDateTime && (() => {
              const scheduledDate = new Date(scheduledDateTime);
              const now = new Date();
              const diffMs = scheduledDate.getTime() - now.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMins / 60);
              const diffDays = Math.floor(diffHours / 24);
              
              let timeUntil = '';
              if (diffDays > 0) {
                timeUntil = `Còn ${diffDays} ngày ${diffHours % 24} giờ`;
              } else if (diffHours > 0) {
                timeUntil = `Còn ${diffHours} giờ ${diffMins % 60} phút`;
              } else if (diffMins > 0) {
                timeUntil = `Còn ${diffMins} phút`;
              } else {
                timeUntil = 'Thời gian đã qua';
              }
              
              return (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-900">
                    <strong>Thời gian đã chọn:</strong> {scheduledDate.toLocaleString('vi-VN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">{timeUntil}</p>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowScheduleDialog(false);
                setScheduledDateTime('');
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={async () => {
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
                  // PHASE 1: CSRF Protection (7.12.2) - Include CSRF token in headers
                  const { getCsrfTokenHeader } = await import('@/lib/utils/csrfClient');
                  const csrfToken = await getCsrfTokenHeader();
                  
                  const currentFormData = getFormStateSnapshot();
                  const response = await fetch('/api/admin/products/scheduled-updates', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'X-CSRF-Token': csrfToken, // PHASE 1: CSRF Protection (7.12.2)
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
              disabled={!scheduledDateTime}
            >
              Lên lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PHASE 4: Product Comparison (4.4.1) - Comparison Dialog */}
      <Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog} modal={true}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              So sánh thay đổi
            </DialogTitle>
            <DialogDescription>
              Xem các thay đổi trước khi lưu
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {(() => {
              if (!snapshotInitialData) {
                return (
                  <div className="text-center py-8 text-slate-500">
                    Không có dữ liệu để so sánh
                  </div>
                );
              }

              const currentData = getFormStateSnapshot();
              const oldData = snapshotInitialData;

              // Helper to format values for display
              const formatValue = (value: any): string => {
                if (value === null || value === undefined) return '(trống)';
                if (typeof value === 'boolean') return value ? 'Có' : 'Không';
                if (typeof value === 'number') {
                  if (value === 0) return '0';
                  return value.toLocaleString('vi-VN');
                }
                if (Array.isArray(value)) {
                  if (value.length === 0) return '(trống)';
                  return value.map((v: any) => typeof v === 'object' && v?.name ? v.name : String(v)).join(', ');
                }
                if (typeof value === 'object') {
                  return JSON.stringify(value);
                }
                return String(value);
              };

              // Helper to check if value changed
              const hasChanged = (field: string): boolean => {
                const oldVal = (oldData as any)[field];
                const newVal = (currentData as any)[field];
                if (Array.isArray(oldVal) && Array.isArray(newVal)) {
                  return JSON.stringify(oldVal) !== JSON.stringify(newVal);
                }
                return normalizeValue(oldVal) !== normalizeValue(newVal);
              };

              // Get all fields to compare
              const fieldsToCompare = [
                { key: 'name', label: 'Tên sản phẩm' },
                { key: 'sku', label: 'SKU' },
                { key: 'status', label: 'Trạng thái' },
                { key: 'regularPrice', label: 'Giá gốc', format: (v: any) => v ? `${v.toLocaleString('vi-VN')} đ` : '(trống)' },
                { key: 'salePrice', label: 'Giá khuyến mãi', format: (v: any) => v ? `${v.toLocaleString('vi-VN')} đ` : '(trống)' },
                { key: 'costPrice', label: 'Giá vốn', format: (v: any) => v ? `${v.toLocaleString('vi-VN')} đ` : '(trống)' },
                { key: 'stockQuantity', label: 'Số lượng tồn kho' },
                { key: 'stockStatus', label: 'Trạng thái kho' },
                { key: 'manageStock', label: 'Quản lý kho' },
                { key: 'weight', label: 'Trọng lượng (kg)' },
                { key: 'length', label: 'Chiều dài (cm)' },
                { key: 'width', label: 'Chiều rộng (cm)' },
                { key: 'height', label: 'Chiều cao (cm)' },
                { key: 'lowStockThreshold', label: 'Ngưỡng tồn kho thấp' },
                { key: 'categories', label: 'Danh mục' },
                { key: 'tags', label: 'Thẻ' },
                { key: 'seoTitle', label: 'SEO Title' },
                { key: 'seoDescription', label: 'SEO Description' },
                { key: 'slug', label: 'URL Slug' },
                { key: 'productType', label: 'Loại sản phẩm' },
                { key: 'visibility', label: 'Hiển thị' },
                { key: 'shippingClass', label: 'Hạng vận chuyển' },
                { key: 'taxStatus', label: 'Trạng thái thuế' },
                { key: 'taxClass', label: 'Hạng thuế' },
                { key: 'barcode', label: 'Barcode' },
                { key: 'gtin', label: 'GTIN' },
                { key: 'ean', label: 'EAN' },
                { key: 'soldIndividually', label: 'Bán riêng lẻ' },
                { key: 'backorders', label: 'Cho phép đặt hàng khi hết' },
              ];

              const changedFields = fieldsToCompare.filter(f => hasChanged(f.key));

              return (
                <div className="space-y-4">
                  {changedFields.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      Không có thay đổi nào
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            {changedFields.length} thay đổi
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Export comparison report as JSON
                            const comparison = {
                              productId: product?.id,
                              productName: product?.name,
                              timestamp: new Date().toISOString(),
                              changes: changedFields.map(f => ({
                                field: f.label,
                                oldValue: formatValue((oldData as any)[f.key]),
                                newValue: formatValue((currentData as any)[f.key]),
                              })),
                            };
                            const blob = new Blob([JSON.stringify(comparison, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `comparison-${product?.id || 'product'}-${Date.now()}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            showToast('Đã xuất báo cáo so sánh', 'success');
                          }}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Xuất báo cáo
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Old Values Column */}
                        <div className="space-y-4">
                          <div className="sticky top-0 bg-slate-50 border-b border-slate-200 p-3 rounded-t-md">
                            <h3 className="font-semibold text-slate-900">Giá trị cũ</h3>
                          </div>
                          <div className="space-y-3">
                            {changedFields.map((field) => {
                              const oldVal = (oldData as any)[field.key];
                              const formatted = field.format ? field.format(oldVal) : formatValue(oldVal);
                              return (
                                <div key={field.key} className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                                  <div className="text-xs font-medium text-slate-600 mb-1">{field.label}</div>
                                  <div className="text-sm text-slate-900 break-words">{formatted}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* New Values Column */}
                        <div className="space-y-4">
                          <div className="sticky top-0 bg-green-50 border-b border-green-200 p-3 rounded-t-md">
                            <h3 className="font-semibold text-green-900">Giá trị mới</h3>
                          </div>
                          <div className="space-y-3">
                            {changedFields.map((field) => {
                              const newVal = (currentData as any)[field.key];
                              const formatted = field.format ? field.format(newVal) : formatValue(newVal);
                              return (
                                <div key={field.key} className="p-3 bg-green-50 border border-green-200 rounded-md">
                                  <div className="text-xs font-medium text-green-700 mb-1">{field.label}</div>
                                  <div className="text-sm text-green-900 break-words">{formatted}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComparisonDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PHASE 2: MediaLibraryModal moved to ImagesSection component */}

      {/* UX/UI UPGRADE Phase 4.2.2: Keyboard shortcuts help dialog */}
      {isMobile ? (
        <Sheet open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Phím tắt bàn phím
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6 overflow-y-auto">
              {(() => {
                const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                const modifierKey = isMac ? '⌘' : 'Ctrl';
                return (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">Thao tác chính</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Lưu thay đổi</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + S
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Đóng dialog</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            Esc
                          </kbd>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">Điều hướng</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Thông tin cơ bản</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 1
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Giá & Trạng thái</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 2
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Loại sản phẩm</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 3
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Giao hàng & Thuế</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 4
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Kích thước & Trọng lượng</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 5
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Danh mục</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 6
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Hình ảnh</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 7
                          </kbd>
                        </div>
                      </div>
                    </div>
                    {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4">
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Mẹo</h3>
                      <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                        <li>Sử dụng Tab để di chuyển giữa các trường</li>
                        <li>Nhấn Enter để lưu thay đổi</li>
                        <li>Nhấn Esc để đóng dialog (có xác nhận nếu có thay đổi chưa lưu)</li>
                      </ul>
                    </div>
                  </>
                );
              })()}
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => setShowShortcutsHelp(false)} className="w-full">
                Đóng
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp} modal={true}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Phím tắt bàn phím
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto">
              {(() => {
                const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                const modifierKey = isMac ? '⌘' : 'Ctrl';
                return (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">Thao tác chính</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Lưu thay đổi</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + S
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Đóng dialog</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            Esc
                          </kbd>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">Điều hướng</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Thông tin cơ bản</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 1
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Giá & Trạng thái</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 2
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Loại sản phẩm</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 3
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Giao hàng & Thuế</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 4
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Kích thước & Trọng lượng</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 5
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Danh mục</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 6
                          </kbd>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-700">Hình ảnh</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded">
                            {modifierKey} + 7
                          </kbd>
                        </div>
                      </div>
                    </div>
                    {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4">
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Mẹo</h3>
                      <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                        <li>Sử dụng Tab để di chuyển giữa các trường</li>
                        <li>Nhấn Enter để lưu thay đổi</li>
                        <li>Nhấn Esc để đóng dialog (có xác nhận nếu có thay đổi chưa lưu)</li>
                      </ul>
                    </div>
                  </>
                );
              })()}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowShortcutsHelp(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

