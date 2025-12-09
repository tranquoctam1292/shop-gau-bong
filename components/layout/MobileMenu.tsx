'use client';

import { useState, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useCategoriesContext } from '@/lib/providers/CategoriesProvider';
import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Lazy load search bar for better performance
const EnhancedSearchBar = lazy(() => 
  import('@/components/search/EnhancedSearchBar').then(mod => ({ 
    default: mod.EnhancedSearchBar 
  }))
);

/**
 * Mobile Menu Component
 * 
 * Hamburger menu cho mobile devices
 * Uses Shadcn Sheet component for proper drawer functionality
 * Touch-friendly với 44x44px touch targets
 */
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { categories, loading } = useCategoriesContext();

  // Products submenu items
  const productsItems = [
    { label: 'Tất cả sản phẩm', href: '/products' },
    { label: 'Gấu Bông Bigsize', href: '/products?size=bigsize' },
    { label: 'Sản phẩm mới', href: '/products?sort=newest' },
    { label: 'Sản phẩm bán chạy', href: '/products?sort=popularity' },
    { label: 'Sản phẩm nổi bật', href: '/products?featured=true' },
    { label: 'Sản phẩm giảm giá', href: '/products?on_sale=true' },
  ];

  // Occasions submenu items
  const occasionsItems = [
    { label: 'Valentine', href: '/products?category=valentine' },
    { label: 'Sinh nhật', href: '/products?category=sinh-nhat' },
    { label: '8/3', href: '/products?category=8-3' },
    { label: '20/10', href: '/products?category=20-10' },
    { label: 'Giáng Sinh', href: '/products?category=giang-sinh' },
    { label: 'Tết', href: '/products?category=tet' },
  ];

  // Services submenu items
  const servicesItems = [
    { label: 'Thêu tên gấu bông', href: '/services/embroidery' },
    { label: 'Gói quà miễn phí', href: '/services/gift-wrapping' },
    { label: 'Vận chuyển', href: '/services/shipping' },
    { label: 'Bảo hành', href: '/services/warranty' },
    { label: 'Đổi trả', href: '/services/return' },
  ];

  // Build categories items from API
  const categoriesItems = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return categories.slice(0, 8).map((cat) => ({
      label: cat.name,
      href: `/products?category=${cat.slug}`,
    }));
  }, [categories]);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* Hamburger Button - Only visible on mobile */}
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'lg:hidden min-h-[44px] min-w-[44px]',
            'text-text-main hover:text-primary active:text-primary/80',
            'touch-manipulation' // Better touch handling
          )}
          aria-label="Toggle menu"
        >
          <span className="text-2xl">☰</span>
        </Button>
      </SheetTrigger>

      {/* Sheet Content - Mobile Menu Drawer */}
      <SheetContent 
        side="left" 
        className="w-80 max-w-[85vw] overflow-y-auto"
      >
        <SheetHeader className="mb-4 pb-4 border-b">
          <SheetTitle className="text-left font-heading text-lg font-bold text-primary">
            🧸 Menu
          </SheetTitle>
        </SheetHeader>

        {/* Search Bar */}
        <div className="mb-4">
          <Suspense fallback={<Skeleton className="h-10 w-full rounded-full" />}>
            <EnhancedSearchBar />
          </Suspense>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1 pt-2">
          {/* Trang chủ */}
          <Link
            href="/"
            onClick={closeMenu}
            className={cn(
              'block px-4 py-3 text-base font-medium text-text-main',
              'hover:bg-muted active:bg-muted/80 hover:text-primary rounded-lg',
              'transition-all min-h-[44px] flex items-center',
              'touch-manipulation' // Better touch handling
            )}
          >
            Trang chủ
          </Link>

          {/* Cửa Hàng - Hợp nhất Sản phẩm & Danh mục */}
          <MobileSubmenu
            label="Cửa Hàng"
            items={[
              ...productsItems,
              ...(categoriesItems.length > 0 ? categoriesItems : []),
            ]}
            onItemClick={closeMenu}
          />

          {/* Chọn Quà Tặng - Highlighted for emotional/gifting focus */}
          <div className="relative">
            <MobileSubmenu
              label="🎁 Chọn Quà Tặng"
              items={occasionsItems}
              onItemClick={closeMenu}
            />
            {/* Highlight badge */}
            <span className="absolute top-1 right-4 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
              Hot
            </span>
          </div>

          {/* Dịch vụ */}
          <MobileSubmenu
            label="Dịch vụ"
            items={servicesItems}
            onItemClick={closeMenu}
          />

          {/* Về chúng tôi */}
          <Link
            href="/about"
            onClick={closeMenu}
            className={cn(
              'block px-4 py-3 text-base font-medium text-text-main',
              'hover:bg-muted active:bg-muted/80 hover:text-primary rounded-lg',
              'transition-all min-h-[44px] flex items-center',
              'touch-manipulation' // Better touch handling
            )}
          >
            Về chúng tôi
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

interface MobileSubmenuProps {
  label: string;
  items: Array<{ label: string; href: string }>;
  onItemClick: () => void;
}

function MobileSubmenu({ label, items, onItemClick }: MobileSubmenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if this is the "Chọn Quà Tặng" menu for special styling
  const isGiftingMenu = label.includes('Chọn Quà Tặng') || label.includes('🎁');

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full px-4 py-3 text-base font-medium rounded-lg transition-colors',
          'min-h-[44px] flex items-center justify-between',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          'touch-manipulation', // Better touch handling
          // Special styling for gifting menu
          isGiftingMenu
            ? cn(
                'bg-accent/10 text-accent hover:bg-accent/20',
                'font-semibold shadow-sm',
                isExpanded && 'bg-accent/20'
              )
            : cn(
                'text-text-main hover:bg-muted hover:text-primary'
              )
        )}
      >
        <span>{label}</span>
        <span className={cn('transition-transform', isExpanded && 'rotate-180')}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="pl-4 mt-1 space-y-1">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'block px-4 py-2 text-sm text-text-muted',
                'hover:bg-muted hover:text-primary rounded-lg transition-colors',
                'min-h-[44px] flex items-center',
                'touch-manipulation' // Better touch handling
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
