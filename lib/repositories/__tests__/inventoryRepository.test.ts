/**
 * Inventory Repository Unit Tests
 *
 * Tests for inventoryRepository functions
 *
 * Run with: npm test -- inventoryRepository.test.ts
 */

// Mock mongodb module FIRST before any imports
jest.mock('mongodb', () => ({
  ObjectId: jest.fn().mockImplementation((id) => ({
    toString: () => id || '507f1f77bcf86cd799439011',
    toHexString: () => id || '507f1f77bcf86cd799439011',
  })),
  Collection: jest.fn(),
  WithId: jest.fn(),
  Document: jest.fn(),
}));

// Mock db module
jest.mock('@/lib/db', () => ({
  getCollections: jest.fn(),
}));

// Mock inventory utils
jest.mock('@/lib/utils/inventoryUtils', () => ({
  getManageStock: jest.fn().mockReturnValue(true),
  getProductStockQuantity: jest.fn().mockReturnValue(100),
  getProductReservedQuantity: jest.fn().mockReturnValue(10),
  getProductAvailableQuantity: jest.fn().mockReturnValue(90),
  getVariantStockQuantity: jest.fn().mockReturnValue(50),
  getVariantReservedQuantity: jest.fn().mockReturnValue(5),
  getVariantAvailableQuantity: jest.fn().mockReturnValue(45),
  getLowStockThreshold: jest.fn().mockReturnValue(10),
  isLowStock: jest.fn().mockReturnValue(false),
  isVariantLowStock: jest.fn().mockReturnValue(false),
  buildStockQuantityIncrement: jest.fn().mockReturnValue({ stockQuantity: 10 }),
  buildVariantStockIncrement: jest.fn().mockReturnValue({ 'variants.0.stockQuantity': 10 }),
  calculateStockStatus: jest.fn().mockReturnValue('instock'),
  buildStockStatusUpdate: jest.fn().mockReturnValue({ stockStatus: 'instock' }),
}));

import {
  getInventoryOverview,
  getMovements,
  getLowStockItems,
} from '@/lib/repositories/inventoryRepository';

// Create mock ObjectId-like object
const createMockId = (id: string) => ({
  toString: () => id,
  toHexString: () => id,
});

