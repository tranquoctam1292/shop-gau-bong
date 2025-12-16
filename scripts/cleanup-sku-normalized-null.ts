/**
 * Cleanup script: Remove sku_normalized: null from products collection
 * 
 * Issue: Sparse unique index on sku_normalized doesn't allow multiple null values
 * Solution: Use $unset to remove the field instead of setting to null
 * 
 * This script removes sku_normalized field from products that have null value
 * to fix duplicate key errors with sparse unique index
 */

import { getCollections } from '@/lib/db';

async function cleanupSkuNormalizedNull() {
  console.log('🧹 Cleaning up sku_normalized: null from products collection...\n');
  
  try {
    const { products } = await getCollections();
    
    // Find all products - we'll check each one
    const allProducts = await products.find({}).toArray();
    console.log(`📦 Checking ${allProducts.length} total products...`);
    
    let productsWithNullSku: any[] = [];
    for (const product of allProducts) {
      // Check if sku_normalized exists and is null
      if ('sku_normalized' in product && (product as any).sku_normalized === null) {
        productsWithNullSku.push(product);
      }
    }
    
    console.log(`📦 Found ${productsWithNullSku.length} products with sku_normalized: null`);
    
    if (productsWithNullSku.length === 0) {
      console.log('✅ No products need cleanup');
      return;
    }
    
    // Update each product individually
    let updatedCount = 0;
    for (const product of productsWithNullSku) {
      try {
        const updateResult = await products.updateOne(
          { _id: product._id },
          { $unset: { sku_normalized: '' } }
        );
        if (updateResult.modifiedCount > 0) {
          updatedCount++;
          console.log(`   ✅ Updated product: ${product._id} (${(product as any).name || 'N/A'})`);
        } else {
          console.log(`   ⚠️  No change for product: ${product._id} (may already be cleaned)`);
        }
      } catch (error: any) {
        console.error(`   ❌ Error updating product ${product._id}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Removed sku_normalized field from ${updatedCount} products`);
    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run cleanup
cleanupSkuNormalizedNull()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
