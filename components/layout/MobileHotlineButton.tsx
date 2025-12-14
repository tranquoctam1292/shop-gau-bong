'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { mobileConfig } from '@/lib/constants/menuData';

/**
 * Mobile Hotline Button Component
 * 
 * Sticky bottom button for mobile devices
 * Hiển thị nút gọi nhanh cố định dưới cùng màn hình trên mobile
 */
export function MobileHotlineButton() {
  if (!mobileConfig.hotlineButton.enabled) {
    return null;
  }

  const { phone, href, label } = mobileConfig.hotlineButton;

  return (
    <Link
      href={href}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'md:hidden', // Only show on mobile
        'bg-primary text-white',
        'flex items-center justify-center gap-2',
        'px-6 py-4 shadow-lg',
        'font-semibold text-base',
        'min-h-[56px]', // Touch-friendly height
        'transition-transform active:scale-95',
        'border-t border-primary/20'
      )}
      aria-label={`Gọi ${phone}`}
    >
      <Phone className="w-5 h-5" />
      <span>{label}</span>
      <span className="font-bold">{phone}</span>
    </Link>
  );
}
