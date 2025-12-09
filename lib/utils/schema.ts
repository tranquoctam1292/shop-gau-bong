/**
 * Structured Data (Schema.org) utilities
 * Generate JSON-LD structured data for SEO
 */

export interface ProductSchema {
  name: string;
  description?: string | null;
  image?: string | null;
  price?: string | null;
  currency?: string;
  sku?: string | null;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  brand?: string;
  category?: string;
  url?: string;
}

export interface OrganizationSchema {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone?: string;
    contactType?: string;
    email?: string;
  };
  sameAs?: string[];
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generate Product Schema (JSON-LD)
 */
export function generateProductSchema(product: ProductSchema): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: product.image ? [product.image] : undefined,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Shop Gấu Bông',
    },
    category: product.category || 'Gấu bông',
    url: product.url,
  };

  // Add offers if price is available
  if (product.price) {
    schema.offers = {
      '@type': 'Offer',
      price: product.price.replace(/[^\d]/g, ''), // Remove currency symbols
      priceCurrency: product.currency || 'VND',
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      url: product.url,
    };
  }

  return schema;
}

/**
 * Generate Organization Schema (JSON-LD)
 */
export function generateOrganizationSchema(org: OrganizationSchema): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: org.url,
    description: org.description,
    logo: org.logo,
  };

  if (org.contactPoint) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      telephone: org.contactPoint.telephone,
      contactType: org.contactPoint.contactType || 'Customer Service',
      email: org.contactPoint.email,
    };
  }

  if (org.sameAs && org.sameAs.length > 0) {
    schema.sameAs = org.sameAs;
  }

  return schema;
}

/**
 * Generate Breadcrumb Schema (JSON-LD)
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate WebSite Schema with SearchAction
 */
export function generateWebSiteSchema(siteUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Shop Gấu Bông',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

