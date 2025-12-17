'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, X } from 'lucide-react';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { useQuickUpdateProduct } from '@/lib/hooks/useQuickUpdateProduct';
import { useToastContext } from '@/components/providers/ToastProvider';
import { VariantQuickEditTable } from './VariantQuickEditTable';

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
  product: MappedProduct;
  open: boolean;
  onClose: () => void;
  onSuccess?: (updatedProduct: MappedProduct) => void;
}

// Extended product type with variants (from API)
interface ProductWithVariants extends MappedProduct {
  variants?: Array<{
    id: string;
    size: string;
    color?: string;
    colorCode?: string;
    price: number;
    stock?: number;
    image?: string;
    sku?: string;
  }>;
}

export function ProductQuickEditDialog({
  product,
  open,
  onClose,
  onSuccess,
}: ProductQuickEditDialogProps) {
  const { showToast } = useToastContext();
  const { quickUpdate, isLoading } = useQuickUpdateProduct({
    onSuccess: (updatedProduct) => {
      onSuccess?.(updatedProduct);
      // Close dialog after successful update
      onClose();
    },
    onError: (error) => {
      if (error.message === 'VERSION_MISMATCH') {
        showToast('Sản phẩm đã được chỉnh sửa bởi người khác. Vui lòng làm mới và thử lại.', 'error');
      }
      // Don't close dialog on error - let user fix and retry
    },
  });

  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [productWithVariants, setProductWithVariants] = useState<ProductWithVariants | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // Fetch full product data with variants when dialog opens
  useEffect(() => {
    if (open && product.id) {
      setLoadingProduct(true);
      fetch(`/api/admin/products/${product.id}`, {
        credentials: 'include',
      })
        .then(async (res) => {
          // Fix #21: Check response status and content-type before parsing JSON
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
          }
          return res.json();
        })
        .then((data) => {
          if (data.product) {
            // Debug: Log variants structure
            if (process.env.NODE_ENV === 'development') {
              console.log('[ProductQuickEditDialog] API Response:', {
                hasVariants: !!data.product.variants,
                variantsCount: data.product.variants?.length || 0,
                firstVariant: data.product.variants?.[0],
                productDataMetaBox: data.product.productDataMetaBox ? {
                  hasVariations: !!data.product.productDataMetaBox.variations,
                  variationsCount: data.product.productDataMetaBox.variations?.length || 0,
                  firstVariation: data.product.productDataMetaBox.variations?.[0],
                  attributes: data.product.productDataMetaBox.attributes,
                } : null,
              });
            }
            setProductWithVariants(data.product as ProductWithVariants);
          } else {
            setProductWithVariants(product as ProductWithVariants);
          }
        })
        .catch((error) => {
          console.error('[ProductQuickEditDialog] Error fetching product:', error);
          setProductWithVariants(product as ProductWithVariants);
        })
        .finally(() => {
          setLoadingProduct(false);
        });
    }
  }, [open, product]);

  // Initialize form data from product
  const initialData = useMemo<QuickEditFormData>(() => {
    const currentProduct = productWithVariants || product;
    // Get variants from productWithVariants (from API) or product (fallback)
    const productVariants = (currentProduct as ProductWithVariants).variants || [];
    
    return {
      name: currentProduct.name || '',
      sku: currentProduct.sku || '',
      status: currentProduct.status || 'draft',
      manageStock: currentProduct.stockQuantity !== null && currentProduct.stockQuantity !== undefined,
      regularPrice: (currentProduct.regularPrice && currentProduct.regularPrice !== '') 
        ? (() => {
            const parsed = parseFloat(currentProduct.regularPrice);
            return !isNaN(parsed) ? parsed : 0;
          })()
        : 0,
      salePrice: (currentProduct.salePrice && currentProduct.salePrice !== '') 
        ? (() => {
            const parsed = parseFloat(currentProduct.salePrice);
            return !isNaN(parsed) ? parsed : undefined;
          })()
        : undefined,
      stockQuantity: currentProduct.stockQuantity || 0,
      stockStatus: (currentProduct.stockStatus as 'instock' | 'outofstock' | 'onbackorder') || 'instock',
      // Fix #22: Default version to 1 if undefined (for optimistic locking)
      version: currentProduct.version || 1,
      bulkUpdate: false,
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
        color: v.color || undefined,
        colorCode: v.colorCode || undefined,
        image: v.image || undefined,
      })),
    };
  }, [product, productWithVariants]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty: formIsDirty },
    setValue,
    watch,
    reset,
  } = useForm<QuickEditFormData>({
    resolver: zodResolver(quickEditSchema),
    defaultValues: initialData,
  });

  // Optimize: Watch specific fields instead of all fields to reduce re-renders
  const name = watch('name');
  const sku = watch('sku');
  const status = watch('status');
  const manageStock = watch('manageStock');
  const regularPrice = watch('regularPrice');
  const salePrice = watch('salePrice');
  const stockQuantity = watch('stockQuantity');
  const currentStockStatus = watch('stockStatus');
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

  // Reset form when dialog opens (only once, not when initialData changes)
  // CRITICAL FIX #17: Prevent form reset when initialData changes during editing
  useEffect(() => {
    if (open) {
      reset(initialData);
    }
    // Remove initialData from dependencies to prevent reset during editing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

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

  // Optimized dirty check - field-by-field comparison (no JSON.stringify)
  const isDirty = useMemo(() => {
    if (!initialData) return false;
    
    const fieldsToCompare = [
      'name', 'sku', 'status', 'manageStock',
      'regularPrice', 'salePrice', 'stockQuantity', 'stockStatus'
    ] as const;
    
    // Check basic fields
    const basicFieldsChanged = fieldsToCompare.some(field => {
      const currentValue = formData[field];
      const initialValue = initialData[field];
      return currentValue !== initialValue;
    });
    
    // Check variants with field-by-field comparison (more accurate than JSON.stringify)
    const variantsChanged = formData.variants && initialData.variants && (
      formData.variants.length !== initialData.variants.length ||
      formData.variants.some((v, i) => {
        const initial = initialData.variants?.[i];
        if (!initial) return true;
        return v.id !== initial.id || 
               v.sku !== initial.sku || 
               v.price !== initial.price || 
               v.stock !== initial.stock;
      })
    );
    
    return basicFieldsChanged || !!variantsChanged;
  }, [formData, initialData]);

  // Handle close from onOpenChange (backdrop click, ESC key)
  const handleOpenChange = (isOpen: boolean) => {
    // Prevent auto-close when dialog is being opened or when submitting
    if (isOpen === true || isLoading) {
      return;
    }
    
    // If dialog is being closed and form has unsaved changes, show confirm dialog
    if (isOpen === false && isDirty) {
      setShowConfirmClose(true);
      return;
    }
    
    // If no changes, close normally
    if (!isDirty) {
      onClose();
    }
  };

  // Handle close from button click
  const handleCloseClick = () => {
    // Prevent close when submitting
    if (isLoading) {
      return;
    }
    
    // If form has unsaved changes, show confirm dialog
    if (isDirty) {
      setShowConfirmClose(true);
      return;
    }
    
    // If no changes, close normally
    onClose();
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    reset(initialData);
    onClose();
  };

  const onSubmit = async (data: QuickEditFormData) => {
    try {
      // Filter out NaN values before sending to API
      const updates: any = {
        name: data.name,
        sku: data.sku,
        status: data.status,
        manageStock: data.manageStock,
        regularPrice: !isNaN(data.regularPrice) ? data.regularPrice : 0,
        stockQuantity: !isNaN(data.stockQuantity) ? data.stockQuantity : 0,
        stockStatus: data.stockStatus,
        // Fix #22: Default version to 1 if undefined
        version: data.version || 1,
      };

      // Fix #18: Handle salePrice - send value if > 0, send null to clear if undefined and product has salePrice
      if (data.salePrice !== undefined && !isNaN(data.salePrice) && data.salePrice > 0) {
        updates.salePrice = data.salePrice;
      } else if (data.salePrice === undefined && product.salePrice) {
        // User wants to clear salePrice - send null to backend
        updates.salePrice = null;
      }

      if (data.variants && data.variants.length > 0) {
        // Filter out NaN values from variants
        updates.variants = data.variants.map((v) => ({
          id: v.id,
          ...(v.sku !== undefined && { sku: v.sku }),
          ...(v.price !== undefined && !isNaN(v.price) && { price: v.price }),
          ...(v.stock !== undefined && !isNaN(v.stock) && { stock: v.stock }),
        }));
      }

      await quickUpdate(product.id, updates);
    } catch (error: any) {
      // Error handling is done in useQuickUpdateProduct hook
      console.error('Error updating product:', error);
    }
  };

  // Handle form validation errors with toast
  const onError = (errors: any) => {
    const errorMessages = Object.values(errors).map((error: any) => error?.message).filter(Boolean);
    if (errorMessages.length > 0) {
      showToast(`Vui lòng kiểm tra lại: ${errorMessages[0]}`, 'error');
    }
  };

  // Handle stock quantity change with auto-sync
  const handleStockQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQty = parseInt(e.target.value, 10) || 0;
    setValue('stockQuantity', newQty, { shouldDirty: true });
    handleStockQuantityChange(newQty, currentStockStatus, setValue);
  };

  const formContent = (
    <form id="quick-edit-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
      {/* Loading overlay when fetching product */}
      {loadingProduct && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-md">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
            <p className="text-sm text-slate-600">Đang tải thông tin sản phẩm...</p>
          </div>
        </div>
      )}
      {/* Row 1: Thông tin cơ bản - Grid 2 cột */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quick-edit-name" className="text-slate-900">Tên sản phẩm</Label>
          <Input
            id="quick-edit-name"
            {...register('name')}
            className={`${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quick-edit-sku" className="text-slate-900">SKU</Label>
          <Input
            id="quick-edit-sku"
            {...register('sku')}
            className={`${errors.sku ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
          />
          {errors.sku && (
            <p className="text-xs text-red-500">{errors.sku.message}</p>
          )}
        </div>
      </div>

      {/* Row 2: Giá & Trạng thái - Grid 3 cột */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quick-edit-status" className="text-slate-900">Trạng thái</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setValue('status', value as 'draft' | 'publish' | 'trash', { shouldDirty: true })}
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
          <Input
            id="quick-edit-regular-price"
            type="number"
            step="1000"
            min="0"
            {...register('regularPrice', { valueAsNumber: true })}
            className={`${errors.regularPrice ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
          />
          {errors.regularPrice && (
            <p className="text-xs text-red-500">{errors.regularPrice.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quick-edit-sale-price" className="text-slate-900">Giá khuyến mãi (đ)</Label>
          <Input
            id="quick-edit-sale-price"
            type="number"
            step="1000"
            min="0"
            {...register('salePrice', { 
              valueAsNumber: true,
              setValueAs: (v) => {
                // Convert empty string or NaN to undefined for optional field
                if (v === '' || (typeof v === 'number' && isNaN(v))) {
                  return undefined;
                }
                return typeof v === 'number' ? v : parseFloat(v);
              }
            })}
            className={`${errors.salePrice ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
          />
          {errors.salePrice && (
            <p className="text-xs text-red-500">{errors.salePrice.message}</p>
          )}
        </div>
      </div>

      {/* Inventory Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4">
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
              <Label htmlFor="quick-edit-stock-quantity" className="text-slate-900">Số lượng tồn kho</Label>
              <Input
                id="quick-edit-stock-quantity"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={handleStockQtyChange}
                className={`${errors.stockQuantity ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-2 focus:ring-slate-950'} hover:border-slate-300`}
              />
              {errors.stockQuantity && (
                <p className="text-xs text-red-500">{errors.stockQuantity.message}</p>
              )}
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
      </div>

      {/* Variants section */}
      {(() => {
        // CRITICAL FIX: Always use formData.variants as source of truth (user edits)
        // Only fallback to productWithVariants on initial load
        // This ensures UI updates immediately when user edits variants
        const variants = formData.variants && formData.variants.length > 0 
          ? formData.variants 
          : (productWithVariants?.variants || []);
        const hasVariants = variants.length > 0;
        
        // Debug: Log variants before rendering
        if (process.env.NODE_ENV === 'development' && hasVariants) {
          console.log('[ProductQuickEditDialog] Variants to render:', variants);
          console.log('[ProductQuickEditDialog] First variant structure:', JSON.stringify(variants[0], null, 2));
        }
        
        if (!hasVariants) return null;
        
        // Map variants ensuring all fields are present
        const mappedVariants = variants.map((v: any) => {
          const mapped = {
            id: v.id || '',
            size: v.size || '',
            color: v.color || undefined,
            colorCode: v.colorCode || undefined,
            price: v.price || 0,
            stock: v.stock || v.stockQuantity || 0,
            image: v.image || undefined,
            sku: v.sku || '',
          };
          
          // Debug: Log each mapped variant
          if (process.env.NODE_ENV === 'development') {
            console.log(`[ProductQuickEditDialog] Mapped variant ${mapped.id}:`, {
              size: mapped.size,
              color: mapped.color,
              colorCode: mapped.colorCode,
              hasColor: !!mapped.color,
            });
          }
          
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
            {loadingProduct ? (
              <div className="text-sm text-slate-500">Đang tải biến thể...</div>
            ) : (
              <VariantQuickEditTable
                variants={mappedVariants}
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
            )}
          </div>
        );
      })()}
    </form>
  );

  return (
    <>
      {/* Mobile: Sheet */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent 
            side="bottom" 
            className="h-[90vh] rounded-t-2xl overflow-hidden flex flex-col p-0"
          >
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <SheetTitle className="text-lg font-semibold text-slate-900">Sửa nhanh sản phẩm</SheetTitle>
                  <p className="text-sm text-slate-500 mt-1">ID: {product.id || 'N/A'}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseClick}
                  className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {formContent}
            </div>
            <SheetFooter className="px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-white">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseClick}
                disabled={isLoading}
                className="min-h-[44px] border-slate-200 text-slate-900 hover:bg-slate-50"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                form="quick-edit-form"
                disabled={!isDirty || isLoading}
                className="min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Dialog */}
      <div className="hidden md:block">
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-lg font-semibold text-slate-900">Sửa nhanh sản phẩm</DialogTitle>
                  <p className="text-sm text-slate-500 mt-1">ID: {product.id || 'N/A'}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseClick}
                  className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 -mr-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 relative">
              {formContent}
            </div>
            <DialogFooter className="px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-white">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseClick}
                disabled={isLoading}
                className="min-h-[44px] border-slate-200 text-slate-900 hover:bg-slate-50"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                form="quick-edit-form"
                disabled={!isDirty || isLoading}
                className="min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Confirm Close Dialog */}
      <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
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
    </>
  );
}

