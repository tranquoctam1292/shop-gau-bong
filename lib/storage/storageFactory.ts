/**
 * Storage Factory
 * 
 * Factory function to get the appropriate storage service
 * 
 * Determines which storage service to use based on environment variables
 * 
 * @see docs/MEDIA_LIBRARY_IMPLEMENTATION_PLAN.md
 */

import type { IStorageService } from './StorageService';
import { VercelBlobStorageService } from './VercelBlobStorageService';
import { LocalStorageService } from './LocalStorageService';

/**
 * Get storage service instance
 * 
 * Uses STORAGE_TYPE environment variable to determine which service to use:
 * - 'local' -> LocalStorageService (for development)
 * - 'vercel' or default -> VercelBlobStorageService (for production)
 * 
 * @returns Storage service instance
 */
export function getStorageService(): IStorageService {
  const storageType = process.env.STORAGE_TYPE || 'vercel';

  switch (storageType.toLowerCase()) {
    case 'local':
      return new LocalStorageService();
    
    case 'vercel':
    default:
      return new VercelBlobStorageService();
  }
}

/**
 * Get storage service singleton instance
 * 
 * Caches the instance to avoid creating multiple instances
 */
let storageServiceInstance: IStorageService | null = null;

export function getStorageServiceSingleton(): IStorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = getStorageService();
  }
  return storageServiceInstance;
}
