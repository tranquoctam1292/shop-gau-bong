'use client';

import { useEffect } from 'react';
import { useCartStore, type CartItem } from '@/lib/store/cartStore';

/**
 * Helper function to normalize IDs for comparison
 */
function normalizeId(id: string | number | undefined | null): string {
  if (id === null || id === undefined) return '';
  return String(id);
}

/**
 * BUSINESS LOGIC FIX: Merge two cart arrays intelligently
 * - If same productId + variationId exists in both, sum quantities
 * - If only in one cart, add to merged result
 * 
 * @param localCart - Local cart items
 * @param serverCart - Server cart items
 * @returns Merged cart items
 */
function mergeCarts(localCart: CartItem[], serverCart: CartItem[]): CartItem[] {
  const mergedMap = new Map<string, CartItem>();
  
  // Helper to generate key for cart item
  const getItemKey = (item: CartItem): string => {
    const productId = normalizeId(item.productId);
    const variationId = normalizeId(item.variationId);
    return `${productId}_${variationId}`;
  };
  
  // First, add all local items to map
  localCart.forEach((item) => {
    const key = getItemKey(item);
    mergedMap.set(key, { ...item });
  });
  
  // Then, merge server items
  serverCart.forEach((serverItem) => {
    const key = getItemKey(serverItem);
    const existingItem = mergedMap.get(key);
    
    if (existingItem) {
      // Same product + variation exists in both - sum quantities
      mergedMap.set(key, {
        ...existingItem,
        quantity: existingItem.quantity + serverItem.quantity,
        // Prefer local item data (price, image, etc.) but sum quantities
      });
    } else {
      // Only in server cart - add to merged result
      mergedMap.set(key, { ...serverItem });
    }
  });
  
  return Array.from(mergedMap.values());
}

/**
 * Hook để quản lý cart với sync logic
 * - Local cart: Guest checkout (localStorage)
 * - Server cart: Authenticated users (future implementation)
 * - Merge logic: When user logs in, merge local + server carts
 */
export function useCartSync() {
  const { items: localItems, clearCart, addItem, updateQuantity, removeItem, setItems } = useCartStore();
  
  /**
   * BUSINESS LOGIC FIX: Sync cart when user logs in
   * Merge local cart with server cart instead of overwriting
   * 
   * @param serverCart - Cart items from server (optional, for future server cart implementation)
   */
  const syncCartOnLogin = async (serverCart?: CartItem[]) => {
    if (!serverCart || serverCart.length === 0) {
      // No server cart - keep local cart as is
      return;
    }
    
    if (localItems.length === 0) {
      // No local cart - load server cart
      setItems(serverCart);
      return;
    }
    
    // Both have items - merge them
    const mergedCart = mergeCarts(localItems, serverCart);
    setItems(mergedCart);
  };

  /**
   * Add item to cart (local only - guest checkout)
   */
  const addToCart = async (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    // Add to local cart
    // Note: addItem expects Omit<CartItem, 'quantity'> and always adds quantity: 1
    // So we need to use updateQuantity after adding
    const quantity = item.quantity || 1;
    const itemWithoutQuantity: Omit<CartItem, 'quantity'> = {
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      image: item.image,
      variationId: item.variationId,
      isGift: item.isGift,
      length: item.length,
      width: item.width,
      height: item.height,
      weight: item.weight,
      volumetricWeight: item.volumetricWeight,
      serverKey: item.serverKey,
    };
    
    // Add item first (will have quantity: 1)
    addItem(itemWithoutQuantity);
    
    // Then update quantity if needed
    if (quantity > 1) {
      updateQuantity(item.productId, quantity, item.variationId);
    }
  };

  /**
   * Update item quantity in cart
   */
  const updateCartItem = (productId: string | number, quantity: number, variationId?: number | string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variationId);
    } else {
      updateQuantity(productId, quantity, variationId);
    }
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = (productId: string | number, variationId?: number | string) => {
    removeItem(productId, variationId);
  };

  /**
   * Clear entire cart
   */
  const clearCartItems = () => {
    clearCart();
  };

  return {
    items: localItems,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart: clearCartItems,
    syncCartOnLogin, // BUSINESS LOGIC FIX: Expose merge function for login flow
    totalItems: localItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}

// Export merge function for use in other components
export { mergeCarts };
