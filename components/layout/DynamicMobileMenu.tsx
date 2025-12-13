'use client';

import { useState, lazy, Suspense } from 'react';
import Link from 'next/link';
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
 */
export function DynamicMobileMenu({
  location = 'mobile',
  fallbackToHardcoded = true,
}: DynamicMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { menu, isLoading, error } = useMenu(location);

  const closeMenu = () => {
    setIsOpen(false);
  };

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
            {menu.items.map((item) => (
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
 * This is the original hardcoded mobile menu structure
 * Used as fallback when no menu is found from API
 * Note: We'll use a simple fallback UI instead of importing the full MobileMenu
 * to avoid circular dependencies and keep the component lightweight
 */
function HardcodedMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

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
        <div className="text-sm text-gray-500 p-4">
          Menu đang được tải...
        </div>
      </SheetContent>
    </Sheet>
  );
}

