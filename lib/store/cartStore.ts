'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  productName: string;
  price: string;
  image?: string;
  quantity: number;
  // Product specs for shipping calculation
  length?: number | null;
  width?: number | null;
  height?: number | null;
  weight?: number | null;
  volumetricWeight?: number | null;
  // Server cart key (for future server-side cart sync if needed)
  serverKey?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existingItem = get().items.find((i) => i.productId === item.productId);
        
        if (existingItem) {
          // Update quantity if item already exists
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          }));
        } else {
          // Add new item
          set((state) => ({
            items: [...state.items, { ...item, quantity: 1 }],
          }));
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
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
          const price = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
          return total + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'cart-storage', // localStorage key
    }
  )
);

