'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PostCardProps {
  post: {
    id: string;
    databaseId?: number | null;
    title?: string | null;
    slug?: string | null;
    excerpt?: string | null;
    date?: string | null;
    featuredImage?: {
      node?: {
        sourceUrl?: string | null;
        altText?: string | null;
      } | null;
    } | null;
    author?: {
      node?: {
        name?: string | null;
      } | null;
    } | null;
    categories?: {
      nodes?: Array<{
        id: string;
        name?: string | null;
        slug?: string | null;
      }> | null;
    } | null;
  };
}

export function PostCard({ post }: PostCardProps) {
  const imageUrl = post.featuredImage?.node?.sourceUrl || '/images/teddy-placeholder.png';
  const imageAlt = post.featuredImage?.node?.altText || post.title || 'Blog post';
  const postDate = post.date ? new Date(post.date) : null;
  const formattedDate = postDate
    ? format(postDate, 'dd MMMM yyyy', { locale: vi })
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/blog/posts/${post.slug}`}>
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-4 md:p-6">
          {post.categories?.nodes && post.categories.nodes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {post.categories.nodes.slice(0, 2).map((category) => (
                <span
                  key={category.id}
                  className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}
          <h3 className="font-heading text-lg md:text-xl font-semibold mb-2 line-clamp-2">
            {post.title || 'Không có tiêu đề'}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-text-muted mb-4 line-clamp-3">
              {post.excerpt.replace(/<[^>]*>/g, '')}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-text-muted">
            {post.author?.node?.name && (
              <span>Tác giả: {post.author.node.name}</span>
            )}
            {formattedDate && <span>{formattedDate}</span>}
          </div>
        </div>
      </Link>
    </Card>
  );
}

