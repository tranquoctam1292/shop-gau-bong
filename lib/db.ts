/**
 * MongoDB Database Connection & Collections
 * 
 * Repository Pattern: Use getCollections() to access collections
 * No Mongoose - Uses native MongoDB driver
 * 
 * @see https://www.mongodb.com/docs/drivers/node/current/
 */

// Load environment variables (for scripts)
if (typeof window === 'undefined' && !process.env.MONGODB_URI) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
  } catch {
    // dotenv not available or .env.local not found - will check later
  }
}

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// MongoDB connection URI from environment
const MONGODB_URI = process.env.MONGODB_URI;

// Don't throw error on module load - check when connecting
function getMongoDBUri(): string {
  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }
  return MONGODB_URI;
}

// Database name (extracted from URI or default)
const DB_NAME = process.env.MONGODB_DB_NAME || 'shop-gau-bong';

// Global connection cache (for serverless functions)
interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongo: MongoCache | undefined;
}

// Initialize global cache
if (!global.mongo) {
  global.mongo = {
    client: null,
    db: null,
    promise: null,
  };
}

const cache = global.mongo;

/**
 * Connect to MongoDB
 * Uses connection pooling for serverless environments
 */
export async function connectDB(): Promise<MongoClient> {
  if (cache.client && cache.db) {
    return cache.client;
  }

  if (!cache.promise) {
    const uri = getMongoDBUri(); // Get URI and validate
    const opts = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    cache.promise = MongoClient.connect(uri, opts).then((client) => {
      cache.client = client;
      cache.db = client.db(DB_NAME);
      return client;
    });
  }

  try {
    const client = await cache.promise;
    return client;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}

/**
 * Get MongoDB database instance
 */
async function getDB(): Promise<Db> {
  if (cache.db) {
    return cache.db;
  }

  await connectDB();
  if (!cache.db) {
    throw new Error('Failed to get database instance');
  }
  return cache.db;
}

/**
 * Collections interface
 * Add new collections here as needed
 */
export interface Collections {
  db: Db;
  products: Collection;
  categories: Collection;
  orders: Collection;
  orderItems: Collection;
  orderHistories: Collection;
  users: Collection;
  banners: Collection;
  // Blog collections
  posts: Collection;
  authors: Collection;
  comments: Collection;
  postCategories: Collection;
  postTags: Collection;
  // Phase 4: Product templates
  productTemplates: Collection;
  // Phase 5: Reviews & Analytics
  productReviews: Collection;
  productAnalytics: Collection;
  // Global Attributes System
  productAttributes: Collection;
  productAttributeTerms: Collection;
  // Shipments
  shipments: Collection;
  // Refunds
  refunds: Collection;
  // Menu Management
  menus: Collection;
  menuItems: Collection;
  // Media Library
  media: Collection;
  // Admin Account Management (RBAC)
  adminUsers: Collection;
  adminActivityLogs: Collection;
  rateLimits: Collection;
}

/**
 * Get all collections
 * 
 * Usage:
 * ```typescript
 * const { products, orders } = await getCollections();
 * const product = await products.findOne({ _id: new ObjectId(id) });
 * ```
 */
export async function getCollections(): Promise<Collections> {
  const db = await getDB();

  return {
    db,
    products: db.collection('products'),
    categories: db.collection('categories'),
    orders: db.collection('orders'),
    orderItems: db.collection('order_items'),
    orderHistories: db.collection('order_histories'),
    users: db.collection('users'),
    banners: db.collection('banners'),
    // Blog collections
    posts: db.collection('posts'),
    authors: db.collection('authors'),
    comments: db.collection('comments'),
    postCategories: db.collection('post_categories'),
    postTags: db.collection('post_tags'),
    // Phase 4: Product templates (optional)
    productTemplates: db.collection('product_templates'),
    // Phase 5: Reviews & Analytics
    productReviews: db.collection('product_reviews'),
    productAnalytics: db.collection('product_analytics'),
    // Global Attributes System
    productAttributes: db.collection('product_attributes'),
    productAttributeTerms: db.collection('product_attribute_terms'),
    // Shipments
    shipments: db.collection('shipments'),
    // Refunds
    refunds: db.collection('refunds'),
    // Menu Management
    menus: db.collection('menus'),
    menuItems: db.collection('menu_items'),
    // Media Library
    media: db.collection('media'),
    // Admin Account Management (RBAC)
    adminUsers: db.collection('admin_users'),
    adminActivityLogs: db.collection('admin_activity_logs'),
    // Rate Limiting (for serverless environments)
    rateLimits: db.collection('rate_limits'),
  };
}

/**
 * Close MongoDB connection
 * Useful for cleanup in scripts
 */
export async function closeDB(): Promise<void> {
  if (cache.client) {
    await cache.client.close();
    cache.client = null;
    cache.db = null;
    cache.promise = null;
  }
}

// Export ObjectId for use in other files
export { ObjectId };

