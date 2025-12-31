/**
 * SEO Repository Tests
 *
 * Tests for seoRepository functions with mocked MongoDB
 * Note: Uses mock ObjectId to avoid ESM import issues with bson package
 */

// Define MockObjectId inside the mock factory to avoid hoisting issues
jest.mock('mongodb', () => {
  class MockObjectId {
    private id: string;

    constructor(id?: string) {
      this.id = id || 'a'.repeat(24);
    }

    toString() {
      return this.id;
    }

    static isValid(id: string): boolean {
      return typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);
    }
  }

  return { ObjectId: MockObjectId };
});

// Mock getCollections
const mockCollection = {
  findOne: jest.fn(),
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  insertOne: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
};

const mockDb = {
  collection: jest.fn(() => mockCollection),
};

jest.mock('@/lib/db', () => ({
  getCollections: jest.fn(() =>
    Promise.resolve({
      db: mockDb,
      products: mockCollection,
    })
  ),
}));

// Import after mocking
import {
  getSEOSettings,
  upsertSEOSettings,
  getRedirects,
  getRedirectById,
  getRedirectBySource,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  getEnabledRedirects,
  incrementRedirectHit,
} from '../seoRepository';

// Helper to create mock ID object
const createMockId = (id?: string) => ({ toString: () => id || 'a'.repeat(24) });
const validId = 'a'.repeat(24);

