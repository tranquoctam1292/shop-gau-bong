/**
 * Debug script to check product variants structure
 * Usage: tsx scripts/debug-product-variants.ts <productId>
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { MongoClient, ObjectId } from 'mongodb';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function debugProductVariants(productId: string) {
  const client = new MongoClient(MONGODB_URI as string);
  
  try {
    await client.connect();
    const db = client.db();
    const products = db.collection('products');
    
    // Try to find product by ID or slug
    let product = null;
    let actualProductId = productId;
    
    // Extract ObjectId from GraphQL format if needed
    if (productId.startsWith('gid://shop-gau-bong/Product/')) {
      actualProductId = productId.replace('gid://shop-gau-bong/Product/', '');
    }
    
    if (ObjectId.isValid(actualProductId)) {
      product = await products.findOne({ 
        _id: new ObjectId(actualProductId) 
      });
    }
    
    if (!product && ObjectId.isValid(actualProductId)) {
      // Try with string comparison
      const allProducts = await products.find({}).limit(100).toArray();
      product = allProducts.find((p: any) => p._id.toString() === actualProductId);
    }
    
    if (!product) {
      // Try by slug
      product = await products.findOne({ 
        slug: productId 
      });
    }
    
    if (!product) {
      console.error(`Product ${productId} not found (tried _id, string match, and slug)`);
      console.error(`Actual Product ID used: ${actualProductId}`);
      console.error(`Is valid ObjectId: ${ObjectId.isValid(actualProductId)}`);
      
      // List first 5 products for reference
      const sampleProducts = await products.find({}).limit(5).toArray();
      console.error('\nSample product IDs for reference:');
      sampleProducts.forEach((p: any) => {
        console.error(`  - ${p._id.toString()}: ${p.name}`);
      });
      
      process.exit(1);
    }
    
    console.log('\n=== PRODUCT INFO ===');
    console.log(`Name: ${product.name}`);
    console.log(`ID: ${product._id}`);
    
    console.log('\n=== VARIANTS (product.variants) ===');
    if (product.variants && Array.isArray(product.variants)) {
      console.log(`Count: ${product.variants.length}`);
      product.variants.forEach((v: any, idx: number) => {
        console.log(`\nVariant ${idx + 1}:`);
        console.log(JSON.stringify(v, null, 2));
      });
    } else {
      console.log('No variants array found');
    }
    
    console.log('\n=== PRODUCT DATA META BOX ===');
    if (product.productDataMetaBox) {
      console.log('Attributes:');
      if (product.productDataMetaBox.attributes) {
        product.productDataMetaBox.attributes.forEach((attr: any, idx: number) => {
          console.log(`\nAttribute ${idx + 1}:`);
          console.log(`  Name: ${attr.name}`);
          console.log(`  Values: ${JSON.stringify(attr.values)}`);
          console.log(`  ColorCodes: ${JSON.stringify(attr.colorCodes || {})}`);
        });
      }
      
      console.log('\nVariations (productDataMetaBox.variations):');
      if (product.productDataMetaBox.variations && Array.isArray(product.productDataMetaBox.variations)) {
        console.log(`Count: ${product.productDataMetaBox.variations.length}`);
        product.productDataMetaBox.variations.forEach((v: any, idx: number) => {
          console.log(`\nVariation ${idx + 1}:`);
          console.log(`  ID: ${v.id}`);
          console.log(`  Attributes: ${JSON.stringify(v.attributes || {})}`);
          console.log(`  RegularPrice: ${v.regularPrice}`);
          console.log(`  StockQuantity: ${v.stockQuantity}`);
        });
      } else {
        console.log('No variations found');
      }
    } else {
      console.log('No productDataMetaBox found');
    }
    
    console.log('\n=== EXTRACTED VARIANTS (as would be returned by API) ===');
    
    // Simulate the extraction logic
    let variants: any[] = [];
    
    // Priority 1: Use variants array
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      variants = product.variants.map((v: any) => ({
        id: v.id || '',
        size: v.size || '',
        color: v.color || undefined,
        colorCode: v.colorCode || undefined,
        price: v.price || 0,
        stock: v.stock || v.stockQuantity || 0,
        image: v.image || undefined,
        sku: v.sku || undefined,
      }));
    }
    // Priority 2: Convert from productDataMetaBox.variations
    else if (product.productDataMetaBox?.variations && product.productDataMetaBox.variations.length > 0) {
      const colorAttribute = product.productDataMetaBox?.attributes?.find((attr: any) => {
        const attrNameLower = (attr.name || '').toLowerCase();
        return attrNameLower.includes('color') || 
               attrNameLower === 'pa_color' || 
               attrNameLower === 'màu' ||
               attrNameLower === 'màu sắc';
      });
      const colorCodesMap = colorAttribute?.colorCodes || {};
      
      const sizeAttribute = product.productDataMetaBox?.attributes?.find((attr: any) => {
        const attrNameLower = (attr.name || '').toLowerCase();
        return attrNameLower.includes('size') || 
               attrNameLower === 'pa_size' || 
               attrNameLower === 'kích thước';
      });
      const sizeAttributeName = sizeAttribute?.name || '';
      const colorAttributeName = colorAttribute?.name || '';
      
      console.log(`\nSize Attribute Name: "${sizeAttributeName}"`);
      console.log(`Color Attribute Name: "${colorAttributeName}"`);
      console.log(`Color Codes Map: ${JSON.stringify(colorCodesMap)}`);
      
      variants = product.productDataMetaBox.variations.map((variation: any) => {
        let size = '';
        let color = '';
        let colorCode = '';
        
        if (variation.attributes && typeof variation.attributes === 'object') {
          console.log(`\nProcessing variation ${variation.id}:`);
          console.log(`  Attributes object: ${JSON.stringify(variation.attributes)}`);
          
          Object.entries(variation.attributes).forEach(([attrName, value]) => {
            const attrNameLower = attrName.toLowerCase().trim();
            const valueStr = String(value).trim();
            
            console.log(`  Checking attribute: "${attrName}" = "${valueStr}"`);
            
            const isSizeAttr = sizeAttributeName ? (
              attrName === sizeAttributeName ||
              attrNameLower === sizeAttributeName.toLowerCase() ||
              attrNameLower.includes('size') || 
              attrNameLower === 'pa_size' || 
              attrNameLower === 'kích thước' ||
              attrNameLower.includes('kích thước')
            ) : (
              attrNameLower.includes('size') || 
              attrNameLower === 'pa_size' || 
              attrNameLower === 'kích thước' ||
              attrNameLower.includes('kích thước')
            );
            
            const isColorAttr = colorAttributeName ? (
              attrName === colorAttributeName ||
              attrNameLower === colorAttributeName.toLowerCase() ||
              attrNameLower.includes('color') || 
              attrNameLower === 'pa_color' || 
              attrNameLower === 'màu' ||
              attrNameLower === 'màu sắc' ||
              attrNameLower.includes('màu')
            ) : (
              attrNameLower.includes('color') || 
              attrNameLower === 'pa_color' || 
              attrNameLower === 'màu' ||
              attrNameLower === 'màu sắc' ||
              attrNameLower.includes('màu')
            );
            
            if (isSizeAttr && !size) {
              size = valueStr;
              console.log(`    ✓ Matched as SIZE: "${size}"`);
            } else if (isColorAttr && !color) {
              color = valueStr;
              colorCode = colorCodesMap[valueStr] || 
                         colorCodesMap[valueStr.toLowerCase()] || 
                         colorCodesMap[valueStr.toUpperCase()] ||
                         colorCodesMap[valueStr.trim()] ||
                         '';
              console.log(`    ✓ Matched as COLOR: "${color}", colorCode: "${colorCode}"`);
            } else {
              console.log(`    ✗ Not matched (isSizeAttr: ${isSizeAttr}, isColorAttr: ${isColorAttr})`);
            }
          });
        }
        
        const price = variation.salePrice && variation.regularPrice && variation.salePrice < variation.regularPrice
          ? variation.salePrice
          : variation.regularPrice || 0;
        
        return {
          id: variation.id || '',
          size,
          color: color || undefined,
          colorCode: colorCode || undefined,
          price,
          stock: variation.stockQuantity || 0,
          image: variation.image || undefined,
          sku: variation.sku || undefined,
        };
      });
    }
    
    console.log('\n=== FINAL EXTRACTED VARIANTS ===');
    variants.forEach((v, idx) => {
      console.log(`\nVariant ${idx + 1}:`);
      console.log(JSON.stringify(v, null, 2));
    });
    
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

// Get product ID from command line
const productId = process.argv[2];
if (!productId) {
  console.error('Usage: tsx scripts/debug-product-variants.ts <productId>');
  process.exit(1);
}

debugProductVariants(productId).catch(console.error);

