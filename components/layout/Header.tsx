'use client';

import { lazy, Suspense, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/lib/utils/button-variants';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';

// Dynamic imports for heavy components
const CartDrawer = lazy(() => import('@/components/cart/CartDrawer').then(mod => ({ default: mod.CartDrawer })));
const EnhancedSearchBar = lazy(() => import('@/components/search/EnhancedSearchBar').then(mod => ({ default: mod.EnhancedSearchBar })));
const NavigationMenu = lazy(() => import('@/components/layout/NavigationMenu').then(mod => ({ default: mod.NavigationMenu })));

// MobileMenu lazy import - can be pre-loaded
const mobileMenuImport = () => import('@/components/layout/MobileMenu').then(mod => ({ default: mod.MobileMenu }));
const MobileMenu = lazy(mobileMenuImport);

const SearchModal = lazy(() => import('@/components/search/SearchModal').then(mod => ({ default: mod.SearchModal })));

export function Header() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const mobileMenuPreloadedRef = useRef(false);

  // Pre-load MobileMenu when user hovers/touches hamburger area
  // This reduces perceived delay when user clicks the menu
  const handleMobileMenuHover = useCallback(() => {
    // Only pre-load once
    if (!mobileMenuPreloadedRef.current) {
      mobileMenuPreloadedRef.current = true;
      // Trigger pre-load by calling the import function
      mobileMenuImport().catch(() => {
        // Silently fail if pre-load fails - component will load on demand
        mobileMenuPreloadedRef.current = false;
      });
    }
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-visible">
        <div className="container-mobile flex h-16 items-center justify-between gap-4 relative overflow-visible">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <span className="font-heading text-xl font-bold text-primary">
              🧸 Shop Gấu Bông
            </span>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <Suspense fallback={<Skeleton className="h-10 w-full rounded-full" />}>
              <EnhancedSearchBar />
            </Suspense>
          </div>

          {/* Desktop Navigation */}
          <Suspense fallback={<div className="hidden lg:block w-64 h-10" />}>
            <NavigationMenu />
          </Suspense>

          {/* Mobile Menu - Pre-load on hover for better UX */}
          <div 
            className="lg:hidden"
            onMouseEnter={handleMobileMenuHover}
            onTouchStart={handleMobileMenuHover} // Also pre-load on touch (mobile)
          >
            <Suspense fallback={<div className="w-10 h-10" />}>
              <MobileMenu />
            </Suspense>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Mobile Search Button - Opens Modal */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'md:hidden')}
              aria-label="Tìm kiếm"
            >
              🔍
            </button>
            <Suspense fallback={<Button variant="ghost" size="icon" disabled>🛒</Button>}>
              <CartDrawer />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Search Modal - Mobile Only */}
      <Suspense fallback={null}>
        <SearchModal 
          open={isSearchModalOpen} 
          onOpenChange={setIsSearchModalOpen} 
        />
      </Suspense>
    </>
  );
}

