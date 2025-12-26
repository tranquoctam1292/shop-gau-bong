'use client';

import { createContext } from 'react';
import type { 
  UseFormRegister, 
  UseFormSetValue, 
  UseFormWatch, 
  UseFormGetValues,
  UseFormReset,
  FieldErrors,
  FormState,
} from 'react-hook-form';
import type { QuickEditFormData } from '../types';
import type { SkuValidationResult } from '@/lib/hooks/useSkuValidation';
import type { MappedCategory } from '@/lib/utils/productMapper';

/**
 * Quick Edit Form Context
 * 
 * PHASE 0: Context API Setup - Provides form state and handlers to all sections
 * 
 * This context eliminates props drilling by providing:
 * - Form methods (register, setValue, watch, etc.)
 * - Form state (errors, formState)
 * - Shared handlers (handleFieldFocus, handleFieldBlur, etc.)
 * - Shared state (savedFields, flashingFields, etc.)
 * - Section-specific data (optional, passed via props)
 */

export interface QuickEditFormContextValue {
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
  
  // Section-specific (optional, passed via props to sections that need them)
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
}

export const QuickEditFormContext = createContext<QuickEditFormContextValue | null>(null);

