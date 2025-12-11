'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PostList } from '@/components/blog/PostList';
import { PostCategories } from '@/components/blog/PostCategories';
import { usePosts } from '@/lib/hooks/usePosts';

function BlogPostsContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category') || undefined;
  const tagId = searchParams.get('tag') || undefined;
  const search = searchParams.get('search') || undefined;

  const { posts, loading } = usePosts({
    categoryId,
    tagId,
    search,
  });

  return (
    <div className="min-h-screen">
      <div className="container-mobile py-6 md:py-8 border-b">
        <h1 className="font-heading text-2xl md:text-3xl mb-2">
          Blog
        </h1>
        <p className="text-text-muted">
          Tin tức, hướng dẫn và câu chuyện về gấu bông
        </p>
      </div>

      <div className="container-mobile py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="font-heading text-lg font-semibold mb-4">
                Danh mục
              </h2>
              <PostCategories />
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <PostList posts={posts} loading={loading} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default function BlogPostsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <div className="container-mobile py-6 md:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4" />
            <div className="h-4 bg-muted rounded w-96" />
          </div>
        </div>
      </div>
    }>
      <BlogPostsContent />
    </Suspense>
  );
}
