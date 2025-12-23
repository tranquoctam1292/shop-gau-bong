'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs Component
 * 
 * Navigation breadcrumbs cho better UX và SEO
 * Auto-generate từ pathname hoặc custom items
 * Mobile-friendly với proper spacing
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs từ pathname nếu không có custom items
  const breadcrumbs = items || generateBreadcrumbsFromPath(pathname);

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('container-mobile py-3 md:py-4', className)}
    >
      <ol className="flex items-center flex-wrap gap-2 text-sm text-text-muted">
        {/* Home */}
        <li>
          <Link
            href="/"
            className={cn(
              'flex items-center gap-1 hover:text-primary transition-colors',
              'min-h-[44px] min-w-[44px] flex items-center justify-center',
              'focus:outline-none focus:ring-2 focus:ring-primary rounded'
            )}
            aria-label="Trang chủ"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only md:not-sr-only">Trang chủ</span>
          </Link>
        </li>

        {/* Breadcrumb Items */}
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-text-muted flex-shrink-0" />
              {isLast ? (
                <span className="text-text-main font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href || '#'}
                  className={cn(
                    'hover:text-primary transition-colors',
                    'min-h-[44px] flex items-center',
                    'focus:outline-none focus:ring-2 focus:ring-primary rounded px-1'
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Generate breadcrumbs từ pathname
 */
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  if (!pathname || pathname === '/') {
    return [];
  }

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  segments.forEach((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = formatSegmentLabel(segment);

    breadcrumbs.push({
      label,
      href,
    });
  });

  return breadcrumbs;
}

/**
 * Format segment label (slug → readable text)
 */
function formatSegmentLabel(segment: string): string {
  // Decode URL encoding
  const decoded = decodeURIComponent(segment);

  // Replace hyphens with spaces and capitalize
  const formatted = decoded
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Special cases
  const specialCases: Record<string, string> = {
    'products': 'Sản phẩm',
    'product': 'Sản phẩm',
    'categories': 'Danh mục',
    'category': 'Danh mục',
    'blog': 'Blog',
    'posts': 'Bài viết',
    'about': 'Về chúng tôi',
    'contact': 'Liên hệ',
    'search': 'Tìm kiếm',
    'cart': 'Giỏ hàng',
    'checkout': 'Thanh toán',
    'orders': 'Đơn hàng',
    'order': 'Đơn hàng',
  };

  return specialCases[segment.toLowerCase()] || formatted;
}

