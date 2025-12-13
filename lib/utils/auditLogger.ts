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
 * Log admin activity
 * 
 * @param action - Admin action (e.g., LOGIN, CREATE_USER, etc.)
 * @param adminId - Admin user ID (ObjectId as string)
 * @param metadata - Optional metadata (old/new values, additional info)
 * @param request - Optional NextRequest for IP and User-Agent extraction
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
  request?: NextRequest
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
