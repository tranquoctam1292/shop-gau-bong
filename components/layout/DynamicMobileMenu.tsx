'use client';

import { useState, lazy, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMenu, type MenuItem } from '@/lib/hooks/useMenu';
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
import { ChevronRight } from 'lucide-react';
import { mainNavigation } from '@/lib/constants/menuData';
import type { MenuItem as ConfigMenuItem } from '@/types/menu';
import { getMenuItemColor } from '@/types/menu';

// Lazy load search bar for better performance
const EnhancedSearchBar = lazy(() => 
  import('@/components/search/EnhancedSearchBar').then(mod => ({ 
    default: mod.EnhancedSearchBar 
  }))
);

interface DynamicMobileMenuProps {
  location?: string;
  fallbackToHardcoded?: boolean;
}

/**
 * Dynamic Mobile Menu Component
 * 
 * Renders mobile menu from CMS API
 * Falls back to hardcoded menu if no menu found or if fallbackToHardcoded is true
 * Hamburger menu cho mobile devices
 * Uses Shadcn Sheet component for proper drawer functionality
 * Touch-friendly với 44x44px touch targets
 * 
 * Note: Uses same location as desktop menu (default: 'primary') để đồng bộ menu items
 */
export function DynamicMobileMenu({
  location = 'primary',
  fallbackToHardcoded = true,
}: DynamicMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { menu, isLoading, error } = useMenu(location);

  const closeMenu = () => {
    setIsOpen(false);
  };

  // If still loading, show loading state
  if (isLoading) {
    return (
      <Sheet open={false}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'lg:hidden min-h-[44px] min-w-[44px]',
              'text-text-main hover:text-primary active:text-primary/80',
              'touch-manipulation'
            )}
            aria-label="Toggle menu"
            disabled
          >
            <span className="text-2xl">☰</span>
          </Button>
        </SheetTrigger>
      </Sheet>
    );
  }

  // If error or no menu, fallback to hardcoded menu
  if (error || !menu || !menu.items || menu.items.length === 0) {
    if (fallbackToHardcoded) {
      return <HardcodedMobileMenu />;
    }
    return null;
  }

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
        {isLoading ? (
          <nav className="space-y-1 pt-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </nav>
        ) : (
          <nav className="space-y-1 pt-2">
            {menu.items
              .filter((item) => {
                // Filter out ghost links (items with url === '#' or invalid references)
                if (!item.url || item.url === '#') {
                  return false;
                }
                return true;
              })
              .map((item) => (
                <MobileMenuItemRenderer
                  key={item.id}
                  item={item}
                  onItemClick={closeMenu}
                />
              ))}
          </nav>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Render individual menu item for mobile (recursive for nested items)
 */
function MobileMenuItemRenderer({
  item,
  onItemClick,
  depth = 0,
}: {
  item: MenuItem;
  onItemClick: () => void;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 text-base font-medium text-text-main',
            'hover:bg-muted active:bg-muted/80 hover:text-primary rounded-lg',
            'transition-all min-h-[44px]',
            'touch-manipulation',
            depth > 0 && 'pl-8' // Indent nested items
          )}
        >
          <span className="flex items-center gap-2">
            {item.iconClass && <span className={cn(item.iconClass)} />}
            {item.title}
          </span>
          <ChevronRight
            className={cn(
              'w-4 h-4 transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children!.map((child) => (
              <MobileMenuItemRenderer
                key={child.id}
                item={child}
                onItemClick={onItemClick}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Simple link item
  return (
    <Link
      href={item.url}
      target={item.target}
      onClick={onItemClick}
      className={cn(
        'block px-4 py-3 text-base font-medium text-text-main',
        'hover:bg-muted active:bg-muted/80 hover:text-primary rounded-lg',
        'transition-all min-h-[44px] flex items-center',
        'touch-manipulation',
        depth > 0 && 'pl-8' // Indent nested items
      )}
    >
      {item.iconClass && <span className={cn('mr-2', item.iconClass)} />}
      {item.title}
    </Link>
  );
}

/**
 * Hardcoded Mobile Menu (Fallback)
 * 
 * Uses same menu data from menuDataConfig as desktop menu
 * Based on menu_gau_bong.md specification
 * Renders mobile-friendly accordion style menu
 */
function HardcodedMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'lg:hidden min-h-[44px] min-w-[44px]',
            'text-text-main hover:text-primary active:text-primary/80',
            'touch-manipulation'
          )}
          aria-label="Toggle menu"
        >
          <span className="text-2xl">☰</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 max-w-[85vw] overflow-y-auto">
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

        {/* Menu Items from mainNavigation config */}
        <nav className="space-y-1 pt-2">
          {mainNavigation.map((item) => (
            <ConfigMobileMenuItemRenderer
              key={item.id}
              item={item}
              onItemClick={closeMenu}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Render config menu item for mobile (recursive for nested items)
 */
function ConfigMobileMenuItemRenderer({
  item,
  onItemClick,
  depth = 0,
}: {
  item: ConfigMenuItem;
  onItemClick: () => void;
  depth?: number;
}) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
  const itemColor = getMenuItemColor(item);

  // Check if has children/subItems
  const hasChildren = 
    (item.type === 'dropdown' && item.children && item.children.length > 0) ||
    (item.type === 'link' && item.subItems && item.subItems.length > 0) ||
    (item.type === 'mega' && item.megaMenu);

  if (hasChildren) {
    const children = item.type === 'dropdown' 
      ? item.children 
      : item.type === 'link' 
        ? item.subItems?.map(sub => ({ id: sub.href, label: sub.label, href: sub.href }))
        : item.megaMenu?.columns.flatMap(col => col.items || []).map(mi => ({ id: mi.id, label: mi.label, href: mi.href }));

    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 text-base font-medium',
            'hover:bg-muted active:bg-muted/80 rounded-lg',
            'transition-all min-h-[44px]',
            'touch-manipulation',
            depth > 0 && 'pl-8',
            isActive && 'text-primary font-semibold',
            !isActive && item.highlight && 'font-bold',
            !isActive && item.badge === 'sale' && 'text-red-600'
          )}
          style={item.color && !isActive ? { color: itemColor } : undefined}
        >
          <span className="flex items-center gap-2">
            {item.label}
            {item.badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {item.badge === 'sale' ? 'Sale' : item.badge}
              </span>
            )}
          </span>
          <ChevronRight
            className={cn(
              'w-4 h-4 transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
        </button>
        {isExpanded && children && (
          <div className="ml-4 mt-1 space-y-1">
            {children.map((child: any) => (
              <Link
                key={child.id || child.href}
                href={child.href}
                onClick={onItemClick}
                className={cn(
                  'block px-4 py-3 text-base font-medium text-text-main',
                  'hover:bg-muted active:bg-muted/80 hover:text-primary rounded-lg',
                  'transition-all min-h-[44px] flex items-center',
                  'touch-manipulation',
                  depth > 0 && 'pl-8'
                )}
              >
                {child.label}
                {child.badge && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {child.badge === 'sale' ? 'Sale' : child.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Simple link item
  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={cn(
        'block px-4 py-3 text-base font-medium',
        'hover:bg-muted active:bg-muted/80 hover:text-primary rounded-lg',
        'transition-all min-h-[44px] flex items-center',
        'touch-manipulation',
        depth > 0 && 'pl-8',
        isActive && 'text-primary font-semibold',
        !isActive && item.highlight && 'font-bold',
        !isActive && item.badge === 'sale' && 'text-red-600'
      )}
      style={item.color && !isActive ? { color: itemColor } : undefined}
    >
      {item.label}
      {item.badge && (
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          {item.badge === 'sale' ? 'Sale' : item.badge}
        </span>
      )}
    </Link>
  );
}

