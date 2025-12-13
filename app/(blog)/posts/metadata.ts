import { Metadata } from 'next';
import { getDefaultMetadata, generateOpenGraphTags, generateTwitterCardTags } from '@/lib/utils/metadata';
import { SITE_CONFIG } from '@/lib/constants/config';

export const metadata: Metadata = {
  title: `Blog | ${SITE_CONFIG.name}`,
  description: `Đọc các bài viết về gấu bông, tin tức và cập nhật từ ${SITE_CONFIG.name}.`,
  openGraph: {
    ...generateOpenGraphTags({
      ...getDefaultMetadata(),
      title: `Blog | ${SITE_CONFIG.name}`,
      description: `Đọc các bài viết về gấu bông, tin tức và cập nhật từ ${SITE_CONFIG.name}.`,
      url: '/blog/posts',
    }),
    type: 'website',
  },
  twitter: generateTwitterCardTags({
    ...getDefaultMetadata(),
    title: `Blog | ${SITE_CONFIG.name}`,
    description: `Đọc các bài viết về gấu bông, tin tức và cập nhật từ ${SITE_CONFIG.name}.`,
  }),
  alternates: {
    canonical: `${SITE_CONFIG.url}/blog/posts`,
  },
};

