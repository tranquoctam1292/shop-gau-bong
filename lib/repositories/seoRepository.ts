/**
 * SEO Repository
 * Data access layer cho SEO module
 *
 * @see docs/plans/SEO_MODULE_PLAN.md
 */

import { ObjectId, type Collection, type WithId, type Document } from 'mongodb';
import { getCollections } from '@/lib/db';
import type {
  SEOSettings,
  SEORedirect,
  SEODashboardStats,
  ProductSEOListItem,
  ProductSEOFields,
} from '@/types/seo';

// ============================================
// Helper Functions
// ============================================

/**
 * Map MongoDB SEO Settings document to SEOSettings type
 */
function mapSEOSettings(doc: WithId<Document>): SEOSettings {
  return {
    _id: doc._id.toString(),
    titleTemplate: doc.titleTemplate || '%title% | %sitename%',
    productTitleTemplate: doc.productTitleTemplate || 'Mua %title% - %price% | %sitename%',
    googleVerification: doc.googleVerification,
    bingVerification: doc.bingVerification,
    defaultOgImage: doc.defaultOgImage,
    organization: doc.organization || {
      name: 'Shop Gấu Bông',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com',
    },
    updatedAt: doc.updatedAt || new Date(),
    updatedBy: doc.updatedBy?.toString(),
  };
}

/**
 * Map MongoDB SEO Redirect document to SEORedirect type
 */
function mapSEORedirect(doc: WithId<Document>): SEORedirect {
  return {
    _id: doc._id.toString(),
    source: doc.source || '',
    destination: doc.destination || '',
    type: doc.type === 302 ? 302 : 301,
    enabled: doc.enabled !== false,
    hitCount: doc.hitCount || 0,
    lastHitAt: doc.lastHitAt,
    note: doc.note,
    createdAt: doc.createdAt || new Date(),
    createdBy: doc.createdBy?.toString(),
    updatedAt: doc.updatedAt || new Date(),
  };
}

/**
 * Map product document to ProductSEOListItem
 */
function mapProductToSEOItem(doc: WithId<Document>): ProductSEOListItem {
  return {
    _id: doc._id.toString(),
    id: doc._id.toString(),
    name: doc.name || 'Untitled',
    slug: doc.slug || '',
    image: doc.images?.[0] || undefined,
    thumbnail: doc.images?.[0] || undefined,
    seo: {
      focusKeyword: doc.seo?.focusKeyword,
      seoTitle: doc.seo?.seoTitle,
      seoDescription: doc.seo?.seoDescription,
      slug: doc.seo?.slug || doc.slug,
      canonicalUrl: doc.seo?.canonicalUrl,
      robotsMeta: doc.seo?.robotsMeta,
      ogImage: doc.seo?.ogImage,
      ogImageId: doc.seo?.ogImageId,
      socialDescription: doc.seo?.socialDescription,
      seoScore: doc.seo?.seoScore,
      seoIssues: doc.seo?.seoIssues,
      lastAuditAt: doc.seo?.lastAuditAt,
    },
  };
}

// ============================================
// SEO Settings Repository Functions
// ============================================

/**
 * Get global SEO settings
 * Returns the first document in seoSettings collection (singleton pattern)
 */
export async function getSEOSettings(): Promise<SEOSettings | null> {
  const { db } = await getCollections();
  const collection = db.collection('seoSettings');

  const doc = await collection.findOne({});
  if (!doc) return null;

  return mapSEOSettings(doc);
}

/**
 * Create or update global SEO settings
 */
export async function upsertSEOSettings(
  settings: Partial<SEOSettings>,
  updatedBy?: string
): Promise<SEOSettings> {
  const { db } = await getCollections();
  const collection = db.collection('seoSettings');

  const now = new Date();
  const updateData = {
    ...settings,
    updatedAt: now,
    ...(updatedBy ? { updatedBy: new ObjectId(updatedBy) } : {}),
  };

  // Remove _id from update data
  delete updateData._id;

  const result = await collection.findOneAndUpdate(
    {}, // Match any document (singleton)
    {
      $set: updateData,
      $setOnInsert: { createdAt: now },
    },
    {
      upsert: true,
      returnDocument: 'after',
    }
  );

  if (!result) {
    throw new Error('Failed to upsert SEO settings');
  }

  return mapSEOSettings(result);
}

