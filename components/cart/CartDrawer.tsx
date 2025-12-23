'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useCartStore } from '@/lib/store/cartStore';
import { useQuickCheckoutStore } from '@/lib/store/useQuickCheckoutStore';

/**
 * Cart Button Component
 * 
 * Đơn giản hóa: Chỉ là một Button để mở QuickCheckoutModal
 * Loại bỏ hoàn toàn Sheet/Drawer logic
 */
export function CartDrawer() {
  // FIX: Hydration Mismatch - Đảm bảo đồng bộ giữa Server và Client
  // Server render: mounted = false, không render badge
  // Client render: mounted = false ban đầu (giống server), sau đó mounted = true và render badge
  // Điều này đảm bảo không có hydration mismatch
  const [mounted, setMounted] = useState(false);
  
  const { getTotalItems } = useCartStore();

  // Đợi cho đến khi component được mount trên client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Chỉ tính totalItems sau khi mounted để tránh hydration mismatch
  // Zustand store với localStorage có thể trả về giá trị khác nhau giữa server và client
  const totalItems = mounted ? getTotalItems() : 0;

  const handleCartButtonClick = () => {
    // Luôn mở QuickCheckoutModal (bất kể giỏ hàng có sản phẩm hay không)
    // Modal sẽ tự xử lý hiển thị empty state nếu cần
    useQuickCheckoutStore.getState().onOpen();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCartButtonClick}
      className={cn(
        'relative rounded-full w-10 h-10 p-0',
        'text-gray-600 hover:text-pink-600',
        'hover:bg-pink-50 transition-colors duration-200',
        'border-0' // Không có border để trong suốt
      )}
      aria-label="Giỏ hàng"
    >
      <ShoppingBag className="w-5 h-5" strokeWidth={2.5} />
      
      {/* Badge - Chỉ hiển thị sau khi mounted để tránh hydration error */}
      {mounted && totalItems > 0 && (
        <span 
          className={cn(
            'absolute -top-1 -right-1',
            'h-5 w-5 rounded-full bg-red-500 text-white',
            'text-[10px] flex items-center justify-center font-bold',
            'border-2 border-white'
          )}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Button>
  );
}
