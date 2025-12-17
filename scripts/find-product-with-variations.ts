/**
 * Find products with productDataMetaBox.variations
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { MongoClient } from 'mongodb';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found');
  process.exit(1);
}

async function findProductsWithVariations() {
  const client = new MongoClient(MONGODB_URI as string);
  
  try {
    await client.connect();
    const db = client.db();
    const products = db.collection('products');
    
    const productsWithVariations = await products.find({
      'productDataMetaBox.variations': { $exists: true, $ne: [] }
    }).limit(5).toArray();
    
    console.log(`\nFound ${productsWithVariations.length} products with productDataMetaBox.variations:\n`);
    
    productsWithVariations.forEach((product: any, idx: number) => {
      console.log(`${idx + 1}. ${product.name}`);
      console.log(`   ID: ${product._id.toString()}`);
      console.log(`   Variations count: ${product.productDataMetaBox?.variations?.length || 0}`);
      if (product.productDataMetaBox?.variations?.[0]?.attributes) {
        console.log(`   First variation attributes: ${JSON.stringify(product.productDataMetaBox.variations[0].attributes)}`);
      }
      if (product.productDataMetaBox?.attributes) {
        const colorAttr = product.productDataMetaBox.attributes.find((a: any) => 
          a.name?.toLowerCase().includes('color') || a.name?.toLowerCase().includes('màu')
        );
        if (colorAttr) {
          console.log(`   Color attribute: "${colorAttr.name}"`);
          console.log(`   Color codes: ${JSON.stringify(colorAttr.colorCodes || {})}`);
        }
      }
      console.log('');
    });
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

findProductsWithVariations().catch(console.error);

