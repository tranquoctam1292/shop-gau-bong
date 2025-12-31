/**
 * Verify Stock Data Consistency Script
 *
 * Kiem tra tinh nhat quan cua du lieu stock giua cac fields:
 * - stock vs stockQuantity (variants)
 * - top-level vs productDataMetaBox (products)
 * - manageStock location consistency
 *
 * Usage:
 *   npx tsx scripts/inventory/verify-stock-data.ts
 *   npx tsx scripts/inventory/verify-stock-data.ts --fix  # Auto fix mismatches
 */

import { getCollections, closeDB, ObjectId } from '../../lib/db';

interface VerificationResult {
  totalProducts: number;
  totalVariants: number;
  issues: Issue[];
  summary: {
    variantStockMismatch: number;
    productStockMismatch: number;
    manageStockMismatch: number;
    orphanReservations: number;
    negativeStock: number;
  };
}

interface Issue {
  productId: string;
  productName: string;
  variationId?: string;
  issueType:
    | 'variant_stock_mismatch'
    | 'product_stock_mismatch'
    | 'manageStock_mismatch'
    | 'orphan_reservation'
    | 'negative_stock';
  description: string;
  currentValues: Record<string, unknown>;
  suggestedFix?: Record<string, unknown>;
}

async function verifyStockData(autoFix: boolean = false): Promise<VerificationResult> {
  console.log('🔍 Bat dau kiem tra du lieu stock...\n');

  const { products: productsCollection } = await getCollections();

  const products = await productsCollection
    .find({
      $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
      status: { $ne: 'trash' },
    })
    .toArray();

  const result: VerificationResult = {
    totalProducts: products.length,
    totalVariants: 0,
    issues: [],
    summary: {
      variantStockMismatch: 0,
      productStockMismatch: 0,
      manageStockMismatch: 0,
      orphanReservations: 0,
      negativeStock: 0,
    },
  };

  const fixOperations: Array<{
    filter: Record<string, unknown>;
    update: Record<string, unknown>;
  }> = [];

  for (const product of products) {
    const productId = product._id.toString();
    const productName = (product.name as string) || 'Unnamed';
    const productData = product as Record<string, unknown>;

    // 1. Check manageStock location mismatch
    const topLevelManageStock = productData.manageStock as boolean | undefined;
    const metaBoxManageStock = (productData.productDataMetaBox as Record<string, unknown>)
      ?.manageStock as boolean | undefined;

    if (
      topLevelManageStock !== undefined &&
      metaBoxManageStock !== undefined &&
      topLevelManageStock !== metaBoxManageStock
    ) {
      result.issues.push({
        productId,
        productName,
        issueType: 'manageStock_mismatch',
        description: `manageStock khong khop: top-level=${topLevelManageStock}, productDataMetaBox=${metaBoxManageStock}`,
        currentValues: {
          'manageStock (top-level)': topLevelManageStock,
          'productDataMetaBox.manageStock': metaBoxManageStock,
        },
        suggestedFix: {
          manageStock: metaBoxManageStock, // Prefer metaBox
          'productDataMetaBox.manageStock': metaBoxManageStock,
        },
      });
      result.summary.manageStockMismatch++;

      if (autoFix) {
        fixOperations.push({
          filter: { _id: new ObjectId(productId) },
          update: {
            $set: {
              manageStock: metaBoxManageStock,
            },
          },
        });
      }
    }

    // 2. Check stockQuantity location mismatch (simple products)
    const topLevelStockQty = productData.stockQuantity as number | undefined;
    const metaBoxStockQty = (productData.productDataMetaBox as Record<string, unknown>)
      ?.stockQuantity as number | undefined;

    if (
      topLevelStockQty !== undefined &&
      metaBoxStockQty !== undefined &&
      topLevelStockQty !== metaBoxStockQty
    ) {
      result.issues.push({
        productId,
        productName,
        issueType: 'product_stock_mismatch',
        description: `stockQuantity khong khop: top-level=${topLevelStockQty}, productDataMetaBox=${metaBoxStockQty}`,
        currentValues: {
          'stockQuantity (top-level)': topLevelStockQty,
          'productDataMetaBox.stockQuantity': metaBoxStockQty,
        },
        suggestedFix: {
          stockQuantity: Math.max(topLevelStockQty, metaBoxStockQty), // Use higher value
          'productDataMetaBox.stockQuantity': Math.max(topLevelStockQty, metaBoxStockQty),
        },
      });
      result.summary.productStockMismatch++;

      if (autoFix) {
        const correctValue = Math.max(topLevelStockQty, metaBoxStockQty);
        fixOperations.push({
          filter: { _id: new ObjectId(productId) },
          update: {
            $set: {
              stockQuantity: correctValue,
              'productDataMetaBox.stockQuantity': correctValue,
            },
          },
        });
      }
    }

    // 3. Check for negative stock at product level
    const reservedQty = (productData.reservedQuantity as number) || 0;
    const effectiveStock = metaBoxStockQty ?? topLevelStockQty ?? 0;

    if (effectiveStock < 0) {
      result.issues.push({
        productId,
        productName,
        issueType: 'negative_stock',
        description: `Stock am: ${effectiveStock}`,
        currentValues: {
          stockQuantity: effectiveStock,
          reservedQuantity: reservedQty,
        },
        suggestedFix: {
          stockQuantity: 0,
          'productDataMetaBox.stockQuantity': 0,
        },
      });
      result.summary.negativeStock++;

      if (autoFix) {
        fixOperations.push({
          filter: { _id: new ObjectId(productId) },
          update: {
            $set: {
              stockQuantity: 0,
              'productDataMetaBox.stockQuantity': 0,
            },
          },
        });
      }
    }

    // 4. Check orphan reservations (reserved > stock)
    if (reservedQty > effectiveStock && effectiveStock >= 0) {
      result.issues.push({
        productId,
        productName,
        issueType: 'orphan_reservation',
        description: `Reserved (${reservedQty}) > Stock (${effectiveStock})`,
        currentValues: {
          stockQuantity: effectiveStock,
          reservedQuantity: reservedQty,
        },
        suggestedFix: {
          reservedQuantity: Math.min(reservedQty, effectiveStock),
        },
      });
      result.summary.orphanReservations++;

      if (autoFix) {
        fixOperations.push({
          filter: { _id: new ObjectId(productId) },
          update: {
            $set: {
              reservedQuantity: Math.min(reservedQty, effectiveStock),
            },
          },
        });
      }
    }

    // 5. Check variants
    const variants = productData.variants as Array<Record<string, unknown>> | undefined;
    if (variants && Array.isArray(variants)) {
      result.totalVariants += variants.length;

      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        const variationId = (variant.id as string) || `index-${i}`;
        const variantStock = variant.stock as number | undefined;
        const variantStockQuantity = variant.stockQuantity as number | undefined;
        const variantReserved = (variant.reservedQuantity as number) || 0;

        // 5a. Check stock vs stockQuantity mismatch
        if (
          variantStock !== undefined &&
          variantStockQuantity !== undefined &&
          variantStock !== variantStockQuantity
        ) {
          result.issues.push({
            productId,
            productName,
            variationId,
            issueType: 'variant_stock_mismatch',
            description: `Variant ${variationId}: stock=${variantStock}, stockQuantity=${variantStockQuantity}`,
            currentValues: {
              stock: variantStock,
              stockQuantity: variantStockQuantity,
              size: variant.size,
              color: variant.color,
            },
            suggestedFix: {
              stock: Math.max(variantStock, variantStockQuantity),
              stockQuantity: Math.max(variantStock, variantStockQuantity),
            },
          });
          result.summary.variantStockMismatch++;

          if (autoFix) {
            const correctValue = Math.max(variantStock, variantStockQuantity);
            fixOperations.push({
              filter: { _id: new ObjectId(productId), 'variants.id': variationId },
              update: {
                $set: {
                  'variants.$.stock': correctValue,
                  'variants.$.stockQuantity': correctValue,
                },
              },
            });
          }
        }

        // 5b. Check negative variant stock
        const effectiveVariantStock = variantStockQuantity ?? variantStock ?? 0;
        if (effectiveVariantStock < 0) {
          result.issues.push({
            productId,
            productName,
            variationId,
            issueType: 'negative_stock',
            description: `Variant ${variationId}: Stock am = ${effectiveVariantStock}`,
            currentValues: {
              stock: variantStock,
              stockQuantity: variantStockQuantity,
            },
            suggestedFix: {
              stock: 0,
              stockQuantity: 0,
            },
          });
          result.summary.negativeStock++;

          if (autoFix) {
            fixOperations.push({
              filter: { _id: new ObjectId(productId), 'variants.id': variationId },
              update: {
                $set: {
                  'variants.$.stock': 0,
                  'variants.$.stockQuantity': 0,
                },
              },
            });
          }
        }

        // 5c. Check variant orphan reservations
        if (variantReserved > effectiveVariantStock && effectiveVariantStock >= 0) {
          result.issues.push({
            productId,
            productName,
            variationId,
            issueType: 'orphan_reservation',
            description: `Variant ${variationId}: Reserved (${variantReserved}) > Stock (${effectiveVariantStock})`,
            currentValues: {
              stock: effectiveVariantStock,
              reservedQuantity: variantReserved,
            },
            suggestedFix: {
              reservedQuantity: Math.min(variantReserved, effectiveVariantStock),
            },
          });
          result.summary.orphanReservations++;

          if (autoFix) {
            fixOperations.push({
              filter: { _id: new ObjectId(productId), 'variants.id': variationId },
              update: {
                $set: {
                  'variants.$.reservedQuantity': Math.min(variantReserved, effectiveVariantStock),
                },
              },
            });
          }
        }
      }
    }
  }

  // Apply fixes if autoFix is enabled
  if (autoFix && fixOperations.length > 0) {
    console.log(`\n🔧 Dang ap dung ${fixOperations.length} sua chua...\n`);

    for (const op of fixOperations) {
      try {
        await productsCollection.updateOne(op.filter, op.update);
      } catch (error) {
        console.error(`❌ Loi khi update:`, op.filter, error);
      }
    }

    console.log(`✅ Da ap dung ${fixOperations.length} sua chua.\n`);
  }

  return result;
}

