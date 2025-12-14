'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TopBarProps {
  leftText?: string;
  rightItems?: Array<{
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
  leftText = "Chào mừng đến với thế giới gấu bông!",
  rightItems = [
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
  return (
    <div className="hidden md:flex items-center justify-between h-8 md:h-10 px-4 bg-white border-b border-border/50 text-sm">
      {/* Left: Welcome Text */}
      <div className="text-text-muted">
        {leftText}
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
