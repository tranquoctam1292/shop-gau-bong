/**
 * Migration Script: Add code field to Categories
 * 
 * This script migrates existing categories to add the required `code` field.
 * 
 * ⚠️ CRITICAL: Run this script BEFORE deploying code that requires `code` field.
 * 
 * Usage: npm run migrate:category-codes
 * or: tsx scripts/migrate-category-codes.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB, ObjectId } from '../lib/db';
import { generateSlug } from '../lib/utils/slug';

/**
 * Generate category code from name
 * - Slugify name
 * - Uppercase
 * - Max 10 characters
 */
function generateCategoryCode(name: string): string {
  const slug = generateSlug(name);
  const code = slug.toUpperCase().substring(0, 10);
  return code || 'CAT'; // Fallback if empty
}

/**
 * Check if code already exists in categories
 */
async function codeExists(
  collections: Awaited<ReturnType<typeof getCollections>>,
  code: string,
  excludeId?: string
): Promise<boolean> {
  const query: any = { code: code };
  if (excludeId) {
    query._id = { $ne: new ObjectId(excludeId) };
  }
  
  const existing = await collections.categories.findOne(query);
  return !!existing;
}

/**
 * Generate unique code (add suffix if duplicate)
 */
async function generateUniqueCode(
  collections: Awaited<ReturnType<typeof getCollections>>,
  name: string,
  excludeId?: string
): Promise<string> {
  const baseCode = generateCategoryCode(name);
  
  // Check if base code is available
  const exists = await codeExists(collections, baseCode, excludeId);
  if (!exists) {
    return baseCode;
  }
  
  // Try with suffix (01, 02, etc.)
  let suffix = 1;
  const maxAttempts = 100; // Prevent infinite loop
  
  while (suffix <= maxAttempts) {
    const suffixStr = suffix.toString().padStart(2, '0');
    const uniqueCode = `${baseCode.substring(0, 8)}${suffixStr}`; // Keep total <= 10 chars
    
    const codeExistsResult = await codeExists(collections, uniqueCode, excludeId);
    if (!codeExistsResult) {
      return uniqueCode;
    }
    
    suffix++;
  }
  
  // Fallback: use timestamp
  const timestamp = Date.now().toString(36).toUpperCase().substring(0, 4);
  return `${baseCode.substring(0, 6)}${timestamp}`;
}

async function migrateCategoryCodes() {
  console.log('🔄 Starting Category Code Migration...\n');

  try {
    const collections = await getCollections();

    // Step 1: Find all categories without code field
    console.log('📋 Step 1: Finding categories without code field...');
    const categoriesWithoutCode = await collections.categories
      .find({
        $or: [
          { code: { $exists: false } },
          { code: null },
          { code: '' },
        ],
      })
      .toArray();

    console.log(`   Found ${categoriesWithoutCode.length} categories without code\n`);

    if (categoriesWithoutCode.length === 0) {
      console.log('✅ All categories already have code field. Migration not needed.\n');
      await closeDB();
      return;
    }

    // Step 2: Generate codes for each category
    console.log('📋 Step 2: Generating unique codes...');
    let successCount = 0;
    let errorCount = 0;

    for (const category of categoriesWithoutCode) {
      try {
        const categoryId = category._id.toString();
        const categoryName = category.name || 'Category';

        // Generate unique code
        const code = await generateUniqueCode(collections, categoryName, categoryId);

        // Update category
        await collections.categories.updateOne(
          { _id: category._id },
          {
            $set: {
              code: code,
              updatedAt: new Date(),
            },
          }
        );

        console.log(`   ✅ ${categoryName} → ${code}`);
        successCount++;
      } catch (error: any) {
        console.error(`   ❌ Error processing category ${category.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${categoriesWithoutCode.length}\n`);

    // Step 3: Verify migration
    console.log('📋 Step 3: Verifying migration...');
    const remainingWithoutCode = await collections.categories.countDocuments({
      $or: [
        { code: { $exists: false } },
        { code: null },
        { code: '' },
      ],
    });

    if (remainingWithoutCode === 0) {
      console.log('   ✅ All categories now have code field!\n');
    } else {
      console.log(`   ⚠️  Warning: ${remainingWithoutCode} categories still missing code field\n`);
    }

    // Step 4: Create index on code field
    console.log('📋 Step 4: Creating index on code field...');
    try {
      await collections.categories.createIndex({ code: 1 }, { unique: true, sparse: true });
      console.log('   ✅ Index created on code field\n');
    } catch (error: any) {
      if (error.code === 85) {
        // Index already exists
        console.log('   ℹ️  Index already exists\n');
      } else {
        console.error('   ⚠️  Error creating index:', error.message);
      }
    }

    console.log('🎉 Migration completed successfully!\n');
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await closeDB();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCategoryCodes()
    .then(() => {
      console.log('✅ Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateCategoryCodes };

