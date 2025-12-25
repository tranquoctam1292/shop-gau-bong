/**
 * Audit Logger Utility
 * 
 * Logs all admin actions for security and compliance
 * Stores logs in admin_activity_logs collection
 */

import { NextRequest } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { AdminAction } from '@/types/admin';

/**
 * Get client IP address from request
 * 
 * @param request - NextRequest object
 * @returns IP address or undefined
 */
function getClientIP(request?: NextRequest): string | undefined {
  if (!request) {
    return undefined;
  }

  // Check various headers for IP (considering proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to connection remote address (if available)
  return undefined;
}

/**
 * Get user agent from request
 * 
 * @param request - NextRequest object
 * @returns User agent string or undefined
 */
function getUserAgent(request?: NextRequest): string | undefined {
  if (!request) {
    return undefined;
  }

  return request.headers.get('user-agent') || undefined;
}

/**
 * PHASE 3: Audit Log Deduplication (7.3.3)
 * Check for duplicate logs in logActivity (generic logging)
 * 
 * @param action - Admin action
 * @param adminId - Admin user ID
 * @param target_collection - Target collection
 * @param target_id - Target ID
 * @param mergeWindowMs - Time window in milliseconds (default: 5000ms = 5 seconds)
 * @returns Promise<{ shouldMerge: boolean; existingLogId?: ObjectId }>
 */
async function checkDuplicateLogActivity(
  action: AdminAction,
  adminId: string,
  target_collection?: string,
  target_id?: ObjectId,
  mergeWindowMs: number = 5000
): Promise<{ shouldMerge: boolean; existingLogId?: ObjectId }> {
  try {
    const { adminActivityLogs } = await getCollections();
    const now = new Date();
    const windowStart = new Date(now.getTime() - mergeWindowMs);

    // Build query for duplicate check
    const duplicateQuery: Record<string, unknown> = {
      admin_id: new ObjectId(adminId),
      action,
      createdAt: { $gte: windowStart, $lte: now },
    };

    if (target_collection) {
      duplicateQuery.target_collection = target_collection;
    }
    if (target_id) {
      duplicateQuery.target_id = target_id;
    }

    const existingLog = await adminActivityLogs.findOne(duplicateQuery, {
      sort: { createdAt: -1 }, // Get most recent
    });

    if (existingLog) {
      return { shouldMerge: true, existingLogId: existingLog._id };
    }

    return { shouldMerge: false };
  } catch (error) {
    console.error('[AuditLogger] Failed to check for duplicate log activity:', error);
    return { shouldMerge: false };
  }
}

/**
 * Log admin activity
 * PHASE 3: Audit Log Deduplication (7.3.3) - Now includes deduplication logic
 * 
 * @param action - Admin action (e.g., LOGIN, CREATE_USER, etc.)
 * @param adminId - Admin user ID (ObjectId as string)
 * @param metadata - Optional metadata (old/new values, additional info)
 * @param request - Optional NextRequest for IP and User-Agent extraction
 * @param mergeWindowMs - Time window in milliseconds to consider logs as duplicates (default: 5000ms = 5 seconds)
 * @returns Promise<void>
 */
export async function logActivity(
  action: AdminAction,
  adminId: string,
  metadata?: {
    target_collection?: string;
    target_id?: string | ObjectId;
    old_value?: unknown;
    new_value?: unknown;
    [key: string]: unknown;
  },
  request?: NextRequest,
  mergeWindowMs: number = 5000
): Promise<void> {
  try {
    const { adminActivityLogs } = await getCollections();

    // Extract metadata
    const { target_collection, target_id, ...restMetadata } = metadata || {};

    // Convert target_id to ObjectId if provided as string
    let targetIdObj: ObjectId | undefined;
    if (target_id) {
      targetIdObj = typeof target_id === 'string' ? new ObjectId(target_id) : target_id;
    }

    // PHASE 3: Audit Log Deduplication (7.3.3) - Check for duplicates
    const { shouldMerge, existingLogId } = await checkDuplicateLogActivity(
      action,
      adminId,
      target_collection,
      targetIdObj,
      mergeWindowMs
    );

    if (shouldMerge && existingLogId) {
      // Merge metadata into existing log
      const existingLog = await adminActivityLogs.findOne({ _id: existingLogId });
      if (existingLog) {
        const existingMetadata = (existingLog.metadata as Record<string, unknown>) || {};
        const mergedMetadata = { ...existingMetadata, ...restMetadata };
        
        await adminActivityLogs.updateOne(
          { _id: existingLogId },
          {
            $set: {
              metadata: mergedMetadata,
              updatedAt: new Date(), // Track when log was merged
            },
          }
        );
      }
      return; // Don't create new log, merged into existing
    }

    // Build log document
    const logDoc = {
      admin_id: new ObjectId(adminId),
      action,
      target_collection: target_collection || undefined,
      target_id: targetIdObj || undefined,
      metadata: Object.keys(restMetadata).length > 0 ? restMetadata : undefined,
      ip_address: getClientIP(request) || undefined,
      user_agent: getUserAgent(request) || undefined,
      createdAt: new Date(),
    };

    // Insert log (fire and forget - don't block on logging)
    await adminActivityLogs.insertOne(logDoc);
  } catch (error) {
    // Log error but don't throw - audit logging should not break the application
    // In production, you might want to send this to a separate error tracking service
    console.error('[AuditLogger] Failed to log activity:', error);
  }
}