describe('Inventory Repository', () => {
  const mockProductId = createMockId('507f1f77bcf86cd799439011');
  const mockVariantId = 'variant-123';

  const mockProduct = {
    _id: mockProductId,
    name: 'Test Product',
    sku: 'TEST-001',
    stockQuantity: 100,
    reservedQuantity: 10,
    stockStatus: 'instock',
    status: 'publish',
    images: [{ src: 'https://example.com/image.jpg' }],
    updatedAt: new Date(),
  };

  const mockVariableProduct = {
    _id: createMockId('507f1f77bcf86cd799439012'),
    name: 'Variable Product',
    sku: 'VAR-001',
    status: 'publish',
    variants: [
      {
        id: mockVariantId,
        sku: 'VAR-001-S',
        size: 'S',
        color: 'Red',
        stockQuantity: 50,
        reservedQuantity: 5,
      },
      {
        id: 'variant-456',
        sku: 'VAR-001-M',
        size: 'M',
        color: 'Blue',
        stockQuantity: 30,
        reservedQuantity: 0,
      },
    ],
    updatedAt: new Date(),
  };

  const mockMovement = {
    _id: createMockId('507f1f77bcf86cd799439013'),
    productId: mockProductId,
    productName: 'Test Product',
    type: 'adjustment',
    quantity: 10,
    direction: 1,
    previousStock: 90,
    newStock: 100,
    referenceType: 'manual',
    reason: 'Test adjustment',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // getInventoryOverview Tests
  // ============================================

  describe('getInventoryOverview', () => {
    it('should return inventory overview with pagination', async () => {
      const { getCollections } = require('@/lib/db');
      const mockCollection = {
        countDocuments: jest.fn().mockResolvedValue(2),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          toArray: jest.fn().mockResolvedValue([mockProduct, mockVariableProduct]),
        }),
      };

      getCollections.mockResolvedValue({
        products: mockCollection,
      });

      const result = await getInventoryOverview({
        page: 1,
        perPage: 20,
        stockStatus: 'all',
      });

      expect(mockCollection.countDocuments).toHaveBeenCalled();
      expect(mockCollection.find).toHaveBeenCalled();
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.perPage).toBe(20);
    });

    it('should filter by search term', async () => {
      const { getCollections } = require('@/lib/db');
      const mockCollection = {
        countDocuments: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          toArray: jest.fn().mockResolvedValue([mockProduct]),
        }),
      };

      getCollections.mockResolvedValue({
        products: mockCollection,
      });

      await getInventoryOverview({
        search: 'TEST',
        page: 1,
        perPage: 20,
      });

      // Verify that find was called with search query
      const findCall = mockCollection.find.mock.calls[0][0];
      expect(findCall.$and).toBeDefined();
    });

    it('should handle empty results', async () => {
      const { getCollections } = require('@/lib/db');
      const mockCollection = {
        countDocuments: jest.fn().mockResolvedValue(0),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          toArray: jest.fn().mockResolvedValue([]),
        }),
      };

      getCollections.mockResolvedValue({
        products: mockCollection,
      });

      const result = await getInventoryOverview({});

      expect(result.items).toHaveLength(0);
      expect(result.summary.totalProducts).toBe(0);
    });
  });

  // ============================================
  // getMovements Tests
  // ============================================

  describe('getMovements', () => {
    it('should return movement history with pagination', async () => {
      const { getCollections } = require('@/lib/db');
      const mockCollection = {
        countDocuments: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          toArray: jest.fn().mockResolvedValue([mockMovement]),
        }),
      };

      getCollections.mockResolvedValue({
        inventoryMovements: mockCollection,
      });

      const result = await getMovements({
        page: 1,
        perPage: 20,
      });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toHaveProperty('_id');
      expect(result.items[0]).toHaveProperty('productName');
    });

    it('should filter by movement type', async () => {
      const { getCollections } = require('@/lib/db');
      const mockCollection = {
        countDocuments: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          toArray: jest.fn().mockResolvedValue([mockMovement]),
        }),
      };

      getCollections.mockResolvedValue({
        inventoryMovements: mockCollection,
      });

      await getMovements({
        type: 'adjustment',
      });

      const findCall = mockCollection.find.mock.calls[0][0];
      expect(findCall.type).toBe('adjustment');
    });

    it('should filter by date range', async () => {
      const { getCollections } = require('@/lib/db');
      const mockCollection = {
        countDocuments: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          toArray: jest.fn().mockResolvedValue([mockMovement]),
        }),
      };

      getCollections.mockResolvedValue({
        inventoryMovements: mockCollection,
      });

      await getMovements({
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
      });

      const findCall = mockCollection.find.mock.calls[0][0];
      expect(findCall.createdAt).toBeDefined();
      expect(findCall.createdAt.$gte).toBeDefined();
      expect(findCall.createdAt.$lte).toBeDefined();
    });
  });

  // ============================================
  // getLowStockItems Tests
  // ============================================

  describe('getLowStockItems', () => {
    it('should return low stock items', async () => {
      const { getCollections } = require('@/lib/db');

      // Reset mocks for this specific test
      const inventoryUtils = require('@/lib/utils/inventoryUtils');
      inventoryUtils.isLowStock.mockReturnValue(true);
      inventoryUtils.getProductAvailableQuantity.mockReturnValue(5);

      const mockCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockProduct]),
        }),
      };

      getCollections.mockResolvedValue({
        products: mockCollection,
      });

      const result = await getLowStockItems();

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
    });

    it('should use custom threshold', async () => {
      const { getCollections } = require('@/lib/db');
      const mockCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      };

      getCollections.mockResolvedValue({
        products: mockCollection,
      });

      await getLowStockItems(20);

      expect(mockCollection.find).toHaveBeenCalled();
    });

    it('should exclude out of stock when specified', async () => {
      const { getCollections } = require('@/lib/db');
      const mockCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      };

      getCollections.mockResolvedValue({
        products: mockCollection,
      });

      await getLowStockItems(undefined, false);

      expect(mockCollection.find).toHaveBeenCalled();
    });
  });
});
