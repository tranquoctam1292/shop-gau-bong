/**
 * Script để kiểm tra products có variants và attributes không
 * Chạy: npx tsx scripts/check-product-variants.ts
 */

import { connectDB, getCollections, closeDB } from '@/lib/db';
import { mapMongoProduct, MongoProduct } from '@/lib/utils/productMapper';

async function checkProductVariants() {
  try {
    await connectDB();
    const { products } = await getCollections();
    
    // Lấy 5 products đầu tiên
    const sampleProducts = await products
      .find({
        status: 'publish',
        isActive: true,
        $or: [
          { deletedAt: null },
          { deletedAt: { $exists: false } },
        ],
      })
      .limit(5)
      .toArray();
    
    console.log(`\n=== Kiểm tra ${sampleProducts.length} products ===\n`);
    
    for (const product of sampleProducts) {
      console.log(`\n📦 Product: ${product.name}`);
      console.log(`   ID: ${product._id.toString()}`);
      console.log(`   Type: ${product.productDataMetaBox?.productType || 'unknown'}`);
      
      // Check variants
      console.log(`   Variants (raw):`, {
        hasVariants: !!product.variants,
        variantsCount: product.variants?.length || 0,
        firstVariant: product.variants?.[0] || null,
      });
      
      // Check productDataMetaBox.variations
      console.log(`   productDataMetaBox.variations:`, {
        hasVariations: !!product.productDataMetaBox?.variations,
        variationsCount: product.productDataMetaBox?.variations?.length || 0,
        firstVariation: product.productDataMetaBox?.variations?.[0] || null,
      });
      
      // Check productDataMetaBox.attributes
      console.log(`   productDataMetaBox.attributes:`, {
        hasAttributes: !!product.productDataMetaBox?.attributes,
        attributesCount: product.productDataMetaBox?.attributes?.length || 0,
        firstAttribute: product.productDataMetaBox?.attributes?.[0] || null,
      });
      
      // Map product và check attributes
      const mapped = mapMongoProduct(product as unknown as MongoProduct);
      console.log(`   Mapped attributes:`, {
        hasAttributes: !!mapped.attributes,
        attributesCount: mapped.attributes?.length || 0,
        attributes: mapped.attributes || [],
      });
      
      // Extract size và color từ variants
      if (product.variants && product.variants.length > 0) {
        const sizes = [...new Set(product.variants.map((v: any) => v.size).filter(Boolean))];
        const colors = [...new Set(product.variants.map((v: any) => v.color).filter(Boolean))];
        console.log(`   Extracted from variants:`, {
          sizes,
          colors,
        });
      }
    }
    
    console.log(`\n=== Tổng kết ===`);
    const productsWithVariants = sampleProducts.filter(p => p.variants && p.variants.length > 0).length;
    const productsWithMappedAttributes = sampleProducts.filter(p => {
      const mapped = mapMongoProduct(p as unknown as MongoProduct);
      return mapped.attributes && mapped.attributes.length > 0;
    }).length;
    
    console.log(`   Products có variants: ${productsWithVariants}/${sampleProducts.length}`);
    console.log(`   Products có mapped attributes: ${productsWithMappedAttributes}/${sampleProducts.length}`);
    
  } catch (error: any) {
    console.error('Error:', error);
  } finally {
    await closeDB();
  }
}

checkProductVariants();

