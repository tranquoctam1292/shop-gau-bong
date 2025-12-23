'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';
import { useState } from 'react';

interface PromotionalBannerProps {
  title: string;
  description?: string;
  image?: string;
  link?: string;
  linkText?: string;
  variant?: 'default' | 'primary' | 'accent';
  dismissible?: boolean;
  className?: string;
}

/**
 * Promotional Banner Component
 * 
 * Banner quảng cáo cho menu hoặc header
 * Có thể dismiss, có image, và link
 * Mobile-friendly với proper sizing
 */
export function PromotionalBanner({
  title,
  description,
  image,
  link,
  linkText = 'Xem thêm',
  variant = 'default',
  dismissible = true,
  className,
}: PromotionalBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const content = (
    <div
      className={cn(
        'relative p-4 rounded-lg flex items-center gap-4',
        'min-h-[80px]',
        variant === 'default' && 'bg-muted',
        variant === 'primary' && 'bg-primary/10 border border-primary/20',
        variant === 'accent' && 'bg-accent/10 border border-accent/20',
        className
      )}
    >
      {/* Image */}
      {image && (
        <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-heading text-sm md:text-base font-semibold text-text-main mb-1">
          {title}
        </h3>
        {description && (
          <p className="text-xs md:text-sm text-text-muted line-clamp-2">
            {description}
          </p>
        )}
        {link && (
          <Link
            href={link}
            className={cn(
              'inline-block mt-2 text-xs md:text-sm font-medium',
              'text-primary hover:underline',
              'min-h-[44px] flex items-center'
            )}
          >
            {linkText} →
          </Link>
        )}
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={() => setIsDismissed(true)}
          className={cn(
            'flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center',
            'text-text-muted hover:text-text-main transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary rounded',
            'touch-manipulation'
          )}
          aria-label="Đóng banner"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (link && !linkText.includes('→')) {
    return (
      <Link href={link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

