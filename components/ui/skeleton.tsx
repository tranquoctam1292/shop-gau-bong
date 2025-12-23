/**
 * Skeleton Loading Component
 * Reusable skeleton component for loading states
 */

import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-muted rounded';
  
  const variantClasses = {
    default: 'rounded',
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    />
  );
}

/**
 * Product Card Skeleton
 */
export function ProductCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full" variant="rectangular" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" variant="text" />
        <Skeleton className="h-6 w-1/2" variant="text" />
      </div>
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}

/**
 * Product List Skeleton
 */
export function ProductListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Cart Item Skeleton
 */
export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <Skeleton className="w-24 h-24 rounded-xl" variant="rectangular" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/4" variant="text" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-12" variant="text" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Order Card Skeleton
 */
export function OrderCardSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" variant="text" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-4 w-48" variant="text" />
      <div className="flex gap-2">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <Skeleton className="w-12 h-12 rounded-lg" />
        <Skeleton className="w-12 h-12 rounded-lg" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-6 w-24" variant="text" />
      </div>
    </div>
  );
}

