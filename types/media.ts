/**
 * Media Library Type Definitions
 * 
 * Types for Media Library module in Custom CMS
 * 
 * @see docs/MEDIA_LIBRARY_IMPLEMENTATION_PLAN.md
 */

import { ObjectId } from 'mongodb';

/**
 * Media Type
 * 
 * Supported media types in the system
 */
export type MediaType = 'image' | 'video' | 'document' | 'other';

/**
 * MongoDB Media Document
 * 
 * Represents a media document in MongoDB collection 'media'
 */
export interface MongoMedia {
  _id: ObjectId;
  
  // Thông tin file cơ bản
  name: string;             // Tên hiển thị (editable)
  filename: string;         // Tên file gốc trên đĩa/cloud (ví dụ: img_123.jpg)
  url: string;              // Đường dẫn truy cập công khai (Public URL)
  path: string;             // Đường dẫn vật lý hoặc S3 Key (để xóa file)
  
  // Phân loại
  type: MediaType;          // Loại media
  mimeType: string;         // e.g., 'image/jpeg', 'video/mp4'
  extension: string;        // e.g., 'jpg', 'png'
  folder?: string;          // (Optional) Để phân cấp thư mục sau này
  
  // Metadata kỹ thuật
  size: number;             // Kích thước file (bytes)
  width?: number;           // Chỉ dành cho ảnh/video
  height?: number;          // Chỉ dành cho ảnh/video
  
  // Metadata SEO & Quản lý
  altText?: string;         // Thẻ alt cho SEO
  caption?: string;         // Chú thích ảnh
  description?: string;     // Mô tả chi tiết
  
  // System
  uploadedBy?: ObjectId;    // User ID người upload
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Media Input (for creation)
 * 
 * Used when creating a new media document
 */
export interface MediaInput {
  name: string;
  filename: string;
  url: string;
  path: string;
  type: MediaType;
  mimeType: string;
  extension: string;
  size: number;
  width?: number;
  height?: number;
  folder?: string;
  altText?: string;
  caption?: string;
  description?: string;
  uploadedBy?: ObjectId;
}

/**
 * Media Update (for updates)
 * 
 * Only updatable fields
 * 
 * Note: folder is NOT updatable to prevent broken links.
 * Moving files between folders would change URLs and break all existing references.
 */
export interface MediaUpdate {
  name?: string;
  altText?: string;
  caption?: string;
  description?: string;
  // folder?: string; // REMOVED: Not updatable to prevent broken links
}

/**
 * Media Sort Options
 */
export type MediaSort = 'newest' | 'oldest' | 'name' | 'size';

/**
 * Media Filter Options
 */
export interface MediaFilters {
  type?: MediaType;
  folder?: string;
  uploadedBy?: ObjectId;
  search?: string;          // Text search in name, altText
  dateFrom?: Date;
  dateTo?: Date;
  minSize?: number;
  maxSize?: number;
}

/**
 * Media Pagination Options
 */
export interface MediaPagination {
  page: number;
  limit: number;
  sort?: MediaSort;
}

/**
 * Media List Response
 */
export interface MediaListResponse {
  data: MongoMedia[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
