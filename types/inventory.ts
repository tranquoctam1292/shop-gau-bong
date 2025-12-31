/**
 * Inventory Module Types
 * Dinh nghia cac types cho module quan ly kho
 */

import { ObjectId } from 'mongodb';

// ============================================
// Stock Status & Movement Types
// ============================================

export type StockStatus = 'instock' | 'outofstock' | 'onbackorder';

export type MovementType = 'in' | 'out' | 'adjustment' | 'reservation' | 'release';

export type MovementReferenceType = 'order' | 'return' | 'manual' | 'import' | 'damage' | 'correction';

export type AdjustmentType = 'manual' | 'order' | 'return' | 'damage' | 'correction' | 'import';

export type AlertSeverity = 'warning' | 'critical' | 'out_of_stock';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

// ============================================
// Inventory Movement (Database Schema)
// ============================================

export interface InventoryMovement {
  _id: ObjectId;

  // Reference
  productId: ObjectId;
  variationId?: string;
  sku?: string;
  productName: string; // Snapshot at time of movement

  // Movement details
  type: MovementType;
  quantity: number; // Always positive
  direction: 1 | -1; // 1 = increase, -1 = decrease

  // Stock levels
  previousStock: number;
  newStock: number;
  previousReserved?: number;
  newReserved?: number;

  // Reference
  referenceType?: MovementReferenceType;
  referenceId?: string;

  // Metadata
  reason?: string;
  notes?: string;

  // Audit
  createdBy?: ObjectId; // Admin user ID
  createdByName?: string; // Snapshot
  createdAt: Date;
}

// ============================================
// Inventory Alert (Database Schema)
// ============================================

export interface InventoryAlert {
  _id: ObjectId;
  productId: ObjectId;
  variationId?: string;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock';
  threshold: number;
  currentStock: number;
  status: AlertStatus;
  acknowledgedBy?: ObjectId;
  acknowledgedAt?: Date;
  createdAt: Date;
  resolvedAt?: Date;
}

// ============================================
// API Request/Response Types
// ============================================

export interface InventoryAdjustment {
  productId: string;
  variationId?: string;
  quantity: number; // Positive = add, Negative = subtract
  type: AdjustmentType;
  reason?: string;
  referenceId?: string; // Order ID, Return ID, etc.
  adjustedBy: string; // Admin user ID
}

export interface InventoryMovementResult {
  _id: string;
  productId: string;
  variationId?: string;
  sku?: string;
  productName: string;
  type: MovementType;
  quantity: number;
  direction: 1 | -1;
  previousStock: number;
  newStock: number;
  referenceType?: MovementReferenceType;
  referenceId?: string;
  reason?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string; // ISO date string for API response
}

export interface InventoryFilters {
  search?: string;
  category?: string;
  stockStatus?: 'all' | 'low' | 'out' | 'in';
  page?: number;
  perPage?: number;
  sortBy?: 'stock' | 'name' | 'sku' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MovementFilters {
  productId?: string;
  variationId?: string;
  sku?: string;
  type?: MovementType;
  referenceType?: MovementReferenceType;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

// ============================================
// Inventory Overview Response
// ============================================

export interface InventoryItem {
  productId: string;
  productName: string;
  sku?: string;
  thumbnail?: string;
  type: 'simple' | 'variable';
  stockStatus: StockStatus;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold?: number;
  isLowStock: boolean;
  variants?: InventoryVariantItem[];
  updatedAt: string;
}

export interface InventoryVariantItem {
  variationId: string;
  sku?: string;
  size?: string;
  color?: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  isLowStock: boolean;
}

export interface InventorySummary {
  totalProducts: number;
  totalVariants: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue?: number;
}

export interface InventoryOverviewResponse {
  items: InventoryItem[];
  summary: InventorySummary;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Stock Alert Response
// ============================================

export interface StockAlertItem {
  productId: string;
  productName: string;
  sku?: string;
  thumbnail?: string;
  variationId?: string;
  variationLabel?: string;
  currentStock: number;
  threshold: number;
  severity: AlertSeverity;
}

export interface LowStockResponse {
  items: StockAlertItem[];
  total: number;
}

// ============================================
// Adjust Stock Response
// ============================================

export interface AdjustStockResponse {
  success: boolean;
  movement: InventoryMovementResult;
  newStock: number;
  newAvailable: number;
}

// ============================================
// Bulk Operations
// ============================================

export interface BulkAdjustmentItem {
  productId: string;
  variationId?: string;
  quantity: number;
  type: AdjustmentType;
  reason?: string;
}

export interface BulkAdjustmentResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    productId: string;
    variationId?: string;
    error: string;
  }>;
  movements: InventoryMovementResult[];
}

// ============================================
// Export/Import Types
// ============================================

export interface InventoryExportRow {
  productId: string;
  productName: string;
  sku: string;
  variationId?: string;
  size?: string;
  color?: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  stockStatus: StockStatus;
  lowStockThreshold?: number;
}

export interface InventoryImportRow {
  sku: string;
  stockQuantity: number;
  adjustmentType?: AdjustmentType;
  reason?: string;
}

export interface InventoryImportResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    row: number;
    sku: string;
    error: string;
  }>;
}

// ============================================
// Stock Forecast Types (Phase 2)
// ============================================

export interface StockForecastItem {
  productId: string;
  productName: string;
  sku?: string;
  thumbnail?: string;
  variationId?: string;
  variationLabel?: string;
  currentStock: number;
  reservedQuantity: number;
  availableStock: number;
  averageDailySales: number;
  daysUntilStockout: number | null; // null = infinite (no sales)
  estimatedStockoutDate: string | null; // ISO date string
  salesTrend: 'increasing' | 'stable' | 'decreasing';
  reorderSuggestion: number; // Suggested reorder quantity
  confidence: 'high' | 'medium' | 'low'; // Based on data availability
}

export interface StockForecastFilters {
  daysToAnalyze?: number; // Number of days to analyze for trends (default: 30)
  daysToForecast?: number; // Number of days to forecast ahead (default: 30)
  minSales?: number; // Minimum sales to include in forecast
  criticalThreshold?: number; // Days until stockout to flag as critical
}

export interface StockForecastSummary {
  totalProducts: number;
  criticalCount: number; // Products running out within threshold
  warningCount: number; // Products running out within 2x threshold
  noSalesCount: number; // Products with no recent sales
  healthyCount: number;
}

export interface StockForecastResponse {
  success: boolean;
  items: StockForecastItem[];
  summary: StockForecastSummary;
  analysisParams: {
    daysAnalyzed: number;
    daysForecasted: number;
    criticalThreshold: number;
  };
}
