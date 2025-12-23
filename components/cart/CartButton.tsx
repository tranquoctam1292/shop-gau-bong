'use client';

import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useCartStore } from '@/lib/store/cartStore';
import { useState, useEffect } from 'react';

interface CartButtonProps {
  onClick?: () => void;
}

/**
 * Cart Button Component
 * 
 * Hiển thị nút giỏ hàng với badge số lượng
 * FIX: Hydration Mismatch - Sử dụng mounted state để tránh hydration error
 * Badge chỉ render sau khi component đã mounted trên client để đảm bảo
 * server và client render giống nhau (đều không có badge ban đầu)
 */
export function CartButton({ onClick }: CartButtonProps = {}) {
  const { getTotalItems } = useCartStore();
  
  // FIX: Hydration Mismatch - Đảm bảo đồng bộ giữa Server và Client
  // Server render: mounted = false, không render badge
  // Client render: mounted = false ban đầu (giống server), sau đó mounted = true và render badge
  // Điều này đảm bảo không có hydration mismatch
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Chỉ tính totalItems sau khi mounted để tránh hydration mismatch
  const totalItems = mounted ? getTotalItems() : 0;

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
      
      {/* Badge - Chỉ hiển thị sau khi mounted và totalItems > 0 để tránh hydration error */}
      {mounted && totalItems > 0 && (
        <span 
          className={cn(
            'absolute -top-1 -right-1',
            'h-5 w-5 rounded-full bg-red-500 text-white',
            'text-[10px] flex items-center justify-center font-bold',
            'border-2 border-white',
            'transition-opacity duration-200'
          )}
          aria-hidden={false}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Button>
  );
}

