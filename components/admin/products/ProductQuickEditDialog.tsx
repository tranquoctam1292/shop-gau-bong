'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useForm, UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { useProductHistory } from '@/lib/hooks/useProductHistory';
import { useUndoRedo } from '@/lib/hooks/useUndoRedo';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
// PERFORMANCE OPTIMIZATION (2.1.0): Use React Query hook for product fetching
import { useProduct, type ProductWithVariants as UseProductWithVariants } from '@/lib/hooks/useProduct';

// Helper to convert NaN to undefined for optional number fields
const nanToUndefined = z.preprocess((val) => {
  if (typeof val === 'number' && isNaN(val)) {
    return undefined;
  }
  return val;
}, z.number().optional());

// Form schema with NaN protection
const quickEditSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  sku: z.string().optional(),
  status: z.enum(['draft', 'publish', 'trash']),
  manageStock: z.boolean(),
  regularPrice: z.preprocess((val) => {
    // Convert NaN to 0 for required field
    if (typeof val === 'number' && isNaN(val)) {
      return 0;
    }
    return val;
  }, z.number({ invalid_type_error: 'Giá phải là số hợp lệ' })
    .min(0, 'Giá phải >= 0')
    .refine((val) => !isNaN(val) && isFinite(val), { message: 'Giá không hợp lệ' })),
  salePrice: nanToUndefined
    .pipe(z.number({ invalid_type_error: 'Giá khuyến mãi phải là số hợp lệ' })
      .min(0, 'Giá khuyến mãi phải >= 0')
      .optional()
      .refine((val) => val === undefined || (!isNaN(val) && isFinite(val)), { message: 'Giá khuyến mãi không hợp lệ' })),
  stockQuantity: z.preprocess((val) => {
    // Convert NaN to 0 for required field
    if (typeof val === 'number' && isNaN(val)) {
      return 0;
    }
    return val;
  }, z.number({ invalid_type_error: 'Số lượng phải là số hợp lệ' })
    .min(0, 'Số lượng phải >= 0')
    .refine((val) => !isNaN(val) && isFinite(val), { message: 'Số lượng không hợp lệ' })),
  stockStatus: z.enum(['instock', 'outofstock', 'onbackorder']),
  version: z.number().optional(),
  bulkUpdate: z.boolean().default(false),
  // PHASE 1: Weight & Dimensions (4.1.3)
  weight: nanToUndefined.pipe(z.number({ invalid_type_error: 'Trọng lượng phải là số hợp lệ' }).min(0, 'Trọng lượng phải >= 0').optional()),
  length: nanToUndefined.pipe(z.number({ invalid_type_error: 'Chiều dài phải là số hợp lệ' }).min(0, 'Chiều dài phải >= 0').optional()),
  width: nanToUndefined.pipe(z.number({ invalid_type_error: 'Chiều rộng phải là số hợp lệ' }).min(0, 'Chiều rộng phải >= 0').optional()),
  height: nanToUndefined.pipe(z.number({ invalid_type_error: 'Chiều cao phải là số hợp lệ' }).min(0, 'Chiều cao phải >= 0').optional()),
  // PHASE 1: Low Stock Threshold (4.1.4)
  lowStockThreshold: nanToUndefined.pipe(z.number({ invalid_type_error: 'Ngưỡng tồn kho thấp phải là số hợp lệ' }).int('Ngưỡng tồn kho thấp phải là số nguyên').nonnegative('Ngưỡng tồn kho thấp phải >= 0').optional()),
  // PHASE 1: Categories & Tags (4.1.1)
  categories: z.array(z.string()).optional(), // Array of category IDs
  tags: z.array(z.string()).optional(), // Array of tag strings
  // PHASE 1: Featured Image & Gallery (4.1.2)
  _thumbnail_id: z.string().optional(), // Featured image ID
  _product_image_gallery: z.string().optional(), // Comma-separated gallery image IDs
  // PHASE 2: SEO Fields (4.2.1)
  seoTitle: z.string().max(60, 'Meta Title không được vượt quá 60 ký tự').optional(),
  seoDescription: z.string().max(160, 'Meta Description không được vượt quá 160 ký tự').optional(),
  slug: z.string().min(1, 'URL Slug không được để trống').regex(/^[a-z0-9-]+$/, 'URL Slug chỉ được chứa chữ thường, số và dấu gạch ngang').optional(),
  // PHASE 2: Cost Price (4.2.2)
  costPrice: nanToUndefined.pipe(z.number({ invalid_type_error: 'Giá vốn phải là số hợp lệ' }).min(0, 'Giá vốn phải >= 0').optional()),
  // PHASE 2: Product Type & Visibility (4.2.3)
  productType: z.enum(['simple', 'variable', 'grouped', 'external']).optional(),
  visibility: z.enum(['public', 'private', 'password']).optional(),
  password: z.string().optional(),
  // PHASE 2: Shipping Class & Tax Settings (4.2.4)
  shippingClass: z.string().optional(),
  taxStatus: z.enum(['taxable', 'shipping', 'none']).optional(),
  taxClass: z.string().optional(),
  // PHASE 3: Barcode/GTIN/EAN (4.3.1)
  barcode: z.string().optional(),
  gtin: z.string().optional(),
  ean: z.string().optional(),
  // PHASE 3: Product Options (4.3.2) - Attributes enable/disable
  attributes: z.array(z.object({
    name: z.string(),
    visible: z.boolean().optional(),
  })).optional(),
  // PHASE 3: Sold Individually (4.3.3)
  soldIndividually: z.boolean().optional(),
  // PHASE 3: Backorders Settings (4.3.4)
  backorders: z.enum(['no', 'notify', 'yes']).optional(),
  variants: z.array(z.object({
    id: z.string(),
    sku: z.string().optional(),
    price: nanToUndefined
      .pipe(z.number({ invalid_type_error: 'Giá phải là số hợp lệ' })
        .min(0, 'Giá phải >= 0')
        .optional()
        .refine((val) => val === undefined || (!isNaN(val) && isFinite(val)), { message: 'Giá không hợp lệ' })),
    stock: nanToUndefined
      .pipe(z.number({ invalid_type_error: 'Số lượng phải là số hợp lệ' })
        .min(0, 'Số lượng phải >= 0')
        .optional()
        .refine((val) => val === undefined || (!isNaN(val) && isFinite(val)), { message: 'Số lượng không hợp lệ' })),
    // Display-only fields (not editable in form, but needed for VariantQuickEditTable)
    size: z.string().optional(),
    color: z.string().optional(),
    colorCode: z.string().optional(),
    image: z.string().optional(),
  })).optional(),
}).refine(
  (data) => {
    if (data.salePrice !== undefined && data.regularPrice !== undefined) {
      return data.salePrice < data.regularPrice;
    }
    return true;
  },
  { message: 'Giá khuyến mãi phải nhỏ hơn giá thường', path: ['salePrice'] }
);

type QuickEditFormData = z.infer<typeof quickEditSchema>;