describe('seoRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSEOSettings', () => {
    it('should return null when no settings exist', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await getSEOSettings();

      expect(result).toBeNull();
      expect(mockDb.collection).toHaveBeenCalledWith('seoSettings');
    });

    it('should return mapped settings when exists', async () => {
      const mockDoc = {
        _id: createMockId(),
        titleTemplate: 'Test %title%',
        productTitleTemplate: 'Buy %title%',
        googleVerification: 'google123',
        organization: {
          name: 'Test Shop',
          url: 'https://test.com',
        },
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await getSEOSettings();

      expect(result).toBeDefined();
      expect(result?._id).toBe(mockDoc._id.toString());
      expect(result?.titleTemplate).toBe('Test %title%');
      expect(result?.googleVerification).toBe('google123');
    });

    it('should use default values for missing fields', async () => {
      const mockDoc = {
        _id: createMockId(),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await getSEOSettings();

      expect(result?.titleTemplate).toBe('%title% | %sitename%');
      expect(result?.productTitleTemplate).toBe('Mua %title% - %price% | %sitename%');
    });
  });

  describe('upsertSEOSettings', () => {
    it('should create new settings', async () => {
      const mockResult = {
        _id: createMockId(),
        titleTemplate: 'New Template',
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(mockResult);

      const result = await upsertSEOSettings({
        titleTemplate: 'New Template',
      });

      expect(result).toBeDefined();
      expect(result.titleTemplate).toBe('New Template');
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          $set: expect.objectContaining({
            titleTemplate: 'New Template',
          }),
        }),
        expect.objectContaining({
          upsert: true,
          returnDocument: 'after',
        })
      );
    });

    it('should include updatedBy when provided', async () => {
      const adminId = validId;
      const mockResult = {
        _id: createMockId(),
        titleTemplate: 'Test',
        updatedBy: createMockId(adminId),
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(mockResult);

      await upsertSEOSettings({ titleTemplate: 'Test' }, adminId);

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          $set: expect.objectContaining({
            updatedBy: expect.anything(),
          }),
        }),
        expect.any(Object)
      );
    });

    it('should throw error when update fails', async () => {
      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      await expect(upsertSEOSettings({ titleTemplate: 'Test' })).rejects.toThrow(
        'Failed to upsert SEO settings'
      );
    });
  });

  describe('getRedirects', () => {
    it('should return paginated redirects', async () => {
      const mockDocs = [
        {
          _id: createMockId('b'.repeat(24)),
          source: '/old-1',
          destination: '/new-1',
          type: 301,
          enabled: true,
          hitCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: createMockId('c'.repeat(24)),
          source: '/old-2',
          destination: '/new-2',
          type: 302,
          enabled: false,
          hitCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockDocs),
            }),
          }),
        }),
      });
      mockCollection.countDocuments.mockResolvedValue(2);

      const result = await getRedirects({ page: 1, perPage: 10 });

      expect(result.redirects.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.redirects[0].source).toBe('/old-1');
      expect(result.redirects[1].type).toBe(302);
    });

    it('should filter by search term', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockCollection.countDocuments.mockResolvedValue(0);

      await getRedirects({ page: 1, perPage: 10, search: 'test' });

      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            expect.objectContaining({ source: expect.any(Object) }),
            expect.objectContaining({ destination: expect.any(Object) }),
          ]),
        })
      );
    });

    it('should filter by enabled status', async () => {
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      mockCollection.countDocuments.mockResolvedValue(0);

      await getRedirects({ page: 1, perPage: 10, enabled: true });

      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        })
      );
    });
  });

  describe('getRedirectById', () => {
    it('should return redirect when found', async () => {
      const id = validId;
      const mockDoc = {
        _id: createMockId(id),
        source: '/old',
        destination: '/new',
        type: 301,
        enabled: true,
        hitCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await getRedirectById(id);

      expect(result).toBeDefined();
      expect(result?._id).toBe(id);
      expect(result?.source).toBe('/old');
    });

    it('should return null when not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await getRedirectById(validId);

      expect(result).toBeNull();
    });

    it('should return null for invalid ObjectId', async () => {
      const result = await getRedirectById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('getRedirectBySource', () => {
    it('should find redirect by source path', async () => {
      // Clear any previous mocks
      mockCollection.findOne.mockReset();

      const mockDoc = {
        _id: createMockId(),
        source: '/old-path',
        destination: '/new-path',
        type: 301,
        enabled: true,
        hitCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockDoc);

      const result = await getRedirectBySource('/old-path');

      expect(result).toBeDefined();
      expect(result?.source).toBe('/old-path');
      // Repository adds enabled: true to the query
      expect(mockCollection.findOne).toHaveBeenCalledWith({ source: '/old-path', enabled: true });
    });
  });

  describe('createRedirect', () => {
    it('should create a new redirect', async () => {
      const insertedId = createMockId('d'.repeat(24));
      const createdDoc = {
        _id: insertedId,
        source: '/from',
        destination: '/to',
        type: 301,
        enabled: true,
        hitCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock findOne calls:
      // 1. Check if source already exists (should return null)
      // 2. Check for redirect loop (should return null)
      // 3. Get created document
      mockCollection.findOne
        .mockResolvedValueOnce(null) // Check existing - not found
        .mockResolvedValueOnce(null) // Loop check - not found
        .mockResolvedValueOnce(createdDoc); // Get created document
      mockCollection.insertOne.mockResolvedValue({ insertedId });

      const result = await createRedirect({
        source: '/from',
        destination: '/to',
        type: 301,
        enabled: true,
      });

      expect(result).toBeDefined();
      expect(result.source).toBe('/from');
      expect(result.destination).toBe('/to');
    });
  });

  describe('updateRedirect', () => {
    it('should update existing redirect', async () => {
      // Reset mocks from previous tests
      mockCollection.findOne.mockReset();
      mockCollection.findOneAndUpdate.mockReset();

      const id = validId;
      const mockDoc = {
        _id: createMockId(id),
        source: '/updated-source',
        destination: '/updated-dest',
        type: 302,
        enabled: false,
        hitCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock findOne for duplicate check (returns null = no duplicate)
      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.findOneAndUpdate.mockResolvedValue(mockDoc);

      const result = await updateRedirect(id, {
        source: '/updated-source',
        destination: '/updated-dest',
        type: 302,
        enabled: false,
      });

      expect(result).toBeDefined();
      expect(result?.source).toBe('/updated-source');
      expect(result?.type).toBe(302);
    });

    it('should return null when not found', async () => {
      mockCollection.findOne.mockReset();
      mockCollection.findOneAndUpdate.mockReset();

      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      const result = await updateRedirect(validId, {
        source: '/test',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteRedirect', () => {
    it('should delete redirect and return true', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await deleteRedirect(validId);

      expect(result).toBe(true);
    });

    it('should return false when redirect not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await deleteRedirect(validId);

      expect(result).toBe(false);
    });

    it('should return false for invalid ObjectId', async () => {
      const result = await deleteRedirect('invalid');

      expect(result).toBe(false);
    });
  });

  describe('getEnabledRedirects', () => {
    it('should return only enabled redirects', async () => {
      const mockDocs = [
        {
          _id: createMockId(),
          source: '/enabled-1',
          destination: '/new-1',
          type: 301,
          enabled: true,
          hitCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Need to mock find().project().toArray() chain
      mockCollection.find.mockReturnValue({
        project: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockDocs),
        }),
      });

      const result = await getEnabledRedirects();

      expect(result.length).toBe(1);
      expect(result[0].source).toBe('/enabled-1');
      expect(mockCollection.find).toHaveBeenCalledWith({ enabled: true });
    });
  });

  describe('incrementRedirectHit', () => {
    it('should increment hit count by source path', async () => {
      mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await incrementRedirectHit('/old-path');

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { source: '/old-path' },
        {
          $inc: { hitCount: 1 },
          $set: { lastHitAt: expect.any(Date) },
        }
      );
    });
  });
});
