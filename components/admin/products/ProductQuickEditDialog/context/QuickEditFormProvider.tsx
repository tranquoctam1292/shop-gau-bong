'use client';

import { useMemo, type ReactNode } from 'react';
import type { 
  UseFormRegister, 
  UseFormSetValue, 
  UseFormWatch, 
  UseFormGetValues,
  UseFormReset,
  FieldErrors,
  FormState,
} from 'react-hook-form';
import { QuickEditFormContext, type QuickEditFormContextValue } from './QuickEditFormContext';
import type { QuickEditFormData } from '../types';
import type { SkuValidationResult } from '@/lib/hooks/useSkuValidation';
import type { MappedCategory } from '@/lib/utils/productMapper';

/**
 * Quick Edit Form Provider
 * 
 * PHASE 0: Context API Setup
 * 
 * Provides form state and handlers to all child components via Context API
 * Memoizes context value to prevent unnecessary re-renders
 */

interface QuickEditFormProviderProps {
  // Form methods (from react-hook-form)
  register: UseFormRegister<QuickEditFormData>;
  setValue: UseFormSetValue<QuickEditFormData>;
  watch: UseFormWatch<QuickEditFormData>;
  getValues: UseFormGetValues<QuickEditFormData>;
  reset: UseFormReset<QuickEditFormData>;
  
  // Form state
  errors: FieldErrors<QuickEditFormData>;
  formState: FormState<QuickEditFormData>;
  
  // Shared handlers
  handleFieldFocus: (fieldId: string, e?: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleFieldBlur: (e?: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  getFieldClassName: (fieldName: string, currentValue: any, hasError: boolean, isSaved: boolean, fieldId?: string, isValid?: boolean) => string;
  getErrorCountForSection: (sectionId: string) => number;
  
  // Shared state
  savedFields: Set<string>;
  flashingFields: Set<string>;
  fieldOriginalValues: Record<string, any>;
  expandedSections: string[];
  setExpandedSections: (sections: string[]) => void;
  
  // Section-specific (optional)
  skuValidation?: SkuValidationResult;
  categories?: MappedCategory[];
  isLoadingCategories?: boolean;
  variants?: Array<{
    id: string;
    sku?: string;
    price?: number;
    stock?: number;
    size?: string;
    color?: string;
    colorCode?: string;
    image?: string;
  }>;
  
  // Mode flags
  isBulkMode: boolean;
  isMobile: boolean;
  
  // Children
  children: ReactNode;
}

export function QuickEditFormProvider({
  register,
  setValue,
  watch,
  getValues,
  reset,
  errors,
  formState,
  handleFieldFocus,
  handleFieldBlur,
  getFieldClassName,
  getErrorCountForSection,
  savedFields,
  flashingFields,
  fieldOriginalValues,
  expandedSections,
  setExpandedSections,
  skuValidation,
  categories,
  isLoadingCategories,
  variants,
  isBulkMode,
  isMobile,
  children,
}: QuickEditFormProviderProps) {
  // Memoize context value to prevent unnecessary re-renders
  // Only re-create when dependencies change
  const contextValue = useMemo<QuickEditFormContextValue>(() => ({
    // Form methods (stable references from react-hook-form)
    register,
    setValue,
    watch,
    getValues,
    reset,
    
    // Form state
    errors,
    formState,
    
    // Shared handlers (should be memoized with useCallback in parent)
    handleFieldFocus,
    handleFieldBlur,
    getFieldClassName,
    getErrorCountForSection,
    
    // Shared state
    savedFields,
    flashingFields,
    fieldOriginalValues,
    expandedSections,
    setExpandedSections,
    
    // Section-specific (optional)
    skuValidation,
    categories,
    isLoadingCategories,
    variants,
    
    // Mode flags
    isBulkMode,
    isMobile,
  }), [
    // Form methods (stable, but include for completeness)
    register,
    setValue,
    watch,
    getValues,
    reset,
    
    // Form state
    errors,
    formState,
    
    // Handlers (should be stable with useCallback)
    handleFieldFocus,
    handleFieldBlur,
    getFieldClassName,
    getErrorCountForSection,
    
    // Shared state (may change frequently)
    savedFields,
    flashingFields,
    fieldOriginalValues,
    expandedSections,
    setExpandedSections,
    
    // Section-specific
    skuValidation,
    categories,
    isLoadingCategories,
    variants,
    
    // Mode flags
    isBulkMode,
    isMobile,
  ]);

  return (
    <QuickEditFormContext.Provider value={contextValue}>
      {children}
    </QuickEditFormContext.Provider>
  );
}

