/**
 * Image Processing Service
 * 
 * Image processing utilities using Sharp
 * 
 * Features:
 * - Resize images (if > max dimensions)
 * - Optimize images (compression)
 * - Generate thumbnails
 * - Get image metadata
 * - Convert to WebP (optional)
 * 
 * @see docs/MEDIA_LIBRARY_IMPLEMENTATION_PLAN.md
 * 
 * NOTE: Requires 'sharp' package to be installed:
 * npm install sharp
 */

import sharp from 'sharp';

/**
 * Image Metadata
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
  orientation?: number;
}

/**
 * Resize Image Options
 */
export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  withoutEnlargement?: boolean;
}

/**
 * Optimize Image Options
 */
export interface OptimizeOptions {
  quality?: number; // 1-100, default: 85
  format?: 'jpeg' | 'png' | 'webp';
  progressive?: boolean; // For JPEG
}

/**
 * Resize image if it exceeds max dimensions
 * 
 * @param buffer - Image buffer
 * @param maxWidth - Maximum width (default: 2500)
 * @param maxHeight - Maximum height (default: 2500)
 * @returns Resized image buffer
 */
export async function resizeImage(
  buffer: Buffer,
  maxWidth: number = 2500,
  maxHeight: number = 2500,
  options: ResizeOptions = {}
): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // If image is smaller than max dimensions, return original
    if (width <= maxWidth && height <= maxHeight) {
      return buffer;
    }

    // Calculate new dimensions maintaining aspect ratio
    let newWidth = width;
    let newHeight = height;

    if (width > maxWidth) {
      newWidth = maxWidth;
      newHeight = Math.round((height * maxWidth) / width);
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round((width * maxHeight) / height);
    }

    // Resize image
    return await image
      .resize(newWidth, newHeight, {
        fit: options.fit || 'inside',
        withoutEnlargement: options.withoutEnlargement ?? true,
      })
      .toBuffer();
  } catch (error) {
    console.error('Error resizing image:', error);
    throw new Error('Failed to resize image');
  }
}

/**
 * Optimize image (compress)
 * 
 * @param buffer - Image buffer
 * @param quality - Quality 1-100 (default: 85)
 * @param format - Output format (default: auto-detect)
 * @returns Optimized image buffer
 */
export async function optimizeImage(
  buffer: Buffer,
  quality: number = 85,
  options: OptimizeOptions = {}
): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const format = options.format || (metadata.format as 'jpeg' | 'png' | 'webp') || 'jpeg';

    // Clamp quality between 1-100
    const clampedQuality = Math.max(1, Math.min(100, quality));

    switch (format) {
      case 'jpeg':
        return await image
          .jpeg({
            quality: clampedQuality,
            progressive: options.progressive ?? true,
            mozjpeg: true, // Better compression
          })
          .toBuffer();

      case 'png':
        return await image
          .png({
            quality: clampedQuality,
            compressionLevel: 9, // Max compression
          })
          .toBuffer();

      case 'webp':
        return await image
          .webp({
            quality: clampedQuality,
          })
          .toBuffer();

      default:
        // If format not supported, return original
        return buffer;
    }
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw new Error('Failed to optimize image');
  }
}

/**
 * Generate thumbnail
 * 
 * @param buffer - Image buffer
 * @param size - Thumbnail size (default: 200x200)
 * @returns Thumbnail buffer
 */
export async function generateThumbnail(
  buffer: Buffer,
  size: number = 200
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

/**
 * Get image metadata
 * 
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
      hasAlpha: metadata.hasAlpha || false,
      orientation: metadata.orientation,
    };
  } catch (error) {
    console.error('Error getting image metadata:', error);
    throw new Error('Failed to get image metadata');
  }
}

/**
 * Convert image to WebP format
 * 
 * @param buffer - Image buffer
 * @param quality - Quality 1-100 (default: 85)
 * @returns WebP image buffer
 */
export async function convertToWebP(
  buffer: Buffer,
  quality: number = 85
): Promise<Buffer> {
  try {
    const clampedQuality = Math.max(1, Math.min(100, quality));

    return await sharp(buffer)
      .webp({
        quality: clampedQuality,
      })
      .toBuffer();
  } catch (error) {
    console.error('Error converting to WebP:', error);
    throw new Error('Failed to convert image to WebP');
  }
}

/**
 * Process image: resize + optimize
 * 
 * Convenience function that combines resize and optimize
 * 
 * @param buffer - Image buffer
 * @param maxWidth - Maximum width (default: 2500)
 * @param maxHeight - Maximum height (default: 2500)
 * @param quality - Quality 1-100 (default: 85)
 * @returns Processed image buffer
 */
export async function processImage(
  buffer: Buffer,
  maxWidth: number = 2500,
  maxHeight: number = 2500,
  quality: number = 85
): Promise<Buffer> {
  try {
    // First resize if needed
    const resized = await resizeImage(buffer, maxWidth, maxHeight);
    
    // Then optimize
    const optimized = await optimizeImage(resized, quality);
    
    return optimized;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Check if buffer is a valid image
 * 
 * @param buffer - Buffer to check
 * @returns true if valid image, false otherwise
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    await sharp(buffer).metadata();
    return true;
  } catch {
    return false;
  }
}
