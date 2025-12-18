'use client';

import { create } from 'zustand';

/**
 * Product Selection Store
 * 
 * ✅ PERFORMANCE: Quản lý selection state độc lập để tránh re-render cả ProductDataGrid
 * khi chỉ một checkbox thay đổi. Sử dụng Zustand để các component có thể subscribe
 * vào selection state mà không cần re-render parent component.
 */
interface ProductSelectionStore {
  selectedProducts: Set<string>;
  toggleProduct: (id: string) => void;
  toggleAll: (productIds: string[]) => void;
  clearSelection: () => void;
  setSelection: (ids: string[]) => void;
  isSelected: (id: string) => boolean;
  getSelectedCount: () => number;
  getSelectedIds: () => string[];
}

export const useProductSelectionStore = create<ProductSelectionStore>((set, get) => ({
  selectedProducts: new Set<string>(),

  toggleProduct: (id: string) => {
    set((state) => {
      const newSet = new Set(state.selectedProducts);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedProducts: newSet };
    });
  },

  toggleAll: (productIds: string[]) => {
    set((state) => {
      const allSelected = productIds.every((id) => state.selectedProducts.has(id));
      const newSet = new Set<string>();
      
      if (!allSelected) {
        // Select all
        productIds.forEach((id) => newSet.add(id));
      }
      // If all selected, clear selection (newSet is empty)
      
      return { selectedProducts: newSet };
    });
  },

  clearSelection: () => {
    set({ selectedProducts: new Set<string>() });
  },

  setSelection: (ids: string[]) => {
    set({ selectedProducts: new Set(ids) });
  },

  isSelected: (id: string) => {
    return get().selectedProducts.has(id);
  },

  getSelectedCount: () => {
    return get().selectedProducts.size;
  },

  getSelectedIds: () => {
    return Array.from(get().selectedProducts);
  },
}));

