'use client';

import { useContext } from 'react';
import { QuickEditFormContext } from '../context/QuickEditFormContext';

/**
 * Hook to access Quick Edit Form Context
 * 
 * PHASE 0: Context API Setup
 * 
 * @throws Error if used outside QuickEditFormProvider
 * @returns QuickEditFormContextValue
 * 
 * @example
 * ```tsx
 * const { register, setValue, watch, errors } = useQuickEditFormContext();
 * ```
 */
export function useQuickEditFormContext() {
  const context = useContext(QuickEditFormContext);
  
  if (!context) {
    throw new Error(
      'useQuickEditFormContext must be used within QuickEditFormProvider. ' +
      'Make sure to wrap your component with QuickEditFormProvider.'
    );
  }
  
  return context;
}

