/**
 * Check Attributes Database
 * 
 * Script để kiểm tra trạng thái của product_attributes và product_attribute_terms collections
 * 
 * Usage: tsx scripts/check-attributes-database.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB, ObjectId } from '../lib/db';

async function checkAttributesDatabase() {
  console.log('🔍 Checking Attributes Database...\n');

  try {
    const collections = await getCollections();

    // Check product_attributes collection
    console.log('📦 Checking product_attributes collection...');
    const attributesCount = await collections.productAttributes.countDocuments({});
    console.log(`   Total attributes: ${attributesCount}`);

    if (attributesCount > 0) {
      const attributes = await collections.productAttributes.find({}).limit(5).toArray();
      console.log(`   Sample attributes (first 5):`);
      attributes.forEach((attr) => {
        console.log(`      - ${attr.name} (${attr.slug}) [${attr.type}] - ID: ${attr._id}`);
      });
    } else {
      console.log('   ⚠️  No attributes found in database!');
    }

    // Check product_attribute_terms collection
    console.log('\n📦 Checking product_attribute_terms collection...');
    const termsCount = await collections.productAttributeTerms.countDocuments({});
    console.log(`   Total terms: ${termsCount}`);

    if (termsCount > 0) {
      const terms = await collections.productAttributeTerms.find({}).limit(5).toArray();
      console.log(`   Sample terms (first 5):`);
      terms.forEach((term) => {
        console.log(`      - ${term.name} (${term.slug}) - Attribute ID: ${term.attributeId}`);
      });
    } else {
      console.log('   ⚠️  No terms found in database!');
    }

    // Check indexes
    console.log('\n📊 Checking indexes...');
    const attributesIndexes = await collections.productAttributes.indexes();
    console.log(`   product_attributes indexes: ${attributesIndexes.length}`);
    attributesIndexes.forEach((index) => {
      const keys = Object.keys(index.key || {});
      const unique = index.unique ? ' (unique)' : '';
      console.log(`      - ${keys.join(', ')}${unique}`);
    });

    const termsIndexes = await collections.productAttributeTerms.indexes();
    console.log(`   product_attribute_terms indexes: ${termsIndexes.length}`);
    termsIndexes.forEach((index) => {
      const keys = Object.keys(index.key || {});
      const unique = index.unique ? ' (unique)' : '';
      console.log(`      - ${keys.join(', ')}${unique}`);
    });

    // Check if collections exist
    const db = collections.db;
    const collectionsList = await db.listCollections().toArray();
    const hasAttributes = collectionsList.some((c) => c.name === 'product_attributes');
    const hasTerms = collectionsList.some((c) => c.name === 'product_attribute_terms');

    console.log('\n📋 Collection Status:');
    console.log(`   product_attributes exists: ${hasAttributes ? '✅' : '❌'}`);
    console.log(`   product_attribute_terms exists: ${hasTerms ? '✅' : '❌'}`);

    if (!hasAttributes || !hasTerms) {
      console.log('\n⚠️  WARNING: Collections may not exist. They will be created automatically on first insert.');
    }

    if (attributesCount === 0 && termsCount === 0) {
      console.log('\n❌ CRITICAL: No attributes or terms found in database!');
      console.log('   This explains why the admin page shows "Chưa có thuộc tính nào"');
      console.log('   Possible causes:');
      console.log('   1. Data was deleted accidentally');
      console.log('   2. Database was reset/migrated');
      console.log('   3. Wrong database connection');
      console.log('   4. Collections were dropped');
    }

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to check attributes database!\n');

    if (error instanceof Error) {
      console.error('Error details:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error('Unknown error:', error);
    }

    await closeDB();
    process.exit(1);
  }
}

// Run check
checkAttributesDatabase();