// ============================================
// SEO Redirects Repository Functions
// ============================================

/**
 * Get all redirects with pagination
 */
export async function getRedirects(options: {
  page?: number;
  perPage?: number;
  enabled?: boolean;
  search?: string;
}): Promise<{ redirects: SEORedirect[]; total: number }> {
  const { db } = await getCollections();
  const collection = db.collection('seoRedirects');

  const page = options.page || 1;
  const perPage = options.perPage || 20;
  const skip = (page - 1) * perPage;

  // Build filter
  const filter: Record<string, unknown> = {};
  if (typeof options.enabled === 'boolean') {
    filter.enabled = options.enabled;
  }
  if (options.search) {
    filter.$or = [
      { source: { $regex: options.search, $options: 'i' } },
      { destination: { $regex: options.search, $options: 'i' } },
      { note: { $regex: options.search, $options: 'i' } },
    ];
  }

  const [redirects, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    redirects: redirects.map(mapSEORedirect),
    total,
  };
}

/**
 * Get all enabled redirects (for middleware cache)
 */
export async function getEnabledRedirects(): Promise<SEORedirect[]> {
  const { db } = await getCollections();
  const collection = db.collection('seoRedirects');

  const redirects = await collection
    .find({ enabled: true })
    .project({ source: 1, destination: 1, type: 1 })
    .toArray();

  return redirects.map((doc) => mapSEORedirect(doc as WithId<Document>));
}

/**
 * Get redirect by ID
 */
export async function getRedirectById(id: string): Promise<SEORedirect | null> {
  const { db } = await getCollections();
  const collection = db.collection('seoRedirects');

  if (!ObjectId.isValid(id)) return null;

  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  return mapSEORedirect(doc);
}

/**
 * Get redirect by source path
 */
export async function getRedirectBySource(source: string): Promise<SEORedirect | null> {
  const { db } = await getCollections();
  const collection = db.collection('seoRedirects');

  const doc = await collection.findOne({ source, enabled: true });
  if (!doc) return null;

  return mapSEORedirect(doc);
}

/**
 * Create new redirect
 */
