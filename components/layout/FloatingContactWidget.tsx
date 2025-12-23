/**
 * Floating Contact Widget Component
 * 
 * Displays a floating contact button with expandable sub-buttons (Hotline, Zalo, Messenger)
 * - Fixed position at bottom corner (left or right)
 * - Expandable menu with smooth animations
 * - Client-side only rendering (ssr: false) for performance
 */

'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Phone, MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ContactSubButton } from './ContactSubButton';
import type { ContactWidgetConfig } from '@/types/mongodb';

interface FloatingContactWidgetProps {
  className?: string;
}

/**
 * Fetch contact widget settings from public API
 */
async function fetchContactWidgetConfig() {
  const res = await fetch('/api/cms/contact-widget');
  if (!res.ok) return null;
  const data = await res.json();
  return data.success ? data.data : null;
}

export function FloatingContactWidget({ className }: FloatingContactWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Fetch config from API
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['contact-widget-public'],
    queryFn: fetchContactWidgetConfig,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });


  // Determine visibility based on config
  useEffect(() => {
    if (config && config.enabled && config.items && config.items.length > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
      setIsOpen(false); // Close if disabled
    }
  }, [config]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: Event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Add slight delay to prevent immediate close when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Toggle open/close
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Memoize active items
  const activeItems = useMemo(() => {
    if (!config?.items) return [];
    return config.items.filter((item: ContactWidgetConfig['items'][0]) => item.active);
  }, [config]);

  // Don't render if not visible
  if (!isVisible || !config) {
    return null;
  }

  const position = config.position || 'right';
  const primaryColor = config.primaryColor || '#D6336C';

  return (
    <div
      ref={widgetRef}
      className={cn(
        'fixed z-[9999]',
        position === 'right' ? 'right-4 md:right-6' : 'left-4 md:left-6',
        'bottom-5 md:bottom-8',
        className
      )}
      style={{
        // ✅ FIX: Dùng CSS animation trực tiếp để đảm bảo opacity về 1
        // Animation fadeIn đã được định nghĩa trong globals.css
        // Start với opacity 0, animation sẽ animate về 1
        animation: 'fadeIn 0.3s ease-out forwards',
        opacity: 0, // Initial state, animation will set to 1
      }}
    >
      {/* Sub Buttons */}
      {isOpen && activeItems.length > 0 && (
        <div className="flex flex-col-reverse gap-3 mb-3">
          {activeItems.map((item: ContactWidgetConfig['items'][0], index: number) => (
            <ContactSubButton
              key={item.type}
              item={item}
              primaryColor={primaryColor}
              delay={index * 50} // Giảm delay để mượt hơn (50ms thay vì 100ms)
            />
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-14 h-14 md:w-16 md:h-16',
          'rounded-full shadow-lg',
          'flex items-center justify-center',
          'transition-all duration-300 ease-in-out',
          'hover:scale-110 hover:shadow-xl',
          'active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50',
          // ✅ FIX: Bỏ animate-pulse (gây nhấp nháy), thay bằng subtle shadow khi closed
          !isOpen && 'shadow-lg hover:shadow-xl',
          // Smooth rotation khi mở/đóng
          isOpen && 'rotate-90'
        )}
        style={{
          backgroundColor: primaryColor,
          color: '#ffffff',
        }}
        aria-label={isOpen ? 'Đóng menu liên hệ' : 'Mở menu liên hệ'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 md:w-7 md:h-7" />
        ) : (
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
        )}
      </button>

      {/* Tooltip (Desktop only) */}
      {!isOpen && (
        <div
          className={cn(
            'hidden md:block',
            'absolute bottom-full mb-2',
            position === 'right' ? 'right-0' : 'left-0',
            'px-3 py-1.5',
            'bg-gray-900 text-white text-sm rounded-lg',
            'whitespace-nowrap',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'pointer-events-none'
          )}
        >
          Liên hệ
          <div
            className={cn(
              'absolute top-full',
              position === 'right' ? 'right-4' : 'left-4',
              'w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'
            )}
          />
        </div>
      )}
    </div>
  );
}

