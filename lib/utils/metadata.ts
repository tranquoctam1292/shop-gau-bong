/**
 * Metadata utilities for SEO
 * Generate dynamic meta tags for pages
 */

export interface PageMetadata {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

/**
 * Generate default metadata for the site
 */
export function getDefaultMetadata(): PageMetadata {
  return {
    title: 'Shop Gấu Bông - Gấu bông đáng yêu cho mọi lứa tuổi',
    description: 'Khám phá bộ sưu tập gấu bông đáng yêu, chất lượng cao với giá cả hợp lý. Giao hàng nhanh toàn quốc.',
    image: '/images/og-default.jpg',
    type: 'website',
  };
}

/**
 * Generate product metadata
 */
export function getProductMetadata(product: {
  name: string;
  description?: string | null;
  image?: { sourceUrl?: string | null } | null;
  price?: string | null;
  slug?: string | null;
}): PageMetadata {
  const title = `${product.name} | Shop Gấu Bông`;
  const description = product.description
    ? product.description.replace(/<[^>]*>/g, '').substring(0, 160)
    : `Mua ${product.name} tại Shop Gấu Bông. Gấu bông đáng yêu, chất lượng cao với giá cả hợp lý.`;
  const image = product.image?.sourceUrl || '/images/teddy-placeholder.png';
  const url = product.slug ? `/products/${product.slug}` : undefined;

  return {
    title,
    description,
    image,
    url,
    type: 'product',
  };
}

/**
 * Generate blog post metadata
 */
export function getPostMetadata(post: {
  title: string;
  excerpt?: string | null;
  featuredImage?: { node?: { sourceUrl?: string | null } | null } | null;
  slug?: string | null;
}): PageMetadata {
  const title = `${post.title} | Blog Shop Gấu Bông`;
  const description = post.excerpt
    ? post.excerpt.replace(/<[^>]*>/g, '').substring(0, 160)
    : `Đọc bài viết ${post.title} trên Blog Shop Gấu Bông.`;
  const image =
    post.featuredImage?.node?.sourceUrl || '/images/teddy-placeholder.png';
  const url = post.slug ? `/blog/posts/${post.slug}` : undefined;

  return {
    title,
    description,
    image,
    url,
    type: 'article',
  };
}

/**
 * Generate Open Graph tags
 */
export function generateOpenGraphTags(metadata: PageMetadata) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com';
  const fullImageUrl = metadata.image?.startsWith('http')
    ? metadata.image
    : `${siteUrl}${metadata.image || '/images/og-default.jpg'}`;
  const fullUrl = metadata.url
    ? `${siteUrl}${metadata.url}`
    : siteUrl;

  return {
    'og:title': metadata.title,
    'og:description': metadata.description,
    'og:image': fullImageUrl,
    'og:url': fullUrl,
    'og:type': metadata.type || 'website',
    'og:site_name': 'Shop Gấu Bông',
    'og:locale': 'vi_VN',
  };
}

/**
 * Generate Twitter Card tags
 * Returns format compatible with Next.js Metadata Twitter type
 */
export function generateTwitterCardTags(metadata: PageMetadata) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com';
  const fullImageUrl = metadata.image?.startsWith('http')
    ? metadata.image
    : `${siteUrl}${metadata.image || '/images/og-default.jpg'}`;

  return {
    card: 'summary_large_image' as const,
    title: metadata.title,
    description: metadata.description,
    images: [fullImageUrl],
  };
}

