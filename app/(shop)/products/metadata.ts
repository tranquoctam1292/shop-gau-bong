import { Metadata } from 'next';
import { getDefaultMetadata, generateOpenGraphTags, generateTwitterCardTags } from '@/lib/utils/metadata';

export const metadata: Metadata = {
  title: 'Tất cả sản phẩm | Shop Gấu Bông',
  description: 'Khám phá bộ sưu tập gấu bông đáng yêu, chất lượng cao với giá cả hợp lý. Giao hàng nhanh toàn quốc.',
  openGraph: {
    ...generateOpenGraphTags({
      ...getDefaultMetadata(),
      title: 'Tất cả sản phẩm | Shop Gấu Bông',
      description: 'Khám phá bộ sưu tập gấu bông đáng yêu, chất lượng cao với giá cả hợp lý.',
      url: '/products',
    }),
    type: 'website',
  },
  twitter: generateTwitterCardTags({
    ...getDefaultMetadata(),
    title: 'Tất cả sản phẩm | Shop Gấu Bông',
    description: 'Khám phá bộ sưu tập gấu bông đáng yêu, chất lượng cao với giá cả hợp lý.',
  }),
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com'}/products`,
  },
};

