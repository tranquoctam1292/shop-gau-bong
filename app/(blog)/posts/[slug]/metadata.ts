import { Metadata } from 'next';
// Note: Blog posts still use GraphQL. This is optional and doesn't affect e-commerce.
// TODO: Migrate to WordPress REST API if needed
import { getPostMetadata, generateOpenGraphTags, generateTwitterCardTags } from '@/lib/utils/metadata';

interface PostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  // For now, return default metadata since blog uses GraphQL
  // This prevents build errors while blog migration is optional
  try {
    // TODO: Fetch post from WordPress REST API when migrating blog
    // const post = await fetchPostBySlug(params.slug);
    
    const metadata = getPostMetadata({
      title: 'Bài viết',
      excerpt: 'Đọc bài viết mới nhất từ Shop Gấu Bông',
      slug: params.slug,
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
        type: (ogTags['og:type'] as 'website' | 'article') || 'article',
        siteName: ogTags['og:site_name'] || 'Shop Gấu Bông',
        locale: ogTags['og:locale'] || 'vi_VN',
      } as any,
      twitter: twitterTags,
      alternates: {
        canonical: metadata.url ? `${siteUrl}${metadata.url}` : undefined,
      },
    };
  } catch (error) {
    console.error('Error generating post metadata:', error);
    return {
      title: 'Bài viết | Shop Gấu Bông',
      description: 'Đọc bài viết mới nhất từ Shop Gấu Bông',
    };
  }
}
