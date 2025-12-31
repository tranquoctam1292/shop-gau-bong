/**
 * Script phan tich trang thai data inventory hien tai
 * Chay: npx ts-node scripts/inventory/analyze-inventory-data.ts
 *
 * Muc dich:
 * - Kiem tra so luong products co stock/stockQuantity khong dong bo
 * - Kiem tra manageStock o top-level vs productDataMetaBox
 * - Tao bao cao truoc khi migration
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface AnalysisReport {
  totalProducts: number;
  variantAnalysis: {
    totalWithVariants: number;
    stockFieldOnly: number;
    stockQuantityFieldOnly: number;
    bothFields: number;
    bothFieldsMismatch: number;
    neitherField: number;
  };
  manageStockAnalysis: {
    topLevelOnly: number;
    metaBoxOnly: number;
    bothLocations: number;
    bothLocationsMismatch: number;
    neitherLocation: number;
  };
  stockQuantityAnalysis: {
    topLevelOnly: number;
    metaBoxOnly: number;
    bothLocations: number;
    bothLocationsMismatch: number;
  };
  reservedQuantityAnalysis: {
    hasReservedQty: number;
    hasNonZeroReserved: number;
  };
  sampleMismatchProducts: Array<{
    _id: string;
    name: string;
    issue: string;
    details: Record<string, unknown>;
  }>;
}

async function analyzeInventoryData(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db();
    const products = db.collection('products');

    const report: AnalysisReport = {
      totalProducts: 0,
      variantAnalysis: {
        totalWithVariants: 0,
        stockFieldOnly: 0,
        stockQuantityFieldOnly: 0,
        bothFields: 0,
        bothFieldsMismatch: 0,
        neitherField: 0,
      },
      manageStockAnalysis: {
        topLevelOnly: 0,
        metaBoxOnly: 0,
        bothLocations: 0,
        bothLocationsMismatch: 0,
        neitherLocation: 0,
      },
      stockQuantityAnalysis: {
        topLevelOnly: 0,
        metaBoxOnly: 0,
        bothLocations: 0,
        bothLocationsMismatch: 0,
      },
      reservedQuantityAnalysis: {
        hasReservedQty: 0,
        hasNonZeroReserved: 0,
      },
      sampleMismatchProducts: [],
    };

    // Get all products (excluding deleted)
    const cursor = products.find({
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    });

    const allProducts = await cursor.toArray();
    report.totalProducts = allProducts.length;

    console.log(`Analyzing ${report.totalProducts} products...\n`);

    for (const product of allProducts) {
      const productId = product._id.toString();
      const productName = product.name || 'Unnamed';

      // 1. Analyze variants stock fields
      if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        report.variantAnalysis.totalWithVariants++;

        for (const variant of product.variants) {
          const hasStock = variant.stock !== undefined && variant.stock !== null;
          const hasStockQuantity = variant.stockQuantity !== undefined && variant.stockQuantity !== null;

          if (hasStock && hasStockQuantity) {
            report.variantAnalysis.bothFields++;
            if (variant.stock !== variant.stockQuantity) {
              report.variantAnalysis.bothFieldsMismatch++;
              if (report.sampleMismatchProducts.length < 10) {
                report.sampleMismatchProducts.push({
                  _id: productId,
                  name: productName,
                  issue: 'variant_stock_mismatch',
                  details: {
                    variantId: variant.id,
                    stock: variant.stock,
                    stockQuantity: variant.stockQuantity,
                  },
                });
              }
            }
          } else if (hasStock) {
            report.variantAnalysis.stockFieldOnly++;
          } else if (hasStockQuantity) {
            report.variantAnalysis.stockQuantityFieldOnly++;
          } else {
            report.variantAnalysis.neitherField++;
          }
        }
      }

      // 2. Analyze manageStock locations
      const hasTopLevelManageStock = product.manageStock !== undefined;
      const hasMetaBoxManageStock = product.productDataMetaBox?.manageStock !== undefined;

      if (hasTopLevelManageStock && hasMetaBoxManageStock) {
        report.manageStockAnalysis.bothLocations++;
        if (product.manageStock !== product.productDataMetaBox.manageStock) {
          report.manageStockAnalysis.bothLocationsMismatch++;
          if (report.sampleMismatchProducts.length < 10) {
            report.sampleMismatchProducts.push({
              _id: productId,
              name: productName,
              issue: 'manageStock_mismatch',
              details: {
                topLevel: product.manageStock,
                metaBox: product.productDataMetaBox.manageStock,
              },
            });
          }
        }
      } else if (hasTopLevelManageStock) {
        report.manageStockAnalysis.topLevelOnly++;
      } else if (hasMetaBoxManageStock) {
        report.manageStockAnalysis.metaBoxOnly++;
      } else {
        report.manageStockAnalysis.neitherLocation++;
      }

      // 3. Analyze stockQuantity locations (simple products)
      const hasTopLevelStockQty = product.stockQuantity !== undefined && product.stockQuantity !== null;
      const hasMetaBoxStockQty =
        product.productDataMetaBox?.stockQuantity !== undefined &&
        product.productDataMetaBox?.stockQuantity !== null;

      if (hasTopLevelStockQty && hasMetaBoxStockQty) {
        report.stockQuantityAnalysis.bothLocations++;
        if (product.stockQuantity !== product.productDataMetaBox.stockQuantity) {
          report.stockQuantityAnalysis.bothLocationsMismatch++;
          if (report.sampleMismatchProducts.length < 10) {
            report.sampleMismatchProducts.push({
              _id: productId,
              name: productName,
              issue: 'stockQuantity_mismatch',
              details: {
                topLevel: product.stockQuantity,
                metaBox: product.productDataMetaBox.stockQuantity,
              },
            });
          }
        }
      } else if (hasTopLevelStockQty) {
        report.stockQuantityAnalysis.topLevelOnly++;
      } else if (hasMetaBoxStockQty) {
        report.stockQuantityAnalysis.metaBoxOnly++;
      }

      // 4. Analyze reservedQuantity
      if (product.reservedQuantity !== undefined) {
        report.reservedQuantityAnalysis.hasReservedQty++;
        if (product.reservedQuantity > 0) {
          report.reservedQuantityAnalysis.hasNonZeroReserved++;
        }
      }
    }

    // Print report
    console.log('='.repeat(60));
    console.log('INVENTORY DATA ANALYSIS REPORT');
    console.log('='.repeat(60));
    console.log(`\nTotal Products: ${report.totalProducts}`);

    console.log('\n--- VARIANT STOCK ANALYSIS ---');
    console.log(`Products with variants: ${report.variantAnalysis.totalWithVariants}`);
    console.log(`  - stock field only: ${report.variantAnalysis.stockFieldOnly}`);
    console.log(`  - stockQuantity field only: ${report.variantAnalysis.stockQuantityFieldOnly}`);
    console.log(`  - Both fields: ${report.variantAnalysis.bothFields}`);
    console.log(`  - Both fields MISMATCH: ${report.variantAnalysis.bothFieldsMismatch} ⚠️`);
    console.log(`  - Neither field: ${report.variantAnalysis.neitherField}`);

    console.log('\n--- MANAGE STOCK ANALYSIS ---');
    console.log(`  - Top-level only: ${report.manageStockAnalysis.topLevelOnly}`);
    console.log(`  - MetaBox only: ${report.manageStockAnalysis.metaBoxOnly}`);
    console.log(`  - Both locations: ${report.manageStockAnalysis.bothLocations}`);
    console.log(`  - Both locations MISMATCH: ${report.manageStockAnalysis.bothLocationsMismatch} ⚠️`);
    console.log(`  - Neither location: ${report.manageStockAnalysis.neitherLocation}`);

    console.log('\n--- STOCK QUANTITY ANALYSIS (Simple Products) ---');
    console.log(`  - Top-level only: ${report.stockQuantityAnalysis.topLevelOnly}`);
    console.log(`  - MetaBox only: ${report.stockQuantityAnalysis.metaBoxOnly}`);
    console.log(`  - Both locations: ${report.stockQuantityAnalysis.bothLocations}`);
    console.log(`  - Both locations MISMATCH: ${report.stockQuantityAnalysis.bothLocationsMismatch} ⚠️`);

    console.log('\n--- RESERVED QUANTITY ANALYSIS ---');
    console.log(`  - Has reservedQuantity field: ${report.reservedQuantityAnalysis.hasReservedQty}`);
    console.log(`  - Has non-zero reserved: ${report.reservedQuantityAnalysis.hasNonZeroReserved}`);

    if (report.sampleMismatchProducts.length > 0) {
      console.log('\n--- SAMPLE MISMATCH PRODUCTS (max 10) ---');
      for (const sample of report.sampleMismatchProducts) {
        console.log(`\n  Product: ${sample.name} (${sample._id})`);
        console.log(`  Issue: ${sample.issue}`);
        console.log(`  Details: ${JSON.stringify(sample.details)}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATIONS:');
    console.log('='.repeat(60));

    if (report.variantAnalysis.bothFieldsMismatch > 0) {
      console.log(`\n⚠️  ${report.variantAnalysis.bothFieldsMismatch} variants have mismatched stock/stockQuantity`);
      console.log('   → Need manual review before migration');
    }

    if (report.manageStockAnalysis.bothLocationsMismatch > 0) {
      console.log(`\n⚠️  ${report.manageStockAnalysis.bothLocationsMismatch} products have mismatched manageStock`);
      console.log('   → Recommend using productDataMetaBox value as source of truth');
    }

    if (report.stockQuantityAnalysis.bothLocationsMismatch > 0) {
      console.log(`\n⚠️  ${report.stockQuantityAnalysis.bothLocationsMismatch} products have mismatched stockQuantity`);
      console.log('   → Recommend using productDataMetaBox value as source of truth');
    }

    if (report.reservedQuantityAnalysis.hasNonZeroReserved > 0) {
      console.log(`\n⚠️  ${report.reservedQuantityAnalysis.hasNonZeroReserved} products have pending reservations`);
      console.log('   → Complete or cancel pending orders before migration');
    }

    console.log('\n');
  } catch (error) {
    console.error('Error analyzing inventory data:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run
analyzeInventoryData();
