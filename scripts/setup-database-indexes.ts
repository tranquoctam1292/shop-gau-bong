/**
 * Setup Database Indexes
 * 
 * Creates indexes for optimal query performance
 * 
 * Usage: npm run db:setup-indexes
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB } from '../lib/db';

async function setupIndexes() {
  console.log('🔧 Setting up database indexes...\n');

  try {
    const collections = await getCollections();

    // Products indexes
    console.log('📦 Setting up products indexes...');
    await collections.products.createIndex({ slug: 1 }, { unique: true });
    await collections.products.createIndex({ status: 1 });
    await collections.products.createIndex({ featured: 1 });
    await collections.products.createIndex({ category: 1 });
    await collections.products.createIndex({ 'variants.size': 1 });
    await collections.products.createIndex({ createdAt: -1 });
    // PIM Module: Soft Delete indexes
    await collections.products.createIndex({ deletedAt: 1 });
    await collections.products.createIndex({ status: 1, deletedAt: 1 }); // Compound index for common queries
    
    // ✅ PERFORMANCE: Compound indexes for complex queries (Bước 3)
    // Index 1: Hỗ trợ query với status, deletedAt, category và price range
    // Sử dụng cho: Filter products by category và price
    await collections.products.createIndex({ 
      status: 1, 
      deletedAt: 1, 
      category: 1, 
      minPrice: 1 
    }, { name: 'status_deletedAt_category_minPrice' });
    
    // Index 2: Hỗ trợ query với status, deletedAt và price range (minPrice, maxPrice)
    // Sử dụng cho: Filter products by price range (variable products)
    await collections.products.createIndex({ 
      status: 1, 
      deletedAt: 1, 
      minPrice: 1, 
      maxPrice: 1 
    }, { name: 'status_deletedAt_minPrice_maxPrice' });
    
    // Index 3: Hỗ trợ query với status, deletedAt và price field
    // Sử dụng cho: Filter simple products by price
    await collections.products.createIndex({ 
      status: 1, 
      deletedAt: 1, 
      price: 1 
    }, { name: 'status_deletedAt_price' });
    
    // Index 4: Hỗ trợ query với variants và status
    // Sử dụng cho: Filter products by variants (size, color) với $elemMatch
    await collections.products.createIndex({ 
      status: 1, 
      deletedAt: 1, 
      'variants.size': 1 
    }, { name: 'status_deletedAt_variants_size' });
    
    await collections.products.createIndex({ 
      status: 1, 
      deletedAt: 1, 
      'variants.color': 1 
    }, { name: 'status_deletedAt_variants_color' });
    
    // Index 5: Hỗ trợ query với categories array (nếu sử dụng categories thay vì category)
    await collections.products.createIndex({ 
      status: 1, 
      deletedAt: 1, 
      categories: 1, 
      minPrice: 1 
    }, { name: 'status_deletedAt_categories_minPrice' });
    
    // ✅ PERFORMANCE: Single-field indexes cho minPrice, maxPrice, totalStock
    // Hỗ trợ quick-update API recalculate operations và các query filter theo các field này
    // Note: Compound indexes đã bao gồm minPrice và maxPrice, nhưng single-field indexes
    // vẫn hữu ích cho các query chỉ filter theo một field này
    await collections.products.createIndex({ minPrice: 1 }, { name: 'minPrice' });
    await collections.products.createIndex({ maxPrice: 1 }, { name: 'maxPrice' });
    await collections.products.createIndex({ totalStock: 1 }, { name: 'totalStock' });
    
    console.log('   ✅ Products indexes created (including compound indexes and single-field indexes for performance)');

    // Categories indexes
    console.log('📦 Setting up categories indexes...');
    await collections.categories.createIndex({ slug: 1 }, { unique: true });
    await collections.categories.createIndex({ parentId: 1 });
    await collections.categories.createIndex({ position: 1 });
    await collections.categories.createIndex({ status: 1 }); // NEW: For status filtering
    await collections.categories.createIndex({ deletedAt: 1 }); // NEW: For soft delete queries
    console.log('   ✅ Categories indexes created');

    // Orders indexes
    console.log('📦 Setting up orders indexes...');
    await collections.orders.createIndex({ orderNumber: 1 }, { unique: true });
    await collections.orders.createIndex({ status: 1 });
    await collections.orders.createIndex({ userId: 1 });
    await collections.orders.createIndex({ 'customerEmail': 1 });
    await collections.orders.createIndex({ createdAt: -1 });
    await collections.orders.createIndex({ orderType: 1 }); // For gift order filtering
    await collections.orders.createIndex({ paymentStatus: 1 });
    await collections.orders.createIndex({ channel: 1 });
    console.log('   ✅ Orders indexes created');

    // Order Items indexes
    console.log('📦 Setting up order_items indexes...');
    await collections.orderItems.createIndex({ orderId: 1 });
    await collections.orderItems.createIndex({ productId: 1 });
    console.log('   ✅ Order items indexes created');

    // Order Histories indexes (OMS Phase 1)
    console.log('📦 Setting up order_histories indexes...');
    await collections.orderHistories.createIndex({ orderId: 1, createdAt: -1 });
    await collections.orderHistories.createIndex({ actorId: 1 });
    await collections.orderHistories.createIndex({ action: 1 });
    console.log('   ✅ Order histories indexes created');

    // Users indexes
    console.log('📦 Setting up users indexes...');
    await collections.users.createIndex({ email: 1 }, { unique: true });
    console.log('   ✅ Users indexes created');

    // Admin Users indexes (RBAC)
    console.log('📦 Setting up admin_users indexes...');
    await collections.adminUsers.createIndex({ username: 1 }, { unique: true });
    await collections.adminUsers.createIndex({ email: 1 }, { unique: true });
    await collections.adminUsers.createIndex({ role: 1 });
    await collections.adminUsers.createIndex({ is_active: 1 });
    await collections.adminUsers.createIndex({ token_version: 1 }); // V1.2: For token revocation
    await collections.adminUsers.createIndex({ created_by: 1 });
    console.log('   ✅ Admin users indexes created');

    // Admin Activity Logs indexes (RBAC)
    console.log('📦 Setting up admin_activity_logs indexes...');
    await collections.adminActivityLogs.createIndex({ admin_id: 1, createdAt: -1 });
    await collections.adminActivityLogs.createIndex({ action: 1 });
    await collections.adminActivityLogs.createIndex({ target_collection: 1, target_id: 1 });
    await collections.adminActivityLogs.createIndex({ createdAt: -1 });
    console.log('   ✅ Admin activity logs indexes created');

    // Rate Limits indexes (Serverless Rate Limiting)
    console.log('📦 Setting up rate_limits indexes...');
    await collections.rateLimits.createIndex({ key: 1 }, { unique: true });
    // TTL index: Automatically delete expired entries after resetAt time
    await collections.rateLimits.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 });
    await collections.rateLimits.createIndex({ createdAt: 1 });
    console.log('   ✅ Rate limits indexes created (with TTL auto-cleanup)');

    // Banners indexes
    console.log('📦 Setting up banners indexes...');
    await collections.banners.createIndex({ position: 1 });
    await collections.banners.createIndex({ active: 1 });
    console.log('   ✅ Banners indexes created');

    // Posts indexes
    console.log('📦 Setting up posts indexes...');
    await collections.posts.createIndex({ slug: 1 }, { unique: true });
    await collections.posts.createIndex({ status: 1 });
    await collections.posts.createIndex({ authorId: 1 });
    await collections.posts.createIndex({ categoryId: 1 });
    await collections.posts.createIndex({ publishedAt: -1 });
    await collections.posts.createIndex({ createdAt: -1 });
    console.log('   ✅ Posts indexes created');

    // Authors indexes
    console.log('📦 Setting up authors indexes...');
    await collections.authors.createIndex({ email: 1 }, { unique: true });
    await collections.authors.createIndex({ slug: 1 }, { unique: true });
    console.log('   ✅ Authors indexes created');

    // Comments indexes
    console.log('📦 Setting up comments indexes...');
    await collections.comments.createIndex({ postId: 1 });
    await collections.comments.createIndex({ status: 1 });
    await collections.comments.createIndex({ createdAt: -1 });
    await collections.comments.createIndex({ authorEmail: 1 });
    console.log('   ✅ Comments indexes created');

    // Post Categories indexes
    console.log('📦 Setting up post_categories indexes...');
    await collections.postCategories.createIndex({ slug: 1 }, { unique: true });
    await collections.postCategories.createIndex({ parentId: 1 });
    console.log('   ✅ Post categories indexes created');

    // Post Tags indexes
    console.log('📦 Setting up post_tags indexes...');
    await collections.postTags.createIndex({ slug: 1 }, { unique: true });
    console.log('   ✅ Post tags indexes created');

    // Product Templates indexes
    console.log('📦 Setting up product_templates indexes...');
    await collections.productTemplates.createIndex({ name: 1 });
    await collections.productTemplates.createIndex({ category: 1 });
    await collections.productTemplates.createIndex({ createdAt: -1 });
    console.log('   ✅ Product templates indexes created');

    // Product Reviews indexes
    console.log('📦 Setting up product_reviews indexes...');
    await collections.productReviews.createIndex({ productId: 1 });
    await collections.productReviews.createIndex({ status: 1 });
    await collections.productReviews.createIndex({ rating: 1 });
    await collections.productReviews.createIndex({ createdAt: -1 });
    await collections.productReviews.createIndex({ authorEmail: 1 });
    await collections.productReviews.createIndex({ helpfulCount: -1 });
    console.log('   ✅ Product reviews indexes created');

    // Product Analytics indexes
    console.log('📦 Setting up product_analytics indexes...');
    await collections.productAnalytics.createIndex({ productId: 1 });
    await collections.productAnalytics.createIndex({ date: -1 });
    await collections.productAnalytics.createIndex({ productId: 1, date: -1 });
    console.log('   ✅ Product analytics indexes created');

    // Shipments indexes (OMS Phase 6)
    console.log('📦 Setting up shipments indexes...');
    await collections.shipments.createIndex({ orderId: 1 }, { unique: true });
    await collections.shipments.createIndex({ trackingNumber: 1 }, { unique: true });
    await collections.shipments.createIndex({ carrier: 1 });
    await collections.shipments.createIndex({ createdAt: -1 });
    console.log('   ✅ Shipments indexes created');

    // Refunds indexes (OMS Phase 7)
    console.log('📦 Setting up refunds indexes...');
    await collections.refunds.createIndex({ orderId: 1 });
    await collections.refunds.createIndex({ status: 1 });
    await collections.refunds.createIndex({ createdAt: -1 });
    await collections.refunds.createIndex({ orderId: 1, status: 1 });
    console.log('   ✅ Refunds indexes created');

    // Menus indexes (Menu Management Phase 1)
    console.log('📦 Setting up menus indexes...');
    await collections.menus.createIndex({ location: 1 }, { unique: true, sparse: true }); // Unique location (1 location = 1 active menu)
    await collections.menus.createIndex({ status: 1 });
    await collections.menus.createIndex({ createdAt: -1 });
    console.log('   ✅ Menus indexes created');

    // Menu Items indexes (Menu Management Phase 1)
    console.log('📦 Setting up menu_items indexes...');
    await collections.menuItems.createIndex({ menuId: 1, order: 1 }); // Optimize query by menu and sorting
    await collections.menuItems.createIndex({ menuId: 1, parentId: 1 }); // Optimize tree queries
    await collections.menuItems.createIndex({ referenceId: 1, type: 1 }); // Optimize reference resolution
    await collections.menuItems.createIndex({ parentId: 1 }); // For finding children
    console.log('   ✅ Menu items indexes created');

    // Media Library indexes (Media Library Phase 1)
    console.log('📦 Setting up media indexes...');
    await collections.media.createIndex({ name: 'text', altText: 'text' }); // Text search
    await collections.media.createIndex({ type: 1 });                       // Filter by type
    await collections.media.createIndex({ createdAt: -1 });                 // Sort newest
    await collections.media.createIndex({ folder: 1 });                     // Filter by folder
    await collections.media.createIndex({ uploadedBy: 1 });                 // Filter by user
    // Unique indexes for data integrity (defense in depth - auto-renaming already prevents conflicts)
    await collections.media.createIndex({ path: 1 }, { unique: true, sparse: true }); // Unique path
    await collections.media.createIndex({ url: 1 }, { unique: true, sparse: true }); // Unique URL
    console.log('   ✅ Media indexes created');

    // Global Attributes System indexes
    console.log('📦 Setting up product_attributes indexes...');
    await collections.productAttributes.createIndex({ slug: 1 }, { unique: true }); // Unique slug
    await collections.productAttributes.createIndex({ name: 1 }); // Search by name
    await collections.productAttributes.createIndex({ type: 1 }); // Filter by type
    await collections.productAttributes.createIndex({ createdAt: -1 }); // Sort newest
    console.log('   ✅ Product attributes indexes created');

    // Product Attribute Terms indexes
    console.log('📦 Setting up product_attribute_terms indexes...');
    await collections.productAttributeTerms.createIndex({ attributeId: 1 }); // Filter by attribute
    await collections.productAttributeTerms.createIndex({ slug: 1 }); // Search by slug
    await collections.productAttributeTerms.createIndex({ attributeId: 1, slug: 1 }, { unique: true }); // Unique slug per attribute
    await collections.productAttributeTerms.createIndex({ attributeId: 1, sortOrder: 1 }); // Sort terms by attribute
    await collections.productAttributeTerms.createIndex({ createdAt: -1 }); // Sort newest
    console.log('   ✅ Product attribute terms indexes created');

    // Smart SKU System indexes
    console.log('📦 Setting up Smart SKU System indexes...');
    
    // SKU Settings indexes
    await collections.skuSettings.createIndex({ categoryId: 1 }, { unique: true, sparse: true }); // Unique pattern per category (null = global)
    await collections.skuSettings.createIndex({ createdAt: -1 }); // Sort newest
    console.log('   ✅ SKU settings indexes created');
    
    // SKU Abbreviations indexes
    await collections.skuAbbreviations.createIndex({ type: 1, originalValue: 1 }); // For lookup
    await collections.skuAbbreviations.createIndex({ type: 1, categoryId: 1, originalValue: 1 }); // For category-specific lookup
    await collections.skuAbbreviations.createIndex({ createdAt: -1 }); // Sort newest
    console.log('   ✅ SKU abbreviations indexes created');
    
    // SKU Counters indexes
    await collections.skuCounters.createIndex({ key: 1 }, { unique: true }); // Unique counter per base SKU
    await collections.skuCounters.createIndex({ updatedAt: -1 }); // Sort by last update
    console.log('   ✅ SKU counters indexes created');
    
    // SKU History indexes
    await collections.skuHistory.createIndex({ productId: 1, changedAt: -1 }); // For product history lookup
    await collections.skuHistory.createIndex({ oldSku: 1 }); // For SKU redirect lookup
    await collections.skuHistory.createIndex({ variantId: 1 }); // For variant history lookup
    await collections.skuHistory.createIndex({ changedAt: -1 }); // Sort by change date
    console.log('   ✅ SKU history indexes created');
    
    // Products: Add sku_normalized index (CRITICAL for race condition prevention)
    console.log('📦 Adding sku_normalized index to products...');
    try {
      await collections.products.createIndex({ sku_normalized: 1 }, { unique: true, sparse: true });
      console.log('   ✅ Products sku_normalized index created');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('   ℹ️  Products sku_normalized index already exists');
      } else {
        console.error('   ⚠️  Error creating products sku_normalized index:', error.message);
      }
    }
    
    // Categories: Add code index (for category code lookup)
    console.log('📦 Adding code index to categories...');
    try {
      await collections.categories.createIndex({ code: 1 }, { unique: true, sparse: true });
      console.log('   ✅ Categories code index created');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('   ℹ️  Categories code index already exists');
      } else {
        console.error('   ⚠️  Error creating categories code index:', error.message);
      }
    }

    console.log('\n🎉 All indexes created successfully!\n');

    // List all indexes
    console.log('📊 Current indexes:');
    const allCollections = [
      { name: 'products', collection: collections.products },
      { name: 'categories', collection: collections.categories },
      { name: 'orders', collection: collections.orders },
      { name: 'order_items', collection: collections.orderItems },
      { name: 'order_histories', collection: collections.orderHistories },
      { name: 'users', collection: collections.users },
      { name: 'banners', collection: collections.banners },
      { name: 'posts', collection: collections.posts },
      { name: 'authors', collection: collections.authors },
      { name: 'comments', collection: collections.comments },
      { name: 'post_categories', collection: collections.postCategories },
      { name: 'post_tags', collection: collections.postTags },
      { name: 'product_templates', collection: collections.productTemplates },
      { name: 'product_reviews', collection: collections.productReviews },
      { name: 'product_analytics', collection: collections.productAnalytics },
      { name: 'shipments', collection: collections.shipments },
      { name: 'refunds', collection: collections.refunds },
      { name: 'menus', collection: collections.menus },
      { name: 'menu_items', collection: collections.menuItems },
      { name: 'media', collection: collections.media },
      { name: 'product_attributes', collection: collections.productAttributes },
      { name: 'product_attribute_terms', collection: collections.productAttributeTerms },
      { name: 'admin_users', collection: collections.adminUsers },
      { name: 'admin_activity_logs', collection: collections.adminActivityLogs },
      { name: 'rate_limits', collection: collections.rateLimits },
      { name: 'sku_settings', collection: collections.skuSettings },
      { name: 'sku_abbreviations', collection: collections.skuAbbreviations },
      { name: 'sku_counters', collection: collections.skuCounters },
      { name: 'sku_history', collection: collections.skuHistory },
    ];

    for (const { name, collection } of allCollections) {
      const indexes = await collection.indexes();
      console.log(`\n   ${name}:`);
      indexes.forEach((index) => {
        const keys = Object.keys(index.key || {});
        const unique = index.unique ? ' (unique)' : '';
        console.log(`      - ${keys.join(', ')}${unique}`);
      });
    }

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to setup indexes!\n');

    if (error instanceof Error) {
      console.error('Error details:');
      console.error(`   Message: ${error.message}`);
    } else {
      console.error('Unknown error:', error);
    }

    await closeDB();
    process.exit(1);
  }
}

// Run setup
setupIndexes();

