/**
 * Stock Forecast API
 * GET /api/admin/inventory/forecast
 *
 * Dự báo thời gian hết hàng dựa trên lịch sử bán hàng
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { getCollections, ObjectId } from '@/lib/db';
import type { StockForecastItem, StockForecastSummary, StockForecastResponse } from '@/types/inventory';
import { getManageStock, getProductStockQuantity, ProductLike, VariantLike } from '@/lib/utils/inventoryUtils';
import { getCached, setCache } from '@/lib/utils/inventoryCache';

interface ProductSalesData {
  productId: string;
  variationId?: string;
  totalQuantity: number;
  orderCount: number;
  firstOrderDate: Date;
  lastOrderDate: Date;
  recentSales: number; // Sales in first half of period
  olderSales: number; // Sales in second half of period
}

export async function GET(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);

      // Parse params
      const daysToAnalyze = parseInt(searchParams.get('daysToAnalyze') || '30', 10);
      const daysToForecast = parseInt(searchParams.get('daysToForecast') || '30', 10);
      const criticalThreshold = parseInt(searchParams.get('criticalThreshold') || '7', 10);
      const minSales = parseInt(searchParams.get('minSales') || '0', 10);

      // Check cache first
      const cacheParams = { daysToAnalyze, daysToForecast, criticalThreshold, minSales };
      const cached = getCached<StockForecastResponse>('forecast', cacheParams);
      if (cached) {
        return NextResponse.json(cached);
      }

      const { products, orders } = await getCollections();

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToAnalyze);

      const midDate = new Date();
      midDate.setDate(midDate.getDate() - Math.floor(daysToAnalyze / 2));

      // Aggregate sales data from orders
      const salesData = await orders.aggregate<{
        _id: { productId: string; variationId?: string };
        totalQuantity: number;
        orderCount: number;
        firstOrderDate: Date;
        lastOrderDate: Date;
        orders: Array<{ date: Date; quantity: number }>;
      }>([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'processing', 'shipped', 'delivered'] }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              productId: '$items.productId',
              variationId: '$items.variationId'
            },
            totalQuantity: { $sum: '$items.quantity' },
            orderCount: { $sum: 1 },
            firstOrderDate: { $min: '$createdAt' },
            lastOrderDate: { $max: '$createdAt' },
            orders: {
              $push: {
                date: '$createdAt',
                quantity: '$items.quantity'
              }
            }
          }
        }
      ]).toArray();

      // Process sales data to calculate trends
      const salesMap = new Map<string, ProductSalesData>();

      for (const sale of salesData) {
        const key = sale._id.variationId
          ? `${sale._id.productId}:${sale._id.variationId}`
          : sale._id.productId;

        // Calculate recent vs older sales for trend
        let recentSales = 0;
        let olderSales = 0;

        for (const order of sale.orders) {
          const orderDate = new Date(order.date);
          if (orderDate >= midDate) {
            recentSales += order.quantity;
          } else {
            olderSales += order.quantity;
          }
        }

        salesMap.set(key, {
          productId: sale._id.productId,
          variationId: sale._id.variationId,
          totalQuantity: sale.totalQuantity,
          orderCount: sale.orderCount,
          firstOrderDate: sale.firstOrderDate,
          lastOrderDate: sale.lastOrderDate,
          recentSales,
          olderSales
        });
      }

      // Get all products with stock management
      const productsList = await products.find({
        status: { $ne: 'trash' },
        deletedAt: { $exists: false }
      }).toArray();

      const forecastItems: StockForecastItem[] = [];

      for (const productDoc of productsList) {
        const product = productDoc as unknown as ProductLike & {
          _id: ObjectId;
          name?: string;
          sku?: string;
          images?: Array<{ src?: string }>;
          reservedQuantity?: number;
        };
        const manageStock = getManageStock(product);
        if (!manageStock) continue;

        const productId = product._id.toString();
        const productName = product.name || 'Unknown';
        const thumbnail = product.images?.[0]?.src || undefined;

        // Handle variable products
        if (product.variants && product.variants.length > 0) {
          for (const variantItem of product.variants) {
            const variant = variantItem as VariantLike & { _id?: { toString: () => string } };
            const variationId = variant.id || variant._id?.toString();
            if (!variationId) continue;

            const key = `${productId}:${variationId}`;
            const sales = salesMap.get(key);

            const currentStock = variant.stock || variant.stockQuantity || 0;
            const reservedQuantity = variant.reservedQuantity || 0;
            const availableStock = currentStock - reservedQuantity;

            if (currentStock === 0 && !sales) continue; // Skip empty variants with no sales

            const forecast = calculateForecast(
              availableStock,
              sales,
              daysToAnalyze,
              daysToForecast,
              minSales
            );

            forecastItems.push({
              productId,
              productName,
              sku: variant.sku || product.sku,
              thumbnail,
              variationId,
              variationLabel: formatVariantLabel(variant),
              currentStock,
              reservedQuantity,
              availableStock,
              ...forecast
            });
          }
        } else {
          // Simple product
          const sales = salesMap.get(productId);

          const currentStock = getProductStockQuantity(product);
          const reservedQuantity = product.reservedQuantity || 0;
          const availableStock = currentStock - reservedQuantity;

          if (currentStock === 0 && !sales) continue; // Skip empty products with no sales

          const forecast = calculateForecast(
            availableStock,
            sales,
            daysToAnalyze,
            daysToForecast,
            minSales
          );

          forecastItems.push({
            productId,
            productName,
            sku: product.sku,
            thumbnail,
            currentStock,
            reservedQuantity,
            availableStock,
            ...forecast
          });
        }
      }

      // Sort by days until stockout (null = infinite at the end)
      forecastItems.sort((a, b) => {
        if (a.daysUntilStockout === null && b.daysUntilStockout === null) return 0;
        if (a.daysUntilStockout === null) return 1;
        if (b.daysUntilStockout === null) return -1;
        return a.daysUntilStockout - b.daysUntilStockout;
      });

      // Calculate summary
      const summary: StockForecastSummary = {
        totalProducts: forecastItems.length,
        criticalCount: forecastItems.filter(i =>
          i.daysUntilStockout !== null && i.daysUntilStockout <= criticalThreshold
        ).length,
        warningCount: forecastItems.filter(i =>
          i.daysUntilStockout !== null &&
          i.daysUntilStockout > criticalThreshold &&
          i.daysUntilStockout <= criticalThreshold * 2
        ).length,
        noSalesCount: forecastItems.filter(i => i.daysUntilStockout === null).length,
        healthyCount: forecastItems.filter(i =>
          i.daysUntilStockout !== null && i.daysUntilStockout > criticalThreshold * 2
        ).length
      };

      const response: StockForecastResponse = {
        success: true,
        items: forecastItems,
        summary,
        analysisParams: {
          daysAnalyzed: daysToAnalyze,
          daysForecasted: daysToForecast,
          criticalThreshold
        }
      };

      // Store in cache
      setCache('forecast', cacheParams, response);

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error fetching stock forecast:', error);
      return NextResponse.json(
        { error: 'Lỗi khi lấy dữ liệu dự báo tồn kho' },
        { status: 500 }
      );
    }
  });
}

function calculateForecast(
  availableStock: number,
  sales: ProductSalesData | undefined,
  daysToAnalyze: number,
  daysToForecast: number,
  minSales: number
): {
  averageDailySales: number;
  daysUntilStockout: number | null;
  estimatedStockoutDate: string | null;
  salesTrend: 'increasing' | 'stable' | 'decreasing';
  reorderSuggestion: number;
  confidence: 'high' | 'medium' | 'low';
} {
  // No sales data
  if (!sales || sales.totalQuantity < minSales) {
    return {
      averageDailySales: 0,
      daysUntilStockout: null,
      estimatedStockoutDate: null,
      salesTrend: 'stable',
      reorderSuggestion: 0,
      confidence: 'low'
    };
  }

  // Calculate average daily sales
  const averageDailySales = sales.totalQuantity / daysToAnalyze;

  // Calculate days until stockout
  let daysUntilStockout: number | null = null;
  let estimatedStockoutDate: string | null = null;

  if (averageDailySales > 0 && availableStock > 0) {
    daysUntilStockout = Math.ceil(availableStock / averageDailySales);

    const stockoutDate = new Date();
    stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);
    estimatedStockoutDate = stockoutDate.toISOString();
  } else if (availableStock <= 0) {
    daysUntilStockout = 0;
    estimatedStockoutDate = new Date().toISOString();
  }

  // Calculate sales trend
  let salesTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (sales.recentSales > 0 && sales.olderSales > 0) {
    const trendRatio = sales.recentSales / sales.olderSales;
    if (trendRatio > 1.2) {
      salesTrend = 'increasing';
    } else if (trendRatio < 0.8) {
      salesTrend = 'decreasing';
    }
  }

  // Calculate reorder suggestion (enough for forecast period + buffer)
  const reorderSuggestion = Math.ceil(averageDailySales * daysToForecast * 1.2);

  // Determine confidence based on data availability
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (sales.orderCount >= 10) {
    confidence = 'high';
  } else if (sales.orderCount >= 3) {
    confidence = 'medium';
  }

  return {
    averageDailySales: Math.round(averageDailySales * 100) / 100,
    daysUntilStockout,
    estimatedStockoutDate,
    salesTrend,
    reorderSuggestion,
    confidence
  };
}

function formatVariantLabel(variant: { size?: string; color?: string }): string {
  const parts: string[] = [];
  if (variant.size) parts.push(variant.size);
  if (variant.color) parts.push(variant.color);
  return parts.join(' / ') || 'Default';
}
