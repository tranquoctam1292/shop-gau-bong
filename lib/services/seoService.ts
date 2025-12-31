/**
 * SEO Service
 *
 * Business logic layer for SEO module
 * Coordinates between repository and utility functions
 *
 * @see docs/plans/SEO_MODULE_PLAN.md
 */

import {
  getSEOSettings,
  upsertSEOSettings,
  getRedirects,
  getEnabledRedirects,
  getRedirectById,
  getRedirectBySource,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  incrementRedirectHit,
  getProductsSEO,
  bulkUpdateProductsSEO,
  updateProductSEO,
  getSEODashboardStats,
} from '@/lib/repositories/seoRepository';
import { runSEOAudit, getIssueCodes } from '@/lib/utils/seoAudit';
import { getCollections } from '@/lib/db';
import { ObjectId } from 'mongodb';
import type {
  SEOSettings,
  SEORedirect,
  SEODashboardStats,
  ProductSEOListItem,
  ProductSEOFields,
  BulkSEOUpdateResponse,
  SEOAuditResult,
} from '@/types/seo';

// ============================================
// Redirect Cache (Edge-compatible)
// ============================================

interface RedirectCache {
  data: Map<string, { destination: string; type: 301 | 302 }>;
  lastUpdated: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

let redirectCache: RedirectCache = {
  data: new Map(),
  lastUpdated: 0,
};

/**
 * Get cached redirects or fetch from database
 */
async function getCachedRedirects(): Promise<Map<string, { destination: string; type: 301 | 302 }>> {
  const now = Date.now();

  // Return cached data if still valid
  if (redirectCache.data.size > 0 && now - redirectCache.lastUpdated < CACHE_TTL) {
    return redirectCache.data;
  }

  // Fetch fresh data
  const redirects = await getEnabledRedirects();
  const newCache = new Map<string, { destination: string; type: 301 | 302 }>();

  for (const redirect of redirects) {
    newCache.set(redirect.source, {
      destination: redirect.destination,
      type: redirect.type,
    });
  }

  redirectCache = {
    data: newCache,
    lastUpdated: now,
  };

  return newCache;
}

/**
 * Invalidate redirect cache (call after CRUD operations)
 */
export function invalidateRedirectCache(): void {
  redirectCache = {
    data: new Map(),
    lastUpdated: 0,
  };
}

// ============================================
// SEO Settings Service
// ============================================

/**
 * Get global SEO settings
 */
export async function getGlobalSEOSettings(): Promise<SEOSettings | null> {
  return getSEOSettings();
}

/**
 * Update global SEO settings
 */
export async function updateGlobalSEOSettings(
  settings: Partial<SEOSettings>,
  updatedBy?: string
): Promise<SEOSettings> {
  return upsertSEOSettings(settings, updatedBy);
}

// ============================================
// Redirect Service
// ============================================

/**
 * Find redirect for a given path (uses cache)
 */
export async function findRedirectForPath(
  path: string
): Promise<{ destination: string; type: 301 | 302 } | null> {
  const cache = await getCachedRedirects();
  const redirect = cache.get(path);

  if (redirect) {
    // Increment hit count asynchronously (don't block response)
    incrementRedirectHit(path).catch(() => {
      // Silently ignore errors
    });
    return redirect;
  }

  return null;
}

/**
 * Get paginated list of redirects
 */
export async function listRedirects(options: {
  page?: number;
  perPage?: number;
  enabled?: boolean;
  search?: string;
}): Promise<{ redirects: SEORedirect[]; total: number; page: number; perPage: number }> {
  const { redirects, total } = await getRedirects(options);
  return {
    redirects,
    total,
    page: options.page || 1,
    perPage: options.perPage || 20,
  };
}

/**
 * Get single redirect by ID
 */
export async function getRedirect(id: string): Promise<SEORedirect | null> {
  return getRedirectById(id);
}

/**
 * Create new redirect
 */
export async function addRedirect(
  data: {
    source: string;
    destination: string;
    type?: 301 | 302;
    enabled?: boolean;
    note?: string;
  },
  createdBy?: string
): Promise<SEORedirect> {
  // Normalize source path
  const source = data.source.startsWith('/') ? data.source : `/${data.source}`;
  const destination = data.destination.startsWith('/') ? data.destination : `/${data.destination}`;

  const redirect = await createRedirect(
    {
      source,
      destination,
      type: data.type || 301,
      enabled: data.enabled !== false,
      note: data.note,
    },
    createdBy
  );

  // Invalidate cache
  invalidateRedirectCache();

  return redirect;
}

/**
 * Update existing redirect
 */
export async function modifyRedirect(
  id: string,
  data: Partial<SEORedirect>
): Promise<SEORedirect | null> {
  const result = await updateRedirect(id, data);

  if (result) {
    // Invalidate cache
    invalidateRedirectCache();
  }

  return result;
}

/**
 * Delete redirect
 */
export async function removeRedirect(id: string): Promise<boolean> {
  const result = await deleteRedirect(id);

  if (result) {
    // Invalidate cache
    invalidateRedirectCache();
  }

  return result;
}

/**
 * Bulk import redirects from CSV data
 */
export async function bulkImportRedirects(
  redirects: Array<{
    source: string;
    destination: string;
    type?: 301 | 302;
  }>,
  createdBy?: string
): Promise<{ imported: number; failed: number; errors: string[] }> {
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const data of redirects) {
    try {
      await addRedirect(data, createdBy);
      imported++;
    } catch (error) {
      failed++;
      errors.push(
        `${data.source}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return { imported, failed, errors };
}

// ============================================
// Products SEO Service
// ============================================

/**
 * Get products with SEO data for bulk editor
 */
export async function listProductsSEO(options: {
  page?: number;
  perPage?: number;
  search?: string;
  scoreMin?: number;
  scoreMax?: number;
  hasIssues?: boolean;
  sortBy?: 'score' | 'name' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  products: ProductSEOListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}> {
  const { products, total } = await getProductsSEO(options);
  const page = options.page || 1;
  const perPage = options.perPage || 20;

  return {
    products,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

/**
 * Run SEO audit on a single product
 */
export async function auditProduct(productId: string): Promise<SEOAuditResult | null> {
  const { products: productsCollection } = await getCollections();

  if (!ObjectId.isValid(productId)) return null;

  const product = await productsCollection.findOne(
    { _id: new ObjectId(productId) },
    {
      projection: {
        name: 1,
        slug: 1,
        description: 1,
        shortDescription: 1,
        minPrice: 1,
        images: 1,
        seo: 1,
      },
    }
  );

  if (!product) return null;

  const auditResult = runSEOAudit({
    name: product.name || '',
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.minPrice,
    images: product.images,
    seo: product.seo,
  });

  // Update product with audit results
  await updateProductSEO(productId, {
    seoScore: auditResult.score,
    seoIssues: getIssueCodes(auditResult),
    lastAuditAt: new Date(),
  });

  return auditResult;
}

/**
 * Run SEO audit on all products
 */
export async function auditAllProducts(options?: {
  batchSize?: number;
  onProgress?: (processed: number, total: number) => void;
}): Promise<{ processed: number; averageScore: number }> {
  const { products: productsCollection } = await getCollections();
  const batchSize = options?.batchSize || 50;

  const filter = {
    status: { $ne: 'trash' },
    deletedAt: null,
  };

  const total = await productsCollection.countDocuments(filter);
  let processed = 0;
  let totalScore = 0;

  const cursor = productsCollection.find(filter, {
    projection: {
      name: 1,
      slug: 1,
      description: 1,
      shortDescription: 1,
      minPrice: 1,
      images: 1,
      seo: 1,
    },
  });

  const batch: Array<{ productId: string; seo: Partial<ProductSEOFields> }> = [];

  for await (const product of cursor) {
    const auditResult = runSEOAudit({
      name: product.name || '',
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.minPrice,
      images: product.images,
      seo: product.seo,
    });

    batch.push({
      productId: product._id.toString(),
      seo: {
        seoScore: auditResult.score,
        seoIssues: getIssueCodes(auditResult),
        lastAuditAt: new Date(),
      },
    });

    totalScore += auditResult.score;
    processed++;

    // Process batch
    if (batch.length >= batchSize) {
      await bulkUpdateProductsSEO(batch);
      batch.length = 0;

      if (options?.onProgress) {
        options.onProgress(processed, total);
      }
    }
  }

  // Process remaining batch
  if (batch.length > 0) {
    await bulkUpdateProductsSEO(batch);
  }

  return {
    processed,
    averageScore: processed > 0 ? Math.round(totalScore / processed) : 0,
  };
}

/**
 * Bulk update products SEO
 */
export async function bulkUpdateSEO(
  updates: Array<{ productId: string; seo: Partial<ProductSEOFields> }>,
  runAudit = true
): Promise<BulkSEOUpdateResponse> {
  // If runAudit is true, calculate SEO score for each update
  if (runAudit) {
    const { products: productsCollection } = await getCollections();

    for (const update of updates) {
      if (!ObjectId.isValid(update.productId)) continue;

      const product = await productsCollection.findOne(
        { _id: new ObjectId(update.productId) },
        {
          projection: {
            name: 1,
            slug: 1,
            description: 1,
            shortDescription: 1,
            minPrice: 1,
            images: 1,
            seo: 1,
          },
        }
      );

      if (product) {
        // Merge existing SEO with updates
        const mergedSEO = { ...product.seo, ...update.seo };

        const auditResult = runSEOAudit({
          name: product.name || '',
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          price: product.minPrice,
          images: product.images,
          seo: mergedSEO,
        });

        // Add audit results to update
        update.seo.seoScore = auditResult.score;
        update.seo.seoIssues = getIssueCodes(auditResult);
        update.seo.lastAuditAt = new Date();
      }
    }
  }

  const result = await bulkUpdateProductsSEO(updates);

  return {
    success: result.failed === 0,
    updated: result.updated,
    failed: result.failed,
    errors: result.errors,
  };
}

// ============================================
// Dashboard Service
// ============================================

/**
 * Get SEO dashboard statistics
 */
export async function getDashboardStats(): Promise<SEODashboardStats> {
  return getSEODashboardStats();
}
