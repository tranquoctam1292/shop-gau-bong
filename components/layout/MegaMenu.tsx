'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useCategoriesContext } from '@/lib/providers/CategoriesProvider';
import { cn } from '@/lib/utils/cn';

interface MegaMenuProps {
  label: string;
  href?: string;
  className?: string;
}

/**
 * Mega Menu Component
 * 
 * Multi-column mega menu cho Categories
 * Hiển thị categories với images và product counts
 * Desktop: Hover to open
 * Mobile: Click to open (handled by MobileMenu)
 */
export function MegaMenu({ label, href, className }: MegaMenuProps) {
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
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
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
        // Only close on click outside for mobile
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
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Set new timeout to close menu
      // Increased delay to 250ms to prevent accidental closure
      // when user's mouse briefly moves outside the menu area
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
        timeoutRef.current = null;
      }, 250);
    }
  };

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

    // Create groups for top 3 parent categories
    topLevelCategories.slice(0, 3).forEach((parent) => {
      const children = subcategoriesByParent.get(parent.id) || [];
      const displayCategories = children.length > 0 
        ? children.slice(0, 4) 
        : [parent].slice(0, 4);
      
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

    // If no groups created, show all top-level categories as fallback
    if (groups.length === 0 && topLevelCategories.length > 0) {
      groups.push({
        title: 'Danh mục',
        categories: topLevelCategories.slice(0, 4).map((cat) => ({
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
        href={href || '#'}
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

  if (groups.length === 0) {
    // Fallback to simple link if no categories
    return (
      <Link
        href={href || '#'}
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

  return (
    <div
      ref={menuRef}
      className="relative overflow-visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Link */}
      <Link
        ref={triggerRef}
        href={href || '#'}
        className={cn(
          'text-sm font-medium text-text-main hover:text-primary transition-colors',
          'min-h-[44px] flex items-center px-3 gap-1',
          'relative z-50', // Ensure trigger is above other elements
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
            top: `${menuPosition.top - 8}px`, // 8px buffer above menu
            left: `${menuPosition.left}px`,
            width: `${menuPosition.width}px`,
            height: '8px',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-hidden="true"
        />,
        document.body
      )}

      {/* Mega Menu Panel - Rendered via Portal to bypass stacking contexts */}
      {isOpen && mounted && createPortal(
        <div
          ref={menuRef}
          className={cn(
            'fixed bg-background border border-border rounded-lg shadow-xl',
            'z-[60] p-6 min-w-[600px] max-w-[800px]',
            'animate-[slideDown_0.2s_ease-out]',
            'pointer-events-auto' // Ensure dropdown can receive mouse events
          )}
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="grid grid-cols-3 gap-6">
            {groups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                {/* Group Title */}
                <h3 className="font-heading text-sm font-semibold text-text-main mb-2">
                  {group.title}
                </h3>

                {/* Category Items */}
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
                        {/* Category Image (if available) */}
                        {category.image ? (
                          <div className="relative w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-lg overflow-hidden bg-muted shadow-sm">
                            <Image
                              src={category.image}
                              alt={category.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="56px"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center shadow-sm">
                            <span className="text-xl md:text-2xl">🧸</span>
                          </div>
                        )}

                        {/* Category Info */}
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

                {/* View All Link */}
                {group.categories.length >= 4 && (
                  <Link
                    href={`/products?category=${group.categories[0]?.slug}`}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'block text-sm text-primary hover:underline mt-2',
                      'min-h-[44px] flex items-center'
                    )}
                  >
                    Xem tất cả →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

