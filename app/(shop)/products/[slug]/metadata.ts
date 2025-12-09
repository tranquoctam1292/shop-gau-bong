import { Metadata } from 'next';
import { wcApi } from '@/lib/api/woocommerce';
import { getProductMetadata, generateOpenGraphTags, generateTwitterCardTags } from '@/lib/utils/metadata';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    // Fetch product by slug using REST API
    const products = await wcApi.getProducts({ slug: params.slug, per_page: 1 });
    const product = products?.[0];

    if (!product) {
      return {
        title: 'Sản phẩm không tìm thấy | Shop Gấu Bông',
        description: 'Sản phẩm bạn đang tìm không tồn tại hoặc đã bị xóa.',
      };
    }

    const metadata = getProductMetadata({
      name: product.name || 'Sản phẩm',
      description: product.short_description || product.description || null,
      image: product.images?.[0]?.src || null,
      price: product.price || null,
      slug: product.slug || params.slug,
    });

    const ogTags = generateOpenGraphTags(metadata);
    const twitterTags = generateTwitterCardTags(metadata);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com';

    return {
      title: metadata.title,
      description: metadata.description,
      openGraph: {
        title: ogTags['og:title'] || metadata.title,
        description: ogTags['og:description'] || metadata.description,
        images: [{ url: ogTags['og:image'] || metadata.image || '' }],
        url: ogTags['og:url'] || siteUrl,
        type: (ogTags['og:type'] as 'website' | 'product') || 'website',
        siteName: ogTags['og:site_name'] || 'Shop Gấu Bông',
        locale: ogTags['og:locale'] || 'vi_VN',
      } as any,
      twitter: twitterTags,
      alternates: {
        canonical: metadata.url ? `${siteUrl}${metadata.url}` : undefined,
      },
    };
  } catch (error) {
    console.error('Error generating product metadata:', error);
    return {
      title: 'Sản phẩm | Shop Gấu Bông',
      description: 'Khám phá bộ sưu tập gấu bông đáng yêu của chúng tôi',
    };
  }
}
