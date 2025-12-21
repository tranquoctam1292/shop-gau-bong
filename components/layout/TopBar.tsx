'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TopBarProps {
  announcementBar?: {
    enabled: boolean;
    text?: string;
    link?: string;
    linkText?: string;
  };
  fallbackLeftText?: string;
  fallbackRightItems?: Array<{
    type: 'hotline' | 'link';
    label: string;
    href: string;
    phone?: string;
  }>;
}

/**
 * Top Bar Component (Tầng 1)
 * 
 * Hiển thị thông tin welcome và hotline/order tracking
 * Chiều cao: 30px - 40px
 */
export function TopBar({ 
  announcementBar,
  fallbackLeftText = "Chào mừng đến với thế giới gấu bông!",
  fallbackRightItems = [
    {
      type: 'hotline',
      label: 'Hotline',
      href: 'tel:+84123456789',
      phone: '0123 456 789'
    },
    {
      type: 'link',
      label: 'Theo dõi đơn hàng',
      href: '/order-tracking'
    }
  ]
}: TopBarProps) {
  // Use announcement bar if enabled, otherwise use fallback
  const showAnnouncement = announcementBar?.enabled && announcementBar?.text;
  const leftText = showAnnouncement ? announcementBar.text : fallbackLeftText;
  const rightItems = fallbackRightItems;

  if (!showAnnouncement && !fallbackLeftText) {
    return null;
  }

  return (
    <div className="hidden md:flex items-center justify-between h-8 md:h-10 px-4 bg-white border-b border-border/50 text-sm">
      {/* Left: Announcement Text */}
      <div className="text-text-muted flex-1">
        {showAnnouncement && announcementBar.link ? (
          <Link 
            href={announcementBar.link}
            className="hover:text-primary transition-colors"
          >
            {announcementBar.text}
            {announcementBar.linkText && (
              <span className="ml-2 text-primary font-medium">
                {announcementBar.linkText} →
              </span>
            )}
          </Link>
        ) : (
          <span>{leftText}</span>
        )}
      </div>

      {/* Right: Hotline & Order Tracking */}
      <div className="flex items-center gap-4">
        {rightItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={cn(
              'flex items-center gap-1.5 text-text-main hover:text-primary transition-colors',
              'min-h-[44px] px-2',
              item.type === 'hotline' && 'font-medium'
            )}
          >
            {item.type === 'hotline' && (
              <Phone className="w-3.5 h-3.5 text-primary" />
            )}
            <span>{item.label}</span>
            {item.type === 'hotline' && item.phone && (
              <span className="text-primary font-semibold">{item.phone}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
