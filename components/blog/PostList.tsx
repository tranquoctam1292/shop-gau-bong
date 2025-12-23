'use client';

import { PostCard } from './PostCard';
import { EmptyState } from '@/components/ui/empty-state';

interface PostListProps {
  posts: any[];
  loading?: boolean;
}

export function PostList({ posts, loading }: PostListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-muted rounded-2xl mb-4" />
            <div className="h-4 bg-muted rounded mb-2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        title="Không có bài viết"
        description="Blog feature is temporarily disabled. Please check back later."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post: any) => (
        <PostCard key={post.id || post.slug} post={post} />
      ))}
    </div>
  );
}
