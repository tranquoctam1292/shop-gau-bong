/**
 * ProductQuickEditDialog - Index file for backward compatibility
 * 
 * PHASE 1: Preparation - Re-export main component to maintain backward compatibility
 * 
 * This file ensures that dynamic imports continue to work:
 * - `import('./ProductQuickEditDialog')` → works
 * - `import('./ProductQuickEditDialog/index')` → also works
 * 
 * All consumers can continue using the same import path.
 */

// Re-export main component from parent directory
// Note: File is at ProductQuickEditDialog/index.tsx
// Main component is at ProductQuickEditDialog.tsx (parent)
export { ProductQuickEditDialog } from '../ProductQuickEditDialog';
export type { ProductQuickEditDialogProps, QuickEditFormData } from './types';

