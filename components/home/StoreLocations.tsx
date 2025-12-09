'use client';

import { buttonVariants } from '@/lib/utils/button-variants';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

// Simple SVG icons (no external dependency)
const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

interface StoreLocation {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  city?: string;
  mapUrl?: string; // Google Maps URL (optional)
}

interface StoreLocationsProps {
  title?: string;
  stores?: StoreLocation[];
}

/**
 * Store Locations Section
 * 
 * Hiển thị hệ thống cửa hàng với address, phone, hours
 * Build trust và local presence
 * 
 * Note: Hiện tại sử dụng placeholder data
 * Future: Có thể fetch từ WordPress custom post type hoặc API
 */
export function StoreLocations({
  title = 'HỆ THỐNG CỬA HÀNG',
  stores,
}: StoreLocationsProps) {
  // Default placeholder stores nếu không có data
  const defaultStores: StoreLocation[] = [
    {
      id: '1',
      name: 'Cửa hàng 1',
      address: '123 Đường ABC, Phường XYZ, Quận 1, TP.HCM',
      phone: '0123 456 789',
      hours: '8:30 - 23:00 hàng ngày',
      city: 'Tp. Hồ Chí Minh',
      mapUrl: 'https://maps.google.com/?q=123+Đường+ABC+TP.HCM',
    },
    {
      id: '2',
      name: 'Cửa hàng 2',
      address: '456 Đường DEF, Phường UVW, Quận 2, TP.HCM',
      phone: '0987 654 321',
      hours: '8:30 - 23:00 hàng ngày',
      city: 'Tp. Hồ Chí Minh',
      mapUrl: 'https://maps.google.com/?q=456+Đường+DEF+TP.HCM',
    },
  ];

  const displayStores = stores || defaultStores;

  // Group stores by city
  const storesByCity = displayStores.reduce((acc, store) => {
    const city = store.city || 'Khác';
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(store);
    return acc;
  }, {} as Record<string, StoreLocation[]>);

  if (!displayStores || displayStores.length === 0) {
    return null; // Không hiển thị nếu không có stores
  }

  return (
    <section className="container-mobile py-8 md:py-16 bg-muted/30">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
          {title}
        </h2>
      </div>

      {/* Stores by City */}
      <div className="space-y-8 md:space-y-12">
        {Object.entries(storesByCity).map(([city, cityStores]) => (
          <div key={city}>
            {/* City Header */}
            <h3 className="font-heading text-xl md:text-2xl font-semibold mb-4 md:mb-6">
              {city}
            </h3>

            {/* Stores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {cityStores.map((store) => (
                <div
                  key={store.id}
                  className="bg-background p-4 md:p-6 rounded-2xl border border-border hover:shadow-md transition-shadow"
                >
                  {/* Store Name */}
                  {store.name && (
                    <h4 className="font-heading text-lg md:text-xl font-semibold mb-3 text-text-main">
                      {store.name}
                    </h4>
                  )}

                  {/* Address */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-primary mt-0.5 flex-shrink-0">
                      <MapPinIcon />
                    </div>
                    <p className="text-sm md:text-base text-text-muted flex-1">
                      {store.address}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-primary flex-shrink-0">
                      <PhoneIcon />
                    </div>
                    <a
                      href={`tel:${store.phone.replace(/\s/g, '')}`}
                      className="text-sm md:text-base text-primary hover:underline"
                    >
                      {store.phone}
                    </a>
                  </div>

                  {/* Hours */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-primary flex-shrink-0">
                      <ClockIcon />
                    </div>
                    <p className="text-sm md:text-base text-text-muted">
                      {store.hours}
                    </p>
                  </div>

                  {/* Map Link (optional) */}
                  {store.mapUrl && (
                    <Link
                      href={store.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'w-full text-xs md:text-sm'
                      )}
                    >
                      Xem trên bản đồ →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* View More Link (optional) */}
      <div className="text-center mt-8 md:mt-12">
        <Link
          href="/contact"
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
        >
          Xem thêm thông tin liên hệ →
        </Link>
      </div>
    </section>
  );
}

