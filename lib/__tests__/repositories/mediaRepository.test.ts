/**
 * Media Repository Unit Tests
 * 
 * Tests for mediaRepository functions
 * 
 * Run with: npm test -- mediaRepository.test.ts
 */

import {
  createMedia,
  getMediaById,
  getMediaList,
  updateMedia,
  deleteMedia,
  searchMedia,
} from '@/lib/repositories/mediaRepository';
import { ObjectId } from '@/lib/db';
import type { MediaInput } from '@/types/media';

// Mock MongoDB collections
jest.mock('@/lib/db', () => ({
  getCollections: jest.fn(),
  ObjectId: jest.requireActual('mongodb').ObjectId,
}));

describe('Media Repository', () => {
  const mockMedia: MediaInput = {
    name: 'Test Image',
    filename: 'test-image.jpg',
    url: 'https://example.com/test-image.jpg',
    path: 'media/test-image.jpg',
    type: 'image',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    size: 102400,
    width: 1920,
    height: 1080,
    altText: 'Test image alt text',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMedia', () => {
    it('should create a new media document', async () => {
      const { getCollections } = require('@/lib/db');
      const mockCollection = {
        insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
        findOne: jest.fn().mockResolvedValue({
          _id: new ObjectId(),
          ...mockMedia,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      getCollections.mockResolvedValue({
        media: mockCollection,
      });

      const result = await createMedia(mockMedia);

      expect(mockCollection.insertOne).toHaveBeenCalled();
      expect(result).toHaveProperty('_id');
      expect(result.name).toBe(mockMedia.name);
    });
  });

  describe('getMediaById', () => {
    it('should get media by ID', async () => {
      const { getCollections } = require('@/lib/db');
      const mediaId = new ObjectId();
      const mockCollection = {
        findOne: jest.fn().mockResolvedValue({
          _id: mediaId,
          ...mockMedia,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      getCollections.mockResolvedValue({
        media: mockCollection,
      });

      const result = await getMediaById(mediaId.toString());

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: mediaId,
      });
      expect(result).not.toBeNull();
      expect(result?._id).toEqual(mediaId);
    });

    it('should return null for invalid ID', async () => {
      const { getCollections } = require('@/lib/db');
      const mockCollection = {
        findOne: jest.fn().mockRejectedValue(new Error('Invalid ObjectId')),
      };

      getCollections.mockResolvedValue({
        media: mockCollection,
      });

      const result = await getMediaById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('getMediaList', () => {
    it('should get media list with pagination', async () => {
      const { getCollections } = require('@/lib/db');
      const mockCollection = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([
                  {
                    _id: new ObjectId(),
                    ...mockMedia,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ]),
              }),
            }),
          }),
        }),
        countDocuments: jest.fn().mockResolvedValue(1),
      };

      getCollections.mockResolvedValue({
        media: mockCollection,
      });

      const result = await getMediaList({}, { page: 1, limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('updateMedia', () => {
    it('should update media metadata', async () => {
      const { getCollections } = require('@/lib/db');
      const mediaId = new ObjectId();
      const mockCollection = {
        findOneAndUpdate: jest.fn().mockResolvedValue({
          _id: mediaId,
          ...mockMedia,
          name: 'Updated Name',
          updatedAt: new Date(),
        }),
      };

      getCollections.mockResolvedValue({
        media: mockCollection,
      });

      const result = await updateMedia(mediaId.toString(), {
        name: 'Updated Name',
      });

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Name');
    });
  });

  describe('deleteMedia', () => {
    it('should delete media', async () => {
      const { getCollections } = require('@/lib/db');
      const mediaId = new ObjectId();
      const mockMediaDoc = {
        _id: mediaId,
        ...mockMedia,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(mockMediaDoc),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      };

      getCollections.mockResolvedValue({
        media: mockCollection,
      });

      const result = await deleteMedia(mediaId.toString());

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: mediaId,
      });
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: mediaId,
      });
      expect(result).toBe(true);
    });

    it('should return false if media not found', async () => {
      const { getCollections } = require('@/lib/db');
      const mediaId = new ObjectId();
      const mockCollection = {
        findOne: jest.fn().mockResolvedValue(null),
        deleteOne: jest.fn(),
      };

      getCollections.mockResolvedValue({
        media: mockCollection,
      });

      const result = await deleteMedia(mediaId.toString());

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: mediaId,
      });
      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
