import { MetadataRoute } from 'next';
import { wcApi } from '@/lib/api/woocommerce';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog/posts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    // Check if WordPress URL is configured
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    if (!wpUrl || wpUrl.includes('localhost')) {
      // Skip dynamic sitemap generation if WordPress is not configured
      return staticPages;
    }

    // Fetch products using REST API
    const products = await wcApi.getProducts({ per_page: 100, status: 'publish' });
    // Ensure products is an array (not { data, headers })
    const productsArray = Array.isArray(products) ? products : (products as any)?.data || [];
    const productPages: MetadataRoute.Sitemap = productsArray.map((product: any) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.date_modified ? new Date(product.date_modified) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Note: Blog posts still use GraphQL, so we'll skip them for now
    // or fetch from WordPress REST API if needed

    return [...staticPages, ...productPages];
  } catch (error: any) {
    // Silently fail and return static pages only
    // This prevents build failures when WordPress is not available
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating sitemap:', error?.message || error);
    }
    return staticPages;
  }
}
