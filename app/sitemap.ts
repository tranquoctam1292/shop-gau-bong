import { MetadataRoute } from 'next';

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
    // Fetch products from CMS API
    const response = await fetch(`${baseUrl}/api/cms/products?per_page=100&status=publish`, {
      // Use absolute URL for server-side fetch
      headers: {
        'Content-Type': 'application/json',
      },
      // Disable cache for sitemap generation
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();
    const products = data.products || [];
    
    const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Note: Blog posts can be added later from CMS API if needed

    return [...staticPages, ...productPages];
  } catch (error: any) {
    // Silently fail and return static pages only
    // This prevents build failures when CMS API is not available
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating sitemap:', error?.message || error);
    }
    return staticPages;
  }
}
