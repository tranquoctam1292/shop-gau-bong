'use client';

import { Button } from '@/components/ui/button';
import { useCartSync } from '@/lib/hooks/useCartSync';
import { type CartItem } from '@/lib/store/cartStore';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

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

  // Button text - Hiển thị loading state với spinner
  const getButtonContent = () => {
    if (isAdding) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Đang thêm...
        </>
      );
    }
    if (disabled) {
      return 'Hết hàng';
    }
    return 'Thêm vào giỏ hàng';
  };

  return (
    <Button
      className="w-full relative"
      size="lg"
      disabled={disabled || isAdding}
      onClick={handleAddToCart}
    >
      {getButtonContent()}
    </Button>
  );
}

