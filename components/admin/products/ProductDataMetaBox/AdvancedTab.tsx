'use client';

import type { ProductDataMetaBoxState } from './ProductDataMetaBox';

interface AdvancedTabProps {
  state: ProductDataMetaBoxState;
  onUpdate: (updates: Partial<ProductDataMetaBoxState>) => void;
}

/**
 * Advanced Tab - Purchase Note, Menu Order, Reviews
 * TODO: Implement in Phase 8
 */
export function AdvancedTab({ state, onUpdate }: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Nâng cao</h3>
        <p className="text-sm text-muted-foreground">
          Tab này sẽ được triển khai trong Phase 8
        </p>
      </div>
    </div>
  );
}
