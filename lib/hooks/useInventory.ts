/**
 * useInventory Hook
 * Hook de lay danh sach ton kho voi filter va pagination
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  InventoryFilters,
  InventoryOverviewResponse,
  LowStockResponse,
  MovementFilters,
  InventoryMovementResult,
  StockForecastFilters,
  StockForecastResponse,
} from '@/types/inventory';

// ============================================
// Types
// ============================================

interface MovementsResponse {
  items: InventoryMovementResult[];
  total: number;
  page: number;
  perPage: number;
}

interface AdjustStockParams {
  productId: string;
  variationId?: string;
  quantity: number;
  type: 'manual' | 'damage' | 'correction' | 'return' | 'import';
  reason: string;
  referenceId?: string;
}

interface AdjustStockResponse {
  success: boolean;
  message: string;
  newStock: number;
  newAvailable: number;
}

// ============================================
// API Functions
// ============================================

async function fetchInventory(filters: InventoryFilters): Promise<InventoryOverviewResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('per_page', String(filters.perPage));
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.stockStatus) params.set('stockStatus', filters.stockStatus);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

  const response = await fetch(`/api/admin/inventory?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Loi khi lay du lieu ton kho');
  }

  return response.json();
}

async function fetchLowStock(threshold?: number, includeOutOfStock = true): Promise<LowStockResponse> {
  const params = new URLSearchParams();
  if (threshold !== undefined) params.set('threshold', String(threshold));
  params.set('includeOutOfStock', String(includeOutOfStock));

  const response = await fetch(`/api/admin/inventory/low-stock?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Loi khi lay danh sach ton kho thap');
  }

  return response.json();
}

async function fetchMovements(filters: MovementFilters): Promise<MovementsResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('per_page', String(filters.perPage));
  if (filters.productId) params.set('productId', filters.productId);
  if (filters.variationId) params.set('variationId', filters.variationId);
  if (filters.sku) params.set('sku', filters.sku);
  if (filters.type) params.set('type', filters.type);
  if (filters.referenceType) params.set('referenceType', filters.referenceType);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);

  const response = await fetch(`/api/admin/inventory/movements?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Loi khi lay lich su ton kho');
  }

  return response.json();
}

async function adjustStock(params: AdjustStockParams): Promise<AdjustStockResponse> {
  const response = await fetch('/api/admin/inventory/adjust', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Loi khi dieu chinh ton kho');
  }

  return response.json();
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch inventory overview
 */
export function useInventory(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => fetchInventory(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch low stock alerts
 */
export function useLowStock(threshold?: number, includeOutOfStock = true) {
  return useQuery({
    queryKey: ['inventory', 'low-stock', threshold, includeOutOfStock],
    queryFn: () => fetchLowStock(threshold, includeOutOfStock),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch inventory movements
 */
export function useInventoryMovements(filters: MovementFilters = {}) {
  return useQuery({
    queryKey: ['inventory', 'movements', filters],
    queryFn: () => fetchMovements(filters),
    staleTime: 30000,
  });
}

/**
 * Hook to adjust stock
 */
export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      // Invalidate inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      // Also invalidate products queries (stock may have changed)
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ============================================
// Stock History Types & Hook
// ============================================

interface StockHistoryPoint {
  date: string;
  totalIn: number;
  totalOut: number;
  netChange: number;
}

interface StockHistoryResponse {
  success: boolean;
  data: StockHistoryPoint[];
  summary: {
    totalIn: number;
    totalOut: number;
    netChange: number;
    movementCount: number;
  };
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

interface StockHistoryFilters {
  productId?: string;
  variationId?: string;
  days?: number;
  groupBy?: 'day' | 'week' | 'month';
}

async function fetchStockHistory(filters: StockHistoryFilters): Promise<StockHistoryResponse> {
  const params = new URLSearchParams();

  if (filters.productId) params.set('productId', filters.productId);
  if (filters.variationId) params.set('variationId', filters.variationId);
  if (filters.days) params.set('days', String(filters.days));
  if (filters.groupBy) params.set('groupBy', filters.groupBy);

  const url = `/api/admin/inventory/history${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch stock history');
  }

  return response.json();
}

/**
 * Hook to fetch stock history for charts
 */
export function useStockHistory(filters: StockHistoryFilters = {}) {
  return useQuery({
    queryKey: ['inventory', 'history', filters],
    queryFn: () => fetchStockHistory(filters),
    staleTime: 60000, // 1 minute
  });
}

// ============================================
// Stock Forecast Hook
// ============================================

async function fetchStockForecast(filters: StockForecastFilters): Promise<StockForecastResponse> {
  const params = new URLSearchParams();

  if (filters.daysToAnalyze) params.set('daysToAnalyze', String(filters.daysToAnalyze));
  if (filters.daysToForecast) params.set('daysToForecast', String(filters.daysToForecast));
  if (filters.criticalThreshold) params.set('criticalThreshold', String(filters.criticalThreshold));
  if (filters.minSales) params.set('minSales', String(filters.minSales));

  const url = `/api/admin/inventory/forecast${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, { credentials: 'include' });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch stock forecast');
  }

  return response.json();
}

/**
 * Hook to fetch stock forecast (predict stockout dates)
 */
export function useStockForecast(filters: StockForecastFilters = {}) {
  return useQuery({
    queryKey: ['inventory', 'forecast', filters],
    queryFn: () => fetchStockForecast(filters),
    staleTime: 300000, // 5 minutes (forecasts don't change frequently)
  });
}

// ============================================
// SKU-based Stock Adjustment
// ============================================

interface SkuLookupResult {
  found: boolean;
  productId?: string;
  variationId?: string;
  productName?: string;
  sku?: string;
  currentStock?: number;
  reservedQuantity?: number;
  availableStock?: number;
  error?: string;
}

interface AdjustBySkuParams {
  sku: string;
  quantity: number;
  type: 'manual' | 'damage' | 'correction' | 'return' | 'import';
  reason: string;
  referenceId?: string;
}

interface AdjustBySkuResponse {
  success: boolean;
  sku: string;
  productName?: string;
  message: string;
  newStock?: number;
}

async function lookupSku(sku: string): Promise<SkuLookupResult> {
  const response = await fetch(`/api/admin/inventory/adjust-by-sku?sku=${encodeURIComponent(sku)}`, {
    credentials: 'include',
  });

  const data = await response.json();
  return data;
}

async function adjustStockBySku(params: AdjustBySkuParams): Promise<AdjustBySkuResponse> {
  const response = await fetch('/api/admin/inventory/adjust-by-sku', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Loi khi dieu chinh ton kho');
  }

  return response.json();
}

/**
 * Hook to lookup product by SKU
 */
export function useSkuLookup(sku: string | null) {
  return useQuery({
    queryKey: ['inventory', 'sku-lookup', sku],
    queryFn: () => (sku ? lookupSku(sku) : Promise.resolve({ found: false })),
    enabled: !!sku,
    staleTime: 30000,
  });
}

/**
 * Hook to adjust stock by SKU
 */
export function useAdjustStockBySku() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adjustStockBySku,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
