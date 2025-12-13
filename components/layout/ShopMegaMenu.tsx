'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShoppingBag, 
  Sparkles, 
  Flame, 
  Package, 
  Star, 
  Tag,
  Heart 
} from 'lucide-react';
import { useCategoriesContext } from '@/lib/providers/CategoriesProvider';
import { cn } from '@/lib/utils/cn';

interface ShopMegaMenuProps {
  label: string;
  href?: string;
  className?: string;
}

/**
 * Shop Mega Menu Component
 * 
 * Mega Menu hợp nhất "Sản phẩm" và "Danh mục"
 * Layout 2 cột:
 * - Bên trái: Danh sách danh mục (Categories)
 * - Bên phải: Bộ lọc nhanh (Quick filters: Hàng mới, Bán chạy, Bigsize...)
 */
export function ShopMegaMenu({ label, href, className }: ShopMegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const { categories, loading } = useCategoriesContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate menu position when opening
  // Use viewport position (getBoundingClientRect) since mega menu uses position: fixed
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4, // Viewport position, no need for scrollY
        left: rect.left, // Viewport position, no need for scrollX
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Close menu when clicking outside (only for mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        if (window.innerWidth < 1024) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen && window.innerWidth < 1024) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle hover (desktop only)
  const handleMouseEnter = () => {
    if (window.innerWidth >= 1024) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 1024) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Increased delay to 250ms to prevent accidental closure
      // when user's mouse briefly moves outside the menu area
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
        timeoutRef.current = null;
      }, 250);
    }
  };

  // Quick filter items (bộ lọc nhanh) - Using Lucide React icons instead of emoji
  const quickFilters = [
    { 
      id: 'all', 
      label: 'Tất cả sản phẩm', 
      href: '/products', 
      icon: <ShoppingBag className="w-4 h-4 text-primary" />
    },
    { 
      id: 'new', 
      label: 'Hàng mới', 
      href: '/products?sort=newest', 
      icon: <Sparkles className="w-4 h-4 text-yellow-500" />, 
      badge: 'new' 
    },
    { 
      id: 'popular', 
      label: 'Bán chạy', 
      href: '/products?sort=popularity', 
      icon: <Flame className="w-4 h-4 text-orange-500" />, 
      badge: 'hot' 
    },
    { 
      id: 'bigsize', 
      label: 'Bigsize', 
      href: '/products?size=bigsize', 
      icon: <Package className="w-4 h-4 text-amber-600" />
    },
    { 
      id: 'featured', 
      label: 'Nổi bật', 
      href: '/products?featured=true', 
      icon: <Star className="w-4 h-4 text-yellow-500" />
    },
    { 
      id: 'sale', 
      label: 'Giảm giá', 
      href: '/products?on_sale=true', 
      icon: <Tag className="w-4 h-4 text-green-600" />, 
      badge: 'sale' 
    },
  ];

  // Build category groups using parentId (sustainable approach)
  const categoryGroups = useRef<Array<{
    title: string;
    categories: Array<{
      id: number;
      name: string;
      slug: string;
      count: number;
      image: string | null;
    }>;
  }>>([]);

  useEffect(() => {
    if (!categories || categories.length === 0) return;

    // Get top-level categories (parentId === null)
    const topLevelCategories = categories.filter((cat) => 
      !cat.parentId
    );

    // Get subcategories grouped by parent
    const subcategoriesByParent = new Map<string, typeof categories>();
    categories.forEach((cat) => {
      if (cat.parentId) {
        if (!subcategoriesByParent.has(cat.parentId)) {
          subcategoriesByParent.set(cat.parentId, []);
        }
        subcategoriesByParent.get(cat.parentId)!.push(cat);
      }
    });

    // Build groups from top-level categories
    const groups: Array<{
      title: string;
      categories: Array<{
        id: number;
        name: string;
        slug: string;
        count: number;
        image: string | null;
      }>;
    }> = [];

    // Group 1: First top-level category and its children
    if (topLevelCategories.length > 0) {
      const firstParent = topLevelCategories[0];
      const children = subcategoriesByParent.get(firstParent.id) || [];
      const displayCategories = children.length > 0 
        ? children.slice(0, 6) 
        : [firstParent].slice(0, 6);
      
      groups.push({
        title: firstParent.name,
        categories: displayCategories.map((cat) => ({
          id: typeof cat.databaseId === 'number' ? cat.databaseId : parseInt(cat.id, 16) || 0,
          name: cat.name,
          slug: cat.slug,
          count: cat.count || 0,
          image: cat.image?.sourceUrl ?? null,
        })),
      });
    }

    // Group 2: Second top-level category and its children
    if (topLevelCategories.length > 1) {
      const secondParent = topLevelCategories[1];
      const children = subcategoriesByParent.get(secondParent.id) || [];
      const displayCategories = children.length > 0 
        ? children.slice(0, 6) 
        : [secondParent].slice(0, 6);
      
      groups.push({
        title: secondParent.name,
        categories: displayCategories.map((cat) => ({
          id: typeof cat.databaseId === 'number' ? cat.databaseId : parseInt(cat.id, 16) || 0,
          name: cat.name,
          slug: cat.slug,
          count: cat.count || 0,
          image: cat.image?.sourceUrl ?? null,
        })),
      });
    }

    // Group 3: Other top-level categories (if any)
    if (topLevelCategories.length > 2) {
      const otherParents = topLevelCategories.slice(2, 5); // Limit to 3 more groups
      otherParents.forEach((parent) => {
        const children = subcategoriesByParent.get(parent.id) || [];
        const displayCategories = children.length > 0 
          ? children.slice(0, 6) 
          : [parent].slice(0, 6);
        
        if (displayCategories.length > 0) {
          groups.push({
            title: parent.name,
            categories: displayCategories.map((cat) => ({
              id: typeof cat.databaseId === 'number' ? cat.databaseId : parseInt(cat.id, 16) || 0,
              name: cat.name,
              slug: cat.slug,
              count: cat.count || 0,
              image: cat.image?.sourceUrl ?? null,
            })),
          });
        }
      });
    }

    // If no groups created, show all top-level categories as fallback
    if (groups.length === 0 && topLevelCategories.length > 0) {
      groups.push({
        title: 'Danh mục',
        categories: topLevelCategories.slice(0, 6).map((cat) => ({
          id: typeof cat.databaseId === 'number' ? cat.databaseId : parseInt(cat.id, 16) || 0,
          name: cat.name,
          slug: cat.slug,
          count: cat.count || 0,
          image: cat.image?.sourceUrl ?? null,
        })),
      });
    }

    categoryGroups.current = groups;
  }, [categories]);

  if (loading || !categories || categories.length === 0) {
    return (
      <Link
        href={href || '/products'}
        className={cn(
          'text-sm font-medium text-text-main hover:text-primary transition-colors',
          'min-h-[44px] flex items-center px-3',
          className
        )}
      >
        {label}
      </Link>
    );
  }

  const groups = categoryGroups.current;

  return (
    <div
      className="relative overflow-visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Link */}
      <Link
        ref={triggerRef}
        href={href || '/products'}
        className={cn(
          'text-sm font-medium text-text-main hover:text-primary transition-colors',
          'min-h-[44px] flex items-center px-3 gap-1',
          'relative z-50',
          isOpen && 'text-primary',
          className
        )}
      >
        {label}
        <span className="text-xs">▼</span>
      </Link>

      {/* Invisible Buffer Zone - Bridge between trigger and mega menu */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed pointer-events-auto"
          style={{
            top: `${menuPosition.top - 8}px`, // 8px buffer above menu (viewport position)
            left: `${menuPosition.left}px`, // Viewport position
            width: `${menuPosition.width}px`,
            height: '8px',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-hidden="true"
        />,
        document.body
      )}

      {/* Mega Menu Panel - 2 Column Layout */}
      {isOpen && mounted && createPortal(
        <div
          ref={menuRef}
          className={cn(
            'fixed bg-background border border-border rounded-lg shadow-xl',
            'z-[60] p-6 min-w-[800px] max-w-[1000px]',
            'animate-[slideDown_0.2s_ease-out]',
            'pointer-events-auto'
          )}
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column: Categories */}
            <div className="space-y-6">
              <h3 className="font-heading text-base font-semibold text-text-main mb-4">
                Danh mục sản phẩm
              </h3>
              
              {groups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-3">
                  <h4 className="font-medium text-sm text-text-main mb-2">
                    {group.title}
                  </h4>
                  <ul className="space-y-2">
                    {group.categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/products?category=${category.slug}`}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-3 p-2 rounded-lg',
                            'hover:bg-muted transition-colors group',
                            'min-h-[44px]'
                          )}
                        >
                          {category.image ? (
                            <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-muted shadow-sm">
                              <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="40px"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center shadow-sm">
                              <Heart className="w-5 h-5 text-accent-foreground/60" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-text-main group-hover:text-primary transition-colors truncate">
                              {category.name}
                            </div>
                            {category.count > 0 && (
                              <div className="text-xs text-text-muted">
                                {category.count} sản phẩm
                              </div>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* View All Categories Link */}
              <Link
                href="/products"
                onClick={() => setIsOpen(false)}
                className={cn(
                  'block text-sm text-primary hover:underline font-medium mt-4',
                  'min-h-[44px] flex items-center'
                )}
              >
                Xem tất cả danh mục →
              </Link>
            </div>

            {/* Right Column: Quick Filters */}
            <div className="space-y-6 border-l pl-8">
              <h3 className="font-heading text-base font-semibold text-text-main mb-4">
                Bộ lọc nhanh
              </h3>
              
              <ul className="space-y-2">
                {quickFilters.map((filter) => (
                  <li key={filter.id}>
                    <Link
                      href={filter.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg',
                        'hover:bg-muted transition-colors group',
                        'min-h-[44px]'
                      )}
                    >
                      <span className="flex-shrink-0 flex items-center justify-center">
                        {filter.icon}
                      </span>
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <span className="font-medium text-sm text-text-main group-hover:text-primary transition-colors">
                          {filter.label}
                        </span>
                        {filter.badge && (
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ml-2',
                              filter.badge === 'new' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                              filter.badge === 'hot' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                              filter.badge === 'sale' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            )}
                          >
                            {filter.badge === 'new' && 'Mới'}
                            {filter.badge === 'hot' && 'Hot'}
                            {filter.badge === 'sale' && 'Sale'}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* View All Products Link */}
              <Link
                href="/products"
                onClick={() => setIsOpen(false)}
                className={cn(
                  'block text-sm text-primary hover:underline font-medium mt-6',
                  'min-h-[44px] flex items-center'
                )}
              >
                Xem tất cả sản phẩm →
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

