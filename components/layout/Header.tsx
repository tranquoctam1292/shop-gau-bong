'use client';

import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/lib/utils/button-variants';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { TopBar } from './TopBar';
import { topBarConfig } from '@/lib/constants/menuData';

// Dynamic imports for heavy components
const CartDrawer = lazy(() => import('@/components/cart/CartDrawer').then(mod => ({ default: mod.CartDrawer })));
const EnhancedSearchBar = lazy(() => import('@/components/search/EnhancedSearchBar').then(mod => ({ default: mod.EnhancedSearchBar })));
const DynamicNavigationMenu = lazy(() => import('@/components/layout/DynamicNavigationMenu').then(mod => ({ default: mod.DynamicNavigationMenu })));

// MobileMenu lazy import - can be pre-loaded
const mobileMenuImport = () => import('@/components/layout/DynamicMobileMenu').then(mod => ({ default: mod.DynamicMobileMenu }));
const DynamicMobileMenu = lazy(mobileMenuImport);

const SearchModal = lazy(() => import('@/components/search/SearchModal').then(mod => ({ default: mod.SearchModal })));

export function Header() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const mobileMenuPreloadedRef = useRef(false);

  // Sticky Logic: Only Menu Ngang (Tầng 3) sticky when scroll > 100px
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pre-load MobileMenu when user hovers/touches hamburger area
  const handleMobileMenuHover = useCallback(() => {
    if (!mobileMenuPreloadedRef.current) {
      mobileMenuPreloadedRef.current = true;
      mobileMenuImport().catch(() => {
        mobileMenuPreloadedRef.current = false;
      });
    }
  }, []);

  return (
    <>
      {/* TẦNG 1: TOP BAR */}
      <TopBar 
        leftText={topBarConfig.left}
        rightItems={topBarConfig.right}
      />

      {/* TẦNG 2: LOGO - SEARCH - ACTIONS (NOT STICKY) */}
      <div className="bg-background py-4 md:py-6 border-b border-primary/5 relative z-30">
        <div className="container mx-auto px-4 flex items-center justify-between gap-4 md:gap-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center text-2xl transition-transform group-hover:rotate-12">
              🧸
            </div>
            <div className="flex flex-col">
              <span className="font-logo text-xl md:text-2xl font-extrabold text-primary leading-none tracking-tight">
                GấuBông<span className="text-text-main">Shop</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold hidden md:block">
                Soft & Cute
            </span>
            </div>
          </Link>

          {/* Search Bar - Fix CLS with matching Skeleton height */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
            <Suspense fallback={<Skeleton className="h-11 w-full rounded-full" />}>
              <EnhancedSearchBar className="w-full" />
            </Suspense>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {/* Mobile Search */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'md:hidden text-text-main')}
              aria-label="Tìm kiếm"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Desktop Actions: User Account */}
            <Link 
              href="/account" 
              className="hidden md:flex flex-col items-center group text-text-main hover:text-primary transition-colors"
            >
              <div className="w-10 h-10 bg-white border border-border rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                <User className="w-5 h-5" />
              </div>
            </Link>

            {/* Desktop Actions: Wishlist */}
            <Link 
              href="/wishlist" 
              className="hidden md:flex flex-col items-center group text-text-main hover:text-primary transition-colors relative"
            >
              <div className="w-10 h-10 bg-white border border-border rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                <Heart className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background">
                2
              </span>
            </Link>

            {/* Cart */}
            <Suspense fallback={
              <Button size="icon" variant="ghost">
                <ShoppingBag className="w-5 h-5" />
              </Button>
            }>
              <CartDrawer />
            </Suspense>
            
            {/* Mobile Menu Trigger */}
            <div 
              className="lg:hidden ml-2" 
              onMouseEnter={handleMobileMenuHover} 
              onTouchStart={handleMobileMenuHover}
            >
              <Suspense fallback={<div className="w-10 h-10 bg-gray-100 rounded-md" />}>
                <DynamicMobileMenu location="primary" fallbackToHardcoded={true} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* TẦNG 3: NAVIGATION MENU (STICKY) */}
      <header 
          className={cn(
            "hidden lg:block w-full z-40 transition-all duration-300 border-b border-border",
            isSticky 
              ? "fixed top-0 bg-white/95 backdrop-blur-md shadow-md py-2" 
              : "relative bg-white py-0 border-t border-primary/10"
          )}
      >
        <div className="container mx-auto px-4 flex justify-center">
          <Suspense fallback={<div className="w-full h-12 bg-gray-50 rounded animate-pulse" />}>
            <DynamicNavigationMenu location="primary" fallbackToHardcoded={true} />
          </Suspense>
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

