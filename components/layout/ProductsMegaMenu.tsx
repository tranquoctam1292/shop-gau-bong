'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import type { MenuItem, BadgeType } from '@/types/menu';
import { badgeConfig } from '@/lib/constants/menuData';

interface ProductsMegaMenuProps {
  label: string;
  href?: string;
  menuItem: MenuItem;
  className?: string;
}

/**
 * Products Mega Menu Component
 * 
 * 3-column layout:
 * - Column 1: Theo loại (Categories)
 * - Column 2: Theo size (Sizes)
 * - Column 3: Banner với CTA button
 * 
 * Desktop: Hover to open
 * Mobile: Click to open (handled by MobileMenu)
 */
export function ProductsMegaMenu({ 
  label, 
  href, 
  menuItem,
  className 
}: ProductsMegaMenuProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  // Check if current pathname matches href
  const isActive = pathname === href || (href && href !== '/' && pathname?.startsWith(href));
  
  // Handle image error
  const handleImageError = (imagePath: string) => {
    setFailedImages(prev => new Set(prev).add(imagePath));
  };

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate menu position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
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
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
        timeoutRef.current = null;
      }, 250);
    }
  };

  if (!menuItem.megaMenu || !menuItem.megaMenu.columns || menuItem.megaMenu.columns.length === 0) {
    // Fallback to simple link
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

  const columns = menuItem.megaMenu.columns;
  const categoryColumn = columns.find(col => col.type === 'category');
  const sizeColumn = columns.find(col => col.type === 'size');
  const bannerColumn = columns.find(col => col.type === 'banner');

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
        href={href || '/products'}
        className={cn(
          'text-sm font-medium transition-colors',
          'min-h-[44px] flex items-center px-3 gap-1',
          'relative z-50',
          isActive || isOpen 
            ? 'text-primary font-semibold' 
            : 'text-text-main hover:text-primary',
          className
        )}
      >
        {label}
        <span className="text-xs">▼</span>
      </Link>

      {/* Invisible Buffer Zone */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed pointer-events-auto"
          style={{
            top: `${menuPosition.top - 8}px`,
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

      {/* Mega Menu Panel - 3 Column Layout */}
      {isOpen && mounted && createPortal(
        <div
          ref={menuRef}
          className={cn(
            'fixed bg-background border border-border rounded-lg shadow-xl',
            'z-[60] p-6 min-w-[800px] max-w-[1000px]',
            'animate-[slideDown_0.3s_ease-in-out]',
            'pointer-events-auto'
          )}
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="grid grid-cols-3 gap-6">
            {/* Column 1: Theo loại */}
            {categoryColumn && (
              <div className="space-y-3">
                <h3 className="font-heading text-sm font-semibold text-text-main mb-2 uppercase tracking-wide">
                  {categoryColumn.title}
                </h3>
                <ul className="space-y-2">
                  {categoryColumn.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg',
                          'hover:bg-primary/10 hover:text-primary transition-colors group',
                          'min-h-[44px]'
                        )}
                      >
                        {/* Item Image/Icon */}
                        {item.image && !failedImages.has(item.image) ? (
                          <SafeImage
                            src={item.image}
                            alt={item.label}
                            className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-muted shadow-sm"
                            fallback={<div className="w-10 h-10 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center shadow-sm"><span className="text-xl">🧸</span></div>}
                            onError={() => handleImageError(item.image!)}
                          />
                        ) : (
                          <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center shadow-sm">
                            <span className="text-xl">🧸</span>
                          </div>
                        )}

                        {/* Item Info */}
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-text-main group-hover:text-primary transition-colors truncate">
                              {item.label}
                            </div>
                            {item.count !== undefined && item.count > 0 && (
                              <div className="text-xs text-text-muted">
                                {item.count} sản phẩm
                              </div>
                            )}
                          </div>
                          {item.badge && (
                            <Badge badge={item.badge} />
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                {categoryColumn.items.length > 0 && (
                  <Link
                    href="/products"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'block text-sm text-primary hover:underline font-medium mt-2',
                      'min-h-[44px] flex items-center'
                    )}
                  >
                    Xem tất cả →
                  </Link>
                )}
              </div>
            )}

            {/* Column 2: Theo size */}
            {sizeColumn && (
              <div className="space-y-3 border-l border-border pl-6">
                <h3 className="font-heading text-sm font-semibold text-text-main mb-2 uppercase tracking-wide">
                  {sizeColumn.title}
                </h3>
                <ul className="space-y-2">
                  {sizeColumn.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg',
                          'hover:bg-primary/10 hover:text-primary transition-colors group',
                          'min-h-[44px]'
                        )}
                      >
                        {/* Item Image/Icon */}
                        {item.image && !failedImages.has(item.image) ? (
                          <SafeImage
                            src={item.image}
                            alt={item.label}
                            className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-muted shadow-sm"
                            fallback={<div className="w-10 h-10 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center shadow-sm"><span className="text-xl">📏</span></div>}
                            onError={() => handleImageError(item.image!)}
                          />
                        ) : (
                          <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center shadow-sm">
                            <span className="text-xl">📏</span>
                          </div>
                        )}

                        {/* Item Info */}
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-text-main group-hover:text-primary transition-colors truncate">
                              {item.label}
                            </div>
                            {item.count !== undefined && item.count > 0 && (
                              <div className="text-xs text-text-muted">
                                {item.count} sản phẩm
                              </div>
                            )}
                          </div>
                          {item.badge && (
                            <Badge badge={item.badge} />
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                {sizeColumn.items.length > 0 && (
                  <Link
                    href="/products"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'block text-sm text-primary hover:underline font-medium mt-2',
                      'min-h-[44px] flex items-center'
                    )}
                  >
                    Xem tất cả →
                  </Link>
                )}
              </div>
            )}

            {/* Column 3: Banner */}
            {bannerColumn && bannerColumn.items.length > 0 && (
              <div className="space-y-3 border-l border-border pl-6">
                <h3 className="font-heading text-sm font-semibold text-text-main mb-2 uppercase tracking-wide">
                  {bannerColumn.title}
                </h3>
                {bannerColumn.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block group"
                  >
                    <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 shadow-md">
                      {item.image && !failedImages.has(item.image) && (
                        <SafeImage
                          src={item.image}
                          alt={item.label}
                          className="absolute inset-0 w-full h-full"
                          fallback={null}
                          onError={() => handleImageError(item.image!)}
                        />
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      
                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-base">{item.label}</h4>
                          {item.badge && (
                            <Badge badge={item.badge} className="bg-white/20 text-white border-white/30" />
                          )}
                        </div>
                        <button
                          type="button"
                          className={cn(
                            'mt-2 px-4 py-2 rounded-full bg-primary text-white font-semibold text-sm',
                            'hover:scale-105 transition-transform shadow-lg',
                            'min-h-[44px]'
                          )}
                        >
                          Xem ngay
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/**
 * Safe Image Component - Handles image loading errors
 * Uses native img tag for better error handling
 */
function SafeImage({ 
  src, 
  alt, 
  className, 
  fallback,
  onError 
}: { 
  src: string; 
  alt: string; 
  className?: string;
  fallback: React.ReactNode;
  onError?: () => void;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return <>{fallback}</>;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 300px"
        onError={() => {
          setHasError(true);
          onError?.();
        }}
      />
    </div>
  );
}

/**
 * Badge Component
 */
function Badge({ badge, className }: { badge: BadgeType; className?: string }) {
  const config = badgeConfig[badge];
  if (!config) return null;

  return (
    <span
      className={cn(
        'text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap',
        className || `bg-[${config.bgColor}] text-[${config.textColor}]`
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      {config.label}
    </span>
  );
}