/**
 * Get activity logs for a specific admin
 * 
 * @param adminId - Admin user ID
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Array of activity logs
 */
export async function getAdminActivityLogs(
  adminId: string,
  limit: number = 50
): Promise<unknown[]> {
  try {
    const { adminActivityLogs } = await getCollections();

    const logs = await adminActivityLogs
      .find({ admin_id: new ObjectId(adminId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return logs;
  } catch (error) {
    console.error('[AuditLogger] Failed to get activity logs:', error);
    return [];
  }
}

/**
 * Get activity logs by action type
 * 
 * @param action - Admin action type
 * @param limit - Maximum number of logs to return (default: 100)
 * @returns Array of activity logs
 */
export async function getActivityLogsByAction(
  action: AdminAction,
  limit: number = 100
): Promise<unknown[]> {
  try {
    const { adminActivityLogs } = await getCollections();

    const logs = await adminActivityLogs
      .find({ action })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return logs;
  } catch (error) {
    console.error('[AuditLogger] Failed to get activity logs by action:', error);
    return [];
  }
}

/**
 * PHASE 3: Audit Log Filtering (7.12.8) - Sensitive fields that should be filtered or masked
 */
const SENSITIVE_FIELDS = new Set([
  'costPrice', // Cost price - sensitive business data
  'password', // Product password - security sensitive
  // Add more sensitive fields as needed
]);

const MASKED_VALUE = '***'; // Masked value for sensitive data

/**
 * PHASE 3: Audit Log Filtering (7.12.8) - Filter sensitive fields from audit log data
 * 
 * @param data - Data object to filter
 * @returns Filtered data object with sensitive fields removed
 */
export function filterSensitiveFields(data: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive fields entirely (don't log them at all)
    if (SENSITIVE_FIELDS.has(key)) {
      continue;
    }
    
    // Recursively filter nested objects
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      filtered[key] = filterSensitiveFields(value as Record<string, unknown>);
    } else {
      filtered[key] = value;
    }
  }
  
  return filtered;
}

/**
 * PHASE 3: Audit Log Filtering (7.12.8) - Mask sensitive fields in audit log data
 * Use this when you want to log that a field was changed but mask its value
 * 
 * @param data - Data object to mask
 * @returns Masked data object with sensitive fields masked
 */
function maskSensitiveFields(data: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Mask sensitive fields (log that field was changed but hide value)
    if (SENSITIVE_FIELDS.has(key)) {
      masked[key] = MASKED_VALUE;
      continue;
    }
    
    // Recursively mask nested objects
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      masked[key] = maskSensitiveFields(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

/**
 * Audit Log Data Interface for Product Quick Update
 * Used specifically for product quick edit feature
 */
export interface AuditLogData {
  admin_id: string; // Admin user ID (matches existing schema)
  action: string;
  target_collection: string; // e.g., 'products'
  target_id: string; // Product ID
  details: {
    oldValues?: Record<string, unknown>;
    changes: Record<string, unknown>;
  };
  ip_address?: string;
  user_agent?: string;
}

/**
 * Get activity logs for a specific product
 * 
 * @param productId - Product ID (ObjectId as string)
 * @param limit - Maximum number of logs to return (default: 50)
 * @param page - Page number for pagination (default: 1)
 * @returns Object with logs array, total count, and pagination info
 */
export async function getProductActivityLogs(
  productId: string,
  limit: number = 50,
  page: number = 1
): Promise<{
  logs: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    const { adminActivityLogs } = await getCollections();
    const productIdObj = new ObjectId(productId);
    const skip = (page - 1) * limit;

    // Query logs for this product
    const query = {
      target_collection: 'products',
      target_id: productIdObj,
    };

    // Get total count
    const total = await adminActivityLogs.countDocuments(query);

    // Get logs with pagination
    const logs = await adminActivityLogs
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('[AuditLogger] Failed to get product activity logs:', error);
    return {
      logs: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 0,
    };
  }
}

/**
 * PHASE 3: Audit Log Deduplication (7.3.3)
 * Check for duplicate logs and merge if found
 * 
 * @param data - Audit log data
 * @param mergeWindowMs - Time window in milliseconds to consider logs as duplicates (default: 5000ms = 5 seconds)
 * @returns Promise<void>
 */
async function checkAndMergeDuplicateLog(
  data: AuditLogData,
  mergeWindowMs: number = 5000
): Promise<{ shouldMerge: boolean; existingLogId?: ObjectId }> {
  try {
    const { adminActivityLogs } = await getCollections();
    const now = new Date();
    const windowStart = new Date(now.getTime() - mergeWindowMs);

    // Find recent logs with same action, target, and user
    const duplicateQuery = {
      admin_id: new ObjectId(data.admin_id),
      action: data.action,
      target_collection: data.target_collection,
      target_id: new ObjectId(data.target_id),
      createdAt: { $gte: windowStart, $lte: now },
    };

    const existingLog = await adminActivityLogs.findOne(duplicateQuery, {
      sort: { createdAt: -1 }, // Get most recent
    });

    if (existingLog) {
      return { shouldMerge: true, existingLogId: existingLog._id };
    }

    return { shouldMerge: false };
  } catch (error) {
    // If check fails, proceed with new log creation
    console.error('[AuditLogger] Failed to check for duplicate log:', error);
    return { shouldMerge: false };
  }
}

/**
 * Merge changes from new log into existing log
 * 
 * @param existingLogId - ID of existing log to merge into
 * @param newChanges - New changes to merge
 * @returns Promise<void>
 */
async function mergeAuditLog(
  existingLogId: ObjectId,
  newChanges: Record<string, unknown>
): Promise<void> {
  try {
    const { adminActivityLogs } = await getCollections();
    
    // Get existing log
    const existingLog = await adminActivityLogs.findOne({ _id: existingLogId });
    if (!existingLog) {
      return; // Log not found, skip merge
    }

    // Merge changes: combine old and new changes
    const existingDetails = (existingLog.details as { changes?: Record<string, unknown> }) || {};
    const existingChanges = existingDetails.changes || {};
    const mergedChanges = { ...existingChanges, ...newChanges };

    // Update existing log with merged changes
    await adminActivityLogs.updateOne(
      { _id: existingLogId },
      {
        $set: {
          'details.changes': mergedChanges,
          updatedAt: new Date(), // Track when log was merged
        },
      }
    );
  } catch (error) {
    console.error('[AuditLogger] Failed to merge audit log:', error);
  }
}

/**
 * Create audit log for product quick update
 * PHASE 3: Audit Log Deduplication (7.3.3) - Now includes deduplication logic
 * 
 * @param data - Audit log data
 * @param mergeWindowMs - Time window in milliseconds to consider logs as duplicates (default: 5000ms = 5 seconds)
 * @returns Promise<void>
 */
export async function createAuditLog(
  data: AuditLogData,
  mergeWindowMs: number = 5000
): Promise<void> {
  try {
    const { adminActivityLogs } = await getCollections();

    // PHASE 3: Audit Log Deduplication (7.3.3) - Check for duplicates
    const { shouldMerge, existingLogId } = await checkAndMergeDuplicateLog(data, mergeWindowMs);

    if (shouldMerge && existingLogId) {
      // Merge changes into existing log
      await mergeAuditLog(existingLogId, data.details.changes);
      return; // Don't create new log, merged into existing
    }

    // PHASE 3: Audit Log Filtering (7.12.8) - Filter and mask sensitive fields
    const filteredDetails = {
      oldValues: data.details.oldValues ? filterSensitiveFields(data.details.oldValues) : undefined,
      changes: data.details.changes ? filterSensitiveFields(data.details.changes) : undefined,
    };

    // No duplicate found, create new log
    await adminActivityLogs.insertOne({
      admin_id: new ObjectId(data.admin_id),
      action: data.action,
      target_collection: data.target_collection,
      target_id: new ObjectId(data.target_id),
      details: filteredDetails,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      createdAt: new Date(), // Matches existing schema
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the application
    console.error('[AuditLogger] Failed to create audit log:', error);
  }
}
