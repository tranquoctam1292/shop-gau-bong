'use client';

import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/lib/utils/button-variants';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { TopBar } from './TopBar';
import { topBarConfig } from '@/lib/constants/menuData';
import { SITE_CONFIG } from '@/lib/constants/config';
import Image from 'next/image';
import type { SiteSettings } from '@/types/siteSettings';
import { DynamicNavigationMenu } from './DynamicNavigationMenu';
import type { Menu as MenuData } from '@/lib/utils/menuServer';

// Dynamic imports for heavy components
const CartDrawer = lazy(() => import('@/components/cart/CartDrawer').then(mod => ({ default: mod.CartDrawer })));
const EnhancedSearchBar = lazy(() => import('@/components/search/EnhancedSearchBar').then(mod => ({ default: mod.EnhancedSearchBar })));

// MobileMenu lazy import - can be pre-loaded
const mobileMenuImport = () => import('@/components/layout/DynamicMobileMenu').then(mod => ({ default: mod.DynamicMobileMenu }));
const DynamicMobileMenu = lazy(mobileMenuImport);

const SearchModal = lazy(() => import('@/components/search/SearchModal').then(mod => ({ default: mod.SearchModal })));

interface HeaderProps {
  siteSettings?: SiteSettings | null;
  menu?: MenuData | null;
}

export function Header({ siteSettings, menu }: HeaderProps) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const mobileMenuPreloadedRef = useRef(false);

  // Sticky Logic: 
  // - Desktop: Tầng 3 (Navigation Menu) sticky when scroll > 100px
  // - Mobile: Tầng 2 (Logo - Search - Actions) sticky when scroll > 100px
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
        announcementBar={siteSettings?.header.announcementBar}
        fallbackLeftText={topBarConfig.left}
        fallbackRightItems={topBarConfig.right}
      />

      {/* TẦNG 2: LOGO - SEARCH - ACTIONS (STICKY ON MOBILE ONLY, NOT STICKY ON DESKTOP) */}
      <div 
        className={cn(
          "bg-background border-b border-primary/5 z-30 transition-all duration-300",
          // Base: always relative
          "relative w-full overflow-x-hidden",
          // Mobile: sticky when scroll > 100px
          // Desktop: always relative (lg:relative overrides fixed)
          isSticky 
            ? "fixed lg:relative top-0 left-0 right-0 lg:top-auto lg:left-auto lg:right-auto py-3 lg:py-4 md:py-6 bg-background/100 backdrop-blur-md shadow-md lg:shadow-none lg:backdrop-blur-none"
            : "py-4 md:py-6"
        )}
      >
        <div className="container mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 md:gap-4 lg:gap-8 min-w-0 max-w-[100vw]">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink group min-w-0">
            {siteSettings?.header.logo ? (
              <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                <Image
                  src={siteSettings.header.logo.url}
                  alt={siteSettings.header.logo.alt || siteSettings.header.logo.name}
                  fill
                  className="object-contain transition-transform group-hover:scale-110"
                  sizes="(max-width: 768px) 40px, 48px"
                />
              </div>
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center text-2xl transition-transform group-hover:rotate-12">
                🧸
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
              {/* ✅ BRANDING: Dynamic site title from siteSettings or fallback to SITE_CONFIG */}
              {(() => {
                // Use siteTitle from siteSettings if available, otherwise use SITE_CONFIG.name
                const siteTitle = siteSettings?.header?.siteTitle || SITE_CONFIG.name;
                
                // Split site title to maintain color styling (first part in primary color, rest in text-main)
                // Try to split at "Gấu Bông" or "GấuBông" to maintain brand colors
                let titleParts: string[] = [];
                let splitPoint = '';
                
                if (siteTitle.includes('Gấu Bông')) {
                  titleParts = siteTitle.split('Gấu Bông');
                  splitPoint = 'Gấu Bông';
                } else if (siteTitle.includes('GấuBông')) {
                  titleParts = siteTitle.split('GấuBông');
                  splitPoint = 'GấuBông';
                } else {
                  // If no split point found, use first word in primary, rest in text-main
                  const words = siteTitle.split(' ');
                  if (words.length > 1) {
                    titleParts = [words[0], words.slice(1).join(' ')];
                  } else {
                    titleParts = [siteTitle];
                  }
                }
                
                return (
                  <span className="font-logo text-lg sm:text-xl md:text-2xl font-extrabold text-primary leading-none tracking-tight truncate block">
                    {titleParts[0]}
                    {titleParts.length > 1 && splitPoint && (
                      <>
                        {splitPoint}
                        <span className="text-text-main">{titleParts[1]}</span>
                      </>
                    )}
                    {titleParts.length > 1 && !splitPoint && (
                      <span className="text-text-main"> {titleParts[1]}</span>
                    )}
                    {titleParts.length === 1 && <span className="text-text-main">{titleParts[0]}</span>}
                  </span>
                );
              })()}
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
          <div className="flex items-center gap-1.5 md:gap-4 flex-shrink-0 min-w-0">
            {/* Mobile Search */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'md:hidden text-text-main w-10 h-10 flex-shrink-0')}
              aria-label="Tìm kiếm"
            >
              <Search className="w-5 h-5" />
            </button>

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
              className="lg:hidden" 
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
              ? "fixed top-0 bg-background/100 backdrop-blur-md shadow-md py-2" 
              : "relative bg-background py-0 border-t border-primary/10"
          )}
      >
        <div className="container mx-auto px-4 flex justify-center">
          {/* ✅ PERFORMANCE: Menu data passed from Server Component */}
          <DynamicNavigationMenu menu={menu ?? null} fallbackToHardcoded={true} />
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

