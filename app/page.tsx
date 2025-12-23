import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { NewArrivals } from '@/components/home/NewArrivals';
import { BigsizeProducts } from '@/components/home/BigsizeProducts';
import { CategoryProducts } from '@/components/home/CategoryProducts';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { BestSellers } from '@/components/home/BestSellers';
import { VideoSection } from '@/components/home/VideoSection';
import { StoriesSection } from '@/components/home/StoriesSection';
import { StoreLocations } from '@/components/home/StoreLocations';
import { HeroBanners } from '@/components/home/HeroBanners';

/**
 * HomePage Component
 * 
 * Main landing page với các sections:
 * 1. Hero Banner Carousel (from CMS)
 * 2. Categories Grid - Danh mục sản phẩm (ngay sau Hero)
 * 3. Sản phẩm mới nhất
 * 4. Gấu Bông Bigsize
 * 5. Gấu Teddy (category products)
 * 6. Thú Bông Hot (trending)
 * 7. Featured Products
 * 8. Best Sellers
 */
export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Banner Carousel - Fetched from CMS */}
      <HeroBanners />

      {/* Categories Grid - Danh mục sản phẩm - Ngay sau Hero Section */}
      <CategoryGrid />

      {/* Sản phẩm mới nhất */}
      <NewArrivals />

      {/* Gấu Bông Bigsize */}
      <BigsizeProducts />

      {/* Gấu Teddy */}
      <CategoryProducts
        categorySlug="teddy"
        categoryName="Gấu Teddy"
        emoji="🧸"
        perPage={8}
      />

      {/* Thú Bông Hot */}
      <TrendingProducts />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Best Sellers */}
      <BestSellers />

      {/* Video Section - Storytelling */}
      <VideoSection
        videoId={process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID} // Set in .env.local
        youtubeChannelUrl={process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL}
      />

      {/* Stories Section - Emotional Connection */}
      <StoriesSection />

      {/* Store Locations - Trust & Contact */}
      <StoreLocations />
    </main>
  );
}

