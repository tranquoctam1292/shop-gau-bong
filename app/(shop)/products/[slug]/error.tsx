'use client';

import { useEffect } from 'react';
import { buttonVariants } from '@/lib/utils/button-variants';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorState } from '@/components/ui/error-state';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Product error:', error);
  }, [error]);

  return (
    <div className="container-mobile py-8 md:py-16">
      <ErrorState
        title="Không thể tải sản phẩm"
        message={error.message || 'Có lỗi xảy ra khi tải sản phẩm. Vui lòng thử lại sau.'}
        action={{
          label: 'Thử lại',
          onClick: reset,
        }}
      />
      <div className="mt-6 text-center">
        <Link 
          href="/products" 
          className={buttonVariants({ variant: 'outline' })}
        >
          Xem tất cả sản phẩm
        </Link>
      </div>
    </div>
  );
}

