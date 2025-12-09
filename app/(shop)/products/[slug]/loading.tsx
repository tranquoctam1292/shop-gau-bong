import { ProductCardSkeleton } from '@/components/ui/skeleton';

export default function ProductLoading() {
  return (
    <div className="container-mobile py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted rounded-2xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-6 bg-muted rounded w-1/2 animate-pulse" />
          <div className="h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

