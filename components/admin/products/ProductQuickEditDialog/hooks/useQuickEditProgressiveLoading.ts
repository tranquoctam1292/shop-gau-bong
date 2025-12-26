/**
 * Progressive Loading Hook for Quick Edit
 * 
 * PHASE 6: Extract Progressive Loading Logic
 * 
 * Handles progressive loading of sections (critical first, then secondary)
 */

'use client';

import { useEffect, useRef, useState } from 'react';

export interface UseQuickEditProgressiveLoadingOptions {
  open: boolean;
  loadingProduct: boolean;
  isBulkMode: boolean;
}

export function useQuickEditProgressiveLoading({
  open,
  loadingProduct,
  isBulkMode,
}: UseQuickEditProgressiveLoadingOptions) {
  const [loadedSections, setLoadedSections] = useState<Set<string>>(new Set());
  const progressiveLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load critical sections first, then secondary sections
  useEffect(() => {
    if (!open) {
      // Reset loaded sections when dialog closes
      setLoadedSections(new Set());
      if (progressiveLoadTimeoutRef.current) {
        clearTimeout(progressiveLoadTimeoutRef.current);
        progressiveLoadTimeoutRef.current = null;
      }
      return;
    }

    if (loadingProduct || isBulkMode) {
      // Don't start progressive loading while still loading product data
      return;
    }

    // Critical sections: Load immediately when product data is ready
    if (!loadedSections.has('critical')) {
      setLoadedSections(prev => new Set([...prev, 'critical']));
    }

    // Secondary sections: Load after a short delay (100ms) to prioritize critical sections
    if (!loadedSections.has('secondary')) {
      progressiveLoadTimeoutRef.current = setTimeout(() => {
        setLoadedSections(prev => new Set([...prev, 'secondary']));
      }, 100);
    }

    return () => {
      if (progressiveLoadTimeoutRef.current) {
        clearTimeout(progressiveLoadTimeoutRef.current);
        progressiveLoadTimeoutRef.current = null;
      }
    };
  }, [open, loadingProduct, isBulkMode, loadedSections]);

  return {
    loadedSections,
    setLoadedSections,
  };
}

