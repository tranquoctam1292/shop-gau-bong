/**
 * Migration Script: Consolidate Stock Fields
 * Chay: npx ts-node scripts/inventory/migrate-stock-fields.ts
 *
 * Muc dich:
 * 1. Merge variant.stock -> variant.stockQuantity
 * 2. Merge product.manageStock -> product.productDataMetaBox.manageStock
 * 3. Merge product.stockQuantity -> product.productDataMetaBox.stockQuantity
 *
 * IMPORTANT:
 * - Chay analyze-inventory-data.ts truoc de xem bao cao
 * - Backup database truoc khi chay migration
 * - Chay tren staging truoc khi production
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config({ path: '.env.local' });

interface MigrationStats {
  totalProducts: number;
  variantsMigrated: number;
  manageStockMigrated: number;
  stockQuantityMigrated: number;
  errors: Array<{ productId: string; error: string }>;
}

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

async function confirmMigration(): Promise<boolean> {
  if (FORCE) return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '\n⚠️  This will modify your database. Are you sure? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

async function migrateStockFields(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('INVENTORY STOCK FIELDS MIGRATION');
  console.log('='.repeat(60));
  console.log(`\nMode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE MIGRATION'}`);

  if (!DRY_RUN) {
    const confirmed = await confirmMigration();
    if (!confirmed) {
      console.log('Migration cancelled.');
      process.exit(0);
    }
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('\nConnected to MongoDB\n');

    const db = client.db();
    const products = db.collection('products');

    const stats: MigrationStats = {
      totalProducts: 0,
      variantsMigrated: 0,
      manageStockMigrated: 0,
      stockQuantityMigrated: 0,
      errors: [],
    };

    // Get all products
    const allProducts = await products
      .find({
        $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
      })
      .toArray();

    stats.totalProducts = allProducts.length;
    console.log(`Processing ${stats.totalProducts} products...\n`);

    for (const product of allProducts) {
      const productId = product._id.toString();
      const updateOperations: Record<string, unknown> = {};

      try {
        // 1. Migrate variant stock -> stockQuantity
        if (product.variants && Array.isArray(product.variants)) {
          let variantUpdated = false;
          const updatedVariants = product.variants.map((variant: Record<string, unknown>, index: number) => {
            const hasStock = variant.stock !== undefined && variant.stock !== null;
            const hasStockQuantity = variant.stockQuantity !== undefined && variant.stockQuantity !== null;

            // Neu chi co stock, copy sang stockQuantity
            if (hasStock && !hasStockQuantity) {
              variantUpdated = true;
              stats.variantsMigrated++;
              return {
                ...variant,
                stockQuantity: variant.stock,
              };
            }

            // Neu ca 2 khac nhau, uu tien stockQuantity va cap nhat stock
            if (hasStock && hasStockQuantity && variant.stock !== variant.stockQuantity) {
              variantUpdated = true;
              stats.variantsMigrated++;
              // Uu tien stockQuantity (newer field)
              return {
                ...variant,
                stock: variant.stockQuantity,
              };
            }

            // Neu chi co stockQuantity, them stock
            if (!hasStock && hasStockQuantity) {
              variantUpdated = true;
              stats.variantsMigrated++;
              return {
                ...variant,
                stock: variant.stockQuantity,
              };
            }

            return variant;
          });

          if (variantUpdated) {
            updateOperations['variants'] = updatedVariants;
          }
        }

        // 2. Migrate manageStock to productDataMetaBox
        const hasTopLevelManageStock = product.manageStock !== undefined;
        const hasMetaBoxManageStock = product.productDataMetaBox?.manageStock !== undefined;

        if (hasTopLevelManageStock && !hasMetaBoxManageStock) {
          // Copy top-level to metaBox
          updateOperations['productDataMetaBox.manageStock'] = product.manageStock;
          stats.manageStockMigrated++;
        } else if (hasTopLevelManageStock && hasMetaBoxManageStock) {
          // Sync: set top-level to match metaBox (metaBox is source of truth)
          if (product.manageStock !== product.productDataMetaBox.manageStock) {
            updateOperations['manageStock'] = product.productDataMetaBox.manageStock;
            stats.manageStockMigrated++;
          }
        }

        // 3. Migrate stockQuantity to productDataMetaBox
        const hasTopLevelStockQty =
          product.stockQuantity !== undefined && product.stockQuantity !== null;
        const hasMetaBoxStockQty =
          product.productDataMetaBox?.stockQuantity !== undefined &&
          product.productDataMetaBox?.stockQuantity !== null;

        if (hasTopLevelStockQty && !hasMetaBoxStockQty) {
          // Copy top-level to metaBox
          updateOperations['productDataMetaBox.stockQuantity'] = product.stockQuantity;
          stats.stockQuantityMigrated++;
        } else if (hasTopLevelStockQty && hasMetaBoxStockQty) {
          // Sync: set top-level to match metaBox (metaBox is source of truth)
          if (product.stockQuantity !== product.productDataMetaBox.stockQuantity) {
            updateOperations['stockQuantity'] = product.productDataMetaBox.stockQuantity;
            stats.stockQuantityMigrated++;
          }
        }

        // Apply updates
        if (Object.keys(updateOperations).length > 0) {
          if (DRY_RUN) {
            console.log(`[DRY RUN] Would update product ${productId}:`);
            console.log(`  Updates: ${JSON.stringify(Object.keys(updateOperations))}`);
          } else {
            await products.updateOne(
              { _id: new ObjectId(productId) },
              {
                $set: {
                  ...updateOperations,
                  updatedAt: new Date(),
                },
              }
            );
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        stats.errors.push({ productId, error: errorMessage });
        console.error(`Error processing product ${productId}: ${errorMessage}`);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nTotal products processed: ${stats.totalProducts}`);
    console.log(`Variants migrated: ${stats.variantsMigrated}`);
    console.log(`manageStock migrated: ${stats.manageStockMigrated}`);
    console.log(`stockQuantity migrated: ${stats.stockQuantityMigrated}`);
    console.log(`Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n--- ERRORS ---');
      for (const err of stats.errors) {
        console.log(`  Product ${err.productId}: ${err.error}`);
      }
    }

    if (DRY_RUN) {
      console.log('\n✅ DRY RUN complete. No changes were made.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Migration complete!');
    }

    console.log('\n');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run
migrateStockFields();
