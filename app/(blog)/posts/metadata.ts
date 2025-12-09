import { Metadata } from 'next';
import { getDefaultMetadata, generateOpenGraphTags, generateTwitterCardTags } from '@/lib/utils/metadata';

export const metadata: Metadata = {
  title: 'Blog | Shop Gấu Bông',
  description: 'Đọc các bài viết về gấu bông, tin tức và cập nhật từ Shop Gấu Bông.',
  openGraph: {
    ...generateOpenGraphTags({
      ...getDefaultMetadata(),
      title: 'Blog | Shop Gấu Bông',
      description: 'Đọc các bài viết về gấu bông, tin tức và cập nhật từ Shop Gấu Bông.',
      url: '/blog/posts',
    }),
    type: 'website',
  },
  twitter: generateTwitterCardTags({
    ...getDefaultMetadata(),
    title: 'Blog | Shop Gấu Bông',
    description: 'Đọc các bài viết về gấu bông, tin tức và cập nhật từ Shop Gấu Bông.',
  }),
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com'}/blog/posts`,
  },
};

