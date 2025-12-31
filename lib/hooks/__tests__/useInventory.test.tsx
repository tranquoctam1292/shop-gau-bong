/**
 * useInventory Hooks Unit Tests
 *
 * Tests for useInventory, useLowStock, useInventoryMovements, useAdjustStock hooks
 *
 * Run with: npm test -- useInventory.test.tsx
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInventory, useLowStock, useInventoryMovements, useAdjustStock } from '../useInventory';
import React from 'react';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper component
function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useInventory Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // useInventory Tests
  // ============================================

  describe('useInventory', () => {
    const mockInventoryResponse = {
      items: [
        {
          productId: '123',
          productName: 'Test Product',
          sku: 'TEST-001',
          stockQuantity: 100,
          reservedQuantity: 10,
          availableQuantity: 90,
          isLowStock: false,
        },
      ],
      summary: {
        totalProducts: 1,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalStockValue: 0,
      },
      pagination: {
        page: 1,
        perPage: 20,
        total: 1,
        totalPages: 1,
      },
    };

    it('should fetch inventory with default filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInventoryResponse),
      });

      const { result } = renderHook(() => useInventory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/inventory'),
        expect.objectContaining({ credentials: 'include' })
      );
      expect(result.current.data?.items).toHaveLength(1);
    });

    it('should fetch inventory with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInventoryResponse),
      });

      const filters = {
        page: 2,
        perPage: 10,
        search: 'test',
        stockStatus: 'low' as const,
      };

      const { result } = renderHook(() => useInventory(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=10'),
        expect.any(Object)
      );
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const { result } = renderHook(() => useInventory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Unauthorized');
    });
  });

  // ============================================
  // useLowStock Tests
  // ============================================

  describe('useLowStock', () => {
    const mockLowStockResponse = {
      items: [
        {
          productId: '123',
          productName: 'Low Stock Product',
          sku: 'LOW-001',
          availableQuantity: 3,
          threshold: 10,
          severity: 'medium',
        },
      ],
      total: 1,
    };

    it('should fetch low stock items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLowStockResponse),
      });

      const { result } = renderHook(() => useLowStock(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/inventory/low-stock'),
        expect.objectContaining({ credentials: 'include' })
      );
      expect(result.current.data?.items).toHaveLength(1);
    });

    it('should use custom threshold', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLowStockResponse),
      });

      const { result } = renderHook(() => useLowStock(20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('threshold=20'),
        expect.any(Object)
      );
    });

    it('should exclude out of stock when specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLowStockResponse),
      });

      const { result } = renderHook(() => useLowStock(undefined, false), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('includeOutOfStock=false'),
        expect.any(Object)
      );
    });
  });

  // ============================================
  // useInventoryMovements Tests
  // ============================================

  describe('useInventoryMovements', () => {
    const mockMovementsResponse = {
      items: [
        {
          _id: '456',
          productId: '123',
          productName: 'Test Product',
          type: 'adjustment',
          quantity: 10,
          direction: 1,
          previousStock: 90,
          newStock: 100,
          reason: 'Test adjustment',
          createdAt: '2025-12-31T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      perPage: 20,
    };

    it('should fetch movements', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMovementsResponse),
      });

      const { result } = renderHook(() => useInventoryMovements(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/inventory/movements'),
        expect.objectContaining({ credentials: 'include' })
      );
    });

    it('should fetch movements with filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMovementsResponse),
      });

      const filters = {
        productId: '123',
        type: 'adjustment' as const,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
      };

      const { result } = renderHook(() => useInventoryMovements(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('productId=123'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('type=adjustment'),
        expect.any(Object)
      );
    });
  });

  // ============================================
  // useAdjustStock Tests
  // ============================================

  describe('useAdjustStock', () => {
    const mockAdjustResponse = {
      success: true,
      message: 'Stock adjusted successfully',
      newStock: 110,
      newAvailable: 100,
    };

    it('should adjust stock successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAdjustResponse),
      });

      const { result } = renderHook(() => useAdjustStock(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        productId: '123',
        quantity: 10,
        type: 'manual',
        reason: 'Test adjustment',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/inventory/adjust',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"productId":"123"'),
        })
      );
    });

    it('should handle adjust error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Not enough stock' }),
      });

      const { result } = renderHook(() => useAdjustStock(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        productId: '123',
        quantity: -100,
        type: 'damage',
        reason: 'Damaged goods',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Not enough stock');
    });

    it('should adjust variant stock', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAdjustResponse),
      });

      const { result } = renderHook(() => useAdjustStock(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        productId: '123',
        variationId: 'variant-456',
        quantity: 5,
        type: 'import',
        reason: 'Import new stock',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/inventory/adjust',
        expect.objectContaining({
          body: expect.stringContaining('"variationId":"variant-456"'),
        })
      );
    });
  });
});
