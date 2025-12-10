'use client';

import { useCartStore, type CartItem } from '@/lib/store/cartStore';

/**
 * Hook để quản lý cart (chỉ local - không có authentication)
 * Guest checkout: Tất cả users đều dùng local cart
 */
export function useCartSync() {
  const { items: localItems, clearCart, addItem, updateQuantity, removeItem } = useCartStore();

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
  const updateCartItem = (productId: number, quantity: number, variationId?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variationId);
    } else {
      updateQuantity(productId, quantity, variationId);
    }
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = (productId: number, variationId?: number) => {
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
    totalItems: localItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}
