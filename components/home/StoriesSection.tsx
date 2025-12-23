'use client';

import Link from 'next/link';
import { StoryCard } from './StoryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/lib/utils/button-variants';
import { useState, useEffect } from 'react';

interface Story {
  id: string;
  title: string;
  excerpt: string;
  featuredImage?: string;
  slug: string;
  date?: string;
  category?: string;
}

interface StoriesSectionProps {
  title?: string;
  subtitle?: string;
  stories?: Story[];
  limit?: number;
}

/**
 * Stories Section Component
 * 
 * Emotional connection section - Hiển thị featured blog posts/stories
 * 
 * Note: Hiện tại sử dụng placeholder data
 * Future: Fetch từ WordPress blog API hoặc REST API
 */
export function StoriesSection({
  title = 'CÂU CHUYỆN YÊU THƯƠNG',
  subtitle = 'Những câu chuyện ấm áp, những món quà ý nghĩa và những nụ cười hạnh phúc từ Shop Gấu Bông.',
  stories,
  limit = 3,
}: StoriesSectionProps) {
  const [loading, setLoading] = useState(false);

  // Default placeholder stories nếu không có data
  const defaultStories: Story[] = [
    {
      id: '1',
      title: 'Ký Ức Đắk Nông - Hành Trình Yêu Thương Đầu Tiên',
      excerpt: 'Hành trình thiện nguyện đầu tiên của Shop Gấu Bông tại Đắk Nông mang gần 300 phần quà đến trẻ em vùng cao cùng vô vàn ký ức chan chứa yêu thương.',
      featuredImage: '/images/teddy-placeholder.png',
      slug: 'ky-uc-dak-nong',
      date: '2024-12-01',
      category: 'Thiện nguyện',
    },
    {
      id: '2',
      title: 'Shop Gấu Bông Hướng Về Miền Trung',
      excerpt: 'Hành trình chia sẻ sau trận lũ lịch sử tại Đắk Lắk, mang yêu thương đến những nơi cần nhất.',
      featuredImage: '/images/teddy-placeholder.png',
      slug: 'huong-ve-mien-trung',
      date: '2024-11-15',
      category: 'Thiện nguyện',
    },
    {
      id: '3',
      title: 'Cùng Shop Gấu Bông Viết Tiếp Câu Chuyện Ấm Áp',
      excerpt: 'Trao gấu gửi yêu thương - Những câu chuyện cảm động từ khách hàng và cộng đồng.',
      featuredImage: '/images/teddy-placeholder.png',
      slug: 'cau-chuyen-am-ap',
      date: '2024-10-20',
      category: 'Câu chuyện',
    },
  ];

  const displayStories = stories || defaultStories.slice(0, limit);

  // TODO: Fetch stories từ API
  useEffect(() => {
    // Future: Fetch từ WordPress blog API
    // const fetchStories = async () => {
    //   setLoading(true);
    //   try {
    //     const response = await fetch('/api/blog/posts?featured=true&limit=3');
    //     const data = await response.json();
    //     setStories(data.posts);
    //   } catch (error) {
    //     console.error('Error fetching stories:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchStories();
  }, []);

  if (loading) {
    return (
      <section className="container-mobile py-8 md:py-16">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!displayStories || displayStories.length === 0) {
    return null; // Không hiển thị nếu không có stories
  }

  return (
    <section className="container-mobile py-8 md:py-16">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
          {title}
        </h2>
        {subtitle && (
          <p className="text-text-muted text-base md:text-lg max-w-3xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {displayStories.map((story) => (
          <StoryCard
            key={story.id}
            id={story.id}
            title={story.title}
            excerpt={story.excerpt}
            featuredImage={story.featuredImage}
            slug={story.slug}
            date={story.date}
            category={story.category}
          />
        ))}
      </div>

      {/* View More Link */}
      <div className="text-center mt-8 md:mt-12">
        <Link
          href="/blog/posts"
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
        >
          Xem thêm câu chuyện →
        </Link>
      </div>
    </section>
  );
}

