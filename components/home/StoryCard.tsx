'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface StoryCardProps {
  id: string;
  title: string;
  excerpt: string;
  featuredImage?: string;
  slug: string;
  date?: string;
  category?: string;
  className?: string;
}

/**
 * Story Card Component
 * 
 * Individual story card cho Stories Section
 * Hiển thị featured image, title, excerpt, và link
 */
export function StoryCard({
  title,
  excerpt,
  featuredImage,
  slug,
  date,
  category,
  className,
}: StoryCardProps) {
  const imageUrl = featuredImage || '/images/story-placeholder.jpg';

  return (
    <Card className={cn('group overflow-hidden transition-shadow hover:shadow-lg', className)}>
      <Link href={`/blog/posts/${slug}`}>
        {/* Featured Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-3">
          {/* Category & Date */}
          {(category || date) && (
            <div className="flex items-center gap-3 text-xs md:text-sm text-text-muted">
              {category && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {category}
                </span>
              )}
              {date && <span>{date}</span>}
            </div>
          )}

          {/* Title */}
          <h3 className="font-heading text-lg md:text-xl font-semibold text-text-main line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm md:text-base text-text-muted line-clamp-3">
            {excerpt}
          </p>

          {/* Read More Link */}
          <div className="pt-2">
            <span className="text-sm text-primary font-medium group-hover:underline">
              Xem thêm →
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}

