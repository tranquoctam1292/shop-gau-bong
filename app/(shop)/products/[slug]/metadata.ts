import { Metadata } from 'next';
import { getProductMetadata, generateOpenGraphTags, generateTwitterCardTags } from '@/lib/utils/metadata';
import { SITE_CONFIG } from '@/lib/constants/config';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    // Fetch product by slug using CMS API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com';
    const response = await fetch(`${baseUrl}/api/cms/products/${encodeURIComponent(params.slug)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Product not found');
    }

    const data = await response.json();
    const product = data.product;

    if (!product) {
      return {
        title: `Sản phẩm không tìm thấy | ${SITE_CONFIG.name}`,
        description: 'Sản phẩm bạn đang tìm không tồn tại hoặc đã bị xóa.',
      };
    }

    const metadata = getProductMetadata({
      name: product.name || 'Sản phẩm',
      description: product.shortDescription || product.description || null,
      image: product.image?.sourceUrl || product.images?.[0] || null,
      price: product.price || null,
      slug: product.slug || params.slug,
    });

    const ogTags = generateOpenGraphTags(metadata);
    const twitterTags = generateTwitterCardTags(metadata);

    return {
      title: metadata.title,
      description: metadata.description,
      openGraph: {
        title: ogTags['og:title'] || metadata.title,
        description: ogTags['og:description'] || metadata.description,
        images: [{ url: ogTags['og:image'] || metadata.image || '' }],
        url: ogTags['og:url'] || SITE_CONFIG.url,
        type: (ogTags['og:type'] as 'website' | 'product') || 'website',
        siteName: ogTags['og:site_name'] || SITE_CONFIG.name,
        locale: ogTags['og:locale'] || 'vi_VN',
      } as any,
      twitter: twitterTags,
      alternates: {
        canonical: metadata.url ? `${SITE_CONFIG.url}${metadata.url}` : undefined,
      },
    };
  } catch (error) {
    console.error('Error generating product metadata:', error);
    return {
      title: `Sản phẩm | ${SITE_CONFIG.name}`,
      description: SITE_CONFIG.description,
    };
  }
}
