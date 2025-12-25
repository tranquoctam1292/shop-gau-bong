/**
 * Audit Log Retention Policy Cron Job
 * PHASE 3: Audit Log Filtering (7.12.8) - Retention policy
 * 
 * This endpoint should be called periodically (e.g., daily via cron-job.org, EasyCron, or Vercel Cron)
 * to delete old audit logs based on retention policy
 * 
 * Retention Policy: Delete logs older than 90 days (configurable via env var)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { withAuthAdmin } from '@/lib/middleware/authMiddleware';

export const dynamic = 'force-dynamic';

// Retention period in days (default: 90 days)
const RETENTION_DAYS = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90', 10);

/**
 * DELETE /api/admin/cron/audit-log-retention
 * Delete old audit logs based on retention policy
 * 
 * Protected route - requires authentication (can be called by cron job with API key or admin auth)
 */
export async function POST(request: NextRequest) {
  // Allow both authenticated admin users and cron jobs (with API key check)
  const authHeader = request.headers.get('authorization');
  const cronApiKey = process.env.CRON_API_KEY;
  
  // Check if request is from cron job with API key
  if (authHeader && cronApiKey && authHeader === `Bearer ${cronApiKey}`) {
    // Allow cron job access with API key
  } else {
    // Require admin authentication for manual calls
    return withAuthAdmin(request, async () => {
      return await deleteOldAuditLogs();
    });
  }
  
  return await deleteOldAuditLogs();
}

/**
 * Delete old audit logs
 */
async function deleteOldAuditLogs(): Promise<NextResponse> {
  try {
    const { adminActivityLogs } = await getCollections();
    
    // Calculate cutoff date (logs older than RETENTION_DAYS will be deleted)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    
    // Delete old logs
    const deleteResult = await adminActivityLogs.deleteMany({
      createdAt: { $lt: cutoffDate },
    });
    
    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays: RETENTION_DAYS,
    });
  } catch (error: unknown) {
    console.error('[Audit Log Retention] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete old audit logs';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

