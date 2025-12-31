/**
 * Inventory Repository
 * Data access layer cho module quan ly kho
 */

import { ObjectId, type Collection, type WithId, type Document } from 'mongodb';
import { getCollections } from '@/lib/db';
import type {
  InventoryItem,
  InventoryVariantItem,
  InventorySummary,
  InventoryOverviewResponse,
  InventoryFilters,
  InventoryMovement,
  InventoryMovementResult,
  MovementFilters,
  InventoryAdjustment,
  StockAlertItem,
  LowStockResponse,
  AdjustStockResponse,
  StockStatus,
  MovementType,
  AlertSeverity,
} from '@/types/inventory';
import {
  getManageStock,
  getProductStockQuantity,
  getProductReservedQuantity,
  getProductAvailableQuantity,
  getVariantStockQuantity,
  getVariantReservedQuantity,
  getVariantAvailableQuantity,
  getLowStockThreshold,
  isLowStock,
  isVariantLowStock,
  buildStockQuantityIncrement,
  buildVariantStockIncrement,
  calculateStockStatus,
  buildStockStatusUpdate,
  type ProductLike,
  type VariantLike,
} from '@/lib/utils/inventoryUtils';

// Type alias for MongoDB documents cast to ProductLike
type ProductDoc = ProductLike & { _id: ObjectId; name?: string; sku?: string; images?: Array<{ src?: string }>; updatedAt?: Date };

// ============================================
// Helper Functions
// ============================================

function mapMovementToResult(movement: WithId<Document>): InventoryMovementResult {
  return {
    _id: movement._id.toString(),
    productId: movement.productId?.toString() || '',
    variationId: movement.variationId,
    sku: movement.sku,
    productName: movement.productName || '',
    type: movement.type as MovementType,
    quantity: movement.quantity || 0,
    direction: movement.direction || 1,
    previousStock: movement.previousStock || 0,
    newStock: movement.newStock || 0,
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    reason: movement.reason,
    createdBy: movement.createdBy?.toString(),
    createdByName: movement.createdByName,
    createdAt: movement.createdAt?.toISOString() || new Date().toISOString(),
  };
}

function getAlertSeverity(available: number, threshold: number): AlertSeverity {
  if (available <= 0) return 'out_of_stock';
  if (available <= threshold / 2) return 'critical';
  return 'warning';
}

// ============================================
// Repository Functions
// ============================================

/**
 * Lay danh sach inventory overview
 */
