'use client';

import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useCartStore } from '@/lib/store/cartStore';
import { useMemo } from 'react';

interface CartButtonProps {
  onClick?: () => void;
}

/**
 * Cart Button Component
 * 
 * Hiển thị nút giỏ hàng với badge số lượng
 * Badge tự động ẩn khi totalItems = 0 (không cần mounted state)
 * Có thể dùng với SheetTrigger (onClick sẽ được SheetTrigger xử lý)
 */
export function CartButton({ onClick }: CartButtonProps = {}) {
  const { getTotalItems } = useCartStore();
  
  // Tính totalItems - sẽ là 0 trên server, giá trị thực trên client
  // Không cần mounted state vì badge sẽ tự ẩn khi totalItems = 0
  const totalItems = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    return getTotalItems();
  }, [getTotalItems]);

  return (
    <Button
      onClick={onClick}
      className={cn(
        'relative bg-pink-50 hover:bg-pink-100 text-pink-600',
        'rounded-full w-10 h-10 p-0',
        'border border-pink-200 shadow-sm',
        'transition-colors duration-200'
      )}
      aria-label="Giỏ hàng"
    >
      <ShoppingBag className="w-5 h-5" strokeWidth={2.5} />
      
      {/* Badge - Tự động ẩn khi totalItems = 0, không cần mounted state */}
      <span 
        className={cn(
          'absolute -top-1 -right-1',
          'h-5 w-5 rounded-full bg-red-500 text-white',
          'text-[10px] flex items-center justify-center font-bold',
          'border-2 border-white',
          'transition-opacity duration-200',
          // Ẩn badge khi totalItems = 0 (bao gồm cả server-side render)
          totalItems === 0 ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
        )}
        aria-hidden={totalItems === 0}
      >
        {totalItems > 99 ? '99+' : totalItems}
      </span>
    </Button>
  );
}

