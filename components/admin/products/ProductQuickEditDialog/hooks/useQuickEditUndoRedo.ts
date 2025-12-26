/**
 * Undo/Redo Hook for Quick Edit
 * 
 * PHASE 6: Extract Undo/Redo Tracking Logic
 * 
 * Handles form state tracking and undo/redo functionality
 */

'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useUndoRedo } from '@/lib/hooks/useUndoRedo';
import type { QuickEditFormData } from '../types';

export interface UseQuickEditUndoRedoOptions {
  open: boolean;
  formInitialized: boolean;
  isBulkMode: boolean;
  snapshotInitialData: QuickEditFormData | null;
  variants: QuickEditFormData['variants'];
  getFormStateSnapshot: () => QuickEditFormData;
  reset: (data: QuickEditFormData, options?: { keepDefaultValues?: boolean }) => void;
  // Watched values for change detection
  name?: string;
  sku?: string;
  status?: 'draft' | 'publish' | 'trash';
  manageStock?: boolean;
  regularPrice?: string;
  salePrice?: string;
  stockQuantity?: number | null;
  currentStockStatus?: 'instock' | 'outofstock' | 'onbackorder';
  selectedCategories?: string[];
  selectedTags?: string[];
  featuredImageId?: string;
  galleryImageIds?: string;
  weight?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  lowStockThreshold?: number | null;
}

export interface UseQuickEditUndoRedoResult {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  resetHistory: (data: QuickEditFormData) => void;
  handleSaveSuccess: (newSnapshotData?: QuickEditFormData | null) => void;
}

export function useQuickEditUndoRedo({
  open,
  formInitialized,
  isBulkMode,
  snapshotInitialData,
  variants,
  getFormStateSnapshot,
  reset,
  name,
  sku,
  status,
  manageStock,
  regularPrice,
  salePrice,
  stockQuantity,
  currentStockStatus,
  selectedCategories,
  selectedTags,
  featuredImageId,
  galleryImageIds,
  weight,
  length,
  width,
  height,
  lowStockThreshold,
}: UseQuickEditUndoRedoOptions): UseQuickEditUndoRedoResult {
  // Initialize undo/redo with initial form state
  const initialFormState = useMemo(() => {
    if (!open || !snapshotInitialData) return null;
    return snapshotInitialData;
  }, [open, snapshotInitialData]);

  // PHASE 4: Memory Optimization (7.4.2) - Dynamic maxHistory based on form size
  // Reduce maxHistory if form has many variants to save memory
  const variantCount = variants?.length || 0;
  const dynamicMaxHistory = useMemo(() => {
    if (variantCount > 50) return 20; // Large forms: reduce to 20
    if (variantCount > 20) return 30; // Medium forms: reduce to 30
    return 50; // Small forms: keep 50
  }, [variantCount]);

  // CRITICAL FIX: Flag to prevent tracking form changes during undo/redo
  const isUndoRedoInProgressRef = useRef(false);

  const {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  } = useUndoRedo<QuickEditFormData | null>(
    initialFormState,
    dynamicMaxHistory, // PHASE 4: Dynamic maxHistory based on form size
    (state) => {
      // CRITICAL FIX: Set flag to prevent tracking during undo/redo
      isUndoRedoInProgressRef.current = true;
      // When state changes (undo/redo), restore form values
      if (state) {
        reset(state, { keepDefaultValues: false });
      }
      // Reset flag after form values settle (use requestAnimationFrame for better timing)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isUndoRedoInProgressRef.current = false;
        });
      });
    },
    true // PHASE 4: Use shallow copy for memory optimization
  );

  // PHASE 4: Undo/Redo (4.3.7) - Track form state changes and add to history
  // Only track when form is initialized and dialog is open
  const prevFormStateRef = useRef<QuickEditFormData | null>(null);
  useEffect(() => {
    // CRITICAL FIX: Prevent tracking during undo/redo to avoid infinite loop
    if (!open || !formInitialized || isBulkMode || isUndoRedoInProgressRef.current) return;

    const currentState = getFormStateSnapshot();
    
    // Only add to history if state actually changed
    if (prevFormStateRef.current) {
      const prevState = prevFormStateRef.current;
      // PHASE 4: Memory Optimization (7.4.2) - Use shallow comparison instead of JSON.stringify for better performance
      // Compare key fields directly instead of full JSON stringify (which is expensive for large objects)
      const hasChanged = 
        prevState.name !== currentState.name ||
        prevState.sku !== currentState.sku ||
        prevState.status !== currentState.status ||
        prevState.manageStock !== currentState.manageStock ||
        prevState.regularPrice !== currentState.regularPrice ||
        prevState.salePrice !== currentState.salePrice ||
        prevState.stockQuantity !== currentState.stockQuantity ||
        prevState.stockStatus !== currentState.stockStatus ||
        JSON.stringify(prevState.categories) !== JSON.stringify(currentState.categories) ||
        JSON.stringify(prevState.tags) !== JSON.stringify(currentState.tags) ||
        prevState._thumbnail_id !== currentState._thumbnail_id ||
        prevState._product_image_gallery !== currentState._product_image_gallery ||
        prevState.weight !== currentState.weight ||
        prevState.length !== currentState.length ||
        prevState.width !== currentState.width ||
        prevState.height !== currentState.height ||
        prevState.lowStockThreshold !== currentState.lowStockThreshold ||
        JSON.stringify(prevState.variants) !== JSON.stringify(currentState.variants);
      
      if (hasChanged && !isUndoRedoInProgressRef.current) {
        // CRITICAL FIX: Double check flag before adding to history (defensive check)
        addToHistory(currentState);
      }
    }
    
    // CRITICAL FIX: Only update prevFormStateRef if not in undo/redo to prevent tracking
    if (!isUndoRedoInProgressRef.current) {
      prevFormStateRef.current = currentState;
    }
  }, [open, formInitialized, isBulkMode, getFormStateSnapshot, addToHistory, name, sku, status, manageStock, regularPrice, salePrice, stockQuantity, currentStockStatus, variants, selectedCategories, selectedTags, featuredImageId, galleryImageIds, weight, length, width, height, lowStockThreshold]);

  // PHASE 4: Undo/Redo (4.3.7) - Reset history when form is saved
  const handleSaveSuccess = useCallback(() => {
    if (!snapshotInitialData) return;
    // Reset history to current state after save
    resetHistory(snapshotInitialData);
    prevFormStateRef.current = snapshotInitialData;
  }, [snapshotInitialData, resetHistory]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    handleSaveSuccess,
  };
}

