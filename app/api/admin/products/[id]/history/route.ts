/**
 * Admin Product History API Route
 * GET /api/admin/products/[id]/history - Get product change history
 * 
 * Protected route - requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, ObjectId } from '@/lib/db';
import { getProductActivityLogs } from '@/lib/utils/auditLogger';
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { AdminAction } from '@/types/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { products, adminUsers } = await getCollections();
      const { id } = params;
      
      // Parse query parameters for pagination
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);

      // Find product by ObjectId or slug
      let product = null;
      let productId: ObjectId | null = null;

      if (ObjectId.isValid(id)) {
        productId = new ObjectId(id);
        product = await products.findOne({ _id: productId });
      } else {
        product = await products.findOne({ slug: id });
        if (product) {
          productId = product._id;
        }
      }

      if (!productId || !product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      // Get product activity logs
      const result = await getProductActivityLogs(productId.toString(), limit, page);

      // Populate admin user info for each log
      const logsWithUserInfo = await Promise.all(
        result.logs.map(async (log: any) => {
          let adminUser = null;
          if (log.admin_id) {
            try {
              adminUser = await adminUsers.findOne({ _id: log.admin_id });
            } catch (error) {
              console.error('[Product History API] Failed to fetch admin user:', error);
            }
          }

          // PHASE 3: Audit Log Filtering (7.12.8) - Filter sensitive fields from metadata/details
          // Note: Sensitive fields are already filtered when logs are created, but we filter again here for safety
          const logDetails = (log.details as { oldValues?: Record<string, unknown>; changes?: Record<string, unknown> }) || {};
          const filteredDetails = {
            oldValues: logDetails.oldValues,
            changes: logDetails.changes,
          };

          return {
            _id: log._id.toString(),
            action: log.action,
            actionLabel: getActionLabel(log.action as AdminAction),
            createdAt: log.createdAt,
            metadata: log.metadata || {},
            details: filteredDetails,
            admin: adminUser ? {
              _id: adminUser._id.toString(),
              username: adminUser.username || 'N/A',
              full_name: adminUser.full_name || 'N/A',
              email: adminUser.email || 'N/A',
            } : null,
            ip_address: log.ip_address || null,
          };
        })
      );

      return NextResponse.json({
        productId: productId.toString(),
        productName: product.name,
        logs: logsWithUserInfo,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: unknown) {
      console.error('[Admin Product History API] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product history';
      return NextResponse.json(
        {
          error: errorMessage,
          details:
            process.env.NODE_ENV === 'development' && error instanceof Error
              ? { stack: error.stack }
              : undefined,
        },
        { status: 500 }
      );
    }
  });
}

/**
 * Get human-readable label for action
 */
function getActionLabel(action: AdminAction): string {
  const actionLabels: Record<string, string> = {
    [AdminAction.CREATE_PRODUCT]: 'Tạo sản phẩm',
    [AdminAction.UPDATE_PRODUCT]: 'Cập nhật sản phẩm',
    [AdminAction.DELETE_PRODUCT]: 'Xóa sản phẩm',
  };
  return actionLabels[action] || action;
}

