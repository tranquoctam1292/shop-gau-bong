'use client';

import { HeroCarousel } from './HeroCarousel';
import { useBanners } from '@/lib/hooks/useBanners';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Hero Banners Component
 * 
 * Fetches banners from WordPress CMS and displays in carousel
 * Falls back to default banners if CMS has no banners configured
 */
export function HeroBanners() {
  const { banners, loading, error } = useBanners();

  // Default fallback banners (if CMS has no banners)
  // Note: Images should be optimized (1920x800px, < 500KB, JPEG/WebP)
  // See docs/HERO_BANNER_GUIDE.md for specifications
  // Using placeholder images if hero images don't exist
  const defaultBanners = [
    {
      id: '1',
      image: '/images/teddy-placeholder.png', // Fallback to placeholder
      title: '🧸 Chào mừng đến với Shop Gấu Bông',
      subtitle: 'Nơi bạn tìm thấy những chú gấu bông đáng yêu nhất',
      ctaText: 'Mua ngay',
      ctaLink: '/products',
      order: 1,
    },
    {
      id: '2',
      image: '/images/teddy-placeholder.png', // Fallback to placeholder
      title: '🐻 Gấu Bông Bigsize',
      subtitle: 'Quà tặng ý nghĩa cho mọi dịp đặc biệt',
      ctaText: 'Xem Bigsize',
      ctaLink: '/products?size=bigsize',
      order: 2,
    },
    {
      id: '3',
      image: '/images/teddy-placeholder.png', // Fallback to placeholder
      title: '💝 Gấu Bông Valentine',
      subtitle: 'Tỏ tình ngọt ngào với món quà đáng yêu',
      ctaText: 'Xem sản phẩm',
      ctaLink: '/products?category=valentine',
      order: 3,
    },
  ];

  // Use CMS banners if available, otherwise use defaults
  const displayBanners = banners.length > 0 ? banners : defaultBanners;

  if (loading) {
    return (
      <section className="relative w-full h-[300px] md:h-[500px]">
        <Skeleton className="w-full h-full" />
      </section>
    );
  }

  if (error) {
    // Fail silently - show default banners
    console.warn('Failed to load banners from CMS, using defaults:', error);
  }

  // Don't render if no banners available
  if (displayBanners.length === 0) {
    return null;
  }

  return <HeroCarousel slides={displayBanners} />;
}