export async function createRedirect(
  data: Omit<SEORedirect, '_id' | 'hitCount' | 'createdAt' | 'updatedAt'>,
  createdBy?: string
): Promise<SEORedirect> {
  const { db } = await getCollections();
  const collection = db.collection('seoRedirects');

  const now = new Date();

  // Check for duplicate source
  const existing = await collection.findOne({ source: data.source });
  if (existing) {
    throw new Error(`Redirect already exists for source: ${data.source}`);
  }

  // Detect redirect loops
  const loopCheck = await collection.findOne({ source: data.destination });
  if (loopCheck) {
    throw new Error(`Redirect loop detected: ${data.destination} -> ${loopCheck.destination}`);
  }

  const insertData = {
    ...data,
    hitCount: 0,
    createdAt: now,
    updatedAt: now,
    ...(createdBy ? { createdBy: new ObjectId(createdBy) } : {}),
  };

  const result = await collection.insertOne(insertData);

  return {
    _id: result.insertedId.toString(),
    ...data,
    hitCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}

/**
 * Update redirect
 */
export async function updateRedirect(
  id: string,
  data: Partial<SEORedirect>
): Promise<SEORedirect | null> {
  const { db } = await getCollections();
  const collection = db.collection('seoRedirects');

  if (!ObjectId.isValid(id)) return null;

  const now = new Date();
  const updateData = { ...data, updatedAt: now };

  // Remove fields that shouldn't be updated
  delete updateData._id;
  delete updateData.createdAt;
  delete updateData.createdBy;

  // If source is being updated, check for duplicates
  if (data.source) {
    const existing = await collection.findOne({
      source: data.source,
      _id: { $ne: new ObjectId(id) },
    });
    if (existing) {
      throw new Error(`Redirect already exists for source: ${data.source}`);
    }
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  if (!result) return null;

  return mapSEORedirect(result);
}

/**
 * Delete redirect
 */
export async function deleteRedirect(id: string): Promise<boolean> {
  const { db } = await getCollections();
  const collection = db.collection('seoRedirects');

  if (!ObjectId.isValid(id)) return false;

  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

/**
 * Increment redirect hit count
 */
export async function incrementRedirectHit(source: string): Promise<void> {
  const { db } = await getCollections();
  const collection = db.collection('seoRedirects');

  await collection.updateOne(
    { source },
    {
      $inc: { hitCount: 1 },
      $set: { lastHitAt: new Date() },
    }
  );
}

// ============================================
// Products SEO Repository Functions
// ============================================

/**
 * Get products with SEO data for bulk editor
 */
export async function getProductsSEO(options: {
  page?: number;
  perPage?: number;
  search?: string;
  scoreMin?: number;
  scoreMax?: number;
  hasIssues?: boolean;
  sortBy?: 'score' | 'name' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}): Promise<{ products: ProductSEOListItem[]; total: number }> {
  const { products: productsCollection } = await getCollections();

  const page = options.page || 1;
  const perPage = options.perPage || 20;
  const skip = (page - 1) * perPage;

  // Build filter
  const filter: Record<string, unknown> = {
    status: { $ne: 'trash' },
    deletedAt: null,
  };

  if (options.search) {
    filter.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { sku: { $regex: options.search, $options: 'i' } },
      { slug: { $regex: options.search, $options: 'i' } },
    ];
  }

  if (typeof options.scoreMin === 'number') {
    filter['seo.seoScore'] = { $gte: options.scoreMin };
  }

  if (typeof options.scoreMax === 'number') {
    filter['seo.seoScore'] = {
      ...(filter['seo.seoScore'] as object || {}),
      $lte: options.scoreMax,
    };
  }

  if (options.hasIssues === true) {
    filter['seo.seoIssues.0'] = { $exists: true };
  }

  // Build sort
  const sortField =
    options.sortBy === 'score'
      ? 'seo.seoScore'
      : options.sortBy === 'name'
      ? 'name'
      : 'updatedAt';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

  const [products, total] = await Promise.all([
    productsCollection
      .find(filter)
      .project({
        name: 1,
        slug: 1,
        images: { $slice: 1 },
        seo: 1,
      })
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(perPage)
      .toArray(),
    productsCollection.countDocuments(filter),
  ]);

  return {
    products: products.map((doc) => mapProductToSEOItem(doc as WithId<Document>)),
    total,
  };
}

/**
 * Bulk update products SEO
 */
export async function bulkUpdateProductsSEO(
  updates: Array<{ productId: string; seo: Partial<ProductSEOFields> }>
): Promise<{ updated: number; failed: number; errors: Array<{ productId: string; error: string }> }> {
  const { products: productsCollection } = await getCollections();

  let updated = 0;
  let failed = 0;
  const errors: Array<{ productId: string; error: string }> = [];

  const now = new Date();

  for (const { productId, seo } of updates) {
    try {
      if (!ObjectId.isValid(productId)) {
        throw new Error('Invalid product ID');
      }

      const updateData: Record<string, unknown> = {
        updatedAt: now,
      };

      // Flatten seo fields for $set operation
      for (const [key, value] of Object.entries(seo)) {
        if (value !== undefined) {
          updateData[`seo.${key}`] = value;
        }
      }

      const result = await productsCollection.updateOne(
        { _id: new ObjectId(productId) },
        { $set: updateData }
      );

      if (result.matchedCount > 0) {
        updated++;
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      failed++;
      errors.push({
        productId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { updated, failed, errors };
}

/**
 * Update single product SEO
 */
export async function updateProductSEO(
  productId: string,
  seo: Partial<ProductSEOFields>
): Promise<boolean> {
  const { products: productsCollection } = await getCollections();

  if (!ObjectId.isValid(productId)) return false;

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  // Flatten seo fields for $set operation
  for (const [key, value] of Object.entries(seo)) {
    if (value !== undefined) {
      updateData[`seo.${key}`] = value;
    }
  }

  const result = await productsCollection.updateOne(
    { _id: new ObjectId(productId) },
    { $set: updateData }
  );

  return result.matchedCount > 0;
}

// ============================================
// Dashboard Statistics
// ============================================

/**
 * Get SEO dashboard statistics
 */
export async function getSEODashboardStats(): Promise<SEODashboardStats> {
  const { products: productsCollection, db } = await getCollections();
  const redirectsCollection = db.collection('seoRedirects');

  const activeProductsFilter = {
    status: { $ne: 'trash' },
    deletedAt: null,
  };

  // Aggregate products SEO data
  const [productStats, scoreDistribution, topIssues, redirectCount] = await Promise.all([
    // Product counts
    productsCollection
      .aggregate([
        { $match: activeProductsFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            withSEO: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ifNull: ['$seo.seoTitle', false] },
                    { $ifNull: ['$seo.seoDescription', false] },
                  ]},
                  1,
                  0,
                ],
              },
            },
            totalScore: { $sum: { $ifNull: ['$seo.seoScore', 0] } },
            scoredCount: {
              $sum: { $cond: [{ $ifNull: ['$seo.seoScore', false] }, 1, 0] },
            },
          },
        },
      ])
      .toArray(),

    // Score distribution
    productsCollection
      .aggregate([
        { $match: { ...activeProductsFilter, 'seo.seoScore': { $exists: true } } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $gte: ['$seo.seoScore', 90] }, then: 'excellent' },
                  { case: { $gte: ['$seo.seoScore', 70] }, then: 'good' },
                  { case: { $gte: ['$seo.seoScore', 50] }, then: 'needsWork' },
                ],
                default: 'poor',
              },
            },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),

    // Top issues
    productsCollection
      .aggregate([
        { $match: activeProductsFilter },
        { $unwind: { path: '$seo.seoIssues', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$seo.seoIssues', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ])
      .toArray(),

    // Redirect count
    redirectsCollection.countDocuments({}),
  ]);

  const stats = productStats[0] || { total: 0, withSEO: 0, totalScore: 0, scoredCount: 0 };
  const avgScore = stats.scoredCount > 0 ? Math.round(stats.totalScore / stats.scoredCount) : 0;

  // Map score distribution
  const distribution: SEODashboardStats['scoreDistribution'] = {
    excellent: 0,
    good: 0,
    needsWork: 0,
    poor: 0,
    notAudited: stats.total - stats.scoredCount,
  };
  for (const item of scoreDistribution) {
    if (item._id in distribution) {
      distribution[item._id as keyof typeof distribution] = item.count;
    }
  }

  // Issue labels
  const issueLabels: Record<string, string> = {
    MISSING_SEO_DESCRIPTION: 'Thiếu mô tả SEO',
    MISSING_TITLE: 'Thiếu tiêu đề SEO',
    SHORT_TITLE: 'Tiêu đề quá ngắn',
    LONG_TITLE: 'Tiêu đề quá dài',
    NO_FOCUS_KEYWORD: 'Chưa có từ khóa chính',
    KEYWORD_NOT_IN_TITLE: 'Từ khóa không có trong tiêu đề',
    KEYWORD_NOT_IN_DESCRIPTION: 'Từ khóa không có trong mô tả',
    MISSING_IMAGE: 'Thiếu hình ảnh',
    MISSING_OG_IMAGE: 'Thiếu hình OG',
    LONG_SLUG: 'Slug quá dài',
    MISSING_SHORT_DESCRIPTION: 'Thiếu mô tả ngắn',
  };

  return {
    totalProducts: stats.total,
    averageScore: avgScore,
    scoreDistribution: distribution,
    commonIssues: topIssues.map((item) => ({
      issue: issueLabels[item._id] || item._id,
      count: item.count,
    })),
  };
}
