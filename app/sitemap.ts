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
    // Fetch products using REST API
    const products = await wcApi.getProducts({ per_page: 100, status: 'publish' });
    const productPages: MetadataRoute.Sitemap = (products || []).map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.date_modified ? new Date(product.date_modified) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Note: Blog posts still use GraphQL, so we'll skip them for now
    // or fetch from WordPress REST API if needed

    return [...staticPages, ...productPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages only if API fails
    return staticPages;
  }
}
