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
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
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

  // Dynamic pages arrays
  let productPages: MetadataRoute.Sitemap = [];
  let categoryPages: MetadataRoute.Sitemap = [];
  let postPages: MetadataRoute.Sitemap = [];

  try {
    // Fetch products, categories, and posts in parallel
    const [productsRes, categoriesRes, postsRes] = await Promise.all([
      fetch(`${baseUrl}/api/cms/products?per_page=500&status=publish`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/cms/categories?per_page=100`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/api/cms/posts?per_page=200&status=publish`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
    ]);

    // Process products
    if (productsRes.ok) {
      const productsData = await productsRes.json();
      const products = productsData.products || [];

      productPages = products.map((product: { slug: string; updatedAt?: string }) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }

    // Process categories
    if (categoriesRes.ok) {
      const categoriesData = await categoriesRes.json();
      const categories = categoriesData.categories || categoriesData || [];

      categoryPages = categories
        .filter((cat: { slug?: string }) => cat.slug)
        .map((category: { slug: string; updatedAt?: string }) => ({
          url: `${baseUrl}/collections/${category.slug}`,
          lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.75,
        }));
    }

    // Process blog posts
    if (postsRes.ok) {
      const postsData = await postsRes.json();
      const posts = postsData.posts || postsData || [];

      postPages = posts
        .filter((post: { slug?: string }) => post.slug)
        .map((post: { slug: string; updatedAt?: string; publishedAt?: string }) => ({
          url: `${baseUrl}/posts/${post.slug}`,
          lastModified: post.updatedAt
            ? new Date(post.updatedAt)
            : post.publishedAt
            ? new Date(post.publishedAt)
            : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }));
    }
  } catch (error) {
    // Silently fail and return static pages only
    // This prevents build failures when CMS API is not available
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating sitemap:', error);
    }
  }

  return [...staticPages, ...productPages, ...categoryPages, ...postPages];
}
