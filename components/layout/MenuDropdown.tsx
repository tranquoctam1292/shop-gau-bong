'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { buttonVariants } from '@/lib/utils/button-variants';
import { badgeConfig } from '@/lib/constants/menuData';
import type { BadgeType } from '@/types/menu';

export interface MenuDropdownItem {
  id: string;
  label: string;
  href: string;
  badge?: BadgeType;
  icon?: string;
}

interface MenuDropdownProps {
  label: string;
  href?: string;
  items: MenuDropdownItem[];
  className?: string;
  trigger?: 'hover' | 'click';
  icon?: string | React.ReactNode; // Icon to display before label (string for emoji, ReactNode for Lucide icons)
  highlight?: boolean; // Whether to highlight this menu item (for gifting/emotional products)
}

/**
 * Menu Dropdown Component (Reusable)
 * 
 * Dropdown menu với hover hoặc click trigger
 * Mobile-first với touch-friendly interactions
 */
export function MenuDropdown({
  label,
  href,
  items,
  className,
  trigger = 'hover',
  icon,
  highlight = false,
}: MenuDropdownProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Check if current pathname matches href or any child item
  const isActive = pathname === href || (href && href !== '/' && pathname?.startsWith(href)) ||
    items.some(item => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)));

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position when opening
  // Use viewport position (getBoundingClientRect) since dropdown uses position: fixed
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // Viewport position, no need for scrollY
        left: rect.left, // Viewport position, no need for scrollX
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle hover (desktop only)
  const handleMouseEnter = () => {
    if (trigger === 'hover' && window.innerWidth >= 1024) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover' && window.innerWidth >= 1024) {
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

  // Handle click (mobile and desktop)
  const handleClick = (e: React.MouseEvent) => {
    if (trigger === 'click' || window.innerWidth < 1024) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const handleItemClick = () => {
    setIsOpen(false);
  };

  if (!items || items.length === 0) {
    // No dropdown, just a link
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
      ref={dropdownRef}
      className="relative overflow-visible"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button/Link */}
      <Link
        ref={triggerRef}
        href={href || '#'}
        onClick={handleClick}
        className={cn(
          'text-sm font-medium transition-colors',
          'min-h-[44px] flex items-center px-3 gap-1.5',
          'relative z-50', // Ensure trigger is above other elements
          // Highlight styling for gifting/emotional products - Sweet pink theme
          highlight
            ? cn(
                'bg-[#FFEFF4] text-[#D6336C] border-2 border-[#FCC2D7]', // Hồng ngọt ngào, viền đậm
                'font-extrabold shadow-[0_2px_10px_rgba(255,192,203,0.3)]', // Đổ bóng hồng
                'hover:scale-105 transition-transform duration-200', // Hiệu ứng nảy nhẹ
                'rounded-full px-5 mx-1',
                isOpen && 'bg-[#FFE0E8] border-[#F99BB8]' // Darker when open
              )
            : cn(
                isActive ? 'text-primary font-semibold' : 'text-text-main hover:text-primary',
                isOpen && 'text-primary'
              ),
          className
        )}
      >
        {icon && <span className="text-base flex-shrink-0">{icon}</span>}
        <span>{label}</span>
        <span className="text-xs">▼</span>
      </Link>

      {/* Invisible Buffer Zone - Bridge between trigger and dropdown */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed pointer-events-auto"
          style={{
            top: `${dropdownPosition.top - 8}px`, // 8px buffer above dropdown (viewport position)
            left: `${dropdownPosition.left}px`, // Viewport position
            width: `${Math.max(dropdownPosition.width, 200)}px`,
            height: '8px',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-hidden="true"
        />,
        document.body
      )}

      {/* Dropdown Menu - Rendered via Portal to bypass stacking contexts */}
      {isOpen && mounted && createPortal(
        <div
          ref={dropdownRef}
          className={cn(
            'fixed bg-background border border-border rounded-lg shadow-xl',
            'min-w-[200px] z-[60] py-2',
            'animate-[slideDown_0.2s_ease-out]',
            'pointer-events-auto', // Ensure dropdown can receive mouse events
            // Add padding to create invisible buffer zone around dropdown
            'before:absolute before:inset-[-8px] before:pointer-events-auto'
          )}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            minWidth: `${Math.max(dropdownPosition.width, 200)}px`,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={handleItemClick}
              className={cn(
                'block px-4 py-2 text-sm text-text-main hover:bg-muted hover:text-primary',
                'transition-colors min-h-[44px] flex items-center justify-between',
                'focus:outline-none focus:bg-muted'
              )}
            >
              <span className="flex items-center gap-2 flex-1 min-w-0">
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge && (() => {
                const badge = badgeConfig[item.badge];
                if (!badge) return null;
                return (
                <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: badge.bgColor,
                      color: badge.textColor,
                    }}
                >
                    {badge.label}
                </span>
                );
              })()}
            </Link>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

