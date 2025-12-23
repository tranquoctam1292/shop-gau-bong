'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { usePost } from '@/lib/hooks/usePost';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/lib/utils/button-variants';
import Link from 'next/link';

interface PostPageProps {
  params: {
    slug: string;
  };
}

export default function PostPageClient({ params }: PostPageProps) {
  const { post, loading, error } = usePost(params.slug);

  if (loading) {
    return (
      <div className="container-mobile py-8 md:py-16">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    notFound();
  }

  // Blog feature is temporarily disabled - show placeholder message
  return (
    <div className="container-mobile py-8 md:py-16">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 md:p-8 text-center">
          <h1 className="font-heading text-3xl md:text-4xl mb-4">
            Blog Feature Temporarily Disabled
          </h1>
          <p className="text-text-muted mb-6">
            Blog feature is currently being migrated to REST API. Please check back later.
          </p>
          <Link 
            href="/products" 
            className={buttonVariants()}
          >
            Xem sản phẩm
          </Link>
        </Card>
      </div>
    </div>
  );
}