function printReport(result: VerificationResult, autoFix: boolean): void {
  console.log('═'.repeat(60));
  console.log('📊 BAO CAO KIEM TRA DU LIEU STOCK');
  console.log('═'.repeat(60));

  console.log(`\n📦 Tong so products: ${result.totalProducts}`);
  console.log(`📦 Tong so variants: ${result.totalVariants}`);

  console.log('\n📈 THONG KE VAN DE:');
  console.log('─'.repeat(40));
  console.log(`  • Variant stock mismatch:    ${result.summary.variantStockMismatch}`);
  console.log(`  • Product stock mismatch:    ${result.summary.productStockMismatch}`);
  console.log(`  • ManageStock mismatch:      ${result.summary.manageStockMismatch}`);
  console.log(`  • Orphan reservations:       ${result.summary.orphanReservations}`);
  console.log(`  • Negative stock:            ${result.summary.negativeStock}`);
  console.log('─'.repeat(40));
  console.log(`  TONG CONG:                   ${result.issues.length}`);

  if (result.issues.length > 0) {
    console.log('\n⚠️  CHI TIET VAN DE:');
    console.log('─'.repeat(60));

    // Group by issue type
    const grouped = new Map<string, Issue[]>();
    for (const issue of result.issues) {
      const key = issue.issueType;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(issue);
    }

    for (const [type, issues] of grouped) {
      console.log(`\n[${type.toUpperCase()}] (${issues.length} van de)`);

      // Only show first 5 of each type
      const displayIssues = issues.slice(0, 5);
      for (const issue of displayIssues) {
        console.log(`  • ${issue.productName} (${issue.productId})`);
        if (issue.variationId) {
          console.log(`    Variant: ${issue.variationId}`);
        }
        console.log(`    ${issue.description}`);
      }

      if (issues.length > 5) {
        console.log(`    ... va ${issues.length - 5} van de khac`);
      }
    }
  }

  console.log('\n' + '═'.repeat(60));

  if (result.issues.length === 0) {
    console.log('✅ KHONG CO VAN DE NAO DUOC PHAT HIEN!');
  } else if (autoFix) {
    console.log('✅ DA TU DONG SUA CAC VAN DE.');
  } else {
    console.log('💡 Chay lai voi --fix de tu dong sua cac van de.');
  }

  console.log('═'.repeat(60) + '\n');
}

async function main(): Promise<void> {
  const autoFix = process.argv.includes('--fix');

  if (autoFix) {
    console.log('⚠️  CHE DO AUTO-FIX DUOC BAT!\n');
  }

  try {
    const result = await verifyStockData(autoFix);
    printReport(result, autoFix);

    // Exit with error code if issues found and not auto-fixing
    if (result.issues.length > 0 && !autoFix) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Loi khi kiem tra:', error);
    process.exit(1);
  } finally {
    await closeDB();
  }
}

main();
