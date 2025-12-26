'use client';

import { useCallback } from 'react';
import type { QuickEditFormData } from '../types';
import type { MappedProduct } from '@/lib/utils/productMapper';
import type { ProductWithVariants } from '@/lib/hooks/useProduct';
import { isValidPrice, isValidInteger } from '@/lib/utils/typeConverters';

/**
 * Hook for Quick Edit Form Handlers
 * 
 * PHASE 3.2: Extract Form Handlers
 * 
 * Handles:
 * - Form submission (onSubmit) - bulk + single mode
 * - Form validation errors (onError)
 * - Field focus/blur handlers
 * 
 * @param options - Configuration options for handlers
 * @returns All form handlers
 */

interface UseQuickEditHandlersOptions {
  // Product data
  product?: MappedProduct;
  productIds?: string[];
  isBulkMode: boolean;
  
  // Form methods
  reset: (data: QuickEditFormData, options?: { keepDefaultValues?: boolean }) => void;
  
  // API hooks
  quickUpdate: (productId: string, updates: any, retryCount?: number) => Promise<MappedProduct | null>;
  
  // State setters
  setLoadingStep: (step: 'idle' | 'validating' | 'saving' | 'complete') => void;
  setBulkUpdateProgress: (progress: { current: number; total: number; status: 'idle' | 'updating' | 'completed' | 'error' }) => void;
  setExternalSnapshot: (snapshot: QuickEditFormData | null) => void;
  setProductWithVariants: (product: ProductWithVariants | null) => void;
  setLoadingProduct: (loading: boolean) => void;
  setLastSavedTime: (time: Date | null) => void;
  setShowSuccessIndicator: (show: boolean) => void;
  setSavedFields: (fields: Set<string>) => void;
  setFlashingFields: (fields: Set<string>) => void;
  setFocusedFieldId: (id: string | null) => void;
  
  // Callbacks
  onSuccess?: (updatedProduct: MappedProduct) => void;
  onBulkSuccess?: (updatedCount: number) => void;
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  resetHistory?: (data: QuickEditFormData) => void;
  refetchProduct?: () => Promise<{ data?: ProductWithVariants | null }>;
  handleInputFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  
  // Refs
  timeoutRefs: React.MutableRefObject<{
    flashAnimation?: NodeJS.Timeout;
    successIndicator?: NodeJS.Timeout;
    closeDialog?: NodeJS.Timeout;
  }>;
  savedUpdatesRef: React.MutableRefObject<Record<string, unknown>>;
}

export function useQuickEditHandlers({
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
}: UseQuickEditHandlersOptions) {
  
  // Handle form submission (bulk + single mode)
  const onSubmit = useCallback(async (data: QuickEditFormData) => {
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
      const updatedProduct = await quickUpdate(product!.id, updates);
      if (!updatedProduct) {
        // Error handling is done in useQuickUpdateProduct hook
        setLoadingStep('idle');
        return;
      }
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
  }, [
    isBulkMode,
    productIds,
    product,
    quickUpdate,
    setLoadingStep,
    setBulkUpdateProgress,
    showToast,
    onBulkSuccess,
    onClose,
  ]);

  // PHASE 1: Error Message Details (7.6.3) - Handle form validation errors with detailed display
  const onError = useCallback((errors: any) => {
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
    
    // Helper to map field name to field ID
    const getFieldId = (fieldName: string): string => {
      // Handle nested fields (e.g., variants.0.price -> quick-edit-variants-0-price)
      const normalizedField = fieldName.replace(/\./g, '-').replace(/\[|\]/g, '-');
      return `quick-edit-${normalizedField}`;
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
      // UX/UI UPGRADE Phase 2.1.1: Auto-scroll to first error field
      const firstErrorField = errorList[0].field;
      const firstErrorFieldId = getFieldId(firstErrorField);
      
      // Use setTimeout to ensure DOM is updated with error messages
      setTimeout(() => {
        const errorElement = document.getElementById(firstErrorFieldId);
        if (errorElement) {
          errorElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          // Focus the field after scrolling
          setTimeout(() => {
            errorElement.focus();
          }, 300);
        } else {
          // Fallback: Try to find by field name pattern
          const fallbackElement = document.querySelector(`[id*="${firstErrorField}"]`) as HTMLElement;
          if (fallbackElement) {
            fallbackElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
            setTimeout(() => {
              fallbackElement.focus();
            }, 300);
          }
        }
      }, 100);
      
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
  }, [showToast]);

  // UX/UI UPGRADE PREREQUISITE 3 (10.2.2): Unified Focus Handler - Combines enhanced focus + mobile keyboard handling
  // PHASE 3: Field Focus Visual Enhancement (7.11.13) - Enhanced focus handler
  const handleFieldFocus = useCallback((fieldId: string, e?: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFocusedFieldId(fieldId);
    // Call original handleInputFocus for mobile keyboard handling (only for Input/Textarea, not Select)
    if (e && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      handleInputFocus(e as React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>);
    }
  }, [handleInputFocus, setFocusedFieldId]);
  
  // UX/UI UPGRADE PREREQUISITE 3 (10.2.2): Unified Focus Handler - Works with all input types
  // PHASE 3: Field Focus Visual Enhancement (7.11.13) - Enhanced blur handler
  const handleFieldBlur = useCallback((_e?: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFocusedFieldId(null);
  }, [setFocusedFieldId]);

  return {
    onSubmit,
    onError,
    handleFieldFocus,
    handleFieldBlur,
  };
}