export async function getInventoryOverview(
  filters: InventoryFilters = {}
): Promise<InventoryOverviewResponse> {
  const { products: productsCollection } = await getCollections();

  const {
    search,
    category,
    stockStatus = 'all',
    page = 1,
    perPage = 20,
    sortBy = 'stock',
    sortOrder = 'asc',
  } = filters;

  // Build base query conditions
  const baseConditions: Record<string, unknown>[] = [
    { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] },
    { status: { $ne: 'trash' } },
  ];

  // Add search condition
  if (search) {
    baseConditions.push({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
      ],
    });
  }

  // Add category condition
  if (category) {
    baseConditions.push({ categories: new ObjectId(category) });
  }

  // Combine all conditions with $and
  const query = { $and: baseConditions };

  // Get total count for pagination
  const total = await productsCollection.countDocuments(query);

  // Build sort
  const sortField =
    sortBy === 'stock'
      ? 'stockQuantity'
      : sortBy === 'name'
        ? 'name'
        : sortBy === 'sku'
          ? 'sku'
          : 'updatedAt';
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

  // Fetch products
  const productsRaw = await productsCollection
    .find(query)
    .sort(sort)
    .skip((page - 1) * perPage)
    .limit(perPage)
    .toArray();

  // Cast to ProductDoc for type safety
  const products = productsRaw as unknown as ProductDoc[];

  // Map to InventoryItem
  const items: InventoryItem[] = [];
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalVariants = 0;

  for (const product of products) {
    const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;
    const productType = hasVariants ? 'variable' : 'simple';

    let stockQuantity = 0;
    let reservedQuantity = 0;
    let availableQuantity = 0;
    let productIsLowStock = false;
    const variants: InventoryVariantItem[] = [];

    if (hasVariants && product.variants) {
      // Variable product - aggregate from variants
      for (const variant of product.variants) {
        const variantStock = getVariantStockQuantity(variant);
        const variantReserved = getVariantReservedQuantity(variant);
        const variantAvailable = getVariantAvailableQuantity(variant);
        const threshold = getLowStockThreshold(product);
        const variantIsLowStock = isVariantLowStock(variant, threshold);

        stockQuantity += variantStock;
        reservedQuantity += variantReserved;
        availableQuantity += variantAvailable;
        totalVariants++;

        if (variantIsLowStock) {
          lowStockCount++;
          productIsLowStock = true;
        }
        if (variantAvailable <= 0) {
          outOfStockCount++;
        }

        variants.push({
          variationId: variant.id || '',
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stockQuantity: variantStock,
          reservedQuantity: variantReserved,
          availableQuantity: variantAvailable,
          isLowStock: variantIsLowStock,
        });
      }
    } else {
      // Simple product
      stockQuantity = getProductStockQuantity(product);
      reservedQuantity = getProductReservedQuantity(product);
      availableQuantity = getProductAvailableQuantity(product);
      productIsLowStock = isLowStock(product);

      if (productIsLowStock) {
        lowStockCount++;
      }
      if (availableQuantity <= 0) {
        outOfStockCount++;
      }
    }

    // Filter by stockStatus
    // NOTE: This post-fetch filtering may cause pagination to return fewer items than perPage
    // For accurate pagination with stockStatus filter, consider using MongoDB aggregation
    // For now, we skip filtered items but this affects the actual items count per page
    if (stockStatus === 'low' && !productIsLowStock) continue;
    if (stockStatus === 'out' && availableQuantity > 0) continue;
    if (stockStatus === 'in' && availableQuantity <= 0) continue;

    const item: InventoryItem = {
      productId: product._id.toString(),
      productName: product.name || 'Unnamed',
      sku: product.sku,
      thumbnail: product.images?.[0]?.src,
      type: productType,
      stockStatus: (product.stockStatus as StockStatus) || 'instock',
      stockQuantity,
      reservedQuantity,
      availableQuantity,
      lowStockThreshold: getLowStockThreshold(product),
      isLowStock: productIsLowStock,
      variants: hasVariants ? variants : undefined,
      updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
    };

    items.push(item);
  }

  const summary: InventorySummary = {
    totalProducts: total,
    totalVariants,
    lowStockCount,
    outOfStockCount,
  };

  return {
    items,
    summary,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

/**
 * Lay danh sach san pham ton kho thap
 */
export async function getLowStockItems(
  threshold?: number,
  includeOutOfStock: boolean = true
): Promise<LowStockResponse> {
  const { products: productsCollection } = await getCollections();

  const query: Record<string, unknown> = {
    $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
    status: { $ne: 'trash' },
  };

  const productsRaw = await productsCollection.find(query).toArray();
  const products = productsRaw as unknown as ProductDoc[];

  const items: StockAlertItem[] = [];

  for (const product of products) {
    const productThreshold = threshold ?? getLowStockThreshold(product);
    const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;

    if (hasVariants && product.variants) {
      for (const variant of product.variants) {
        const available = getVariantAvailableQuantity(variant);

        if (available <= productThreshold) {
          if (!includeOutOfStock && available <= 0) continue;

          items.push({
            productId: product._id.toString(),
            productName: product.name || 'Unnamed',
            sku: variant.sku,
            thumbnail: product.images?.[0]?.src,
            variationId: variant.id,
            variationLabel: [variant.size, variant.color].filter(Boolean).join(' - '),
            currentStock: available,
            threshold: productThreshold,
            severity: getAlertSeverity(available, productThreshold),
          });
        }
      }
    } else {
      const available = getProductAvailableQuantity(product);

      if (available <= productThreshold && getManageStock(product)) {
        if (!includeOutOfStock && available <= 0) continue;

        items.push({
          productId: product._id.toString(),
          productName: product.name || 'Unnamed',
          sku: product.sku,
          thumbnail: product.images?.[0]?.src,
          currentStock: available,
          threshold: productThreshold,
          severity: getAlertSeverity(available, productThreshold),
        });
      }
    }
  }

  // Sort by severity (out_of_stock first, then critical, then warning)
  items.sort((a, b) => {
    const order = { out_of_stock: 0, critical: 1, warning: 2 };
    return order[a.severity] - order[b.severity];
  });

  return {
    items,
    total: items.length,
  };
}

/**
 * Dieu chinh stock
 */
export async function adjustStock(
  adjustment: InventoryAdjustment,
  adminUserName?: string
): Promise<AdjustStockResponse> {
  const { products: productsCollection } = await getCollections();

  const { productId, variationId, quantity, type, reason, referenceId, adjustedBy } = adjustment;

  // Get product
  const productRaw = await productsCollection.findOne({ _id: new ObjectId(productId) });
  if (!productRaw) {
    throw new Error(`Product not found: ${productId}`);
  }
  const product = productRaw as unknown as ProductDoc;

  let previousStock: number;
  let newStock: number;
  let updateOperation: Record<string, unknown>;

  if (variationId) {
    // Adjust variant stock
    const variantIndex = product.variants?.findIndex((v: { id?: string }) => v.id === variationId);
    if (variantIndex === undefined || variantIndex === -1) {
      throw new Error(`Variant not found: ${variationId}`);
    }

    const variant = product.variants![variantIndex];
    previousStock = getVariantStockQuantity(variant);
    newStock = previousStock + quantity;

    // Validate: prevent negative stock
    if (newStock < 0) {
      throw new Error(
        `Khong the giam ${Math.abs(quantity)} don vi. Ton kho hien tai: ${previousStock}`
      );
    }

    updateOperation = {
      $set: {
        [`variants.${variantIndex}.stock`]: newStock,
        [`variants.${variantIndex}.stockQuantity`]: newStock,
        updatedAt: new Date(),
      },
    };
  } else {
    // Adjust simple product stock
    previousStock = getProductStockQuantity(product);
    newStock = previousStock + quantity;

    // Validate: prevent negative stock
    if (newStock < 0) {
      throw new Error(
        `Khong the giam ${Math.abs(quantity)} don vi. Ton kho hien tai: ${previousStock}`
      );
    }

    const newStatus = calculateStockStatus(
      newStock - getProductReservedQuantity(product),
      product.productDataMetaBox?.backorders
    );

    updateOperation = {
      $set: {
        stockQuantity: newStock,
        'productDataMetaBox.stockQuantity': newStock,
        ...buildStockStatusUpdate(newStatus),
        updatedAt: new Date(),
      },
    };
  }

  // Update product
  await productsCollection.updateOne({ _id: new ObjectId(productId) }, updateOperation);

  // Create movement record
  const movement = await createMovement({
    productId: new ObjectId(productId),
    variationId,
    sku: variationId
      ? product.variants?.find((v: { id?: string }) => v.id === variationId)?.sku
      : product.sku,
    productName: product.name || 'Unnamed',
    type: 'adjustment',
    quantity: Math.abs(quantity),
    direction: quantity > 0 ? 1 : -1,
    previousStock,
    newStock,
    referenceType: type,
    referenceId,
    reason,
    createdBy: adjustedBy ? new ObjectId(adjustedBy) : undefined,
    createdByName: adminUserName,
  });

  const reserved = variationId
    ? getVariantReservedQuantity(product.variants?.find((v: { id?: string }) => v.id === variationId) || {})
    : getProductReservedQuantity(product);

  return {
    success: true,
    movement: mapMovementToResult(movement as WithId<Document>),
    newStock,
    newAvailable: Math.max(0, newStock - reserved),
  };
}

/**
 * Tao movement record
 */
async function createMovement(
  data: Omit<InventoryMovement, '_id' | 'createdAt'>
): Promise<InventoryMovement> {
  const { inventoryMovements } = await getCollections();

  const movement: Omit<InventoryMovement, '_id'> = {
    ...data,
    createdAt: new Date(),
  };

  const result = await inventoryMovements.insertOne(movement as Document);

  return {
    _id: result.insertedId,
    ...movement,
  } as InventoryMovement;
}

/**
 * Lay lich su movements
 */
export async function getMovements(
  filters: MovementFilters = {}
): Promise<{ items: InventoryMovementResult[]; total: number; page: number; perPage: number }> {
  const { inventoryMovements } = await getCollections();

  const {
    productId,
    variationId,
    sku,
    type,
    referenceType,
    startDate,
    endDate,
    page = 1,
    perPage = 20,
  } = filters;

  const query: Record<string, unknown> = {};

  if (productId) {
    query.productId = new ObjectId(productId);
  }
  if (variationId) {
    query.variationId = variationId;
  }
  if (sku) {
    query.sku = sku;
  }
  if (type) {
    query.type = type;
  }
  if (referenceType) {
    query.referenceType = referenceType;
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
    }
    if (endDate) {
      (query.createdAt as Record<string, Date>).$lte = new Date(endDate);
    }
  }

  const total = await inventoryMovements.countDocuments(query);

  const movements = await inventoryMovements
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage)
    .toArray();

  return {
    items: movements.map(mapMovementToResult),
    total,
    page,
    perPage,
  };
}

// Export repository object
export const inventoryRepository = {
  getOverview: getInventoryOverview,
  getLowStockItems,
  adjustStock,
  getMovements,
  createMovement,
};
