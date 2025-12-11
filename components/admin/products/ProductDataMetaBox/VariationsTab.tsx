'use client';

import type { ProductDataMetaBoxState } from './ProductDataMetaBox';

interface VariationsTabProps {
  state: ProductDataMetaBoxState;
  onUpdate: (updates: Partial<ProductDataMetaBoxState>) => void;
}

/**
 * Variations Tab - Product Variations
 * TODO: Implement in Phase 7
 */
export function VariationsTab({ state, onUpdate }: VariationsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Biến thể</h3>
        <p className="text-sm text-muted-foreground">
          Tab này sẽ được triển khai trong Phase 7
        </p>
      </div>
    </div>
  );
}
