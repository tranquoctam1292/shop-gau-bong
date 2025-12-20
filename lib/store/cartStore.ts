'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string | number; // MongoDB ObjectId (string) or legacy number
  productName: string;
  price: string;
  image?: string;
  quantity: number;
  // Variation ID (for variable products)
  variationId?: number | string; // Can be string (MongoDB variant ID) or number (legacy)
  // Gift flag (for "GỬI TẶNG" button)
  isGift?: boolean;
  // Product specs for shipping calculation
  length?: number | null;
  width?: number | null;
  height?: number | null;
  weight?: number | null;
  volumetricWeight?: number | null;
  // Server cart key (for future server-side cart sync if needed)
  serverKey?: string;
}

/**
 * Helper function to normalize IDs for comparison
 * Ensures consistent comparison between string and number IDs
 * 
 * @param id - Product ID or variation ID (string | number | undefined)
 * @returns Normalized string ID or empty string
 */
function normalizeId(id: string | number | undefined | null): string {
  if (id === null || id === undefined) return '';
  return String(id);
}

/**
 * Helper function to normalize a CartItem's IDs
 * Ensures all IDs are strings for consistency
 * 
 * @param item - CartItem to normalize
 * @returns Normalized CartItem with string IDs
 */
function normalizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    productId: normalizeId(item.productId),
    variationId: item.variationId !== undefined ? normalizeId(item.variationId) : undefined,
  };
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (productId: string | number, quantity: number, variationId?: number | string) => void;
  removeItem: (productId: string | number, variationId?: number | string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        // FIX: Normalize IDs for consistent comparison
        // Prevents type mismatch issues (string vs number) when comparing IDs
        const normalizedItemId = normalizeId(item.productId);
        const normalizedItemVariationId = normalizeId(item.variationId);
        
        // Tìm item trùng: cùng productId và variationId (nếu có)
        // Use normalized IDs for comparison to handle both string and number IDs
        const existingItem = get().items.find((i) => {
          const normalizedExistingId = normalizeId(i.productId);
          const normalizedExistingVariationId = normalizeId(i.variationId);
          return normalizedExistingId === normalizedItemId && 
                 normalizedExistingVariationId === normalizedItemVariationId;
        });
        
        if (existingItem) {
          // Update quantity if item already exists
          set((state) => ({
            items: state.items.map((i) => {
              const normalizedExistingId = normalizeId(i.productId);
              const normalizedExistingVariationId = normalizeId(i.variationId);
              if (normalizedExistingId === normalizedItemId && 
                  normalizedExistingVariationId === normalizedItemVariationId) {
                return { ...i, quantity: i.quantity + 1 };
              }
              return i;
            }),
          }));
        } else {
          // Add new item - normalize IDs before storing
          const normalizedItem: CartItem = {
            ...item,
            productId: normalizedItemId,
            variationId: normalizedItemVariationId || undefined,
            quantity: 1,
          };
          set((state) => ({
            items: [...state.items, normalizedItem],
          }));
        }
      },

      updateQuantity: (productId, quantity, variationId?: number | string) => {
        if (quantity <= 0) {
          get().removeItem(productId, variationId);
          return;
        }

        // FIX: Normalize IDs for consistent comparison
        const normalizedProductId = normalizeId(productId);
        const normalizedVariationId = normalizeId(variationId);

        set((state) => ({
          items: state.items.map((i) => {
            const normalizedExistingId = normalizeId(i.productId);
            const normalizedExistingVariationId = normalizeId(i.variationId);
            if (normalizedExistingId === normalizedProductId && 
                normalizedExistingVariationId === normalizedVariationId) {
              return { ...i, quantity };
            }
            return i;
          }),
        }));
      },

      removeItem: (productId, variationId?: number | string) => {
        // FIX: Normalize IDs for consistent comparison
        const normalizedProductId = normalizeId(productId);
        const normalizedVariationId = normalizeId(variationId);

        set((state) => ({
          items: state.items.filter((i) => {
            const normalizedExistingId = normalizeId(i.productId);
            const normalizedExistingVariationId = normalizeId(i.variationId);
            return !(normalizedExistingId === normalizedProductId && 
                     normalizedExistingVariationId === normalizedVariationId);
          }),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          // Handle price: can be string, number, or null/undefined
          let price = 0;
          if (item.price !== null && item.price !== undefined) {
            if (typeof item.price === 'string') {
              // Remove non-numeric characters and parse
              price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
            } else if (typeof item.price === 'number') {
              // Already a number, use directly
              price = item.price;
            }
          }
          
          return total + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'cart-storage', // localStorage key
      // FIX: Normalize IDs when loading from localStorage
      // Ensures all IDs are strings for consistency, preventing type mismatch issues
      storage: {
        // FIX: Type assertion needed because Zustand expects StorageValue but we're working with JSON strings
        // We know this is safe because we're only normalizing the JSON structure
        getItem: (name: string) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const parsed = JSON.parse(str);
            if (parsed?.state?.items && Array.isArray(parsed.state.items)) {
              // Normalize all item IDs when loading from localStorage
              parsed.state.items = parsed.state.items.map((item: CartItem) => normalizeCartItem(item));
            }
            return JSON.stringify(parsed) as any;
          } catch {
            return str as any;
          }
        },
        setItem: (name: string, value: any) => {
          try {
            // Zustand passes StorageValue (which is string for JSON storage)
            const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
            const parsed = JSON.parse(valueStr);
            if (parsed?.state?.items && Array.isArray(parsed.state.items)) {
              // Normalize all item IDs before saving to localStorage
              parsed.state.items = parsed.state.items.map((item: CartItem) => normalizeCartItem(item));
            }
            localStorage.setItem(name, JSON.stringify(parsed));
          } catch {
            // Fallback: if parsing fails, save as-is
            localStorage.setItem(name, typeof value === 'string' ? value : JSON.stringify(value));
          }
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      } as any, // Type assertion: Zustand's Storage type is too strict, but our implementation is correct
    }
  )
);

