'use client';

import { useCallback, useMemo, useRef, useEffect } from 'react';
import type { FieldErrors } from 'react-hook-form';
import type { QuickEditFormData } from '../types';
import { getSectionIdForField } from '../utils/sectionHelpers';
import { getFieldId } from '../utils/fieldStateHelpers';

/**
 * Hook for Quick Edit Form Validation Helpers
 * 
 * PHASE 3.3: Extract Validation Helpers
 * 
 * Handles:
 * - Field className calculation (Error > Success > Edited > Normal)
 * - Error counting by section
 * - Value normalization for comparison
 * - Field edited state detection
 * 
 * @param options - Configuration options for validation helpers
 * @returns Validation helper functions
 */

interface UseQuickEditValidationOptions {
  // Form state
  errors: FieldErrors<QuickEditFormData>;
  
  // Field state
  focusedFieldId: string | null;
  savedFields: Set<string>;
  flashingFields: Set<string>;
  fieldOriginalValues: Record<string, any>;
  
  // Section state
  setExpandedSections: React.Dispatch<React.SetStateAction<string[]>>;
  
  // Toast notification
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function useQuickEditValidation({
  errors,
  focusedFieldId,
  savedFields,
  flashingFields,
  fieldOriginalValues,
  setExpandedSections,
  showToast,
}: UseQuickEditValidationOptions) {
  
  // UX/UI UPGRADE PREREQUISITE 2 (10.2.1): Enhanced normalizeValue với edge cases handling
  const normalizeValue = useCallback((value: any): any => {
    // Handle null/undefined
    if (value === null || value === undefined) return undefined;
    
    // Handle empty strings
    if (typeof value === 'string' && value.trim() === '') return '';
    
    // Handle NaN numbers
    if (typeof value === 'number' && isNaN(value)) return 0;
    
    // Handle arrays - normalize to sorted string for comparison
    if (Array.isArray(value)) {
      if (value.length === 0) return [];
      // Sort arrays to ensure consistent comparison (for categories, tags)
      return [...value].sort().map(item => normalizeValue(item));
    }
    
    // Handle objects - normalize nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // For objects, return as-is (will be compared by reference or deep comparison if needed)
      return value;
    }
    
    return value;
  }, []);

  // PHASE 2: Visual Feedback for Edited Fields (7.11.2) - Check if field has been edited
  // UX/UI UPGRADE PREREQUISITE 2 (10.2.1): Enhanced với edge cases handling
  const isFieldEdited = useCallback((fieldName: string, currentValue: any): boolean => {
    if (!fieldOriginalValues || Object.keys(fieldOriginalValues).length === 0) return false;
    
    const originalValue = fieldOriginalValues[fieldName];
    
    // Handle undefined field (field not in original values)
    if (originalValue === undefined) {
      // Field is edited if current value is not empty/null/undefined
      const normalizedCurrent = normalizeValue(currentValue);
      return normalizedCurrent !== undefined && normalizedCurrent !== '' && normalizedCurrent !== null;
    }
    
    const normalizedOriginal = normalizeValue(originalValue);
    const normalizedCurrent = normalizeValue(currentValue);
    
    // Handle arrays - compare element by element
    if (Array.isArray(normalizedOriginal) && Array.isArray(normalizedCurrent)) {
      if (normalizedOriginal.length !== normalizedCurrent.length) return true;
      // Compare each element
      for (let i = 0; i < normalizedOriginal.length; i++) {
        if (normalizeValue(normalizedOriginal[i]) !== normalizeValue(normalizedCurrent[i])) {
          return true;
        }
      }
      return false;
    }
    
    // Simple comparison for primitives
    return normalizedOriginal !== normalizedCurrent;
  }, [fieldOriginalValues, normalizeValue]);

  // Extract all validation errors with labels
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

  // PHASE 5.3.2: Accordion Layout - Helper functions for error handling by section
  const getErrorsBySection = useMemo(() => {
    const errorsBySection: Record<string, Array<{field: string, message: string, label: string}>> = {};
    
    // Map fields to sections
    // PHASE 5.3: Use sectionHelpers for field to section mapping
    allValidationErrors.forEach((err) => {
      const sectionId = getSectionIdForField(err.field);
      if (!errorsBySection[sectionId]) {
        errorsBySection[sectionId] = [];
      }
      errorsBySection[sectionId].push(err);
    });
    
    return errorsBySection;
  }, [allValidationErrors]);

