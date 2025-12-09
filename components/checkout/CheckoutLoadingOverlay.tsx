'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Checkout Loading Overlay
 * Hiển thị khi đang xử lý đơn hàng
 */
export function CheckoutLoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 z-[130] flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4" />
          <h3 className="font-heading text-xl font-semibold mb-2">
            Đang xử lý đơn hàng...
          </h3>
          <p className="text-sm text-text-muted">
            Vui lòng đợi trong giây lát, đừng đóng trang này.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        </div>
      </Card>
    </div>
  );
}


