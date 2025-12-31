/**
 * SEO Module Type Definitions
 *
 * Types for SEO management in the admin panel
 *
 * @see docs/plans/SEO_MODULE_PLAN.md for detailed documentation
 */

/**
 * Product SEO Fields
 *
 * SEO-specific fields for products (used in SEOMetaBox and Bulk Editor)
 * These fields are stored in product.seo in MongoDB
 */
export interface ProductSEOFields {
  focusKeyword?: string;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  canonicalUrl?: string;
  robotsMeta?: string;
  ogImage?: string;
  ogImageId?: string;
  socialDescription?: string;
  // Calculated fields (set by SEO audit)
  seoScore?: number; // 0-100
  seoIssues?: string[]; // Array of issue codes
  lastAuditAt?: Date;
}

/**
 * SEO Settings (Global)
 *
 * Global SEO settings stored in seoSettings collection
 */
export interface SEOSettings {
  _id?: string;

  // Title Templates
  titleTemplate: string; // "%title% | %sitename%"
  productTitleTemplate: string; // "Mua %title% - %price% | %sitename%"

  // Verification Codes
  googleVerification?: string;
  bingVerification?: string;

  // Default OG Image
  defaultOgImage?: string;

  // Organization Schema
  organization: {
    name: string;
    logo?: string;
    url: string;
    phone?: string;
    email?: string;
    address?: {
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      addressCountry: string;
    };
    socialProfiles?: string[];
  };

  updatedAt: Date;
  updatedBy?: string; // Admin user ID
}

/**
 * SEO Redirect
 *
 * 301/302 redirect rules stored in seoRedirects collection
 */
export interface SEORedirect {
  _id?: string;
  source: string; // "/old-product-url"
  destination: string; // "/new-product-url"
  type: 301 | 302;
  enabled: boolean;
  hitCount: number;
  lastHitAt?: Date;
  note?: string;
  createdAt: Date;
  createdBy?: string; // Admin user ID
  updatedAt: Date;
}

/**
 * SEO Audit Result
 *
 * Result of running SEO audit on a product
 */
export interface SEOAuditResult {
  score: number; // 0-100
  issues: SEOIssue[];
  passed: SEOCheck[];
}

/**
 * SEO Issue
 *
 * An issue found during SEO audit
 */
export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  code: string; // e.g., "MISSING_SEO_DESCRIPTION"
  message: string;
  field?: string;
  suggestion?: string;
}

/**
 * SEO Check
 *
 * A passed check during SEO audit
 */
export interface SEOCheck {
  code: string;
  message: string;
}

/**
 * SEO Dashboard Stats
 *
 * Overview statistics for SEO dashboard
 */
export interface SEODashboardStats {
  totalProducts: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number; // 80-100
    good: number; // 60-79
    needsWork: number; // 40-59
    poor: number; // 0-39
    notAudited: number;
  };
  commonIssues: Array<{
    issue: string;
    count: number;
  }>;
}

/**
 * Product SEO List Item
 *
 * Lightweight product data for bulk SEO editor
 */
export interface ProductSEOListItem {
  _id: string;
  id: string;
  name: string;
  slug: string;
  image?: string;
  thumbnail?: string;
  seo?: ProductSEOFields;
}

/**
 * Products SEO Response
 *
 * Response from products SEO list API
 */
export interface ProductsSEOResponse {
  products: ProductSEOListItem[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Bulk SEO Update Request
 *
 * Request body for bulk SEO update API
 */
export interface BulkSEOUpdateRequest {
  updates: Array<{
    productId: string;
    seo: Partial<ProductSEOFields>;
  }>;
}

/**
 * Bulk SEO Update Response
 *
 * Response from bulk SEO update API
 */
export interface BulkSEOUpdateResponse {
  success: boolean;
  updated: number;
  failed: number;
  errors: Array<{
    productId: string;
    error: string;
  }>;
}

/**
 * SEO Score Weights
 *
 * Weights for calculating SEO score (total: 100 points)
 */
export const SEO_WEIGHTS = {
  // Critical (40 points)
  hasTitle: 10,
  hasSeoDescription: 10,
  hasImage: 10,
  hasPrice: 10,

  // Important (35 points)
  titleLength: 8, // 50-60 chars optimal
  descriptionLength: 8, // 150-160 chars optimal
  hasFocusKeyword: 7,
  keywordInTitle: 6,
  keywordInDescription: 6,

  // Good to have (25 points)
  hasCanonical: 5,
  hasOgImage: 5,
  hasSlug: 5,
  noLongSlug: 5, // Slug < 60 chars
  hasShortDescription: 5,
} as const;

/**
 * SEO Score Thresholds
 *
 * Score interpretation thresholds
 */
export const SEO_SCORE_THRESHOLDS = {
  EXCELLENT: 90, // 90-100: Excellent (green)
  GOOD: 70, // 70-89: Good (light green)
  NEEDS_WORK: 50, // 50-69: Needs Work (yellow)
  // 0-49: Poor (red)
} as const;

/**
 * SEO Issue Codes
 *
 * Standard issue codes for SEO audit
 */
export const SEO_ISSUE_CODES = {
  // Critical
  NO_FOCUS_KEYWORD: 'NO_FOCUS_KEYWORD',
  MISSING_TITLE: 'MISSING_TITLE',
  MISSING_SEO_DESCRIPTION: 'MISSING_SEO_DESCRIPTION',
  MISSING_IMAGE: 'MISSING_IMAGE',
  MISSING_PRICE: 'MISSING_PRICE',
  NO_IMAGES: 'NO_IMAGES',
  NO_PRICE: 'NO_PRICE',

  // Important
  SHORT_TITLE: 'SHORT_TITLE',
  LONG_TITLE: 'LONG_TITLE',
  SHORT_DESCRIPTION: 'SHORT_DESCRIPTION',
  LONG_DESCRIPTION: 'LONG_DESCRIPTION',
  NO_KEYWORD_IN_TITLE: 'NO_KEYWORD_IN_TITLE',
  NO_KEYWORD_IN_DESCRIPTION: 'NO_KEYWORD_IN_DESCRIPTION',
  NO_KEYWORD_IN_SLUG: 'NO_KEYWORD_IN_SLUG',
  KEYWORD_NOT_IN_TITLE: 'KEYWORD_NOT_IN_TITLE',
  KEYWORD_NOT_IN_DESCRIPTION: 'KEYWORD_NOT_IN_DESCRIPTION',

  // Good to have
  MISSING_CANONICAL: 'MISSING_CANONICAL',
  MISSING_OG_IMAGE: 'MISSING_OG_IMAGE',
  MISSING_SLUG: 'MISSING_SLUG',
  LONG_SLUG: 'LONG_SLUG',
  MISSING_SHORT_DESCRIPTION: 'MISSING_SHORT_DESCRIPTION',

  // Content quality
  SHORT_CONTENT: 'SHORT_CONTENT',
  LOW_KEYWORD_DENSITY: 'LOW_KEYWORD_DENSITY',
  HIGH_KEYWORD_DENSITY: 'HIGH_KEYWORD_DENSITY',
  MISSING_IMAGE_ALT: 'MISSING_IMAGE_ALT',
  NO_INTERNAL_LINKS: 'NO_INTERNAL_LINKS',
} as const;

export type SEOIssueCode = typeof SEO_ISSUE_CODES[keyof typeof SEO_ISSUE_CODES];
