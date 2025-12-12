/**
 * Migration Script: Update Categories Schema
 * 
 * Adds new fields to existing categories:
 * - status: 'active' | 'inactive' (default: 'active')
 * - metaTitle: string (optional)
 * - metaDesc: string (optional)
 * - deletedAt: Date | null (default: null)
 * 
 * Usage: npm run migrate:categories
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB } from '../lib/db';

async function migrateCategories() {
  console.log('🔄 Migrating categories schema...\n');

  try {
    const collections = await getCollections();

    // Get all categories
    const categories = await collections.categories.find({}).toArray();
    console.log(`📦 Found ${categories.length} categories to migrate\n`);

    let updated = 0;
    let skipped = 0;

    for (const category of categories) {
      const updateData: any = {};
      let needsUpdate = false;

      // Add status if missing
      if (!category.status) {
        updateData.status = 'active';
        needsUpdate = true;
      }

      // Add deletedAt if missing (set to null for existing categories)
      if (category.deletedAt === undefined) {
        updateData.deletedAt = null;
        needsUpdate = true;
      }

      // metaTitle and metaDesc are optional, no need to set defaults

      if (needsUpdate) {
        await collections.categories.updateOne(
          { _id: category._id },
          {
            $set: {
              ...updateData,
              updatedAt: new Date(),
            },
          }
        );
        updated++;
        console.log(`   ✅ Updated: ${category.name} (${category.slug})`);
      } else {
        skipped++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updated} categories`);
    console.log(`   Skipped: ${skipped} categories (already up to date)`);

    // Create new indexes
    console.log('\n📊 Creating new indexes...');
    await collections.categories.createIndex({ status: 1 });
    await collections.categories.createIndex({ deletedAt: 1 });
    console.log('   ✅ Indexes created');

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed!\n');

    if (error instanceof Error) {
      console.error('Error details:');
      console.error(`   Message: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    } else {
      console.error('Unknown error:', error);
    }

    await closeDB();
    process.exit(1);
  }
}

// Run migration
migrateCategories();

