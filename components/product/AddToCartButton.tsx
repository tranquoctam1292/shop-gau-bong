'use client';

import { Button } from '@/components/ui/button';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { type CartItem } from '@/lib/store/cartStore';
import { useState } from 'react';

interface AddToCartButtonProps {
  product: Omit<CartItem, 'quantity'>;
  disabled?: boolean;
}

export function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
  const { addToCart } = useCartSync();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (disabled) return;

    setIsAdding(true);
    try {
      await addToCart(product);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      // Show feedback
      setTimeout(() => {
        setIsAdding(false);
      }, 500);
    }
  };

  // Fix hydration: Normalize text để đảm bảo render nhất quán
  const buttonText = isAdding ? 'Đã thêm ✓' : disabled ? 'Hết hàng' : 'Thêm vào giỏ hàng';

  return (
    <Button
      className="w-full"
      size="lg"
      disabled={disabled || isAdding}
      onClick={handleAddToCart}
    >
      {buttonText}
    </Button>
  );
}

