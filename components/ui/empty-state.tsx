/**
 * Empty State Component
 * Display when there's no data to show
 */

import { ReactNode } from 'react';
import { buttonVariants } from '@/lib/utils/button-variants';
import { Card } from './card';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('p-8 md:p-12 text-center', className)}>
      {icon && (
        <div className="mb-4 flex justify-center text-6xl text-muted">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-xl md:text-2xl font-semibold mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-text-muted mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <Link href={action.href} className={buttonVariants()}>
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className={buttonVariants()}>
            {action.label}
          </button>
        )
      )}
    </Card>
  );
}

/**
 * Empty Cart State
 */
export function EmptyCartState() {
  return (
    <EmptyState
      title="Giỏ hàng của bạn đang trống"
      description="Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm"
      icon="🛒"
      action={{
        label: 'Tiếp tục mua sắm',
        href: '/products',
      }}
    />
  );
}

/**
 * No Products Found State
 */
export function NoProductsFoundState() {
  return (
    <EmptyState
      title="Không tìm thấy sản phẩm nào"
      description="Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác"
      icon="🔍"
      action={{
        label: 'Xem tất cả sản phẩm',
        href: '/products',
      }}
    />
  );
}

/**
 * No Orders Found State
 */
export function NoOrdersFoundState() {
  return (
    <EmptyState
      title="Bạn chưa có đơn hàng nào"
      description="Khi bạn đặt hàng, bạn sẽ thấy lịch sử đơn hàng ở đây"
      icon="📦"
      action={{
        label: 'Tiếp tục mua sắm',
        href: '/products',
      }}
    />
  );
}

/**
 * No Posts Found State
 */
export function NoPostsFoundState() {
  return (
    <EmptyState
      title="Không tìm thấy bài viết nào"
      description="Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác"
      icon="📝"
    />
  );
}

