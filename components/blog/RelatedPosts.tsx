'use client';

import { useRelatedPosts } from '@/lib/hooks/useRelatedPosts';
import { PostCard } from './PostCard';

interface RelatedPostsProps {
  categoryIds: string[];
  excludeId: string;
}

export function RelatedPosts({ categoryIds, excludeId }: RelatedPostsProps) {
  const { posts, loading } = useRelatedPosts(categoryIds.join(','), excludeId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-muted rounded-2xl mb-4" />
            <div className="h-4 bg-muted rounded mb-2" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold mb-6">
        Bài viết liên quan
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {posts.map((post: any) => (
          <PostCard key={post.id || post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