  const getErrorCountForSection = useCallback((sectionId: string): number => {
    return getErrorsBySection[sectionId]?.length || 0;
  }, [getErrorsBySection]);

  // UX/UI UPGRADE PREREQUISITE 1 (10.1.1): State Priority Logic - Get field className with priority: Error > Success > Edited > Normal
  // UX/UI UPGRADE PREREQUISITE 4 (10.4.1): Memoized để prevent re-renders
  // FIX: Added optional isValid parameter to handle validation success state (e.g., SKU validation)
  const getFieldClassName = useCallback((fieldName: string, currentValue: any, hasError: boolean, isSaved: boolean, fieldId?: string, isValid?: boolean): string => {
    // Priority order: Error > Validation Success > Saved > Edited > Normal
    const baseClasses = 'hover:border-slate-300';
    const focusClasses = fieldId && focusedFieldId === fieldId ? 'ring-2 ring-slate-950 ring-offset-2' : '';
    
    // UX/UI UPGRADE Phase 2.2.1: Green flash animation cho saved fields
    const isFlashing = flashingFields.has(fieldName);
    const flashAnimationClass = isFlashing ? 'animate-pulse' : '';
    
    // 1. Error state (highest priority)
    if (hasError) {
      return `border-red-500 focus:ring-red-500 ${baseClasses} ${focusClasses}`;
    }
    
    // 2. Validation Success state (e.g., SKU validation passed but not saved yet)
    // This takes priority over edited state to show validation feedback
    if (isValid === true && !isSaved) {
      return `border-green-500 focus:ring-green-500 ${baseClasses} ${focusClasses}`;
    }
    
    // 3. Success state (saved)
    if (isSaved) {
      // UX/UI UPGRADE Phase 2.2.1: Add flash animation when field is just saved
      if (isFlashing) {
        return `border-green-500 bg-green-100 transition-all duration-1000 ${flashAnimationClass} ${baseClasses} ${focusClasses}`;
      }
      return `border-green-500 bg-green-50/50 transition-all duration-300 ${baseClasses} ${focusClasses}`;
    }
    
    // 4. Edited state (field has been modified)
    if (isFieldEdited(fieldName, currentValue)) {
      return `border-blue-400 bg-blue-50/50 ${baseClasses} ${focusClasses}`;
    }
    
    // 5. Normal state (default)
    return `border-slate-200 focus:ring-2 focus:ring-slate-950 ${baseClasses} ${focusClasses}`;
  }, [focusedFieldId, isFieldEdited, flashingFields]);

  // UX/UI UPGRADE Phase 2.1.2: Helper function to scroll to error field
  // PHASE 5.2: Use fieldStateHelpers for field ID generation
  // MEMORY LEAK FIX: Store timeout IDs for cleanup
  const scrollTimeoutRefs = useRef<{ outer?: NodeJS.Timeout; inner?: NodeJS.Timeout }>({});

  const scrollToErrorField = useCallback((fieldName: string) => {
    // MEMORY LEAK FIX: Cleanup previous timeouts
    if (scrollTimeoutRefs.current.outer) {
      clearTimeout(scrollTimeoutRefs.current.outer);
    }
    if (scrollTimeoutRefs.current.inner) {
      clearTimeout(scrollTimeoutRefs.current.inner);
    }

    const fieldId = getFieldId(fieldName);
    const errorElement = document.getElementById(fieldId);
    
    if (errorElement) {
      errorElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      // Focus the field after scrolling
      scrollTimeoutRefs.current.inner = setTimeout(() => {
        errorElement.focus();
        scrollTimeoutRefs.current.inner = undefined;
      }, 300);
    } else {
      // Fallback: Try to find by field name pattern
      const fallbackElement = document.querySelector(`[id*="${fieldName}"]`) as HTMLElement;
      if (fallbackElement) {
        fallbackElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        scrollTimeoutRefs.current.inner = setTimeout(() => {
          fallbackElement.focus();
          scrollTimeoutRefs.current.inner = undefined;
        }, 300);
      }
    }
  }, []);

  // MEMORY LEAK FIX: Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRefs.current.outer) {
        clearTimeout(scrollTimeoutRefs.current.outer);
      }
      if (scrollTimeoutRefs.current.inner) {
        clearTimeout(scrollTimeoutRefs.current.inner);
      }
      scrollTimeoutRefs.current = {};
    };
  }, []);

  return {
    normalizeValue,
    isFieldEdited,
    getFieldClassName,
    getErrorCountForSection,
    allValidationErrors,
    getErrorsBySection,
    scrollToErrorField,
  };
}

