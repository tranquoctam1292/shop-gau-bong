/**
 * Contact Sub Button Component
 * 
 * Individual button for each contact method (Hotline, Zalo, Messenger)
 * - Icon with optional label
 * - Smooth animations
 * - Link handling (tel:, zalo.me, m.me)
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Phone, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ContactWidgetConfig } from '@/types/mongodb';

interface ContactSubButtonProps {
  item: ContactWidgetConfig['items'][0];
  primaryColor: string;
  delay?: number; // Animation delay in ms
}

/**
 * Zalo Icon (Official Logo Shape)
 * ✅ FIX: Update SVG Path chuẩn nhận diện thương hiệu
 * Zalo brand color: #0068FF
 */
function ZaloIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M0 0H48V48H0V0Z" fill="none" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.6 0C4.29807 0 0 4.29807 0 9.6V38.4C0 43.7019 4.29807 48 9.6 48H38.4C43.7019 48 48 43.7019 48 38.4V9.6C48 4.29807 43.7019 0 38.4 0H9.6ZM13.4357 15.6714C12.3783 15.6714 11.5212 16.5285 11.5212 17.5859V29.7428C11.5212 30.5528 12.1779 31.2095 12.9878 31.2095H16.0352C16.8452 31.2095 17.5019 30.5528 17.5019 29.7428V24.5126H18.9685L22.9566 30.2981C23.2759 30.7614 23.7716 31.0666 24.3314 31.1449H29.1433C30.2007 31.1449 31.0578 30.2878 31.0578 29.2304V17.0735C31.0578 16.2635 30.4011 15.6068 29.5911 15.6068H26.5438C25.7338 15.6068 25.0771 16.2635 25.0771 17.0735V22.2533H23.6105L19.6224 16.4678C19.3031 16.0045 18.8074 15.6993 18.2476 15.621H13.4357V15.6714ZM36.1919 19.5399C35.0348 19.5399 34.0967 20.478 34.0967 21.6352V25.1813C34.0967 26.3385 35.0348 27.2766 36.1919 27.2766H39.2393C40.3965 27.2766 41.3346 26.3385 41.3346 25.1813V21.6352C41.3346 20.478 40.3965 19.5399 39.2393 19.5399H36.1919Z"
        fill="#0068FF"
      />
    </svg>
  );
}

/**
 * Messenger Icon (Inline SVG)
 * Messenger brand colors: Gradient #00B2FF to #0084FF
 * Simplified Messenger logo representation
 */
function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="messenger-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00B2FF" />
          <stop offset="100%" stopColor="#0084FF" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"
        fill="url(#messenger-gradient)"
      />
      <path
        d="M7 10l4 4 6-6"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Get icon component for contact type
 * If custom iconUrl is provided, use it; otherwise use default icon
 */
function getIcon(
  type: ContactWidgetConfig['items'][0]['type'],
  iconUrl?: string,
  className?: string
) {
  // If custom icon URL is provided, render it
  if (iconUrl) {
    return (
      <div className={className}>
        <Image
          src={iconUrl}
          alt={`${type} icon`}
          width={24}
          height={24}
          className="w-full h-full"
          onError={(e) => {
            // Fallback to default icon if custom icon fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            // Replace with default icon
            const parent = target.parentElement;
            if (parent) {
              const defaultIcon = getDefaultIcon(type, className);
              if (defaultIcon) {
                parent.innerHTML = '';
                parent.appendChild(defaultIcon as any);
              }
            }
          }}
        />
      </div>
    );
  }

  // Use default icons
  return getDefaultIcon(type, className);
}

/**
 * Get default icon component (fallback)
 */
function getDefaultIcon(type: ContactWidgetConfig['items'][0]['type'], className?: string) {
  switch (type) {
    case 'hotline':
      return <Phone className={className} />;
    case 'zalo':
      return <ZaloIcon className={className} />;
    case 'messenger':
      return <MessengerIcon className={className} />;
    default:
      return <MessageCircle className={className} />;
  }
}

/**
 * Get link URL for contact type
 */
function getLinkUrl(item: ContactWidgetConfig['items'][0]): string {
  switch (item.type) {
    case 'hotline':
      return `tel:${item.value.replace(/\s/g, '')}`;
    case 'zalo':
      // ✅ FIX: Format chuẩn cho zalo.me (bỏ tất cả non-digit characters)
      // Giữ nguyên logic replace để đảm bảo chỉ có số
      return `https://zalo.me/${item.value.replace(/\D/g, '')}`;
    case 'messenger':
      return `https://m.me/${item.value}`;
    default:
      return '#';
  }
}

export function ContactSubButton({ item, primaryColor, delay = 0 }: ContactSubButtonProps) {
  const [iconError, setIconError] = useState(false);
  const linkUrl = getLinkUrl(item);
  const isExternal = item.type === 'zalo' || item.type === 'messenger';

  const handleClick = () => {
    // Optional: Google Analytics event tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'click', {
        event_category: 'Contact Button',
        event_label: item.type,
      });
    }
  };

  return (
    <a
      href={linkUrl}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      className={cn(
        'group',
        'flex items-center gap-3',
        'px-4 py-3 md:px-5 md:py-3.5',
        'min-h-[44px]', // Touch target minimum
        'rounded-full shadow-lg',
        'transition-all duration-200 ease-out',
        'hover:scale-105 hover:shadow-xl',
        'active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50',
        // ✅ FIX: Dùng custom keyframe fadeInUp mượt mà, không nhấp nháy
        'opacity-0 translate-y-2',
        'text-white font-medium text-sm md:text-base'
      )}
      style={{
        backgroundColor: primaryColor,
        animation: `fadeInUp 0.3s ease-out ${delay}ms forwards`,
      }}
      aria-label={item.label || item.type}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center">
        {item.iconUrl && !iconError ? (
          <Image
            src={item.iconUrl}
            alt={`${item.type} icon`}
            width={28}
            height={28}
            className="w-full h-full object-contain"
            onError={() => setIconError(true)}
          />
        ) : (
          getDefaultIcon(item.type, 'w-full h-full')
        )}
      </div>

      {/* Label (Desktop only) */}
      <span className="hidden md:inline whitespace-nowrap">{item.label}</span>
    </a>
  );
}

