/**
 * ProductQuickEditDialog - Index file for backward compatibility
 * 
 * PHASE 6: Final Cleanup - Optimize re-exports
 * 
 * This file ensures that dynamic imports continue to work:
 * - `import('./ProductQuickEditDialog')` → works
 * - `import('./ProductQuickEditDialog/index')` → also works
 * 
 * All consumers can continue using the same import path.
 */

// Re-export main component from parent directory
export { ProductQuickEditDialog } from '../ProductQuickEditDialog';

// Re-export types
export type { ProductQuickEditDialogProps, QuickEditFormData } from './types';

// Re-export schema (if needed by consumers)
export { quickEditSchema } from './schema';

// Re-export context (if needed by consumers)
export { QuickEditFormProvider } from './context/QuickEditFormProvider';
export { useQuickEditFormContext } from './hooks/useQuickEditFormContext';
export type { QuickEditFormContextValue } from './context/QuickEditFormContext';

