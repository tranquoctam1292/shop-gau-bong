/**
 * Migration Script: productDataMetaBox.variations[] → variants[]
 * 
 * PHASE 0: Variants Structure Sync (7.1.3)
 * 
 * Migrates existing variations[] to variants[] structure
 * Ensures single source of truth: variants[] only
 */

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shop-gau-bong';

interface Variation {
  id: string;
  attributes: Record<string, string>;
  regularPrice: number;
  salePrice?: number;
  stockQuantity?: number;
  sku?: string;
  image?: string;
}

interface Variant {
  id: string;
  size: string;
  color?: string;
  colorCode?: string;
  price: number;
  stock: number;
  image?: string;
  sku?: string;
}

async function migrateVariationsToVariants() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const products = db.collection('products');
    
    console.log('🔄 Starting migration: variations[] → variants[]...\n');
    
    // Find all products with variations[] but no variants[]
    const productsToMigrate = await products.find({
      'productDataMetaBox.variations': { $exists: true, $ne: [] },
      $or: [
        { variants: { $exists: false } },
        { variants: { $size: 0 } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${productsToMigrate.length} products to migrate\n`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const product of productsToMigrate) {
      try {
        const variations = product.productDataMetaBox?.variations as Variation[] | undefined;
        
        if (!variations || variations.length === 0) {
          skipped++;
          continue;
        }
        
        // Convert variations[] to variants[]
        const variants: Variant[] = variations.map((variation) => {
          // Extract size and color from attributes
          let size = '';
          let color = '';
          let colorCode = '';
          
          if (variation.attributes) {
            Object.entries(variation.attributes).forEach(([attrName, value]) => {
              const attrNameLower = attrName.toLowerCase();
              if (attrNameLower.includes('size') || attrNameLower === 'pa_size' || attrNameLower === 'kích thước') {
                size = String(value);
              } else if (attrNameLower.includes('color') || attrNameLower === 'pa_color' || attrNameLower === 'màu') {
                color = String(value);
              }
            });
          }
          
          // Use salePrice if available and valid, otherwise use regularPrice
          const price = variation.salePrice && variation.regularPrice && variation.salePrice < variation.regularPrice
            ? variation.salePrice
            : variation.regularPrice || 0;
          
          return {
            id: variation.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            size,
            color: color || undefined,
            colorCode: colorCode || undefined,
            price,
            stock: variation.stockQuantity || 0,
            image: variation.image || undefined,
            sku: variation.sku || undefined,
          };
        });
        
        // Update product: set variants[], keep variations[] for backward compatibility (deprecated)
        await products.updateOne(
          { _id: product._id },
          {
            $set: {
              variants,
              updatedAt: new Date(),
            }
          }
        );
        
        migrated++;
        console.log(`✅ Migrated product: ${product.name || product._id} (${variants.length} variants)`);
      } catch (error: any) {
        errors++;
        console.error(`❌ Error migrating product ${product._id}:`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`\n✅ Migration completed!`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration
migrateVariationsToVariants().catch(console.error);