interface ProductQuickEditDialogProps {
  product?: MappedProduct; // Optional for bulk mode
  productIds?: string[]; // For bulk edit mode
  open: boolean;
  onClose: () => void;
  onSuccess?: (updatedProduct: MappedProduct) => void;
  onBulkSuccess?: (updatedCount: number) => void; // For bulk mode
}

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
      reset(updatedInitialData);
      setSnapshotInitialData(updatedInitialData);
      
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
      
      // Hide success indicator after 3 seconds
      setTimeout(() => {
        setShowSuccessIndicator(false);
        setSavedFields(new Set());
      }, 3000);
      
      // Close dialog after showing success feedback (delay 2 seconds)
      setTimeout(() => {
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
  // PHASE 2: Visual Feedback for Edited Fields (7.11.2)
  const [fieldOriginalValues, setFieldOriginalValues] = useState<Record<string, any>>({});
  // PHASE 2: Mobile Sheet Scrolling Issues (7.11.8)
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  // Store initial data snapshot when dialog opens to prevent comparison issues
  const [snapshotInitialData, setSnapshotInitialData] = useState<QuickEditFormData | null>(null);
  // CRITICAL FIX: Track if form has been initialized (reset completed) to prevent false positive isDirty
  const [formInitialized, setFormInitialized] = useState(false);
  // CRITICAL FIX: Track if form initialization check has been performed (prevents re-checking on every field change)
  const formInitializedCheckedRef = useRef(false);
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
        shippingClass: '__none__',
        taxStatus: 'taxable',
        taxClass: '__none__',
        variants: [],
      };
    }
    
    const currentProduct = productWithVariants || product;
    if (!currentProduct) {
      // Return empty form if no product
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
        variants: [],
      } as QuickEditFormData;
    }
    
    // Get variants from productWithVariants (from API) or product (fallback)
    const productVariants = (currentProduct as unknown as ProductWithVariants).variants || [];
    
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

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty: formIsDirty },
    setValue,
    watch,
    reset,
    getValues,
  } = useForm<QuickEditFormData>({
    resolver: zodResolver(quickEditSchema),
    defaultValues: initialData,
  });

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
  
  // PHASE 3: Field Focus Visual Enhancement (7.11.13) - Enhanced focus handler
  const handleFieldFocus = useCallback((fieldId: string, e?: React.FocusEvent<HTMLInputElement>) => {
    setFocusedFieldId(fieldId);
    // Call original handleInputFocus for mobile keyboard handling
    if (e) {
      handleInputFocus(e);
    }
  }, [handleInputFocus]);
  
  // PHASE 3: Field Focus Visual Enhancement (7.11.13) - Enhanced blur handler
  const handleFieldBlur = useCallback((_e?: React.FocusEvent<HTMLInputElement>) => {
    setFocusedFieldId(null);
  }, []);
  
  // State for UI (categoriesPopoverOpen already declared at line 698 for useCategories hook)
  const [tagsInputValue, setTagsInputValue] = useState('');
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
        reset(templateData, { keepDefaultValues: false });
        // Update snapshot for dirty check
        setSnapshotInitialData(templateData);
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
  }, [reset, resetHistory, showToast, setSnapshotInitialData]);

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

  useEffect(() => {
    if (open && initialData) {
      // CRITICAL FIX: Reset form first, then set snapshot
      // This ensures form values are ready before isDirty check
      reset(initialData, { keepDefaultValues: false });
      // Snapshot initial data after reset to ensure stable comparison
      setSnapshotInitialData(initialData);
      // CRITICAL FIX: Mark form as not initialized initially
      // formInitialized will be set to true after a delay to ensure form is fully reset
      setFormInitialized(false);
      formInitializedCheckedRef.current = false;
      setShowConfirmClose(false); // Reset confirm dialog state when opening
      
      // PHASE 2: Visual Feedback for Edited Fields (7.11.2) - Store original values
      const originalValues: Record<string, any> = {
        name: initialData.name || '',
        sku: initialData.sku || '',
        status: initialData.status || 'draft',
        regularPrice: initialData.regularPrice || 0,
        salePrice: initialData.salePrice,
        stockQuantity: initialData.stockQuantity || 0,
        stockStatus: initialData.stockStatus || 'instock',
        weight: initialData.weight,
        length: initialData.length,
        width: initialData.width,
        height: initialData.height,
        lowStockThreshold: initialData.lowStockThreshold,
        categories: initialData.categories || [],
        tags: initialData.tags || [],
        _thumbnail_id: initialData._thumbnail_id,
        _product_image_gallery: initialData._product_image_gallery,
        seoTitle: initialData.seoTitle,
        seoDescription: initialData.seoDescription,
        slug: initialData.slug,
        costPrice: initialData.costPrice,
        productType: initialData.productType,
        visibility: initialData.visibility,
        shippingClass: initialData.shippingClass,
        taxStatus: initialData.taxStatus,
        taxClass: initialData.taxClass,
        barcode: initialData.barcode,
        gtin: initialData.gtin,
        ean: initialData.ean,
        soldIndividually: initialData.soldIndividually,
        backorders: initialData.backorders,
      };
      setFieldOriginalValues(originalValues);
    } else if (!open) {
      // Clear snapshot when dialog closes
      setSnapshotInitialData(null);
      setFieldOriginalValues({});
      setFormInitialized(false); // Reset form initialized flag when dialog closes
      formInitializedCheckedRef.current = false; // Reset checked flag when dialog closes
    }
    // Remove initialData from dependencies to prevent reset during editing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

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
        });
      });
    } else if (!open) {
      // Reset checked flag when dialog closes
      formInitializedCheckedRef.current = false;
    }
  }, [open, snapshotInitialData]); // Only depend on open and snapshotInitialData

  // Auto-sync stock status logic
  const handleStockQuantityChange = (
    newQty: number,
    currentStatus: string,
    setValue: UseFormSetValue<QuickEditFormData>
  ) => {
    // Only auto-sync if current status is NOT onbackorder
    if (currentStatus !== 'onbackorder') {
      if (newQty > 0) {
        setValue('stockStatus', 'instock', { shouldDirty: true });
      } else {
        setValue('stockStatus', 'outofstock', { shouldDirty: true });
      }
    }
    // If onbackorder, respect user's manual choice (don't auto-sync)
  };

  // Helper function to normalize values for comparison
  const normalizeValue = (value: any): any => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && value.trim() === '') return '';
    if (typeof value === 'number' && isNaN(value)) return 0;
    return value;
  };

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
    
  // PHASE 2: Visual Feedback for Edited Fields (7.11.2) - Helper to check if field is edited
  const isFieldEdited = useCallback((fieldName: string, currentValue: any): boolean => {
    if (!fieldOriginalValues || Object.keys(fieldOriginalValues).length === 0) return false;
    const originalValue = fieldOriginalValues[fieldName];
    return normalizeValue(currentValue) !== normalizeValue(originalValue);
  }, [fieldOriginalValues]);

  // PHASE 2: Visual Feedback for Edited Fields (7.11.2) - Get field change tooltip text
  const getFieldChangeTooltip = useCallback((fieldName: string, currentValue: any): string => {
    if (!fieldOriginalValues || Object.keys(fieldOriginalValues).length === 0) return '';
    const originalValue = fieldOriginalValues[fieldName];
    const normalizedOriginal = normalizeValue(originalValue);
    const normalizedCurrent = normalizeValue(currentValue);
    
    if (normalizedOriginal === normalizedCurrent) return '';
    
    const formatValue = (val: any): string => {
      if (val === null || val === undefined || val === '') return '(trống)';
      if (typeof val === 'number') return val.toLocaleString('vi-VN');
      if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : '(trống)';
      return String(val);
    };
    
    return `Gốc: ${formatValue(originalValue)} → Mới: ${formatValue(currentValue)}`;
  }, [fieldOriginalValues]);

  // PHASE 2: Visual Feedback for Edited Fields (7.11.2) - Reset field to original value
  const resetFieldToOriginal = useCallback((fieldName: string) => {
    if (!fieldOriginalValues || !fieldOriginalValues[fieldName]) return;
    const originalValue = fieldOriginalValues[fieldName];
    
    // Reset based on field type - use setValue for all fields
    // Categories, tags, and images are handled via form state
    setValue(fieldName as any, originalValue, { shouldDirty: true });
  }, [fieldOriginalValues, setValue]);

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

  const onSubmit = async (data: QuickEditFormData) => {
    // PHASE 2: Loading Progress Indicator (7.9.3) - Set loading steps
    setLoadingStep('validating');
    try {
      // PHASE 2: Bulk Edit Mode (4.2.5)
      if (isBulkMode && productIds && productIds.length > 0) {
        // Build updates object (only fields that can be bulk updated)
        const updates: any = {};
        
        // Only include fields that have values (not empty/default)
        if (data.status) updates.status = data.status;
        if (data.regularPrice !== undefined && !isNaN(data.regularPrice) && data.regularPrice > 0) {
          updates.regularPrice = data.regularPrice;
        }
        if (data.salePrice !== undefined && !isNaN(data.salePrice) && data.salePrice > 0) {
          updates.salePrice = data.salePrice;
        } else if (data.salePrice === null || data.salePrice === 0) {
          updates.salePrice = null; // Clear sale price
        }
        if (data.stockQuantity !== undefined && !isNaN(data.stockQuantity)) {
          updates.stockQuantity = data.stockQuantity;
        }
        if (data.stockStatus) updates.stockStatus = data.stockStatus;
        if (data.categories && data.categories.length > 0) updates.categories = data.categories;
        if (data.tags && data.tags.length > 0) updates.tags = data.tags;
        
        // Check if there are any updates
        if (Object.keys(updates).length === 0) {
          showToast('Vui lòng nhập ít nhất một thay đổi', 'warning');
          return;
        }
        
        // Show progress
        setBulkUpdateProgress({
          current: 0,
          total: productIds.length,
          status: 'updating',
        });
        
        try {
          const response = await fetch('/api/admin/products/bulk-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              ids: productIds,
              action: 'quick_update',
              value: updates,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update products');
          }
          
          const result = await response.json();
          
          setBulkUpdateProgress({
            current: result.updated || 0,
            total: productIds.length,
            status: 'completed',
          });
          
          showToast(
            `Đã cập nhật ${result.updated || 0} sản phẩm${result.failed > 0 ? `, ${result.failed} sản phẩm thất bại` : ''}`,
            result.failed > 0 ? 'warning' : 'success'
          );
          
          onBulkSuccess?.(result.updated || 0);
          
          // Close dialog after a short delay
          setTimeout(() => {
            onClose();
          }, 1500);
        } catch (error: any) {
          setBulkUpdateProgress({
            current: 0,
            total: productIds.length,
            status: 'error',
          });
          showToast(error.message || 'Không thể cập nhật sản phẩm', 'error');
        }
        return;
      }
      
      // Single product mode (existing logic)
      // Filter out NaN values before sending to API
      const updates: any = {
        name: data.name,
        sku: data.sku,
        status: data.status,
        manageStock: data.manageStock,
        // Only include regularPrice if it's a valid number and > 0
        // This prevents sending 0 which would be rejected by backend validation
        ...(data.regularPrice !== undefined && !isNaN(data.regularPrice) && data.regularPrice > 0 && { regularPrice: data.regularPrice }),
        stockQuantity: !isNaN(data.stockQuantity) ? data.stockQuantity : 0,
        stockStatus: data.stockStatus,
        // Fix #22: Default version to 1 if undefined
        version: data.version || 1,
      };

      // Fix #18: Handle salePrice - send value if > 0, send null to clear if undefined and product has salePrice
      // PHASE 2: Type Mismatch Fix (7.8.1) - Use type-safe validation
      if (data.salePrice !== undefined && isValidPrice(data.salePrice) && data.salePrice > 0) {
        updates.salePrice = data.salePrice;
      } else if (data.salePrice === undefined && product?.salePrice) {
        // User wants to clear salePrice - send null to backend
        updates.salePrice = null;
      }

      if (data.variants && data.variants.length > 0) {
        // PHASE 2: Type Mismatch Fix (7.8.1) - Use type-safe validation
        updates.variants = data.variants.map((v) => ({
          id: v.id,
          ...(v.sku !== undefined && { sku: v.sku }),
          ...(v.price !== undefined && isValidPrice(v.price) && { price: v.price }),
          ...(v.stock !== undefined && isValidInteger(v.stock) && { stock: v.stock }),
        }));
      }

      // PHASE 1: Weight & Dimensions (4.1.3)
      // PHASE 2: Type Mismatch Fix (7.8.1) - Use type-safe validation
      if (data.weight !== undefined && isValidPrice(data.weight)) {
        updates.weight = data.weight;
      }
      if (data.length !== undefined && isValidPrice(data.length)) {
        updates.length = data.length;
      }
      if (data.width !== undefined && isValidPrice(data.width)) {
        updates.width = data.width;
      }
      if (data.height !== undefined && isValidPrice(data.height)) {
        updates.height = data.height;
      }

      // PHASE 1: Low Stock Threshold (4.1.4)
      // PHASE 2: Type Mismatch Fix (7.8.1) - Use type-safe validation
      if (data.lowStockThreshold !== undefined && isValidInteger(data.lowStockThreshold)) {
        updates.lowStockThreshold = data.lowStockThreshold;
      }

      // PHASE 2: Additional fields for single product mode
      if (data.categories) updates.categories = data.categories;
      if (data.tags) updates.tags = data.tags;
      if (data.seoTitle) updates.seoTitle = data.seoTitle;
      if (data.seoDescription) updates.seoDescription = data.seoDescription;
      if (data.slug) updates.slug = data.slug;
      // PHASE 2: Type Mismatch Fix (7.8.1) - Use type-safe validation
      if (data.costPrice !== undefined && isValidPrice(data.costPrice)) {
        updates.costPrice = data.costPrice;
      }
      if (data.productType) updates.productType = data.productType;
      if (data.visibility) updates.visibility = data.visibility;
      if (data.password) updates.password = data.password;
      if (data.shippingClass && data.shippingClass !== '__none__') {
        updates.shippingClass = data.shippingClass;
      }
      if (data.taxStatus) updates.taxStatus = data.taxStatus;
      if (data.taxClass && data.taxClass !== '__none__') {
        updates.taxClass = data.taxClass;
      }
      
      // PHASE 3: Barcode/GTIN/EAN (4.3.1)
      if (data.barcode !== undefined) {
        updates.barcode = data.barcode || undefined;
      }
      if (data.gtin !== undefined) {
        updates.gtin = data.gtin || undefined;
      }
      if (data.ean !== undefined) {
        updates.ean = data.ean || undefined;
      }
      
      // PHASE 3: Product Options (4.3.2) - Attributes enable/disable
      if (data.attributes !== undefined && Array.isArray(data.attributes)) {
        updates.attributes = data.attributes;
      }
      
      // PHASE 3: Sold Individually (4.3.3)
      if (data.soldIndividually !== undefined) {
        updates.soldIndividually = data.soldIndividually;
      }
      
      // PHASE 3: Backorders Settings (4.3.4)
      if (data.backorders !== undefined) {
        updates.backorders = data.backorders;
      }

      if (!product?.id) {
        showToast('Không tìm thấy sản phẩm', 'error');
        return;
      }

      // PHASE 2: Loading Progress Indicator (7.9.3) - Update step to saving
      setLoadingStep('saving');
      await quickUpdate(product!.id, updates);
      setLoadingStep('complete');
      // Reset after brief delay to show completion
      setTimeout(() => {
        setLoadingStep('idle');
      }, 500);
    } catch (error: any) {
      // Error handling is done in useQuickUpdateProduct hook
      console.error('Error updating product:', error);
      setLoadingStep('idle');
    }
  };

  // PHASE 1: Error Message Details (7.6.3) - Handle form validation errors with detailed display
  const onError = (errors: any) => {
    // Collect all error messages with field names
    const errorList: Array<{ field: string; message: string }> = [];
    
    // Helper to get field label
    const getFieldLabel = (fieldName: string): string => {
      const labels: Record<string, string> = {
        name: 'Tên sản phẩm',
        sku: 'SKU',
        status: 'Trạng thái',
        regularPrice: 'Giá gốc',
        salePrice: 'Giá khuyến mãi',
        costPrice: 'Giá vốn',
        stockQuantity: 'Số lượng tồn kho',
        stockStatus: 'Trạng thái kho',
        weight: 'Trọng lượng',
        length: 'Chiều dài',
        width: 'Chiều rộng',
        height: 'Chiều cao',
        lowStockThreshold: 'Ngưỡng tồn kho thấp',
        categories: 'Danh mục',
        tags: 'Thẻ',
        variants: 'Biến thể',
      };
      return labels[fieldName] || fieldName;
    };
    
    // Extract errors from react-hook-form errors object
    const extractErrors = (errorObj: any, prefix = ''): void => {
      Object.keys(errorObj).forEach((key) => {
        const error = errorObj[key];
        if (error?.message) {
          errorList.push({
            field: prefix ? `${prefix}.${key}` : key,
            message: error.message,
          });
        } else if (error && typeof error === 'object') {
          // Nested errors (e.g., variants[0].price)
          extractErrors(error, prefix ? `${prefix}.${key}` : key);
        }
      });
    };
    
    extractErrors(errors);
    
    if (errorList.length > 0) {
      // Show summary toast with all errors
      if (errorList.length === 1) {
        showToast(
          `${getFieldLabel(errorList[0].field)}: ${errorList[0].message}`,
          'error'
        );
      } else {
        // Multiple errors - show summary
        const errorSummary = errorList
          .slice(0, 3) // Show first 3 errors in toast
          .map((err) => `• ${getFieldLabel(err.field)}: ${err.message}`)
          .join('\n');
        const remainingCount = errorList.length - 3;
        const summaryText = remainingCount > 0
          ? `Có ${errorList.length} lỗi validation:\n${errorSummary}\n... và ${remainingCount} lỗi khác`
          : `Có ${errorList.length} lỗi validation:\n${errorSummary}`;
        showToast(summaryText, 'error');
      }
    }
  };

  // Handle stock quantity change with auto-sync
  const handleStockQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQty = parseInt(e.target.value, 10) || 0;
    setValue('stockQuantity', newQty, { shouldDirty: true });
    handleStockQuantityChange(newQty, currentStockStatus, setValue);
    
    // PHASE 3: Backorders Auto-sync (4.3.4) - Nếu "Do not allow" và stock = 0 → stockStatus = "outofstock"
    const currentBackorders = watch('backorders') || 'no';
    if (currentBackorders === 'no' && newQty === 0) {
      setValue('stockStatus', 'outofstock', { shouldDirty: true });
    }
  };

  // PHASE 1: Error Message Details (7.6.3) - Collect all validation errors for summary display
  const allValidationErrors = useMemo(() => {
    const errorList: Array<{ field: string; message: string; label: string }> = [];
    
    const getFieldLabel = (fieldName: string): string => {
      const labels: Record<string, string> = {
        name: 'Tên sản phẩm',
        sku: 'SKU',
        status: 'Trạng thái',
        regularPrice: 'Giá gốc',
        salePrice: 'Giá khuyến mãi',
        costPrice: 'Giá vốn',
        stockQuantity: 'Số lượng tồn kho',
        stockStatus: 'Trạng thái kho',
        weight: 'Trọng lượng',
        length: 'Chiều dài',
        width: 'Chiều rộng',
        height: 'Chiều cao',
        lowStockThreshold: 'Ngưỡng tồn kho thấp',
        categories: 'Danh mục',
        tags: 'Thẻ',
        variants: 'Biến thể',
        seoTitle: 'Meta Title',
        seoDescription: 'Meta Description',
        slug: 'URL Slug',
        productType: 'Loại sản phẩm',
        visibility: 'Hiển thị',
        password: 'Mật khẩu',
        shippingClass: 'Lớp giao hàng',
        taxStatus: 'Trạng thái thuế',
        taxClass: 'Loại thuế',
      };
      return labels[fieldName] || fieldName;
    };
    
    const extractErrors = (errorObj: any, prefix = ''): void => {
      Object.keys(errorObj).forEach((key) => {
        const error = errorObj[key];
        if (error?.message) {
          const fieldName = prefix ? key : key;
          errorList.push({
            field: prefix ? `${prefix}.${key}` : key,
            message: error.message,
            label: getFieldLabel(fieldName),
          });
        } else if (error && typeof error === 'object') {
          extractErrors(error, prefix ? `${prefix}.${key}` : key);
        }
      });
    };
    
    extractErrors(errors);
    return errorList;
  }, [errors]);

  // PERFORMANCE OPTIMIZATION (3.3.1): Show skeleton loader while loading product data
  const formContent = (
    <form id="quick-edit-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
      {/* PERFORMANCE OPTIMIZATION (3.3.1): Show skeleton loader while loading */}
      {loadingProduct && !isBulkMode && (
        <ProductQuickEditSkeleton />
      )}
      
      {/* PHASE 2: Success Feedback Enhancement (7.11.4) - "All changes saved" message */}
      {!loadingProduct && showSuccessIndicator && !isDirty && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-2 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
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
      {!loadingProduct && allValidationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-2 animate-in slide-in-from-top-2">
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
                <span className="font-medium">{err.label}:</span> {err.message}
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
      {/* PHASE 3: Section Shortcuts (7.11.15) - Add id for section navigation */}
      <div id="section-basic-info" className="flex items-center gap-2 mb-2 scroll-mt-4">
        <Package className="h-5 w-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-900">Thông tin cơ bản</h3>
      </div>
      
      {/* Row 1: Thông tin cơ bản - Grid 2 cột */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="quick-edit-name" className="text-slate-900">Tên sản phẩm</Label>
          <Input
            id="quick-edit-name"
            {...register('name')}
            onFocus={(e) => handleFieldFocus('quick-edit-name', e)}
            onBlur={handleFieldBlur}
            className={`${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300 ${focusedFieldId === 'quick-edit-name' ? 'ring-2 ring-slate-950 ring-offset-2' : ''}`}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
          <Label htmlFor="quick-edit-sku" className="text-slate-900">SKU</Label>
            <div title="Mã sản phẩm duy nhất (Stock Keeping Unit). VD: GAU-BONG-001">
              <Info className="h-4 w-4 text-slate-400 cursor-help" />
            </div>
          </div>
          <div className="relative">
          <Input
            id="quick-edit-sku"
            {...register('sku')}
              onFocus={(e) => handleFieldFocus('quick-edit-sku', e)}
              onBlur={handleFieldBlur}
              aria-label="Mã SKU sản phẩm"
              aria-describedby={errors.sku ? 'quick-edit-sku-error' : skuValidation.error ? 'quick-edit-sku-validation-error' : 'quick-edit-sku-help'}
              className={`${errors.sku || (skuValidation.isValid === false && skuValidation.error) 
                ? 'border-red-500 focus:ring-red-500 pr-10' 
                : savedFields.has('sku')
                  ? 'border-green-500 bg-green-50/50 pr-10 transition-all duration-300'
                  : skuValidation.isValid === true 
                    ? 'border-green-500 focus:ring-green-500 pr-10' 
                    : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300 ${focusedFieldId === 'quick-edit-sku' ? 'ring-2 ring-slate-950 ring-offset-2' : ''}`}
              placeholder="VD: GAU-BONG-001"
          />
            {/* PHASE 2: SKU Real-time Validation (7.8.2) - Visual feedback icons */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {skuValidation.isValidating && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              )}
              {!skuValidation.isValidating && skuValidation.isValid === true && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {!skuValidation.isValidating && skuValidation.isValid === false && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          {/* PHASE 2: SKU Real-time Validation (7.8.2) - Error messages */}
          {/* PHASE 3: ARIA Labels & Accessibility (7.9.1) - Link error messages with aria-describedby */}
          {errors.sku && (
            <div id="quick-edit-sku-error" className="flex items-center gap-1 text-sm text-red-600" role="alert">
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <p>{errors.sku.message}</p>
            </div>
          )}
          {!errors.sku && skuValidation.error && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{skuValidation.error}</p>
        </div>
          )}
          {!errors.sku && !skuValidation.error && skuValidation.isValid === true && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <p>SKU có sẵn</p>
            </div>
          )}
          <p className="text-xs text-slate-500">Mã sản phẩm duy nhất để quản lý tồn kho</p>
        </div>
      </div>

      {/* PHASE 3: Barcode/GTIN/EAN (4.3.1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="quick-edit-barcode" className="text-slate-900">Barcode</Label>
          <Input
            id="quick-edit-barcode"
            {...register('barcode')}
            className={`${errors.barcode ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
            placeholder="Nhập barcode..."
            onFocus={handleInputFocus}
          />
          {errors.barcode && (
            <p className="text-xs text-red-500">{errors.barcode.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quick-edit-gtin" className="text-slate-900">GTIN</Label>
          <Input
            id="quick-edit-gtin"
            {...register('gtin')}
            className={`${errors.gtin ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
            placeholder="Nhập GTIN..."
            onFocus={handleInputFocus}
          />
          {errors.gtin && (
            <p className="text-xs text-red-500">{errors.gtin.message}</p>
          )}
          <p className="text-xs text-slate-500">Global Trade Item Number</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quick-edit-ean" className="text-slate-900">EAN</Label>
          <Input
            id="quick-edit-ean"
            {...register('ean')}
            className={`${errors.ean ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
            placeholder="Nhập EAN..."
            onFocus={handleInputFocus}
          />
          {errors.ean && (
            <p className="text-xs text-red-500">{errors.ean.message}</p>
          )}
          <p className="text-xs text-slate-500">European Article Number</p>
        </div>
      </div>

      {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
      {/* PHASE 3: Section Shortcuts (7.11.15) - Add id for section navigation */}
      <div id="section-pricing" className="flex items-center gap-2 mb-2 mt-6 scroll-mt-4">
        <DollarSign className="h-5 w-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-900">Giá & Trạng thái</h3>
      </div>

      {/* Row 2: Giá & Trạng thái - Grid 3 cột */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="quick-edit-status" className="text-slate-900">Trạng thái</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => {
              const newStatus = value as 'draft' | 'publish' | 'trash';
              const currentStatus = formData.status;
              
              // PHASE 3: Status Change Confirmation (7.10.3) - Show warning when changing from Publish to Draft
              if (currentStatus === 'publish' && newStatus === 'draft') {
                setPreviousStatus(currentStatus);
                setPendingStatus(newStatus);
                setShowStatusChangeWarning(true);
              } else {
                setValue('status', newStatus, { shouldDirty: true });
              }
            }}
          >
            <SelectTrigger 
              id="quick-edit-status"
              className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="publish">Đã xuất bản</SelectItem>
              <SelectItem value="trash">Thùng rác</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quick-edit-regular-price" className="text-slate-900">Giá gốc (đ)</Label>
          <PriceInput
            id="quick-edit-regular-price"
            value={regularPrice}
            onChange={(value) => {
              setValue('regularPrice', value || 0, { shouldDirty: true });
            }}
            onFocus={handleInputFocus}
            showCurrency={true}
            showClearButton={true}
            placeholder="Nhập giá gốc..."
            aria-label="Giá gốc sản phẩm"
            aria-describedby={errors.regularPrice ? 'quick-edit-regular-price-error' : 'quick-edit-regular-price-help'}
            className={`${errors.regularPrice ? 'border-red-500 focus:ring-red-500' : savedFields.has('regularPrice') ? 'border-green-500 bg-green-50/50 transition-all duration-300' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
          />
          {errors.regularPrice && (
            <p id="quick-edit-regular-price-error" className="text-xs text-red-500" role="alert">{errors.regularPrice.message}</p>
          )}
          {/* PHASE 2: Price Formatting Consistency (7.11.11) - Format hint */}
          <p id="quick-edit-regular-price-help" className="text-xs text-slate-500">VD: 1.000.000 đ</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
          <Label htmlFor="quick-edit-sale-price" className="text-slate-900">Giá khuyến mãi (đ)</Label>
            <div title="Giá khuyến mãi phải nhỏ hơn giá gốc. Để trống để xóa khuyến mãi. VD: 800000">
              <Info className="h-4 w-4 text-slate-400 cursor-help" />
            </div>
          </div>
          <PriceInput
            id="quick-edit-sale-price"
            value={salePrice}
            onChange={(value) => {
              setValue('salePrice', value, { shouldDirty: true });
            }}
            onFocus={handleInputFocus}
            showCurrency={true}
            showClearButton={true}
            placeholder="Nhập giá khuyến mãi..."
            aria-label="Giá khuyến mãi sản phẩm"
            aria-describedby={errors.salePrice ? 'quick-edit-sale-price-error' : 'quick-edit-sale-price-help'}
            className={`${errors.salePrice ? 'border-red-500 focus:ring-red-500' : savedFields.has('salePrice') ? 'border-green-500 bg-green-50/50 transition-all duration-300' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
          />
          {errors.salePrice && (
            <div id="quick-edit-sale-price-error" className="flex items-center gap-1 text-sm text-red-600" role="alert">
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <p>{errors.salePrice.message}</p>
            </div>
          )}
          {/* PHASE 2: Price Formatting Consistency (7.11.11) - Format hint */}
          <p id="quick-edit-sale-price-help" className="text-xs text-slate-500">Giá khuyến mãi (phải nhỏ hơn giá gốc). Để trống để xóa khuyến mãi. VD: 800.000 đ</p>
        </div>

        {/* PHASE 2: Cost Price (4.2.2) */}
        <div className="space-y-2">
          <Label htmlFor="quick-edit-cost-price" className="text-slate-900">Giá vốn (đ)</Label>
          <PriceInput
            id="quick-edit-cost-price"
            value={costPrice}
            onChange={(value) => {
              setValue('costPrice', value, { shouldDirty: true });
            }}
            onFocus={handleInputFocus}
            showCurrency={true}
            className={`${errors.costPrice ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
          />
          {errors.costPrice && (
            <p className="text-xs text-red-500">{errors.costPrice.message}</p>
          )}
          {/* PHASE 2: Price Formatting Consistency (7.11.11) - Format hint */}
          <p className="text-xs text-slate-500">VD: 500.000 đ</p>
          {/* Profit Margin Calculation */}
          {(() => {
            const costPrice = watch('costPrice');
            const regularPrice = watch('regularPrice');
            if (costPrice && regularPrice && regularPrice > 0 && costPrice >= 0) {
              const profitMargin = ((regularPrice - costPrice) / regularPrice) * 100;
              const profit = regularPrice - costPrice;
              return (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">
                    Lợi nhuận: <span className="font-medium text-slate-700">{profit.toLocaleString('vi-VN')} đ</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Tỷ suất lợi nhuận: <span className={`font-medium ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(2)}%
                    </span>
                  </p>
                </div>
              );
            }
            return (
              <p className="text-xs text-slate-500">
                Giá vốn để tính lợi nhuận và tỷ suất lợi nhuận
              </p>
            );
          })()}
        </div>
      </div>

      {/* PHASE 2: Product Type & Visibility Section (4.2.3) */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
      {loadedSections.has('secondary') ? (
        <>
      {/* PHASE 3: Section Shortcuts (7.11.15) - Add id for section navigation */}
      <div id="section-product-type" className="flex items-center gap-2 mb-2 mt-6 scroll-mt-4">
        <Package className="h-5 w-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-900">Loại sản phẩm & Hiển thị</h3>
      </div>
      
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4 mb-6">
        {/* Product Type */}
        <div className="space-y-2">
          <Label htmlFor="quick-edit-product-type" className="text-slate-900">Loại sản phẩm</Label>
          <Select
            value={watch('productType')}
            onValueChange={(value) => {
              const newType = value as 'simple' | 'variable' | 'grouped' | 'external';
              const currentType = watch('productType') || 'simple';
              const hasVariants = formData.variants && formData.variants.length > 0;
              
              // PHASE 2: Warning khi change từ variable sang simple/grouped/external (4.2.3)
              if (currentType === 'variable' && newType !== 'variable' && hasVariants) {
                setPendingProductType(newType);
                setShowProductTypeWarning(true);
              } else {
                setValue('productType', newType, { shouldDirty: true });
              }
            }}
          >
            <SelectTrigger 
              id="quick-edit-product-type"
              className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Đơn giản</SelectItem>
              <SelectItem value="variable">Có biến thể</SelectItem>
              <SelectItem value="grouped">Nhóm sản phẩm</SelectItem>
              <SelectItem value="external">Sản phẩm ngoài</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Loại sản phẩm xác định cách sản phẩm được bán và quản lý
          </p>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <Label htmlFor="quick-edit-visibility" className="text-slate-900">Hiển thị</Label>
          <Select
            value={watch('visibility')}
            onValueChange={(value) => {
              setValue('visibility', value as 'public' | 'private' | 'password', { shouldDirty: true });
              // Clear password if not password-protected
              if (value !== 'password') {
                setValue('password', '', { shouldDirty: true });
              }
            }}
          >
            <SelectTrigger 
              id="quick-edit-visibility"
              className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Công khai</SelectItem>
              <SelectItem value="private">Riêng tư</SelectItem>
              <SelectItem value="password">Bảo vệ bằng mật khẩu</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Xác định ai có thể xem sản phẩm này
          </p>
        </div>

        {/* Password (conditional) */}
        {watch('visibility') === 'password' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label htmlFor="quick-edit-password" className="text-slate-900">Mật khẩu</Label>
            <Input
              id="quick-edit-password"
              type="password"
              {...register('password')}
              className={`${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
              placeholder="Nhập mật khẩu để bảo vệ sản phẩm..."
          />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
            <p className="text-xs text-slate-500">
              Mật khẩu để khách hàng truy cập sản phẩm này
            </p>
        </div>
        )}
      </div>
        </>
      ) : (
        <div className="mt-6 space-y-4 animate-pulse">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4">
            <div className="h-10 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-200 rounded" />
          </div>
        </div>
      )}

      {/* PHASE 2: Shipping Class & Tax Settings Section (4.2.4) */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
      {loadedSections.has('secondary') ? (
        <>
      {/* PHASE 3: Section Shortcuts (7.11.15) - Add id for section navigation */}
      <div id="section-shipping" className="flex items-center gap-2 mb-2 mt-6 scroll-mt-4">
        <Ruler className="h-5 w-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-900">Giao hàng & Thuế</h3>
      </div>
      
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4 mb-6">
        {/* Shipping Class */}
        <div className="space-y-2">
          <Label htmlFor="quick-edit-shipping-class" className="text-slate-900">Lớp giao hàng</Label>
          <Select
            value={watch('shippingClass') || '__none__'}
            onValueChange={(value) => {
              setValue('shippingClass', value === '__none__' ? undefined : value, { shouldDirty: true });
            }}
          >
            <SelectTrigger 
              id="quick-edit-shipping-class"
              className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Không có</SelectItem>
              <SelectItem value="standard">Hàng thường</SelectItem>
              <SelectItem value="fragile">Hàng dễ vỡ</SelectItem>
              <SelectItem value="bulky">Hàng cồng kềnh</SelectItem>
              <SelectItem value="express">Giao hàng nhanh</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Chọn lớp giao hàng phù hợp để tính phí vận chuyển chính xác
          </p>
        </div>

        {/* Tax Status */}
        <div className="space-y-2">
          <Label htmlFor="quick-edit-tax-status" className="text-slate-900">Trạng thái thuế</Label>
          <Select
            value={watch('taxStatus') || 'taxable'}
            onValueChange={(value) => {
              setValue('taxStatus', value as 'taxable' | 'shipping' | 'none', { shouldDirty: true });
            }}
          >
            <SelectTrigger 
              id="quick-edit-tax-status"
              className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="taxable">Có thuế</SelectItem>
              <SelectItem value="shipping">Chỉ thuế vận chuyển</SelectItem>
              <SelectItem value="none">Không có thuế</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Xác định sản phẩm có chịu thuế hay không
          </p>
        </div>

        {/* Tax Class */}
        <div className="space-y-2">
          <Label htmlFor="quick-edit-tax-class" className="text-slate-900">Loại thuế</Label>
          <Select
            value={watch('taxClass') || '__none__'}
            onValueChange={(value) => {
              setValue('taxClass', value === '__none__' ? undefined : value, { shouldDirty: true });
            }}
          >
            <SelectTrigger 
              id="quick-edit-tax-class"
              className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Mặc định</SelectItem>
              <SelectItem value="standard">Thuế tiêu chuẩn</SelectItem>
              <SelectItem value="reduced-rate">Thuế giảm</SelectItem>
              <SelectItem value="zero-rate">Thuế 0%</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Chọn loại thuế áp dụng cho sản phẩm (chỉ áp dụng khi trạng thái thuế = &quot;Có thuế&quot;)
          </p>
        </div>
      </div>
        </>
      ) : (
        <div className="mt-6 space-y-4 animate-pulse">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4">
            <div className="h-10 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-200 rounded" />
          </div>
        </div>
      )}

      {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Critical section - Always show inventory */}
      <div className="flex items-center gap-2 mb-2 mt-6">
        <Box className="h-5 w-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-900">Tồn kho</h3>
      </div>

      {/* Inventory Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4 mb-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="quick-edit-manage-stock"
            checked={formData.manageStock}
            onCheckedChange={(checked) => {
              setValue('manageStock', checked as boolean, { shouldDirty: true });
              if (!checked) {
                // Fix #19: Clear both stockQuantity and stockStatus when disabling manage stock
                setValue('stockQuantity', 0, { shouldDirty: true });
                setValue('stockStatus', 'instock', { shouldDirty: true });
              }
            }}
          />
          <Label htmlFor="quick-edit-manage-stock" className="cursor-pointer text-slate-900">
            Quản lý tồn kho
          </Label>
        </div>

        {formData.manageStock && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
              <Label htmlFor="quick-edit-stock-quantity" className="text-slate-900">Số lượng tồn kho</Label>
                <div title="Số lượng sản phẩm hiện có trong kho. VD: 100">
                  <Info className="h-4 w-4 text-slate-400 cursor-help" />
                </div>
              </div>
              <Input
                id="quick-edit-stock-quantity"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={handleStockQtyChange}
                onFocus={handleInputFocus}
                className={`${errors.stockQuantity ? 'border-red-500 focus:ring-red-500' : savedFields.has('stockQuantity') ? 'border-green-500 bg-green-50/50 transition-all duration-300' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
                placeholder="VD: 100"
              />
              {errors.stockQuantity && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p>{errors.stockQuantity.message}</p>
                </div>
              )}
              <p className="text-xs text-slate-500">Số lượng sản phẩm hiện có trong kho</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-edit-stock-status" className="text-slate-900">Trạng thái kho</Label>
              <Select
                value={formData.stockStatus}
                onValueChange={(value) => setValue('stockStatus', value as 'instock' | 'outofstock' | 'onbackorder', { shouldDirty: true })}
              >
                <SelectTrigger 
                  id="quick-edit-stock-status"
                  className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instock">Còn hàng</SelectItem>
                  <SelectItem value="outofstock">Hết hàng</SelectItem>
                  <SelectItem value="onbackorder">Đặt hàng trước</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* PHASE 3: Sold Individually (4.3.3) */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="quick-edit-sold-individually"
              checked={watch('soldIndividually') || false}
              onCheckedChange={(checked) => {
                setValue('soldIndividually', checked === true, { shouldDirty: true });
              }}
            />
            <Label 
              htmlFor="quick-edit-sold-individually" 
              className="text-sm font-medium text-slate-900 cursor-pointer"
            >
              Chỉ bán từng cái (Sold Individually)
            </Label>
          </div>
          <p className="text-xs text-slate-500 ml-6">
            Khi bật, khách hàng chỉ có thể mua 1 sản phẩm mỗi đơn hàng
          </p>
        </div>
        
        {/* PHASE 3: Backorders Settings (4.3.4) */}
        {formData.manageStock && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
            <Label htmlFor="quick-edit-backorders" className="text-slate-900">
              Cho phép đặt hàng trước (Backorders)
            </Label>
            <Select
              value={watch('backorders') || 'no'}
              onValueChange={(value) => {
                setValue('backorders', value as 'no' | 'notify' | 'yes', { shouldDirty: true });
                
                // PHASE 3: Auto-sync logic - Nếu "Do not allow" và stock = 0 → stockStatus = "outofstock"
                const currentStockQty = watch('stockQuantity') || 0;
                if (value === 'no' && currentStockQty === 0) {
                  setValue('stockStatus', 'outofstock', { shouldDirty: true });
                }
              }}
            >
              <SelectTrigger 
                id="quick-edit-backorders"
                className="border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">Không cho phép</SelectItem>
                <SelectItem value="notify">Cho phép nhưng thông báo khách</SelectItem>
                <SelectItem value="yes">Cho phép</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Cho phép khách hàng đặt hàng khi sản phẩm hết hàng
            </p>
            {watch('backorders') === 'no' && (watch('stockQuantity') || 0) === 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Trạng thái kho đã được tự động đặt thành &quot;Hết hàng&quot;
              </p>
            )}
          </div>
        )}
      </div>

      {/* PHASE 1: Weight & Dimensions Section (4.1.3) */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
      {loadedSections.has('secondary') ? (
        <>
      {/* PHASE 3: Section Shortcuts (7.11.15) - Add id for section navigation */}
      <div id="section-dimensions" className="mb-6 scroll-mt-4">
        {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
        <div className="flex items-center gap-2 mb-2 mt-6">
          <Ruler className="h-5 w-5 text-slate-600" />
          <h3 className="text-base font-semibold text-slate-900">Kích thước & Trọng lượng</h3>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quick-edit-weight" className="text-slate-900">Trọng lượng (kg)</Label>
            <Input
              id="quick-edit-weight"
              type="number"
              step="0.1"
              min="0"
              {...register('weight', { 
                valueAsNumber: true,
                setValueAs: (v) => {
                  if (v === '' || (typeof v === 'number' && isNaN(v))) return undefined;
                  return typeof v === 'number' ? v : parseFloat(v);
                }
              })}
              className={`${errors.weight ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
            />
            {errors.weight && (
              <p className="text-xs text-red-500">{errors.weight.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-edit-length" className="text-slate-900">Chiều dài (cm)</Label>
            <Input
              id="quick-edit-length"
              type="number"
              step="0.1"
              min="0"
              {...register('length', { 
                valueAsNumber: true,
                setValueAs: (v) => {
                  if (v === '' || (typeof v === 'number' && isNaN(v))) return undefined;
                  return typeof v === 'number' ? v : parseFloat(v);
                }
              })}
              className={`${errors.length ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
            />
            {errors.length && (
              <p className="text-xs text-red-500">{errors.length.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-edit-width" className="text-slate-900">Chiều rộng (cm)</Label>
            <Input
              id="quick-edit-width"
              type="number"
              step="0.1"
              min="0"
              {...register('width', { 
                valueAsNumber: true,
                setValueAs: (v) => {
                  if (v === '' || (typeof v === 'number' && isNaN(v))) return undefined;
                  return typeof v === 'number' ? v : parseFloat(v);
                }
              })}
              className={`${errors.width ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
            />
            {errors.width && (
              <p className="text-xs text-red-500">{errors.width.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-edit-height" className="text-slate-900">Chiều cao (cm)</Label>
            <Input
              id="quick-edit-height"
              type="number"
              step="0.1"
              min="0"
              {...register('height', { 
                valueAsNumber: true,
                setValueAs: (v) => {
                  if (v === '' || (typeof v === 'number' && isNaN(v))) return undefined;
                  return typeof v === 'number' ? v : parseFloat(v);
                }
              })}
              className={`${errors.height ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
            />
            {errors.height && (
              <p className="text-xs text-red-500">{errors.height.message}</p>
            )}
            {/* Display calculated volumetric weight */}
            {(() => {
              const length = watch('length');
              const width = watch('width');
              const height = watch('height');
              if (length && width && height && length > 0 && width > 0 && height > 0) {
                const volumetricWeight = (length * width * height) / 6000;
                return (
                  <p className="text-xs text-slate-500">
                    Trọng lượng thể tích: {volumetricWeight.toFixed(2)} kg
                  </p>
                );
              }
              return null;
            })()}
          </div>
        </div>
        </div>
      </div>
        </>
      ) : (
        <div className="mb-6 mt-6 space-y-4 animate-pulse">
          <div className="h-5 w-56 bg-slate-200 rounded" />
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      )}

      {/* PHASE 1: Low Stock Threshold (4.1.4) */}
      {formData.manageStock && loadedSections.has('secondary') && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
          <Label htmlFor="quick-edit-low-stock-threshold" className="text-slate-900">
            Ngưỡng tồn kho thấp
          </Label>
          <Input
            id="quick-edit-low-stock-threshold"
            type="number"
            min="0"
            step="1"
            {...register('lowStockThreshold', { 
              valueAsNumber: true,
              setValueAs: (v) => {
                if (v === '' || (typeof v === 'number' && isNaN(v))) return undefined;
                return typeof v === 'number' ? Math.floor(v) : parseInt(v, 10);
              }
            })}
            className={`${errors.lowStockThreshold ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300 max-w-xs`}
            placeholder="Nhập ngưỡng tồn kho thấp..."
          />
          {errors.lowStockThreshold && (
            <p className="text-xs text-red-500">{errors.lowStockThreshold.message}</p>
          )}
          <p className="text-xs text-slate-500">
            Cảnh báo khi số lượng tồn kho &lt;= giá trị này
          </p>
        </div>
      )}

      {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Categories already lazy loaded, but show skeleton if section not loaded */}
      {loadedSections.has('secondary') ? (
        <>
      <div className="flex items-center gap-2 mb-2 mt-6">
        <Tag className="h-5 w-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-900">Danh mục & Thẻ</h3>
      </div>
      
      {/* PHASE 1: Categories & Tags Section (4.1.1) */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4 mb-6">
        
        {/* Categories Multi-select */}
        <div className="space-y-2">
          <Label className="text-slate-900">Danh mục</Label>
          <Popover open={categoriesPopoverOpen} onOpenChange={setCategoriesPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between border-slate-200 hover:border-slate-300"
              >
                <span className="text-slate-600">
                  {selectedCategories.length > 0
                    ? `${selectedCategories.length} danh mục đã chọn`
                    : 'Chọn danh mục...'}
                </span>
                <Search className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-3 border-b">
                <Input
                  placeholder="Tìm danh mục..."
                  className="h-9"
                  onChange={(e) => {
                    // Filter categories by search
                    const query = e.target.value.toLowerCase();
                    // This will be handled in the category list rendering
                  }}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-500">Đang tải danh mục...</span>
                  </div>
                ) : allCategories.length === 0 ? (
                  <p className="text-sm text-slate-500 p-2">Không có danh mục nào</p>
                ) : (
                  allCategories.map((category) => {
                    const categoryId = String(category.id || category.databaseId || '');
                    const isSelected = selectedCategories.includes(categoryId);
                    return (
                      <div
                        key={categoryId}
                        className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded cursor-pointer"
                        onClick={() => {
                          const newCategories = isSelected
                            ? selectedCategories.filter((id) => id !== categoryId)
                            : [...selectedCategories, categoryId];
                          setValue('categories', newCategories, { shouldDirty: true });
                        }}
                      >
                        <Checkbox checked={isSelected} />
                        <span className="text-sm flex-1">{category.name}</span>
                      </div>
                    );
                  })
                )}
              </div>
              {selectedCategories.length > 0 && (
                <div className="p-3 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setValue('categories', [], { shouldDirty: true });
                    }}
                  >
                    Xóa tất cả
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCategories.map((categoryId) => {
                const category = allCategories.find(
                  (cat) => String(cat.id || cat.databaseId || '') === categoryId
                );
                if (!category) return null;
                return (
                  <Badge
                    key={categoryId}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {category.name}
                    <button
                      type="button"
                      onClick={() => {
                        setValue(
                          'categories',
                          selectedCategories.filter((id) => id !== categoryId),
                          { shouldDirty: true }
                        );
                      }}
                      className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Tags Input */}
        <div className="space-y-2">
          <Label htmlFor="quick-edit-tags" className="text-slate-900">Thẻ</Label>
          <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-md min-h-[44px]">
            {selectedTags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    setValue(
                      'tags',
                      selectedTags.filter((_, i) => i !== index),
                      { shouldDirty: true }
                    );
                  }}
                  className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Input
              id="quick-edit-tags"
              placeholder="Nhập thẻ và nhấn Enter..."
              value={tagsInputValue}
              onChange={(e) => setTagsInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagsInputValue.trim()) {
                  e.preventDefault();
                  const newTag = tagsInputValue.trim();
                  if (!selectedTags.includes(newTag)) {
                    setValue('tags', [...selectedTags, newTag], { shouldDirty: true });
                  }
                  setTagsInputValue('');
                }
              }}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[120px]"
            />
          </div>
          <p className="text-xs text-slate-500">
            Nhấn Enter để thêm thẻ
          </p>
        </div>
      </div>

      {/* PHASE 1: Featured Image & Gallery Section (4.1.2) */}
      {/* PHASE 3: Section Shortcuts (7.11.15) - Add id for section navigation */}
      <div id="section-images" className="mb-6 scroll-mt-4">
        {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
        <div className="flex items-center gap-2 mb-2 mt-6">
          <ImageIcon className="h-5 w-5 text-slate-600" />
          <h3 className="text-base font-semibold text-slate-900">Hình ảnh sản phẩm</h3>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4">
        
        {/* Featured Image */}
        <div className="space-y-2">
          <Label className="text-slate-900">Ảnh đại diện</Label>
          <div className="flex items-center gap-4">
            {featuredImageId && product?.image?.sourceUrl ? (
              <div className="relative w-24 h-24 border border-slate-200 rounded-md overflow-hidden">
                <Image
                  src={product.image.sourceUrl}
                  alt={product.image.altText || product?.name || 'Product image'}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setValue('_thumbnail_id', undefined, { shouldDirty: true });
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setMediaLibraryMode('featured');
                  setMediaLibraryOpen(true);
                }}
              >
                {featuredImageId ? 'Thay đổi' : 'Chọn ảnh'}
              </Button>
              {featuredImageId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue('_thumbnail_id', undefined, { shouldDirty: true });
                  }}
                >
                  Xóa
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Images */}
        <div className="space-y-2">
          <Label className="text-slate-900">Thư viện ảnh</Label>
          <div className="flex flex-wrap gap-2">
            {galleryImageIds && product?.galleryImages && product.galleryImages.length > 0
              ? product!.galleryImages.map((img: any, index: number) => (
                  <div key={index} className="relative w-20 h-20 border border-slate-200 rounded-md overflow-hidden">
                    <Image
                      src={img.sourceUrl}
                      alt={img.altText || `Gallery ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const currentIds = galleryImageIds.split(',').filter(Boolean);
                        const newIds = currentIds.filter((id) => id !== img.id);
                        setValue('_product_image_gallery', newIds.join(','), { shouldDirty: true });
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              : null}
            <button
              type="button"
              onClick={() => {
                setMediaLibraryMode('gallery');
                setMediaLibraryOpen(true);
              }}
              className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center hover:border-slate-400"
            >
              <Plus className="h-6 w-6 text-slate-400" />
            </button>
          </div>
        </div>
        </div>
      </div>
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

      {/* PHASE 2: SEO Fields Section (4.2.1) */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
      {loadedSections.has('secondary') ? (
        <>
      {/* PHASE 3: SEO Fields Conflict (7.3.1) - Limited fields with link to full form */}
      {/* PHASE 3: Section Shortcuts (7.11.15) - Add id for section navigation */}
      <div id="section-seo" className="flex items-center justify-between mb-2 mt-6 scroll-mt-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-slate-600" />
          <h3 className="text-base font-semibold text-slate-900">SEO & URL</h3>
          <div className="group relative">
            <Info className="h-4 w-4 text-slate-400 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="font-semibold mb-1">Các trường có thể chỉnh sửa:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Meta Title (tối đa 60 ký tự)</li>
                <li>Meta Description (tối đa 160 ký tự)</li>
                <li>URL Slug</li>
              </ul>
              <p className="mt-2 pt-2 border-t border-slate-700">
                Để chỉnh sửa các trường SEO nâng cao (Focus Keyword, Canonical URL, Open Graph, Schema Markup, v.v.), vui lòng sử dụng form chỉnh sửa đầy đủ.
              </p>
            </div>
          </div>
        </div>
        {!isBulkMode && product?.id && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              router.push(`/admin/products/${product.id}/edit`);
              onClose(); // Close quick edit dialog
            }}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Chỉnh sửa SEO đầy đủ
          </Button>
        )}
      </div>
      
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4 mb-6">
        {/* Meta Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="quick-edit-seo-title" className="text-slate-900">Meta Title</Label>
            <span className={`text-xs ${(watch('seoTitle')?.length || 0) > 60 ? 'text-red-500' : 'text-slate-500'}`}>
              {(watch('seoTitle')?.length || 0)}/60
            </span>
          </div>
          <Input
            id="quick-edit-seo-title"
            {...register('seoTitle')}
            maxLength={60}
            className={`${errors.seoTitle ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
            placeholder="Nhập meta title (tối đa 60 ký tự)..."
          />
          {errors.seoTitle && (
            <p className="text-xs text-red-500">{errors.seoTitle.message}</p>
          )}
          <p className="text-xs text-slate-500">
            Tiêu đề hiển thị trên kết quả tìm kiếm. Nếu để trống, sẽ dùng tên sản phẩm.
          </p>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="quick-edit-seo-description" className="text-slate-900">Meta Description</Label>
            <span className={`text-xs ${(watch('seoDescription')?.length || 0) > 160 ? 'text-red-500' : 'text-slate-500'}`}>
              {(watch('seoDescription')?.length || 0)}/160
            </span>
          </div>
          <textarea
            id="quick-edit-seo-description"
            {...register('seoDescription')}
            maxLength={160}
            rows={3}
            className={`flex w-full rounded-md border-2 bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors border-slate-200 focus:ring-2 focus:ring-slate-950 hover:border-slate-300 resize-none ${errors.seoDescription ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder="Nhập meta description (tối đa 160 ký tự)..."
          />
          {errors.seoDescription && (
            <p className="text-xs text-red-500">{errors.seoDescription.message}</p>
          )}
          <p className="text-xs text-slate-500">
            Mô tả ngắn hiển thị dưới tiêu đề trên kết quả tìm kiếm. Nếu để trống, sẽ dùng mô tả ngắn sản phẩm.
          </p>
        </div>

        {/* URL Slug */}
        <div className="space-y-2">
          <Label htmlFor="quick-edit-slug" className="text-slate-900">URL Slug</Label>
          <Input
            id="quick-edit-slug"
            {...register('slug')}
            className={`${errors.slug ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
            placeholder="gau-bong-tho-tai-dai"
          />
          {errors.slug && (
            <p className="text-xs text-red-500">{errors.slug.message}</p>
          )}
          <p className="text-xs text-slate-500">
            URL thân thiện cho sản phẩm. Chỉ được chứa chữ thường, số và dấu gạch ngang.
          </p>
        </div>

        {/* SEO Preview */}
        {!isBulkMode && (() => {
          const seoTitle = watch('seoTitle') || product?.name || 'Tên sản phẩm';
          const seoDesc = watch('seoDescription') || product?.shortDescription || 'Mô tả sản phẩm';
          const slug = watch('slug') || product?.slug || 'product-slug';
          const previewUrl = `https://shop-gaubong.com/products/${slug}`;
          
          return (
            <div className="mt-4 p-3 bg-white border border-slate-300 rounded-md">
              <p className="text-xs font-medium text-slate-600 mb-2">Xem trước kết quả tìm kiếm:</p>
              <div className="space-y-1">
                <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                  {previewUrl}
                </p>
                <p className="text-lg text-blue-700 font-medium leading-tight">
                  {seoTitle.length > 60 ? seoTitle.substring(0, 60) + '...' : seoTitle}
                </p>
                <p className="text-sm text-slate-600 leading-tight">
                  {seoDesc.length > 160 ? seoDesc.substring(0, 160) + '...' : seoDesc}
                </p>
              </div>
            </div>
          );
        })()}
      </div>
        </>
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

      {/* Variants section */}
      {/* PERFORMANCE OPTIMIZATION (3.3.2): Variants are critical for variable products, but can be deferred for simple products */}
      {loadedSections.has('secondary') || (formData.variants && formData.variants.length > 0) ? (
        (() => {
        // CRITICAL FIX: Always use formData.variants as source of truth (user edits)
        // Only fallback to productWithVariants on initial load
        // This ensures UI updates immediately when user edits variants
        const variants = formData.variants && formData.variants.length > 0 
          ? formData.variants 
          : (productWithVariants?.variants || []);
        const hasVariants = variants.length > 0;
        
        // NOTE: Debug logs removed to prevent console spam during re-renders
        // If needed, add them back in useEffect when variants change
        
        if (!hasVariants) return null;
        
        // Map variants ensuring all fields are present (including color and colorCode for display)
        const mappedVariants = variants.map((v: any) => {
          const mapped = {
            id: v.id || '',
            size: v.size || '',
            // Preserve color and colorCode (even if empty string, convert to undefined to match schema)
            color: (v.color && v.color.trim()) ? v.color.trim() : undefined,
            colorCode: (v.colorCode && v.colorCode.trim()) ? v.colorCode.trim() : undefined,
            price: v.price || 0,
            stock: v.stock || v.stockQuantity || 0,
            image: v.image || undefined,
            sku: v.sku || '',
          };
          
          return mapped;
        });
        
        return (
          <div className="space-y-4">
            {/* Variant Table Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="text-base font-semibold text-slate-900">Biến thể ({mappedVariants.length})</Label>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  Sửa trực tiếp trên bảng
                </span>
              </div>
            </div>
            <VariantQuickEditTable
              variants={mappedVariants}
              isLoading={loadingProduct}
              onVariantsChange={(updatedVariants) => {
                  // Fix #20: Get original variants from productWithVariants OR current mappedVariants (fallback for race condition)
                  // This ensures we preserve size, color, colorCode, image even if productWithVariants hasn't loaded yet
                  const originalVariants = productWithVariants?.variants || mappedVariants || [];
                  
                  // Update form state with edited values, preserving display fields from original
                  setValue('variants', updatedVariants.map((v) => {
                    // Find original variant to preserve display-only fields (with fallback to mappedVariants)
                    const originalVariant = originalVariants.find((orig: any) => orig.id === v.id) ||
                                           mappedVariants.find((mapped: any) => mapped.id === v.id);
                    return {
                      id: v.id,
                      sku: v.sku,
                      price: v.price,
                      stock: v.stock,
                      // Preserve display fields from original variant (with fallback chain)
                      size: originalVariant?.size || v.size || '',
                      color: originalVariant?.color || v.color || undefined,
                      colorCode: originalVariant?.colorCode || v.colorCode || undefined,
                      image: originalVariant?.image || v.image || undefined,
                    };
                  }), { shouldDirty: true, shouldValidate: false });
                }}
                bulkUpdate={formData.bulkUpdate}
              onBulkUpdateChange={(enabled) => {
                setValue('bulkUpdate', enabled, { shouldDirty: true });
              }}
            />
          </div>
        );
        })()
      ) : null}

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
            
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3">
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
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
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
            </SheetHeader>
            {/* PHASE 2: Mobile Sheet Scrolling Issues (7.11.8) - Scroll indicator */}
            {scrollProgress > 0 && scrollProgress < 100 && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 z-50">
                <div 
                  className="h-full bg-slate-600 transition-all duration-150"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
            )}
            <div 
              ref={containerRef}
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
              <div className="sticky bottom-0 z-50 bg-white border-t border-slate-200 px-6 py-4 flex-shrink-0">
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
            </DialogHeader>
            {/* PHASE 2: Mobile Sheet Scrolling Issues (7.11.8) - Scroll indicator (desktop) */}
            {scrollProgress > 0 && scrollProgress < 100 && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 z-50">
                <div 
                  className="h-full bg-slate-600 transition-all duration-150"
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

      {/* PHASE 1: Media Library Modal (4.1.2) */}
      <MediaLibraryModal
        isOpen={mediaLibraryOpen}
        onClose={() => setMediaLibraryOpen(false)}
        onSelect={(items) => {
          if (mediaLibraryMode === 'featured') {
            const item = Array.isArray(items) ? items[0] : items;
            if (item) {
              setValue('_thumbnail_id', item.id, { shouldDirty: true });
            }
          } else {
            // Gallery mode - multiple selection
            const itemsArray = Array.isArray(items) ? items : [items];
            const currentIds = galleryImageIds ? galleryImageIds.split(',').filter(Boolean) : [];
            const newIds = [...currentIds, ...itemsArray.map((item) => item.id)];
            setValue('_product_image_gallery', newIds.join(','), { shouldDirty: true });
          }
          setMediaLibraryOpen(false);
        }}
        mode={mediaLibraryMode === 'featured' ? 'single' : 'multiple'}
        selectedIds={
          mediaLibraryMode === 'featured'
            ? featuredImageId ? [featuredImageId] : []
            : galleryImageIds
            ? galleryImageIds.split(',').filter(Boolean)
            : []
        }
        buttonText={mediaLibraryMode === 'featured' ? 'Chọn ảnh đại diện' : 'Thêm vào thư viện'}
      />
    </>
  );
}

