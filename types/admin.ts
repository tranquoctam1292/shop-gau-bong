/**
 * Admin Account Management Types
 * 
 * TypeScript types for RBAC (Role-Based Access Control) system
 * Version: 1.2 (with token_version for token revocation)
 */

import { ObjectId } from 'mongodb';

/**
 * Admin Roles
 */
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  ORDER_MANAGER = 'ORDER_MANAGER',
  CONTENT_EDITOR = 'CONTENT_EDITOR',
  VIEWER = 'VIEWER',
}

/**
 * Permission Types
 * Format: {resource}:{action}
 */
export type Permission =
  // Product permissions
  | 'product:create'
  | 'product:read'
  | 'product:update'
  | 'product:delete'
  // Category permissions
  | 'category:read'
  | 'category:manage'
  // Order permissions
  | 'order:read'
  | 'order:update'
  | 'order:delete'
  // Customer permissions
  | 'customer:read'
  | 'customer:update'
  // Blog/Content permissions
  | 'blog:read'
  | 'blog:manage'
  | 'page:manage'
  // Media permissions
  | 'media:read'
  | 'media:upload'
  | 'media:delete'
  // Admin user management (SUPER_ADMIN only)
  | 'admin:manage'
  // Full access (SUPER_ADMIN)
  | '*';

/**
 * AdminUser MongoDB Document
 * Collection: admin_users
 */
export interface AdminUser {
  _id: ObjectId;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: AdminRole;
  permissions?: Permission[]; // Optional custom permissions (override role)
  is_active: boolean;
  must_change_password: boolean;
  token_version: number; // V1.2: For token revocation (increment to force logout all devices)
  last_login?: Date;
  created_by?: ObjectId; // Reference to AdminUser._id
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AdminUser without sensitive fields (for API responses)
 */
export interface AdminUserPublic {
  _id: string;
  username: string;
  email: string;
  full_name: string;
  role: AdminRole;
  permissions?: Permission[];
  is_active: boolean;
  must_change_password: boolean;
  last_login?: Date;
  created_by?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Admin Activity Log
 * Collection: admin_activity_logs
 */
export interface AdminActivityLog {
  _id: ObjectId;
  admin_id: ObjectId; // Reference to AdminUser._id
  action: AdminAction;
  target_collection?: string; // MongoDB collection name (e.g., 'products', 'orders')
  target_id?: ObjectId; // ID of the affected document
  metadata?: {
    // Store old/new values for audit trail
    old_value?: unknown;
    new_value?: unknown;
    [key: string]: unknown;
  };
  ip_address?: string;
  user_agent?: string;
  createdAt: Date;
}

/**
 * Admin Actions (for activity logging)
 */
export enum AdminAction {
  // Authentication actions
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGOUT_ALL_DEVICES = 'LOGOUT_ALL_DEVICES',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  // User management actions
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  RESET_PASSWORD = 'RESET_PASSWORD',
  FORCE_LOGOUT_USER = 'FORCE_LOGOUT_USER',
  // Product actions
  CREATE_PRODUCT = 'CREATE_PRODUCT',
  UPDATE_PRODUCT = 'UPDATE_PRODUCT',
  DELETE_PRODUCT = 'DELETE_PRODUCT',
  // Order actions
  CREATE_ORDER = 'CREATE_ORDER',
  UPDATE_ORDER = 'UPDATE_ORDER',
  DELETE_ORDER = 'DELETE_ORDER',
  // Category actions
  CREATE_CATEGORY = 'CREATE_CATEGORY',
  UPDATE_CATEGORY = 'UPDATE_CATEGORY',
  DELETE_CATEGORY = 'DELETE_CATEGORY',
  // Content actions
  CREATE_POST = 'CREATE_POST',
  UPDATE_POST = 'UPDATE_POST',
  DELETE_POST = 'DELETE_POST',
  // Media actions
  UPLOAD_MEDIA = 'UPLOAD_MEDIA',
  DELETE_MEDIA = 'DELETE_MEDIA',
}

/**
 * Create AdminUser input (for API requests)
 */
export interface CreateAdminUserInput {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: AdminRole;
  permissions?: Permission[];
  is_active?: boolean;
}

/**
 * Update AdminUser input (for API requests)
 */
export interface UpdateAdminUserInput {
  full_name?: string;
  role?: AdminRole;
  permissions?: Permission[];
  is_active?: boolean;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  success: boolean;
  user?: AdminUserPublic;
  requireChangePassword?: boolean;
  message?: string;
}
