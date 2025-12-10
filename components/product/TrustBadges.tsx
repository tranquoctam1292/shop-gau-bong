'use client';

import { RefreshCcw, Truck, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

interface TrustBadgesProps {
  className?: string;
}

export function TrustBadges({ className }: TrustBadgesProps) {
  const badges = [
    {
      icon: RefreshCcw,
      title: 'Đổi hàng trong 3 ngày',
      description: 'Qua số điện thoại',
      color: 'text-pink-500',
      href: '/policies/return',
    },
    {
      icon: Truck,
      title: 'HCM Hỏa Tốc 60p',
      description: 'Ship Tỉnh 2-4 ngày',
      color: 'text-orange-500',
      href: '/policies/shipping',
    },
    {
      icon: Phone,
      title: 'Zalo/Hotline',
      description: '092 492 3399 (8h30 - 23h)',
      color: 'text-blue-500',
      href: 'https://zalo.me/0924923399',
      external: true,
    },
    {
      icon: MapPin,
      title: 'Cửa Hàng',
      description: '340 Phan Đình Phùng, P.1, Q.Phú Nhuận',
      color: 'text-red-500',
      href: '/contact',
    },
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          const content = (
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-pink-50 transition-colors cursor-pointer">
              <Icon className={`w-6 h-6 ${badge.color}`} />
              <div className="text-center">
                <p className="text-xs font-medium text-text-main">{badge.title}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{badge.description}</p>
              </div>
            </div>
          );

          if (badge.external) {
            return (
              <a
                key={index}
                href={badge.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {content}
              </a>
            );
          }

          return (
            <Link key={index} href={badge.href} className="block">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

