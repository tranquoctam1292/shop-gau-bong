/**
 * Media Repository
 * 
 * Repository pattern for Media Library operations
 * 
 * Provides CRUD operations and query methods for media collection
 * 
 * @see docs/MEDIA_LIBRARY_IMPLEMENTATION_PLAN.md
 */

import { getCollections, ObjectId } from '@/lib/db';
import type { 
  MongoMedia, 
  MediaInput, 
  MediaUpdate, 
  MediaFilters, 
  MediaPagination,
  MediaListResponse 
} from '@/types/media';

/**
 * Create a new media document
 * 
 * @param mediaData - Media input data
 * @returns Created media document
 */
export async function createMedia(mediaData: MediaInput): Promise<MongoMedia> {
  const { media } = await getCollections();
  
  const now = new Date();
  const document: Omit<MongoMedia, '_id'> = {
    ...mediaData,
    createdAt: now,
    updatedAt: now,
  };

  const result = await media.insertOne(document);
  
  if (!result.insertedId) {
    throw new Error('Failed to create media document');
  }

  const created = await media.findOne({ _id: result.insertedId });
  if (!created) {
    throw new Error('Failed to retrieve created media document');
  }

  return created as MongoMedia;
}

/**
 * Get media by ID
 * 
 * @param id - Media ID (ObjectId string)
 * @returns Media document or null if not found
 */
export async function getMediaById(id: string): Promise<MongoMedia | null> {
  const { media } = await getCollections();
  
  try {
    const mediaDoc = await media.findOne({ _id: new ObjectId(id) });
    return mediaDoc as MongoMedia | null;
  } catch (error) {
    // Invalid ObjectId format
    return null;
  }
}

/**
 * Get media list with filters and pagination
 * 
 * @param filters - Filter options
 * @param pagination - Pagination options
 * @returns Media list with pagination info
 */
export async function getMediaList(
  filters: MediaFilters = {},
  pagination: MediaPagination = { page: 1, limit: 20 }
): Promise<MediaListResponse> {
  const { media } = await getCollections();
  
  const { page = 1, limit = 20, sort = 'newest' } = pagination;
  const skip = (page - 1) * limit;

  // Build query
  const query: any = {};

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.folder) {
    query.folder = filters.folder;
  }

  if (filters.uploadedBy) {
    query.uploadedBy = filters.uploadedBy instanceof ObjectId 
      ? filters.uploadedBy 
      : new ObjectId(filters.uploadedBy);
  }

  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) {
      query.createdAt.$gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      query.createdAt.$lte = filters.dateTo;
    }
  }

  if (filters.minSize || filters.maxSize) {
    query.size = {};
    if (filters.minSize) {
      query.size.$gte = filters.minSize;
    }
    if (filters.maxSize) {
      query.size.$lte = filters.maxSize;
    }
  }

  // Text search (if provided)
  if (filters.search && filters.search.trim()) {
    query.$text = { $search: filters.search.trim() };
  }

  // Build sort
  let sortOption: any = {};
  switch (sort) {
    case 'newest':
      sortOption = { createdAt: -1 };
      break;
    case 'oldest':
      sortOption = { createdAt: 1 };
      break;
    case 'name':
      sortOption = { name: 1 };
      break;
    case 'size':
      sortOption = { size: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  // If text search is used, sort by text score first
  if (filters.search && filters.search.trim()) {
    sortOption = { score: { $meta: 'textScore' }, ...sortOption };
  }

  // Execute query
  const [data, total] = await Promise.all([
    media
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray(),
    media.countDocuments(query),
  ]);

  const pages = Math.ceil(total / limit);

  return {
    data: data as MongoMedia[],
    pagination: {
      total,
      pages,
      page,
      limit,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Update media document
 * 
 * @param id - Media ID (ObjectId string)
 * @param updates - Update data
 * @returns Updated media document or null if not found
 */
export async function updateMedia(
  id: string,
  updates: MediaUpdate
): Promise<MongoMedia | null> {
  const { media } = await getCollections();
  
  try {
    const updateDoc: any = {
      ...updates,
      updatedAt: new Date(),
    };

    const result = await media.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    return result as MongoMedia | null;
  } catch (error) {
    // Invalid ObjectId format
    return null;
  }
}

/**
 * Delete media document
 * 
 * @param id - Media ID (ObjectId string)
 * @returns true if deleted, false if not found
 */
export async function deleteMedia(id: string): Promise<boolean> {
  const { media } = await getCollections();
  
  try {
    const result = await media.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  } catch (error) {
    // Invalid ObjectId format
    return false;
  }
}

/**
 * Search media with text query
 * 
 * @param query - Search query string
 * @param filters - Additional filters
 * @param pagination - Pagination options
 * @returns Media list with pagination info
 */
export async function searchMedia(
  query: string,
  filters: Omit<MediaFilters, 'search'> = {},
  pagination: MediaPagination = { page: 1, limit: 20 }
): Promise<MediaListResponse> {
  return getMediaList(
    { ...filters, search: query },
    pagination
  );
}

/**
 * Get media by URL
 * 
 * Useful for checking if a media already exists
 * 
 * @param url - Media URL
 * @returns Media document or null if not found
 */
export async function getMediaByUrl(url: string): Promise<MongoMedia | null> {
  const { media } = await getCollections();
  
  const mediaDoc = await media.findOne({ url });
  return mediaDoc as MongoMedia | null;
}

/**
 * Get media by path
 * 
 * Useful for checking if a media already exists by storage path
 * 
 * @param path - Media storage path
 * @returns Media document or null if not found
 */
export async function getMediaByPath(path: string): Promise<MongoMedia | null> {
  const { media } = await getCollections();
  
  const mediaDoc = await media.findOne({ path });
  return mediaDoc as MongoMedia | null;
}

/**
 * Count media by filters
 * 
 * @param filters - Filter options
 * @returns Total count
 */
export async function countMedia(filters: MediaFilters = {}): Promise<number> {
  const { media } = await getCollections();
  
  const query: any = {};

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.folder) {
    query.folder = filters.folder;
  }

  if (filters.uploadedBy) {
    query.uploadedBy = filters.uploadedBy instanceof ObjectId 
      ? filters.uploadedBy 
      : new ObjectId(filters.uploadedBy);
  }

  return media.countDocuments(query);
}
