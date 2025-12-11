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
    console.log('   ✅ Products indexes created');

    // Categories indexes
    console.log('📦 Setting up categories indexes...');
    await collections.categories.createIndex({ slug: 1 }, { unique: true });
    await collections.categories.createIndex({ parentId: 1 });
    await collections.categories.createIndex({ position: 1 });
    console.log('   ✅ Categories indexes created');

    // Orders indexes
    console.log('📦 Setting up orders indexes...');
    await collections.orders.createIndex({ orderNumber: 1 }, { unique: true });
    await collections.orders.createIndex({ status: 1 });
    await collections.orders.createIndex({ 'customerEmail': 1 });
    await collections.orders.createIndex({ createdAt: -1 });
    await collections.orders.createIndex({ orderType: 1 }); // For gift order filtering
    console.log('   ✅ Orders indexes created');

    // Order Items indexes
    console.log('📦 Setting up order_items indexes...');
    await collections.orderItems.createIndex({ orderId: 1 });
    await collections.orderItems.createIndex({ productId: 1 });
    console.log('   ✅ Order items indexes created');

    // Users indexes
    console.log('📦 Setting up users indexes...');
    await collections.users.createIndex({ email: 1 }, { unique: true });
    console.log('   ✅ Users indexes created');

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

    console.log('\n🎉 All indexes created successfully!\n');

    // List all indexes
    console.log('📊 Current indexes:');
    const allCollections = [
      { name: 'products', collection: collections.products },
      { name: 'categories', collection: collections.categories },
      { name: 'orders', collection: collections.orders },
      { name: 'order_items', collection: collections.orderItems },
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

