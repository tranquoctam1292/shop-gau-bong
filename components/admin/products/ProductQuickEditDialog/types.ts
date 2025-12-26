/**
 * Types for ProductQuickEditDialog
 * 
 * PHASE 0: Context API Setup - Extract types for reuse
 */

import type { z } from 'zod';
import { quickEditSchema } from './schema';
import type { MappedProduct } from '@/lib/utils/productMapper';

// Form data type inferred from schema
export type QuickEditFormData = z.infer<typeof quickEditSchema>;

// Props interface
export interface ProductQuickEditDialogProps {
  product?: MappedProduct; // Optional for bulk mode
  productIds?: string[]; // For bulk edit mode
  open: boolean;
  onClose: () => void;
  onSuccess?: (updatedProduct: MappedProduct) => void;
  onBulkSuccess?: (updatedCount: number) => void; // For bulk mode
}

